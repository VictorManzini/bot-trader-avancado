declare module 'ccxt' {
  export interface ExchangeOptions {
    apiKey?: string;
    secret?: string;
    password?: string;
    enableRateLimit?: boolean;
  }

  export interface Ticker {
    symbol: string;
    last?: number;
    close?: number;
    bid?: number;
    ask?: number;
    high?: number;
    low?: number;
    volume?: number;
  }

  export interface Market {
    id: string;
    symbol: string;
    base: string;
    quote: string;
    active: boolean;
    spot: boolean;
  }

  export interface Balance {
    [currency: string]: {
      free: number;
      used: number;
      total: number;
    };
  }

  export interface Order {
    id: string;
    symbol: string;
    type: string;
    side: string;
    price: number;
    amount: number;
    cost: number;
    filled: number;
    remaining: number;
    status: string;
    timestamp: number;
  }

  export class okx {
    constructor(options?: ExchangeOptions);
    fetchOHLCV(
      symbol: string,
      timeframe: string,
      since?: number,
      limit?: number
    ): Promise<number[][]>;
    fetchTicker(symbol: string): Promise<Ticker>;
    fetchMarkets(): Promise<Market[]>;
    fetchBalance(): Promise<Balance>;
    createOrder(
      symbol: string,
      type: string,
      side: string,
      amount: number,
      price?: number
    ): Promise<Order>;
  }

  export default {
    okx,
  };
}
