import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import leprechaun from "@/assets/leprechaun.png";
import { getRandomMessage } from "@/lib/contacts";
import { Check, Image as ImageIcon, Download, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STICKERS = [
  { emoji: "☘️", label: "Shamrock" },
  { emoji: "leprechaun", label: "Leprechaun", isImage: true },
  { emoji: "🌈", label: "Rainbow" },
  { emoji: "🍺", label: "Beer" },
  { emoji: "🍷", label: "Wine" },
];

interface PlacedSticker {
  id: number;
  emoji: string;
  isImage?: boolean;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface PartyData {
  id: string;
  name: string;
  user_id: string;
}

interface FriendOption {
  id: string;
  name: string;
}

interface PartyPhoto {
  id: string;
  storage_path: string;
}

const PartyCheckin = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [party, setParty] = useState<PartyData | null>(null);
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<PartyPhoto[]>([]);
  const [showPhotos, setShowPhotos] = useState(false);

  // Attendee photo upload state
  const [uploadImage, setUploadImage] = useState<string | null>(null);
  const [uploadStickers, setUploadStickers] = useState<PlacedSticker[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (shareCode) loadParty();
  }, [shareCode]);

  const loadParty = async () => {
    const { data: partyData } = await supabase
      .from("parties")
      .select("id, name, user_id")
      .eq("share_code", shareCode)
      .eq("is_active", true)
      .single();

    if (!partyData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setParty(partyData);

    const [friendsRes, checkinsRes, photosRes] = await Promise.all([
      supabase.from("friends").select("id, name").eq("user_id", partyData.user_id).order("name"),
      supabase.from("party_checkins").select("friend_id").eq("party_id", partyData.id),
      supabase.from("party_photos").select("id, storage_path").eq("party_id", partyData.id).order("created_at", { ascending: false }),
    ]);

    if (friendsRes.data) setFriends(friendsRes.data);
    if (checkinsRes.data) setCheckedIn(new Set(checkinsRes.data.map((c) => c.friend_id)));
    if (photosRes.data) setPhotos(photosRes.data);

    setLoading(false);
  };

  const handleCheckin = async (friendId: string) => {
    if (!party || checkedIn.has(friendId)) return;

    const { error } = await supabase.from("party_checkins").insert({
      party_id: party.id,
      friend_id: friendId,
    });

    if (error) return;

    setCheckedIn((prev) => new Set([...prev, friendId]));
    setJustCheckedIn(friendId);
    setMessage(getRandomMessage());
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("party-photos").getPublicUrl(path);
    return data.publicUrl;
  };

  // Attendee photo upload handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large! Max 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadImage(ev.target?.result as string);
      setUploadStickers([]);
    };
    reader.readAsDataURL(file);
  };

  const addSticker = (emoji: string, isImage?: boolean) => {
    if (!uploadImage) return;
    setUploadStickers((prev) => [
      ...prev,
      {
        id: Date.now(),
        emoji,
        isImage,
        x: 70 + Math.random() * 15,
        y: 70 + Math.random() * 15,
        size: 40 + Math.random() * 16,
        rotation: 15 + Math.random() * 20,
      },
    ]);
  };

  const renderCanvas = useCallback(async (): Promise<Blob | null> => {
    const canvas = canvasRef.current;
    if (!canvas || !uploadImage) return null;

    const img = new Image();
    img.crossOrigin = "anonymous";

    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);

        const stickerPromises = uploadStickers.map((sticker) => {
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
              sImg.src = leprechaun;
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
      img.src = uploadImage;
    });
  }, [uploadImage, uploadStickers]);

  const handleUploadSave = async () => {
    if (!party || !justCheckedIn) return;
    setUploading(true);

    try {
      const blob = await renderCanvas();
      if (!blob) throw new Error("Failed to render image");

      const fileName = `${party.id}/${Date.now()}-attendee.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("party-photos")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("party_photos").insert({
        party_id: party.id,
        friend_id: justCheckedIn,
        storage_path: fileName,
      });

      if (dbError) throw dbError;

      toast.success("Photo added to the party album! 📸");
      setUploadImage(null);
      setUploadStickers([]);
      // Refresh photos
      const { data: newPhotos } = await supabase
        .from("party_photos")
        .select("id, storage_path")
        .eq("party_id", party.id)
        .order("created_at", { ascending: false });
      if (newPhotos) setPhotos(newPhotos);
    } catch (err: any) {
      toast.error(err.message || "Failed to upload photo");
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.img
          src={leprechaun}
          alt="Loading"
          className="h-16 w-16"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 text-center">
        <img src={leprechaun} alt="Sad leprechaun" className="h-20 w-20 mb-4 opacity-50" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Party Not Found</h1>
        <p className="text-muted-foreground">
          This party link might have expired or doesn't exist. Ask your mate for a new one!
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-irish px-6 pb-8 pt-10 text-primary-foreground text-center">
        <motion.img
          src={leprechaun}
          alt="Leprechaun"
          className="h-16 w-16 mx-auto mb-3"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <h1 className="font-display text-3xl font-black">{party!.name}</h1>
        <p className="mt-2 text-primary-foreground/80">Tap your name to check in! 🍀</p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Photos toggle */}
        {photos.length > 0 && (
          <button
            onClick={() => setShowPhotos(!showPhotos)}
            className="w-full mb-4 flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-gold hover:brightness-110 active:scale-95 transition-all"
          >
            <ImageIcon className="h-4 w-4" />
            {showPhotos ? "Hide" : "View"} Party Pics ({photos.length}) 📸
          </button>
        )}

        {/* Photo gallery */}
        {showPhotos && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6 overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2">
              {photos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative group aspect-square rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
                >
                  <img
                    src={getPhotoUrl(photo.storage_path)}
                    alt={`Party photo ${i + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <a
                    href={getPhotoUrl(photo.storage_path)}
                    download={`party-photo-${i + 1}.jpg`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-foreground/70 px-2.5 py-1.5 text-xs font-semibold text-primary-foreground opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity active:scale-95"
                  >
                    <Download className="h-3.5 w-3.5" /> Save
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <h2 className="font-display text-lg font-bold text-foreground mb-4">Who are ye?</h2>

        <div className="flex flex-col gap-2">
          {friends.map((friend, i) => {
            const isChecked = checkedIn.has(friend.id);
            return (
              <motion.button
                key={friend.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleCheckin(friend.id)}
                disabled={isChecked}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                  isChecked
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-irish active:scale-[0.98]"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold ${
                    isChecked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isChecked ? <Check className="h-5 w-5" /> : friend.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <span className={`font-semibold ${isChecked ? "text-primary" : "text-foreground"}`}>
                  {friend.name}
                </span>
                {isChecked && <span className="ml-auto text-sm text-primary">Checked in ✓</span>}
              </motion.button>
            );
          })}
        </div>

        {justCheckedIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 rounded-xl bg-muted p-4"
          >
            <div className="flex items-start gap-3">
              <motion.img
                src={leprechaun}
                alt="Leprechaun"
                className="h-10 w-10 shrink-0"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: 2 }}
              />
              <p className="text-sm font-medium text-foreground leading-relaxed">{message}</p>
            </div>
          </motion.div>
        )}

        {/* Attendee photo upload — appears after check-in */}
        {justCheckedIn && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 rounded-xl border border-border bg-card p-4"
          >
            <h3 className="font-display text-base font-bold text-foreground mb-2">
              📸 Add a party pic!
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Snap a photo and add some Irish flair — it'll show up in the party album for everyone!
            </p>

            {!uploadImage ? (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground shadow-gold hover:brightness-110 active:scale-95 transition-all"
              >
                <Camera className="h-4 w-4" /> Take or Choose Photo
              </button>
            ) : (
              <>
                <div className="relative rounded-xl overflow-hidden mb-3">
                  <img src={uploadImage} alt="Your photo" className="w-full rounded-xl" />
                  {uploadStickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      className="absolute cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        left: `${sticker.x}%`,
                        top: `${sticker.y}%`,
                        fontSize: sticker.isImage ? undefined : `${sticker.size}px`,
                        width: sticker.isImage ? `${sticker.size}px` : undefined,
                        height: sticker.isImage ? `${sticker.size}px` : undefined,
                        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                      }}
                      onClick={() => setUploadStickers((prev) => prev.filter((s) => s.id !== sticker.id))}
                      title="Tap to remove"
                    >
                      {sticker.isImage ? (
                        <img src={leprechaun} alt="Leprechaun" className="w-full h-full object-contain" />
                      ) : sticker.emoji}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {STICKERS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => addSticker(s.emoji, s.isImage)}
                      className="flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-1 text-xs hover:border-primary/50 active:scale-95 transition-all"
                    >
                      <span className="text-base">
                        {s.isImage ? <img src={leprechaun} alt="Leprechaun" className="h-5 w-5 inline" /> : s.emoji}
                      </span>
                      <span className="text-muted-foreground">{s.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setUploadImage(null); setUploadStickers([]); }}
                    className="flex-1 rounded-full bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:brightness-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadSave}
                    disabled={uploading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-irish px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Album 🍀"}
                  </button>
                </div>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
            />
          </motion.div>
        )}

        {friends.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            No friends added to this party yet. Tell the host to add some mates!
          </p>
        )}
      </main>

      {/* Hidden canvas for rendering stickers onto image */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PartyCheckin;