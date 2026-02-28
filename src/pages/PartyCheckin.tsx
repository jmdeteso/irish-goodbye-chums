import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import leprechaun from "@/assets/leprechaun.png";
import { getRandomMessage } from "@/lib/contacts";
import { Check } from "lucide-react";

interface PartyData {
  id: string;
  name: string;
  user_id: string;
}

interface FriendOption {
  id: string;
  name: string;
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

  useEffect(() => {
    if (shareCode) loadParty();
  }, [shareCode]);

  const loadParty = async () => {
    // Find party by share code
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

    // Fetch friends belonging to party owner
    const { data: friendsData } = await supabase
      .from("friends")
      .select("id, name")
      .eq("user_id", partyData.user_id)
      .order("name");

    if (friendsData) setFriends(friendsData);

    // Fetch existing check-ins
    const { data: checkinsData } = await supabase
      .from("party_checkins")
      .select("friend_id")
      .eq("party_id", partyData.id);

    if (checkinsData) {
      setCheckedIn(new Set(checkinsData.map((c) => c.friend_id)));
    }

    setLoading(false);
  };

  const handleCheckin = async (friendId: string) => {
    if (!party || checkedIn.has(friendId)) return;

    const { error } = await supabase.from("party_checkins").insert({
      party_id: party.id,
      friend_id: friendId,
    });

    if (error) {
      // Already checked in
      return;
    }

    setCheckedIn((prev) => new Set([...prev, friendId]));
    setJustCheckedIn(friendId);
    setMessage(getRandomMessage());
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
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Party Not Found
        </h1>
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
        <p className="mt-2 text-primary-foreground/80">
          Tap your name to check in! 🍀
        </p>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6">
        <h2 className="font-display text-lg font-bold text-foreground mb-4">
          Who are ye?
        </h2>

        <div className="flex flex-col gap-2">
          {friends.map((friend, i) => {
            const isChecked = checkedIn.has(friend.id);
            const justDone = justCheckedIn === friend.id;

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
                    isChecked
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isChecked ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    friend.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                  )}
                </div>
                <span
                  className={`font-semibold ${
                    isChecked ? "text-primary" : "text-foreground"
                  }`}
                >
                  {friend.name}
                </span>
                {isChecked && (
                  <span className="ml-auto text-sm text-primary">Checked in ✓</span>
                )}
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
              <p className="text-sm font-medium text-foreground leading-relaxed">
                {message}
              </p>
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
