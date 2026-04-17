"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Chat({ salaId }: { salaId: string }) {
  const [messages, setMessages] = useState<any[]>([]);

  // ESCUTAR NOVAS MENSAGENS (Realtime)
  useEffect(() => {
    const channel = supabase
      .channel('chat_rpg')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const rollDice = async (dice: string) => {
    const sides = parseInt(dice.replace('d', ''));
    const result = Math.floor(Math.random() * sides) + 1;
    
    // Salva no Supabase para todos verem
    await supabase.from('messages').insert([
      { content: `Rolou ${dice}: **${result}**`, sala_id: salaId }
    ]);
  };

  return (
    <div className="absolute bottom-20 left-4 right-4 bg-slate-900/80 backdrop-blur-md rounded-lg p-4 max-h-40 overflow-y-auto flex flex-col-reverse border border-slate-700">
      {/* Botões de atalho para o Mestre no Celular */}
      <div className="flex gap-2 mb-2">
        {['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map(d => (
          <button 
            key={d} 
            onClick={() => rollDice(d)}
            className="bg-slate-700 px-2 py-1 rounded text-xs text-white hover:bg-red-600"
          >
            {d}
          </button>
        ))}
      </div>
      
      {messages.map((m, i) => (
        <div key={i} className="text-sm text-slate-300 mb-1" dangerouslySetInnerHTML={{__html: m.content}} />
      ))}
    </div>
  );
}
