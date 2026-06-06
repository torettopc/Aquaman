/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Reminder } from "../types";
import { Clock, Plus, Trash2, Bell, AlertCircle, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RemindersScreenProps {
  reminders: Reminder[];
  onToggleReminder: (id: string) => void;
  onAddReminder: (time: string, label?: string) => void;
  onDeleteReminder: (id: string) => void;
  onSendSimulationNotification: () => void;
}

export default function RemindersScreen({
  reminders,
  onToggleReminder,
  onAddReminder,
  onDeleteReminder,
  onSendSimulationNotification,
}: RemindersScreenProps) {
  const [newTime, setNewTime] = useState("08:00");
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newTime) {
      setError("Horário é obrigatório.");
      return;
    }

    // Format review
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(newTime)) {
      setError("Formato de hora inválido. Use HH:MM");
      return;
    }

    // Duplicate check
    const duplicated = reminders.some((r) => r.time === newTime);
    if (duplicated) {
      setError("Você já possui um lembrete para este horário.");
      return;
    }

    onAddReminder(newTime, newLabel.trim() || undefined);
    setNewLabel("");
    // Add default increment for next reminder
    const [hh, mm] = newTime.split(":").map(Number);
    let nextHh = (hh + 3) % 24;
    setNewTime(`${nextHh.toString().padStart(2, "0")}:${mm.toString().padStart(2, "0")}`);
  };

  const loadDefaults = () => {
    const defaults = ["08:00", "11:00", "14:00", "17:00", "20:00"];
    defaults.forEach((t) => {
      if (!reminders.some((r) => r.time === t)) {
        onAddReminder(t);
      }
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      {/* Upper header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white p-4 rounded-3xl shadow-md shadow-blue-500/15">
        <div className="p-3 bg-white/10 rounded-2xl">
          <Bell className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-base font-sans font-bold leading-snug">Sistema de Lembretes</h2>
          <p className="text-[11px] text-sky-100 opacity-90">Defina os horários ideais para sua saúde</p>
        </div>
      </div>

      {/* Trigger simulated notifications */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 shadow-xl flex items-center justify-between gap-3 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-y-1/4 translate-x-1/4 opacity-10 bg-white w-20 h-20 rounded-full" />
        <div className="space-y-1 relative z-10">
          <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3" />
            <span>Módulo de Simulação</span>
          </div>
          <h3 className="text-sm font-bold">Lembrete Imediato</h3>
          <p className="text-[10px] text-slate-300 leading-normal max-w-[210px]">
            Experimente receber uma notificação visual instantânea agora no topo da sua tela!
          </p>
        </div>
        <button
          onClick={onSendSimulationNotification}
          className="bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-sans font-extrabold text-[10px] uppercase tracking-wider px-3 py-2.5 rounded-xl block shrink-0 active:scale-95 transition-transform cursor-pointer"
        >
          Disparar 🔔
        </button>
      </div>

      {/* Add reminder box */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Adicionar Novo Horário
        </h3>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-[10px] flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Horário</label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-8 pr-2 text-xs font-semibold focus:outline-none focus:border-blue-400 text-slate-800"
              />
            </div>
          </div>

          <div className="flex-1.5 space-y-1">
            <label className="text-[10px] font-bold text-slate-500">Rótulo (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Copo d'água"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-2.5 text-xs focus:outline-none focus:border-blue-400 text-slate-800"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl p-2.5 flex items-center justify-center border-none cursor-pointer active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* List of active reminders */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Seus Lembretes ({reminders.length})
          </span>
          {reminders.length === 0 && (
            <button
              onClick={loadDefaults}
              className="text-[10px] font-extrabold text-blue-500 hover:underline border-none bg-none outline-none cursor-pointer"
            >
              Usar Horários Padrão
            </button>
          )}
        </div>

        <div className="space-y-2">
          {reminders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 font-sans italic bg-sky-50/10 rounded-2xl border border-dashed border-slate-200">
              Nenhum lembrete cadastrado ainda. Configure-os acima ou use as sugestões padrão!
            </div>
          ) : (
            <AnimatePresence>
              {[...reminders]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((r, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.05 }}
                    key={r.id}
                    className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-100 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-sky-50 text-blue-500">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold font-mono text-slate-800 leading-tight">
                          {r.time}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {r.label || "Lembrete de Hidratação"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* On/Off Switch */}
                      <button
                        onClick={() => onToggleReminder(r.id)}
                        className={`w-10 h-6 rounded-full p-0.5 transition-colors duration-200 relative shrink-0 border-0 cursor-pointer ${
                          r.active ? "bg-blue-500" : "bg-slate-200"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                            r.active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteReminder(r.id)}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors border-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
