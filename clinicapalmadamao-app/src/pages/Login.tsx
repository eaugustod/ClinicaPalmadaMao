import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Informe seu e-mail.');
      return;
    }
    if (!pass) {
      setError('Informe sua senha.');
      return;
    }

    setLoading(true);
    const res = await login(email, pass);
    setLoading(false);

    if (!res.success) {
      setError(res.error || 'Erro ao efetuar login.');
    }
  };

  return (
    <div className="w-full max-w-[430px] h-[100dvh] max-h-[890px] sm:h-[860px] md:rounded-[36px] bg-[#0A5C4A] shadow-2xl flex flex-col justify-between overflow-hidden relative border border-white/10 font-sans">
      {/* Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_60%_at_50%_-10%,rgba(29,201,154,0.2),transparent),radial-gradient(ellipse_80%_80%_at_110%_110%,#0F3D2E,transparent)] pointer-events-none" />

      {/* Top Header Logo */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center">
        <div className="w-[72px] h-[72px] rounded-full bg-[#1DC99A]/15 border border-[#1DC99A]/30 flex items-center justify-center mb-4 shadow-inner">
          <svg viewBox="0 0 38 38" fill="none" className="w-[36px] h-[36px]">
            <circle cx="19" cy="19" r="14" stroke="#1DC99A" strokeWidth="1.5" />
            <path d="M19 12v7l4 4" stroke="#1DC99A" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-serif text-2xl text-white font-normal mb-1.5 leading-tight">
          Clínica<br />na palma da mão
        </h1>
        <p className="text-xs text-white/70">Mensagens e consultas em tempo real</p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-t-[28px] p-6 pb-8 relative z-10 shadow-2xl shrink-0">
        <h2 className="text-base font-bold text-[#0D1F1A] mb-4">Entrar na sua conta</h2>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[10px] font-semibold text-[#6B8C82] uppercase tracking-wider mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="w-full px-3.5 py-2.5 border border-[#D4E8E1] rounded-xl text-xs text-[#0D1F1A] focus:outline-none focus:border-[#0F7A62] transition-colors bg-[#F2FAF7]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-[#6B8C82] uppercase tracking-wider mb-1">
              Senha de acesso
            </label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="Senha fornecida pela clínica"
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 border border-[#D4E8E1] rounded-xl text-xs text-[#0D1F1A] focus:outline-none focus:border-[#0F7A62] transition-colors bg-[#F2FAF7]"
            />
          </div>

          <p className="text-[11px] text-[#6B8C82]">
            Sua senha foi definida pela clínica no seu cadastro.
          </p>

          {error && (
            <div className="text-red-600 text-xs font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0A5C4A] hover:bg-[#0F7A62] text-white font-bold text-xs rounded-xl transition-all active:scale-[0.98] shadow-md disabled:opacity-50 cursor-pointer mt-1"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
