import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Camera, Download, X, Loader2, Trash2 } from "lucide-react";
import leprechaunImg from "@/assets/leprechaun.png";

interface PhotoEditorProps {
  partyId: string;
  partyName: string;
  onClose: () => void;
}

const STICKERS = [
  { emoji: "☘️", label: "Shamrock" },
  { emoji: "leprechaun", label: "Leprechaun", isImage: true },
  { emoji: "🌈", label: "Rainbow" },
  { emoji: "🍺", label: "Beer" },
  { emoji: "🍷", label: "Wine" },
];

interface PartyPhoto {
  id: string;
  storage_path: string;
  created_at: string;
}

interface PlacedSticker {
  id: number;
  emoji: string;
  isImage?: boolean;
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
  const [photos, setPhotos] = useState<PartyPhoto[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from("party_photos")
        .select("id, storage_path, created_at")
        .eq("party_id", partyId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setPhotos(data);
      }
      setLoadingPhotos(false);
    };
    fetchPhotos();
  }, [partyId]);

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("party-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDeletePhoto = async (photo: PartyPhoto) => {
    setDeletingId(photo.id);
    try {
      const { error: storageError } = await supabase.storage
        .from("party-photos")
        .remove([photo.storage_path]);
      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("party_photos")
        .delete()
        .eq("id", photo.id);
      if (dbError) throw dbError;

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
      toast.success("Photo deleted 🗑️");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete photo");
    }
    setDeletingId(null);
  };

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

  const addSticker = (emoji: string, isImage?: boolean) => {
    if (!image) {
      toast.error("Upload a photo first!");
      return;
    }
    setStickers((prev) => [
      ...prev,
      {
        id: Date.now(),
        emoji,
        isImage,
        x: 75 + Math.random() * 12,
        y: 75 + Math.random() * 12,
        size: 48 + Math.random() * 16,
        rotation: 15 + Math.random() * 20,
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

        const stickerPromises = stickers.map((sticker) => {
          return new Promise<void>((res) => {
            const x = (sticker.x / 100) * canvas.width;
            const y = (sticker.y / 100) * canvas.height;
            const stickerSize = (sticker.size / 100) * Math.min(canvas.width, canvas.height) * 0.15;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate((sticker.rotation * Math.PI) / 180);

            if (sticker.isImage) {
              const sImg = new Image();
              sImg.crossOrigin = "anonymous";
              sImg.onload = () => {
                ctx.drawImage(sImg, -stickerSize / 2, -stickerSize / 2, stickerSize, stickerSize);
                ctx.restore();
                res();
              };
              sImg.onerror = () => { ctx.restore(); res(); };
              sImg.src = leprechaunImg;
            } else {
              ctx.font = `${stickerSize}px serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(sticker.emoji, 0, 0);
              ctx.restore();
              res();
            }
          });
        });

        Promise.all(stickerPromises).then(() => {
          canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
        });
      };
      img.src = displayImage;
    });
  }, [image, stickers]);

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

  const displayImage = image;

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
          {/* Party album (existing photos, host can delete) */}
          {!loadingPhotos && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                Party album
              </h3>
              {photos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No photos yet! Add the first one below.
                </p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border"
                    >
                      <img
                        src={getPhotoUrl(photo.storage_path)}
                        alt="Party photo"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <button
                        onClick={() => handleDeletePhoto(photo)}
                        disabled={deletingId === photo.id}
                        className="absolute top-1 right-1 rounded-full bg-foreground/50 text-primary-foreground p-1 hover:bg-destructive transition-colors disabled:opacity-50"
                        title="Delete photo"
                      >
                        {deletingId === photo.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
              {stickers.map((sticker) => (
                  <motion.button
                    key={sticker.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute cursor-pointer hover:scale-110 transition-transform"
                    style={{
                      left: `${sticker.x}%`,
                      top: `${sticker.y}%`,
                      fontSize: sticker.isImage ? undefined : `${sticker.size}px`,
                      width: sticker.isImage ? `${sticker.size}px` : undefined,
                      height: sticker.isImage ? `${sticker.size}px` : undefined,
                      transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                    }}
                    onClick={() => removeSticker(sticker.id)}
                    title="Click to remove"
                  >
                    {sticker.isImage ? (
                      <img src={leprechaunImg} alt="Leprechaun" className="w-full h-full object-contain" />
                    ) : sticker.emoji}
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
              <p className="text-sm text-muted-foreground mb-2">
                Tap to add stickers. Tap on placed stickers to remove.
              </p>
              <div className="flex flex-wrap gap-2">
                {STICKERS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => addSticker(s.emoji, s.isImage)}
                    className="flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-sm hover:border-primary/50 active:scale-95 transition-all"
                  >
                    <span className="text-lg">
                      {s.isImage ? <img src={leprechaunImg} alt="Leprechaun" className="h-5 w-5 inline" /> : s.emoji}
                    </span>
                    <span className="text-muted-foreground">{s.label}</span>
                  </button>
                ))}
                {stickers.length > 0 && (
                  <button
                    onClick={() => setStickers([])}
                    className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:text-destructive active:scale-95 transition-all"
                  >
                    Clear all
                  </button>
                )}
              </div>
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
