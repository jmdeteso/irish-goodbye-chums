import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import leprechaun from "@/assets/leprechaun.png";
import { toast } from "sonner";
import FriendsList from "@/components/FriendsList";
import PartyCard from "@/components/PartyCard";
import InviteFriendsModal from "@/components/InviteFriendsModal";
import { Plus, LogOut, Users, PartyPopper, ArrowRight } from "lucide-react";

interface Party {
  id: string;
  name: string;
  share_code: string;
  is_active: boolean;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const [parties, setParties] = useState<Party[]>([]);
  const [friendCount, setFriendCount] = useState<number | null>(null);
  const [showNewParty, setShowNewParty] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [activeTab, setActiveTab] = useState<"parties" | "friends">("parties");
  const [creating, setCreating] = useState(false);
  const [inviteParty, setInviteParty] = useState<Party | null>(null);

  useEffect(() => {
    if (user) {
      fetchParties();
      fetchFriendCount();
    }
  }, [user]);

  // Auto-start on friends tab if user has no friends yet
  useEffect(() => {
    if (friendCount === 0) {
      setActiveTab("friends");
    }
  }, [friendCount]);

  const fetchParties = async () => {
    const { data } = await supabase
      .from("parties")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setParties(data);
  };

  const fetchFriendCount = async () => {
    const { count } = await supabase
      .from("friends")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id);
    setFriendCount(count ?? 0);
  };

  const createParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("parties").insert({
      name: partyName.trim(),
      user_id: user!.id,
    });
    if (error) {
      toast.error("Failed to create party");
    } else {
      toast.success("Party created! 🎉");
      setPartyName("");
      setShowNewParty(false);
      const { data: newParties } = await supabase
        .from("parties")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (newParties) {
        setParties(newParties);
        // Show invite modal for the just-created party
        const created = newParties[0];
        if (created) setInviteParty(created);
      }
    }
    setCreating(false);
  };

  const handleFriendsUpdated = () => {
    fetchFriendCount();
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.img
        src={leprechaun}
        alt="Loading..."
        className="h-16 w-16"
        animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;

  const hasFriends = (friendCount ?? 0) > 0;
  const hasParties = parties.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-irish px-4 pb-6 pt-8 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <img src={leprechaun} alt="Leprechaun" className="h-10 w-10" />
              <h1 className="font-display text-2xl font-black">Irish Goodbye</h1>
            </div>
            <button
              onClick={signOut}
              className="rounded-full p-2 hover:bg-primary-foreground/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("parties")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "parties"
                  ? "bg-primary-foreground text-foreground"
                  : "bg-primary-foreground/15 text-primary-foreground"
              }`}
            >
              <PartyPopper className="h-4 w-4" /> Parties
            </button>
            <button
              onClick={() => setActiveTab("friends")}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "friends"
                  ? "bg-primary-foreground text-foreground"
                  : "bg-primary-foreground/15 text-primary-foreground"
              }`}
            >
              <Users className="h-4 w-4" /> Friends
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-lg px-4 py-6">
        {activeTab === "parties" && (
          <>
            {/* Hint: add friends first */}
            {!hasFriends && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-xl border border-secondary bg-secondary/10 p-4"
              >
                <p className="text-sm font-semibold text-foreground mb-2">
                  👋 First things first!
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  Add some mates before creating a party — they'll be the ones you ping when you do the Irish exit!
                </p>
                <button
                  onClick={() => setActiveTab("friends")}
                  className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-gold hover:brightness-110 active:scale-95 transition-all"
                >
                  Add Friends First <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground">Your Parties</h2>
              <button
                onClick={() => setShowNewParty(true)}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-gold hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" /> New Party
              </button>
            </div>

            <AnimatePresence>
              {showNewParty && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={createParty}
                  className="mb-4 overflow-hidden"
                >
                  <div className="rounded-xl border border-border bg-card p-4 flex gap-3">
                    <input
                      type="text"
                      placeholder="Party name (e.g. Friday Pub Night)"
                      value={partyName}
                      onChange={(e) => setPartyName(e.target.value)}
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={creating}
                      className="rounded-full bg-gradient-irish px-4 py-2 text-sm font-semibold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      Create 🍀
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>


            <div className="flex flex-col gap-3">
              {parties.length === 0 ? (
                <div className="text-center py-12">
                  <motion.img
                    src={leprechaun}
                    alt="Waiting leprechaun"
                    className="mx-auto h-16 w-16 mb-3 opacity-50"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <p className="text-muted-foreground">
                    {hasFriends
                      ? "No parties yet! Create one and share the link with your mates."
                      : "No parties yet. Add some friends first, then create a party!"}
                  </p>
                </div>
              ) : (
                parties.map((party, i) => (
                  <motion.div
                    key={party.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <PartyCard party={party} onUpdate={fetchParties} />
                  </motion.div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "friends" && (
          <FriendsList onUpdate={handleFriendsUpdated} />
        )}
      </main>

      <AnimatePresence>
        {inviteParty && (
          <InviteFriendsModal
            partyName={inviteParty.name}
            shareLink={`${window.location.origin}/party/${inviteParty.share_code}`}
            onClose={() => setInviteParty(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
