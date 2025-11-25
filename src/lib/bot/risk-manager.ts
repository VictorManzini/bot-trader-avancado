export interface RiskConfig {
  maxRiskPercentage: number; // % do capital total
  strategy: 'AGGRESSIVE' | 'MEDIUM' | 'CONSERVATIVE';
}

export interface PositionSize {
  amount: number;
  stopLoss: number;
  takeProfit: number;
  riskAmount: number;
  potentialProfit: number;
}

export class RiskManager {
  private config: RiskConfig;

  constructor(config: RiskConfig) {
    this.config = config;
  }

  // Calcular tamanho da posição baseado no risco
  calculatePositionSize(
    balance: number,
    entryPrice: number,
    volatility: number,
    confidence: number
  ): PositionSize {
    // Ajustar risco baseado na estratégia
    const strategyMultiplier = this.getStrategyMultiplier();
    const adjustedRisk = this.config.maxRiskPercentage * strategyMultiplier;

    // Ajustar risco baseado na confiança da previsão
    const confidenceAdjustedRisk = adjustedRisk * confidence;

    // Calcular valor em risco
    const riskAmount = balance * (confidenceAdjustedRisk / 100);

    // Calcular stop-loss baseado na volatilidade
    const stopLossDistance = this.calculateStopLoss(volatility, entryPrice);
    const stopLossPrice = entryPrice - stopLossDistance;

    // Calcular tamanho da posição
    const amount = riskAmount / stopLossDistance;

    // Calcular take-profit baseado no risco/recompensa
    const riskRewardRatio = this.getRiskRewardRatio();
    const takeProfitDistance = stopLossDistance * riskRewardRatio;
    const takeProfitPrice = entryPrice + takeProfitDistance;

    const potentialProfit = amount * takeProfitDistance;

    return {
      amount,
      stopLoss: stopLossPrice,
      takeProfit: takeProfitPrice,
      riskAmount,
      potentialProfit,
    };
  }

  // Calcular stop-loss dinâmico
  private calculateStopLoss(volatility: number, price: number): number {
    const strategy = this.config.strategy;

    let multiplier: number;
    switch (strategy) {
      case 'AGGRESSIVE':
        multiplier = 2.5; // Stop mais largo
        break;
      case 'MEDIUM':
        multiplier = 2.0;
        break;
      case 'CONSERVATIVE':
        multiplier = 1.5; // Stop mais apertado
        break;
    }

    return volatility * multiplier;
  }

  // Obter multiplicador de risco por estratégia
  private getStrategyMultiplier(): number {
    switch (this.config.strategy) {
      case 'AGGRESSIVE':
        return 1.5; // 150% do risco base
      case 'MEDIUM':
        return 1.0; // 100% do risco base
      case 'CONSERVATIVE':
        return 0.6; // 60% do risco base
    }
  }

  // Obter ratio risco/recompensa por estratégia
  private getRiskRewardRatio(): number {
    switch (this.config.strategy) {
      case 'AGGRESSIVE':
        return 3.0; // Alvos maiores
      case 'MEDIUM':
        return 2.0;
      case 'CONSERVATIVE':
        return 1.5; // Alvos menores, mais conservadores
    }
  }

  // Verificar se deve entrar em operação
  shouldEnterTrade(
    confidence: number,
    volatility: number,
    trendStrength: number
  ): boolean {
    const strategy = this.config.strategy;

    let minConfidence: number;
    let maxVolatility: number;
    let minTrendStrength: number;

    switch (strategy) {
      case 'AGGRESSIVE':
        minConfidence = 0.55; // Aceita confiança menor
        maxVolatility = 0.05; // Aceita mais volatilidade
        minTrendStrength = 0.3; // Tendência mais fraca OK
        break;
      case 'MEDIUM':
        minConfidence = 0.65;
        maxVolatility = 0.04;
        minTrendStrength = 0.5;
        break;
      case 'CONSERVATIVE':
        minConfidence = 0.75; // Exige alta confiança
        maxVolatility = 0.03; // Baixa volatilidade
        minTrendStrength = 0.7; // Tendência forte
        break;
    }

    return (
      confidence >= minConfidence &&
      volatility <= maxVolatility &&
      trendStrength >= minTrendStrength
    );
  }

  // Calcular exposição máxima permitida
  getMaxExposure(balance: number): number {
    switch (this.config.strategy) {
      case 'AGGRESSIVE':
        return balance * 0.8; // Até 80% do capital
      case 'MEDIUM':
        return balance * 0.5; // Até 50% do capital
      case 'CONSERVATIVE':
        return balance * 0.3; // Até 30% do capital
    }
  }

  // Verificar se deve fechar posição (trailing stop)
  shouldClosePosition(
    entryPrice: number,
    currentPrice: number,
    highestPrice: number,
    stopLoss: number
  ): { shouldClose: boolean; reason: string } {
    // Stop-loss atingido
    if (currentPrice <= stopLoss) {
      return { shouldClose: true, reason: 'STOP_LOSS' };
    }

    // Trailing stop (proteger lucros)
    const profit = ((currentPrice - entryPrice) / entryPrice) * 100;
    const drawdownFromHigh = ((highestPrice - currentPrice) / highestPrice) * 100;

    let trailingStopPercent: number;
    switch (this.config.strategy) {
      case 'AGGRESSIVE':
        trailingStopPercent = 3.0; // Deixa correr mais
        break;
      case 'MEDIUM':
        trailingStopPercent = 2.0;
        break;
      case 'CONSERVATIVE':
        trailingStopPercent = 1.0; // Protege lucros rapidamente
        break;
    }

    if (profit > 2 && drawdownFromHigh > trailingStopPercent) {
      return { shouldClose: true, reason: 'TRAILING_STOP' };
    }

    return { shouldClose: false, reason: '' };
  }

  // Atualizar configuração de risco
  updateConfig(newConfig: Partial<RiskConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): RiskConfig {
    return { ...this.config };
  }
}
