import React from 'react';
import { Bell, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Perfil: React.FC = () => {
  const { user, logout, showToast } = useAuth();

  const nome = user?.nome || 'Paciente';
  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

  const requestPushPermission = async () => {
    if (!('Notification' in window)) {
      showToast('Seu navegador não suporta notificações', 'error');
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      showToast('Notificações ativadas com sucesso! ✓', 'success');
    } else {
      showToast('Permissão de notificação negada', 'error');
    }
  };

  return (
    <div className="p-5 flex-1 overflow-y-auto">
      {/* Hero Card */}
      <div className="bg-[#0A5C4A] rounded-[18px] p-5 text-white flex items-center gap-4 mb-4 shadow-md">
        <div className="w-[60px] h-[60px] rounded-full bg-white/15 flex items-center justify-center font-bold text-xl text-white border border-white/20 shrink-0">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-serif text-lg truncate">{nome}</div>
          <div className="text-xs text-white/60 truncate mt-0.5">{user?.email}</div>
        </div>
      </div>

      {/* Menu Options */}
      <div className="space-y-2">
        <button
          onClick={requestPushPermission}
          className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm hover:bg-[#F2FAF7] transition-colors cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-[#E8F5F1] flex items-center justify-center shrink-0">
            <Bell size={18} className="text-[#0A5C4A]" />
          </div>
          <span className="flex-1 text-xs font-semibold text-[#0D1F1A]">
            Ativar notificações push
          </span>
          <ChevronRight size={16} className="text-[#6B8C82]" />
        </button>

        <button
          onClick={logout}
          className="w-full bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm hover:bg-red-50 transition-colors cursor-pointer text-left"
        >
          <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <LogOut size={18} className="text-red-600" />
          </div>
          <span className="flex-1 text-xs font-semibold text-red-600">Sair da conta</span>
          <ChevronRight size={16} className="text-[#6B8C82]" />
        </button>
      </div>
    </div>
  );
};
