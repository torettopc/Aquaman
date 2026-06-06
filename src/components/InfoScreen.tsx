/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Sparkles, Scale, Heart, Battery, Brain, Shield, Info, Check } from "lucide-react";
import { User } from "../types";

interface InfoScreenProps {
  currentUser: User | null;
  onUpdateGoal: (newGoalMl: number) => void;
}

export default function InfoScreen({ currentUser, onUpdateGoal }: InfoScreenProps) {
  const [weight, setWeight] = useState("70");
  const [calculatedGoal, setCalculatedGoal] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleCalculate = (e: FormEvent) => {
    e.preventDefault();
    const kg = parseFloat(weight);
    if (!isNaN(kg) && kg > 0) {
      // Academic health formula: ~35ml of water per kg
      const recomended = Math.round(kg * 35);
      setCalculatedGoal(recomended);
    }
  };

  const handleApplyGoal = () => {
    if (calculatedGoal) {
      onUpdateGoal(calculatedGoal);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    }
  };

  const benefits = [
    {
      icon: Heart,
      title: "Saúde Cardiovascular",
      color: "text-rose-500 bg-rose-50",
      desc: "O sangue fica mais fluido, facilitando o bombeamento cardíaco e regulando a pressão arterial estável.",
    },
    {
      icon: Battery,
      title: "Disposição e Energia",
      color: "text-amber-500 bg-amber-50",
      desc: "A desidratação leve (1% a 2%) causa cansaço frequente, dores de cabeça e cansaço muscular precoce.",
    },
    {
      icon: Brain,
      title: "Capacidade Cognitiva",
      color: "text-purple-500 bg-purple-50",
      desc: "O cérebro é composto por 75% de água. Hidratar melhora a concentração, foco e a memória de curto prazo.",
    },
    {
      icon: Shield,
      title: "Desintoxicação Natural",
      color: "text-teal-500 bg-teal-50",
      desc: "Essencial para os rins filtrarem resíduos metabólicos e prevenirem infecções e cálculos renais.",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      
      {/* Educational facts banner image and key context */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 to-sky-800 text-white p-5 shadow-lg shadow-sky-950/20">
        <div className="absolute top-0 right-0 p-3 opacity-15">
          <Info className="w-24 h-24 rotate-12" />
        </div>
        
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/40 px-2 py-0.5 rounded-full inline-block">
            Importância da Água
          </span>
          <h2 className="text-xl font-sans font-extrabold tracking-tight">O Elixir da Vida</h2>
          <p className="text-xs text-sky-100 leading-relaxed font-sans font-normal">
            Beber água diariamente não é apenas uma necessidade biológica basilar, é o segredo mais simples para garantir vigor celular, manter a pele viçosa e otimizar funções renais e circulatórias.
          </p>
        </div>
      </div>

      {/* Interactive Hydration calculator */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500">
            <Scale className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Calculadora de Hidratação
          </h3>
        </div>

        <p className="text-[11px] text-slate-500 leading-normal">
          Segundo médicos e nutricionistas, o corpo precisa de aproximadamente <b>35 ml de água</b> por cada quilograma de peso corporal por dia. Calcule sua meta ideal abaixo:
        </p>

        <form onSubmit={handleCalculate} className="flex gap-2 items-center">
          <div className="flex-1">
            <input
              type="number"
              min="10"
              max="200"
              placeholder="Seu peso em kg (Ex: 75)"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-2 px-3 text-xs font-semibold focus:outline-none focus:border-blue-400 text-slate-800 text-center"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 font-sans font-semibold text-xs text-white rounded-2xl px-4 py-2 border-none active:scale-95 transition-transform cursor-pointer"
          >
            Calcular
          </button>
        </form>

        {calculatedGoal && (
          <div className="bg-blue-50/50 rounded-2xl p-3 text-center border border-blue-100 space-y-2">
            <div className="text-[11px] text-slate-600 font-medium">Sua meta ideal calculada:</div>
            <div className="text-2xl font-black font-sans text-blue-700">
              {calculatedGoal} ml <span className="text-xs font-semibold text-blue-500">({(calculatedGoal/1000).toFixed(1)}L)</span>
            </div>

            {currentUser ? (
              <button
                type="button"
                onClick={handleApplyGoal}
                className="inline-flex items-center justify-center gap-1.5 mt-1 bg-white hover:bg-slate-50 text-blue-600 border border-blue-200 text-xs font-bold py-1.5 px-3 rounded-xl active:scale-95 transition-all cursor-pointer shadow-xs"
              >
                {successMsg ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span>Meta Atualizada!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Definir como minha meta</span>
                  </>
                )}
              </button>
            ) : (
              <p className="text-[10px] text-slate-400 italic">
                Faça login para aplicar esta meta diretamente à sua conta.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Benefits grid list */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
          4 Benefícios Fantásticos
        </span>

        <div className="space-y-3">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="flex items-start gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs"
              >
                <div className={`p-2.5 rounded-xl shrink-0 ${b.color}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-800">{b.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans font-normal">
                    {b.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra Tips footer */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
        <h4 className="text-xs font-bold text-sky-950 mb-1">💡 Dica Extra do Aquaman</h4>
        <p className="text-[10px] text-slate-500 leading-normal">
          Não espere sentir sede para beber água! A sede já é o primeiro sinal que seu corpo envia indicando um estado inicial de desidratação. Estabeleça uma rotina com os lembretes do aplicativo.
        </p>
      </div>
    </div>
  );
}
