import { useState } from 'react';
import { Sparkles, Send, Brain, HelpCircle, Loader2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownView } from './MarkdownView';

export default function CopilotModule() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'model',
      text: '¡Hola! Soy **Talent Orchestrator AI**, tu copiloto de talento corporativo. Tengo visibilidad sobre la disponibilidad de la plantilla, las solicitudes de staffing, los planes formativos y los comités de evaluación de desempeño de IT Consulting. \n\n¿En qué puedo ayudarte hoy?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const SUGGESTIONS = [
    '¿Quién es el mejor candidato para el proyecto Mercadona?',
    '¿Qué skills críticas deberíamos capacitar según las solicitudes vigentes?',
    '¿Quién cumple con los requisitos oficiales de promoción en la empresa?',
    '¿Qué colaboradores están libres en bench para staffing?'
  ];

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newHistory })
      });
      if (res.ok) {
        const data = await res.json();
        const modelMsg: ChatMessage = {
          id: `m_${Date.now()}`,
          role: 'model',
          text: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, modelMsg]);
      } else {
        const errData = await res.json();
        const errorMsg: ChatMessage = {
          id: `err_${Date.now()}`,
          role: 'model',
          text: `Lo lamento, ocurrió un inconveniente con el servidor de IA: ${errData.error || 'Intenta de nuevo.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: 'Lo lamento, ocurrió un error de conexión con la IA de la plataforma.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="copilot-module" className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-[550px] overflow-hidden">
      
      {/* Copilot Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
            <Brain className="h-5 w-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1">
              Copiloto de Staffing y Carrera <Sparkles className="h-4 w-4 text-indigo-300" />
            </h3>
            <p className="text-[10px] text-indigo-200">Asistente Experto en Gestión del Talento de IT Consulting</p>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs ${
                isUser 
                  ? 'bg-indigo-600 text-white rounded-br-none' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
              }`}>
                {isUser ? (
                  <p className="whitespace-pre-wrap">{m.text}</p>
                ) : (
                  <MarkdownView content={m.text} />
                )}
                <span className={`text-[9px] mt-1.5 block text-right opacity-60 ${isUser ? 'text-white' : 'text-slate-400'}`}>
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-4 shadow-sm text-xs flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              <span className="text-slate-500 font-medium">Talent Orchestrator está procesando la consulta...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggestion list */}
      <div className="p-2 border-t border-slate-100 flex gap-1 overflow-x-auto bg-white whitespace-nowrap scrollbar-none shrink-0">
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(s)}
            disabled={isLoading}
            className="text-[10px] font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1 text-slate-600 transition shrink-0 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputText);
        }}
        className="p-3 border-t border-slate-200 flex gap-2 bg-white shrink-0"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pregúntale a Talent Orchestrator (ej: ¿quién se libera pronto? o ¿quién merece promocionar?)"
          disabled={isLoading}
          className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
