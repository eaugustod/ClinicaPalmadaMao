import React, { useState, useEffect, useRef } from 'react';
import { Send, Bell, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Mensagem } from '../types';

export const ChatPage: React.FC = () => {
  const { user, conversaId, setUnreadCount, showToast } = useAuth();
  const [messages, setMessages] = useState<Mensagem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation messages
  const fetchMessages = async (silent = false) => {
    if (conversaId === 'demo' || user?._isDemo) {
      if (!silent) {
        setMessages([
          {
            id: 1,
            conversa_id: 0,
            tipo_remetente: 'clinica',
            conteudo: 'Olá! Bem-vindo ao app da clínica 😊 Este é o modo demonstração.',
            lida: true,
            enviada_em: new Date().toISOString()
          },
          {
            id: 2,
            conversa_id: 0,
            tipo_remetente: 'sistema',
            conteudo: 'Sua consulta de demonstração está agendada para sexta-feira às 14h30.',
            lida: true,
            enviada_em: new Date().toISOString()
          }
        ]);
        setLoading(false);
      }
      return;
    }

    let activeCId = conversaId;

    // Se conversaId ainda não foi resolvido no contexto, tenta buscar/criar no Supabase
    if (!activeCId && user?.id) {
      try {
        const pId = Number(user.id);
        const { data: convList } = await supabase
          .from('conversas')
          .select('id')
          .eq('paciente_id', pId)
          .order('id', { ascending: true })
          .limit(1);

        if (convList && convList.length > 0) {
          activeCId = convList[0].id;
        } else {
          const { data: newConv } = await supabase
            .from('conversas')
            .insert([{ paciente_id: pId, status: 'ativa' }])
            .select('id')
            .maybeSingle();

          if (newConv?.id) activeCId = newConv.id;
        }
      } catch (err) {
        console.error('[ChatPage] Error resolving conversa on load:', err);
      }
    }

    if (!activeCId) {
      if (!silent) setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', Number(activeCId))
        .order('enviada_em', { ascending: true });

      if (!error && data) {
        setMessages(data);

        // Marca como lidas mensagens da clínica em segundo plano
        supabase
          .from('mensagens')
          .update({ lida: true })
          .eq('conversa_id', Number(activeCId))
          .eq('tipo_remetente', 'clinica')
          .eq('lida', false)
          .then(() => {});

        setUnreadCount(0);
      }
    } catch (err) {
      console.error('[ChatPage] Error loading messages:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversaId, user?.id]);

  // Realtime subscription + Polling fallback every 3 seconds
  useEffect(() => {
    if (!conversaId || conversaId === 'demo') return;

    const channel = supabase
      .channel(`chat-${conversaId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `conversa_id=eq.${conversaId}` },
        (payload) => {
          const newMsg = payload.new as Mensagem;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.tipo_remetente === 'clinica') {
            supabase.from('mensagens').update({ lida: true }).eq('id', newMsg.id).then(() => {});
          }
        }
      )
      .subscribe();

    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [conversaId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || !user) return;

    // Demo Mode
    if (user?._isDemo || conversaId === 'demo') {
      setInputText('');
      const newMsgDemo: Mensagem = {
        id: Date.now(),
        conversa_id: 0,
        tipo_remetente: 'paciente',
        conteudo: text,
        lida: true,
        enviada_em: new Date().toISOString()
      };
      setMessages((prev) => [...prev, newMsgDemo]);
      return;
    }

    let targetConvId = conversaId;

    // On-the-fly resolution of active conversation ID if missing
    if (!targetConvId) {
      try {
        const pId = Number(user.id);
        const { data: convList } = await supabase
          .from('conversas')
          .select('id')
          .eq('paciente_id', pId)
          .order('id', { ascending: true })
          .limit(1);

        if (convList && convList.length > 0) {
          targetConvId = convList[0].id;
        } else {
          const { data: newConv } = await supabase
            .from('conversas')
            .upsert({ paciente_id: pId, status: 'ativa' }, { onConflict: 'paciente_id' })
            .select('id')
            .maybeSingle();
          if (newConv?.id) targetConvId = newConv.id;
        }
      } catch (err) {
        console.error('[ChatPage] Error resolving conversa on the fly:', err);
      }
    }

    if (!targetConvId) {
      showToast('Não foi possível conectar à conversa com a clínica. Tente novamente.', 'error');
      return;
    }

    setInputText('');
    setSending(true);

    try {
      const { data: inserted, error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: Number(targetConvId),
          remetente_id: Number(user.id),
          tipo_remetente: 'paciente',
          conteudo: text,
          lida: false,
          enviada_em: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('[ChatPage] Supabase error inserting msg:', error);
        showToast('Erro ao enviar mensagem: ' + (error.message || 'Erro no banco'), 'error');
        setInputText(text);
        return;
      }

      if (inserted) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === inserted.id)) return prev;
          return [...prev, inserted];
        });
        await supabase
          .from('conversas')
          .update({ ultima_mensagem_em: new Date().toISOString() })
          .eq('id', targetConvId);
      }
    } catch (err: any) {
      console.error('[ChatPage] Error sending message:', err);
      showToast('Erro de conexão ao enviar mensagem', 'error');
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F2FAF7] overflow-hidden relative">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-xs text-[#6B8C82] gap-2">
            <span className="w-5 h-5 rounded-full border-2 border-[#0A5C4A] border-t-transparent animate-spin" />
            Carregando mensagens...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#6B8C82] p-8 space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#E1F2EC] flex items-center justify-center text-[#0A5C4A] mx-auto mb-1">
              <Bell size={20} />
            </div>
            <p className="font-bold text-slate-700 text-sm">Nenhuma mensagem ainda</p>
            <p className="text-[11px] text-slate-500 max-w-[240px]">
              Envie uma mensagem abaixo para iniciar o atendimento direto com a clínica.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isPatient = m.tipo_remetente === 'paciente';
            const isSys = m.tipo_remetente === 'sistema';
            const time = new Date(m.enviada_em).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            });

            if (isSys) {
              return (
                <div
                  key={m.id}
                  className="max-w-[90%] bg-amber-50 border border-amber-200/60 rounded-2xl p-3 text-amber-800 self-start space-y-1 shadow-sm text-xs"
                >
                  <span className="text-[9px] font-black uppercase tracking-wider block text-amber-600">
                    🔔 Aviso da Clínica
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap">{m.conteudo.replace(/^🔔\s*/, '')}</p>
                  <span className="text-[8px] text-slate-400 font-mono block text-right">{time}</span>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs flex flex-col shadow-sm ${
                  isPatient
                    ? 'bg-[#0A5C4A] text-white rounded-br-none ml-auto'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{m.conteudo}</p>
                <div
                  className={`text-[9px] font-mono mt-1 text-right flex items-center justify-end gap-1 ${
                    isPatient ? 'text-emerald-100/70' : 'text-slate-400'
                  }`}
                >
                  <span>{time}</span>
                  {isPatient && (
                    <span>
                      {m.lida ? <CheckCheck size={12} className="text-emerald-300 inline" /> : <Check size={12} className="inline" />}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-[#D3E8E1] flex items-center gap-2 shrink-0 shadow-lg"
      >
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          rows={1}
          className="flex-1 bg-[#F2FAF7] border border-[#C5E3D9] rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#0A5C4A] resize-none max-h-20 scrollbar-thin"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="w-9 h-9 rounded-xl bg-[#0A5C4A] hover:bg-[#074739] text-white flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
