import React from 'react';
import { Home, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavTabsProps {
  currentTab: number;
  onTabChange: (index: number) => void;
}

export const NavTabs: React.FC<NavTabsProps> = ({ currentTab, onTabChange }) => {
  const { unreadCount } = useAuth();

  const tabs = [
    { id: 0, label: 'Início', icon: Home },
    { id: 1, label: 'Mensagens', icon: MessageSquare },
    { id: 2, label: 'Perfil', icon: User },
  ];

  return (
    <div className="flex bg-black/20 rounded-xl p-1 gap-1 border border-white/10">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isActive
                ? 'bg-white text-[#0A5C4A] shadow-md font-bold'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
            {tab.id === 1 && unreadCount > 0 && (
              <span className="bg-[#1DC99A] text-[#0A5C4A] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
