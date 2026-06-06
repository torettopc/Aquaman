/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

interface WaterWaveProps {
  percentage: number; // 0 to 100+
  currentMl: number;
  goalMl: number;
}

export default function WaterWave({ percentage, currentMl, goalMl }: WaterWaveProps) {
  // Cap percentage at 120 for bubble boundary, but show actual text
  const displayPercentage = Math.round(percentage);
  const fillLevel = Math.min(Math.max(percentage, 0), 100);

  // SVG wave paths for moving effect
  const wavePath1 = "M 0 10 Q 7.5 7.5 15 10 T 30 10 T 45 10 T 60 10 T 75 10 T 90 10 T 105 10 T 120 10 T 135 10 T 150 10 T 165 10 T 180 10 T 195 10 T 210 10 T 225 10 T 240 10 T 255 10 T 270 10 T 285 10 T 300 10 T 315 10 T 330 10 T 345 10 T 360 10 L 360 100 L 0 100 Z";

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {/* Outer Glow Circle */}
      <div className="relative w-64 h-64 rounded-full border-4 border-sky-100/50 flex items-center justify-center shadow-lg shadow-sky-100/40 bg-gradient-to-b from-sky-50/20 to-sky-100/10 overflow-hidden">
        
        {/* Animated Water Liquid Fill */}
        <motion.div
          className="absolute bottom-0 left-0 w-full bg-blue-500/80"
          style={{ height: `${fillLevel}%` }}
          initial={{ height: 0 }}
          animate={{ height: `${fillLevel}%` }}
          transition={{ type: "spring", stiffness: 40, damping: 15 }}
        >
          {/* Wave overlay 1 */}
          <svg
            className="absolute left-0 w-[720px] h-10 text-blue-400 opacity-60 fill-current"
            style={{ top: "-24px" }}
            viewBox="0 0 360 30"
            preserveAspectRatio="none"
          >
            <motion.path
              d={wavePath1}
              animate={{
                x: [-180, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "linear",
              }}
            />
          </svg>

          {/* Wave overlay 2 (reversed and offset for rich liquid feel) */}
          <svg
            className="absolute left-0 w-[720px] h-10 text-blue-500 fill-current"
            style={{ top: "-18px" }}
            viewBox="0 0 360 30"
            preserveAspectRatio="none"
          >
            <motion.path
              d={wavePath1}
              animate={{
                x: [0, -180],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                ease: "linear",
              }}
            />
          </svg>
        </motion.div>

        {/* Floating Bubble particles */}
        <div className="absolute inset-x-0 bottom-0 top-12 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-white/40 left-12 bottom-6"
            animate={{ y: [-10, -100], opacity: [0, 0.7, 0] }}
            transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
          />
          <motion.div
            className="absolute w-2 h-2 rounded-full bg-white/30 left-1/2 bottom-8"
            animate={{ y: [-15, -120], opacity: [0, 0.8, 0] }}
            transition={{ repeat: Infinity, duration: 5, delay: 1.5 }}
          />
          <motion.div
            className="absolute w-4 h-4 rounded-full bg-white/20 right-16 bottom-4"
            animate={{ y: [-5, -80], opacity: [0, 0.6, 0] }}
            transition={{ repeat: Infinity, duration: 3, delay: 2 }}
          />
        </div>

        {/* Inner Text overlay styled for superior contrast and readability */}
        <div className="z-10 flex flex-col items-center justify-center text-center px-4 select-none">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`font-sans font-bold text-5xl tracking-tight transition-colors duration-300 ${
              fillLevel > 52 ? "text-white drop-shadow" : "text-sky-950"
            }`}
          >
            {displayPercentage}%
          </motion.div>
          
          <div
            className={`text-xs mt-1 font-mono uppercase tracking-widest font-medium transition-colors duration-300 ${
              fillLevel > 52 ? "text-sky-100" : "text-sky-600/90"
            }`}
          >
            {currentMl}ml / {goalMl}ml
          </div>

          <div
            className={`text-[10px] mt-2 font-sans font-medium px-2 py-0.5 rounded-full transition-colors duration-300 ${
              fillLevel > 52
                ? "bg-white/20 text-white"
                : "bg-sky-500/10 text-sky-700"
            }`}
          >
            {fillLevel >= 100 ? "Meta Batida! 🏆" : "Beba Água!"}
          </div>
        </div>
      </div>
    </div>
  );
}
