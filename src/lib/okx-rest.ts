import crypto from 'crypto';

const OKX_BASE_URL = 'https://www.okx.com';

export interface OKXCredentials {
  apiKey: string;
  secret: string;
  passphrase: string;
}

/**
 * Função auxiliar para assinar requisições privadas (balance e orders)
 */
function signRequest(
  creds: OKXCredentials,
  method: string,
  path: string,
  body: string = ''
) {
  const timestamp = new Date().toISOString();
  const prehash = timestamp + method.toUpperCase() + path + body;
  const hmac = crypto.createHmac('sha256', creds.secret);
  hmac.update(prehash);
  const sign = hmac.digest('base64');

  return {
    'OK-ACCESS-KEY': creds.apiKey,
    'OK-ACCESS-SIGN': sign,
    'OK-ACCESS-TIMESTAMP': timestamp,
    'OK-ACCESS-PASSPHRASE': creds.passphrase,
  };
}

/**
 * Função para buscar candles (OHLCV)
 */
export async function fetchOHLCV(
  symbol: string,
  timeframe: string,
  limit: number = 100
) {
  // Converter símbolo do formato interno (ex: BTC/USDT) para formato OKX (ex: BTC-USDT)
  const instId = symbol.replace('/', '-');

  // Mapear timeframe do bot para "bar" da OKX
  const tfMap: Record<string, string> = {
    '1m': '1m',
    '15m': '15m',
    '1h': '1H',
    '4h': '4H',
    '1d': '1D',
  };
  const bar = tfMap[timeframe] ?? '1m';

  const path = `/api/v5/market/candles?instId=${encodeURIComponent(instId)}&bar=${bar}&limit=${limit}`;
  const res = await fetch(OKX_BASE_URL + path);
  const data = await res.json();

  if (data.code !== '0') {
    throw new Error(data.msg || 'Erro ao buscar candles na OKX');
  }

  // data.data é um array de arrays: [ts, open, high, low, close, volume, ...]
  return data.data.map((candle: any[]) => ({
    timestamp: Number(candle[0]),
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
}

/**
 * Função para buscar preço atual (ticker)
 */
export async function fetchCurrentPrice(symbol: string) {
  const instId = symbol.replace('/', '-');
  const path = `/api/v5/market/ticker?instId=${encodeURIComponent(instId)}`;
  const res = await fetch(OKX_BASE_URL + path);
  const data = await res.json();

  if (data.code !== '0' || !data.data?.length) {
    throw new Error(data.msg || 'Erro ao buscar ticker na OKX');
  }

  const ticker = data.data[0];
  return {
    symbol,
    last: parseFloat(ticker.last),
    bid: parseFloat(ticker.bidPx),
    ask: parseFloat(ticker.askPx),
  };
}

/**
 * Função para listar mercados (pares disponíveis)
 */
export async function fetchMarkets() {
  // Exemplo: listar instrumentos SPOT
  const path = '/api/v5/public/instruments?instType=SPOT';
  const res = await fetch(OKX_BASE_URL + path);
  const data = await res.json();

  if (data.code !== '0') {
    throw new Error(data.msg || 'Erro ao buscar instrumentos na OKX');
  }

  // Retornar apenas a lista de instId (ex: BTC-USDT) e uma versão simbólica (BTC/USDT)
  return data.data.map((inst: any) => ({
    instId: inst.instId,
    symbol: inst.instId.replace('-', '/'),
  }));
}

/**
 * Função para buscar saldo (balance) usando credenciais (modo LIVE)
 */
export async function fetchBalance(creds: OKXCredentials) {
  const path = '/api/v5/account/balance';
  const body = '';
  const headersAuth = signRequest(creds, 'GET', path, body);

  const res = await fetch(OKX_BASE_URL + path, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headersAuth,
    },
  });

  const data = await res.json();

  if (data.code !== '0') {
    throw new Error(data.msg || 'Erro ao buscar saldo na OKX');
  }

  return data.data;
}

/**
 * Função para criar ordem (modo LIVE)
 */
export async function createOrder(
  creds: OKXCredentials,
  params: { 
    instId: string; 
    side: 'buy' | 'sell'; 
    sz: string; 
    tdMode?: string; 
    ordType?: string; 
    px?: string; 
  }
) {
  const path = '/api/v5/trade/order';
  const bodyObj = {
    instId: params.instId,
    tdMode: params.tdMode ?? 'cash', // para spot
    side: params.side,
    ordType: params.ordType ?? 'market',
    sz: params.sz,
    px: params.px,
  };
  const body = JSON.stringify(bodyObj);
  const headersAuth = signRequest(creds, 'POST', path, body);

  const res = await fetch(OKX_BASE_URL + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headersAuth,
    },
    body,
  });

  const data = await res.json();

  if (data.code !== '0') {
    throw new Error(data.msg || 'Erro ao criar ordem na OKX');
  }

  return data.data;
}
