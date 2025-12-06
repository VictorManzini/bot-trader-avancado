import { OKXCandle } from './okx-client';
import {
  SMA,
  EMA,
  RSI,
  BollingerBands,
  MACD,
  ATR,
  ADX,
  Stochastic,
} from 'technicalindicators';

export interface TechnicalFeatures {
  // Preços básicos
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;

  // Retornos
  returns: number;
  log_returns: number;

  // Médias móveis
  sma_20: number;
  sma_50: number;
  sma_200: number;
  ema_9: number;
  ema_21: number;
  ema_50: number;

  // Indicadores de momentum
  rsi_14: number;
  macd: number;
  macd_signal: number;
  macd_histogram: number;
  stoch_k: number;
  stoch_d: number;

  // Volatilidade
  atr_14: number;
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;
  bb_width: number;

  // Tendência
  adx_14: number;

  // Derivativos
  price_slope: number;
  volume_slope: number;
  high_low_range: number;
  close_open_diff: number;

  // Multi-timeframe
  higher_tf_trend?: number;
  lower_tf_volatility?: number;

  // Padrões
  is_doji: boolean;
  is_hammer: boolean;
  is_engulfing: boolean;
}

export class FeatureEngineer {
  // Calcular todas as features técnicas
  static calculateFeatures(
    candles: OKXCandle[],
    higherTfCandles?: OKXCandle[],
    lowerTfCandles?: OKXCandle[]
  ): TechnicalFeatures[] {
    if (candles.length < 200) {
      throw new Error('Necessário pelo menos 200 candles para calcular features');
    }

    const closes = candles.map(c => c.close);
    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const opens = candles.map(c => c.open);
    const volumes = candles.map(c => c.volume);

    // Calcular indicadores
    const sma20 = SMA.calculate({ period: 20, values: closes });
    const sma50 = SMA.calculate({ period: 50, values: closes });
    const sma200 = SMA.calculate({ period: 200, values: closes });
    const ema9 = EMA.calculate({ period: 9, values: closes });
    const ema21 = EMA.calculate({ period: 21, values: closes });
    const ema50 = EMA.calculate({ period: 50, values: closes });
    const rsi = RSI.calculate({ period: 14, values: closes });
    const macd = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const bb = BollingerBands.calculate({
      period: 20,
      values: closes,
      stdDev: 2,
    });
    const atr = ATR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    });
    const adx = ADX.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    });
    const stoch = Stochastic.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
      signalPeriod: 3,
    });

    // Construir features para cada candle
    const features: TechnicalFeatures[] = [];

    for (let i = 200; i < candles.length; i++) {
      const candle = candles[i];
      const prevClose = candles[i - 1].close;

      const feature: TechnicalFeatures = {
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,

        returns: ((candle.close - prevClose) / prevClose) * 100,
        log_returns: Math.log(candle.close / prevClose),

        sma_20: sma20[i - 180] || closes[i],
        sma_50: sma50[i - 150] || closes[i],
        sma_200: sma200[i - 0] || closes[i],
        ema_9: ema9[i - 191] || closes[i],
        ema_21: ema21[i - 179] || closes[i],
        ema_50: ema50[i - 150] || closes[i],

        rsi_14: rsi[i - 186] || 50,
        macd: macd[i - 174]?.MACD || 0,
        macd_signal: macd[i - 174]?.signal || 0,
        macd_histogram: macd[i - 174]?.histogram || 0,
        stoch_k: stoch[i - 186]?.k || 50,
        stoch_d: stoch[i - 186]?.d || 50,

        atr_14: atr[i - 186] || 0,
        bb_upper: bb[i - 180]?.upper || candle.close,
        bb_middle: bb[i - 180]?.middle || candle.close,
        bb_lower: bb[i - 180]?.lower || candle.close,
        bb_width: bb[i - 180] ? bb[i - 180].upper - bb[i - 180].lower : 0,

        adx_14: adx[i - 186] || 0,

        price_slope: i > 5 ? (closes[i] - closes[i - 5]) / 5 : 0,
        volume_slope: i > 5 ? (volumes[i] - volumes[i - 5]) / 5 : 0,
        high_low_range: candle.high - candle.low,
        close_open_diff: candle.close - candle.open,

        is_doji: this.isDoji(candle),
        is_hammer: this.isHammer(candle),
        is_engulfing: i > 0 ? this.isEngulfing(candles[i - 1], candle) : false,
      };

      // Multi-timeframe features
      if (higherTfCandles && higherTfCandles.length > 0) {
        const htfClose = higherTfCandles[higherTfCandles.length - 1].close;
        const htfPrevClose = higherTfCandles[higherTfCandles.length - 2]?.close || htfClose;
        feature.higher_tf_trend = ((htfClose - htfPrevClose) / htfPrevClose) * 100;
      }

      if (lowerTfCandles && lowerTfCandles.length > 0) {
        const ltfCloses = lowerTfCandles.slice(-20).map(c => c.close);
        const ltfMean = ltfCloses.reduce((a, b) => a + b, 0) / ltfCloses.length;
        const ltfVariance =
          ltfCloses.reduce((sum, val) => sum + Math.pow(val - ltfMean, 2), 0) / ltfCloses.length;
        feature.lower_tf_volatility = Math.sqrt(ltfVariance);
      }

      features.push(feature);
    }

    return features;
  }

  // Detectar padrão Doji
  private static isDoji(candle: OKXCandle): boolean {
    const body = Math.abs(candle.close - candle.open);
    const range = candle.high - candle.low;
    return range > 0 && body / range < 0.1;
  }

  // Detectar padrão Hammer
  private static isHammer(candle: OKXCandle): boolean {
    const body = Math.abs(candle.close - candle.open);
    const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
    const upperShadow = candle.high - Math.max(candle.open, candle.close);
    return lowerShadow > body * 2 && upperShadow < body * 0.5;
  }

  // Detectar padrão Engulfing
  private static isEngulfing(prev: OKXCandle, current: OKXCandle): boolean {
    const prevBody = Math.abs(prev.close - prev.open);
    const currBody = Math.abs(current.close - current.open);
    const bullishEngulfing =
      prev.close < prev.open &&
      current.close > current.open &&
      current.open < prev.close &&
      current.close > prev.open;
    const bearishEngulfing =
      prev.close > prev.open &&
      current.close < current.open &&
      current.open > prev.close &&
      current.close < prev.open;
    return (bullishEngulfing || bearishEngulfing) && currBody > prevBody;
  }

  // Normalizar features para IA
  static normalizeFeatures(features: TechnicalFeatures[]): number[][] {
    const normalized: number[][] = [];

    for (const f of features) {
      normalized.push([
        f.returns / 10, // Normalizar retornos
        f.log_returns,
        f.rsi_14 / 100,
        f.macd / f.close,
        f.macd_histogram / f.close,
        f.stoch_k / 100,
        f.atr_14 / f.close,
        f.bb_width / f.close,
        f.adx_14 / 100,
        f.price_slope / f.close,
        f.volume_slope / f.volume,
        f.high_low_range / f.close,
        f.close_open_diff / f.close,
        f.is_doji ? 1 : 0,
        f.is_hammer ? 1 : 0,
        f.is_engulfing ? 1 : 0,
        (f.higher_tf_trend || 0) / 10,
        (f.lower_tf_volatility || 0) / f.close,
      ]);
    }

    return normalized;
  }
}
