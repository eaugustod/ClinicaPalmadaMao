export interface Paciente {
  id: number | string;
  nome: string;
  email: string;
  cpf?: string | null;
  senha_chat?: string | null;
  _semSenha?: boolean;
  _isDemo?: boolean;
}

export interface Conversa {
  id: number;
  paciente_id: number;
  status: string;
  ultima_mensagem_em?: string;
}

export interface Mensagem {
  id: number;
  conversa_id: number;
  remetente_id?: number | null;
  tipo_remetente: 'clinica' | 'paciente' | 'sistema';
  conteudo: string;
  lida: boolean;
  enviada_em: string;
  anexo_url?: string | null;
  anexo_nome?: string | null;
  anexo_tipo?: string | null;
}

export interface Notificacao {
  id: number;
  paciente_id: number;
  titulo: string;
  corpo: string;
  tipo: 'lembrete' | 'confirmacao' | 'confirmar' | 'resultado' | 'outros';
  enviada: boolean;
  agendada_para: string;
  lida_pelo_paciente?: boolean;
}
