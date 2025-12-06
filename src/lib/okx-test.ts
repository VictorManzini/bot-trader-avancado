// Funções auxiliares para testar a integração com OKX via API route

export interface OKXCredentials {
  apiKey: string;
  secret: string;
  password: string;
}

export interface OKXTestResult {
  action: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

/**
 * Testa a conexão com a OKX
 */
export async function testOKXConnection(credentials?: OKXCredentials): Promise<OKXTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/okx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'testConnection',
        credentials,
        params: {},
      }),
    });

    const result = await response.json();
    
    return {
      action: 'testConnection',
      success: result.success,
      data: result.data,
      error: result.error,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      action: 'testConnection',
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Testa fetchOHLCV com símbolo e timeframe reais
 */
export async function testFetchOHLCV(
  symbol: string = 'BTC/USDT',
  timeframe: string = '1h',
  limit: number = 100
): Promise<OKXTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/okx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fetchOHLCV',
        params: { symbol, timeframe, limit },
      }),
    });

    const result = await response.json();
    
    return {
      action: 'fetchOHLCV',
      success: result.success,
      data: result.data,
      error: result.error,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      action: 'fetchOHLCV',
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Testa fetchCurrentPrice
 */
export async function testFetchCurrentPrice(
  symbol: string = 'BTC/USDT'
): Promise<OKXTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/okx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fetchCurrentPrice',
        params: { symbol },
      }),
    });

    const result = await response.json();
    
    return {
      action: 'fetchCurrentPrice',
      success: result.success,
      data: result.data,
      error: result.error,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      action: 'fetchCurrentPrice',
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Testa fetchMarkets
 */
export async function testFetchMarkets(): Promise<OKXTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/okx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fetchMarkets',
        params: {},
      }),
    });

    const result = await response.json();
    
    return {
      action: 'fetchMarkets',
      success: result.success,
      data: result.data,
      error: result.error,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      action: 'fetchMarkets',
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Testa fetchBalance (requer credenciais)
 */
export async function testFetchBalance(credentials: OKXCredentials): Promise<OKXTestResult> {
  const startTime = Date.now();
  
  try {
    const response = await fetch('/api/okx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'fetchBalance',
        credentials,
        params: {},
      }),
    });

    const result = await response.json();
    
    return {
      action: 'fetchBalance',
      success: result.success,
      data: result.data,
      error: result.error,
      duration: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      action: 'fetchBalance',
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Executa todos os testes públicos (sem autenticação)
 */
export async function runPublicTests(): Promise<OKXTestResult[]> {
  console.log('🧪 Iniciando testes públicos da API OKX...\n');
  
  const results: OKXTestResult[] = [];

  // Teste 1: Conexão
  console.log('1️⃣ Testando conexão...');
  const connectionTest = await testOKXConnection();
  results.push(connectionTest);
  console.log(connectionTest.success ? '✅ Conexão OK' : '❌ Falha na conexão', connectionTest);

  // Teste 2: fetchMarkets
  console.log('\n2️⃣ Testando fetchMarkets...');
  const marketsTest = await testFetchMarkets();
  results.push(marketsTest);
  console.log(
    marketsTest.success 
      ? `✅ Mercados obtidos: ${marketsTest.data?.length || 0} mercados` 
      : '❌ Falha ao obter mercados',
    marketsTest
  );

  // Teste 3: fetchCurrentPrice
  console.log('\n3️⃣ Testando fetchCurrentPrice (BTC/USDT)...');
  const priceTest = await testFetchCurrentPrice('BTC/USDT');
  results.push(priceTest);
  console.log(
    priceTest.success 
      ? `✅ Preço atual: $${priceTest.data?.price}` 
      : '❌ Falha ao obter preço',
    priceTest
  );

  // Teste 4: fetchOHLCV
  console.log('\n4️⃣ Testando fetchOHLCV (BTC/USDT, 1h, 100 candles)...');
  const ohlcvTest = await testFetchOHLCV('BTC/USDT', '1h', 100);
  results.push(ohlcvTest);
  console.log(
    ohlcvTest.success 
      ? `✅ OHLCV obtido: ${ohlcvTest.data?.length || 0} candles` 
      : '❌ Falha ao obter OHLCV',
    ohlcvTest
  );

  console.log('\n📊 Resumo dos testes:');
  const passed = results.filter(r => r.success).length;
  console.log(`✅ Passaram: ${passed}/${results.length}`);
  console.log(`❌ Falharam: ${results.length - passed}/${results.length}`);

  return results;
}

/**
 * Executa teste completo incluindo autenticação
 */
export async function runFullTests(credentials: OKXCredentials): Promise<OKXTestResult[]> {
  console.log('🧪 Iniciando testes completos da API OKX (com autenticação)...\n');
  
  // Primeiro executa testes públicos
  const publicResults = await runPublicTests();

  // Depois testa autenticação
  console.log('\n5️⃣ Testando fetchBalance (requer autenticação)...');
  const balanceTest = await testFetchBalance(credentials);
  console.log(
    balanceTest.success 
      ? '✅ Saldo obtido com sucesso' 
      : '❌ Falha ao obter saldo',
    balanceTest
  );

  const allResults = [...publicResults, balanceTest];

  console.log('\n📊 Resumo final:');
  const passed = allResults.filter(r => r.success).length;
  console.log(`✅ Passaram: ${passed}/${allResults.length}`);
  console.log(`❌ Falharam: ${allResults.length - passed}/${allResults.length}`);

  return allResults;
}
