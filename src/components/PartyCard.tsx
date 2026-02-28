import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Users, Trash2 } from "lucide-react";

interface Party {
  id: string;
  name: string;
  share_code: string;
  is_active: boolean;
  created_at: string;
}

interface PartyCardProps {
  party: Party;
  onUpdate: () => void;
}

const PartyCard = ({ party, onUpdate }: PartyCardProps) => {
  const [checkinCount, setCheckinCount] = useState(0);

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

  const shareLink = `${window.location.origin}/party/${party.share_code}`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied! Share it with your mates 📋");
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

      <div className="flex gap-2">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-irish px-4 py-2 text-sm font-semibold text-primary-foreground shadow-irish hover:brightness-110 active:scale-95 transition-all"
        >
          <Copy className="h-4 w-4" /> Copy Party Link
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
  );
};

export default PartyCard;
