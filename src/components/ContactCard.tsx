import { motion, AnimatePresence } from "framer-motion";
import { Contact, getRandomMessage } from "@/lib/contacts";
import leprechaun from "@/assets/leprechaun.png";
import { useState, useCallback } from "react";

interface ContactCardProps {
  contact: Contact;
  onPing: (id: string) => void;
}

const SHAMROCKS = ["☘️", "🍀", "☘️", "🍀", "☘️", "🍀", "☘️", "🍀", "☘️", "🍀", "☘️", "🍀"];

interface ConfettiPiece {
  id: number;
  emoji: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
}

const ContactCard = ({ contact, onPing }: ContactCardProps) => {
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const spawnConfetti = useCallback(() => {
    const pieces: ConfettiPiece[] = SHAMROCKS.map((emoji, i) => ({
      id: Date.now() + i,
      emoji,
      x: (Math.random() - 0.5) * 250,
      y: -(Math.random() * 120 + 40),
      rotation: Math.random() * 720 - 360,
      scale: Math.random() * 0.6 + 0.7,
      delay: Math.random() * 0.15,
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 1500);
  }, []);

  const handlePing = () => {
    if (contact.pinged) return;
    const msg = getRandomMessage();
    setMessage(msg);
    setShowMessage(true);
    spawnConfetti();
    onPing(contact.id);
  };

  const proximityLabel =
    contact.distance < 20 ? "Right beside ye!" :
    contact.distance < 50 ? "Nearby" :
    contact.distance < 150 ? "Down the road" : "A wee walk away";

  const proximityColor =
    contact.distance < 20 ? "bg-primary" :
    contact.distance < 50 ? "bg-emerald-light" :
    contact.distance < 150 ? "bg-secondary" : "bg-muted-foreground";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-visible rounded-xl border border-border bg-card p-4 transition-all"
    >
      {/* Shamrock confetti */}
      <AnimatePresence>
        {confetti.map((piece) => (
          <motion.span
            key={piece.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: piece.x,
              y: piece.y,
              scale: piece.scale,
              rotate: piece.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: piece.delay, ease: "easeOut" }}
            className="pointer-events-none absolute right-16 top-4 z-10 text-xl"
            style={{ originX: 0.5, originY: 0.5 }}
          >
            {piece.emoji}
          </motion.span>
        ))}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
          {contact.avatar}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{contact.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`h-2 w-2 rounded-full ${proximityColor}`} />
            <span className="text-sm text-muted-foreground">
              {proximityLabel} · {contact.distance}m
            </span>
          </div>
        </div>

        {/* Ping Button */}
        <button
          onClick={handlePing}
          disabled={contact.pinged}
          className={`relative z-20 shrink-0 rounded-full px-4 py-2 font-semibold text-sm transition-all duration-300 ${
            contact.pinged
              ? "bg-muted text-muted-foreground cursor-default"
              : "bg-gradient-irish text-primary-foreground hover:shadow-irish active:scale-95"
          }`}
        >
          {contact.pinged ? (
            <span className="flex items-center gap-1">Sent ✓</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span>🍀</span> Ping
            </span>
          )}
        </button>
      </div>

      {/* Message popup */}
      <AnimatePresence>
        {showMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="mt-4 flex items-start gap-3 rounded-lg bg-muted p-3"
          >
            <img
              src={leprechaun}
              alt="Leprechaun"
              className="h-10 w-10 shrink-0 animate-wave"
            />
            <p className="text-sm text-foreground font-medium leading-relaxed">
              {message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ContactCard;
