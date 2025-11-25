import { OKXClient, OKXCredentials } from './okx-client';
import { AIModels, PredictionResult } from './ai-models';
import { FeatureEngineer, TechnicalFeatures } from './feature-engineering';
import { PatternDetector } from './pattern-detection';
import { RiskManager, RiskConfig } from './risk-manager';
import { DecisionEngine, TradingSignal } from './decision-engine';
import { supabase } from '../supabase';

export interface BotConfig {
  userId: string;
  credentials?: OKXCredentials;
  mode: 'LIVE' | 'DRY_RUN' | 'BOTH';
  strategy: 'AGGRESSIVE' | 'MEDIUM' | 'CONSERVATIVE';
  riskPercentage: number;
  symbols: string[];
  timeframes: ('1m' | '15m' | '1h' | '4h' | '1d')[];
}

export interface BotStatus {
  isRunning: boolean;
  mode: string;
  strategy: string;
  balance: { [key: string]: number };
  openPositions: number;
  totalTrades: number;
  profitLoss: number;
  predictions: { [symbol: string]: { [timeframe: string]: PredictionResult } };
  lastUpdate: number;
}

export class TradingBot {
  private config: BotConfig;
  private okxLive: OKXClient | null = null;
  private okxDryRun: OKXClient | null = null;
  private aiModels: AIModels;
  private riskManager: RiskManager;
  private decisionEngine: DecisionEngine;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private predictions: { [symbol: string]: { [timeframe: string]: PredictionResult } } = {};
  private openPositions: Map<string, any> = new Map();

  constructor(config: BotConfig) {
    this.config = config;

    // Inicializar clientes OKX
    if (config.mode === 'LIVE' || config.mode === 'BOTH') {
      if (!config.credentials) {
        throw new Error('Credenciais OKX necessárias para modo LIVE');
      }
      this.okxLive = new OKXClient(config.credentials, false);
    }

    if (config.mode === 'DRY_RUN' || config.mode === 'BOTH') {
      this.okxDryRun = new OKXClient(undefined, true);
    }

    // Inicializar módulos de IA e decisão
    this.aiModels = new AIModels();
    this.riskManager = new RiskManager({
      maxRiskPercentage: config.riskPercentage,
      strategy: config.strategy,
    });
    this.decisionEngine = new DecisionEngine(config.strategy);
  }

  // Iniciar bot
  async start() {
    if (this.isRunning) {
      console.log('Bot já está rodando');
      return;
    }

    this.isRunning = true;
    console.log(`🤖 Bot iniciado em modo ${this.config.mode}`);
    console.log(`📊 Estratégia: ${this.config.strategy}`);
    console.log(`💰 Risco máximo: ${this.config.riskPercentage}%`);

    // Loop principal
    this.intervalId = setInterval(() => {
      this.mainLoop();
    }, 60000); // Executar a cada 1 minuto

    // Executar imediatamente
    await this.mainLoop();
  }

