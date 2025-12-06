import { PredictionResult } from './ai-models';
import { CandlePattern, ChartPattern } from './pattern-detection';
import { TechnicalFeatures } from './feature-engineering';
import { RiskConfig } from './risk-manager';

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasons: string[];
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: number;
}

export class DecisionEngine {
  private strategy: RiskConfig['strategy'];

  constructor(strategy: RiskConfig['strategy']) {
    this.strategy = strategy;
  }

  // Decisão final baseada em todos os fatores
  makeDecision(
    prediction: PredictionResult,
    candlePatterns: CandlePattern[],
    chartPatterns: ChartPattern[],
    features: TechnicalFeatures,
    currentPrice: number,
    multiTimeframeAlignment: boolean
  ): TradingSignal {
    const reasons: string[] = [];
    let bullishScore = 0;
    let bearishScore = 0;
    let totalWeight = 0;

    // 1. PREVISÃO DE IA (peso: 30%)
    const priceChange = ((prediction.predictedPrice - currentPrice) / currentPrice) * 100;
    const aiWeight = 0.3 * prediction.confidence;

    if (priceChange > 0.5) {
      bullishScore += aiWeight;
      reasons.push(`IA prevê alta de ${priceChange.toFixed(2)}% (confiança: ${(prediction.confidence * 100).toFixed(0)}%)`);
    } else if (priceChange < -0.5) {
      bearishScore += aiWeight;
      reasons.push(`IA prevê queda de ${Math.abs(priceChange).toFixed(2)}% (confiança: ${(prediction.confidence * 100).toFixed(0)}%)`);
    }
    totalWeight += aiWeight;

    // 2. PADRÕES DE CANDLES (peso: 20%)
    const candleWeight = 0.2;
    for (const pattern of candlePatterns) {
      const patternScore = pattern.confidence * candleWeight;
      if (pattern.type === 'BULLISH') {
        bullishScore += patternScore;
        reasons.push(`Padrão ${pattern.name} detectado (bullish)`);
      } else if (pattern.type === 'BEARISH') {
        bearishScore += patternScore;
        reasons.push(`Padrão ${pattern.name} detectado (bearish)`);
      }
      totalWeight += patternScore;
    }

    // 3. PADRÕES GRÁFICOS (peso: 20%)
    const chartWeight = 0.2;
    for (const pattern of chartPatterns) {
      const patternScore = pattern.confidence * chartWeight;
      if (pattern.type === 'BULLISH' || pattern.type === 'REVERSAL') {
        bullishScore += patternScore;
        reasons.push(`Padrão gráfico ${pattern.name} (${pattern.type})`);
      } else if (pattern.type === 'BEARISH') {
        bearishScore += patternScore;
        reasons.push(`Padrão gráfico ${pattern.name} (${pattern.type})`);
      }
      totalWeight += patternScore;
    }

    // 4. INDICADORES TÉCNICOS (peso: 20%)
    const techWeight = 0.2;

    // RSI
    if (features.rsi_14 < 30) {
      bullishScore += techWeight * 0.3;
      reasons.push(`RSI oversold (${features.rsi_14.toFixed(0)})`);
    } else if (features.rsi_14 > 70) {
      bearishScore += techWeight * 0.3;
      reasons.push(`RSI overbought (${features.rsi_14.toFixed(0)})`);
    }

    // MACD
    if (features.macd > features.macd_signal && features.macd_histogram > 0) {
      bullishScore += techWeight * 0.3;
      reasons.push('MACD bullish crossover');
    } else if (features.macd < features.macd_signal && features.macd_histogram < 0) {
      bearishScore += techWeight * 0.3;
      reasons.push('MACD bearish crossover');
    }

    // Bollinger Bands
    if (features.close < features.bb_lower) {
      bullishScore += techWeight * 0.2;
      reasons.push('Preço abaixo da banda inferior (possível reversão)');
    } else if (features.close > features.bb_upper) {
      bearishScore += techWeight * 0.2;
      reasons.push('Preço acima da banda superior (possível reversão)');
    }

    // ADX (força da tendência)
    if (features.adx_14 > 25) {
      const trendStrength = techWeight * 0.2;
      if (features.close > features.sma_50) {
        bullishScore += trendStrength;
        reasons.push(`Tendência de alta forte (ADX: ${features.adx_14.toFixed(0)})`);
      } else {
        bearishScore += trendStrength;
        reasons.push(`Tendência de baixa forte (ADX: ${features.adx_14.toFixed(0)})`);
      }
    }

    totalWeight += techWeight;

    // 5. MULTI-TIMEFRAME ALIGNMENT (peso: 10%)
    const mtfWeight = 0.1;
    if (multiTimeframeAlignment) {
      if (features.higher_tf_trend && features.higher_tf_trend > 0) {
        bullishScore += mtfWeight;
        reasons.push('Alinhamento multi-timeframe bullish');
      } else if (features.higher_tf_trend && features.higher_tf_trend < 0) {
        bearishScore += mtfWeight;
        reasons.push('Alinhamento multi-timeframe bearish');
      }
      totalWeight += mtfWeight;
    }

    // NORMALIZAR SCORES
    const normalizedBullish = totalWeight > 0 ? bullishScore / totalWeight : 0;
    const normalizedBearish = totalWeight > 0 ? bearishScore / totalWeight : 0;

    // APLICAR FILTROS DE ESTRATÉGIA
    const minConfidence = this.getMinConfidence();
    const netScore = normalizedBullish - normalizedBearish;
    const confidence = Math.abs(netScore);

    // DECISÃO FINAL
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

    if (confidence >= minConfidence) {
      if (netScore > 0) {
        action = 'BUY';
      } else if (netScore < 0) {
        action = 'SELL';
      }
    } else {
      reasons.push(`Confiança insuficiente (${(confidence * 100).toFixed(0)}% < ${(minConfidence * 100).toFixed(0)}%)`);
    }

    return {
      action,
      confidence,
      reasons,
      entryPrice: currentPrice,
      timestamp: Date.now(),
    };
  }

  // Verificar convergência entre múltiplos timeframes
  checkMultiTimeframeAlignment(
    predictions: { [timeframe: string]: PredictionResult },
    currentPrice: number
  ): boolean {
    const timeframes = Object.keys(predictions);
    if (timeframes.length < 3) return false;

    let bullishCount = 0;
    let bearishCount = 0;

    for (const tf of timeframes) {
      const pred = predictions[tf];
      const change = ((pred.predictedPrice - currentPrice) / currentPrice) * 100;

      if (change > 0.3) bullishCount++;
      else if (change < -0.3) bearishCount++;
    }

    // Pelo menos 70% dos timeframes devem concordar
    const threshold = Math.ceil(timeframes.length * 0.7);
    return bullishCount >= threshold || bearishCount >= threshold;
  }

  // Obter confiança mínima baseada na estratégia
  private getMinConfidence(): number {
    switch (this.strategy) {
      case 'AGGRESSIVE':
        return 0.55; // Aceita sinais com confiança menor
      case 'MEDIUM':
        return 0.65;
      case 'CONSERVATIVE':
        return 0.75; // Exige alta confiança
    }
  }

  // Atualizar estratégia
  updateStrategy(strategy: RiskConfig['strategy']) {
    this.strategy = strategy;
  }
}
