import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Users, Trash2, Camera, Send } from "lucide-react";
import PhotoEditor from "@/components/PhotoEditor";
import { getRandomMessage } from "@/lib/contacts";

interface Party {
  id: string;
  name: string;
  share_code: string;
  is_active: boolean;
  created_at: string;
}

interface CheckedInFriend {
  friend_id: string;
  friends: { name: string; phone_number: string };
}

interface PartyCardProps {
  party: Party;
  onUpdate: () => void;
}

const PartyCard = ({ party, onUpdate }: PartyCardProps) => {
  const [checkinCount, setCheckinCount] = useState(0);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [checkedInFriends, setCheckedInFriends] = useState<CheckedInFriend[]>([]);
  const [goodbyeSent, setGoodbyeSent] = useState(false);

  useEffect(() => {
    fetchCheckins();
  }, [party.id]);

  const fetchCheckins = async () => {
    const { count } = await supabase
      .from("party_checkins")
      .select("*", { count: "exact", head: true })
      .eq("party_id", party.id);
    setCheckinCount(count ?? 0);
  };

  const fetchCheckedInFriends = async () => {
    const { data } = await supabase
      .from("party_checkins")
      .select("friend_id, friends(name, phone_number)")
      .eq("party_id", party.id);
    if (data) setCheckedInFriends(data as unknown as CheckedInFriend[]);
  };

  const shareLink = `${window.location.origin}/party/${party.share_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied! Share it with your mates 📋");
  };

  const handleIrishGoodbye = async () => {
    await fetchCheckedInFriends();
    setShowGoodbye(true);
  };

  const sendGoodbye = async (friend: CheckedInFriend) => {
    const message = getRandomMessage();
    const phone = friend.friends.phone_number.replace(/\D/g, "");

    // Try Web Share API first, fall back to SMS link
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Irish Goodbye 🍀",
          text: message,
        });
        return;
      } catch {
        // User cancelled or not supported, fall back
      }
    }

    // Fall back to SMS link
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, "_blank");
  };

  const sendAllGoodbyes = () => {
    // Build a combined message with all names
    const message = getRandomMessage();

    if (navigator.share) {
      navigator.share({
        title: "Irish Goodbye 🍀",
        text: message,
      }).catch(() => {
        // Fallback: open SMS to first friend
        if (checkedInFriends.length > 0) {
          const phone = checkedInFriends[0].friends.phone_number.replace(/\D/g, "");
          window.open(`sms:${phone}?body=${encodeURIComponent(message)}`, "_blank");
        }
      });
    } else if (checkedInFriends.length > 0) {
      const phones = checkedInFriends.map(f => f.friends.phone_number.replace(/\D/g, "")).join(",");
      window.open(`sms:${phones}?body=${encodeURIComponent(message)}`, "_blank");
    }

    setGoodbyeSent(true);
  };

  const deleteParty = async () => {
    const { error } = await supabase.from("parties").delete().eq("id", party.id);
    if (error) {
      toast.error("Failed to delete party");
    } else {
      toast.success("Party deleted");
      onUpdate();
    }
  };

  const formattedDate = new Date(party.created_at).toLocaleDateString("en-IE", {
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{party.name}</h3>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            <Users className="h-3.5 w-3.5" />
            {checkinCount} checked in
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {/* Irish Goodbye button - the star of the show */}
          {checkinCount > 0 && (
            <button
              onClick={handleIrishGoodbye}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-irish px-4 py-3 text-sm font-bold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all"
            >
              <Send className="h-4 w-4" /> Irish Goodbye 🍀
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground hover:brightness-95 active:scale-95 transition-all"
            >
              <Copy className="h-4 w-4" /> Copy Link
            </button>
            <button
              onClick={() => setShowPhotoEditor(true)}
              className="flex items-center justify-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-gold hover:brightness-110 active:scale-95 transition-all"
            >
              <Camera className="h-4 w-4" /> Pics
            </button>
            <button
              onClick={deleteParty}
              className="rounded-full p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete party"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Irish Goodbye modal */}
      <AnimatePresence>
        {showGoodbye && (
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
              className="w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6 text-center">
                {!goodbyeSent ? (
                  <>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-5xl mb-4"
                    >
                      🍀
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                      Ready for the Irish Exit?
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Send a wee leprechaun farewell to {checkedInFriends.length} mate{checkedInFriends.length !== 1 ? "s" : ""}
                    </p>

                    <div className="flex flex-col gap-2 mb-6">
                      {checkedInFriends.map((f) => (
                        <div
                          key={f.friend_id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2"
                        >
                          <span className="font-semibold text-foreground text-sm">{f.friends.name}</span>
                          <button
                            onClick={() => sendGoodbye(f)}
                            className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                          >
                            Send individually
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowGoodbye(false)}
                        className="flex-1 rounded-full bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground hover:brightness-95 transition-all"
                      >
                        Not yet...
                      </button>
                      <button
                        onClick={sendAllGoodbyes}
                        className="flex-1 rounded-full bg-gradient-irish px-4 py-3 text-sm font-bold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all"
                      >
                        Send to All 🍻
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="text-6xl mb-4"
                    >
                      🌈
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                      You've Done the Irish Exit!
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Slipped away like the mist over the hills. Well done! 💚
                    </p>
                    <button
                      onClick={() => {
                        setShowGoodbye(false);
                        setGoodbyeSent(false);
                      }}
                      className="rounded-full bg-gradient-irish px-6 py-3 text-sm font-bold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all"
                    >
                      Grand so! ☘️
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPhotoEditor && (
          <PhotoEditor
            partyId={party.id}
            partyName={party.name}
            onClose={() => setShowPhotoEditor(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default PartyCard;
