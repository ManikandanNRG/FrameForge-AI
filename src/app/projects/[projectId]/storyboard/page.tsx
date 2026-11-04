"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { Button } from "@/components/ui/button";
import { Badge, artifactStatusBadge } from "@/components/ui/badge";
import {
  ChevronRight, Sparkles, Upload, Check, Image as ImageIcon, Video,
  AlertCircle, Mic, MessageSquare, Volume2, Copy, CheckCheck, Download,
  ExternalLink, FileCode, User, ChevronDown, ChevronUp, X, Edit2, Save,
} from "lucide-react";

interface ShotMedia {
  id: string; kind: string; versionNumber: number; filename: string;
  storagePath: string; mimeType: string; approvalStatus: string;
  width?: number; height?: number; durationSeconds?: number; provenance: string;
  modelId?: string; providerId?: string;
}
interface Shot {
  id: string; shotNumber: number; actionDescription: string; shotSize?: string;
  imagePrompt?: string; videoPrompt?: string; approvalStatus: string;
  targetDurationSeconds: number; mediaVersions: ShotMedia[];
  voiceover?: string; dialogue?: string; audioPrompt?: string;
}
interface Scene { id: string; sceneNumber: number; heading: string; shots: Shot[]; }

function mediaUrl(p: string, versionId?: string) {
  const base = `/api/media/file?path=${encodeURIComponent(p)}`;
  return versionId ? `${base}&v=${versionId}` : base;
}

