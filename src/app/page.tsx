'use client';

import { useState, useEffect } from 'react';
import { TradingBot, BotConfig, BotStatus } from '@/lib/bot/trading-bot';
import { supabase } from '@/lib/supabase';
import { Play, Pause, Settings, TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

export default function TradingBotDashboard() {
  const [bot, setBot] = useState<TradingBot | null>(null);
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [config, setConfig] = useState<Partial<BotConfig>>({
    mode: 'DRY_RUN',
    strategy: 'MEDIUM',
    riskPercentage: 2,
    symbols: ['BTC/USDT', 'ETH/USDT'],
    timeframes: ['1m', '15m', '1h', '4h', '1d'],
    dryRunInitialBalance: 10000, // Valor padrão
  });
  const [credentials, setCredentials] = useState({
    apiKey: '',
    secret: '',
    password: '',
  });
  const [user, setUser] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  // Atualizar status a cada 5 segundos
  useEffect(() => {
    if (bot) {
      const interval = setInterval(async () => {
        const newStatus = await bot.getStatus();
        setStatus(newStatus);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [bot]);

  const startBot = async () => {
    if (!user) {
      alert('Faça login primeiro!');
      return;
    }

    try {
      const newBot = new TradingBot({
        userId: user.id,
        credentials: config.mode === 'LIVE' || config.mode === 'BOTH' ? credentials : undefined,
        mode: config.mode as any,
        strategy: config.strategy as any,
        riskPercentage: config.riskPercentage!,
        symbols: config.symbols!,
        timeframes: config.timeframes as any,
        dryRunInitialBalance: config.dryRunInitialBalance || 10000, // Passar saldo configurado
      });

      await newBot.start();
      setBot(newBot);

      const initialStatus = await newBot.getStatus();
      setStatus(initialStatus);
    } catch (error: any) {
      alert(`Erro ao iniciar bot: ${error.message}`);
    }
  };

  const stopBot = () => {
    if (bot) {
      bot.stop();
      setBot(null);
      setStatus(null);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">🤖 BOT TRADER</h1>
          <p className="text-white/80 text-center mb-6">
            Faça login para acessar o bot de trading profissional
          </p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
          >
            Fazer Login / Cadastro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                🤖 BOT TRADER PRO
              </h1>
              <p className="text-white/70">
                Trading automatizado com IA avançada
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all"
              >
                <Settings className="w-5 h-5" />
                Configurar
              </button>
              {!bot ? (
                <button
                  onClick={startBot}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all hover:scale-105"
                >
                  <Play className="w-5 h-5" />
                  Iniciar Bot
                </button>
              ) : (
                <button
                  onClick={stopBot}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold transition-all hover:scale-105"
                >
                  <Pause className="w-5 h-5" />
                  Parar Bot
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Configuração */}
        {showConfig && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">⚙️ Configuração</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-white/80 text-sm mb-2 block">Modo de Operação</label>
                <select
                  value={config.mode}
                  onChange={(e) => setConfig({ ...config, mode: e.target.value as any })}
                  className="w-full bg-white/20 text-white border border-white/30 rounded-xl px-4 py-3"
                >
                  <option value="DRY_RUN">DRY RUN (Simulação)</option>
                  <option value="LIVE">LIVE (Real)</option>
                  <option value="BOTH">AMBOS</option>
                </select>
              </div>

              <div>
                <label className="text-white/80 text-sm mb-2 block">Estratégia</label>
                <select
                  value={config.strategy}
                  onChange={(e) => setConfig({ ...config, strategy: e.target.value as any })}
                  className="w-full bg-white/20 text-white border border-white/30 rounded-xl px-4 py-3"
                >
                  <option value="AGGRESSIVE">Agressiva</option>
                  <option value="MEDIUM">Média</option>
                  <option value="CONSERVATIVE">Conservadora</option>
                </select>
              </div>

              <div>
                <label className="text-white/80 text-sm mb-2 block">Risco Máximo (%)</label>
                <input
                  type="number"
                  value={config.riskPercentage}
                  onChange={(e) => setConfig({ ...config, riskPercentage: parseFloat(e.target.value) })}
                  min="0.5"
                  max="10"
                  step="0.5"
                  className="w-full bg-white/20 text-white border border-white/30 rounded-xl px-4 py-3"
                />
              </div>

              {/* Campo de Patrimônio DRY RUN */}
              {(config.mode === 'DRY_RUN' || config.mode === 'BOTH') && (
                <div>
                  <label className="text-white/80 text-sm mb-2 block">
                    💵 Patrimônio DRY RUN (saldo simulado)
                  </label>
                  <input
                    type="number"
                    value={config.dryRunInitialBalance}
                    onChange={(e) => setConfig({ ...config, dryRunInitialBalance: parseFloat(e.target.value) || 10000 })}
                    min="100"
                    max="1000000"
                    step="1000"
                    className="w-full bg-white/20 text-white border border-white/30 rounded-xl px-4 py-3"
                    placeholder="10000"
                  />
                  <p className="text-white/50 text-xs mt-1">
                    Saldo inicial para simulação (padrão: $10,000)
                  </p>
                </div>
              )}
            </div>

            {(config.mode === 'LIVE' || config.mode === 'BOTH') && (
              <div className="border-t border-white/20 pt-6">
                <h3 className="text-xl font-bold text-white mb-4">🔑 Credenciais OKX</h3>
                <div className="grid grid-cols-1 gap-4">
                  <input
                    type="text"
                    placeholder="API Key"
                    value={credentials.apiKey}
                    onChange={(e) => setCredentials({ ...credentials, apiKey: e.target.value })}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-xl px-4 py-3 placeholder-white/50"
                  />
                  <input
                    type="password"
                    placeholder="Secret Key"
                    value={credentials.secret}
                    onChange={(e) => setCredentials({ ...credentials, secret: e.target.value })}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-xl px-4 py-3 placeholder-white/50"
                  />
                  <input
                    type="password"
                    placeholder="Passphrase"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-xl px-4 py-3 placeholder-white/50"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status do Bot */}
        {status && (
          <>
            {/* Cards de Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Status</span>
                  <Activity className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {status.isRunning ? '🟢 Ativo' : '🔴 Parado'}
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Saldo USDT</span>
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  ${status.balance.USDT?.toFixed(2) || '0.00'}
                </p>
                {/* Exibir saldo inicial DRY RUN */}
                {status.mode !== 'LIVE' && status.dryRunInitialBalance && (
                  <p className="text-white/50 text-xs mt-1">
                    Inicial: ${status.dryRunInitialBalance.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Posições Abertas</span>
                  <Activity className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {status.openPositions}
                </p>
              </div>

              <div className={`bg-gradient-to-br ${status.profitLoss >= 0 ? 'from-green-500/20 to-emerald-500/20 border-green-500/30' : 'from-red-500/20 to-pink-500/20 border-red-500/30'} backdrop-blur-lg rounded-2xl p-6 border`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">Lucro/Perda</span>
                  {status.profitLoss >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <p className={`text-2xl font-bold ${status.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${status.profitLoss.toFixed(2)}
                </p>
                {/* Exibir percentual de retorno */}
                {status.mode !== 'LIVE' && status.dryRunInitialBalance && (
                  <p className="text-white/50 text-xs mt-1">
                    {((status.profitLoss / status.dryRunInitialBalance) * 100).toFixed(2)}% ROI
                  </p>
                )}
              </div>
            </div>

            {/* Card de Patrimônio Simulado (DRY RUN) */}
            {status.mode !== 'LIVE' && status.dryRunInitialBalance && (
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-amber-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-amber-400" />
                  <h3 className="text-xl font-bold text-white">💰 Patrimônio Simulado (DRY RUN)</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-white/70 text-sm mb-1">Saldo Inicial</p>
                    <p className="text-2xl font-bold text-white">
                      ${status.dryRunInitialBalance.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-1">Saldo Atual</p>
                    <p className="text-2xl font-bold text-white">
                      ${status.balance.USDT?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/70 text-sm mb-1">Variação</p>
                    <p className={`text-2xl font-bold ${status.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {status.profitLoss >= 0 ? '+' : ''}{((status.profitLoss / status.dryRunInitialBalance) * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Previsões */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4">🔮 Previsões de IA</h2>
              <div className="space-y-4">
                {Object.entries(status.predictions).map(([symbol, timeframes]) => (
                  <div key={symbol} className="bg-white/5 rounded-xl p-4">
                    <h3 className="text-xl font-bold text-white mb-3">{symbol}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {Object.entries(timeframes).map(([tf, pred]) => (
                        <div key={tf} className="bg-white/10 rounded-lg p-3">
                          <p className="text-white/70 text-xs mb-1">{tf}</p>
                          <p className="text-white font-bold text-lg">
                            ${pred.predictedPrice.toFixed(2)}
                          </p>
                          <p className="text-white/60 text-xs">
                            {(pred.confidence * 100).toFixed(0)}% confiança
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Info */}
        {!bot && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mt-6">
            <h2 className="text-2xl font-bold text-white mb-4">📚 Como Usar</h2>
            <div className="space-y-3 text-white/80">
              <p>1. Configure o modo de operação (DRY RUN para testar, LIVE para real)</p>
              <p>2. Se DRY RUN: defina o patrimônio simulado inicial (padrão: $10,000)</p>
              <p>3. Escolha sua estratégia (Agressiva, Média ou Conservadora)</p>
              <p>4. Defina o risco máximo por operação (recomendado: 1-3%)</p>
              <p>5. Se modo LIVE: adicione suas credenciais da OKX</p>
              <p>6. Clique em "Iniciar Bot" e acompanhe em tempo real!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
