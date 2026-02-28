import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import leprechaun from "@/assets/leprechaun.png";
import { getRandomMessage } from "@/lib/contacts";
import { Check, Image as ImageIcon, Download } from "lucide-react";

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

    // Fetch friends, checkins, and photos in parallel
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

        {friends.length === 0 && (
          <p className="text-center py-8 text-muted-foreground">
            No friends added to this party yet. Tell the host to add some mates!
          </p>
        )}
      </main>
    </div>
  );
};

export default PartyCheckin;
