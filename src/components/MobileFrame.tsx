/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ReactNode, useEffect, useState } from "react";
import { Battery, Wifi, Signal } from "lucide-react";

interface MobileFrameProps {
  children: ReactNode;
}

export default function MobileFrame({ children }: MobileFrameProps) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours().toString().padStart(2, "0");
      let minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-0 md:p-6 select-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950 via-slate-950 to-black overflow-x-hidden">
      {/* Container simulating smartphone only on wider screens */}
      <div className="relative w-full max-w-md h-screen md:h-[840px] md:rounded-[48px] md:border-[10px] md:border-slate-800 bg-white shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] md:ring-1 md:ring-slate-700/50 overflow-hidden flex flex-col">
        
        {/* Mobile Mockup Top Speaker Notch */}
        <div className="hidden md:flex absolute top-0 inset-x-0 h-7 bg-slate-800 rounded-b-2xl z-50 items-center justify-center pointer-events-none">
          <div className="w-16 h-1 bg-slate-900 rounded-full" />
        </div>

        {/* Status Bar */}
        <div className="h-10 px-6 bg-sky-900 text-white flex items-center justify-between text-xs font-medium z-40 select-none shrink-0 pt-1 md:pt-4">
          <span className="font-sans font-semibold tracking-tight">{time}</span>
          <div className="flex items-center gap-1.5 opacity-90">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 ml-0.5" />
          </div>
        </div>

        {/* Render App screens inner content */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50 relative">
          {children}
        </div>

        {/* virtual iPhone-style Bottom Swipe Bar */}
        <div className="hidden md:block absolute bottom-1.5 inset-x-0 h-1.5 flex justify-center z-50 pointer-events-none">
          <div className="w-28 h-1 bg-slate-300 rounded-full opacity-60" />
        </div>
      </div>
    </div>
  );
}
