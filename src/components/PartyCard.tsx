import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Users, Trash2, Camera, Send, Share2, Check, Crown } from "lucide-react";
import PhotoEditor from "@/components/PhotoEditor";
import { getRandomMessage, getRandomHostMessage } from "@/lib/contacts";

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
  const [checkedInFriends, setCheckedInFriends] = useState<CheckedInFriend[]>([]);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showGoodbye, setShowGoodbye] = useState(false);
  const [showCheckins, setShowCheckins] = useState(false);
  const [goodbyeSent, setGoodbyeSent] = useState(false);
  const [hostId, setHostId] = useState<string | null>(null);

  useEffect(() => {
    fetchCheckins();
  }, [party.id]);

  const fetchCheckins = async () => {
    const { data } = await supabase
      .from("party_checkins")
      .select("friend_id, friends(name, phone_number)")
      .eq("party_id", party.id);
    if (data) {
      const typed = data as unknown as CheckedInFriend[];
      setCheckedInFriends(typed);
      setCheckinCount(typed.length);
    }
  };

  const shareLink = `${window.location.origin}/party/${party.share_code}`;

  const sharePartyLink = async () => {
    const text = `🍀 Check in to ${party.name}! Tap the link so I know you're here: ${shareLink}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${party.name} — Irish Goodbye`, text });
        return;
      } catch {
        // User cancelled
      }
    }

    // Fallback: copy
    await navigator.clipboard.writeText(shareLink);
    toast.success("Link copied! Paste it in your group chat 📋");
  };

  const handleIrishGoodbye = () => {
    setShowGoodbye(true);
    setHostId(null);
    setGoodbyeSent(false);
  };

  const sendGoodbye = (friend: CheckedInFriend) => {
    const message = getRandomMessage();
    const phone = friend.friends.phone_number.replace(/\D/g, "");
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, "_blank");
  };

  const sendAllGoodbyes = () => {
    const message = getRandomMessage();
    const hostMessage = getRandomHostMessage();

    // Send host message separately if a host is selected
    if (hostId) {
      const host = checkedInFriends.find(f => f.friend_id === hostId);
      if (host) {
        const hostPhone = host.friends.phone_number.replace(/\D/g, "");
        window.open(`sms:${hostPhone}?body=${encodeURIComponent(hostMessage)}`, "_blank");
      }
    }

    // Send regular goodbye to non-host friends
    const nonHostFriends = checkedInFriends.filter(f => f.friend_id !== hostId);

    if (nonHostFriends.length > 0) {
      if (navigator.share) {
        navigator.share({
          title: "Irish Goodbye 🍀",
          text: message,
        }).catch(() => {
          const phones = nonHostFriends.map(f => f.friends.phone_number.replace(/\D/g, "")).join(",");
          window.open(`sms:${phones}?body=${encodeURIComponent(message)}`, "_blank");
        });
      } else {
        const phones = nonHostFriends.map(f => f.friends.phone_number.replace(/\D/g, "")).join(",");
        window.open(`sms:${phones}?body=${encodeURIComponent(message)}`, "_blank");
      }
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
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-display text-lg font-bold text-foreground">{party.name}</h3>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <button
            onClick={deleteParty}
            className="rounded-full p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete party"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Status / progress section */}
        {checkinCount === 0 ? (
          /* Step 1: No one checked in yet — prompt to share */
          <div className="mb-3 rounded-lg bg-secondary/10 border border-secondary/30 p-3">
            <p className="text-sm font-semibold text-foreground mb-1">
              📨 Step 1: Share the party link
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Send this to your group chat so your mates can check in. You'll see who's there before you do the Irish exit!
            </p>
          </div>
        ) : (
          /* People have checked in — show who */
          <button
            onClick={() => setShowCheckins(!showCheckins)}
            className="mb-3 w-full rounded-lg bg-primary/5 border border-primary/20 p-3 text-left hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">
                  {checkinCount} mate{checkinCount !== 1 ? "s" : ""} checked in
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {showCheckins ? "Hide" : "Show"}
              </span>
            </div>
            {showCheckins && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {checkedInFriends.map((f) => (
                  <span
                    key={f.friend_id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                  >
                    <Check className="h-3 w-3" /> {f.friends.name}
                  </span>
                ))}
              </div>
            )}
          </button>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* Primary action: share link or irish goodbye */}
          {checkinCount > 0 ? (
            <button
              onClick={handleIrishGoodbye}
              className="w-full flex items-center justify-center gap-2 rounded-full bg-gradient-irish px-4 py-3 text-sm font-bold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all"
            >
              <Send className="h-4 w-4" /> Do the Irish Goodbye 🍀
            </button>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={sharePartyLink}
              className={`flex-1 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
                checkinCount === 0
                  ? "bg-gradient-irish text-primary-foreground shadow-irish hover:brightness-110"
                  : "bg-muted text-foreground hover:brightness-95"
              }`}
            >
              <Share2 className="h-4 w-4" /> Share Link
            </button>
            <button
              onClick={() => setShowPhotoEditor(true)}
              className="flex items-center justify-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-gold hover:brightness-110 active:scale-95 transition-all"
            >
              <Camera className="h-4 w-4" /> Pics
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
                    <p className="text-muted-foreground mb-1">
                      Tap the crown to mark the host — they'll get a special thank-you! 👑
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      Everyone else gets the classic farewell.
                    </p>

                    <div className="flex flex-col gap-2 mb-6">
                      {checkedInFriends.map((f) => {
                        const isHost = hostId === f.friend_id;
                        return (
                          <div
                            key={f.friend_id}
                            className={`flex items-center justify-between rounded-lg border px-4 py-2 transition-colors ${
                              isHost
                                ? "border-secondary bg-secondary/10"
                                : "border-border bg-card"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setHostId(isHost ? null : f.friend_id)}
                                className={`rounded-full p-1.5 transition-colors ${
                                  isHost
                                    ? "bg-secondary text-secondary-foreground"
                                    : "bg-muted text-muted-foreground hover:bg-secondary/20"
                                }`}
                                title={isHost ? "Remove as host" : "Mark as host"}
                              >
                                <Crown className="h-3.5 w-3.5" />
                              </button>
                              <div className="text-left">
                                <span className="font-semibold text-foreground text-sm block">
                                  {f.friends.name}
                                  {isHost && (
                                    <span className="ml-1.5 text-xs font-medium text-secondary">
                                      Host
                                    </span>
                                  )}
                                </span>
                                <span className="text-xs text-muted-foreground">{f.friends.phone_number}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => sendGoodbye(f)}
                              className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                            >
                              Text just them
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-xs text-muted-foreground mb-4">
                      💡 This opens your messaging app with the farewell pre-written. You just hit send!
                    </p>

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
