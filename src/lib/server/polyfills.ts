/**
 * Polyfills para ambiente de servidor Node.js
 * 
 * Algumas bibliotecas (como ccxt) esperam que funções globais do navegador
 * como atob e btoa estejam disponíveis. Este arquivo fornece implementações
 * compatíveis usando Buffer do Node.js.
 */

// Polyfill para atob (base64 decode)
if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = (data: string): string => {
    return Buffer.from(data, 'base64').toString('binary');
  };
}

// Polyfill para btoa (base64 encode)
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = (data: string): string => {
    return Buffer.from(data, 'binary').toString('base64');
  };
}
