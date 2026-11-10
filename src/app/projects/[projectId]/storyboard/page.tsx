"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/nav/AppShell";
import { ProjectWorkflowNav } from "@/components/nav/ProjectWorkflowNav";
import { Button } from "@/components/ui/button";
import { Badge, artifactStatusBadge } from "@/components/ui/badge";
import {
  ChevronRight, Sparkles, Upload, Check, Image as ImageIcon, Video,
  AlertCircle, Mic, MessageSquare, Volume2, Copy, CheckCheck, Download,
  ExternalLink, FileCode, User, ChevronDown, ChevronUp, X, Edit2, Save, RefreshCw,
  ShieldCheck, Zap, CheckCircle2,
} from "lucide-react";
import { compileCinematicPrompt } from "@/lib/story/prompt-compiler";

interface ShotMedia {
  id: string; kind: string; versionNumber: number; filename: string;
  storagePath: string; mimeType: string; approvalStatus: string;
  width?: number; height?: number; durationSeconds?: number; provenance: string;
  modelId?: string; providerId?: string;
}
interface Shot {
  id: string; shotNumber: number; actionDescription: string; shotSize?: string;
  cameraAngle?: string; cameraMovement?: string; lighting?: string; mood?: string;
  imagePrompt?: string; videoPrompt?: string; approvalStatus: string;
  targetDurationSeconds: number; mediaVersions: ShotMedia[];
  voiceover?: string; dialogue?: string; audioPrompt?: string;
}
interface Scene { id: string; sceneNumber: number; heading: string; shots: Shot[]; }

function mediaUrl(p: string, versionId?: string) {
  const base = `/api/media/file?path=${encodeURIComponent(p)}`;
  return versionId ? `${base}&v=${versionId}` : base;
}

