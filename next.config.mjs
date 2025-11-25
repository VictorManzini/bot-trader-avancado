/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para evitar conflitos de porta
  // O servidor tentará usar a porta 3000, mas se estiver ocupada, usará outra automaticamente
  experimental: {
    // Desabilita turbopack se causar problemas
    turbo: {
      resolveAlias: {
        // Aliases para resolver módulos problemáticos
      }
    }
  },
  
  // Configuração para webpack (fallback para módulos Node.js)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fallbacks para módulos que não funcionam no browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };
    }
    
    // Ignora warnings de módulos externos
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
        'canvas': 'commonjs canvas',
        'bufferutil': 'commonjs bufferutil',
        'utf-8-validate': 'commonjs utf-8-validate',
      });
    }
    
    return config;
  },
  
  // Transpila pacotes problemáticos
  transpilePackages: ['ccxt', 'technicalindicators'],
  
  // Configurações de servidor
  serverRuntimeConfig: {
    // Configurações do servidor
  },
  
  publicRuntimeConfig: {
    // Configurações públicas
  },
};

export default nextConfig;
