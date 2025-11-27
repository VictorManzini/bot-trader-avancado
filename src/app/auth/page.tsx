'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Globe, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    nome: '',
    sobrenome: '',
    pais: '',
  });

  const validateForm = () => {
    if (!isLogin) {
      if (!formData.nome.trim()) {
        setError('Nome é obrigatório');
        return false;
      }
      if (!formData.sobrenome.trim()) {
        setError('Sobrenome é obrigatório');
        return false;
      }
      if (!formData.pais.trim()) {
        setError('País é obrigatório');
        return false;
      }
      if (!formData.username.trim()) {
        setError('Username é obrigatório');
        return false;
      }
      if (formData.username.length < 3) {
        setError('Username deve ter no mínimo 3 caracteres');
        return false;
      }
    }
    
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }
    
    if (!formData.password || formData.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return false;
    }
    
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          router.push('/');
        }
      } else {
        // Cadastro
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          // Criar perfil do usuário na tabela profiles
          const { error: profileError } = await supabase.from('profiles').insert({
            id: data.user.id,
            email: formData.email,
            username: formData.username,
            nome: formData.nome,
            sobrenome: formData.sobrenome,
            pais: formData.pais,
          });

          if (profileError) throw profileError;

          // Login automático após cadastro
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
          });

          if (signInError) throw signInError;

          // Redirecionar para dashboard
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🤖 BOT TRADER
          </h1>
          <p className="text-white/70">
            {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Nome *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-xl pl-12 pr-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500"
                    placeholder="Seu nome"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Sobrenome *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    value={formData.sobrenome}
                    onChange={(e) => setFormData({ ...formData, sobrenome: e.target.value })}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-xl pl-12 pr-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500"
                    placeholder="Seu sobrenome"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  País *
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    value={formData.pais}
                    onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-xl pl-12 pr-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500"
                    placeholder="Brasil"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-white/80 text-sm mb-2 block">
                  Username *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-white/20 text-white border border-white/30 rounded-xl pl-12 pr-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500"
                    placeholder="seu_username"
                    required
                    minLength={3}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-white/80 text-sm mb-2 block">
              Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/20 text-white border border-white/30 rounded-xl pl-12 pr-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-white/80 text-sm mb-2 block">
              Senha *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-white/20 text-white border border-white/30 rounded-xl pl-12 pr-4 py-3 placeholder-white/50 focus:outline-none focus:border-purple-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Criar Conta'}
          </button>
        </form>

        {/* Toggle Login/Cadastro */}
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-white/70 hover:text-white transition-colors text-sm"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>

        {/* Voltar */}
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
