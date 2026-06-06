/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { User } from "../types";
import { motion } from "motion/react";
import { Lock, Mail, User as UserIcon, Droplet, ArrowRight, AlertCircle, Sparkles } from "lucide-react";
import { Database } from "../services/Database";

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Registration States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dailyGoal, setDailyGoal] = useState("2000"); // typical default

  // Error/Success Notification state
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!email || !password || (!isLogin && !name)) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (password.length < 4) {
      setError("A senha deve ter no mínimo 4 caracteres.");
      return;
    }

    const emailNormalized = email.trim().toLowerCase();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Realizaremos a busca através do SQLite / Banco de Dados
        const result = await Database.buscarUsuarioPorEmailSenha(emailNormalized, password);
        
        if (result) {
          // Busca a meta_diaria do usuário na tabela configuracoes
          const config = await Database.buscarConfiguracoes(result.id);
          const goal = config ? config.meta_diaria : 2000;

          const sessionUser: User = {
            id: String(result.id),
            name: result.nome,
            email: result.email,
            dailyGoalMl: goal,
          };
          onLoginSuccess(sessionUser);
        } else {
          setError("E-mail ou senha incorretos.");
        }
      } else {
        // Fluxo de Cadastro real via SQLite
        const goalNum = parseInt(dailyGoal, 10);
        if (isNaN(goalNum) || goalNum <= 0) {
          setError("Meta de consumo diário deve ser um número positivo.");
          setIsLoading(false);
          return;
        }

        // 1. Cadastra na tabela 'usuarios'
        const newUser = await Database.cadastrarUsuario(name.trim(), emailNormalized, password);
        
        // 2. Cria as configurações iniciais do usuário na tabela 'configuracoes'
        await Database.salvarOuAtualizarConfiguracoes(
          newUser.id,
          goalNum,
          "08:00",
          "14:00",
          "20:00"
        );

        const sessionUser: User = {
          id: String(newUser.id),
          name: newUser.nome,
          email: newUser.email,
          dailyGoalMl: goalNum,
        };

        onLoginSuccess(sessionUser);
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const autoFillDemoUser = (emailVal: string) => {
    setEmail(emailVal);
    setPassword("password123");
    setIsLogin(true);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-sky-50 to-white overflow-y-auto w-full">
      
      {/* Upper Branded Header */}
      <div className="flex flex-col items-center mt-6">
        <motion.div
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: "easeInOut",
          }}
          className="w-16 h-16 rounded-3xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/30 mb-3"
        >
          <Droplet className="w-8 h-8 text-white fill-current" />
        </motion.div>
        
        <h1 className="text-3xl font-sans font-extrabold text-slate-900 tracking-tight">
          Aquaman
        </h1>
        <p className="text-xs font-sans text-sky-600/80 uppercase font-bold tracking-widest mt-1">
          Seu Guardião da Hidratação
        </p>
      </div>

      {/* Main Login / Registration Form */}
      <div className="my-auto py-4">
        <div className="bg-white rounded-3xl p-6 shadow-xl shadow-sky-100/50 border border-sky-100">
          <h2 className="text-xl font-sans font-bold text-slate-800 mb-4">
            {isLogin ? "Bem-vindo de volta" : "Criar sua Conta"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Name Field - Reg Only */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Nome Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Ex: Fernando"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Min. 4 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Hydration Target - Reg Only */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500">Meta Diária de Água (ml)</label>
                <div className="relative">
                  <Droplet className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    min="100"
                    placeholder="Ex: 2000"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Action Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-sans font-semibold rounded-2xl py-3 border-0 mt-2 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-transform cursor-pointer"
            >
              <span>{isLogin ? "Entrar" : "Registrar"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Switch flow */}
          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400">
              {isLogin ? "Ainda não tem conta?" : "Já tem registro?"}
            </span>{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs font-bold text-blue-500 hover:underline border-none bg-none outline-none cursor-pointer"
            >
              {isLogin ? "Cadastre-se" : "Faça Login"}
            </button>
          </div>
        </div>

        {/* Demo Fast Logins Section for convenience */}
        {isLogin && (
          <div className="mt-4 bg-blue-50/50 rounded-2xl p-3 border border-blue-100/50 text-center">
            <div className="text-[11px] font-mono font-medium text-blue-600 mb-2 flex items-center justify-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Acesso Rápido de Demonstração</span>
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => autoFillDemoUser("fernando@gmail.com")}
                className="bg-white border border-blue-200 text-xs px-3 py-1.5 rounded-xl font-medium text-blue-700 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
              >
                Fernando
              </button>
              <button
                onClick={() => autoFillDemoUser("maria@outlook.com")}
                className="bg-white border border-blue-200 text-xs px-3 py-1.5 rounded-xl font-medium text-blue-700 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
              >
                Maria
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Decorative footer */}
      <div className="text-center pb-2">
        <p className="text-[10px] text-slate-400 font-sans">
          Beba água regularmente, sinta-se incrível.
        </p>
      </div>
    </div>
  );
}
