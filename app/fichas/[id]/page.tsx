"use client";
/**
 * app/vtt/[salaId]/page.tsx
 *
 * Página da mesa virtual. Orquestra os componentes:
 *   VTTCanvas   → mapa interativo com tokens
 *   TokenPanel  → painel de controle do token selecionado
 *   VTTControls → toolbar inferior (upload mapa, adicionar token, dados)
 *   Chat        → log de mensagens e rolagens
 *   SceneNav    → navegação de cenas
 *
 * O estado `selectedToken` e `fichasMap` vivem AQUI —
 * VTTCanvas e TokenPanel são folhas que recebem props.
 */
import React, { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import VTTCanvas from "../../../src/components/vtt/VTTCanvas";
import TokenPanel from "../../../src/components/vtt/TokenPanel";
import VTTControls from "../../../src/components/vtt/VTTControls";
import Chat from "../../../src/components/vtt/Chat";
import { Token, FichaVTTSnapshot } from "../../../src/lib/types";

export default function VTTPage() {
  const params = useParams();
  // Em produção, `salaId` virá da URL; `cenaId` será gerenciado pelo SceneNav.
  // Por ora, usamos salaId como cenaId direto para simplificar.
  const cenaId = params.salaId as string;

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [fichasMap, setFichasMap] = useState<Record<string, FichaVTTSnapshot>>({});

  // Quando VTTCanvas atualiza o token (ex: desvincular ficha),
  // precisamos sincronizar o selectedToken local.
  const handleTokenUpdate = useCallback((updated: Token) => {
    setSelectedToken(updated);
  }, []);

  const fichaDoTokenSelecionado = selectedToken?.ficha_id
    ? (fichasMap[selectedToken.ficha_id] ?? null)
    : null;

  return (
    <>
      {/* Canvas do mapa — ocupa toda a tela */}
      <VTTCanvas
        cenaId={cenaId}
        selectedTokenId={selectedToken?.id ?? null}
        onSelectToken={setSelectedToken}
        onFichasMapChange={setFichasMap}
      />

      {/* Painel do token selecionado */}
      <TokenPanel
        token={selectedToken}
        fichaData={fichaDoTokenSelecionado}
        onClose={() => setSelectedToken(null)}
        onTokenUpdate={handleTokenUpdate}
      />

      {/* Toolbar inferior */}
      <VTTControls cenaId={cenaId} />

      {/* Chat / log de rolagens */}
      <Chat salaId={cenaId} />
    </>
  );
}
