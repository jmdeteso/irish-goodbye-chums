import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Trash2, UserPlus, PartyPopper, ArrowRight } from "lucide-react";

interface Friend {
  id: string;
  name: string;
  phone_number: string;
}

interface FriendsListProps {
  onUpdate?: () => void;
}

const FriendsList = ({ onUpdate }: FriendsListProps) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    if (user) fetchFriends();
  }, [user]);

  const fetchFriends = async () => {
    const { data } = await supabase
      .from("friends")
      .select("id, name, phone_number")
      .eq("user_id", user.id)
      .order("name");
    if (data) setFriends(data);
  };

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("friends").insert({
      name: newName.trim(),
      phone_number: newPhone.trim(),
      user_id: user!.id,
    });
    if (error) {
      toast.error("Failed to add friend");
    } else {
      toast.success(`${newName} added! 🍀`);
      setNewName("");
      setNewPhone("");
      setShowAdd(false);
      setJustAdded(true);
      fetchFriends();
      onUpdate?.();
    }
    setAdding(false);
  };

  const removeFriend = async (id: string, name: string) => {
    const { error } = await supabase.from("friends").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove friend");
    } else {
      toast.success(`${name} removed`);
      fetchFriends();
      onUpdate?.();
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">Your Friends</h2>
        <button
          onClick={() => { setShowAdd(true); setJustAdded(false); }}
          className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-gold hover:brightness-110 active:scale-95 transition-all"
        >
          <UserPlus className="h-4 w-4" /> Add Friend
        </button>
      </div>

      {/* Onboarding hint when empty */}
      {friends.length === 0 && !showAdd && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-secondary bg-secondary/10 p-4 text-center"
        >
          <p className="text-3xl mb-2">👥</p>
          <p className="text-sm font-semibold text-foreground mb-1">Add your party crew!</p>
          <p className="text-sm text-muted-foreground mb-3">
            Add your mates' names and phone numbers. They won't need accounts — they just get a fun text when you pull the Irish exit.
          </p>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 mx-auto rounded-full bg-gradient-irish px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all"
          >
            <UserPlus className="h-4 w-4" /> Add Your First Friend
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addFriend}
            className="mb-4 overflow-hidden"
          >
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
              <input
                type="text"
                placeholder="Friend's name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <input
                type="tel"
                placeholder="Phone number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 rounded-full bg-gradient-irish px-4 py-2 text-sm font-semibold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                >
                  Add ☘️
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground hover:brightness-95 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        {friends.map((friend, i) => (
          <motion.div
            key={friend.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
              {friend.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{friend.name}</p>
              <p className="text-sm text-muted-foreground">{friend.phone_number}</p>
            </div>
            <button
              onClick={() => removeFriend(friend.id, friend.name)}
              className="rounded-full p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Next step hint after adding friends */}
      {friends.length > 0 && justAdded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4"
        >
          <p className="text-sm font-semibold text-foreground mb-1">
            🎉 Nice one! What's next?
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            You can add more friends, or head to <strong>Parties</strong> to create a party and share the link!
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdd(true)}
              className="flex-1 rounded-full bg-muted px-4 py-2 text-sm font-semibold text-foreground hover:brightness-95 transition-all"
            >
              <UserPlus className="h-4 w-4 inline mr-1.5" /> Add More
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
};

export default FriendsList;
