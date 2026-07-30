import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Paciente } from '../types';

interface AuthContextType {
  user: Paciente | null;
  conversaId: number | string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  toastMsg: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Paciente | null>(null);
  const [conversaId, setConversaId] = useState<number | string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('cpm_user');
    const savedConv = localStorage.getItem('cpm_conv');
    if (savedUser && savedConv) {
      try {
        setUser(JSON.parse(savedUser));
        setConversaId(JSON.parse(savedConv));
      } catch (e) {
        localStorage.removeItem('cpm_user');
        localStorage.removeItem('cpm_conv');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Modo Demo
    if (pass === 'demo1234') {
      const demoUser: Paciente = {
        id: 'demo',
        email: cleanEmail,
        nome: cleanEmail.split('@')[0] || 'Paciente Demo',
        _isDemo: true
      };
      setUser(demoUser);
      setConversaId('demo');
      localStorage.setItem('cpm_user', JSON.stringify(demoUser));
      localStorage.setItem('cpm_conv', JSON.stringify('demo'));
      showToast('Modo demonstração ativo', 'info');
      return { success: true };
    }

    // 2. Consulta tabela pacientes
    try {
      const { data: pacBase, error: errBase } = await supabase
        .from('pacientes')
        .select('id, nome, email, senha_chat')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (errBase || !pacBase) {
        return { success: false, error: 'E-mail não encontrado no cadastro. Verifique com a clínica.' };
      }

      const senhaCadastrada = pacBase.senha_chat ?? null;

      if (senhaCadastrada === null || senhaCadastrada === undefined) {
        // Acesso provisório liberado
        const pacObj: Paciente = { ...pacBase, _semSenha: true };
        await initPatientSession(pacObj);
        showToast('Acesso provisório — peça à clínica para definir sua senha no cadastro', 'info');
        return { success: true };
      }

      if (senhaCadastrada !== pass) {
        return { success: false, error: 'Senha incorreta. Verifique com a clínica.' };
      }

      // Login bem sucedido
      await initPatientSession(pacBase);
      return { success: true };
    } catch (err: any) {
      console.error('[AuthContext] Login error:', err);
      return { success: false, error: 'Erro de conexão. Tente novamente.' };
    }
  };

  const initPatientSession = async (pac: Paciente) => {
    setUser(pac);
    localStorage.setItem('cpm_user', JSON.stringify(pac));

    // Busca ou cria conversa ativa
    let { data: conv } = await supabase
      .from('conversas')
      .select('id')
      .eq('paciente_id', pac.id)
      .eq('status', 'ativa')
      .maybeSingle();

    if (!conv) {
      const { data: newConv } = await supabase
        .from('conversas')
        .insert({ paciente_id: pac.id, status: 'ativa' })
        .select('id')
        .maybeSingle();
      conv = newConv;
    }

    const activeConvId = conv?.id || null;
    setConversaId(activeConvId);
    if (activeConvId) {
      localStorage.setItem('cpm_conv', JSON.stringify(activeConvId));
    }
  };

  const logout = () => {
    setUser(null);
    setConversaId(null);
    localStorage.removeItem('cpm_user');
    localStorage.removeItem('cpm_conv');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        conversaId,
        loading,
        login,
        logout,
        toastMsg,
        showToast,
        unreadCount,
        setUnreadCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
