"use client";
import React, { useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line } from 'react-konva';
import useImage from 'use-image';
import { supabase } from '../../lib/supabase';

const GRID_SIZE = 50;

// Tipagem atualizada para receber cenaId e mapaUrl
export default function VTTCanvas({ cenaId, mapaUrl }: { cenaId: string, mapaUrl?: string }) {
  const [tokens, setTokens] = useState<any[]>([]);
  // Garante que o Konva use a imagem correta ou fique vazio se não tiver
  const [image] = useImage(mapaUrl || ''); 
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    
    if (cenaId) {
      carregarDadosIniciais();
    }
    
    const channel = supabase
      .channel(`vtt_realtime_${cenaId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens', filter: `cena_id=eq.${cenaId}` }, payload => {
        if (payload.eventType === 'UPDATE') {
          setTokens(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        } else if (payload.eventType === 'INSERT') {
          setTokens(prev => [...prev, payload.new]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [cenaId, mapaUrl]); // Agora reage a mudanças na cena ou mapa

  const carregarDadosIniciais = async () => {
    // Busca tokens baseados na CENA e não mais na sala
    const { data: tokensData } = await supabase.from('tokens').select('*').eq('cena_id', cenaId);
    if (tokensData) setTokens(tokensData);
  };

  const handleDragEnd = async (id: string, e: any) => {
    const newX = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
    const newY = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;

    setTokens(prev => prev.map(t => t.id === id ? { ...t, x: newX, y: newY } : t));
    await supabase.from('tokens').update({ x: newX, y: newY }).eq('id', id);
  };

  const lines = [];
  for (let i = 0; i < windowSize.w / GRID_SIZE; i++) {
    lines.push(<Line key={`v-${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, windowSize.h]} stroke="#1a2b4c" strokeWidth={1} opacity={0.3} />);
  }
  for (let j = 0; j < windowSize.h / GRID_SIZE; j++) {
    lines.push(<Line key={`h-${j}`} points={[0, j * GRID_SIZE, windowSize.w, j * GRID_SIZE]} stroke="#1a2b4c" strokeWidth={1} opacity={0.3} />);
  }

  return (
    <div className="fixed inset-0 bg-[#0d131f] overflow-hidden -z-10">
      <Stage width={windowSize.w} height={windowSize.h} draggable>
        <Layer>
          {image && <KonvaImage image={image} width={image.width} height={image.height} />}
          {lines}
          {tokens.map(t => (
            <Circle
              key={t.id}
              x={t.x + GRID_SIZE / 2}
              y={t.y + GRID_SIZE / 2}
              radius={GRID_SIZE * 0.4}
              fill={t.cor || '#ef4444'}
              draggable
              onDragEnd={(e) => handleDragEnd(t.id, e)}
              shadowBlur={5}
              shadowColor={t.cor || '#ef4444'}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