export default function StoryboardPage() {
  const routeParams = useParams();
  const projectId = (routeParams?.projectId as string) || "";
  const [scenes, setScenes]               = useState<Scene[]>([]);
  const [generating, setGenerating]       = useState(false);
  const [genImages, setGenImages]         = useState(false);
  const [singleGenImageShotId, setSingleGenImageShotId] = useState<string | null>(null);
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

  // Shot Script Editing State
  const [isEditingShotScript, setIsEditingShotScript] = useState(false);
  const [editShotAction, setEditShotAction] = useState("");
  const [editShotDialogue, setEditShotDialogue] = useState("");
  const [editShotVoiceover, setEditShotVoiceover] = useState("");
  const [editShotAudioPrompt, setEditShotAudioPrompt] = useState("");
  const [editShotCameraMotion, setEditShotCameraMotion] = useState("");
  const [savingShotScript, setSavingShotScript] = useState(false);
  const [isAutoEnhancing, setIsAutoEnhancing] = useState(false);
  const [enhanceSuccess, setEnhanceSuccess] = useState(false);
  const [creditSaverMode, setCreditSaverMode] = useState<boolean>(true);

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
        setSingleGenImageShotId(null);
        setActiveMediaView("still");
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

  async function generateSingleShotImage(shotId: string) {
    setSingleGenImageShotId(shotId);
    setError(null);
    try {
      const r = await fetch(`/api/projects/${projectId}/shots/generate-images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true, shotId }),
      });
      const d = await r.json();
      if (r.ok) {
        if (d.data?.queued === 0) {
          setSingleGenImageShotId(null);
          setError(d.data?.message || "Failed to generate image");
          return;
        }
        if (d.data?.jobIds?.length > 0) {
          setImageJobIds(prev => [...prev, ...d.data.jobIds]);
        }
      } else {
        setSingleGenImageShotId(null);
        setError(d.error?.message ?? "Failed to start image generation");
      }
    } catch (e) {
      setSingleGenImageShotId(null);
      setError(e instanceof Error ? e.message : "Failed to start image generation");
    }
  }

  function downloadImage(storagePath: string, shotNum: number) {
    const url = mediaUrl(storagePath);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Shot-${shotNum}-still.jpg`;
    a.target = "_blank";
    a.click();
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
      project: {
        title: projectData?.title,
        aspectRatio: projectData?.aspectRatio,
        storyLanguage: projectData?.storyLanguage,
        visualStyle: projectData?.visualStyle,
      },
      character_reference: characterAssets.length > 0 ? Object.fromEntries(
        characterAssets.map(ca => {
          let attr: any = {};
          try { attr = JSON.parse(ca.attributes || "{}"); } catch {}
          return [
            ca.name,
            {
              name: ca.name,
              tag: `[@${ca.name.replace(/[^a-zA-Z0-9]/g, "")}]`,
              appearance: ca.description,
              wardrobe: attr.wardrobe || "Traditional South Indian attire",
              personality: attr.personality || "Grounded",
              full_anchor: `${ca.name}: ${ca.description}. Wardrobe: ${attr.wardrobe || "traditional"}. Demeanor: ${attr.personality || "authentic"}.`,
            }
          ];
        })
      ) : {},
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

  async function setShotDuration(shotId: string, durationSeconds: number) {
    if (!selected) return;
    setSelected({ ...selected, targetDurationSeconds: durationSeconds });
    setScenes(prev => prev.map(sc => ({
      ...sc,
      shots: sc.shots.map(sh => sh.id === shotId ? { ...sh, targetDurationSeconds: durationSeconds } : sh)
    })));
    try {
      await fetch(`/api/projects/${projectId}/shots/${shotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDurationSeconds: durationSeconds }),
      });
    } catch {}
  }

  function startEditingShotScript() {
    if (!selected) return;
    setEditShotAction(selected.actionDescription || "");
    setEditShotDialogue(selected.dialogue || "");
    setEditShotVoiceover(selected.voiceover || "");
    setEditShotAudioPrompt(selected.audioPrompt || "");
    setEditShotCameraMotion(selected.cameraMovement || "");
    setIsEditingShotScript(true);
  }

  async function saveShotScript() {
    if (!selected) return;
    setSavingShotScript(true);
    try {
      await fetch(`/api/projects/${projectId}/shots/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionDescription: editShotAction.trim(),
          cameraMovement: editShotCameraMotion.trim(),
          dialogue: editShotDialogue.trim(),
          voiceover: editShotVoiceover.trim(),
          audioPrompt: editShotAudioPrompt.trim(),
        }),
      });

      setSelected({
        ...selected,
        actionDescription: editShotAction.trim(),
        cameraMovement: editShotCameraMotion.trim(),
        dialogue: editShotDialogue.trim(),
        voiceover: editShotDialogue.trim().length > 0 ? "" : editShotVoiceover.trim(),
        audioPrompt: editShotAudioPrompt.trim(),
      });

      setIsEditingShotScript(false);
      await load();
    } catch (e) {
      console.error("Failed to save shot script", e);
    } finally {
      setSavingShotScript(false);
    }
  }

  async function handleAutoEnhance() {
    if (!selected) return;
    setIsAutoEnhancing(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/shots/audit-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shotId: selected.id,
          actionDescription: selected.actionDescription,
          cameraMovement: selected.cameraMovement,
          dialogue: selected.dialogue,
          voiceover: selected.voiceover,
          audioPrompt: selected.audioPrompt,
          shotSize: selected.shotSize,
          lighting: selected.lighting,
          characterName: charName,
          wardrobeLock: wardrobeLock,
          applyFix: true,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setEnhanceSuccess(true);
        setTimeout(() => setEnhanceSuccess(false), 3000);
        await load();
      }
    } catch (e) {
      console.error("Auto-enhance failed", e);
    } finally {
      setIsAutoEnhancing(false);
    }
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

  // Auto-detect which character is mentioned or featured in this specific shot
  const shotText = `${selected?.actionDescription || ""} ${selected?.videoPrompt || ""} ${selected?.dialogue || ""}`;
  const matchedChar = characterAssets.find(ca => {
    const bTag = `[@${ca.name.replace(/[^a-zA-Z0-9]/g, "")}]`;
    const regex = new RegExp(`\\b${ca.name}\\b`, "i");
    return shotText.includes(bTag) || shotText.includes(`@${ca.name}`) || regex.test(shotText);
  });

  const autoCharAsset = matchedChar || characterAssets.find(a =>
    (shotCharName && a.name.toLowerCase() === shotCharName.toLowerCase())
  ) || characterAssets[0];

  const activeCharAsset = autoCharAsset;

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

  const wardrobeLock = charAttrs.wardrobe ? charAttrs.wardrobe.replace(/\.+$/, "") : "";

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

  // Quantize duration to Google Flow / Omni 1.1 Flash supported durations: minimum 8s (8s or 10s)
  const allowedDurations = [8, 10];
  const rawDuration = selected?.targetDurationSeconds || 8;
  const normalizedDuration = rawDuration >= 9 ? 10 : 8;
  const targetDurationLabel = `${normalizedDuration} seconds`;

  // Bracketed character tag placeholder: [@Ayyanar] or [@Yazhini]
  const bracketedCharTag = `[@${charName.replace(/[^a-zA-Z0-9]/g, "")}]`;

  // Convert character name in action to bracketed tag [@CharacterName]
  let rawAction = selected?.actionDescription || "";
  if (!rawAction.trim() && selected?.videoPrompt) {
    const match = selected.videoPrompt.match(/^([^.]+?\.)/);
    rawAction = match ? match[1] : selected.videoPrompt.slice(0, 120);
  }

  let taggedAction = rawAction.trim();

  // Replace character names with bracketed tags
  characterAssets.forEach(ca => {
    const bTag = `[@${ca.name.replace(/[^a-zA-Z0-9]/g, "")}]`;
    if (!taggedAction.includes(bTag)) {
      const charRegex = new RegExp(`\\b${ca.name}\\b`, "g");
      taggedAction = taggedAction.replace(charRegex, bTag);
    }
  });

  // If no bracketed tag exists anywhere in the action, add the primary character tag
  if (!taggedAction.includes("[@")) {
    taggedAction = `${bracketedCharTag} ${taggedAction}`;
  }

  // Strict Wardrobe Lock in Action Line:
  // Explicitly weaves the character's approved wardrobe directly next to their tag
  // e.g. [@Karthi] (wearing faded cotton half-shorts and shirt, barefoot)
  if (wardrobeLock && taggedAction.includes(bracketedCharTag)) {
    const hasWardrobeDetails = /wearing|dressed in|shorts|saree|dhoti|veshti|pants/i.test(taggedAction);
    if (!hasWardrobeDetails) {
      taggedAction = taggedAction.replace(bracketedCharTag, `${bracketedCharTag} (wearing ${wardrobeLock})`);
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

  // Camera Motion: Extract clean motion without duplicating the entire videoPrompt
  let cameraMotion = "Subtle cinematic handheld camera motion at 24fps with natural organic float";
  if (selected?.cameraMovement && selected.cameraMovement !== "Static" && !selected.cameraMovement.includes("[PRODUCTION SPECS]")) {
    cameraMotion = selected.cameraMovement;
  } else if (selected?.videoPrompt) {
    const camMatch = selected.videoPrompt.match(/Camera:\s*([^.\n]+(?:\.[^.\n]+)?)/i);
    if (camMatch) {
      cameraMotion = camMatch[1].trim();
    }
  }

  // Audio Mutual Exclusivity: Character Dialogue takes precedence.
  // If character speaks, do NOT show Voice-Over (Narrator)!
  const hasDialogue = Boolean(formattedDialogue && formattedDialogue.trim().length > 0);
  const audioScriptLines: string[] = [];
  if (hasDialogue) {
    audioScriptLines.push(`- Spoken Dialogue: ${formattedDialogue} (with natural ${projectData?.storyLanguage || "native"} lip-synchronization)`);
  } else if (selected?.voiceover && selected.voiceover.trim().length > 0) {
    audioScriptLines.push(`- Voice-Over (Narrator): "${selected.voiceover}"`);
  } else {
    audioScriptLines.push(`- Atmosphere: Pure visual action & ambient Foley (No spoken dialogue or voice-over)`);
  }
  if (selected?.audioPrompt) {
    audioScriptLines.push(`- Audio Atmosphere & Foley: ${selected.audioPrompt}`);
  }

  // Resolve authentic location description from Production Bible (never fallback to "SCENE 1")
  const locationAssets = bibleAssets.filter(a => a.assetType === "LOCATION");
  const matchedLocation = locationAssets.find(l => {
    const locLower = l.name.toLowerCase();
    const txtLower = shotText.toLowerCase();
    return txtLower.includes(locLower) ||
      (locLower.includes("sugarcane") && (txtLower.includes("sugarcane") || txtLower.includes("cane") || txtLower.includes("stalk"))) ||
      (locLower.includes("village") && (txtLower.includes("village") || txtLower.includes("courtyard") || txtLower.includes("house") || txtLower.includes("crowd")));
  }) || locationAssets[0];
  const locationEnvironment = matchedLocation?.description
    ? matchedLocation.description.replace(/\.+$/, "")
    : "Vast dense South Indian sugarcane plantation on narrow dusty red dirt pathway";

  const isPortrait = projectData?.aspectRatio === "PORTRAIT_9_16";
  const arParam = isPortrait ? "9:16" : projectData?.aspectRatio === "SQUARE_1_1" ? "1:1" : "16:9";
  const shotFraming = selected?.shotSize
    ? (selected.shotSize.toLowerCase().endsWith("shot") ? selected.shotSize : `${selected.shotSize} Shot`)
    : "Medium Shot";

  const actionCleaned = (selected?.actionDescription || selected?.videoPrompt || "")
    .replace(/\[@([A-Za-z0-9_-]+)\]/g, "$1")
    .replace(/@([A-Za-z0-9_-]+)/g, "$1")
    .replace(/\((?:wearing|dressed in)[^)]*\)\s*/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  const naturalCameraMotion = cameraMotion
    .replace(/\[@([A-Za-z0-9_-]+)\]/g, "$1")
    .replace(/@([A-Za-z0-9_-]+)/g, "$1")
    .trim();

  const naturalDialogue = formattedDialogue
    ? formattedDialogue.replace(/\[@([A-Za-z0-9_-]+)\]/g, "$1").replace(/@([A-Za-z0-9_-]+)/g, "$1").trim()
    : "";

  // Universal Prompt Compiler: Enforces Universal Physics & Kinematics across all engines
  const compiledBundle = selected ? compileCinematicPrompt({
    actionDescription: selected.actionDescription || selected.videoPrompt || "",
    shotSize: selected.shotSize,
    cameraMovement: cameraMotion,
    lighting: selected.lighting,
    dialogue: formattedDialogue,
    voiceover: selected.voiceover,
    audioPrompt: selected.audioPrompt,
    characterName: charName,
    characterDescription: activeCharAsset?.description,
    wardrobeLock,
    locationDescription: locationEnvironment,
    aspectRatio: projectData?.aspectRatio,
    storyLanguage: projectData?.storyLanguage,
    targetDurationSeconds: selected.targetDurationSeconds,
    creditSaverMode,
  }) : null;

  const googleFlowPrompt = compiledBundle?.googleFlowPrompt || "";
  const klingPrompt = compiledBundle?.klingPrompt || "";
  const chatgptPrompt = compiledBundle?.chatgptPrompt || "";
  const geminiPrompt = compiledBundle?.geminiPrompt || "";
  const videoMotionPrompt = compiledBundle?.videoMotionPrompt || "";
  const scriptPrompt = compiledBundle?.scriptPrompt || "";
  const detectedEntities = compiledBundle?.entities;
  const creditCostEstimate = compiledBundle?.creditCostEstimate || "10 credits (Standard Mode)";

  // Character references for external AI tools (Runway, Kling API, ComfyUI, etc.)
  const characterReferenceForOtherTools = characterAssets.length > 0 ? Object.fromEntries(
    characterAssets.map(ca => {
      let attr: any = {};
      try { attr = JSON.parse(ca.attributes || "{}"); } catch {}
      return [
        ca.name,
        `${ca.name}: ${ca.description}. Wardrobe: ${attr.wardrobe || "traditional attire"}. Demeanor: ${attr.personality || "authentic"}.`
      ];
    })
  ) : undefined;

  // Raw JSON Prompt - Configured with complete character references for external AI tools & automation pipelines
  const rawJsonPrompt = selected ? JSON.stringify({
    scene: `Scene ${selectedScene?.sceneNumber || 1} - Shot ${selected.shotNumber}: ${selectedScene?.heading || "Shot"}`,
    duration_seconds: normalizedDuration,
    aspect_ratio: arParam,
    style: "Photorealistic cinematic rural atmosphere",
    active_character: charName,
    character_tags: [bracketedCharTag],
    // Provided for other AI tools (external APIs, ComfyUI, Runway, Kling, Sora) that need full character visual definitions
    character_reference: characterReferenceForOtherTools,
    visual_action: actionCleaned,
    camera: {
      shot: shotFraming,
      movement: naturalCameraMotion,
      lens: "35mm anamorphic prime",
      fps: 24
    },
    lighting: selected.lighting || "Natural daylight, soft golden illumination, documentary realism",
    environment: locationEnvironment,
    audio: {
      dialogue: hasDialogue ? {
        speaker: bracketedCharTag,
        language: projectData?.storyLanguage || "Tamil",
        text: naturalDialogue,
        delivery: `Natural conversational inflection, authentic rural ${projectData?.storyLanguage || "native"} dialect`
      } : null,
      voiceover: (!hasDialogue && selected.voiceover) ? selected.voiceover : null,
      ambience: selected.audioPrompt || "Gentle rural atmosphere and environmental Foley",
    },
    constraints: [
      "Only the active speaker moves lips",
      `Accurate natural ${projectData?.storyLanguage || "native"} lip synchronization`,
      `Maintain exact character face, hair, and wardrobe consistency: ${wardrobeLock || "locked attire"}`,
      "No full pants or trousers when shorts are specified",
      "Strict natural forward anatomical alignment: chest, torso, and face face forward in the direction of movement without backward-twisting neck or contorted body",
      "No extra background crowd or distorted hands",
      "No generated subtitles or title text",
      "24fps cinematic motion blur"
    ]
  }, null, 2) : "";

  const engineLaunchers: Record<string, { label: string; url: string; color: string }> = {
    flow: { label: "Open Google Flow ↗", url: "https://aitestkitchen.withgoogle.com/tools/video-fx", color: "bg-blue-950/70 text-blue-300 border-blue-700 hover:bg-blue-900/50" },
    kling: { label: "Open Kling (10 Cr / video) ↗", url: "https://klingai.com", color: "bg-purple-950/70 text-purple-300 border-purple-800 hover:bg-purple-900/50" },
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
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Global Film Production 5-Step Workflow Nav */}
        <ProjectWorkflowNav
          projectId={projectId}
          activeStep="storyboard"
          projectTitle={projectData?.title}
          visualStyle={projectData?.visualStyle}
          rightAction={
            <Button
              size="sm"
              variant="secondary"
              onClick={exportAllPromptsJson}
              className="text-xs h-7 px-2.5 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white"
            >
              <FileCode className="h-3.5 w-3.5 mr-1" />
              <span>Export Prompts (JSON)</span>
            </Button>
          }
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Left: scene/shot list */}
          <div className="w-72 shrink-0 border-r border-zinc-800 overflow-y-auto py-4 px-2">

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
                    <span className="h-8 w-12 rounded overflow-hidden shrink-0 bg-zinc-800 flex items-center justify-center relative">
                      {singleGenImageShotId === sh.id ? (
                        <span className="h-3 w-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                      ) : img ? (
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
                    <div className="inline-flex items-center rounded-md border border-zinc-700/80 bg-zinc-950 p-0.5 text-xs shadow-inner">
                      <button
                        type="button"
                        onClick={() => setShotDuration(selected.id, 8)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
                          normalizedDuration === 8
                            ? "bg-amber-500 text-black shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                        title="Set shot duration to 8 seconds (Google Flow standard)"
                      >
                        ⏱️ 8s
                      </button>
                      <button
                        type="button"
                        onClick={() => setShotDuration(selected.id, 10)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition ${
                          normalizedDuration === 10
                            ? "bg-amber-500 text-black shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                        title="Set shot duration to 10 seconds (Climax / Extended action)"
                      >
                        ⏱️ 10s
                      </button>
                    </div>
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
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => downloadImage(selectedImage.storagePath, selected.shotNumber)}
                            className="text-[11px] bg-black/85 hover:bg-black text-amber-300 border border-amber-500/50 px-2.5 py-1 rounded-full font-semibold shadow flex items-center gap-1.5 transition"
                            title="Download still image for Kling / Luma Image-to-Video"
                          >
                            <Download className="h-3 w-3 text-amber-400" /> Download for I2V
                          </button>
                          <span className="text-[11px] bg-black/85 backdrop-blur text-zinc-300 border border-zinc-700 px-2.5 py-0.5 rounded-full font-medium shadow flex items-center gap-1">
                            <ImageIcon className="h-3 w-3 text-amber-400" /> Storyboard Still
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Placeholder Drop Canvas */
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-zinc-900/40 via-zinc-950 to-zinc-950 space-y-3">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow">
                          <Sparkles className="h-6 w-6" />
                        </div>
                        <div className="space-y-1 max-w-md">
                          <h4 className="text-sm font-bold text-zinc-100">Ready for Visual Still</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Generate an AI still image for Image-to-Video models (Kling, Luma, Wan 2.1) or in-app animation.
                          </p>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => generateSingleShotImage(selected.id)}
                            disabled={singleGenImageShotId === selected.id}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-lg text-xs font-bold transition shadow-lg disabled:opacity-50"
                          >
                            <Sparkles className={`h-4 w-4 ${singleGenImageShotId === selected.id ? "animate-spin" : ""}`} />
                            {singleGenImageShotId === selected.id
                              ? "Generating 1080p Still with FLUX.1…"
                              : "🎨 Generate AI Image (100% Free FLUX.1)"}
                          </button>
                        </div>
                        <p className="text-[11px] text-zinc-500">
                          Optional · Or drag &amp; drop an image / press <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-amber-300">Ctrl+V</kbd> to paste
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

                        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                          {/* On-Demand Single Shot Generate/Regenerate Image button */}
                          <button
                            type="button"
                            onClick={() => generateSingleShotImage(selected.id)}
                            disabled={singleGenImageShotId === selected.id}
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition shadow-md disabled:opacity-50 ${
                              selectedImage
                                ? "bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/30"
                                : "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black"
                            }`}
                            title={selectedImage ? "Regenerate this still image with a new seed" : "Generate a 1080p still image for this scene using free FLUX.1"}
                          >
                            {selectedImage ? (
                              <RefreshCw className={`h-3.5 w-3.5 text-amber-400 ${singleGenImageShotId === selected.id ? "animate-spin" : ""}`} />
                            ) : (
                              <Sparkles className={`h-3.5 w-3.5 ${singleGenImageShotId === selected.id ? "animate-spin" : ""}`} />
                            )}
                            {singleGenImageShotId === selected.id
                              ? "Generating Still…"
                              : selectedImage
                              ? "🔄 Regenerate Still (FLUX.1)"
                              : "🎨 Generate AI Still (Free FLUX.1)"}
                          </button>

                          {selectedImage && (
                            <button
                              type="button"
                              onClick={() => downloadImage(selectedImage.storagePath, selected.shotNumber)}
                              className="inline-flex items-center gap-2 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition shadow-md"
                              title="Download still image to upload to Kling, Luma Dream Machine, or Google Flow for Image-to-Video"
                            >
                              <Download className="h-3.5 w-3.5 text-amber-400" />
                              Download Still (for I2V)
                            </button>
                          )}

                          {selectedImage && (
                            <button
                              type="button"
                              onClick={() => generateVideos(selected.id)}
                              disabled={genVideos}
                              className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-purple-900/80 to-purple-800/80 hover:from-purple-800 hover:to-purple-700 text-purple-100 border border-purple-600/60 rounded-lg text-xs font-bold transition shadow-md disabled:opacity-50"
                              title="Turn this still image into a cinematic video clip with voiceover & motion in this app"
                            >
                              <Video className="h-3.5 w-3.5 text-purple-300" />
                              {genVideos ? "Animating Video…" : "🎬 Animate to Video"}
                            </button>
                          )}

                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f && selected) importMedia(selected.id, f); }}
                            />
                            <span className={`inline-flex items-center gap-2 px-3 py-2 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 rounded-lg text-xs border border-purple-800/50 font-medium transition shadow-sm ${importing === selected.id ? "opacity-50 pointer-events-none" : ""}`}>
                              <Video className="h-3.5 w-3.5 text-purple-400" />
                              {importing === selected.id ? "Importing…" : "Import MP4"}
                            </span>
                          </label>

                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f && selected) importMedia(selected.id, f); }}
                            />
                            <span className={`inline-flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-xs border border-zinc-700 font-medium transition shadow-sm ${importing === selected.id ? "opacity-50 pointer-events-none" : ""}`}>
                              <ImageIcon className="h-3.5 w-3.5 text-amber-400" />
                              {importing === selected.id ? "Importing…" : "Import Image"}
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
                          onClick={() => generateSingleShotImage(selected.id)}
                          disabled={singleGenImageShotId === selected.id}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 rounded-md text-xs font-semibold shadow-sm transition disabled:opacity-50"
                          title="Generate free 1080p FLUX.1 still image for this scene"
                        >
                          <Sparkles className={`h-3 w-3 text-amber-400 ${singleGenImageShotId === selected.id ? "animate-spin" : ""}`} />
                          <span>{singleGenImageShotId === selected.id ? "Generating…" : "Generate Still"}</span>
                        </button>
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

                    {/* Universal Physics Health Bar & Auto-Enhance Button */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-emerald-950/20 border border-emerald-800/40 rounded-lg text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <div className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Universal Physics Engine</span>
                        </div>
                        <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-700/50 font-mono">
                          Verified
                        </span>
                        {detectedEntities?.hasVehicleOrMount && (
                          <span className="text-[10px] bg-amber-950/70 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700/50 font-mono">
                            Front-Harness Locked
                          </span>
                        )}
                        {detectedEntities?.hasLocomotion && (
                          <span className="text-[10px] bg-blue-950/70 text-blue-300 px-1.5 py-0.5 rounded border border-blue-700/50 font-mono">
                            Skeletal Aligned
                          </span>
                        )}
                        {detectedEntities?.hasHandheldProp && (
                          <span className="text-[10px] bg-purple-950/70 text-purple-300 px-1.5 py-0.5 rounded border border-purple-700/50 font-mono">
                            Rigid Grip Anchored
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Credit Optimizer Mode Toggle */}
                        <button
                          type="button"
                          onClick={() => setCreditSaverMode(!creditSaverMode)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
                            creditSaverMode
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-600/70 hover:bg-emerald-900/60"
                              : "bg-purple-950/80 text-purple-300 border-purple-600/70 hover:bg-purple-900/60"
                          }`}
                          title={
                            creditSaverMode
                              ? "Credit Saver Mode: Generates with --mode std (10 credits/shot). Maximizes your 66 free daily credits to create 6+ videos daily!"
                              : "Pro Mode: Generates with --mode pro (25-35 credits/shot). Burns through credits faster."
                          }
                        >
                          <span>{creditSaverMode ? "🟢 10 Credits (Saver)" : "🟣 25+ Credits (Pro)"}</span>
                        </button>

                        <button
                          onClick={handleAutoEnhance}
                          disabled={isAutoEnhancing}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 rounded-md transition disabled:opacity-50"
                          title="Audit and automatically fortify this shot's kinematics and physical invariants"
                        >
                          {isAutoEnhancing ? (
                            <>
                              <RefreshCw className="h-3 w-3 animate-spin text-emerald-400" />
                              <span>Auditing Physics...</span>
                            </>
                          ) : enhanceSuccess ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                              <span>Physics Fortified!</span>
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3 text-emerald-400" />
                              <span>⚡ Auto-Enhance Physics</span>
                            </>
                          )}
                        </button>
                      </div>
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
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                          Screenplay &amp; Audio
                        </h3>
                        <span className="text-[11px] text-zinc-500 font-mono">S{selected.shotNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/projects/${projectId}/story`}
                          className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition"
                          title="Open full scene-by-scene script editor"
                        >
                          <span>Full Script Studio</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEditingShotScript()}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-zinc-700 text-[11px] font-semibold transition shadow-sm"
                        >
                          <Edit2 className="h-3 w-3 text-amber-400" />
                          <span>Edit Script</span>
                        </button>
                      </div>
                    </div>

                    {/* Action Description */}
                    <div>
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Visual Action</span>
                      <p className="text-zinc-200 text-xs leading-relaxed mt-0.5">{selected.actionDescription}</p>
                    </div>

                    {/* Spoken Dialogue (takes precedence when character is speaking) */}
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

                    {/* Narrator Voice-Over (Only rendered when no character dialogue is speaking) */}
                    {!selected.dialogue && selected.voiceover && (
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
      </div>

      {/* Edit Shot Script Modal */}
      {isEditingShotScript && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-zinc-100">
                  Edit Script Beat · Shot {selected.shotNumber} (Scene {selectedScene?.sceneNumber ?? 1})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingShotScript(false)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-300 mb-1">Visual Action (English)</label>
                <textarea
                  rows={3}
                  value={editShotAction}
                  onChange={e => setEditShotAction(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:border-amber-500 focus:outline-none leading-relaxed font-sans"
                  placeholder="Describe visual action..."
                />
              </div>

              <div>
                <label className="block font-semibold text-sky-400 mb-1">
                  Spoken Character Dialogue ({projectData?.storyLanguage || "Tamil"})
                </label>
                <textarea
                  rows={2}
                  value={editShotDialogue}
                  onChange={e => setEditShotDialogue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-sky-900/40 text-zinc-200 focus:border-sky-500 focus:outline-none leading-relaxed font-mono"
                  placeholder='e.g. [@Amma] speaks: "கார்த்தி! ஏன் இப்படி அலறிட்டே ஓடி வர்ற?!"'
                />
                <p className="text-[11px] text-zinc-500 mt-1">
                  When dialogue is specified, narrator voiceover is automatically suppressed.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-amber-400 mb-1">
                  Voice-Over (Narrator) ({projectData?.storyLanguage || "Tamil"})
                </label>
                <textarea
                  rows={2}
                  value={editShotVoiceover}
                  onChange={e => setEditShotVoiceover(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-amber-900/40 text-zinc-200 focus:border-amber-500 focus:outline-none leading-relaxed font-serif italic"
                  placeholder='Narrator voiceover beat (used only when no character is speaking dialogue)'
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Camera Movement</label>
                  <input
                    type="text"
                    value={editShotCameraMotion}
                    onChange={e => setEditShotCameraMotion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:border-amber-500 focus:outline-none font-mono"
                    placeholder="e.g. Dynamic low-angle tracking shot..."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-zinc-400 mb-1">Sound Atmosphere &amp; Foley</label>
                  <input
                    type="text"
                    value={editShotAudioPrompt}
                    onChange={e => setEditShotAudioPrompt(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 focus:border-amber-500 focus:outline-none font-mono"
                    placeholder="e.g. Rustling leaves, panting..."
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-3 border-t border-zinc-800 bg-zinc-900/80">
              <Button variant="ghost" size="sm" onClick={() => setIsEditingShotScript(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                loading={savingShotScript}
                onClick={saveShotScript}
                className="bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                <Save className="h-3.5 w-3.5 mr-1" /> Save Shot Script
              </Button>
            </div>
          </div>
        </div>
      )}

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
