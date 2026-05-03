import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, Volume2, Mic2 } from "lucide-react";
import { t, type Lang } from "@/i18n/dict";

interface NarrationBarProps {
  lang: Lang;
  speaking: boolean;
  paused: boolean;
  isSupported: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
}

export function NarrationBar({
  lang,
  speaking,
  paused,
  isSupported,
  onPlay,
  onPause,
  onStop,
}: NarrationBarProps) {
  if (!isSupported) return null;

  const isActive = speaking || paused;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex items-center gap-3 sm:gap-4 px-4 py-3 sm:px-5 rounded-2xl border transition-all duration-300 print:hidden ${
        isActive
          ? "bg-[#F0FBF8] border-[#0F8B8D]/30 shadow-[0_4px_20px_rgba(15,139,141,0.10)]"
          : "bg-white/70 border-slate-200/80 shadow-[0_2px_12px_rgba(15,23,42,0.04)]"
      }`}
    >
      {/* Pulse indicator when actively speaking */}
      <div className="relative flex items-center justify-center size-8 shrink-0">
        <AnimatePresence>
          {speaking && !paused && (
            <motion.span
              key="pulse-ring"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute inset-0 rounded-full bg-[#0F8B8D]/15 animate-ping"
            />
          )}
        </AnimatePresence>
        <div className={`relative z-10 size-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
          isActive ? "bg-[#0F8B8D]/15 text-[#0F8B8D]" : "bg-slate-100 text-slate-500"
        }`}>
          {isActive ? <Mic2 className="size-4" /> : <Volume2 className="size-4" />}
        </div>
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold leading-tight transition-colors duration-200 ${
          isActive ? "text-[#0F8B8D]" : "text-slate-600"
        }`}>
          {speaking && !paused
            ? t(lang, "voice_narrating")
            : paused
            ? t(lang, "voice_pause")
            : t(lang, "voice_listen_guidance")}
        </div>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            className="mt-1.5 h-[2px] bg-[#0F8B8D]/15 rounded-full overflow-hidden"
          >
            {speaking && !paused && (
              <motion.div
                className="h-full bg-[#0F8B8D]/50 rounded-full origin-left"
                animate={{ scaleX: [0, 1, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {!isActive ? (
          // Play button
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPlay}
            aria-label={t(lang, "voice_listen_guidance")}
            className="h-9 px-4 rounded-xl bg-[#0F8B8D] text-white text-[13px] font-bold shadow-[0_4px_14px_rgba(15,139,141,0.25)] hover:shadow-[0_6px_20px_rgba(15,139,141,0.30)] transition-all duration-200 flex items-center gap-1.5"
          >
            <Play className="size-3.5 fill-white" />
            <span className="hidden sm:inline">{t(lang, "read_guidance")}</span>
          </motion.button>
        ) : (
          <>
            {/* Pause / Resume */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={paused ? onPlay : onPause}
              aria-label={paused ? t(lang, "read_guidance") : t(lang, "voice_pause")}
              className="size-9 rounded-xl bg-[#0F8B8D]/10 hover:bg-[#0F8B8D]/20 text-[#0F8B8D] flex items-center justify-center transition-colors"
            >
              {paused
                ? <Play className="size-4 fill-[#0F8B8D]" />
                : <Pause className="size-4" />
              }
            </motion.button>
            {/* Stop */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStop}
              aria-label={t(lang, "stop_reading")}
              className="size-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
            >
              <Square className="size-3.5 fill-slate-500" />
            </motion.button>
          </>
        )}
      </div>
    </motion.div>
  );
}
