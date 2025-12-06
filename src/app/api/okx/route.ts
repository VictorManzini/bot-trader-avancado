import { NextRequest, NextResponse } from 'next/server';
import ccxt from 'ccxt';

// Esta rota API executa APENAS no servidor (Next.js API Route)
// O ccxt é importado e usado apenas server-side, nunca no cliente

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, params } = body;

    let exchange: ccxt.okx;

    // Inicializar exchange com ou sem credenciais
    if (credentials && credentials.apiKey) {
      exchange = new ccxt.okx({
        apiKey: credentials.apiKey,
        secret: credentials.secret,
        password: credentials.password,
        enableRateLimit: true,
        options: {
          defaultType: 'spot', // Garantir que estamos usando mercado spot
        },
      });
    } else {
      // Modo público (sem autenticação)
      exchange = new ccxt.okx({
        enableRateLimit: true,
        options: {
          defaultType: 'spot',
        },
      });
    }

    // Executar ação solicitada
    switch (action) {
      case 'fetchOHLCV': {
        const { symbol, timeframe, limit } = params;
        
        if (!symbol || !timeframe) {
          return NextResponse.json(
            { success: false, error: 'Parâmetros "symbol" e "timeframe" são obrigatórios' },
            { status: 400 }
          );
        }

        const ohlcv = await exchange.fetchOHLCV(
          symbol, 
          timeframe, 
          undefined, 
          limit || 100
        );
        
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
        
        if (!symbol) {
          return NextResponse.json(
            { success: false, error: 'Parâmetro "symbol" é obrigatório' },
            { status: 400 }
          );
        }

        const ticker = await exchange.fetchTicker(symbol);
        
        return NextResponse.json({
          success: true,
          data: {
            price: ticker.last || ticker.close,
            bid: ticker.bid,
            ask: ticker.ask,
            high: ticker.high,
            low: ticker.low,
            volume: ticker.baseVolume,
            timestamp: ticker.timestamp,
          },
        });
      }

      case 'fetchMarkets': {
        const markets = await exchange.fetchMarkets();
        
        // Filtrar apenas mercados spot ativos
        const activeMarkets = markets
          .filter(m => m.active && m.spot)
          .map(m => ({
            symbol: m.symbol,
            base: m.base,
            quote: m.quote,
            id: m.id,
          }));
        
        return NextResponse.json({
          success: true,
          data: activeMarkets,
        });
      }

      case 'fetchBalance': {
        // Requer autenticação
        if (!credentials || !credentials.apiKey) {
          return NextResponse.json(
            { success: false, error: 'Credenciais são necessárias para fetchBalance' },
            { status: 401 }
          );
        }

        const balance = await exchange.fetchBalance();
        const result: { [key: string]: { free: number; used: number; total: number } } = {};

        // Filtrar apenas moedas com saldo > 0
        for (const [currency, data] of Object.entries(balance)) {
          if (typeof data === 'object' && data !== null && 'free' in data) {
            const balanceData = data as any;
            const total = balanceData.total || 0;
            
            if (total > 0) {
              result[currency] = {
                free: balanceData.free || 0,
                used: balanceData.used || 0,
                total: total,
              };
            }
          }
        }

        return NextResponse.json({
          success: true,
          data: result,
        });
      }

      case 'createOrder': {
        // Requer autenticação
        if (!credentials || !credentials.apiKey) {
          return NextResponse.json(
            { success: false, error: 'Credenciais são necessárias para createOrder' },
            { status: 401 }
          );
        }

        const { symbol, side, amount, price } = params;
        
        if (!symbol || !side || !amount) {
          return NextResponse.json(
            { success: false, error: 'Parâmetros "symbol", "side" e "amount" são obrigatórios' },
            { status: 400 }
          );
        }

        const orderType = price ? 'limit' : 'market';
        const order = await exchange.createOrder(symbol, orderType, side, amount, price);
        
        return NextResponse.json({
          success: true,
          data: order,
        });
      }

      case 'testConnection': {
        // Testar conexão básica com a exchange
        try {
          await exchange.loadMarkets();
          return NextResponse.json({
            success: true,
            data: {
              connected: true,
              exchange: 'OKX',
              authenticated: !!(credentials && credentials.apiKey),
            },
          });
        } catch (error: any) {
          return NextResponse.json({
            success: false,
            error: `Falha ao conectar: ${error.message}`,
          });
        }
      }

      default:
        return NextResponse.json(
          { success: false, error: `Ação "${action}" não reconhecida` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Erro na API OKX:', error);
    
    // Retornar erro detalhado para debug
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro desconhecido',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

// Suporte para requisições GET (teste de saúde)
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API OKX está funcionando',
    actions: [
      'fetchOHLCV',
      'fetchCurrentPrice',
      'fetchMarkets',
      'fetchBalance',
      'createOrder',
      'testConnection',
    ],
  });
}
