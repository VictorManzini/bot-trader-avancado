import { OKXCandle } from './okx-client';

export interface CandlePattern {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  description: string;
}

export interface ChartPattern {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'CONTINUATION' | 'REVERSAL';
  confidence: number;
  startIndex: number;
  endIndex: number;
  targetPrice?: number;
}

export class PatternDetector {
  // Detectar padrões de candles
  static detectCandlePatterns(candles: OKXCandle[]): CandlePattern[] {
    if (candles.length < 3) return [];

    const patterns: CandlePattern[] = [];
    const current = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const prev2 = candles[candles.length - 3];

    // Doji
    if (this.isDoji(current)) {
      patterns.push({
        name: 'Doji',
        type: 'NEUTRAL',
        confidence: 0.7,
        description: 'Indecisão do mercado, possível reversão',
      });
    }

    // Martelo (Hammer)
    if (this.isHammer(current)) {
      patterns.push({
        name: 'Hammer',
        type: 'BULLISH',
        confidence: 0.75,
        description: 'Possível reversão de baixa para alta',
      });
    }

    // Martelo Invertido (Inverted Hammer)
    if (this.isInvertedHammer(current)) {
      patterns.push({
        name: 'Inverted Hammer',
        type: 'BULLISH',
        confidence: 0.7,
        description: 'Possível reversão de baixa para alta',
      });
    }

    // Marubozu
    if (this.isMarubozu(current)) {
      const type = current.close > current.open ? 'BULLISH' : 'BEARISH';
      patterns.push({
        name: 'Marubozu',
        type,
        confidence: 0.8,
        description: 'Forte movimento direcional',
      });
    }

    // Engolfo (Engulfing)
    if (this.isEngulfing(prev, current)) {
      const type = current.close > current.open ? 'BULLISH' : 'BEARISH';
      patterns.push({
        name: 'Engulfing',
        type,
        confidence: 0.85,
        description: 'Forte sinal de reversão',
      });
    }

    // Estrela da Manhã (Morning Star)
    if (this.isMorningStar(prev2, prev, current)) {
      patterns.push({
        name: 'Morning Star',
        type: 'BULLISH',
        confidence: 0.9,
        description: 'Forte sinal de reversão de baixa para alta',
      });
    }

    // Estrela da Noite (Evening Star)
    if (this.isEveningStar(prev2, prev, current)) {
      patterns.push({
        name: 'Evening Star',
        type: 'BEARISH',
        confidence: 0.9,
        description: 'Forte sinal de reversão de alta para baixa',
      });
    }

    return patterns;
  }

  // Detectar padrões gráficos
  static detectChartPatterns(candles: OKXCandle[]): ChartPattern[] {
    if (candles.length < 20) return [];

    const patterns: ChartPattern[] = [];

    // Ombro-Cabeça-Ombro (Head and Shoulders)
    const hns = this.detectHeadAndShoulders(candles);
    if (hns) patterns.push(hns);

    // Ombro-Cabeça-Ombro Invertido
    const ihns = this.detectInverseHeadAndShoulders(candles);
    if (ihns) patterns.push(ihns);

    // Topo Duplo (Double Top)
    const doubleTop = this.detectDoubleTop(candles);
    if (doubleTop) patterns.push(doubleTop);

    // Fundo Duplo (Double Bottom)
    const doubleBottom = this.detectDoubleBottom(candles);
    if (doubleBottom) patterns.push(doubleBottom);

    // Triângulo Ascendente
    const ascTriangle = this.detectAscendingTriangle(candles);
    if (ascTriangle) patterns.push(ascTriangle);

    // Triângulo Descendente
    const descTriangle = this.detectDescendingTriangle(candles);
    if (descTriangle) patterns.push(descTriangle);

    // Bandeira (Flag)
    const flag = this.detectFlag(candles);
    if (flag) patterns.push(flag);

    return patterns;
  }

  // === PADRÕES DE CANDLES ===

  private static isDoji(candle: OKXCandle): boolean {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    return range > 0 && body / range < 0.1;
  }

  private static isHammer(candle: OKXCandle): boolean {
    const body = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    return lowerShadow > body * 2 && upperShadow < body * 0.5;
  }

