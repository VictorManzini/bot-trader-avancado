import { NextRequest, NextResponse } from 'next/server';
import { 
  fetchOHLCV, 
  fetchCurrentPrice, 
  fetchMarkets, 
  fetchBalance, 
  createOrder, 
  OKXCredentials 
} from '@/lib/okx-rest';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, credentials, params } = body;

    let creds: OKXCredentials | undefined;
    if (credentials && credentials.apiKey) {
      creds = {
        apiKey: credentials.apiKey,
        secret: credentials.secret,
        passphrase: credentials.password,
      };
    }

    let data: any;

    switch (action) {
      case 'fetchOHLCV':
        data = await fetchOHLCV(params.symbol, params.timeframe, params.limit);
        break;

      case 'fetchCurrentPrice':
        data = await fetchCurrentPrice(params.symbol);
        break;

      case 'fetchMarkets':
        data = await fetchMarkets();
        break;

      case 'fetchBalance':
        if (!creds) throw new Error('Credenciais OKX são necessárias para buscar saldo.');
        data = await fetchBalance(creds);
        break;

      case 'createOrder':
        if (!creds) throw new Error('Credenciais OKX são necessárias para criar ordens.');
        data = await createOrder(creds, params);
        break;

      case 'testConnection':
        // Pode ser um ping simples com fetchMarkets
        await fetchMarkets();
        data = { ok: true };
        break;

      default:
        throw new Error(`Ação inválida: ${action}`);
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('[OKX API Error]:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro desconhecido na API OKX',
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
