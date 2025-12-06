export interface OKXCredentials {
  apiKey: string;
  secret: string;
  password: string;
}

export interface OKXCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class OKXClient {
  private credentials?: OKXCredentials;
  private dryRunMode: boolean = false;
  private dryRunBalance: { [key: string]: number } = {};
  private dryRunInitialBalance: number = 10000; // Saldo inicial padrão

  constructor(credentials?: OKXCredentials, dryRun: boolean = false, initialBalance?: number) {
    this.dryRunMode = dryRun;
    this.credentials = credentials;

    // Inicializar saldo virtual para DRY RUN
    if (dryRun) {
      this.dryRunInitialBalance = initialBalance || 10000;
      this.dryRunBalance = {
        USDT: this.dryRunInitialBalance, // Usar saldo configurado
      };
    }
  }

  // Método auxiliar para fazer chamadas à API
  private async callAPI(action: string, params: any = {}): Promise<any> {
    const response = await fetch('/api/okx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        credentials: this.credentials,
        params,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Erro na chamada da API OKX');
    }

    return result.data;
  }

  // Buscar candles históricos
  async fetchOHLCV(
    symbol: string,
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
    limit: number = 100
  ): Promise<OKXCandle[]> {
    return await this.callAPI('fetchOHLCV', { symbol, timeframe, limit });
  }

  // Buscar preço atual
  async fetchCurrentPrice(symbol: string): Promise<number> {
    return await this.callAPI('fetchCurrentPrice', { symbol });
  }

  // Buscar todos os pares disponíveis
  async fetchMarkets(): Promise<string[]> {
    return await this.callAPI('fetchMarkets');
  }

  // Criar ordem (LIVE ou DRY RUN)
  async createOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price?: number
  ): Promise<any> {
    if (this.dryRunMode) {
      return this.createDryRunOrder(symbol, side, amount, price);
    }

    return await this.callAPI('createOrder', { symbol, side, amount, price });
  }

  // Simular ordem em DRY RUN
  private async createDryRunOrder(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    price?: number
  ): Promise<any> {
    const currentPrice = price || await this.fetchCurrentPrice(symbol);
    const [base, quote] = symbol.split('/');

    const cost = amount * currentPrice;

    if (side === 'buy') {
      if (this.dryRunBalance[quote] < cost) {
        throw new Error(`Saldo insuficiente em DRY RUN: ${this.dryRunBalance[quote]} ${quote}`);
      }
      this.dryRunBalance[quote] -= cost;
      this.dryRunBalance[base] = (this.dryRunBalance[base] || 0) + amount;
    } else {
      if ((this.dryRunBalance[base] || 0) < amount) {
        throw new Error(`Saldo insuficiente em DRY RUN: ${this.dryRunBalance[base]} ${base}`);
      }
      this.dryRunBalance[base] -= amount;
      this.dryRunBalance[quote] = (this.dryRunBalance[quote] || 0) + cost;
    }

    return {
      id: `DRY_${Date.now()}`,
      symbol,
      side,
      amount,
      price: currentPrice,
      cost,
      timestamp: Date.now(),
      status: 'closed',
      dryRun: true,
    };
  }

  // Buscar saldo
  async fetchBalance(): Promise<{ [key: string]: number }> {
    if (this.dryRunMode) {
      return { ...this.dryRunBalance };
    }

    return await this.callAPI('fetchBalance');
  }

  // Obter saldo inicial DRY RUN
  getDryRunInitialBalance(): number {
    return this.dryRunInitialBalance;
  }

  // Verificar se está em DRY RUN
  isDryRun(): boolean {
    return this.dryRunMode;
  }
}
