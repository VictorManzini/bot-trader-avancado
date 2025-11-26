declare module 'technicalindicators' {
  export interface SMAInput {
    period: number;
    values: number[];
  }

  export interface EMAInput {
    period: number;
    values: number[];
  }

  export interface RSIInput {
    period: number;
    values: number[];
  }

  export interface MACDInput {
    values: number[];
    fastPeriod: number;
    slowPeriod: number;
    signalPeriod: number;
    SimpleMAOscillator: boolean;
    SimpleMASignal: boolean;
  }

  export interface MACDOutput {
    MACD: number;
    signal: number;
    histogram: number;
  }

  export interface BollingerBandsInput {
    period: number;
    values: number[];
    stdDev: number;
  }

  export interface BollingerBandsOutput {
    upper: number;
    middle: number;
    lower: number;
  }

  export interface ATRInput {
    high: number[];
    low: number[];
    close: number[];
    period: number;
  }

  export interface ADXInput {
    high: number[];
    low: number[];
    close: number[];
    period: number;
  }

  export interface StochasticInput {
    high: number[];
    low: number[];
    close: number[];
    period: number;
    signalPeriod: number;
  }

  export interface StochasticOutput {
    k: number;
    d: number;
  }

  export class SMA {
    static calculate(input: SMAInput): number[];
  }

  export class EMA {
    static calculate(input: EMAInput): number[];
  }

  export class RSI {
    static calculate(input: RSIInput): number[];
  }

  export class MACD {
    static calculate(input: MACDInput): MACDOutput[];
  }

  export class BollingerBands {
    static calculate(input: BollingerBandsInput): BollingerBandsOutput[];
  }

  export class ATR {
    static calculate(input: ATRInput): number[];
  }

  export class ADX {
    static calculate(input: ADXInput): number[];
  }

  export class Stochastic {
    static calculate(input: StochasticInput): StochasticOutput[];
  }
}
