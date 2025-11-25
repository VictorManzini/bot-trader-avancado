import { TechnicalFeatures } from './feature-engineering';

export interface PredictionResult {
  predictedPrice: number;
  confidence: number;
  timestamp: number;
  closesAt: number;
  model: string;
}

export interface ModelWeights {
  lstm: number;
  gru: number;
  tcn: number;
  transformer: number;
  xgboost: number;
  cnn: number;
}

// Implementação matemática pura dos modelos de IA (sem TensorFlow)
export class AIModels {
  private modelWeights: ModelWeights = {
    lstm: 0.2,
    gru: 0.2,
    tcn: 0.15,
    transformer: 0.2,
    xgboost: 0.15,
    cnn: 0.1,
  };

  private sequenceLength: number = 60;
  private learningRate: number = 0.01;

  // Histórico de acurácia dos modelos
  private modelAccuracy: { [key: string]: number[] } = {
    lstm: [],
    gru: [],
    tcn: [],
    transformer: [],
    xgboost: [],
    cnn: [],
  };

  constructor() {}

  // LSTM simulado - Long Short-Term Memory
  private predictLSTM(sequence: number[][]): number {
    // Implementação simplificada de LSTM usando média ponderada exponencial
    let prediction = 0;
    const weights = sequence.map((_, i) => Math.exp(i / sequence.length));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    for (let i = 0; i < sequence.length; i++) {
      const closePrice = sequence[i][0]; // Primeira feature é sempre o preço
      prediction += closePrice * (weights[i] / totalWeight);
    }

    // Adicionar momentum
    const recentPrices = sequence.slice(-10).map((s) => s[0]);
    const momentum = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0];
    prediction *= 1 + momentum * 0.3;

