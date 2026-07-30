import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(true);
  const { showToast } = useAuth();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      showToast('Para instalar, use a opção "Adicionar à Tela Inicial" do navegador.', 'info');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
      showToast('Aplicativo instalado com sucesso!', 'success');
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-[#E8F5F1] border border-[#D4E8E1] rounded-xl p-4 mb-4 flex items-center gap-3 shadow-sm">
      <Download size={22} className="text-[#0F7A62] shrink-0" />
      <div className="flex-1 text-xs text-[#0A5C4A] leading-relaxed">
        <strong className="block font-bold text-sm mb-0.5">Instale o app no celular</strong>
        Adicione à tela inicial para receber notificações em tempo real
      </div>
      <button
        onClick={handleInstall}
        className="px-3.5 py-2 bg-[#0A5C4A] text-white text-xs font-semibold rounded-lg hover:bg-[#0F7A62] transition-colors shrink-0 shadow-sm cursor-pointer"
      >
        Instalar
      </button>
    </div>
  );
};
