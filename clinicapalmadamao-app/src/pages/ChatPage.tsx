import React, { useState, useEffect, useRef } from 'react';
import { Send, Bell, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Mensagem } from '../types';

export const ChatPage: React.FC = () => {
  const { user, conversaId, setUnreadCount } = useAuth();
  const [messages, setMessages] = useState<Mensagem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation messages
  const fetchMessages = async (silent = false) => {
    if (!conversaId || conversaId === 'demo') {
      if (user?._isDemo && !silent) {
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

    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('enviada_em', { ascending: true });

      if (!error && data) {
        setMessages(data);

        // Marca como lidas mensagens da clínica
        await supabase
          .from('mensagens')
          .update({ lida: true })
          .eq('conversa_id', conversaId)
          .eq('tipo_remetente', 'clinica')
          .eq('lida', false);

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
  }, [conversaId]);

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
            supabase.from('mensagens').update({ lida: true }).eq('id', newMsg.id);
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
    if (!text) return;

    setInputText('');

    // Demo Mode
    if (user?._isDemo || conversaId === 'demo') {
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

    if (!conversaId) return;

    setSending(true);
    try {
      const { data: inserted, error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: Number(conversaId),
          remetente_id: Number(user?.id),
          tipo_remetente: 'paciente',
          conteudo: text,
          lida: false,
          enviada_em: new Date().toISOString()
        })
        .select('*')
        .single();

      if (!error && inserted) {
        setMessages((prev) => [...prev, inserted]);
        await supabase
          .from('conversas')
          .update({ ultima_mensagem_em: new Date().toISOString() })
          .eq('id', conversaId);
      }
    } catch (err) {
      console.error('[ChatPage] Error sending message:', err);
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
          <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#6B8C82] p-8">
            Nenhuma mensagem ainda.<br />Envie uma mensagem para a clínica!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.tipo_remetente === 'paciente';
            const isSys = m.tipo_remetente === 'sistema';
            const timeStr = new Date(m.enviada_em).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            });

            if (isSys) {
              return (
                <div
                  key={m.id}
                  className="bg-[#FFF8E7] text-[#B85C00] border border-[#FDDCB0] rounded-2xl rounded-tl-sm p-3.5 max-w-[88%] text-xs shadow-sm space-y-1"
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider opacity-80 flex items-center gap-1">
                    <Bell size={12} /> Lembrete da clínica
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{m.conteudo.replace(/^🔔\s*/, '')}</p>
                  <span className="text-[9px] opacity-70 block text-right font-mono mt-1">{timeStr}</span>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`flex flex-col max-w-[80%] text-xs ${
                  isMe ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <span className="text-[10px] text-[#6B8C82] mb-0.5 px-1 font-medium">
                  {isMe ? 'Você' : 'Clínica Saúde'}
                </span>
                <div
                  className={`p-3 rounded-2xl leading-relaxed shadow-sm break-words ${
                    isMe
                      ? 'bg-[#1a6b54] text-white rounded-tr-sm'
                      : 'bg-white text-[#0D1F1A] border border-[#D4E8E1] rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.conteudo}</p>
                  <div
                    className={`text-[9px] flex items-center justify-end gap-1 mt-1 font-mono ${
                      isMe ? 'text-white/75' : 'text-[#6B8C82]'
                    }`}
                  >
                    <span>{timeStr}</span>
                    {isMe && (m.lida ? <CheckCheck size={12} /> : <Check size={12} />)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-[#D4E8E1] flex items-center gap-2 shrink-0 shadow-md"
      >
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva uma mensagem..."
          rows={1}
          className="flex-1 bg-[#F2FAF7] border border-[#D4E8E1] rounded-2xl px-4 py-2 text-xs text-[#0D1F1A] focus:outline-none focus:border-[#0F7A62] resize-none max-h-20 leading-normal font-sans"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="w-9 h-9 rounded-full bg-[#0A5C4A] text-white flex items-center justify-center shrink-0 hover:bg-[#0F7A62] transition-transform active:scale-95 disabled:opacity-40 cursor-pointer shadow-md"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
