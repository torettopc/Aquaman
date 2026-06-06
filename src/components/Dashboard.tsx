/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DayPeriod, User, WaterRecord } from "../types";
import WaterWave from "./WaterWave";
import { Plus, Flame, Sparkles, ChevronRight, Sunrise, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  currentUser: User;
  waterRecords: WaterRecord[];
  onOpenAddModal: () => void;
  onAddQuickLiquid: (amountMl: number) => void;
}

export default function Dashboard({
  currentUser,
  waterRecords,
  onOpenAddModal,
  onAddQuickLiquid,
}: DashboardProps) {
  
  // Calculate today's total metrics
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = waterRecords.filter(
    (r) => r.userId === currentUser.id && r.date === todayStr
  );
  
  const totalMlToday = todayRecords.reduce((sum, r) => sum + r.amountMl, 0);
  const percentage = (totalMlToday / currentUser.dailyGoalMl) * 100;

  // Streak counter duplication clean load
  const totalUserRecords = waterRecords.filter((r) => r.userId === currentUser.id);
  const calculateCurrentStreak = (): number => {
    let streak = 0;
    let checkDateObj = new Date();

    while (true) {
      const year = checkDateObj.getFullYear();
      const month = (checkDateObj.getMonth() + 1).toString().padStart(2, "0");
      const day = checkDateObj.getDate().toString().padStart(2, "0");
      const checkStr = `${year}-${month}-${day}`;

      const logsOnDay = totalUserRecords.filter((r) => r.date === checkStr);
      const totalOnDay = logsOnDay.reduce((sum, r) => sum + r.amountMl, 0);

      if (totalOnDay >= currentUser.dailyGoalMl) {
        streak++;
        checkDateObj.setDate(checkDateObj.getDate() - 1);
      } else {
        if (checkStr === todayStr) {
          checkDateObj.setDate(checkDateObj.getDate() - 1);
          continue;
        }
        break;
      }
      if (streak > 50) break;
    }
    return streak;
  };

  const currentStreak = calculateCurrentStreak();

  const getSubtextPrompt = () => {
    if (percentage === 0) return "Ainda sem água hoje? Vamos começar! 💧";
    if (percentage < 35) return "Ótimo início! Beba mais um pouco. 🥛";
    if (percentage < 70) return "Mais da metade! Metade do caminho andado. ⭐️";
    if (percentage < 100) return "Quase lá! Só mais alguns goles!";
    return "Excelente! Meta diária atingida com perfeição! 🏆";
  };

  const getPeriodLabel = (period: DayPeriod) => {
    switch (period) {
      case "morning":
        return { label: "Manhã", icon: Sunrise, color: "text-amber-500 bg-amber-50" };
      case "afternoon":
        return { label: "Tarde", icon: Sun, color: "text-orange-500 bg-orange-50" };
      case "night":
        return { label: "Noite", icon: Moon, color: "text-indigo-500 bg-indigo-50" };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      
      {/* Dynamic Header Greeting */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-sans font-extrabold text-slate-800 tracking-tight leading-none">
            Olá, {currentUser.name}!
          </h2>
          <p className="text-[11px] text-slate-400 font-medium">
            {getSubtextPrompt()}
          </p>
        </div>

        {/* Small Streak Counter Tag */}
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 bg-amber-500 text-white rounded-full py-1 px-2.5 text-[10px] font-extrabold uppercase tracking-wide shadow-sm shadow-amber-500/10">
            <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
            <span>{currentStreak} Dias</span>
          </div>
        )}
      </div>

      {/* Primary Centered Wave animation display */}
      <WaterWave
        percentage={percentage}
        currentMl={totalMlToday}
        goalMl={currentUser.dailyGoalMl}
      />

      {/* Incremental Quick drink actions */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
          Registro Prático
        </span>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Copo", amount: 150, icon: "🥛" },
            { label: "Copo Grande", amount: 250, icon: "🥤" },
            { label: "Garrafa", amount: 500, icon: "🧴" },
          ].map((item) => (
            <button
              onClick={() => onAddQuickLiquid(item.amount)}
              key={item.label}
              className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-100 hover:border-blue-200 hover:bg-sky-50/20 active:scale-95 rounded-2xl transition-all shadow-xs cursor-pointer group"
            >
              <span className="text-2xl mb-1.5 transition-transform group-hover:scale-110">{item.icon}</span>
              <span className="text-[10px] font-bold text-slate-700">{item.label}</span>
              <span className="text-[9px] font-mono text-blue-500 font-extrabold mt-0.5">
                +{item.amount}ml
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity list snapshot */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Atividade de Hoje
          </span>
          {todayRecords.length > 0 && (
            <div className="text-[10px] text-slate-400 italic">
              {todayRecords.length} {todayRecords.length === 1 ? "registro" : "registros"}
            </div>
          )}
        </div>

        {todayRecords.length === 0 ? (
          <div className="p-7 text-center rounded-2xl border border-dashed border-slate-200 bg-white shadow-xs space-y-2">
            <p className="text-[11px] text-slate-400 leading-normal">
              Você ainda não registrou água hoje. Que tal beber um copinho de {currentUser.dailyGoalMl / 8}ml agora?
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center justify-center gap-1 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100/50 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lançar Próprio</span>
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm divide-y divide-slate-50 overflow-hidden">
            {[...todayRecords]
              .sort((a, b) => b.time.localeCompare(a.time))
              .slice(0, 3) // show latest 3 items
              .map((record) => {
                const periodMeta = getPeriodLabel(record.period);
                const IconComponent = periodMeta.icon;

                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl ${periodMeta.color}`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          Bebeu {record.amountMl >= 1000 ? `${(record.amountMl / 1000).toFixed(1)}L` : `${record.amountMl}ml`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Período da {periodMeta.label} às {record.time}
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                );
              })}

            {todayRecords.length > 3 && (
              <div className="p-2 bg-slate-50/50 text-center block text-[10px] font-medium text-slate-400">
                Mais registros disponíveis na aba de histórico.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wellness Quote Box */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 rounded-2xl p-4 border border-blue-100 max-w-full flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-blue-500 fill-current mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-widest block">Metabolismo Otimizado</span>
          <p className="text-[10px] text-slate-600 leading-normal font-medium">
            Fernando bebeu 1L de manhã, Maria bebeu 2L à tarde... cada gole conta no histórico do Aquaman!
          </p>
        </div>
      </div>
    </div>
  );
}
