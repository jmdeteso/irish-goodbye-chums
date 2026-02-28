import { useState } from "react";
import { motion } from "framer-motion";
import leprechaun from "@/assets/leprechaun.png";
import ContactCard from "@/components/ContactCard";
import { MOCK_CONTACTS, Contact } from "@/lib/contacts";

const Index = () => {
  const [contacts, setContacts] = useState<Contact[]>(MOCK_CONTACTS);
  const [pingAllDone, setPingAllDone] = useState(false);

  const nearbyContacts = contacts
    .filter((c) => c.distance <= 200)
    .sort((a, b) => a.distance - b.distance);

  const pingedCount = contacts.filter((c) => c.pinged).length;

  const handlePing = (id: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinged: true } : c))
    );
  };

  const handlePingAll = () => {
    setContacts((prev) => prev.map((c) => ({ ...c, pinged: true })));
    setPingAllDone(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-irish px-6 pb-10 pt-12 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.img
              src={leprechaun}
              alt="Irish Goodbye Leprechaun"
              className="h-20 w-20 drop-shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <h1 className="text-center font-display text-4xl font-black tracking-tight">
            Irish Goodbye
          </h1>
          <p className="mt-2 text-center text-primary-foreground/80 text-base">
            Slip away with style — ping your nearby mates with a wee leprechaun farewell! 🍀
          </p>

          {/* Stats bar */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold font-display">{nearbyContacts.length}</div>
              <div className="text-primary-foreground/70">Nearby</div>
            </div>
            <div className="h-8 w-px bg-primary-foreground/20" />
            <div className="text-center">
              <div className="text-2xl font-bold font-display">{pingedCount}</div>
              <div className="text-primary-foreground/70">Pinged</div>
            </div>
          </div>
        </div>

        {/* Decorative wave */}
        <svg
          className="absolute -bottom-1 left-0 w-full"
          viewBox="0 0 1440 60"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 30C360 60 720 0 1080 30C1260 45 1380 40 1440 35V60H0V30Z"
            fill="hsl(40, 33%, 96%)"
          />
        </svg>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-lg px-4 py-6">
        {/* Ping All Button */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-foreground">
            Nearby Mates
          </h2>
          <button
            onClick={handlePingAll}
            disabled={pingAllDone || pingedCount === nearbyContacts.length}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              pingAllDone || pingedCount === nearbyContacts.length
                ? "bg-muted text-muted-foreground"
                : "bg-secondary text-secondary-foreground shadow-gold hover:brightness-110 active:scale-95"
            }`}
          >
            {pingedCount === nearbyContacts.length ? "All Pinged! 🎉" : "Ping All 🍻"}
          </button>
        </div>

        {/* Contact list */}
        <div className="flex flex-col gap-3">
          {nearbyContacts.map((contact, i) => (
            <motion.div
              key={contact.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <ContactCard contact={contact} onPing={handlePing} />
            </motion.div>
          ))}
        </div>

        {/* Footer fun */}
        {pingedCount === nearbyContacts.length && nearbyContacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 text-center"
          >
            <motion.img
              src={leprechaun}
              alt="Happy leprechaun"
              className="mx-auto h-24 w-24 mb-3"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <h3 className="font-display text-2xl font-bold text-foreground">
              The Irish Exit is Complete!
            </h3>
            <p className="mt-1 text-muted-foreground">
              You've ghosted everyone with charm. Well done! 🌈
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Index;