    return prediction;
  }

  // GRU simulado - Gated Recurrent Unit
  private predictGRU(sequence: number[][]): number {
    // GRU com foco em tendências recentes
    const recentWeight = 0.7;
    const historicalWeight = 0.3;

    const recentPrices = sequence.slice(-20).map((s) => s[0]);
    const historicalPrices = sequence.slice(0, -20).map((s) => s[0]);

    const recentAvg = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
    const historicalAvg =
      historicalPrices.length > 0
        ? historicalPrices.reduce((a, b) => a + b, 0) / historicalPrices.length
        : recentAvg;

    const prediction = recentAvg * recentWeight + historicalAvg * historicalWeight;

    // Ajustar por volatilidade
    const volatility = this.calculateVolatility(recentPrices);
    return prediction * (1 + volatility * 0.1);
  }

  // TCN simulado - Temporal Convolutional Network
  private predictTCN(sequence: number[][]): number {
    // TCN usa convoluções temporais - simulamos com janelas deslizantes
    const windowSize = 5;
    const predictions: number[] = [];

    for (let i = 0; i <= sequence.length - windowSize; i++) {
      const window = sequence.slice(i, i + windowSize);
      const windowPrices = window.map((s) => s[0]);
      const trend = (windowPrices[windowSize - 1] - windowPrices[0]) / windowPrices[0];
      predictions.push(windowPrices[windowSize - 1] * (1 + trend));
    }

    return predictions.reduce((a, b) => a + b, 0) / predictions.length;
  }

  // Transformer simulado - Attention mechanism
  private predictTransformer(sequence: number[][]): number {
    // Transformer usa attention - simulamos dando mais peso a padrões similares
    const currentPattern = sequence.slice(-10);
    const currentPrice = currentPattern[currentPattern.length - 1][0];

    let prediction = currentPrice;
    let totalAttention = 0;

    // Procurar padrões similares no histórico
    for (let i = 0; i < sequence.length - 10; i++) {
      const historicalPattern = sequence.slice(i, i + 10);
      const similarity = this.calculatePatternSimilarity(currentPattern, historicalPattern);

      if (similarity > 0.7) {
        const nextPrice = sequence[i + 10] ? sequence[i + 10][0] : currentPrice;
        prediction += nextPrice * similarity;
        totalAttention += similarity;
      }
    }

    return totalAttention > 0 ? prediction / (totalAttention + 1) : currentPrice;
  }

  // XGBoost simulado - Gradient Boosting
  private predictXGBoost(sequence: number[][], features: number[][]): number {
    // XGBoost usa árvores de decisão - simulamos com regras baseadas em features
    const lastFeatures = features[features.length - 1];
    const currentPrice = sequence[sequence.length - 1][0];

    let prediction = currentPrice;

    // Regra 1: RSI
    const rsi = lastFeatures[5] || 50;
    if (rsi > 70) prediction *= 0.98; // Sobrecomprado
    if (rsi < 30) prediction *= 1.02; // Sobrevendido

    // Regra 2: MACD
    const macd = lastFeatures[8] || 0;
    prediction *= 1 + macd * 0.01;

    // Regra 3: Volume
    const volume = lastFeatures[4] || 1;
    const avgVolume = features.slice(-20).reduce((sum, f) => sum + (f[4] || 1), 0) / 20;
    if (volume > avgVolume * 1.5) {
      const trend = (currentPrice - sequence[sequence.length - 5][0]) / sequence[sequence.length - 5][0];
      prediction *= 1 + trend * 0.2;
    }

    return prediction;
  }

  // CNN simulado - Convolutional Neural Network
  private predictCNN(sequence: number[][]): number {
    // CNN detecta padrões visuais - simulamos detectando formações de preço
    const prices = sequence.map((s) => s[0]);
    const currentPrice = prices[prices.length - 1];

    // Detectar padrão de alta
    const isUptrend = this.detectUptrend(prices);
    const isDowntrend = this.detectDowntrend(prices);

    let prediction = currentPrice;

    if (isUptrend) {
      const strength = this.calculateTrendStrength(prices, 'up');
      prediction *= 1 + strength * 0.02;
    } else if (isDowntrend) {
      const strength = this.calculateTrendStrength(prices, 'down');
      prediction *= 1 - strength * 0.02;
    }

    return prediction;
  }

  // Fazer previsão com ensemble de todos os modelos
  async predict(
    normalizedFeatures: number[][],
    currentPrice: number,
    timeframe: string
  ): Promise<PredictionResult> {
    if (normalizedFeatures.length < this.sequenceLength) {
      throw new Error(`Necessário pelo menos ${this.sequenceLength} features`);
    }

    const sequence = normalizedFeatures.slice(-this.sequenceLength);

    // Previsões de cada modelo
    const predictions: { [key: string]: number } = {
      lstm: this.predictLSTM(sequence),
      gru: this.predictGRU(sequence),
      tcn: this.predictTCN(sequence),
      transformer: this.predictTransformer(sequence),
      xgboost: this.predictXGBoost(sequence, normalizedFeatures),
      cnn: this.predictCNN(sequence),
    };

    // Ensemble com pesos adaptativos
    let ensemblePrediction = 0;
    let totalWeight = 0;

    for (const [model, pred] of Object.entries(predictions)) {
      const weight = this.modelWeights[model as keyof ModelWeights];
      ensemblePrediction += pred * weight;
      totalWeight += weight;
    }

    ensemblePrediction /= totalWeight;

    // Suavizar previsão (evitar picos irreais)
    const smoothedPrice = currentPrice * 0.4 + ensemblePrediction * 0.6;

    // Calcular confiança baseada na concordância dos modelos
    const predValues = Object.values(predictions);
    const mean = predValues.reduce((a, b) => a + b, 0) / predValues.length;
    const variance =
      predValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / predValues.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0.3, Math.min(1, 1 - (stdDev / currentPrice) * 100));

    // Calcular timestamp de fechamento
    const timeframeMs = this.getTimeframeMs(timeframe);
    const closesAt = Date.now() + timeframeMs;

    return {
      predictedPrice: smoothedPrice,
      confidence,
      timestamp: Date.now(),
      closesAt,
      model: 'ENSEMBLE',
    };
  }

  // Aprendizado online - atualizar pesos dos modelos
  async updateModelWeights(
    modelName: keyof ModelWeights,
    actualPrice: number,
    predictedPrice: number
  ) {
    const error = Math.abs(actualPrice - predictedPrice) / actualPrice;
    const accuracy = Math.max(0, 1 - error);

    // Registrar acurácia
    this.modelAccuracy[modelName].push(accuracy);
    if (this.modelAccuracy[modelName].length > 100) {
      this.modelAccuracy[modelName].shift();
    }

    // Ajustar peso do modelo baseado na acurácia recente
    const recentAccuracy =
      this.modelAccuracy[modelName].slice(-20).reduce((a, b) => a + b, 0) /
      Math.min(20, this.modelAccuracy[modelName].length);

    this.modelWeights[modelName] += this.learningRate * (recentAccuracy - 0.5);

    // Normalizar pesos (garantir que somem 1)
    const totalWeight = Object.values(this.modelWeights).reduce((a, b) => a + b, 0);
    for (const key in this.modelWeights) {
      this.modelWeights[key as keyof ModelWeights] = Math.max(
        0.05,
        this.modelWeights[key as keyof ModelWeights] / totalWeight
      );
    }
  }

  // Treinar modelos com novos dados (aprendizado contínuo)
  async trainModels(features: number[][], targets: number[]) {
    // Implementação de aprendizado incremental
    if (features.length < 10) return;

    // Atualizar pesos baseado em performance recente
    for (let i = 0; i < Math.min(features.length - 1, 20); i++) {
      const idx = features.length - 1 - i;
      const sequence = features.slice(Math.max(0, idx - this.sequenceLength), idx);

      if (sequence.length < this.sequenceLength) continue;

      const actualPrice = targets[idx];
      const predictions = {
        lstm: this.predictLSTM(sequence),
        gru: this.predictGRU(sequence),
        tcn: this.predictTCN(sequence),
        transformer: this.predictTransformer(sequence),
        xgboost: this.predictXGBoost(sequence, features),
        cnn: this.predictCNN(sequence),
      };

      // Atualizar pesos de cada modelo
      for (const [model, pred] of Object.entries(predictions)) {
        await this.updateModelWeights(model as keyof ModelWeights, actualPrice, pred);
      }
    }
  }

  // Funções auxiliares
  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  private calculatePatternSimilarity(pattern1: number[][], pattern2: number[][]): number {
    if (pattern1.length !== pattern2.length) return 0;

    const prices1 = pattern1.map((p) => p[0]);
    const prices2 = pattern2.map((p) => p[0]);

    // Normalizar padrões
    const norm1 = this.normalizePattern(prices1);
    const norm2 = this.normalizePattern(prices2);

    // Calcular correlação
    let correlation = 0;
    for (let i = 0; i < norm1.length; i++) {
      correlation += norm1[i] * norm2[i];
    }

    return Math.abs(correlation / norm1.length);
  }

  private normalizePattern(prices: number[]): number[] {
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    return prices.map((p) => (p - min) / range);
  }

  private detectUptrend(prices: number[]): boolean {
    if (prices.length < 10) return false;
    const recent = prices.slice(-10);
    let ups = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] > recent[i - 1]) ups++;
    }
    return ups >= 6;
  }

  private detectDowntrend(prices: number[]): boolean {
    if (prices.length < 10) return false;
    const recent = prices.slice(-10);
    let downs = 0;
    for (let i = 1; i < recent.length; i++) {
      if (recent[i] < recent[i - 1]) downs++;
    }
    return downs >= 6;
  }

  private calculateTrendStrength(prices: number[], direction: 'up' | 'down'): number {
    if (prices.length < 2) return 0;
    const change = (prices[prices.length - 1] - prices[0]) / prices[0];
    return direction === 'up' ? Math.max(0, change) : Math.max(0, -change);
  }

  private getTimeframeMs(timeframe: string): number {
    const map: { [key: string]: number } = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };
    return map[timeframe] || 60 * 1000;
  }

  getModelWeights(): ModelWeights {
    return { ...this.modelWeights };
  }

  getModelAccuracy(): { [key: string]: number } {
    const accuracy: { [key: string]: number } = {};
    for (const [model, values] of Object.entries(this.modelAccuracy)) {
      if (values.length > 0) {
        accuracy[model] = values.reduce((a, b) => a + b, 0) / values.length;
      } else {
        accuracy[model] = 0;
      }
    }
    return accuracy;
  }
}
