"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Users,
  Clapperboard,
  Video,
  Rocket,
  ChevronRight,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Film,
  X,
  Share2,
  ExternalLink,
  Image as ImageIcon,
  Wand2,
  Layers,
  Zap,
  MessageSquare,
  Music,
  ShieldCheck,
  Flame,
  Smartphone,
  Monitor,
  Sliders,
  Type,
  Palette,
  Star,
  Upload,
  Quote,
} from "lucide-react";
import { generateSocialLaunchKit } from "@/lib/story/launch-kit";
import { SeriesEpisodeBar } from "@/components/series/SeriesEpisodeBar";

export type WorkflowStepId = "overview" | "script" | "assets" | "storyboard" | "editor" | "launch";

interface ProjectWorkflowNavProps {
  projectId: string;
  activeStep: WorkflowStepId;
  projectTitle?: string;
  visualStyle?: string;
  rightAction?: React.ReactNode;
}

export function ProjectWorkflowNav({
  projectId,
  activeStep,
  projectTitle,
  visualStyle = "PHOTOREALISTIC_CINEMATIC",
  rightAction,
}: ProjectWorkflowNavProps) {
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const [latestExport, setLatestExport] = useState<any>(null);
  const [loadingExport, setLoadingExport] = useState(false);

  // Social Launch Kit & Thumbnail State
  const [launchKit, setLaunchKit] = useState<any>(null);
  const [launchPlatformTab, setLaunchPlatformTab] = useState<"youtube" | "instagram" | "thumbnail">("youtube");
  const [thumbnailRatio, setThumbnailRatio] = useState<"16:9" | "9:16">("16:9");
  const [thumbnail, setThumbnail] = useState<any>(null);
  const [approvedMasterUrl, setApprovedMasterUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [selectedImageSource, setSelectedImageSource] = useState<"approved-master" | "uploaded" | "ai-generated">("approved-master");
  const [thumbnailStyle, setThumbnailStyle] = useState<"OBJECT_COOKING_HOOK" | "CURIOSITY_SHOCK" | "EPIC_CINEMATIC" | "DRAMATIC_CONFLICT">("OBJECT_COOKING_HOOK");

  // Layer 1: Main Headline
  const [thumbnailHeadline, setThumbnailHeadline] = useState<string>("DO NOT EAT THIS!");
  const [showHeadlineOverlay, setShowHeadlineOverlay] = useState<boolean>(true);
  const [headlineStyle, setHeadlineStyle] = useState<"viral-header" | "caution-badge" | "clean-impact" | "black-tag">("viral-header");
  const [headlineSize, setHeadlineSize] = useState<"hero" | "large" | "medium" | "compact">("hero");
  const [headlineYOffset, setHeadlineYOffset] = useState<number>(4);
  const [overlayPosition, setOverlayPosition] = useState<"top-center" | "top-right" | "top-left" | "center" | "bottom-center">("top-center");
  const [overlayTheme, setOverlayTheme] = useState<"fire-gradient" | "electric-yellow" | "caution-red" | "pure-white" | "neon-green">("fire-gradient");
  const [fontFamily, setFontFamily] = useState<"impact" | "sans" | "mono">("impact");

  // Layer 2: Secondary Quote / Subtitle / Tag
  const [showQuoteOverlay, setShowQuoteOverlay] = useState<boolean>(true);
  const [quoteText, setQuoteText] = useState<string>("⌨️ CRUNCHY KEYBOARD");
  const [quoteStyle, setQuoteStyle] = useState<"caution-badge" | "viral-header" | "black-tag" | "clean-impact">("caution-badge");
  const [quoteSize, setQuoteSize] = useState<"large" | "medium" | "compact" | "small">("compact");
  const [quoteYOffset, setQuoteYOffset] = useState<number>(82);
  const [quotePosition, setQuotePosition] = useState<"bottom-center" | "bottom-left" | "bottom-right" | "top-right" | "top-left" | "top-center">("bottom-center");
  const [quoteTheme, setQuoteTheme] = useState<"hazard-yellow" | "caution-red" | "pure-white" | "carbon-black">("hazard-yellow");

  // Right-side Editor Sub-Tab: "headline" | "quote" | "prompt"
  const [thumbEditorSubTab, setThumbEditorSubTab] = useState<"headline" | "quote" | "prompt">("headline");

  const [includeHeadlineInPrompt, setIncludeHeadlineInPrompt] = useState<boolean>(false);
  const [generatingThumbnail, setGeneratingThumbnail] = useState<boolean>(false);
  const [thumbnailError, setThumbnailError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!projectId) return;
    // Fetch project details for launch metadata
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.project) {
          setProjectData(d.data.project);
          if (d.data.project.aspectRatio === "PORTRAIT_9_16") {
            setThumbnailRatio("9:16");
          }
        }
      })
      .catch(() => {});
  }, [projectId]);

  async function openLaunchKit() {
    setShowLaunchModal(true);
    setLoadingExport(true);
    try {
      // 1. Fetch export
      const seqRes = await fetch(`/api/projects/${projectId}/sequences`).then((r) => r.json());
      const firstSeq = seqRes.data?.sequences?.[0];
      if (firstSeq) {
        const expRes = await fetch(`/api/sequences/${firstSeq.id}/export`).then((r) => r.json());
        const successful = (expRes.data?.exports || []).find((e: any) => e.status === "SUCCEEDED");
        if (successful) {
          setLatestExport(successful);
        }
      }
      // 2. Fetch thumbnail & launch kit
      const thumbRes = await fetch(`/api/projects/${projectId}/thumbnail`);
      const thumbJson = await thumbRes.json();
      const resData = thumbJson.data || thumbJson;
      if (resData) {
        if (resData.approvedMasterUrl) {
          setApprovedMasterUrl(resData.approvedMasterUrl);
        }
        if (resData.thumbnail) {
          setThumbnail(resData.thumbnail);
          if (resData.thumbnail.headlineText) setThumbnailHeadline(resData.thumbnail.headlineText);
          if (resData.thumbnail.headlineStyle) setHeadlineStyle(resData.thumbnail.headlineStyle);
          if (resData.thumbnail.headlineSize) setHeadlineSize(resData.thumbnail.headlineSize);
          if (typeof resData.thumbnail.headlineYOffset === "number") setHeadlineYOffset(resData.thumbnail.headlineYOffset);
          if (resData.thumbnail.overlayPosition) setOverlayPosition(resData.thumbnail.overlayPosition);
          if (resData.thumbnail.overlayTheme) setOverlayTheme(resData.thumbnail.overlayTheme);
          if (resData.thumbnail.fontFamily) setFontFamily(resData.thumbnail.fontFamily);
          if (resData.thumbnail.style) setThumbnailStyle(resData.thumbnail.style);
          if (resData.thumbnail.aspectRatio) setThumbnailRatio(resData.thumbnail.aspectRatio);
          if (resData.thumbnail.selectedImageSource) {
            setSelectedImageSource(resData.thumbnail.selectedImageSource);
          } else if (resData.approvedMasterUrl) {
            setSelectedImageSource("approved-master");
          }
        } else if (resData.approvedMasterUrl) {
          setSelectedImageSource("approved-master");
        }
        if (resData.launchKit) {
          setLaunchKit(resData.launchKit);
        }
      }
    } catch (e) {
      console.error("Failed to load exports for launch kit", e);
    } finally {
      setLoadingExport(false);
    }
  }

  async function handleGenerateThumbnail() {
    setGeneratingThumbnail(true);
    setThumbnailError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/thumbnail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          style: thumbnailStyle,
          aspectRatio: thumbnailRatio,
          headlineText: thumbnailHeadline,
          headlineStyle,
          headlineSize,
          headlineYOffset,
          overlayPosition,
          overlayTheme,
          fontFamily,
        }),
      });
      const d = await res.json();
      const resData = d.data || d;
      if (!res.ok || (d.error && !resData.thumbnail)) {
        throw new Error(d.error?.message || d.message || "Failed to generate thumbnail");
      }
      if (resData.thumbnail) {
        setThumbnail(resData.thumbnail);
        setSelectedImageSource("ai-generated");
      }
      if (resData.launchKit) setLaunchKit(resData.launchKit);
    } catch (err: any) {
      setThumbnailError(err.message || "Thumbnail generation error");
    } finally {
      setGeneratingThumbnail(false);
    }
  }

  function copyToClipboard(text: string, fieldId: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setUploadedImageUrl(dataUrl);
        setSelectedImageSource("uploaded");
        setThumbnailError(null);
      }
    };
    reader.readAsDataURL(file);
  }

  const activeImageUrl =
    selectedImageSource === "uploaded" && uploadedImageUrl
      ? uploadedImageUrl
      : selectedImageSource === "approved-master" && approvedMasterUrl
      ? approvedMasterUrl
      : (thumbnail?.thumbnailUrl || approvedMasterUrl);

  async function downloadCompositedThumbnail() {
    const targetUrl = activeImageUrl;
    if (!targetUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = targetUrl;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth || (thumbnailRatio === "9:16" ? 720 : 1280);
      canvas.height = img.naturalHeight || (thumbnailRatio === "9:16" ? 1280 : 720);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw background image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      function drawCanvasLayer(
        text: string,
        style: string,
        size: string,
        yOffsetPercent: number,
        position: string,
        theme: string,
        font: string,
        isSecondLayer: boolean = false
      ) {
        if (!ctx || !text.trim()) return;
        const upperText = text.trim();
        const isPortrait = canvas.height > canvas.width;

        let sizeMultiplier = 0.085;
        if (size === "hero") sizeMultiplier = isPortrait ? 0.11 : 0.09;
        else if (size === "large") sizeMultiplier = isPortrait ? 0.085 : 0.07;
        else if (size === "medium") sizeMultiplier = isPortrait ? 0.065 : 0.052;
        else if (size === "compact") sizeMultiplier = isPortrait ? 0.048 : 0.038;
        else if (size === "small") sizeMultiplier = isPortrait ? 0.038 : 0.028;

        const fontSize = Math.max(16, Math.round(canvas.width * sizeMultiplier));
        const fontName =
          font === "impact"
            ? 'Impact, "Arial Black", sans-serif'
            : font === "mono"
            ? 'ui-monospace, "Courier New", monospace'
            : 'system-ui, -apple-system, sans-serif';

        ctx.font = `900 ${fontSize}px ${fontName}`;
        const posY = Math.round(canvas.height * (yOffsetPercent / 100));

        let posX = canvas.width / 2;
        let textAlign: CanvasTextAlign = "center";
        let rotation = 0;

        if (position === "top-left" || position === "bottom-left") {
          posX = canvas.width * 0.05;
          textAlign = "left";
          if (style === "caution-badge") rotation = isSecondLayer ? -0.03 : 0.03;
        } else if (position === "top-right" || position === "bottom-right") {
          posX = canvas.width * 0.95;
          textAlign = "right";
          if (style === "caution-badge") rotation = isSecondLayer ? 0.03 : -0.03;
        }

        if (style === "viral-header") {
          ctx.save();
          ctx.textAlign = textAlign;
          ctx.textBaseline = "middle";

          const gradient = ctx.createLinearGradient(0, posY - fontSize * 0.5, 0, posY + fontSize * 0.5);
          if (theme === "fire-gradient") {
            gradient.addColorStop(0, "#FFF700");
            gradient.addColorStop(0.45, "#FF8800");
            gradient.addColorStop(1, "#E11D48");
          } else if (theme === "electric-yellow" || theme === "hazard-yellow") {
            gradient.addColorStop(0, "#FFFF66");
            gradient.addColorStop(1, "#FACC15");
          } else if (theme === "caution-red") {
            gradient.addColorStop(0, "#FF6B6B");
            gradient.addColorStop(1, "#DC2626");
          } else if (theme === "neon-green") {
            gradient.addColorStop(0, "#86EFAC");
            gradient.addColorStop(1, "#16A34A");
          } else {
            gradient.addColorStop(0, "#FFFFFF");
            gradient.addColorStop(1, "#CBD5E1");
          }

          // Halo glow
          ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
          ctx.shadowBlur = Math.round(fontSize * 0.22);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;

          // Black stroke
          ctx.strokeStyle = "#000000";
          ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.16));
          ctx.lineJoin = "round";
          ctx.miterLimit = 2;
          ctx.strokeText(upperText, posX, posY);

          // Second crisp pass
          ctx.shadowColor = "transparent";
          ctx.strokeText(upperText, posX, posY);

          // Fill
          ctx.fillStyle = gradient;
          ctx.fillText(upperText, posX, posY);
          ctx.restore();

        } else if (style === "caution-badge") {
          const paddingX = fontSize * 0.5;
          const paddingY = fontSize * 0.28;
          const metrics = ctx.measureText(upperText);
          const boxWidth = metrics.width + paddingX * 2;
          const boxHeight = fontSize + paddingY * 2;

          let boxLeft = posX - boxWidth / 2;
          if (textAlign === "left") boxLeft = posX;
          else if (textAlign === "right") boxLeft = posX - boxWidth;

          ctx.save();
          ctx.translate(boxLeft + boxWidth / 2, posY);
          if (rotation !== 0) ctx.rotate(rotation);

          // Box shadow
          ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
          ctx.shadowBlur = Math.round(fontSize * 0.3);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = Math.round(fontSize * 0.1);

          // Box fill
          if (theme === "caution-red") ctx.fillStyle = "#DC2626";
          else if (theme === "pure-white") ctx.fillStyle = "#FFFFFF";
          else if (theme === "carbon-black") ctx.fillStyle = "#0A0A0A";
          else ctx.fillStyle = "#FACC15";

          ctx.fillRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);

          // Box stroke
          ctx.shadowColor = "transparent";
          ctx.strokeStyle = theme === "carbon-black" ? "#F59E0B" : "#000000";
          ctx.lineWidth = Math.max(2.5, Math.round(fontSize * 0.08));
          ctx.strokeRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight);

          // Text
          ctx.fillStyle =
            theme === "caution-red" || theme === "carbon-black" ? "#FFFFFF" : "#000000";
          if (theme === "carbon-black") ctx.fillStyle = "#FBBF24";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(upperText, 0, 0);
          ctx.restore();

        } else if (style === "black-tag") {
          const paddingX = fontSize * 0.55;
          const paddingY = fontSize * 0.28;
          const metrics = ctx.measureText(upperText);
          const boxWidth = metrics.width + paddingX * 2;
          const boxHeight = fontSize + paddingY * 2;

          let boxLeft = posX - boxWidth / 2;
          if (textAlign === "left") boxLeft = posX;
          else if (textAlign === "right") boxLeft = posX - boxWidth;

          ctx.save();
          ctx.translate(boxLeft + boxWidth / 2, posY);

          ctx.fillStyle = "rgba(10, 10, 10, 0.88)";
          ctx.beginPath();
          const r = boxHeight / 2;
          ctx.roundRect(-boxWidth / 2, -boxHeight / 2, boxWidth, boxHeight, r);
          ctx.fill();

          ctx.strokeStyle = "rgba(251, 191, 36, 0.8)";
          ctx.lineWidth = Math.max(2, Math.round(fontSize * 0.06));
          ctx.stroke();

          ctx.fillStyle = "#FBBF24";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(upperText, 0, 0);
          ctx.restore();

        } else {
          // clean-impact
          ctx.save();
          ctx.textAlign = textAlign;
          ctx.textBaseline = "middle";

          ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
          ctx.shadowBlur = Math.round(fontSize * 0.25);
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = Math.round(fontSize * 0.08);

          ctx.fillStyle =
            theme === "caution-red"
              ? "#EF4444"
              : theme === "electric-yellow" || theme === "hazard-yellow"
              ? "#FACC15"
              : theme === "neon-green"
              ? "#22C55E"
              : theme === "fire-gradient"
              ? "#FF9900"
              : "#FFFFFF";

          ctx.fillText(upperText, posX, posY);
          ctx.restore();
        }
      }

      // Draw Layer 1 (Headline)
      if (showHeadlineOverlay && thumbnailHeadline.trim()) {
        drawCanvasLayer(
          thumbnailHeadline,
          headlineStyle,
          headlineSize,
          headlineYOffset,
          overlayPosition,
          overlayTheme,
          fontFamily,
          false
        );
      }

      // Draw Layer 2 (Quote / Subtitle)
      if (showQuoteOverlay && quoteText.trim()) {
        drawCanvasLayer(
          quoteText,
          quoteStyle,
          quoteSize,
          quoteYOffset,
          quotePosition,
          quoteTheme,
          fontFamily,
          true
        );
      }

      // Download
      const a = document.createElement("a");
      a.download = `thumbnail_viral_${thumbnailRatio.replace(":", "x")}_${projectId}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
  }

  // Format visual style label for header badge
  const styleLabel = visualStyle
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  // 5-Step Production Workflow
  const steps = [
    {
      id: "script" as WorkflowStepId,
      number: "1",
      label: "Script",
      sublabel: "Story & Dialogue",
      href: `/projects/${projectId}/story`,
      icon: FileText,
    },
    {
      id: "assets" as WorkflowStepId,
      number: "2",
      label: "Assets",
      sublabel: "Characters & Bible",
      href: `/projects/${projectId}/bible`,
      icon: Users,
    },
    {
      id: "storyboard" as WorkflowStepId,
      number: "3",
      label: "Storyboard",
      sublabel: "Prompts & Stills",
      href: `/projects/${projectId}/storyboard`,
      icon: Clapperboard,
    },
    {
      id: "editor" as WorkflowStepId,
      number: "4",
      label: "Video Studio",
      sublabel: "Timeline Editor",
      href: `/projects/${projectId}/edit`,
      icon: Video,
    },
    {
      id: "launch" as WorkflowStepId,
      number: "5",
      label: "YouTube Launch",
      sublabel: "Export & Publish",
      href: `/projects/${projectId}/edit?view=export`,
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        openLaunchKit();
      },
      icon: Rocket,
    },
  ];

  // Derive Next step button
  const nextStepMap: Record<WorkflowStepId, { label: string; href: string; action?: () => void }> = {
    overview: { label: "1. Start Script →", href: `/projects/${projectId}/story` },
    script: { label: "Next: Assets (Bible) →", href: `/projects/${projectId}/bible` },
    assets: { label: "Next: Storyboard →", href: `/projects/${projectId}/storyboard` },
    storyboard: { label: "Next: Video Studio →", href: `/projects/${projectId}/edit` },
    editor: { label: "5. YouTube Launch 🚀", href: `/projects/${projectId}/edit?view=export`, action: openLaunchKit },
    launch: { label: "← Back to Studio", href: `/projects/${projectId}/edit` },
  };

  const nextStep = nextStepMap[activeStep];

  // Base Project Details
  const cleanTitle = projectData?.title || projectTitle || "AI Film Project";
  const youtubeDescription = `🎬 "${cleanTitle}" - Created with CineFlow AI Filmmaking Studio.

