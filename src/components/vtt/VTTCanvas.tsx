"use client";
import React, { useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Circle, Line } from 'react-konva';
import useImage from 'use-image';
import { supabase } from '../../lib/supabase';
const GRID_SIZE = 50;

export default function VTTCanvas({ salaId }: { salaId: string }) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [mapaUrl, setMapaUrl] = useState<string>('');
  const [image] = useImage(mapaUrl);
  const [windowSize, setWindowSize] = useState({ w: 1000, h: 800 });

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    carregarDadosIniciais();
    
    // ESCUTAR MUDANÇAS EM TEMPO REAL
    const channel = supabase
      .channel('vtt_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, payload => {
        if (payload.eventType === 'UPDATE') {
          setTokens(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'salas' }, payload => {
        if (payload.new.id === salaId) setMapaUrl(payload.new.mapa_url);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [salaId]);

  const carregarDadosIniciais = async () => {
    const { data: tokensData } = await supabase.from('tokens').select('*').eq('sala_id', salaId);
    const { data: salaData } = await supabase.from('salas').select('mapa_url').eq('id', salaId).single();
    if (tokensData) setTokens(tokensData);
    if (salaData) setMapaUrl(salaData.mapa_url);
  };

  const handleDragEnd = async (id: string, e: any) => {
    // Lógica de SNAP (Ímã)
    const newX = Math.round(e.target.x() / GRID_SIZE) * GRID_SIZE;
    const newY = Math.round(e.target.y() / GRID_SIZE) * GRID_SIZE;

    // Atualiza localmente para ser instantâneo
    setTokens(prev => prev.map(t => t.id === id ? { ...t, x: newX, y: newY } : t));

    // Sincroniza com Supabase
    await supabase.from('tokens').update({ x: newX, y: newY }).eq('id', id);
  };

  // DESENHAR O GRID
  const lines = [];
  for (let i = 0; i < windowSize.w / GRID_SIZE; i++) {
    lines.push(<Line key={`v-${i}`} points={[i * GRID_SIZE, 0, i * GRID_SIZE, windowSize.h]} stroke="#334155" strokeWidth={1} />);
  }
  for (let j = 0; j < windowSize.h / GRID_SIZE; j++) {
    lines.push(<Line key={`h-${j}`} points={[0, j * GRID_SIZE, windowSize.w, j * GRID_SIZE]} stroke="#334155" strokeWidth={1} />);
  }

  return (
    <div className="fixed inset-0 bg-slate-950 overflow-hidden">
      <Stage width={windowSize.w} height={windowSize.h} draggable>
        <Layer>
          {/* CAMADA DO MAPA */}
          {image && <KonvaImage image={image} width={image.width} height={image.height} />}
          
          {/* CAMADA DO GRID */}
          {lines}

          {/* CAMADA DOS TOKENS */}
          {tokens.map(t => (
            <Circle
              key={t.id}
              x={t.x + GRID_SIZE / 2}
              y={t.y + GRID_SIZE / 2}
              radius={GRID_SIZE * 0.4}
              fill={t.cor}
              draggable
              onDragEnd={(e) => handleDragEnd(t.id, e)}
              shadowBlur={5}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
