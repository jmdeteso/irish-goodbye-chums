import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Camera, Download, X, Loader2 } from "lucide-react";

interface PhotoEditorProps {
  partyId: string;
  partyName: string;
  onClose: () => void;
}

const STICKERS = [
  { emoji: "☘️", label: "Shamrock" },
  { emoji: "🧙‍♂️", label: "Leprechaun" },
  { emoji: "🌈", label: "Rainbow" },
  { emoji: "🍺", label: "Beer" },
  { emoji: "🍷", label: "Wine" },
];

interface PlacedSticker {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

const PhotoEditor = ({ partyId, partyName, onClose }: PhotoEditorProps) => {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [stickers, setStickers] = useState<PlacedSticker[]>([]);
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large! Max 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target?.result as string);
      setStickers([]);
    };
    reader.readAsDataURL(file);
  };

  const addSticker = (emoji: string) => {
    if (!image) {
      toast.error("Upload a photo first!");
      return;
    }
    setStickers((prev) => [
      ...prev,
      {
        id: Date.now(),
        emoji,
        x: 30 + Math.random() * 40,
        y: 30 + Math.random() * 40,
        size: 32 + Math.random() * 16,
        rotation: Math.random() * 40 - 20,
      },
    ]);
  };

  const removeSticker = (id: number) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const renderCanvas = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const displayImage = image;
    if (!displayImage) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        // Draw stickers
        if (!aiResult) {
          stickers.forEach((sticker) => {
            const x = (sticker.x / 100) * canvas.width;
            const y = (sticker.y / 100) * canvas.height;
            const fontSize = (sticker.size / 100) * Math.min(canvas.width, canvas.height) * 0.15;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((sticker.rotation * Math.PI) / 180);
            ctx.font = `${fontSize}px serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(sticker.emoji, 0, 0);
            ctx.restore();
          });
        }

        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
      };
      img.src = displayImage;
    });
  }, [image, aiResult, stickers]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const blob = await renderCanvas();
      if (!blob) throw new Error("Failed to render image");

      const fileName = `${partyId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("party-photos")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("party_photos").insert({
        party_id: partyId,
        user_id: user.id,
        storage_path: fileName,
      });

      if (dbError) throw dbError;

      toast.success("Photo saved to party album! 📸");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to save photo");
    }
    setSaving(false);
  };

  const handleDownload = async () => {
    const blob = await renderCanvas();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `irish-goodbye-${partyName.replace(/\s+/g, "-")}.jpg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Photo downloaded! 📥");
  };

  const displayImage = aiResult || image;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-foreground/60 flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-lg font-bold text-foreground">
            Party Pics 📸
          </h2>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4">
          {/* Image area */}
          {!displayImage ? (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors"
            >
              <Camera className="h-10 w-10 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">
                Upload a party photo
              </span>
            </button>
          ) : (
            <div ref={imageContainerRef} className="relative rounded-xl overflow-hidden">
              <img
                src={displayImage}
                alt="Party photo"
                className="w-full rounded-xl"
              />
              {/* Sticker overlays (visual only, for preview) */}
              {!aiResult &&
                stickers.map((sticker) => (
                  <motion.button
                    key={sticker.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      fontSize: `${sticker.size}px`,
                      transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                    }}
                    onClick={() => removeSticker(sticker.id)}
                    title="Click to remove"
                  >
                    {sticker.emoji}
                  </motion.button>
                ))}
              {/* Change photo button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute top-2 left-2 rounded-full bg-foreground/50 text-primary-foreground p-1.5 hover:bg-foreground/70 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Tabs */}
          {image && (
            <div className="mt-4">
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setActiveTab("stickers")}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === "stickers"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  ☘️ Stickers
                </button>
                <button
                  onClick={() => setActiveTab("ai")}
                  className={`flex-1 flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === "ai"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" /> AI Magic
                </button>
              </div>

              {activeTab === "stickers" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Tap to add stickers. Tap on placed stickers to remove.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {STICKERS.map((s) => (
                      <button
                        key={s.emoji}
                        onClick={() => addSticker(s.emoji)}
                        className="flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-sm hover:border-primary/50 active:scale-95 transition-all"
                      >
                        <span className="text-lg">{s.emoji}</span>
                        <span className="text-muted-foreground">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "ai" && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Let AI add Irish magic to your photo ✨
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {AI_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => handleAiEnhance(style.id)}
                        disabled={aiProcessing}
                        className="rounded-xl border border-border bg-card p-3 text-left hover:border-primary/50 active:scale-[0.98] transition-all disabled:opacity-50"
                      >
                        <div className="font-semibold text-foreground text-sm">
                          {style.label}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {style.description}
                        </div>
                      </button>
                    ))}
                  </div>
                  {aiProcessing && (
                    <div className="flex items-center justify-center gap-2 mt-4 text-sm text-primary">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding Irish magic...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {displayImage && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-2.5 text-sm font-semibold text-foreground hover:brightness-95 active:scale-95 transition-all"
              >
                <Download className="h-4 w-4" /> Download
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-irish px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save to Party 🍀"
                )}
              </button>
            </div>
          )}
        </div>

        {/* Hidden canvas for rendering */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </motion.div>
  );
};

export default PhotoEditor;
