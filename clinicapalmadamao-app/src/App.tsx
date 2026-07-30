import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { Login } from './pages/Login';
import { Inicio } from './pages/Inicio';
import { ChatPage } from './pages/ChatPage';
import { Perfil } from './pages/Perfil';

export const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState(0);

  if (loading) {
    return (
      <div className="w-full max-w-[430px] h-[100dvh] max-h-[890px] md:rounded-[36px] bg-[#0A5C4A] text-white flex flex-col items-center justify-center text-xs gap-3 shadow-2xl">
        <span className="w-8 h-8 rounded-full border-3 border-[#1DC99A] border-t-transparent animate-spin" />
        <span className="font-medium tracking-wide">Carregando aplicativo...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="w-full max-w-[430px] h-[100dvh] max-h-[890px] sm:h-[860px] md:rounded-[36px] bg-[#F2FAF7] shadow-2xl flex flex-col overflow-hidden relative border border-white/10">
      <Header
        currentTab={currentTab}
        onTabChange={(index) => setCurrentTab(index)}
        hasUnreadNotifs={false}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative bg-[#F2FAF7]">
        {currentTab === 0 && <Inicio onGoToChat={() => setCurrentTab(1)} />}
        {currentTab === 1 && <ChatPage />}
        {currentTab === 2 && <Perfil />}
      </main>

      <Toast />
    </div>
  );
};
