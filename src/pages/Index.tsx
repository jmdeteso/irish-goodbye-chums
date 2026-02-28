import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import leprechaun from "@/assets/leprechaun.png";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(user ? "/dashboard" : "/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden bg-gradient-irish px-6 pb-14 pt-16 text-primary-foreground">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-center gap-4 mb-4">
            <motion.img
              src={leprechaun}
              alt="Irish Goodbye Leprechaun"
              className="h-24 w-24 drop-shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <h1 className="text-center font-display text-4xl font-black tracking-tight">
            Irish Goodbye
          </h1>
          <p className="mt-3 text-center text-primary-foreground/80 text-lg leading-relaxed">
            Slip away from any party with style — send your mates a wee leprechaun farewell! 🍀
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <motion.button
              onClick={handleGetStarted}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 rounded-full bg-secondary px-8 py-3.5 text-lg font-bold text-secondary-foreground shadow-gold transition-all hover:brightness-110"
            >
              {user ? "Go to Dashboard" : "Get Started"} <ArrowRight className="h-5 w-5" />
            </motion.button>
            {!loading && !user && (
              <p className="text-primary-foreground/60 text-sm">
                Free to use · No tracking · Your friends don't need accounts
              </p>
            )}
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

      {/* How it works */}
      <main className="mx-auto max-w-lg px-4 py-10">
        <h2 className="font-display text-2xl font-bold text-foreground text-center mb-8">
          How It Works
        </h2>

        <div className="flex flex-col gap-5">
          {[
            { step: "1", emoji: "👥", title: "Add Your Mates", desc: "Save your friends' names and phone numbers. They never need an account." },
            { step: "2", emoji: "🎉", title: "Create a Party", desc: "Start a party and share the magic link. Friends tap it to check in." },
            { step: "3", emoji: "🍀", title: "Do the Irish Exit", desc: "When you're ready to slip away, hit the goodbye button. Everyone gets a fun farewell!" },
            { step: "4", emoji: "📸", title: "Send Party Pics", desc: "Add shamrocks and Irish flair to your photos with stickers or AI magic." },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {item.emoji} {item.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <motion.button
            onClick={handleGetStarted}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full bg-gradient-irish px-8 py-3 text-lg font-bold text-primary-foreground shadow-irish transition-all hover:brightness-110"
          >
            {user ? "Go to Dashboard 🍀" : "Get Started — It's Free 🍀"}
          </motion.button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <img src={leprechaun} alt="Leprechaun" className="h-6 w-6" />
          <span className="text-sm text-muted-foreground">
            Irish Goodbye · Slip away with style
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
