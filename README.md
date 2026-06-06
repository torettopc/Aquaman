# 💧 Aquaman — Aplicativo Móvel de Lembretes de Consumo de Água

Bem-vindo ao **Aquaman**, o guardião definitivo da sua saúde e hidratação! Desenvolvido como um aplicativo móvel avançado com design responsivo (mockup nativo integrado no preview), este projeto fornece um ecossistema completo de hidratação.

---

## 🚀 Como Executar o Preview Web

Se você está explorando os arquivos do workspace e deseja iniciar a execução do preview web do React construído em Vite, execute os seguintes passos simples no seu terminal:

1. **Instalar dependências locais**:
   ```bash
   npm install
   ```
2. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

O aplicativo iniciará de forma interativa em `http://localhost:3000` (porta padrão das rotas do container).

---

## 📱 Portabilidade para React Native (Código Nativo)

Como o escopo original planeja também a compilação nativa em smartphones (iOS & Android) utilizando **React Native**, estruturamos nossa lógica de componentes para ser diretamente portável com pouquíssimas substituições de tags.

Abaixo, descrevemos o guia de instalação, as bibliotecas recomendadas correspondentes no React Native e como cada parte funciona.

### 📦 1. Bibliotecas Recomendadas para React Native

Para reproduzir as mesmas telas e comportamentos de forma nativa e persistente no celular, instale os seguintes pacotes em seu projeto Expo ou React Native Bare:

```bash
# Navegação entre as telas (Equivalente ao nosso roteador de Abas)
npm install @react-navigation/native @react-navigation/bottom-tabs

# Gráficos e Vetores de Água Ondulada (Equivalente ao nosso SVG & Framer Motion)
npm install react-native-svg react-native-reanimated

# Salvamento de Usuários e Históricos (Equivalente ao nosso localStorage)
npm install @react-native-async-storage/async-storage

# Lembretes Diários e Notificações Locais (Equivalente ao nosso disparador virtual)
expo install expo-notifications # Se usar Expo
# OU
npm install react-native-push-notification # Se usar RN CLI Puro
```

---

## 📑 Explicação Breve de Como Cada Parte Funciona

### 1. 🔐 Cadastro e Autenticação (`src/components/AuthScreen.tsx`)
- **Como funciona**: O arquivo gerencia dois fluxos em um formulário bonito e fluido: login e registro. Ele lê e atualiza uma lista de contas de usuário persistidas localmente no cache (`localStorage` mapeado para `AsyncStorage` no React Native).
- **Meta Automática**: No cadastro, o usuário pode personalizar sua meta de litros ideal. Se não souber, pode usar o indicador padrão de `2000ml`.

### 2. 💧 Controle e Registro de Consumo (`src/components/Dashboard.tsx` & `WaterWave.tsx`)
- **Visual Ondulado**: O componente `WaterWave.tsx` renderiza um círculo de água flutuante com um efeito dinâmico de duas ondas que correm infinitamente e sobem/descem dependendo da porcentagem diária batida.
- **Rápido vs. Detalhado**: O usuário pode clicar no botão flutuante de adição para abrir o modal de lançamento de água em mililitros (ml) ou litros (L), escolhendo inteligentemente o período do dia (Manhã 🌅, Tarde ☀️, Noite 🌙) que já vem pré-selecionado de acordo com seu relógio. Também pode registrar com comandos de pressões únicas nos botões de atalho rápidos de 150ml, 250ml e 500ml.

### 3. ⏰ Sistema Inteligente de Lembretes (`src/components/RemindersScreen.tsx`)
- **Como Funciona**: Permite configurar múltiplos horários de alarme ou carregar os horários recomendados (08:00, 11:00, 14:00, 17:00, 20:00).
- **Notificação Simulada**: Integramos um disparador interativo de "Notificação Imediata". No React Native nativo, essa simulação é substituída pelo agendador do celular:
  ```typescript
  // Exemplo em React Native utilizando Expo Notifications:
  import * as Notifications from 'expo-notifications';

  async function scheduleWaterReminder(timeString: string, label: string) {
    const [hours, minutes] = timeString.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Hora de se Hidratar! 💧",
        body: label || "O Aquaman lembra: Beba água agora para revitalizar seu corpo!",
        sound: true,
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }
  ```

### 📈 4. Histórico Semanal e Streaks (`src/components/HistoryList.tsx`)
- **Visualização**: Implementa gráficos de desempenho semanário desenhados em barras limpas SVG para verificar seu consumo recente.
- **Streak Fire (Fogo Ativo)**: Calcula retroativamente se o usuário atingiu ou ultrapassou a meta de água corporal nos dias anteriores consecutivamente, garantindo um "streak" de incentivo gamificado!

### 📖 5. Aba Informativa e Calculadora Fisiológica (`src/components/InfoScreen.tsx`)
- **Explicação Científica**: Descreve os 4 pilares fundamentais da hidratação celular (Cardíaco, Energético, Cognitivo e Renal).
- **Calculadora por Peso**: O usuário insere seu peso exato e o sistema calcula a recomendação precisa de `35ml` por quilo. Ao clicar, o app atualiza dinamicamente a meta atualizada de consumo diário no histórico do usuário logado!

---

## 🛠️ Boas Práticas Adotadas

1. **TypeScript Completo**: Tipagem rígida para registros de água (`WaterRecord`), períodos (`DayPeriod`), usuários (`User`) e mais, evitando comportamentos imprevisíveis.
2. **Offline-First**: Toda atividade, lembretes ativos e usuários registrados são imediatamente salvos, restando ativos mesmo que você feche a guia ou reinicie a máquina.
3. **Identidade Visual Temática**: Tons harmoniosos de azuis, brancos, azuis cobalto escuros e glows suaves, inspirados no personagem e nas profundezas cristalinas dos oceanos.
