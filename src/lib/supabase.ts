import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types para o banco de dados
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  nome: string;
  sobrenome: string;
  pais: string;
  created_at: string;
}

export interface BotConfig {
  id: string;
  user_id: string;
  okx_api_key?: string;
  okx_api_secret?: string;
  okx_passphrase?: string;
  mode: 'LIVE' | 'DRY_RUN' | 'BOTH';
  strategy: 'AGGRESSIVE' | 'MEDIUM' | 'CONSERVATIVE';
  risk_percentage: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  user_id: string;
  bot_config_id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  price: number;
  amount: number;
  mode: 'LIVE' | 'DRY_RUN';
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  profit_loss?: number;
  created_at: string;
  closed_at?: string;
}

export interface Prediction {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: '1m' | '15m' | '1h' | '4h' | '1d';
  predicted_price: number;
  confidence_score: number;
  actual_price?: number;
  accuracy?: number;
  created_at: string;
  closes_at: string;
}
