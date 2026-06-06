/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { User, WaterRecord, Reminder, DayPeriod } from "./types";
import MobileFrame from "./components/MobileFrame";
import AuthScreen from "./components/AuthScreen";
import Dashboard from "./components/Dashboard";
import HistoryList from "./components/HistoryList";
import RemindersScreen from "./components/RemindersScreen";
import InfoScreen from "./components/InfoScreen";
import AddWaterModal from "./components/AddWaterModal";
import { Database } from "./services/Database";
import { 
  Droplet, 
  Calendar, 
  Bell, 
  BookOpen, 
  LogOut, 
  User as UserIcon, 
  Award,
  Volume2,
  X,
  Plus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [screen, setScreen] = useState<"dashboard" | "history" | "reminders" | "info">("dashboard");
  const [waterRecords, setWaterRecords] = useState<WaterRecord[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Custom interactive alarm notification simulation pop-up
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
    icon: string;
  } | null>(null);

  // Carregar os consumos de água do SQLite mapeados para o estado React
  const carregarConsumosDoUsuario = async (userId: number) => {
    try {
      const records = await Database.buscarTodosConsumosUsuario(userId);
      const mapped: WaterRecord[] = records.map(r => {
        // Traduz o período do SQLite ('manhã', 'tarde', 'noite') de volta para o DayPeriod ('morning', 'afternoon', 'night')
        let reactPeriod: DayPeriod = "morning";
        if (r.periodo === "tarde") {
          reactPeriod = "afternoon";
        } else if (r.periodo === "noite") {
          reactPeriod = "night";
        }

        return {
          id: String(r.id),
          userId: String(r.usuario_id),
          amountMl: r.unidade === 'l' ? r.quantidade * 1000 : r.quantidade,
          time: r.hora_registro,
          date: r.data,
          period: reactPeriod
        };
      });
      setWaterRecords(mapped);
    } catch (e) {
      console.error("Erro ao ler registros de consumo do SQLite:", e);
    }
  };

  // Inicializa o banco de dados e carrega sessões ativas no primeiro render
  useEffect(() => {
    const bootstrapDb = async () => {
      // 1. Inicializa Conexão e Tabelas no SQLite automaticamente ao abrir o app
      await Database.initDatabase();

      // 2. Carrega usuário ativo se houver sessão ativa persistida
      const active = localStorage.getItem("aquaman_active_user");
      if (active) {
        try {
          const parsedUser = JSON.parse(active);
          
          // Sincroniza meta diária direto da tabela 'configuracoes' do SQLite!
          const dbConfig = await Database.buscarConfiguracoes(Number(parsedUser.id));
          const currentGoal = dbConfig ? dbConfig.meta_diaria : parsedUser.dailyGoalMl;
          
          const syncedUser: User = {
            ...parsedUser,
            dailyGoalMl: currentGoal
          };
          setCurrentUser(syncedUser);
          
          // Carrega consumos reais do SQLite
          await carregarConsumosDoUsuario(Number(syncedUser.id));
        } catch {
          localStorage.removeItem("aquaman_active_user");
        }
      }

      // 3. Inicializa os alarmes/lembretes de horário padrão
      const storedReminders = localStorage.getItem("aquaman_reminders");
      if (storedReminders) {
        try {
          setReminders(JSON.parse(storedReminders));
        } catch {
          setReminders([]);
        }
      } else {
        const defaultReminders: Reminder[] = [
          { id: "rem-1", time: "08:00", active: true, label: "Água ao acordar 🌅" },
          { id: "rem-2", time: "11:00", active: true, label: "Antes do almoço 🍽️" },
          { id: "rem-3", time: "14:00", active: true, label: "Hidratação da tarde ☀️" },
          { id: "rem-4", time: "17:00", active: true, label: "Meio de tarde 🔋" },
          { id: "rem-5", time: "20:00", active: true, label: "Água da noite 🌙" },
        ];
        setReminders(defaultReminders);
        localStorage.setItem("aquaman_reminders", JSON.stringify(defaultReminders));
      }
    };

    bootstrapDb();
  }, []);

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("aquaman_active_user", JSON.stringify(user));
    setScreen("dashboard");
    
    // Carrega logs de consumo deste usuário vindos do SQLite
    await carregarConsumosDoUsuario(Number(user.id));
    
    // Welcome Toast simulation
    triggerSimulatedNotification(
      "Sessão Iniciada!",
      `Olá ${user.name}, bem-vindo ao Aquaman! Vamos bater a meta hoje?`,
      "💧"
    );
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("aquaman_active_user");
    setWaterRecords([]);
  };

  // Gravar consumo diretamente nas Tabelas SQLite
  const handleSaveWaterRecord = async (amountMl: number, period: DayPeriod) => {
    if (!currentUser) return;

    const hh = new Date().getHours().toString().padStart(2, "0");
    const mm = new Date().getMinutes().toString().padStart(2, "0");
    const todayStr = new Date().toISOString().split("T")[0];

    // Converte a unidade do React ('morning' | 'afternoon' | 'night') para a tabela do SQLite ('manhã' | 'tarde' | 'noite')
    const sqlitePeriod: 'manhã' | 'tarde' | 'noite' = 
      period === 'afternoon' ? 'tarde' : period === 'night' ? 'noite' : 'manhã';

    try {
      // 1. Adiciona registro na tabela 'consumo_agua' via INSERT INTO
      await Database.adicionarConsumo(
        Number(currentUser.id),
        amountMl,
        'ml', // grava ml por padrão
        sqlitePeriod,
        `${hh}:${mm}`,
        todayStr
      );

      // 2. Dispara recarregamento direto do banco SQLite
      await carregarConsumosDoUsuario(Number(currentUser.id));

      // 3. Calcula o total consumido hoje direto das tabelas do banco SQLite reais
      const sumToday = await Database.calcularTotalConsumidoHoje(Number(currentUser.id));

      if (sumToday >= currentUser.dailyGoalMl && (sumToday - amountMl) < currentUser.dailyGoalMl) {
        // Direct milestone reached!
        triggerSimulatedNotification(
          "Objetivo Concluído! 🏆",
          `Brilhante, ${currentUser.name}! Você atingiu 100% da sua meta de hidratação hoje!`,
          "👑"
        );
      } else {
        triggerSimulatedNotification(
          "Água Registrada!",
          `Você adicionou ${amountMl >= 1000 ? `${(amountMl/1000).toFixed(1)}L` : `${amountMl}ml`} à sua rotina de hoje. Continue assim!`,
          "🥛"
        );
      }
    } catch (e) {
      console.error("Erro ao persistir log no SQLite:", e);
    }
  };

  const handleAddQuickLiquid = (amountMl: number) => {
    // Automap period based on hour
    const hh = new Date().getHours();
    let period: DayPeriod = "morning";
    if (hh >= 12 && hh < 18) {
      period = "afternoon";
    } else if (hh >= 18 || hh < 5) {
      period = "night";
    }

    handleSaveWaterRecord(amountMl, period);
  };

  const handleDeleteRecord = async (id: string) => {
    if (!currentUser) return;
    try {
      // Executa a query DELETE FROM no SQLite
      await Database.deletarConsumo(Number(id));
      
      // Sincroniza o consumo atual do SQLite
      await carregarConsumosDoUsuario(Number(currentUser.id));
    } catch (e) {
      console.error("Erro ao deletar consumo:", e);
    }
  };

  // Reminder Management
  const handleToggleReminder = (id: string) => {
    const updated = reminders.map((r) => {
      if (r.id === id) {
        return { ...r, active: !r.active };
      }
      return r;
    });
    setReminders(updated);
    localStorage.setItem("aquaman_reminders", JSON.stringify(updated));
  };

  const handleAddReminder = (time: string, label?: string) => {
    const newRem: Reminder = {
      id: "rem-" + Math.random().toString(36).substring(2, 9),
      time,
      active: true,
      label,
    };
    const updated = [...reminders, newRem];
    setReminders(updated);
    localStorage.setItem("aquaman_reminders", JSON.stringify(updated));
    triggerSimulatedNotification(
      "Lembrete Adicionado!",
      `Seu alarme diário para às ${time} foi ativado com sucesso!`,
      "⏰"
    );
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    localStorage.setItem("aquaman_reminders", JSON.stringify(updated));
  };

  const triggerSimulatedNotification = (title: string, message: string, icon = "🔔") => {
    const id = Math.random().toString();
    setActiveToast({ id, title, message, icon });
    
    // Auto clear after 4.5 seconds
    setTimeout(() => {
      setActiveToast((current) => (current?.id === id ? null : current));
    }, 4500);
  };

  const handleTriggerInteractiveAlert = () => {
    triggerSimulatedNotification(
      "Hora de se Hidratar! 💧",
      "Aquaman avisa: Seu corpo precisa de água no momento. Beba 250ml agora para oxigenar seu organismo!",
      "💙"
    );
  };

  // Informational calc updates goal
  const handleUpdateUserGoal = async (newGoalMl: number) => {
    if (!currentUser) return;
    try {
      // 1. Atualizar e sincronizar na tabela 'configuracoes' do SQLite
      const current_config = await Database.buscarConfiguracoes(Number(currentUser.id));
      await Database.salvarOuAtualizarConfiguracoes(
        Number(currentUser.id),
        newGoalMl,
        current_config?.horario_lembrete1 || "08:00",
        current_config?.horario_lembrete2 || "14:00",
        current_config?.horario_lembrete3 || "20:00"
      );

      // 2. Atualiza estado e cache de sessão local
      const updatedUser = { ...currentUser, dailyGoalMl: newGoalMl };
      setCurrentUser(updatedUser);
      localStorage.setItem("aquaman_active_user", JSON.stringify(updatedUser));

      triggerSimulatedNotification(
        "Meta Sincronizada!",
        `Sua nova meta diária é de ${newGoalMl}ml (atualizado no SQLite com sucesso!).`,
        "🎯"
      );
    } catch (e) {
      console.error("Erro ao atualizar meta diária:", e);
    }
  };


  return (
    <MobileFrame>
      {/* Global simulated OS Notification Overlay with smooth spring animation */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ y: -120, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="absolute top-12 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-2xl p-4 shadow-2xl z-50 flex items-start gap-3 text-white"
          >
            <div className="text-2xl mt-0.5 shrink-0 select-none">
              {activeToast.icon}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold font-sans tracking-tight text-sky-400">
                  {activeToast.title}
                </span>
                <span className="text-[9px] font-mono font-bold text-slate-400 select-none">
                  AGORA
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-normal font-sans">
                {activeToast.message}
              </p>
              
              {/* Animated audio waves indicator simulating alarme ringtone */}
              <div className="flex items-center gap-1 text-[9px] text-cyan-400 pt-1 font-semibold">
                <Volume2 className="w-3.5 h-3.5" />
                <span className="flex gap-0.5 items-end h-2 ml-1">
                  <span className="w-0.5 bg-cyan-400 animate-[bounce_1s_infinite_100ms] h-2" />
                  <span className="w-0.5 bg-cyan-400 animate-[bounce_1s_infinite_400ms] h-3.5" />
                  <span className="w-0.5 bg-cyan-400 animate-[bounce_1s_infinite_200ms] h-1.5" />
                  <span className="w-0.5 bg-cyan-400 animate-[bounce_1s_infinite_600ms] h-3" />
                </span>
                <span className="text-[8px] uppercase tracking-wider ml-1">Tom de Alerta Ativo</span>
              </div>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="p-1 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer border-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main app navigation shell */}
      {!currentUser ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          
          {/* Main Internal Header */}
          <header className="h-14 px-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white font-black shadow-sm font-sans">
                A
              </div>
              <div>
                <h1 className="text-xs font-sans font-black tracking-tight text-slate-800 leading-none">
                  AQUAMAN
                </h1>
                <span className="text-[9px] font-mono text-blue-500 font-extrabold uppercase">
                  Rotina Saudável
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* User Avatar Initials card */}
              <div className="flex items-center gap-1 text-slate-700 font-medium text-xs bg-slate-100/80 px-2 py-1 rounded-xl">
                <UserIcon className="w-3 h-3 text-slate-500" />
                <span className="max-w-[80px] truncate">{currentUser.name}</span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                title="Sair da Conta"
                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all border-none cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Current view switcher screen content area */}
          <main className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
            {screen === "dashboard" && (
              <Dashboard
                currentUser={currentUser}
                waterRecords={waterRecords}
                onOpenAddModal={() => setIsAddModalOpen(true)}
                onAddQuickLiquid={handleAddQuickLiquid}
              />
            )}
            
            {screen === "history" && (
              <HistoryList
                currentUser={currentUser}
                waterRecords={waterRecords}
                onDeleteRecord={handleDeleteRecord}
              />
            )}

            {screen === "reminders" && (
              <RemindersScreen
                reminders={reminders}
                onToggleReminder={handleToggleReminder}
                onAddReminder={handleAddReminder}
                onDeleteReminder={handleDeleteReminder}
                onSendSimulationNotification={handleTriggerInteractiveAlert}
              />
            )}

            {screen === "info" && (
              <InfoScreen
                currentUser={currentUser}
                onUpdateGoal={handleUpdateUserGoal}
              />
            )}
          </main>

          {/* Core App Floating Action Button to Add Water */}
          {screen === "dashboard" && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsAddModalOpen(true)}
              className="absolute bottom-16 right-5 w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-sky-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/35 border-0 focus:outline-none cursor-pointer z-30"
            >
              <Plus className="w-6 h-6 stroke-[3px]" />
            </motion.button>
          )}

          {/* Mobile bottom Navigation Tab bar */}
          <nav className="h-14 bg-white border-t border-slate-100 flex items-center shrink-0 z-10 select-none pb-1">
            {[
              { id: "dashboard", label: "Consumo", icon: Droplet },
              { id: "history", label: "Histórico", icon: Calendar },
              { id: "reminders", label: "Lembretes", icon: Bell },
              { id: "info", label: "Benefícios", icon: BookOpen },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = screen === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setScreen(tab.id as any)}
                  className={`flex-1 flex flex-col items-center justify-center h-full transition-colors relative border-none bg-none outline-none cursor-pointer ${
                    isSelected ? "text-blue-500 font-bold" : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {/* Subtle active highlight dot */}
                  {isSelected && (
                    <motion.div
                      layoutId="navDot"
                      className="absolute top-0 w-8 h-1 bg-blue-500 rounded-b-full"
                    />
                  )}
                  <TabIcon className="w-5 h-5" />
                  <span className="text-[10px] mt-1 font-semibold tracking-tight">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Add intake Modal overlay */}
          <AddWaterModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleSaveWaterRecord}
          />
        </div>
      )}
    </MobileFrame>
  );
}