  private static isInvertedHammer(candle: OKXCandle): boolean {
    const body = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    return upperShadow > body * 2 && lowerShadow < body * 0.5;
  }

  private static isMarubozu(candle: OKXCandle): boolean {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    return range > 0 && body / range > 0.95;
  }

  private static isEngulfing(prev: OKXCandle, current: OKXCandle): boolean {
    const prevBody = Math.abs(prev.close - prev.open);
    const currBody = Math.abs(current.close - current.open);
    const bullishEngulfing =
      prev.close < prev.open &&
      current.close > current.open &&
      current.open <= prev.close &&
      current.close >= prev.open;
    const bearishEngulfing =
      prev.close > prev.open &&
      current.close < current.open &&
      current.open >= prev.close &&
      current.close <= prev.open;
    return (bullishEngulfing || bearishEngulfing) && currBody > prevBody * 1.2;
  }

  private static isMorningStar(c1: OKXCandle, c2: OKXCandle, c3: OKXCandle): boolean {
    const bearish = c1.close < c1.open;
    const smallBody = Math.abs(c2.close - c2.open) < Math.abs(c1.close - c1.open) * 0.3;
    const bullish = c3.close > c3.open;
    const recovery = c3.close > (c1.open + c1.close) / 2;
    return bearish && smallBody && bullish && recovery;
  }

  private static isEveningStar(c1: OKXCandle, c2: OKXCandle, c3: OKXCandle): boolean {
    const bullish = c1.close > c1.open;
    const smallBody = Math.abs(c2.close - c2.open) < Math.abs(c1.close - c1.open) * 0.3;
    const bearish = c3.close < c3.open;
    const decline = c3.close < (c1.open + c1.close) / 2;
    return bullish && smallBody && bearish && decline;
  }

  // === PADRÕES GRÁFICOS ===

  private static detectHeadAndShoulders(candles: OKXCandle[]): ChartPattern | null {
    if (candles.length < 30) return null;

    const highs = candles.map(c => c.high);
    const recent = highs.slice(-30);

    // Encontrar 3 picos
    const peaks = this.findPeaks(recent);
    if (peaks.length < 3) return null;

    const [left, head, right] = peaks.slice(-3);

    // Validar padrão: cabeça maior que ombros
    if (
      recent[head] > recent[left] &&
      recent[head] > recent[right] &&
      Math.abs(recent[left] - recent[right]) / recent[left] < 0.02
    ) {
      const neckline = Math.min(
        candles[candles.length - 30 + left].low,
        candles[candles.length - 30 + right].low
      );
      const targetPrice = neckline - (recent[head] - neckline);

      return {
        name: 'Head and Shoulders',
        type: 'REVERSAL',
        confidence: 0.85,
        startIndex: candles.length - 30 + left,
        endIndex: candles.length - 30 + right,
        targetPrice,
      };
    }

    return null;
  }

  private static detectInverseHeadAndShoulders(candles: OKXCandle[]): ChartPattern | null {
    if (candles.length < 30) return null;

    const lows = candles.map(c => c.low);
    const recent = lows.slice(-30);

    // Encontrar 3 vales
    const valleys = this.findValleys(recent);
    if (valleys.length < 3) return null;

    const [left, head, right] = valleys.slice(-3);

    // Validar padrão: cabeça menor que ombros
    if (
      recent[head] < recent[left] &&
      recent[head] < recent[right] &&
      Math.abs(recent[left] - recent[right]) / recent[left] < 0.02
    ) {
      const neckline = Math.max(
        candles[candles.length - 30 + left].high,
        candles[candles.length - 30 + right].high
      );
      const targetPrice = neckline + (neckline - recent[head]);

      return {
        name: 'Inverse Head and Shoulders',
        type: 'REVERSAL',
        confidence: 0.85,
        startIndex: candles.length - 30 + left,
        endIndex: candles.length - 30 + right,
        targetPrice,
      };
    }

    return null;
  }

