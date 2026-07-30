import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Notificacao } from '../types';
import { InstallBanner } from '../components/InstallBanner';

interface InicioProps {
  onGoToChat: () => void;
}

export const Inicio: React.FC<InicioProps> = ({ onGoToChat }) => {
  const { user, showToast } = useAuth();
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._isDemo) {
      setNotifs([
        {
          id: 1,
          paciente_id: 0,
          titulo: 'Lembrete de consulta',
          corpo: 'Sua consulta é na próxima sexta às 14h30. Lembre-se de trazer seus exames.',
          tipo: 'lembrete',
          enviada: true,
          agendada_para: new Date().toISOString()
        },
        {
          id: 2,
          paciente_id: 0,
          titulo: 'Consulta confirmada',
          corpo: 'Agendamento para sexta-feira às 14h30 confirmado com sucesso.',
          tipo: 'confirmacao',
          enviada: true,
          agendada_para: new Date().toISOString()
        }
      ]);
      setLoading(false);
      return;
    }

    const loadInicioData = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('notificacoes')
          .select('*')
          .eq('paciente_id', user.id)
          .eq('enviada', true)
          .order('agendada_para', { ascending: false })
          .limit(10);

        if (!error && data) {
          setNotifs(data);
        }
      } catch (err) {
        console.error('[Inicio] Error loading notifications:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInicioData();
  }, [user]);

  const lembrete = notifs.find(n => n.tipo === 'lembrete' || n.tipo === 'confirmacao' || n.tipo === 'confirmar');

  const formatAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="p-5 flex-1 overflow-y-auto">
      <InstallBanner />

      {/* Próxima Consulta Section */}
      {loading ? (
        <div className="bg-white rounded-[18px] p-6 mb-4 shadow-sm flex items-center justify-center text-xs text-[#6B8C82] gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-[#0A5C4A] border-t-transparent animate-spin" />
          Carregando informações...
        </div>
      ) : lembrete ? (
        <div className="bg-[#0A5C4A] rounded-[18px] p-5 text-white mb-4 relative overflow-hidden shadow-md">
          <div className="text-[10px] uppercase tracking-wider text-white/60 font-semibold mb-1">
            Próxima consulta
          </div>
          <div className="font-serif text-2xl mb-1">
            {new Date(lembrete.agendada_para).toLocaleDateString('pt-BR', {
              weekday: 'short',
              day: 'numeric',
              month: 'long'
            })}
          </div>
          <div className="text-xs text-white/80 leading-relaxed mb-4">{lembrete.corpo}</div>

          <div className="flex gap-2">
            <button
              onClick={() => showToast('Presença confirmada! Até lá 😊', 'success')}
              className="px-3.5 py-2 bg-[#1DC99A] text-[#0A5C4A] font-semibold text-xs rounded-lg hover:bg-[#1DC99A]/90 transition-colors shadow-sm cursor-pointer"
            >
              Confirmar presença
            </button>
            <button
              onClick={onGoToChat}
              className="px-3.5 py-2 bg-white/15 text-white font-medium text-xs rounded-lg hover:bg-white/25 transition-colors cursor-pointer"
            >
              Falar com a clínica
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[18px] p-6 mb-4 text-center text-xs text-[#6B8C82] shadow-sm">
          Nenhuma consulta agendada no momento.
        </div>
      )}

      {/* Avisos Recentes Card */}
      <div className="bg-white rounded-[18px] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6B8C82]">
            Avisos recentes
          </span>
          <button
            onClick={onGoToChat}
            className="text-xs text-[#0F7A62] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            Ver chat <ArrowRight size={12} />
          </button>
        </div>

        {notifs.length === 0 ? (
          <p className="text-xs text-[#6B8C82] text-center py-4">Nenhum aviso ainda.</p>
        ) : (
          <div className="divide-y divide-[#D4E8E1]">
            {notifs.slice(0, 5).map((n) => {
              const isWarn = n.tipo === 'lembrete';
              return (
                <div key={n.id} className="py-3 flex gap-3.5 items-start first:pt-0 last:pb-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      isWarn ? 'bg-[#FFF8E7]' : 'bg-[#E8F5F1]'
                    }`}
                  >
                    {isWarn ? (
                      <AlertTriangle size={16} className="text-[#B85C00]" />
                    ) : (
                      <CheckCircle2 size={16} className="text-[#0F7A62]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <strong className="block text-xs font-semibold text-[#0D1F1A] mb-0.5">
                      {n.titulo}
                    </strong>
                    <span className="text-xs text-[#6B8C82] leading-relaxed block truncate">
                      {n.corpo}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6B8C82] whitespace-nowrap mt-0.5">
                    {formatAgo(n.agendada_para)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
