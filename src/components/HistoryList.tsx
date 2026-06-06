/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { WaterRecord, User } from "../types";
import { Calendar, Trash2, Sunrise, Sun, Moon, Flame, Trophy, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HistoryListProps {
  currentUser: User;
  waterRecords: WaterRecord[];
  onDeleteRecord: (id: string) => void;
}

export default function HistoryList({ currentUser, waterRecords, onDeleteRecord }: HistoryListProps) {
  const [selectedDaysAgo, setSelectedDaysAgo] = useState<number>(0);

  // Group water records by date
  const recordsByUser = waterRecords.filter((r) => r.userId === currentUser.id);

  // Helper to generate last 7 dates in YYYY-MM-DD format
  const getPastDates = (): { dateString: string; label: string; weekday: string }[] => {
    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");
      
      const dateString = `${year}-${month}-${day}`;
      const weekdayStr = weekdays[d.getDay()];
      const label = i === 0 ? "Hoje" : `${day}/${month}`;
      dates.push({ dateString, label, weekday: weekdayStr });
    }
    return dates;
  };

  const datesOfIntake = getPastDates();

  // Selected date's logs
  const targetDateStr = datesOfIntake[6 - selectedDaysAgo]?.dateString || "";
  const filteredRecords = recordsByUser.filter((r) => r.date === targetDateStr);
  const totalMlForTarget = filteredRecords.reduce((sum, r) => sum + r.amountMl, 0);
  const percentForTarget = Math.min(Math.round((totalMlForTarget / currentUser.dailyGoalMl) * 100), 100);

  const getPeriodIcon = (period: string) => {
    switch (period) {
      case "morning":
        return { icon: Sunrise, color: "text-amber-500 bg-amber-50" };
      case "afternoon":
        return { icon: Sun, color: "text-orange-500 bg-orange-50" };
      case "night":
        return { icon: Moon, color: "text-indigo-500 bg-indigo-50" };
      default:
        return { icon: Sun, color: "text-blue-500 bg-blue-50" };
    }
  };

  // Calculate Streak of reaching 100% of dailyGoalMl
  const calculateStreak = (): number => {
    let streak = 0;
    // Iterate backwards starting from today to check which days met the goals
    const todayStr = new Date().toISOString().split("T")[0];
    let checkDateObj = new Date();

    while (true) {
      const year = checkDateObj.getFullYear();
      const month = (checkDateObj.getMonth() + 1).toString().padStart(2, "0");
      const day = checkDateObj.getDate().toString().padStart(2, "0");
      const checkStr = `${year}-${month}-${day}`;

      const logsOnDay = recordsByUser.filter((r) => r.date === checkStr);
      const totalOnDay = logsOnDay.reduce((sum, r) => sum + r.amountMl, 0);

      if (totalOnDay >= currentUser.dailyGoalMl) {
        streak++;
        // check previous day
        checkDateObj.setDate(checkDateObj.getDate() - 1);
      } else {
        // If it's today and they haven't met it yet, we don't break the yesterday's streak
        if (checkStr === todayStr) {
          checkDateObj.setDate(checkDateObj.getDate() - 1);
          continue;
        }
        break;
      }
      
      // Safety limit up to 100 days representation
      if (streak > 100) break;
    }
    return streak;
  };

  const currentStreak = calculateStreak();

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      
      {/* Upper streak and reward showcase */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-4 text-white shadow-md shadow-orange-500/15 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 bg-white/10 rounded-bl-2xl">
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <span className="text-[10px] font-bold text-orange-100 uppercase tracking-widest block">
            Fogo Ativo
          </span>
          <div className="text-4xl font-extrabold font-sans mt-0.5">{currentStreak}</div>
          <span className="text-[10px] opacity-90 mt-1 leading-normal font-medium">
            {currentStreak === 1 ? "Dia Seguido!" : "Dias Seguidos!"}
          </span>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-3xl p-4 text-white shadow-md shadow-blue-500/15 text-center flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1 bg-white/10 rounded-bl-2xl">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-bold text-sky-100 uppercase tracking-widest block">
            Meta Diária
          </span>
          <div className="text-xl font-extrabold font-sans mt-2">
            {(currentUser.dailyGoalMl / 1000).toFixed(1)}L
          </div>
          <span className="text-[10px] opacity-90 mt-2 font-medium leading-none">
            {percentForTarget}% Concluídos
          </span>
        </div>
      </div>

      {/* Week Glance visual bar chart */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Desempenho Semanal
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
            Últimos 7 dias
          </span>
        </div>

        {/* Dynamic bar chart layout with SVGs */}
        <div className="flex justify-between items-end h-28 pt-2">
          {datesOfIntake.map((d, index) => {
            const logs = recordsByUser.filter((r) => r.date === d.dateString);
            const total = logs.reduce((sum, r) => sum + r.amountMl, 0);
            const ratio = Math.min(total / currentUser.dailyGoalMl, 1.2); // max 120% visual height
            const ratioPercent = ratio * 100;
            const isSelected = selectedDaysAgo === (6 - index);

            return (
              <div
                key={d.dateString}
                onClick={() => setSelectedDaysAgo(6 - index)}
                className="flex flex-col items-center flex-1 cursor-pointer group"
              >
                {/* Tooltip on hover/select */}
                <div className="h-4 relative flex justify-center w-full">
                  {isSelected && (
                    <div className="absolute bottom-1 bg-slate-800 text-white font-mono text-[8px] font-semibold px-1 rounded-sm leading-tight shadow-md scale-105 transition-all">
                      {total}ml
                    </div>
                  )}
                </div>

                {/* Vertical Bar */}
                <div className="w-2.5 h-16 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`absolute bottom-0 inset-x-0 rounded-full transition-all duration-300 ${
                      total >= currentUser.dailyGoalMl
                        ? "bg-gradient-to-t from-blue-600 to-sky-400"
                        : "bg-blue-300"
                    }`}
                    style={{ height: `${ratioPercent}%` }}
                  />
                </div>

                {/* Day label */}
                <span
                  className={`text-[9px] mt-2 font-semibold transition-colors ${
                    isSelected ? "text-blue-600 font-bold" : "text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {d.weekday}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day breakdown logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">
              Registros {datesOfIntake[6 - selectedDaysAgo]?.label}
            </span>
          </div>
          <span className="text-xs font-bold font-mono text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
            Total: {totalMlForTarget}ml
          </span>
        </div>

        <div className="space-y-2">
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-sans italic bg-sky-50/10 rounded-2xl border border-dashed border-slate-200">
              Nenhum líquido registrado nesta data.
            </div>
          ) : (
            <AnimatePresence>
              {[...filteredRecords]
                .sort((a, b) => b.time.localeCompare(a.time))
                .map((r, i) => {
                  const itemConfig = getPeriodIcon(r.period);
                  const IconComp = itemConfig.icon;
                  const labelPeriod = r.period === "morning" ? "Manhã" : r.period === "afternoon" ? "Tarde" : "Noite";
                  
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      key={r.id}
                      className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${itemConfig.color}`}>
                          <IconComp className="w-4 h-4 shrink-0" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-800 leading-none">
                            {r.amountMl >= 1000 ? `${(r.amountMl / 1000).toFixed(1)}L` : `${r.amountMl}ml`}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {labelPeriod} às {r.time}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteRecord(r.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors border-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
