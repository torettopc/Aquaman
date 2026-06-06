/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { DayPeriod } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { X, Droplet, Sun, Moon, Sunrise, Check } from "lucide-react";

interface AddWaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amountMl: number, period: DayPeriod) => void;
}

export default function AddWaterModal({ isOpen, onClose, onSave }: AddWaterModalProps) {
  // Input standard states
  const [inputType, setInputType] = useState<"ml" | "l">("ml");
  const [valueStr, setValueStr] = useState("250");
  const [selectedPeriod, setSelectedPeriod] = useState<DayPeriod>("morning");

  // Presets of water containers
  const presets = [
    { label: "Copo Pequeno", val: 150, unit: "ml", icon: "🥛" },
    { label: "Copo Padrão", val: 250, unit: "ml", icon: "🥤" },
    { label: "Garrafinha", val: 500, unit: "ml", icon: "🧴" },
    { label: "Garrafa Grande", val: 1000, unit: "ml", icon: "🍼" },
  ];

  // Auto-detect period of day based on current hour
  useEffect(() => {
    if (isOpen) {
      const hh = new Date().getHours();
      if (hh >= 5 && hh < 12) {
        setSelectedPeriod("morning");
      } else if (hh >= 12 && hh < 18) {
        setSelectedPeriod("afternoon");
      } else {
        setSelectedPeriod("night");
      }
    }
  }, [isOpen]);

  const handleApplyPreset = (ml: number) => {
    if (inputType === "ml") {
      setValueStr(ml.toString());
    } else {
      setValueStr((ml / 1000).toString());
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(valueStr.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) return;

    let finalMl = 0;
    if (inputType === "l") {
      finalMl = Math.round(parsed * 1000);
    } else {
      finalMl = Math.round(parsed);
    }

    onSave(finalMl, selectedPeriod);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex flex-col justify-end">
        {/* Backdrop dismiss overlay */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* Modal Sheet body */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative bg-white rounded-t-[36px] p-6 shadow-2xl z-10 flex flex-col border-t border-sky-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-sans font-bold text-slate-800 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-blue-500 fill-current" />
              <span>Marcar Consumo</span>
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Unit Selector Toggle Tabs */}
            <div className="flex bg-slate-100 rounded-2xl p-1 gap-1">
              <button
                type="button"
                onClick={() => {
                  setInputType("ml");
                  // Convert current val
                  const valNum = parseFloat(valueStr);
                  if (!isNaN(valNum)) {
                    setValueStr((valNum * 1000).toString());
                  } else {
                    setValueStr("250");
                  }
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  inputType === "ml"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Mililitros (ml)
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputType("l");
                  const valNum = parseFloat(valueStr);
                  if (!isNaN(valNum)) {
                    setValueStr((valNum / 1000).toString());
                  } else {
                    setValueStr("0.25");
                  }
                }}
                className={`flex-1 text-center py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  inputType === "l"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Litros (L)
              </button>
            </div>

            {/* Custom Input */}
            <div className="flex items-center justify-center gap-2 bg-sky-50/50 rounded-2xl p-4 border border-sky-100/30">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                className="w-32 bg-transparent text-center border-b-2 border-blue-400 font-sans font-extrabold text-3xl text-slate-800 focus:outline-none focus:border-blue-600 focus:scale-105 transition-all"
                autoFocus
              />
              <span className="text-xl font-bold font-sans text-sky-600 uppercase">
                {inputType}
              </span>
            </div>

            {/* Quick Presets Carousel */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Atalhos Rápidos
              </span>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((p) => {
                  const valNormalized = inputType === "ml" ? p.val : p.val / 1000;
                  const isCurrent = valueStr === valNormalized.toString();
                  return (
                    <button
                      type="button"
                      key={p.label}
                      onClick={() => handleApplyPreset(p.val)}
                      className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer ${
                        isCurrent
                          ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                          : "bg-white border-slate-100 hover:border-sky-200 text-slate-700"
                      }`}
                    >
                      <span className="text-lg">{p.icon}</span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium leading-tight truncate">{p.label}</div>
                        <div className="text-[10px] font-mono text-slate-400 font-bold">
                          {p.val}ml
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Period selector */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Período do Dia
              </span>
              <div className="flex gap-2">
                {[
                  { id: "morning", label: "Manhã", icon: Sunrise, color: "text-amber-500 bg-amber-50 border-amber-100" },
                  { id: "afternoon", label: "Tarde", icon: Sun, color: "text-orange-500 bg-orange-50 border-orange-100" },
                  { id: "night", label: "Noite", icon: Moon, color: "text-indigo-500 bg-indigo-50 border-indigo-100" },
                ].map((item) => {
                  const IconComp = item.icon;
                  const isSelected = selectedPeriod === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedPeriod(item.id as DayPeriod)}
                      className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-blue-600 border-blue-700 text-white shadow-md shadow-blue-600/10"
                          : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100/50"
                      }`}
                    >
                      <IconComp className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                      <span className="text-[11px] font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-slate-200 hover:bg-slate-100 rounded-2xl py-3 text-slate-500 font-semibold text-xs active:scale-95 transition-transform cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-[2] bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white rounded-2xl py-3 font-sans font-semibold text-xs active:scale-95 transition-transform flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Registro</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