export default function StoryboardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const [scenes, setScenes]               = useState<Scene[]>([]);
  const [generating, setGenerating]       = useState(false);
  const [genImages, setGenImages]         = useState(false);
  const [genVideos, setGenVideos]         = useState(false);
  const [activeJobId, setActiveJobId]     = useState<string | null>(null);
  const [imageJobIds, setImageJobIds]     = useState<string[]>([]);
  const [videoJobIds, setVideoJobIds]     = useState<string[]>([]);
  const [error, setError]                 = useState<string | null>(null);
  const [selected, setSelected]           = useState<Shot | null>(null);
  const [bibleAssets, setBibleAssets]     = useState<any[]>([]);
  const [projectData, setProjectData]     = useState<any>(null);
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [charEditPrompt, setCharEditPrompt] = useState("");
  const [charEditVoice, setCharEditVoice] = useState("");
  const [charEditWardrobe, setCharEditWardrobe] = useState("");
  const [savingChar, setSavingChar]       = useState(false);
  const [showCharDetails, setShowCharDetails] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [importing, setImporting]         = useState<string | null>(null);
  const [imgProgress, setImgProgress]     = useState<{ done: number; total: number } | null>(null);
  const [vidProgress, setVidProgress]     = useState<{ done: number; total: number } | null>(null);
  const [promptTab, setPromptTab]         = useState<"flow" | "kling" | "chatgpt" | "gemini" | "video" | "script" | "json">("flow");
  const [activeMediaView, setActiveMediaView] = useState<"video" | "still">("video");
  const [copied, setCopied]               = useState<string | null>(null);
  const [isDragging, setIsDragging]       = useState(false);

  useEffect(() => {
    if (selected) {
      const hasVid = selected.mediaVersions.some(m => m.kind === "VIDEO_CLIP");
      setActiveMediaView(hasVid ? "video" : "still");
    }
  }, [selected?.id]);

  async function load() {
    const [shotsRes, bibleRes] = await Promise.all([
      fetch(`/api/projects/${projectId}/shots`),
      fetch(`/api/projects/${projectId}/bible`).catch(() => null),
    ]);
    const d = await shotsRes.json();
    setScenes(d.data?.scenes ?? []);
    if (d.data?.project) {
      setProjectData(d.data.project);
    }
    if (bibleRes && bibleRes.ok) {
      const bd = await bibleRes.json();
      setBibleAssets(bd.data?.assets ?? []);
    }
    // Refresh selected shot
    if (selected) {
      const allShots = (d.data?.scenes ?? []).flatMap((s: Scene) => s.shots);
      const fresh = allShots.find((sh: Shot) => sh.id === selected.id);
      if (fresh) setSelected(fresh);
    }
  }

  useEffect(() => { load(); }, [projectId]);

  // Poll shot-plan job
  useEffect(() => {
    if (!activeJobId) return;
    const t = setInterval(async () => {
      const r = await fetch(`/api/jobs/${activeJobId}`);
      const d = await r.json();
      const s = d.data?.job?.status;
      if (s === "SUCCEEDED") { clearInterval(t); setActiveJobId(null); load(); }
      if (s === "FAILED")    { clearInterval(t); setActiveJobId(null); setError(d.data?.job?.errorMessage ?? "Failed"); }
    }, 2000);
    return () => clearInterval(t);
  }, [activeJobId]);

  // Poll image generation jobs
  useEffect(() => {
    if (imageJobIds.length === 0) return;
    const t = setInterval(async () => {
      const results = await Promise.all(
        imageJobIds.map(id => fetch(`/api/jobs/${id}`).then(r => r.json())),
      );
      const statuses = results.map(d => d.data?.job?.status as string);
      const done = statuses.filter(s => s === "SUCCEEDED" || s === "FAILED").length;
      setImgProgress({ done, total: imageJobIds.length });
      if (done === imageJobIds.length) {
        clearInterval(t);
        setImageJobIds([]);
        setImgProgress(null);
        setGenImages(false);
        load();
      }
    }, 3000);
    return () => clearInterval(t);
  }, [imageJobIds]);

  // Poll video generation jobs
  useEffect(() => {
    if (videoJobIds.length === 0) return;
    const t = setInterval(async () => {
      const results = await Promise.all(
        videoJobIds.map(id => fetch(`/api/jobs/${id}`).then(r => r.json())),
      );
      const statuses = results.map(d => d.data?.job?.status as string);
      const done = statuses.filter(s => s === "SUCCEEDED" || s === "FAILED").length;
      setVidProgress({ done, total: videoJobIds.length });
      if (done === videoJobIds.length) {
        clearInterval(t);
        setVideoJobIds([]);
        setVidProgress(null);
        setGenVideos(false);
        load();
      }
    }, 5000);
    return () => clearInterval(t);
  }, [videoJobIds]);

  async function generateShotPlan(useMock = false) {
    setGenerating(true); setError(null);
    const r = await fetch(`/api/projects/${projectId}/shots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useMock }),
    });
    const d = await r.json();
    setGenerating(false);
    if (r.ok) setActiveJobId(d.data.jobId);
    else setError(d.error?.message ?? "Failed");
  }

  function playSpeechBrowser(text: string) {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    window.speechSynthesis.speak(utt);
  }

  async function generateImages() {
    setGenImages(true); setError(null);
    const r = await fetch(`/api/projects/${projectId}/shots/generate-images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true }),
    });
    const d = await r.json();
    if (r.ok) {
      if (d.data.queued === 0) { setGenImages(false); setError(d.data.message); return; }
      setImageJobIds(d.data.jobIds ?? []);
      setImgProgress({ done: 0, total: d.data.queued });
    } else {
      setGenImages(false);
      setError(d.error?.message ?? "Failed to start image generation");
    }
  }

  async function generateVideos(singleShotId?: string) {
    setGenVideos(true); setError(null);
    const r = await fetch(`/api/projects/${projectId}/shots/generate-videos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force: true, shotId: singleShotId, useLocalMotion: true }),
    });
    const d = await r.json();
    if (r.ok) {
      if (d.data.queued === 0) { setGenVideos(false); setError(d.data.message); return; }
      setVideoJobIds(d.data.jobIds ?? []);
      setVidProgress({ done: 0, total: d.data.queued });
    } else {
      setGenVideos(false);
      setError(d.error?.message ?? "Failed to start video generation");
    }
  }

  async function importMedia(shotId: string, file: File) {
    setImporting(shotId);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const r = await fetch(`/api/projects/${projectId}/shots/${shotId}/import`, { method: "POST", body: form });
    const d = await r.json();
    setImporting(null);
    if (r.ok) {
      load();
    } else {
      setError(d.error?.message ?? "Import failed");
    }
  }

  // Clipboard paste listener: if user copies image from ChatGPT/Gemini and presses Ctrl+V, auto-upload to selected shot
  useEffect(() => {
    if (!selected) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/") || items[i].type.startsWith("video/")) {
          const file = items[i].getAsFile();
          if (file) {
            importMedia(selected.id, file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [selected?.id]);

  function copyPrompt(text: string, tab: string) {
    navigator.clipboard.writeText(text);
    setCopied(tab);
    setTimeout(() => setCopied(null), 2000);
  }

  async function saveEditedCharacter(assetId: string) {
    setSavingChar(true);
    const existing = bibleAssets.find(a => a.id === assetId);
    let attr: any = {};
    try { attr = JSON.parse(existing?.attributes || "{}"); } catch {}
    
    attr.googleFlowCharacterPrompt = charEditPrompt;
    attr.voiceProfile = charEditVoice;
    attr.wardrobe = charEditWardrobe;

    await fetch(`/api/projects/${projectId}/assets/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: JSON.stringify(attr),
      }),
    });
    setSavingChar(false);
    setEditingCharId(null);
    load();
  }

  function startEditingCharacter(ca: any) {
    setEditingCharId(ca.id);
    let attr: any = {};
    try { attr = JSON.parse(ca.attributes || "{}"); } catch {}
    setCharEditPrompt(attr.googleFlowCharacterPrompt || ca.description || "");
    setCharEditVoice(attr.voiceProfile || "");
    setCharEditWardrobe(attr.wardrobe || "");
  }

  function exportAllPromptsJson() {
    const data = {
      projectId,
      exportedAt: new Date().toISOString(),
      scenes: scenes.map(sc => ({
        sceneNumber: sc.sceneNumber,
        heading: sc.heading,
        shots: sc.shots.map(sh => ({
          shotNumber: sh.shotNumber,
          shotSize: sh.shotSize,
          durationSeconds: sh.targetDurationSeconds,
          actionDescription: sh.actionDescription,
          imagePrompt: sh.imagePrompt,
          videoPrompt: sh.videoPrompt,
          dialogue: sh.dialogue,
          voiceover: sh.voiceover,
          audioPrompt: sh.audioPrompt,
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `film-prompts-${projectId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function approveShot(shotId: string) {
    await fetch(`/api/projects/${projectId}/shots/${shotId}/approve`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
    });
    load();
  }

  const allShots = scenes.flatMap(s => s.shots);
  const approvedCount     = allShots.filter(s => s.approvalStatus === "APPROVED").length;
  const hasImages         = allShots.some(s => s.mediaVersions.some(m => m.kind === "STORYBOARD_STILL"));
  const hasVideos         = allShots.some(s => s.mediaVersions.some(m => m.kind === "VIDEO_CLIP"));
  const selectedImage     = selected?.mediaVersions.find(m => m.kind === "STORYBOARD_STILL");
  const selectedVideo     = selected?.mediaVersions.find(m => m.kind === "VIDEO_CLIP");
  const selectedScene     = scenes.find(sc => sc.shots.some(sh => sh.id === selected?.id));

  // Derive primary character for the selected shot
  const characterAssets = bibleAssets.filter(a => a.assetType === "CHARACTER");

  const shotCharName = (selected as any)?.characterName ||
    ((selected as any)?.characterTag ? (selected as any).characterTag.replace(/^@/, "") : "");

  // Auto-detect which character is mentioned or featured in this shot
  const autoCharAsset = characterAssets.find(a =>
    (shotCharName && a.name.toLowerCase() === shotCharName.toLowerCase()) ||
    (selected && selected.actionDescription.toLowerCase().includes(a.name.toLowerCase())) ||
    (selected && selected.dialogue && selected.dialogue.toLowerCase().includes(a.name.toLowerCase()))
  ) || characterAssets[0];

  const activeCharAsset = (selectedCharacterId ? characterAssets.find(a => a.id === selectedCharacterId) : null) || autoCharAsset;

  const charName = activeCharAsset?.name || shotCharName || "Character";
  const charTag = `@${charName.replace(/[^a-zA-Z0-9]/g, "")}`;

  let charPrompt = "";
  let charVoiceProfile = "";
  let charAnchor = (selected as any)?.characterAnchor || "";
  let charAttrs: any = {};

  if (activeCharAsset) {
    try {
      charAttrs = JSON.parse(activeCharAsset.attributes || "{}");
      charPrompt = charAttrs.googleFlowCharacterPrompt || "";
      charVoiceProfile = charAttrs.voiceProfile || "";
      if (!charAnchor) charAnchor = charAttrs.consistencyAnchor || "";
    } catch {}
  }

  // Construct prompt strictly from the character's genuine identity — NEVER use generic male farmer fallback!
  if (!charPrompt) {
    const desc = activeCharAsset?.description || "expressive authentic character in natural cinematic lighting";
    const wardrobe = charAttrs.wardrobe || "traditional regional clothing";
    const demeanor = charAttrs.personality || "calm, grounded demeanor";
    const ageText = charAttrs.age ? `${charAttrs.age}-year-old ` : "";
    charPrompt = `Full portrait of ${charName}, a ${ageText}${desc}, wearing ${wardrobe}. Demeanor: ${demeanor}. 8k photorealistic documentary film still, soft natural daylight, neutral background.`;
  }

  if (!charVoiceProfile) {
    const textToScan = `${charName} ${charAttrs.role || ""} ${charAttrs.age || ""} ${activeCharAsset?.description || ""}`.toLowerCase();
    const isChild = charAttrs.age && (parseInt(charAttrs.age, 10) < 16 || charAttrs.age.includes("child") || charAttrs.age.includes("10") || textToScan.includes("granddaughter") || textToScan.includes("girl") || textToScan.includes("daughter"));
    const isFemale = textToScan.includes("girl") || textToScan.includes("woman") || textToScan.includes("female") || textToScan.includes("daughter") || textToScan.includes("granddaughter") || textToScan.includes("mother") || textToScan.includes("yazhini") || textToScan.includes("selvi");
    const isElder = textToScan.includes("elder") || textToScan.includes("aging") || textToScan.includes("70") || textToScan.includes("grandfather") || textToScan.includes("ayyanar") || textToScan.includes("old");

    if (isChild && isFemale) {
      charVoiceProfile = `Tamil Female Child (age ${charAttrs.age || "10"}), authentic rural South Indian Tamil accent, bright, energetic, and curious cadence.`;
    } else if (isChild && !isFemale) {
      charVoiceProfile = `Tamil Male Child (age ${charAttrs.age || "10"}), authentic rural South Indian Tamil accent, natural energetic youthful tone.`;
    } else if (isElder && !isFemale) {
      charVoiceProfile = `Elderly Tamil Male (age ${charAttrs.age || "70s"}), authentic rural South Indian Tamil accent, deep weathered baritone, calm, spiritual, and grandfatherly tone.`;
    } else if (isFemale) {
      charVoiceProfile = `Tamil Female (age ${charAttrs.age || "30s"}), authentic rural South Indian Tamil accent, warm, expressive, and grounded tone.`;
    } else {
      charVoiceProfile = `Tamil Male (age ${charAttrs.age || "40s"}), authentic rural South Indian Tamil accent, warm grounded tone, natural cadence.`;
    }
  }

  if (!charAnchor) {
    charAnchor = `${charName}: ${activeCharAsset?.description || "authentic character"}. Wardrobe: ${charAttrs.wardrobe || "traditional"}.`;
  }

  // Format orientation based on project settings
  const orientationLabel = projectData?.aspectRatio === "PORTRAIT_9_16"
    ? "9:16 Vertical / Portrait (1080x1920) - Mobile Fullscreen"
    : projectData?.aspectRatio === "SQUARE_1_1"
    ? "1:1 Square (1080x1080)"
    : "16:9 Landscape (1920x1080) - Cinematic Film";

  const targetDurationLabel = `${selected?.targetDurationSeconds || 5} seconds`;

  // Bracketed character tag placeholder: [@Ayyanar] or [@Yazhini]
  const bracketedCharTag = `[@${charName.replace(/[^a-zA-Z0-9]/g, "")}]`;

  // Convert character name in action to bracketed tag [@CharacterName]
  let taggedAction = selected?.actionDescription || "";
  if (taggedAction.includes(bracketedCharTag)) {
    // already bracketed
  } else if (taggedAction.includes(`@${charName}`)) {
    taggedAction = taggedAction.replace(new RegExp(`@${charName}\\b`, "g"), bracketedCharTag);
  } else {
    const charRegex = new RegExp(`\\b${charName}\\b`, "i");
    if (charRegex.test(taggedAction)) {
      taggedAction = taggedAction.replace(charRegex, bracketedCharTag);
    } else {
      taggedAction = `${bracketedCharTag} ${taggedAction}`;
    }
  }

  // Convert dialogue to bracketed format: [@CharacterName] speaks: "..."
  let formattedDialogue = selected?.dialogue || "";
  if (formattedDialogue) {
    characterAssets.forEach(ca => {
      const bTag = `[@${ca.name.replace(/[^a-zA-Z0-9]/g, "")}]`;
      formattedDialogue = formattedDialogue
        .replace(new RegExp(`^${ca.name}:`, "gi"), `${bTag} speaks:`)
        .replace(new RegExp(`@${ca.name}\\s+speaks:`, "gi"), `${bTag} speaks:`)
        .replace(new RegExp(`\\b${ca.name}:`, "gi"), `${bTag} speaks:`);
    });
    if (!formattedDialogue.includes("[@") && !formattedDialogue.includes("@")) {
      formattedDialogue = `${bracketedCharTag} speaks: ${formattedDialogue}`;
    }
  }

  const cameraMotion = selected?.videoPrompt || "Subtle cinematic handheld camera motion at 24fps with natural float";

  const googleFlowPrompt = selected ? [
    taggedAction,
    "",
    `[PRODUCTION SPECS]:`,
    `- Target Duration: ${targetDurationLabel}`,
    `- Aspect Ratio & Orientation: ${orientationLabel}`,
    `- Camera Framing & Lens: ${selected.shotSize ? `${selected.shotSize} Shot` : "Medium Shot"}, 35mm lens, 24fps motion blur`,
    `- Camera Movement & Dynamics: ${cameraMotion}`,
    `- Lighting: Natural daylight, soft golden illumination, realistic shadows, documentary realism`,
    "",
    `[AUDIO & SCRIPT]:`,
    formattedDialogue ? `- Spoken Dialogue: ${formattedDialogue}` : null,
    selected.voiceover ? `- Voice-Over (Narrator): "${selected.voiceover}"` : null,
    selected.audioPrompt ? `- Audio Atmosphere & Foley: ${selected.audioPrompt}` : null,
    "",
    `[VISUAL STYLE & RENDERING]:`,
    `- Visual Style: 4K photorealistic cinematic documentary film, 35mm lens, authentic cultural textures, shallow depth of field, 24fps`,
    `- Negative Constraints: Avoid 3D render, CGI, cartoon, anime, plastic skin, morphing, multiple limbs, distorted hands, modern western faces, jittery camera motion, blur.`,
  ].filter(line => line !== null && line !== undefined).join("\n").replace(/\n{3,}/g, "\n\n") : "";

  const characterAnchor = charAnchor;

  const klingPrompt = selected ? [
    `Cinematic film clip of ${characterAnchor}.`,
    `Action & Dynamics: ${selected.videoPrompt || selected.actionDescription}.`,
    selected.shotSize ? `Shot framing: ${selected.shotSize}.` : "Medium shot.",
    `Environment: ${selectedScene?.heading || "Rural village fields"}.`,
    `Lighting & Style: Photorealistic 8K, cinematic natural daylight, 35mm lens, smooth organic camera motion, 24fps. No CGI, no cartoon, authentic character consistency.`,
  ].filter(Boolean).join(" ") : "";

  const chatgptPrompt = selected ? [
    `Create a cinematic 16:9 widescreen photorealistic film still.`,
    `Character & Subject: ${characterAnchor}.`,
    `Action: ${selected.imagePrompt || selected.actionDescription}.`,
    selected.shotSize ? `Framing: ${selected.shotSize} shot.` : "",
    selected.voiceover ? `Narrative Story Beat (VO): "${selected.voiceover}".` : "",
    selected.dialogue ? `Character Dialogue: ${selected.dialogue}.` : "",
    `Style: Photorealistic 8k, authentic human skin texture, natural cinematic daylight, highly detailed documentary aesthetic.`,
    `Negative constraints: Avoid cartoon, 3d render, anime, over-saturated, fake plastic skin, western generic face.`,
    selected.videoPrompt ? `Action/Motion context: ${selected.videoPrompt}` : "",
  ].filter(Boolean).join(" ") : "";

  const geminiPrompt = selected ? [
    `Cinematic 16:9 photorealistic film still.`,
    `Subject: ${characterAnchor}.`,
    `Visual: ${selected.imagePrompt || selected.actionDescription}.`,
    selected.shotSize ? `Camera Framing: ${selected.shotSize}.` : "",
    selected.voiceover ? `Voiceover context: "${selected.voiceover}".` : "",
    selected.dialogue ? `Dialogue context: ${selected.dialogue}.` : "",
    `Cinematography: 35mm lens, natural color grade, photorealistic, cinematic composition.`,
    selected.videoPrompt ? `Action/Motion: ${selected.videoPrompt}` : "",
  ].filter(Boolean).join(" ") : "";

  const videoMotionPrompt = selected ? [
    selected.videoPrompt || `Cinematic smooth motion of ${selected.actionDescription}. 4k photorealistic, natural environmental dynamics, professional cinematography.`,
    selected.voiceover ? `[Voice-Over Beat]: "${selected.voiceover}"` : "",
    selected.dialogue ? `[Character Dialogue]: ${selected.dialogue}` : "",
    selected.audioPrompt ? `[Soundscape / Foley]: ${selected.audioPrompt}` : "",
  ].filter(Boolean).join("\n\n") : "";

  const scriptPrompt = selected ? [
    `SCENE ${selectedScene?.sceneNumber ?? 1}: ${selectedScene?.heading || "EXT. VILLAGE"}`,
    `SHOT ${selected.shotNumber} (${selected.shotSize || "MEDIUM SHOT"} · ${selected.targetDurationSeconds || 5}s)`,
    `ACTION: ${selected.actionDescription}`,
    selected.voiceover ? `\n🎙️ VOICE-OVER (NARRATOR):\n"${selected.voiceover}"` : "",
    selected.dialogue ? `\n💬 SPOKEN DIALOGUE:\n${selected.dialogue}` : "",
    selected.audioPrompt ? `\n🔊 SOUND DESIGN & SFX:\n${selected.audioPrompt}` : "",
  ].filter(Boolean).join("\n") : "";

  const rawJsonPrompt = selected ? JSON.stringify({
    sceneNumber: selectedScene?.sceneNumber,
    sceneHeading: selectedScene?.heading,
    shotNumber: selected.shotNumber,
    shotSize: selected.shotSize,
    targetDurationSeconds: selected.targetDurationSeconds,
    characterConsistencyAnchor: characterAnchor,
    actionDescription: selected.actionDescription,
    imagePrompt: selected.imagePrompt,
    videoPrompt: selected.videoPrompt,
    dialogue: selected.dialogue,
    voiceover: selected.voiceover,
    audioPrompt: selected.audioPrompt,
  }, null, 2) : "";

  const engineLaunchers: Record<string, { label: string; url: string; color: string }> = {
    flow: { label: "Open Google Flow ↗", url: "https://aitestkitchen.withgoogle.com/tools/video-fx", color: "bg-blue-950/70 text-blue-300 border-blue-700 hover:bg-blue-900/50" },
    kling: { label: "Open Kling (66 Free/day) ↗", url: "https://klingai.com", color: "bg-purple-950/70 text-purple-300 border-purple-800 hover:bg-purple-900/50" },
    chatgpt: { label: "Open ChatGPT ↗", url: "https://chatgpt.com", color: "bg-emerald-950/70 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50" },
    gemini: { label: "Open Gemini ↗", url: "https://gemini.google.com/app", color: "bg-sky-950/70 text-sky-300 border-sky-800 hover:bg-sky-900/50" },
  };
  const activeLauncher = engineLaunchers[promptTab];

  const activePromptText =
    promptTab === "flow" ? googleFlowPrompt :
    promptTab === "kling" ? klingPrompt :
    promptTab === "script" ? scriptPrompt :
    promptTab === "chatgpt" ? chatgptPrompt :
    promptTab === "gemini" ? geminiPrompt :
    promptTab === "video" ? videoMotionPrompt :
    rawJsonPrompt;

  return (
    <AppShell>
      <div className="flex h-screen overflow-hidden">
        {/* Left: scene/shot list */}
        <div className="w-72 shrink-0 border-r border-zinc-800 overflow-y-auto py-4 px-2">
          <div className="px-3 mb-3 text-xs text-zinc-500 flex gap-1 items-center">
            <Link href={`/projects/${projectId}`} className="hover:text-zinc-300">Project</Link>
            <ChevronRight className="h-2.5 w-2.5" />
            <span>Storyboard</span>
          </div>

          {/* Action bar */}
          <div className="px-3 mb-4 space-y-2">
            {scenes.length === 0 && !activeJobId && (
              <>
                <p className="text-sm text-zinc-400">Generate your shot plan from the screenplay.</p>
                {error && <p className="text-rose-400 text-xs">{error}</p>}
                <Button size="sm" loading={generating} onClick={() => generateShotPlan(false)} className="w-full">
                  <Sparkles className="h-3.5 w-3.5" /> Plan shots with AI
                </Button>
                <Button size="sm" variant="ghost" onClick={() => generateShotPlan(true)} className="w-full">
                  Test mock
                </Button>
              </>
            )}

            {activeJobId && (
              <div className="flex items-center gap-2 text-sm text-blue-300">
                <span className="h-3 w-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
                Planning shots…
              </div>
            )}

            {scenes.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-zinc-500">{approvedCount}/{allShots.length} shots approved</p>

                {/* Image generation */}
                {imgProgress ? (
                  <div className="text-xs text-amber-300 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                    Generating images… {imgProgress.done}/{imgProgress.total}
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" loading={genImages} onClick={generateImages} className="w-full text-xs">
                    <ImageIcon className="h-3 w-3" />
                    {hasImages ? "Regenerate images" : "Generate storyboard images"}
                  </Button>
                )}

                {/* Video generation */}
                {vidProgress ? (
                  <div className="text-xs text-purple-300 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
                    Animating videos… {vidProgress.done}/{vidProgress.total}
                  </div>
                ) : (
                  <Button size="sm" variant="secondary" loading={genVideos} onClick={() => generateVideos()} className="w-full text-xs font-semibold bg-purple-950/40 hover:bg-purple-900/40 text-purple-200 border border-purple-800/60 shadow-sm">
                    <Video className="h-3.5 w-3.5 text-purple-400" />
                    🎬 Animate All Scenes to Video
                  </Button>
                )}

                {/* Export All Prompts JSON */}
                <button
                  type="button"
                  onClick={exportAllPromptsJson}
                  className="w-full flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition"
                  title="Download all shot prompts in one JSON file to run in ChatGPT/Gemini"
                >
                  <Download className="h-3 w-3 text-amber-400" />
                  Export All Prompts (JSON)
                </button>

                {error && (
                  <div className="flex items-start gap-1.5 text-rose-400 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shot list */}
          {scenes.map(sc => (
            <div key={sc.id} className="mb-3">
              <p className="px-3 py-1 text-xs font-semibold text-zinc-500 uppercase">
                Scene {sc.sceneNumber}: {sc.heading}
              </p>
              {sc.shots.map(sh => {
                const img = sh.mediaVersions.find(m => m.kind === "STORYBOARD_STILL");
                const vid = sh.mediaVersions.find(m => m.kind === "VIDEO_CLIP");
                return (
                  <button key={sh.id} onClick={() => setSelected(sh)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 ${selected?.id === sh.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"}`}>
                    {/* Thumbnail */}
                    <span className="h-8 w-12 rounded overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mediaUrl(img.storagePath)} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-3 w-3 text-zinc-600" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-zinc-600 text-xs">S{sh.shotNumber}</span>
                      <span className="block truncate text-xs">{sh.actionDescription}</span>
                    </span>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      {img && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Image ready" />}
                      {vid && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" title="Video ready" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Right: shot studio canvas */}
        <div className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-24">
              <ImageIcon className="h-12 w-12 text-zinc-700 mb-3" />
              <p className="text-sm font-medium text-zinc-400">Select a shot from the left sidebar to open the studio.</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
                <div>
                  <div className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                    <span className="text-amber-400 font-semibold">Scene {selectedScene?.sceneNumber ?? 1}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-300">{selectedScene?.heading || "EXT. VILLAGE"}</span>
                  </div>
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mt-0.5">
                    Shot {selected.shotNumber}
                    {selected.shotSize && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                        {selected.shotSize}
                      </span>
                    )}
                    <span className="text-xs font-mono text-zinc-500 font-normal">
                      {selected.targetDurationSeconds}s
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-2.5">
                  <Badge status={artifactStatusBadge(selected.approvalStatus)} label={selected.approvalStatus} />
                  {selected.approvalStatus !== "APPROVED" ? (
                    <Button
                      size="sm"
                      onClick={() => { approveShot(selected.id); setSelected({ ...selected, approvalStatus: "APPROVED" }); }}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" /> Approve Shot
                    </Button>
                  ) : (
                    <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" /> Approved for Edit
                    </span>
                  )}
                </div>
              </div>

              {/* 2-Column Responsive Studio Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: Visual Stage (7 cols) */}
                <div className="xl:col-span-7 space-y-4">
                  {/* Cinema Viewport (16:9 Aspect Ratio) */}
                  <div
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file && selected) importMedia(selected.id, file);
                    }}
                    className={`relative aspect-video w-full rounded-xl overflow-hidden bg-zinc-950 border transition-all ${
                      isDragging
                        ? "border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.25)]"
                        : "border-zinc-800 hover:border-zinc-700 shadow-xl"
                    }`}
                  >
                    {/* Video View */}
                    {selectedVideo && (activeMediaView === "video" || !selectedImage) ? (
                      <div className="relative w-full h-full flex items-center justify-center bg-black">
                        <video
                          key={selectedVideo.id}
                          src={mediaUrl(selectedVideo.storagePath, selectedVideo.id)}
                          controls
                          playsInline
                          preload="auto"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-none">
                          <span className="text-[11px] bg-black/85 backdrop-blur text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-medium shadow flex items-center gap-1">
                            <Volume2 className="h-3 w-3 text-amber-400" /> Audio Multiplexed
                          </span>
                        </div>
                      </div>
                    ) : selectedImage ? (
                      /* Still Image View */
                      <div className="relative w-full h-full flex items-center justify-center bg-black">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mediaUrl(selectedImage.storagePath)}
                          alt={`Shot ${selected.shotNumber}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 pointer-events-none">
                          <span className="text-[11px] bg-black/85 backdrop-blur text-zinc-300 border border-zinc-700 px-2.5 py-0.5 rounded-full font-medium shadow flex items-center gap-1">
                            <ImageIcon className="h-3 w-3 text-amber-400" /> Storyboard Still
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Placeholder Drop Canvas */
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-900/30 to-zinc-950">
                        <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3 shadow">
                          <Upload className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-semibold text-zinc-200 mb-1">Awaiting Media Asset</h4>
                        <p className="text-xs text-zinc-400 max-w-sm mb-3">
                          Generate in browser using the prompt on the right, then drop here or press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] font-mono text-amber-300">Ctrl+V</kbd> to paste.
                        </p>
                      </div>
                    )}

                    {/* Drag-over active glow */}
                    {isDragging && (
                      <div className="absolute inset-0 bg-amber-950/85 backdrop-blur-sm flex flex-col items-center justify-center text-amber-300 z-20 pointer-events-none">
                        <Upload className="h-10 w-10 animate-bounce mb-2" />
                        <p className="text-sm font-bold">Release to import into Shot {selected.shotNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* Prominent Media Control & Import Station */}
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-3.5 shadow-sm">
                    {/* Status & Media Switcher */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Active Media</span>
                        {selectedVideo && selectedImage ? (
                          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setActiveMediaView("video")}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                                activeMediaView === "video"
                                  ? "bg-zinc-800 text-amber-300 shadow-sm"
                                  : "text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              <Video className="h-3 w-3" /> Video Clip
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveMediaView("still")}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition ${
                                activeMediaView === "still"
                                  ? "bg-zinc-800 text-amber-300 shadow-sm"
                                  : "text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              <ImageIcon className="h-3 w-3" /> Still Image
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-400 font-medium">
                            {selectedVideo ? "🎬 Video Clip Ready" : selectedImage ? "📷 Still Image Ready" : "Awaiting Generation"}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                        <span>Clipboard paste:</span>
                        <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[11px] font-mono text-amber-300">Ctrl+V</kbd>
                      </div>
                    </div>

                    {/* Generous Interactive Drop & Upload Area */}
                    <div
                      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={e => {
                        e.preventDefault();
                        setIsDragging(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file && selected) importMedia(selected.id, file);
                      }}
                      className={`rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                        isDragging
                          ? "border-amber-400 bg-amber-950/30"
                          : "border-zinc-700/80 bg-zinc-950/50 hover:border-zinc-600 hover:bg-zinc-950/80"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p className="text-xs text-zinc-300 font-medium">
                          Drag and drop your AI generated media here, or use the buttons below
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          Silent video clips from Kling, Luma or Google Flow are automatically dubbed with your screenplay audio on import.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                          {selectedImage && (
                            <button
                              type="button"
                              onClick={() => generateVideos(selected.id)}
                              disabled={genVideos}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-lg text-xs font-bold transition shadow-md disabled:opacity-50"
                              title="Turn this still image into a cinematic 1080p video clip with voiceover & motion in this app"
                            >
                              <Video className="h-4 w-4" />
                              {genVideos ? "Animating Video…" : "🎬 Animate to Video (In-App)"}
                            </button>
                          )}

                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f && selected) importMedia(selected.id, f); }}
                            />
                            <span className={`inline-flex items-center gap-2 px-4 py-2 bg-purple-950/80 hover:bg-purple-900/80 text-purple-200 rounded-lg text-xs border border-purple-700/80 font-semibold transition shadow-md ${importing === selected.id ? "opacity-50 pointer-events-none" : ""}`}>
                              <Video className="h-4 w-4 text-purple-400" />
                              {importing === selected.id ? "Importing Video…" : "Import Video Clip (MP4)"}
                            </span>
                          </label>

                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f && selected) importMedia(selected.id, f); }}
                            />
                            <span className={`inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs border border-zinc-700 font-semibold transition shadow-md ${importing === selected.id ? "opacity-50 pointer-events-none" : ""}`}>
                              <ImageIcon className="h-4 w-4 text-amber-400" />
                              {importing === selected.id ? "Importing Image…" : "Import Still Image (JPG/PNG)"}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: AI Studio & Screenplay (5 cols) */}
                <div className="xl:col-span-5 space-y-4">
                  {/* AI Generation Prompt Hub Card (TOP) */}
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-3 shadow-sm">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/60">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-semibold text-zinc-200">AI Prompt Hub</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {characterAssets.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCharId(null);
                              setIsCharModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 rounded-md text-xs font-semibold shadow-sm transition"
                            title="Open Google Flow Character Library & Consistency Prompts"
                          >
                            <User className="h-3.5 w-3.5 text-blue-400" />
                            <span>Characters ({characterAssets.length})</span>
                          </button>
                        )}
                        {activeLauncher && (
                          <button
                            type="button"
                            onClick={() => window.open(activeLauncher.url, "_blank")}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md border transition shadow-sm ${activeLauncher.color}`}
                          >
                            <span>{activeLauncher.label}</span>
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => copyPrompt(activePromptText, promptTab)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-md text-xs shadow-sm transition"
                        >
                          {copied === promptTab ? (
                            <>
                              <CheckCheck className="h-3.5 w-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>{promptTab === "flow" ? "Copy @Mention Prompt" : "Copy Prompt"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Segmented Pill Tabs */}
                    <div className="flex flex-wrap gap-1 p-1 bg-zinc-950 rounded-lg border border-zinc-800/80">
                      {[
                        { id: "flow", label: "Google Flow (Veo)" },
                        { id: "kling", label: "Kling Direct Video" },
                        { id: "chatgpt", label: "ChatGPT" },
                        { id: "gemini", label: "Gemini" },
                        { id: "script", label: "Script (Audio)" },
                        { id: "json", label: "Raw JSON" },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setPromptTab(tab.id as any)}
                          className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                            promptTab === tab.id
                              ? "bg-zinc-800 text-amber-300 shadow-sm"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Content: Google Flow vs General Engine Tabs */}
                    {promptTab === "flow" ? (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-zinc-800/60">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3 text-amber-400" /> Shot Video Prompt
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">Omni Flash / Veo 2</span>
                          </div>

                          {/* Tagged characters pill list */}
                          {characterAssets.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              <span className="text-zinc-500 text-[10px]">Tagged:</span>
                              {characterAssets.map(ca => {
                                const bTag = `[@${ca.name.replace(/[^a-zA-Z0-9]/g, "")}]`;
                                const isMentioned = googleFlowPrompt.includes(bTag) || activeCharAsset?.id === ca.id;
                                return (
                                  <button
                                    key={ca.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCharacterId(ca.id);
                                      setIsCharModalOpen(true);
                                    }}
                                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold transition flex items-center gap-1 ${
                                      isMentioned
                                        ? "bg-blue-950/70 text-blue-300 border border-blue-600/60 hover:bg-blue-900/80"
                                        : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 hover:bg-zinc-700/60"
                                    }`}
                                    title={`Click to view/edit ${ca.name}'s character prompt & voice profile`}
                                  >
                                    <span>{bTag}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-200 bg-black/80 border border-zinc-800 rounded-lg p-3 min-h-[220px] max-h-[380px] overflow-y-auto leading-relaxed selection:bg-amber-500/30">
                          {googleFlowPrompt}
                        </pre>
                      </div>
                    ) : (
                      /* Standard Single-Step Prompt Box for Other Engines */
                      <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-300 bg-black/70 border border-zinc-800 rounded-lg p-3 min-h-[220px] max-h-[380px] overflow-y-auto leading-relaxed selection:bg-amber-500/30">
                        {activePromptText}
                      </pre>
                    )}
                  </div>

                  {/* Screenplay & Audio Card (BELOW PROMPT) */}
                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                      <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Screenplay &amp; Audio
                      </h3>
                      <span className="text-[11px] text-zinc-500 font-mono">S{selected.shotNumber}</span>
                    </div>

                    {/* Action Description */}
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Visual Action</span>
                      <p className="text-zinc-200 text-xs leading-relaxed mt-0.5">{selected.actionDescription}</p>
                    </div>

                    {/* Narrator Voice-Over */}
                    {selected.voiceover && (
                      <div className="rounded-lg bg-zinc-950/60 border border-amber-900/30 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                            <Mic className="h-3 w-3" /> Voice-Over (Narrator)
                          </span>
                          <button
                            type="button"
                            onClick={() => playSpeechBrowser(selected.voiceover ?? "")}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium transition"
                          >
                            <Volume2 className="h-2.5 w-2.5" /> Speak Aloud
                          </button>
                        </div>
                        <p className="text-zinc-200 text-xs italic font-serif leading-relaxed border-l-2 border-amber-500/50 pl-2.5">
                          “{selected.voiceover}”
                        </p>
                      </div>
                    )}

                    {/* Spoken Dialogue */}
                    {selected.dialogue && (
                      <div className="rounded-lg bg-zinc-950/60 border border-sky-900/30 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> Character Dialogue
                          </span>
                          <button
                            type="button"
                            onClick={() => playSpeechBrowser(selected.dialogue ?? "")}
                            className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-medium transition"
                          >
                            <Volume2 className="h-2.5 w-2.5" /> Speak
                          </button>
                        </div>
                        <p className="text-zinc-200 text-xs font-mono leading-relaxed bg-black/40 p-2 rounded border border-zinc-800/80">
                          {selected.dialogue}
                        </p>
                      </div>
                    )}

                    {/* Foley & Sound Design */}
                    {selected.audioPrompt && (
                      <div className="text-[11px] text-zinc-400 flex items-start gap-1.5 pt-1">
                        <span className="font-semibold text-emerald-400 uppercase text-[10px] tracking-wider shrink-0 mt-0.5">Atmosphere:</span>
                        <span className="italic">{selected.audioPrompt}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Google Flow Character Setup & Consistency Modal */}
      {isCharModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    Character Consistency Library
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-medium">
                      {characterAssets.length} {characterAssets.length === 1 ? "Character" : "Characters"}
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Google Flow &ldquo;Characters&rdquo; Setup Prompts &amp; Voice Profiles
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCharModalOpen(false);
                  setEditingCharId(null);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Explainer Banner */}
            <div className="px-6 py-3 bg-blue-950/30 border-b border-blue-900/40 text-xs text-blue-200/90 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>How to use in Google Flow:</strong> In Google Flow&apos;s left sidebar under <strong>&ldquo;Characters&rdquo;</strong>, create each character once using their prompt &amp; voice directive below. Once created, your scene prompts reference them as <span className="font-mono bg-blue-900/50 px-1 py-0.5 rounded text-amber-300 font-bold">[@CharacterName]</span> to lock their facial appearance, wardrobe, and voice throughout the entire film!
              </div>
            </div>

            {/* Character Cards List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {characterAssets.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  No character assets found. Extract or create characters in the Production Bible.
                </div>
              ) : (
                characterAssets.map(ca => {
                  let attr: any = {};
                  try { attr = JSON.parse(ca.attributes || "{}"); } catch {}
                  const cTag = `[@${ca.name.replace(/[^a-zA-Z0-9]/g, "")}]`;
                  const isEditing = editingCharId === ca.id;
                  
                  // Inferred values if empty
                  const flowPrompt = attr.googleFlowCharacterPrompt || ca.description || "";
                  const voice = attr.voiceProfile || "";
                  const wardrobe = attr.wardrobe || "";

                  return (
                    <div
                      key={ca.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 hover:border-zinc-700 transition"
                    >
                      {/* Character Title Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {cTag}
                          </span>
                          <h3 className="text-sm font-bold text-zinc-100">{ca.name}</h3>
                          {attr.age && (
                            <span className="text-xs text-zinc-400">({attr.age} years old)</span>
                          )}
                          {attr.role && (
                            <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              {attr.role}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {!isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => copyPrompt(flowPrompt, `charPrompt-${ca.id}`)}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-200 border border-blue-500/40 font-semibold transition"
                                title="Copy 8K description prompt for Google Flow Characters menu"
                              >
                                {copied === `charPrompt-${ca.id}` ? (
                                  <>
                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" />
                                    <span>Copy Character Prompt</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => copyPrompt(voice, `charVoice-${ca.id}`)}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/40 font-semibold transition"
                                title="Copy voice settings directive for Google Flow"
                              >
                                {copied === `charVoice-${ca.id}` ? (
                                  <>
                                    <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="h-3.5 w-3.5" />
                                    <span>Copy Voice Directive</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => startEditingCharacter(ca)}
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 font-medium transition"
                                title="Edit this character prompt and voice profile"
                              >
                                <Edit2 className="h-3 w-3" />
                                <span>Edit</span>
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={savingChar}
                                onClick={() => saveEditedCharacter(ca.id)}
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition shadow-sm"
                              >
                                <Save className="h-3.5 w-3.5" />
                                <span>{savingChar ? "Saving…" : "Save Changes"}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCharId(null)}
                                className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Content: View vs Edit */}
                      {!isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                              Character Creation Prompt (for Google Flow &ldquo;Characters&rdquo; Menu)
                            </span>
                            <pre className="text-xs text-zinc-200 bg-black/60 p-3 rounded-lg border border-blue-900/40 font-mono whitespace-pre-wrap leading-relaxed mt-1">
                              {flowPrompt}
                            </pre>
                          </div>

                          <div>
                            <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                              Voice Directive (for Google Flow Character Voice Selection)
                            </span>
                            <p className="text-xs text-purple-200/90 bg-purple-950/40 p-2.5 rounded-lg border border-purple-800/40 font-mono leading-relaxed mt-1">
                              {voice}
                            </p>
                          </div>

                          {wardrobe && (
                            <div className="text-xs text-zinc-400 flex items-center gap-2">
                              <span className="text-[10px] uppercase font-semibold text-zinc-500">Wardrobe:</span>
                              <span>{wardrobe}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2">
                          <div>
                            <label className="block text-xs font-semibold text-blue-400 mb-1">
                              Character Creation Prompt (8K photorealistic portrait prompt for Google Flow):
                            </label>
                            <textarea
                              rows={4}
                              value={charEditPrompt}
                              onChange={e => setCharEditPrompt(e.target.value)}
                              className="w-full text-xs font-mono bg-black/80 text-zinc-100 border border-blue-500/50 rounded-lg p-2.5 focus:border-amber-400 focus:outline-none leading-relaxed"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-purple-400 mb-1">
                              Voice Profile Directive (Accent, tone, pitch, intonation):
                            </label>
                            <textarea
                              rows={2}
                              value={charEditVoice}
                              onChange={e => setCharEditVoice(e.target.value)}
                              className="w-full text-xs font-mono bg-black/80 text-zinc-100 border border-purple-500/50 rounded-lg p-2.5 focus:border-amber-400 focus:outline-none leading-relaxed"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">
                              Wardrobe &amp; Physical Features:
                            </label>
                            <input
                              type="text"
                              value={charEditWardrobe}
                              onChange={e => setCharEditWardrobe(e.target.value)}
                              className="w-full text-xs bg-black/80 text-zinc-100 border border-zinc-700 rounded-lg px-3 py-2 focus:border-amber-400 focus:outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                Changes saved here update the database and all scene prompts automatically.
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsCharModalOpen(false);
                  setEditingCharId(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
