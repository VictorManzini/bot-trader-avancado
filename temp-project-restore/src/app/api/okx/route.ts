import { NextRequest, NextResponse } from 'next/server';
import ccxt from 'ccxt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, params } = body;

    let exchange: ccxt.okx;

    // Inicializar exchange
    if (credentials && credentials.apiKey) {
      exchange = new ccxt.okx({
        apiKey: credentials.apiKey,
        secret: credentials.secret,
        password: credentials.password,
        enableRateLimit: true,
      });
    } else {
      // Modo público
      exchange = new ccxt.okx({
        enableRateLimit: true,
      });
    }

    // Executar ação solicitada
    switch (action) {
      case 'fetchOHLCV': {
        const { symbol, timeframe, limit } = params;
        const ohlcv = await exchange.fetchOHLCV(symbol, timeframe, undefined, limit || 100);
        return NextResponse.json({
          success: true,
          data: ohlcv.map(candle => ({
            timestamp: candle[0],
            open: candle[1],
            high: candle[2],
            low: candle[3],
            close: candle[4],
            volume: candle[5],
          })),
        });
      }

      case 'fetchCurrentPrice': {
        const { symbol } = params;
        const ticker = await exchange.fetchTicker(symbol);
        return NextResponse.json({
          success: true,
          data: ticker.last || ticker.close,
        });
      }

      case 'fetchMarkets': {
        const markets = await exchange.fetchMarkets();
        const activeMarkets = markets
          .filter(m => m.active && m.spot)
          .map(m => m.symbol);
        return NextResponse.json({
          success: true,
          data: activeMarkets,
        });
      }

      case 'createOrder': {
        const { symbol, side, amount, price } = params;
        const orderType = price ? 'limit' : 'market';
        const order = await exchange.createOrder(symbol, orderType, side, amount, price);
        return NextResponse.json({
          success: true,
          data: order,
        });
      }

      case 'fetchBalance': {
        const balance = await exchange.fetchBalance();
        const result: { [key: string]: number } = {};

        for (const [currency, data] of Object.entries(balance)) {
          if (typeof data === 'object' && data !== null && 'free' in data) {
            result[currency] = (data as any).free || 0;
          }
        }

        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Ação não reconhecida' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Erro na API OKX:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
