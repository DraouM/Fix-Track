"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SplashScreen({ finishLoading }: { finishLoading: () => void }) {
  const [showLogo, setShowLogo] = useState(false);
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    const logoTimer = setTimeout(() => setShowLogo(true), 200);
    const textTimer = setTimeout(() => setShowText(true), 600);
    const finishTimer = setTimeout(() => finishLoading(), 2500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(finishTimer);
    };
  }, [finishLoading]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-[#0a0a0a]"
    >
      <div className="relative flex flex-col items-center">
        {/* Animated Background Glow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.15, scale: 1.2 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="absolute -inset-20 bg-blue-500 rounded-full blur-[100px]"
        />

        {/* Logo Container */}
        <div className="relative z-10 flex flex-col items-center">
          <AnimatePresence>
            {showLogo && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  duration: 0.6
                }}
                className="w-24 h-24 mb-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl flex items-center justify-center overflow-hidden border border-white/20"
              >
                {/* Visual substitute for a logo icon - can be replaced with actual image */}
                <div className="text-white text-5xl font-black italic tracking-tighter">
                  F
                </div>
                
                {/* Shine effect animation */}
                <motion.div
                  animate={{
                    x: ['-100%', '200%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showText && (
              <motion.div
                initial={{ opacity: 0, filter: "blur(10px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8 }}
                className="text-center"
              >
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
                  FIXARY<span className="text-blue-600">.</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium tracking-widest text-xs uppercase">
                  Management System
                </p>
                
                {/* Loading Progress Bar Indicator */}
                <div className="mt-8 w-48 h-1 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 2, ease: "easeInOut" }}
                    className="h-full bg-blue-600 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