📖 STORY SYNOPSIS:
${projectData?.description || projectData?.sourceIdea || "An exciting cinematic story brought to life with generative AI."}

✨ PRODUCTION SPECS:
- Visual Style: ${styleLabel}
- Audio & Dialogue: ${projectData?.dialogueMode || "Native Dialogue & Narration"}
- Format: ${projectData?.aspectRatio === "PORTRAIT_9_16" ? "9:16 Shorts / Vertical Video (1080x1920)" : "16:9 Cinematic Widescreen (1920x1080)"}
- AI Pipeline: FrameForge AI · Google Flow (Veo) · FLUX.1 · FFmpeg

#AIFilm #GenerativeAI #ShortFilm #CinematicAI #GoogleFlow #Veo #Filmmaking`;

  const youtubeTags = `${cleanTitle}, AI Film, Generative Video, Google Flow, Veo, AI Director, Cinematic AI, Tamil Short Film, NextGen Cinema`;

  // Derive Active Launch Kit (combines fetched kit with instant client fallback)
  const activeKit = launchKit || (projectData ? generateSocialLaunchKit(projectData) : null);
  const displayYtTitles = activeKit?.youtube?.titles || [
    `${cleanTitle} | Official AI Cinematic Short Film`,
    `I Cooked a Mechanical Keyboard into a 5-Star Meal (Oddly Satisfying ASMR)`,
    `Cooking a Mechanical Keyboard... And It Sizzles! 🍳⌨️ #ASMR`,
  ];
  const displayYtDesc = activeKit?.youtube?.description || youtubeDescription;
  const displayYtTags = activeKit?.youtube?.tags || youtubeTags;
  const rawHeadlineText = thumbnailHeadline.replace(/^[⚠️🚫\s]+/, "").trim() || "DO NOT EAT THIS!";
  const rawQuoteText = quoteText.replace(/^[⚠️🚫\s]+/, "").trim();
  const displayPrompt = thumbnailRatio === "9:16"
    ? (includeHeadlineInPrompt
        ? (activeKit?.thumbnailPrompts?.portrait9x16WithHeadline || "").replace("DO NOT EAT THIS!", rawHeadlineText)
        : (activeKit?.thumbnailPrompts?.portrait9x16 || ""))
    : (includeHeadlineInPrompt
        ? (activeKit?.thumbnailPrompts?.landscape16x9WithHeadline || "").replace("DO NOT EAT THIS!", rawHeadlineText)
        : (activeKit?.thumbnailPrompts?.landscape16x9 || ""));

  const getHeadlineFontSizeRem = (size: string) => {
    switch (size) {
      case "hero": return "clamp(1.5rem, 6.2vw, 2.5rem)";
      case "large": return "clamp(1.2rem, 4.8vw, 1.95rem)";
      case "medium": return "clamp(0.95rem, 3.6vw, 1.45rem)";
      case "compact": return "clamp(0.78rem, 2.8vw, 1.15rem)";
      default: return "clamp(1.2rem, 4.8vw, 1.95rem)";
    }
  };

  const getQuoteFontSizeRem = (size: string) => {
    switch (size) {
      case "large": return "clamp(1.1rem, 4.2vw, 1.6rem)";
      case "medium": return "clamp(0.9rem, 3.3vw, 1.3rem)";
      case "compact": return "clamp(0.75rem, 2.6vw, 1.05rem)";
      case "small": return "clamp(0.62rem, 2.1vw, 0.85rem)";
      default: return "clamp(0.75rem, 2.6vw, 1.05rem)";
    }
  };

  return (
    <>
      {/* Top Workflow Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-2.5 shadow-xs">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Project Branding & Return */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/projects/${projectId}`}
              className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-amber-600 hover:bg-slate-200 transition shadow-xs"
              title="Return to Project Dashboard"
            >
              <Film className="h-4 w-4" />
            </Link>
            <div>
              <Link
                href={`/projects/${projectId}`}
                className="text-sm font-bold text-slate-900 hover:text-amber-600 transition flex items-center gap-1.5 truncate max-w-[180px] sm:max-w-xs md:max-w-sm"
              >
                <span>{cleanTitle}</span>
              </Link>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                <span>CineFlow Studio</span>
                <span>·</span>
                <span className="text-amber-600 font-semibold capitalize">
                  {activeStep === "overview" ? "Production Hub" : `${steps.find((s) => s.id === activeStep)?.label} Stage`}
                </span>
              </div>
            </div>

            {projectData?.series && (
              <div className="hidden sm:block pl-2 border-l border-slate-200">
                <SeriesEpisodeBar
                  currentProjectId={projectId}
                  series={projectData.series}
                  currentEpisodeNumber={projectData.episodeNumber}
                />
              </div>
            )}
          </div>

          {/* Center: 5-Step Order of Workflow (Script -> Assets -> Storyboard -> Video Studio -> YouTube Launch) */}
          <nav className="order-last lg:order-none w-full lg:w-auto flex items-center justify-center overflow-x-auto py-1">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
              {steps.map((step) => {
                const isActive = activeStep === step.id;
                const Icon = step.icon;

                return (
                  <Link
                    key={step.id}
                    href={step.href}
                    onClick={step.onClick}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-xl flex items-center gap-2 transition text-xs whitespace-nowrap ${
                      isActive
                        ? "bg-white text-blue-700 border border-slate-200 shadow-xs font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60 font-medium"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono ${
                        isActive ? "text-blue-600 font-bold" : "text-slate-400"
                      }`}
                    >
                      {step.number}.
                    </span>
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        isActive ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <span>{step.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Right: Visual Style Badge & Next Step Action */}
          <div className="flex items-center gap-2.5 shrink-0 ml-auto lg:ml-0">
            {/* Visual Style Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-mono">
              <span className="text-slate-400">Style:</span>
              <span className="text-slate-900 font-bold">{styleLabel}</span>
            </div>

            {/* Custom Right Action (e.g. 2 Story Options button or Shot planner) */}
            {rightAction}

            {/* Next Step Quick-Jump Button */}
            {nextStep && activeStep !== "launch" && (
              nextStep.action ? (
                <button
                  type="button"
                  onClick={nextStep.action}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <span>{nextStep.label}</span>
                </button>
              ) : (
                <Link
                  href={nextStep.href}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <span>{nextStep.label}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              )
            )}
          </div>

        </div>
      </header>

      {/* 5. YouTube Launch & Film Export Kit Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col text-slate-900">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    5. YouTube Launch &amp; Film Export Kit
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-semibold">
                      Final Master
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Download your master rendered MP4 and copy pre-formatted launch metadata for YouTube, Shorts &amp; TikTok.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* 1. Master Film Export Preview / Download */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Film className="h-4 w-4 text-amber-500" /> Master Video Status
                  </span>
                  {latestExport ? (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono flex items-center gap-1 font-semibold">
                      <Check className="h-3 w-3" /> Rendered &amp; Ready
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-mono font-semibold">
                      Ready to Render in Video Studio
                    </span>
                  )}
                </div>

                {latestExport?.outputPath ? (
                  <div className="space-y-3">
                    <video
                      controls
                      src={`/api/media/file?path=${encodeURIComponent(latestExport.outputPath)}`}
                      className="w-full max-h-72 rounded-xl bg-black object-contain border border-slate-200 shadow-xs"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-xs text-slate-500 font-mono">
                        <span>File: {latestExport.outputFilename || "master_film.mp4"}</span>
                        {latestExport.outputFileSize && (
                          <span> · {(latestExport.outputFileSize / (1024 * 1024)).toFixed(1)} MB</span>
                        )}
                      </div>
                      <a
                        href={`/api/media/file?path=${encodeURIComponent(latestExport.outputPath)}`}
                        download={latestExport.outputFilename || "master_film.mp4"}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download 1080p Master MP4</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Assemble all scene clips and VO audio tracks in the Video Studio, then click &ldquo;Render Master MP4&rdquo; to produce the final export.
                    </p>
                    <Link
                      href={`/projects/${projectId}/edit`}
                      onClick={() => setShowLaunchModal(false)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-xs"
                    >
                      <Video className="h-4 w-4" />
                      <span>Open Video Studio &amp; Render</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Platform Selector Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLaunchPlatformTab("youtube")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      launchPlatformTab === "youtube"
                        ? "bg-red-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Film className="h-3.5 w-3.5" />
                    <span>YouTube Launch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaunchPlatformTab("instagram")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      launchPlatformTab === "instagram"
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Instagram Reels</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLaunchPlatformTab("thumbnail")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                      launchPlatformTab === "thumbnail"
                        ? "bg-amber-500 text-slate-950 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>AI Thumbnail Studio</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Zero-Ingestion ASMR Guard Active</span>
                </div>
              </div>

              {/* TAB 1: YOUTUBE LAUNCH SUITE */}
              {launchPlatformTab === "youtube" && (
                <div className="space-y-4">
                  {/* Title Options */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      <span>High-CTR YouTube Title Options (1-Click Copy)</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {displayYtTitles.map((titleOpt: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 hover:border-slate-300 transition"
                        >
                          <span className="font-medium truncate">{titleOpt}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(titleOpt, `yt-title-${idx}`)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 text-[11px] font-semibold shrink-0 flex items-center gap-1 transition"
                          >
                            {copiedField === `yt-title-${idx}` ? (
                              <>
                                <Check className="h-3 w-3 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3 w-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* AI Thumbnail Prompt Card (Front & Center!) */}
                  <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="h-4 w-4 text-amber-600" />
                        <span className="text-xs font-bold text-slate-900">
                          AI Thumbnail Prompt (Google Flow / Midjourney / FLUX)
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-semibold">
                          {thumbnailRatio === "9:16" ? "9:16 Shorts/Reels" : "16:9 Landscape"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Aspect Ratio Toggle */}
                        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px]">
                          <button
                            type="button"
                            onClick={() => setThumbnailRatio("9:16")}
                            className={`px-2 py-0.5 rounded font-bold transition ${
                              thumbnailRatio === "9:16" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            9:16 Shorts
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbnailRatio("16:9")}
                            className={`px-2 py-0.5 rounded font-bold transition ${
                              thumbnailRatio === "16:9" ? "bg-amber-500 text-slate-950 shadow-xs" : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            16:9 Video
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(displayPrompt, "hero-thumb-prompt")}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-xs transition"
                        >
                          {copiedField === "hero-thumb-prompt" ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy AI Prompt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      readOnly
                      value={displayPrompt}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-[11px] text-slate-800 font-mono leading-relaxed focus:outline-none select-all"
                    />
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                      <label className="flex items-center gap-1.5 cursor-pointer text-amber-900 font-medium">
                        <input
                          type="checkbox"
                          checked={includeHeadlineInPrompt}
                          onChange={(e) => setIncludeHeadlineInPrompt(e.target.checked)}
                          className="rounded border-amber-300 text-amber-600 focus:ring-0"
                        />
                        <span>Include Viral Headline Directive (&ldquo;{rawHeadlineText}&rdquo;) in Prompt</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setLaunchPlatformTab("thumbnail")}
                        className="text-amber-700 font-semibold hover:underline flex items-center gap-0.5 ml-auto"
                      >
                        <span>Open Customizer Studio &amp; Preview →</span>
                      </button>
                    </div>
                  </div>

                  {/* YouTube Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        YouTube Description (With Inedible Disclaimer, Timestamps &amp; Foley Notes)
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(displayYtDesc, "yt-desc")}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono transition"
                      >
                        {copiedField === "yt-desc" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Description</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={8}
                      readOnly
                      value={displayYtDesc}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none select-all"
                    />
                  </div>

                  {/* YouTube Tags */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        SEO Search Keywords &amp; Tags
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(displayYtTags, "yt-tags")}
                        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono transition"
                      >
                        {copiedField === "yt-tags" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Tags</span>
                          </>
                        )}
                      </button>
                    </div>
                    <input
                      type="text"
                      readOnly
                      value={displayYtTags}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none select-all"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: INSTAGRAM REELS SUITE */}
              {launchPlatformTab === "instagram" && (
                <div className="space-y-4">
                  {/* Reel Caption */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-pink-600" />
                        <span>High-Retention Reel Caption (Hook + Menu Vote)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(launchKit?.instagram?.caption || "", "ig-caption")}
                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-mono transition"
                      >
                        {copiedField === "ig-caption" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Caption</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={6}
                      readOnly
                      value={launchKit?.instagram?.caption || ""}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono leading-relaxed focus:outline-none select-all"
                    />
                  </div>

                  {/* Audio & Pinned Comment Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                      <span className="text-[11px] font-bold text-purple-900 uppercase font-mono flex items-center gap-1">
                        <Music className="h-3.5 w-3.5 text-purple-600" />
                        <span>Recommended Audio Track:</span>
                      </span>
                      <p className="text-xs text-purple-950 font-medium">
                        {launchKit?.instagram?.audioRecommendation || "Original Audio · ASMR Wok Sizzle & Click"}
                      </p>
                      <p className="text-[10px] text-purple-700">
                        Pair with crisp mechanical foley audio for maximum algorithm push.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-pink-50/60 border border-pink-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-pink-900 uppercase font-mono flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5 text-pink-600" />
                          <span>Pinned Comment:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(launchKit?.instagram?.pinnedComment || "", "ig-comment")}
                          className="text-[10px] text-pink-700 font-semibold hover:underline flex items-center gap-1"
                        >
                          {copiedField === "ig-comment" ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <p className="text-xs text-pink-950 font-medium">
                        {launchKit?.instagram?.pinnedComment || "Menu Vote: Comment what to cook next! 👇"}
                      </p>
                    </div>
                  </div>

                  {/* Viral Hashtags */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800">
                        25+ Curated Viral Instagram Hashtags
                      </label>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(launchKit?.instagram?.hashtags || "", "ig-tags")}
                        className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 font-mono transition"
                      >
                        {copiedField === "ig-tags" ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Hashtags</span>
                          </>
                        )}
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      readOnly
                      value={launchKit?.instagram?.hashtags || ""}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-mono focus:outline-none select-all"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: THUMBNAIL STUDIO & AI PROMPTS */}
              {launchPlatformTab === "thumbnail" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/20 p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600">
                        <ImageIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          High-CTR Thumbnail Studio &amp; AI Prompts
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-mono font-semibold">
                            {thumbnailRatio === "9:16" ? "720×1280 (9:16)" : "1280×720 (16:9)"} · Free FLUX.1
                          </span>
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Dual-handed hook composition engineered for maximum click-through-rate.
                        </p>
                      </div>
                    </div>

                    {/* Aspect Ratio Toggle */}
                    <div className="flex items-center gap-1 p-1 bg-white rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setThumbnailRatio("16:9")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                          thumbnailRatio === "16:9"
                            ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Monitor className="h-3 w-3" />
                        <span>16:9 YouTube</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setThumbnailRatio("9:16")}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition ${
                          thumbnailRatio === "9:16"
                            ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <Smartphone className="h-3 w-3" />
                        <span>9:16 Shorts/Reels</span>
                      </button>
                    </div>
                  </div>

                  {thumbnailError && (
                    <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between">
                      <span>{thumbnailError}</span>
                      <button
                        type="button"
                        onClick={() => setThumbnailError(null)}
                        className="p-1 hover:bg-red-100 rounded text-red-800 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Hidden file input for uploading custom thumbnail images */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  {/* 2-Column Studio Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Left: Thumbnail Preview & Overlay */}
                    <div className="space-y-3">
                      {/* Image Source Segmented Switcher */}
                      <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                        {approvedMasterUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedImageSource("approved-master");
                              setThumbnailError(null);
                            }}
                            className={`flex-1 min-w-[120px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                              selectedImageSource === "approved-master"
                                ? "bg-amber-500 text-slate-950 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                            }`}
                          >
                            <Star className="h-3.5 w-3.5 fill-amber-950/20" />
                            <span>⭐ Master Chef</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                            selectedImageSource === "uploaded"
                              ? "bg-amber-500 text-slate-950 shadow-xs"
                              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                          }`}
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>📁 {uploadedImageUrl ? "Custom Image" : "Upload Image"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImageSource("ai-generated");
                            setThumbnailError(null);
                          }}
                          className={`flex-1 min-w-[110px] py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                            selectedImageSource === "ai-generated"
                              ? "bg-amber-500 text-slate-950 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>AI FLUX</span>
                        </button>
                      </div>

                      {/* Main Preview Container */}
                      <div
                        className={`relative w-full rounded-2xl bg-slate-950 border border-slate-200 overflow-hidden shadow-md flex items-center justify-center select-none ${
                          thumbnailRatio === "9:16" ? "aspect-[9/16] max-h-[440px] mx-auto" : "aspect-video"
                        }`}
                      >
                        {activeImageUrl ? (
                          <>
                            <img
                              src={activeImageUrl}
                              alt="Thumbnail Preview"
                              className="w-full h-full object-cover"
                            />

                            {/* LAYER 1: MAIN HEADLINE */}
                            {showHeadlineOverlay && thumbnailHeadline.trim() && (
                              <div
                                style={{
                                  top: overlayPosition !== "bottom-center" ? `${headlineYOffset}%` : undefined,
                                  bottom: overlayPosition === "bottom-center" ? `${100 - headlineYOffset}%` : undefined,
                                  ...(overlayPosition === "top-center" || overlayPosition === "bottom-center" || overlayPosition === "center"
                                    ? { left: "50%", transform: "translateX(-50%)" }
                                    : overlayPosition === "top-left"
                                    ? { left: "4%" }
                                    : { right: "4%" }),
                                  maxWidth: "92%",
                                }}
                                className="absolute pointer-events-none select-none text-center z-20 flex justify-center items-center"
                              >
                                {headlineStyle === "viral-header" && (
                                  <span
                                    style={{
                                      fontFamily:
                                        fontFamily === "impact"
                                          ? 'Impact, "Arial Black", sans-serif'
                                          : fontFamily === "mono"
                                          ? 'ui-monospace, "Courier New", monospace'
                                          : 'system-ui, -apple-system, sans-serif',
                                      fontSize: getHeadlineFontSizeRem(headlineSize),
                                      backgroundImage:
                                        overlayTheme === "fire-gradient"
                                          ? "linear-gradient(180deg, #FFF700 0%, #FF8800 45%, #E11D48 100%)"
                                          : overlayTheme === "electric-yellow"
                                          ? "linear-gradient(180deg, #FFFF55 0%, #FACC15 100%)"
                                          : overlayTheme === "caution-red"
                                          ? "linear-gradient(180deg, #FF6B6B 0%, #DC2626 100%)"
                                          : overlayTheme === "neon-green"
                                          ? "linear-gradient(180deg, #86EFAC 0%, #16A34A 100%)"
                                          : "linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 100%)",
                                      WebkitBackgroundClip: "text",
                                      WebkitTextFillColor: "transparent",
                                      WebkitTextStroke: headlineSize === "hero" ? "2.5px #000000" : "1.8px #000000",
                                      filter:
                                        "drop-shadow(0 0 12px rgba(255, 255, 255, 0.9)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.95))",
                                      letterSpacing: "0.04em",
                                    }}
                                    className="font-black uppercase inline-block whitespace-nowrap leading-none select-none transform transition-transform"
                                  >
                                    {thumbnailHeadline}
                                  </span>
                                )}

                                {headlineStyle === "caution-badge" && (
                                  <div
                                    style={{
                                      fontFamily:
                                        fontFamily === "impact"
                                          ? 'Impact, "Arial Black", sans-serif'
                                          : fontFamily === "mono"
                                          ? 'ui-monospace, monospace'
                                          : 'system-ui, -apple-system, sans-serif',
                                      fontSize: getHeadlineFontSizeRem(headlineSize),
                                      padding:
                                        headlineSize === "hero"
                                          ? "0.38rem 1.15rem"
                                          : headlineSize === "large"
                                          ? "0.3rem 0.9rem"
                                          : headlineSize === "medium"
                                          ? "0.22rem 0.65rem"
                                          : "0.15rem 0.45rem",
                                      borderWidth:
                                        headlineSize === "hero" ? "3.5px" : headlineSize === "large" ? "3px" : "2px",
                                      borderRadius: headlineSize === "hero" ? "0.5rem" : "0.375rem",
                                      transform:
                                        overlayPosition === "top-left"
                                          ? "rotate(2.5deg)"
                                          : overlayPosition === "top-right"
                                          ? "rotate(-2.5deg)"
                                          : "rotate(0deg)",
                                    }}
                                    className={`font-black uppercase tracking-tight shadow-2xl border-black select-none pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)] transition-all ${
                                      overlayTheme === "caution-red"
                                        ? "bg-red-600 text-white"
                                        : overlayTheme === "pure-white"
                                        ? "bg-white text-black"
                                        : "bg-yellow-400 text-black"
                                    }`}
                                  >
                                    {thumbnailHeadline}
                                  </div>
                                )}

                                {headlineStyle === "black-tag" && (
                                  <div
                                    style={{
                                      fontFamily:
                                        fontFamily === "impact"
                                          ? 'Impact, "Arial Black", sans-serif'
                                          : fontFamily === "mono"
                                          ? 'ui-monospace, monospace'
                                          : 'system-ui, -apple-system, sans-serif',
                                      fontSize: getHeadlineFontSizeRem(headlineSize),
                                      padding:
                                        headlineSize === "hero"
                                          ? "0.38rem 1.2rem"
                                          : headlineSize === "large"
                                          ? "0.28rem 0.9rem"
                                          : "0.2rem 0.65rem",
                                    }}
                                    className="rounded-full bg-black/90 border border-amber-400 text-amber-300 font-black uppercase tracking-wide shadow-2xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.95)]"
                                  >
                                    {thumbnailHeadline}
                                  </div>
                                )}

                                {headlineStyle === "clean-impact" && (
                                  <span
                                    style={{
                                      fontFamily:
                                        fontFamily === "impact"
                                          ? 'Impact, "Arial Black", sans-serif'
                                          : fontFamily === "mono"
                                          ? 'ui-monospace, monospace'
                                          : 'system-ui, -apple-system, sans-serif',
                                      fontSize: getHeadlineFontSizeRem(headlineSize),
                                      color:
                                        overlayTheme === "caution-red"
                                          ? "#EF4444"
                                          : overlayTheme === "electric-yellow"
                                          ? "#FACC15"
                                          : overlayTheme === "neon-green"
                                          ? "#22C55E"
                                          : overlayTheme === "fire-gradient"
                                          ? "#FF9900"
                                          : "#FFFFFF",
                                      textShadow: "0 2px 8px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)",
                                    }}
                                    className="font-black uppercase tracking-wider leading-none"
                                  >
                                    {thumbnailHeadline}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* LAYER 2: SECONDARY QUOTE / SUBTITLE / STICKER */}
                            {showQuoteOverlay && quoteText.trim() && (
                              <div
                                style={{
                                  top: quotePosition.startsWith("top") ? `${quoteYOffset}%` : undefined,
                                  bottom: !quotePosition.startsWith("top") ? `${100 - quoteYOffset}%` : undefined,
                                  ...(quotePosition === "bottom-center" || quotePosition === "top-center"
                                    ? { left: "50%", transform: "translateX(-50%)" }
                                    : quotePosition === "bottom-left" || quotePosition === "top-left"
                                    ? { left: "4%" }
                                    : { right: "4%" }),
                                  maxWidth: "90%",
                                }}
                                className="absolute pointer-events-none select-none text-center z-20 flex justify-center items-center"
                              >
                                {quoteStyle === "caution-badge" && (
                                  <div
                                    style={{
                                      fontFamily:
                                        fontFamily === "impact"
                                          ? 'Impact, "Arial Black", sans-serif'
                                          : 'system-ui, -apple-system, sans-serif',
                                      fontSize: getQuoteFontSizeRem(quoteSize),
                                      padding:
                                        quoteSize === "large"
                                          ? "0.28rem 0.85rem"
                                          : quoteSize === "medium"
                                          ? "0.2rem 0.65rem"
                                          : "0.14rem 0.45rem",
                                      borderWidth: "2px",
                                      borderRadius: "0.375rem",
                                      transform:
                                        quotePosition === "bottom-left"
                                          ? "rotate(-2deg)"
                                          : quotePosition === "bottom-right"
                                          ? "rotate(2deg)"
                                          : "rotate(0deg)",
                                    }}
                                    className={`font-black uppercase tracking-tight shadow-xl border-black select-none pointer-events-none drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] transition-all ${
                                      quoteTheme === "caution-red"
                                        ? "bg-red-600 text-white"
                                        : quoteTheme === "pure-white"
                                        ? "bg-white text-black"
                                        : quoteTheme === "carbon-black"
                                        ? "bg-black text-amber-400 border-amber-400"
                                        : "bg-yellow-400 text-black"
                                    }`}
                                  >
                                    {quoteText}
                                  </div>
                                )}

                                {quoteStyle === "black-tag" && (
                                  <div
                                    style={{
                                      fontFamily:
                                        fontFamily === "impact"
                                          ? 'Impact, "Arial Black", sans-serif'
                                          : 'system-ui, -apple-system, sans-serif',
                                      fontSize: getQuoteFontSizeRem(quoteSize),
                                      padding: "0.2rem 0.75rem",
                                    }}
                                    className="rounded-full bg-black/90 border border-amber-400 text-amber-300 font-black uppercase tracking-wide shadow-xl drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]"
                                  >
                                    {quoteText}
                                  </div>
                                )}

                                {quoteStyle === "viral-header" && (
                                  <span
                                    style={{
                                      fontFamily: 'Impact, "Arial Black", sans-serif',
                                      fontSize: getQuoteFontSizeRem(quoteSize),
                                      backgroundImage:
                                        "linear-gradient(180deg, #FFF700 0%, #FF8800 45%, #E11D48 100%)",
                                      WebkitBackgroundClip: "text",
                                      WebkitTextFillColor: "transparent",
                                      WebkitTextStroke: "1.5px #000000",
                                      filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.9))",
                                    }}
                                    className="font-black uppercase leading-none"
                                  >
                                    {quoteText}
                                  </span>
                                )}

                                {quoteStyle === "clean-impact" && (
                                  <span
                                    style={{
                                      fontSize: getQuoteFontSizeRem(quoteSize),
                                      color:
                                        quoteTheme === "caution-red"
                                          ? "#EF4444"
                                          : quoteTheme === "pure-white"
                                          ? "#FFFFFF"
                                          : "#FACC15",
                                      textShadow: "0 2px 6px rgba(0,0,0,0.95)",
                                    }}
                                    className="font-black uppercase tracking-wider leading-none"
                                  >
                                    {quoteText}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Dimension Pill */}
                            <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm text-[10px] font-mono text-zinc-300 border border-zinc-700">
                              {thumbnailRatio === "9:16" ? "720 × 1280 (9:16)" : "1280 × 720 (16:9)"}
                            </div>

                            {/* Source Pill */}
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-amber-500/90 text-slate-950 font-bold text-[10px] shadow-xs">
                              {selectedImageSource === "approved-master"
                                ? "⭐ Master Chef"
                                : selectedImageSource === "uploaded"
                                ? "📁 Custom Image"
                                : "🤖 FLUX.1"}
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6 space-y-2 text-slate-400">
                            <Zap className="h-8 w-8 text-amber-500/60 mx-auto" />
                            <p className="text-xs text-slate-300 font-medium">
                              No thumbnail loaded yet.
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Upload an image or generate free with AI.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Download & Actions Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleGenerateThumbnail}
                          disabled={generatingThumbnail}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs shadow-xs flex items-center gap-1.5 transition disabled:opacity-50"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{generatingThumbnail ? "Rendering AI..." : "Re-Generate AI"}</span>
                        </button>

                        {activeImageUrl && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={downloadCompositedThumbnail}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs transition shadow-xs flex items-center gap-1.5"
                              title="Download master thumbnail with custom headline & quote burned in"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Download Master (With Graphics)</span>
                            </button>
                            <a
                              href={activeImageUrl}
                              download={`thumbnail_raw_${thumbnailRatio.replace(":", "x")}_${projectId}.jpg`}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition flex items-center gap-1"
                              title="Download clean raw image without text"
                            >
                              <span>Raw</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Full Multi-Layer Customizer Controls */}
                    <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                      
                      {/* Editor Sub-Tab Navigation */}
                      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
                        <button
                          type="button"
                          onClick={() => setThumbEditorSubTab("headline")}
                          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                            thumbEditorSubTab === "headline"
                              ? "bg-amber-500 text-slate-950 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Type className="h-3.5 w-3.5" />
                          <span>1. Main Headline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbEditorSubTab("quote")}
                          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                            thumbEditorSubTab === "quote"
                              ? "bg-amber-500 text-slate-950 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Quote className="h-3.5 w-3.5" />
                          <span>2. Quote / Subtitle</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setThumbEditorSubTab("prompt")}
                          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                            thumbEditorSubTab === "prompt"
                              ? "bg-amber-500 text-slate-950 shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>3. AI Prompt</span>
                        </button>
                      </div>

                      {/* SUB-TAB 1: MAIN HEADLINE CONTROLS */}
                      {thumbEditorSubTab === "headline" && (
                        <div className="space-y-3">
                          {/* Text input with toggle */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700 uppercase font-mono tracking-wider flex items-center gap-1">
                                <Type className="h-3.5 w-3.5 text-amber-600" />
                                <span>Headline Text (Type Any Words):</span>
                              </label>
                              <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={showHeadlineOverlay}
                                  onChange={(e) => setShowHeadlineOverlay(e.target.checked)}
                                  className="rounded border-slate-300 bg-white text-amber-500 focus:ring-0"
                                />
                                <span>Show on Thumbnail</span>
                              </label>
                            </div>

                            <input
                              type="text"
                              value={thumbnailHeadline}
                              onChange={(e) => setThumbnailHeadline(e.target.value)}
                              placeholder='Type any headline e.g. "DO NOT EAT THIS!"'
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 font-bold transition"
                            />

                            {/* Quick Helper Chips */}
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {[
                                "DO NOT EAT THIS!",
                                "⚠️ DANGEROUS DISH!",
                                "🚫 100% INEDIBLE!",
                                "🍳 500°F WOK STIR-FRY",
                                "⌨️ CRUNCHY KEYBOARD",
                                "🎧 BINAURAL CRUNCH",
                              ].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => {
                                    setThumbnailHeadline(preset);
                                    setShowHeadlineOverlay(true);
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition border ${
                                    thumbnailHeadline === preset && showHeadlineOverlay
                                      ? "bg-amber-100 border-amber-400 text-amber-950 shadow-xs"
                                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                  }`}
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Style Mode Selector */}
                          <div>
                            <span className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                              Headline Style:
                            </span>
                            <div className="grid grid-cols-4 gap-1 text-[11px]">
                              {[
                                { id: "viral-header" as const, label: "🔥 Viral YT" },
                                { id: "caution-badge" as const, label: "⚠️ Sticker" },
                                { id: "black-tag" as const, label: "🏷️ Black Tag" },
                                { id: "clean-impact" as const, label: "⚪ Clean" },
                              ].map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => setHeadlineStyle(st.id)}
                                  className={`py-1.5 rounded-xl text-center font-bold transition border ${
                                    headlineStyle === st.id
                                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                  }`}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Font Size & Position */}
                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <span className="block text-slate-600 font-mono mb-1 font-semibold">Font Size:</span>
                              <div className="grid grid-cols-2 gap-1">
                                {(["hero", "large", "medium", "compact"] as const).map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => setHeadlineSize(sz)}
                                    className={`py-1 rounded-lg text-center font-bold capitalize transition border ${
                                      headlineSize === sz
                                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                    }`}
                                  >
                                    {sz === "hero" ? "Hero (Huge)" : sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="block text-slate-600 font-mono mb-1 font-semibold">Position:</span>
                              <div className="grid grid-cols-2 gap-1">
                                {[
                                  { id: "top-center" as const, label: "Top-Center" },
                                  { id: "top-right" as const, label: "Top-Right" },
                                  { id: "top-left" as const, label: "Top-Left" },
                                  { id: "bottom-center" as const, label: "Bottom" },
                                ].map((pos) => (
                                  <button
                                    key={pos.id}
                                    type="button"
                                    onClick={() => setOverlayPosition(pos.id)}
                                    className={`py-1 rounded-lg text-center font-bold transition border ${
                                      overlayPosition === pos.id
                                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                    }`}
                                  >
                                    {pos.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Vertical Nudge Slider (Y-Offset) */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-slate-700 font-bold flex items-center gap-1">
                                <Sliders className="h-3 w-3 text-amber-600" />
                                <span>Vertical Position (Y-Offset):</span>
                              </span>
                              <span className="text-amber-700 font-bold">{headlineYOffset}%</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={90}
                              step={1}
                              value={headlineYOffset}
                              onChange={(e) => setHeadlineYOffset(Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>1% (Top Edge)</span>
                              <span className="text-amber-800 font-semibold">4-6% (Safe above goggles)</span>
                              <span>90% (Bottom)</span>
                            </div>
                          </div>

                          {/* Color Theme & Font Family */}
                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <span className="block text-slate-600 font-mono mb-1 font-semibold">Color Theme:</span>
                              <div className="grid grid-cols-2 gap-1">
                                {[
                                  { id: "fire-gradient" as const, label: "🔥 Fiery" },
                                  { id: "electric-yellow" as const, label: "⚡ Yellow" },
                                  { id: "caution-red" as const, label: "🛑 Red" },
                                  { id: "pure-white" as const, label: "⚪ White" },
                                ].map((th) => (
                                  <button
                                    key={th.id}
                                    type="button"
                                    onClick={() => setOverlayTheme(th.id)}
                                    className={`py-1 rounded-lg text-center font-bold transition border ${
                                      overlayTheme === th.id
                                        ? "bg-slate-900 text-amber-400 border-slate-900 shadow-xs"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                    }`}
                                  >
                                    {th.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="block text-slate-600 font-mono mb-1 font-semibold">Font Style:</span>
                              <div className="grid grid-cols-1 gap-1">
                                {[
                                  { id: "impact" as const, label: "Impact (Viral YT)" },
                                  { id: "sans" as const, label: "Modern Bold Sans" },
                                ].map((f) => (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setFontFamily(f.id)}
                                    className={`py-1 rounded-lg text-center font-bold transition border ${
                                      fontFamily === f.id
                                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                    }`}
                                  >
                                    {f.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 2: SECONDARY QUOTE / SUBTITLE CONTROLS */}
                      {thumbEditorSubTab === "quote" && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-700 uppercase font-mono tracking-wider flex items-center gap-1">
                                <Quote className="h-3.5 w-3.5 text-amber-600" />
                                <span>Secondary Quote / Subtitle Text:</span>
                              </label>
                              <label className="flex items-center gap-1 text-[11px] text-slate-600 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={showQuoteOverlay}
                                  onChange={(e) => setShowQuoteOverlay(e.target.checked)}
                                  className="rounded border-slate-300 bg-white text-amber-500 focus:ring-0"
                                />
                                <span>Show Quote</span>
                              </label>
                            </div>

                            <input
                              type="text"
                              value={quoteText}
                              onChange={(e) => setQuoteText(e.target.value)}
                              placeholder='Type any secondary quote e.g. "“THE CRUNCH WAS INSANE”"'
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-amber-500 font-bold transition"
                            />

                            {/* Quote Idea Chips */}
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {[
                                "“THE CRUNCH WAS INSANE”",
                                "100% INEDIBLE",
                                "500°F WOK SIZZLE",
                                "⚠️ DO NOT ATTEMPT",
                                "ASMR CRUNCH",
                                "KEYBOARD STIR-FRY",
                              ].map((chip) => (
                                <button
                                  key={chip}
                                  type="button"
                                  onClick={() => {
                                    setQuoteText(chip);
                                    setShowQuoteOverlay(true);
                                  }}
                                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition border ${
                                    quoteText === chip && showQuoteOverlay
                                      ? "bg-amber-100 border-amber-400 text-amber-950 shadow-xs"
                                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                  }`}
                                >
                                  {chip}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Quote Style Selector */}
                          <div>
                            <span className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                              Quote Style:
                            </span>
                            <div className="grid grid-cols-4 gap-1 text-[11px]">
                              {[
                                { id: "caution-badge" as const, label: "⚠️ Sticker" },
                                { id: "black-tag" as const, label: "🏷️ Black Pill" },
                                { id: "viral-header" as const, label: "🔥 Gradient" },
                                { id: "clean-impact" as const, label: "⚪ Subtitle" },
                              ].map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => setQuoteStyle(st.id)}
                                  className={`py-1.5 rounded-xl text-center font-bold transition border ${
                                    quoteStyle === st.id
                                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                  }`}
                                >
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Quote Size & Position */}
                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <span className="block text-slate-600 font-mono mb-1 font-semibold">Quote Size:</span>
                              <div className="grid grid-cols-2 gap-1">
                                {(["large", "medium", "compact", "small"] as const).map((sz) => (
                                  <button
                                    key={sz}
                                    type="button"
                                    onClick={() => setQuoteSize(sz)}
                                    className={`py-1 rounded-lg text-center font-bold capitalize transition border ${
                                      quoteSize === sz
                                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                    }`}
                                  >
                                    {sz}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="block text-slate-600 font-mono mb-1 font-semibold">Quote Position:</span>
                              <div className="grid grid-cols-2 gap-1">
                                {[
                                  { id: "bottom-center" as const, label: "Bottom-Center" },
                                  { id: "bottom-left" as const, label: "Bottom-Left" },
                                  { id: "bottom-right" as const, label: "Bottom-Right" },
                                  { id: "top-right" as const, label: "Top-Right" },
                                ].map((pos) => (
                                  <button
                                    key={pos.id}
                                    type="button"
                                    onClick={() => setQuotePosition(pos.id)}
                                    className={`py-1 rounded-lg text-center font-bold transition border ${
                                      quotePosition === pos.id
                                        ? "bg-amber-500 text-slate-950 border-amber-500 shadow-xs"
                                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                    }`}
                                  >
                                    {pos.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Vertical Nudge Slider (Y-Offset) for Quote */}
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-slate-700 font-bold flex items-center gap-1">
                                <Sliders className="h-3 w-3 text-amber-600" />
                                <span>Quote Vertical Position (Y-Offset):</span>
                              </span>
                              <span className="text-amber-700 font-bold">{quoteYOffset}%</span>
                            </div>
                            <input
                              type="range"
                              min={1}
                              max={95}
                              step={1}
                              value={quoteYOffset}
                              onChange={(e) => setQuoteYOffset(Number(e.target.value))}
                              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                            />
                            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                              <span>1% (Top)</span>
                              <span className="text-amber-800 font-semibold">80-85% (Bottom Center above edge)</span>
                              <span>95% (Bottom Edge)</span>
                            </div>
                          </div>

                          {/* Quote Theme */}
                          <div>
                            <span className="block text-[11px] font-bold text-slate-700 uppercase font-mono mb-1">
                              Quote Badge Theme:
                            </span>
                            <div className="grid grid-cols-4 gap-1 text-[11px]">
                              {[
                                { id: "hazard-yellow" as const, label: "⚡ Yellow" },
                                { id: "caution-red" as const, label: "🛑 Red" },
                                { id: "carbon-black" as const, label: "⬛ Black" },
                                { id: "pure-white" as const, label: "⚪ White" },
                              ].map((th) => (
                                <button
                                  key={th.id}
                                  type="button"
                                  onClick={() => setQuoteTheme(th.id)}
                                  className={`py-1.5 rounded-xl text-center font-bold transition border ${
                                    quoteTheme === th.id
                                      ? "bg-slate-900 text-amber-400 border-slate-900 shadow-xs"
                                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
                                  }`}
                                >
                                  {th.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SUB-TAB 3: AI PROMPT FOR GOOGLE FLOW */}
                      {thumbEditorSubTab === "prompt" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold text-slate-800 uppercase font-mono tracking-wider">
                              Verified AI Prompt ({thumbnailRatio}):
                            </label>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(displayPrompt, "ai-thumb-prompt")}
                              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono transition"
                            >
                              {copiedField === "ai-thumb-prompt" ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-semibold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" />
                                  <span>Copy Prompt</span>
                                </>
                              )}
                            </button>
                          </div>

                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-900 font-medium">
                            <input
                              type="checkbox"
                              checked={includeHeadlineInPrompt}
                              onChange={(e) => setIncludeHeadlineInPrompt(e.target.checked)}
                              className="rounded border-amber-300 text-amber-600 focus:ring-0"
                            />
                            <span>Include Headline Directive (&ldquo;{rawHeadlineText}&rdquo;) in Prompt for Google Flow</span>
                          </label>

                          <textarea
                            rows={8}
                            readOnly
                            value={displayPrompt}
                            className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-800 font-mono leading-relaxed select-all focus:outline-none"
                          />
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* 6. Production Pipeline Completion Checklist */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                  AI Production Pipeline Checklist:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> 1. Screenplay &amp; Dialogues crafted
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> 2. Character &amp; Wardrobe consistency locked
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> 3. Google Flow / Veo prompts generated
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-medium">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> 4. Free FLUX.1 stills &amp; shots ready
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50">
              <span className="text-[11px] text-slate-500 font-mono">
                CineFlow AI Filmmaking Studio · Step 5 of 5
              </span>
              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