  private static detectDoubleTop(candles: OKXCandle[]): ChartPattern | null {
    if (candles.length < 20) return null;

    const highs = candles.map(c => c.high);
    const recent = highs.slice(-20);
    const peaks = this.findPeaks(recent);

    if (peaks.length >= 2) {
      const [peak1, peak2] = peaks.slice(-2);
      if (Math.abs(recent[peak1] - recent[peak2]) / recent[peak1] < 0.02) {
        return {
          name: 'Double Top',
          type: 'REVERSAL',
          confidence: 0.8,
          startIndex: candles.length - 20 + peak1,
          endIndex: candles.length - 20 + peak2,
        };
      }
    }

    return null;
  }

  private static detectDoubleBottom(candles: OKXCandle[]): ChartPattern | null {
    if (candles.length < 20) return null;

    const lows = candles.map(c => c.low);
    const recent = lows.slice(-20);
    const valleys = this.findValleys(recent);

    if (valleys.length >= 2) {
      const [valley1, valley2] = valleys.slice(-2);
      if (Math.abs(recent[valley1] - recent[valley2]) / recent[valley1] < 0.02) {
        return {
          name: 'Double Bottom',
          type: 'REVERSAL',
          confidence: 0.8,
          startIndex: candles.length - 20 + valley1,
          endIndex: candles.length - 20 + valley2,
        };
      }
    }

    return null;
  }

  private static detectAscendingTriangle(candles: OKXCandle[]): ChartPattern | null {
    if (candles.length < 20) return null;

    const highs = candles.slice(-20).map(c => c.high);
    const lows = candles.slice(-20).map(c => c.low);

    // Resistência horizontal
    const maxHigh = Math.max(...highs);
    const resistanceCount = highs.filter(h => Math.abs(h - maxHigh) / maxHigh < 0.01).length;

    // Suporte ascendente
    const lowTrend = this.calculateTrend(lows);

    if (resistanceCount >= 3 && lowTrend > 0) {
      return {
        name: 'Ascending Triangle',
        type: 'BULLISH',
        confidence: 0.75,
        startIndex: candles.length - 20,
        endIndex: candles.length - 1,
        targetPrice: maxHigh * 1.05,
      };
    }

    return null;
  }

  private static detectDescendingTriangle(candles: OKXCandle[]): ChartPattern | null {
    if (candles.length < 20) return null;

    const highs = candles.slice(-20).map(c => c.high);
    const lows = candles.slice(-20).map(c => c.low);

    // Suporte horizontal
    const minLow = Math.min(...lows);
    const supportCount = lows.filter(l => Math.abs(l - minLow) / minLow < 0.01).length;

    // Resistência descendente
    const highTrend = this.calculateTrend(highs);

    if (supportCount >= 3 && highTrend < 0) {
      return {
        name: 'Descending Triangle',
        type: 'BEARISH',
        confidence: 0.75,
        startIndex: candles.length - 20,
        endIndex: candles.length - 1,
        targetPrice: minLow * 0.95,
      };
    }

    return null;
  }

  private static detectFlag(candles: OKXCandle[]): ChartPattern | null {
    if (candles.length < 15) return null;

    const closes = candles.slice(-15).map(c => c.close);

    // Movimento forte inicial
    const initialMove = Math.abs(closes[5] - closes[0]) / closes[0];
    if (initialMove < 0.03) return null;

    // Consolidação em canal
    const consolidation = closes.slice(5);
    const trend = this.calculateTrend(consolidation);
    const volatility = this.calculateVolatility(consolidation);

    if (Math.abs(trend) < 0.01 && volatility < 0.02) {
      const type = closes[5] > closes[0] ? 'BULLISH' : 'BEARISH';
      return {
        name: 'Flag',
        type: type === 'BULLISH' ? 'CONTINUATION' : 'CONTINUATION',
        confidence: 0.7,
        startIndex: candles.length - 15,
        endIndex: candles.length - 1,
      };
    }

    return null;
  }

  // === UTILITÁRIOS ===

  private static findPeaks(data: number[]): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  private static findValleys(data: number[]): number[] {
    const valleys: number[] = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] < data[i - 1] && data[i] < data[i + 1]) {
        valleys.push(i);
      }
    }
    return valleys;
  }

  private static calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    const first = data[0];
    const last = data[data.length - 1];
    return (last - first) / first;
  }

  private static calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return Math.sqrt(variance) / mean;
  }
}
