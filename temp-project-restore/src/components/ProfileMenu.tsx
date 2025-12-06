'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { User, LogOut, UserCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ProfileMenuProps {
  user: any;
}

export default function ProfileMenu({ user }: ProfileMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  const displayName = profile?.username || user?.email?.split('@')[0] || 'Usuário';

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão de Perfil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl transition-all"
      >
        <UserCircle className="w-5 h-5" />
        <span className="hidden md:inline">{displayName}</span>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl overflow-hidden z-50">
          {/* Header do Menu */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">{displayName}</p>
                <p className="text-white/60 text-sm">{user?.email}</p>
              </div>
            </div>
            {profile && (
              <div className="mt-3 pt-3 border-t border-white/20">
                <p className="text-white/80 text-sm">
                  {profile.nome} {profile.sobrenome}
                </p>
                <p className="text-white/60 text-xs">{profile.pais}</p>
              </div>
            )}
          </div>

          {/* Opções do Menu */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsOpen(false);
                router.push('/profile');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <User className="w-5 h-5" />
              <span>Meu Perfil</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
