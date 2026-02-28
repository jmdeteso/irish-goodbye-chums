import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Check, Send, X } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  phone_number: string;
}

interface InviteFriendsModalProps {
  partyName: string;
  shareLink: string;
  onClose: () => void;
}

const InviteFriendsModal = ({ partyName, shareLink, onClose }: InviteFriendsModalProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFriends = async () => {
      const { data } = await supabase
        .from("friends")
        .select("id, name, phone_number")
        .order("name");
      if (data) {
        setFriends(data);
        // Select all by default
        setSelected(new Set(data.map((f) => f.id)));
      }
    };
    fetchFriends();
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === friends.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(friends.map((f) => f.id)));
    }
  };

  const sendInvites = () => {
    const selectedFriends = friends.filter((f) => selected.has(f.id));
    if (selectedFriends.length === 0) {
      onClose();
      return;
    }

    const message = `🍀 You're invited to ${partyName}! Tap this link to check in so I know you're there: ${shareLink}`;

    if (navigator.share) {
      navigator.share({
        title: `${partyName} — Irish Goodbye`,
        text: message,
      }).catch(() => {
        // Fallback to SMS
        const phones = selectedFriends.map((f) => f.phone_number.replace(/\D/g, "")).join(",");
        window.open(`sms:${phones}?body=${encodeURIComponent(message)}`, "_blank");
      });
    } else {
      const phones = selectedFriends.map((f) => f.phone_number.replace(/\D/g, "")).join(",");
      window.open(`sms:${phones}?body=${encodeURIComponent(message)}`, "_blank");
    }

    onClose();
  };

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
        className="w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold text-foreground">
              📨 Invite your mates
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Pick who to text the party link to. They'll get a message with the check-in link!
          </p>

          {friends.length > 1 && (
            <button
              onClick={selectAll}
              className="mb-3 text-xs font-semibold text-primary hover:underline"
            >
              {selected.size === friends.length ? "Deselect all" : "Select all"}
            </button>
          )}

          <div className="flex flex-col gap-2 mb-6">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => toggle(friend.id)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  selected.has(friend.id)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                    selected.has(friend.id)
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {selected.has(friend.id) && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm truncate">{friend.name}</p>
                  <p className="text-xs text-muted-foreground">{friend.phone_number}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-full bg-muted px-4 py-3 text-sm font-semibold text-muted-foreground hover:brightness-95 transition-all"
            >
              Skip for now
            </button>
            <button
              onClick={sendInvites}
              className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-irish px-4 py-3 text-sm font-bold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all"
            >
              <Send className="h-4 w-4" /> Text {selected.size > 0 ? selected.size : ""} mate{selected.size !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default InviteFriendsModal;
