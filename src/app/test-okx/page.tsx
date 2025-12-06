'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, PlayCircle } from 'lucide-react';
import { runPublicTests, type OKXTestResult } from '@/lib/okx-test';

export default function OKXTestPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<OKXTestResult[]>([]);

  const handleRunTests = async () => {
    setTesting(true);
    setResults([]);
    
    try {
      const testResults = await runPublicTests();
      setResults(testResults);
    } catch (error) {
      console.error('Erro ao executar testes:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle2 className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-500">Sucesso</Badge>
    ) : (
      <Badge variant="destructive">Falha</Badge>
    );
  };

  const passedTests = results.filter(r => r.success).length;
  const totalTests = results.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Teste de Integração OKX
          </h1>
          <p className="text-slate-400 text-lg">
            Valide a integração com a exchange OKX usando CCXT
          </p>
        </div>

        {/* Botão de Teste */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Executar Testes Públicos</CardTitle>
            <CardDescription>
              Testa conexão, mercados, preços e dados OHLCV sem necessidade de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRunTests}
              disabled={testing}
              size="lg"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Executando testes...
                </>
              ) : (
                <>
                  <PlayCircle className="w-5 h-5 mr-2" />
                  Iniciar Testes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Resumo dos Resultados */}
        {results.length > 0 && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-700/50 rounded-lg">
                  <div className="text-3xl font-bold text-white">{totalTests}</div>
                  <div className="text-sm text-slate-400">Total de Testes</div>
                </div>
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-3xl font-bold text-green-500">{passedTests}</div>
                  <div className="text-sm text-slate-400">Sucessos</div>
                </div>
                <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="text-3xl font-bold text-red-500">{totalTests - passedTests}</div>
                  <div className="text-sm text-slate-400">Falhas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados Detalhados */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Resultados Detalhados</h2>
            
            {results.map((result, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.success)}
                      <CardTitle className="text-white">{result.action}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-400">{result.duration}ms</span>
                      {getStatusBadge(result.success)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.success && result.data && (
                    <div className="bg-slate-900/50 p-4 rounded-lg">
                      <div className="text-sm font-semibold text-slate-300 mb-2">Dados Retornados:</div>
                      <pre className="text-xs text-slate-400 overflow-x-auto">
                        {JSON.stringify(
                          Array.isArray(result.data) && result.data.length > 5
                            ? [...result.data.slice(0, 5), { '...': `${result.data.length - 5} mais itens` }]
                            : result.data,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                  
                  {!result.success && result.error && (
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                      <div className="text-sm font-semibold text-red-400 mb-2">Erro:</div>
                      <pre className="text-xs text-red-300 overflow-x-auto">{result.error}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Instruções */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <strong>Clique em "Iniciar Testes"</strong> para executar os testes públicos da API OKX
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                Os testes verificam: <strong>conexão, mercados disponíveis, preço atual e dados OHLCV</strong>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                Todos os testes devem passar com <Badge className="bg-green-500">Sucesso</Badge> para confirmar que a integração está funcionando
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                Verifique o console do navegador (F12) para logs detalhados dos testes
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