  // Parar bot
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Bot parado');
  }

  // Loop principal do bot
  private async mainLoop() {
    try {
      for (const symbol of this.config.symbols) {
        await this.processSymbol(symbol);
      }

      // Verificar posições abertas
      await this.checkOpenPositions();

      // Salvar status no Supabase
      await this.saveStatus();
    } catch (error) {
      console.error('Erro no loop principal:', error);
    }
  }

  // Processar um símbolo
  private async processSymbol(symbol: string) {
    try {
      const client = this.okxDryRun || this.okxLive;
      if (!client) return;

      // Buscar dados históricos para todos os timeframes
      const candlesData: { [tf: string]: any[] } = {};
      for (const tf of this.config.timeframes) {
        candlesData[tf] = await client.fetchOHLCV(symbol, tf, 250);
      }

      // Gerar features para timeframe principal (1h)
      const mainTf = '1h';
      const features = FeatureEngineer.calculateFeatures(
        candlesData[mainTf],
        candlesData['4h'],
        candlesData['15m']
      );

      // Normalizar features para IA
      const normalizedFeatures = FeatureEngineer.normalizeFeatures(features);

      // Fazer previsões para todos os timeframes
      const currentPrice = await client.fetchCurrentPrice(symbol);
      this.predictions[symbol] = {};

      for (const tf of this.config.timeframes) {
        const prediction = await this.aiModels.predict(normalizedFeatures, currentPrice, tf);
        this.predictions[symbol][tf] = prediction;

        // Salvar previsão no Supabase
        await this.savePrediction(symbol, tf, prediction, currentPrice);
      }

      // Detectar padrões
      const candlePatterns = PatternDetector.detectCandlePatterns(candlesData[mainTf]);
      const chartPatterns = PatternDetector.detectChartPatterns(candlesData[mainTf]);

      // Verificar alinhamento multi-timeframe
      const mtfAlignment = this.decisionEngine.checkMultiTimeframeAlignment(
        this.predictions[symbol],
        currentPrice
      );

      // Tomar decisão
      const latestFeature = features[features.length - 1];
      const signal = this.decisionEngine.makeDecision(
        this.predictions[symbol][mainTf],
        candlePatterns,
        chartPatterns,
        latestFeature,
        currentPrice,
        mtfAlignment
      );

      console.log(`\n📊 ${symbol} - ${signal.action}`);
      console.log(`   Confiança: ${(signal.confidence * 100).toFixed(0)}%`);
      console.log(`   Razões: ${signal.reasons.join(', ')}`);

      // Executar trade se sinal válido
      if (signal.action !== 'HOLD') {
        await this.executeTrade(symbol, signal, currentPrice, latestFeature);
      }

      // Treinar modelos com novos dados (aprendizado online)
      const targets = features.map(f => f.returns / 10);
      await this.aiModels.trainModels(normalizedFeatures, targets, 1);
    } catch (error) {
      console.error(`Erro ao processar ${symbol}:`, error);
    }
  }

  // Executar trade
  private async executeTrade(
    symbol: string,
    signal: TradingSignal,
    currentPrice: number,
    features: TechnicalFeatures
  ) {
    try {
      // Buscar saldo
      const client = this.okxDryRun || this.okxLive;
      if (!client) return;

      const balance = await client.fetchBalance();
      const [base, quote] = symbol.split('/');
      const availableBalance = balance[quote] || 0;

      if (availableBalance < 10) {
        console.log(`   ⚠️ Saldo insuficiente: ${availableBalance} ${quote}`);
        return;
      }

      // Calcular tamanho da posição
      const volatility = features.atr_14;
      const position = this.riskManager.calculatePositionSize(
        availableBalance,
        currentPrice,
        volatility,
        signal.confidence
      );

      // Verificar se deve entrar
      const trendStrength = Math.abs(features.adx_14) / 100;
      const shouldEnter = this.riskManager.shouldEnterTrade(
        signal.confidence,
        volatility / currentPrice,
        trendStrength
      );

      if (!shouldEnter) {
        console.log(`   ⚠️ Condições de risco não atendidas`);
        return;
      }

      // Executar ordem
      const side = signal.action === 'BUY' ? 'buy' : 'sell';
      const order = await client.createOrder(symbol, side, position.amount);

      console.log(`   ✅ Ordem executada: ${side.toUpperCase()} ${position.amount} ${base}`);
      console.log(`   💰 Stop Loss: ${position.stopLoss.toFixed(2)}`);
      console.log(`   🎯 Take Profit: ${position.takeProfit.toFixed(2)}`);

      // Salvar trade no Supabase
      await this.saveTrade(symbol, signal, order, position);

      // Adicionar às posições abertas
      this.openPositions.set(symbol, {
        symbol,
        side,
        entryPrice: currentPrice,
        amount: position.amount,
        stopLoss: position.stopLoss,
        takeProfit: position.takeProfit,
        highestPrice: currentPrice,
        order,
      });
    } catch (error) {
      console.error(`Erro ao executar trade:`, error);
    }
  }

  // Verificar posições abertas
  private async checkOpenPositions() {
    const client = this.okxDryRun || this.okxLive;
    if (!client) return;

    for (const [symbol, position] of this.openPositions.entries()) {
      try {
        const currentPrice = await client.fetchCurrentPrice(symbol);

        // Atualizar maior preço
        if (currentPrice > position.highestPrice) {
          position.highestPrice = currentPrice;
        }

        // Verificar se deve fechar
        const { shouldClose, reason } = this.riskManager.shouldClosePosition(
          position.entryPrice,
          currentPrice,
          position.highestPrice,
          position.stopLoss
        );

        if (shouldClose) {
          const closeSide = position.side === 'buy' ? 'sell' : 'buy';
          await client.createOrder(symbol, closeSide, position.amount);

          const profitLoss =
            position.side === 'buy'
              ? (currentPrice - position.entryPrice) * position.amount
              : (position.entryPrice - currentPrice) * position.amount;

          console.log(`   🔴 Posição fechada: ${symbol} (${reason})`);
          console.log(`   💵 P/L: ${profitLoss.toFixed(2)} USDT`);

          // Remover das posições abertas
          this.openPositions.delete(symbol);

          // Atualizar trade no Supabase
          await this.updateTrade(symbol, currentPrice, profitLoss);
        }
      } catch (error) {
        console.error(`Erro ao verificar posição ${symbol}:`, error);
      }
    }
  }

  // Salvar previsão no Supabase
  private async savePrediction(
    symbol: string,
    timeframe: string,
    prediction: PredictionResult,
    currentPrice: number
  ) {
    try {
      await supabase.from('predictions').insert({
        user_id: this.config.userId,
        symbol,
        timeframe,
        predicted_price: prediction.predictedPrice,
        confidence_score: prediction.confidence,
        created_at: new Date(prediction.timestamp).toISOString(),
        closes_at: new Date(prediction.closesAt).toISOString(),
      });
    } catch (error) {
      console.error('Erro ao salvar previsão:', error);
    }
  }

  // Salvar trade no Supabase
  private async saveTrade(symbol: string, signal: TradingSignal, order: any, position: any) {
    try {
      await supabase.from('trades').insert({
        user_id: this.config.userId,
        symbol,
        side: signal.action,
        price: signal.entryPrice,
        amount: position.amount,
        mode: this.config.mode === 'BOTH' ? 'DRY_RUN' : this.config.mode,
        status: 'OPEN',
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao salvar trade:', error);
    }
  }

  // Atualizar trade no Supabase
  private async updateTrade(symbol: string, closePrice: number, profitLoss: number) {
    try {
      await supabase
        .from('trades')
        .update({
          status: 'CLOSED',
          profit_loss: profitLoss,
          closed_at: new Date().toISOString(),
        })
        .eq('user_id', this.config.userId)
        .eq('symbol', symbol)
        .eq('status', 'OPEN');
    } catch (error) {
      console.error('Erro ao atualizar trade:', error);
    }
  }

  // Salvar status do bot
  private async saveStatus() {
    // Implementar salvamento de status no Supabase
  }

  // Obter status do bot
  async getStatus(): Promise<BotStatus> {
    const client = this.okxDryRun || this.okxLive;
    const balance = client ? await client.fetchBalance() : {};

    // Calcular P/L total
    const { data: trades } = await supabase
      .from('trades')
      .select('profit_loss')
      .eq('user_id', this.config.userId)
      .eq('status', 'CLOSED');

    const totalPL = trades?.reduce((sum, t) => sum + (t.profit_loss || 0), 0) || 0;

    return {
      isRunning: this.isRunning,
      mode: this.config.mode,
      strategy: this.config.strategy,
      balance,
      openPositions: this.openPositions.size,
      totalTrades: trades?.length || 0,
      profitLoss: totalPL,
      predictions: this.predictions,
      lastUpdate: Date.now(),
    };
  }

  // Atualizar configuração
  updateConfig(newConfig: Partial<BotConfig>) {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.strategy) {
      this.riskManager.updateConfig({ strategy: newConfig.strategy });
      this.decisionEngine.updateStrategy(newConfig.strategy);
    }

    if (newConfig.riskPercentage) {
      this.riskManager.updateConfig({ maxRiskPercentage: newConfig.riskPercentage });
    }
  }
}
