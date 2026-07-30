import React from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NavTabs } from './NavTabs';

interface HeaderProps {
  currentTab: number;
  onTabChange: (index: number) => void;
  hasUnreadNotifs: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange, hasUnreadNotifs }) => {
  const { user } = useAuth();

  const nome = user?.nome || 'Paciente';
  const initials = nome
    .split(' ')
    .slice(0, 2)
    .map(w => w[0] || '')
    .join('')
    .toUpperCase();

  return (
    <div className="bg-[#0A5C4A] pt-6 px-4 pb-3 text-white shrink-0 shadow-md border-b border-[#0F7A62]">
      {/* User Info Bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-[38px] h-[38px] rounded-full bg-white/15 flex items-center justify-center font-bold text-xs text-white border border-white/20 shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate max-w-[180px]">
              {user?._isDemo ? `${nome} (Demo)` : nome}
            </div>
            <div className="text-[10px] text-white/70 font-sans tracking-wide">Paciente</div>
          </div>
        </div>

        <button
          onClick={() => onTabChange(0)}
          className="w-[36px] h-[36px] rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center border border-white/15 relative transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Bell size={16} className="text-white" />
          {hasUnreadNotifs && (
            <span className="absolute top-[5px] right-[5px] w-2 h-2 rounded-full bg-[#1DC99A] border border-[#0A5C4A]" />
          )}
        </button>
      </div>

      {/* Navigation Tabs */}
      <NavTabs currentTab={currentTab} onTabChange={onTabChange} />
    </div>
  );
};
