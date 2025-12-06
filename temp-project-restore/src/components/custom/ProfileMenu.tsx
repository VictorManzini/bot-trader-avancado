'use client';

import { useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface ProfileMenuProps {
  user: any;
  profile: any;
}

export default function ProfileMenu({ user, profile }: ProfileMenuProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowMenu(false);
    router.push('/auth');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-white/20 hover:bg-white/30 text-white px-4 py-3 rounded-xl flex items-center gap-2 transition-all"
      >
        <User className="w-5 h-5" />
        <span className="hidden sm:inline">
          {profile?.username || user?.email?.split('@')[0]}
        </span>
      </button>

      {/* Menu Dropdown */}
      {showMenu && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl z-50">
            <div className="p-3 border-b border-white/20">
              <p className="text-white font-semibold text-sm">
                {profile?.nome} {profile?.sobrenome}
              </p>
              <p className="text-white/60 text-xs">@{profile?.username}</p>
              {profile?.pais && (
                <p className="text-white/50 text-xs mt-1">📍 {profile.pais}</p>
              )}
            </div>
            <button
              onClick={() => {
                setShowMenu(false);
                alert('Página de perfil em desenvolvimento');
              }}
              className="w-full text-left px-4 py-3 text-white/80 hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 text-red-300 hover:bg-white/10 transition-colors flex items-center gap-2 rounded-b-xl"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  );
}
