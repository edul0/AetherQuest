"use client";

import React from "react";
import { Card, CardContent, Badge, Button, Grid } from "@/src/components/ui";
import { Edit, Play, Trash2 } from "lucide-react";

export type FichaCardProps = {
  id: string;
  nome: string;
  class?: string;
  level?: number;
  system?: string;
  status?: "online" | "offline" | "idle";
  onEdit?: () => void;
  onPlay?: () => void;
  onDelete?: () => void;
};

/**
 * Card otimizado para exibição de ficha
 */
export function FichaCard({
  id,
  nome,
  class: playerClass,
  level = 1,
  system = "D&D 5e",
  status = "offline",
  onEdit,
  onPlay,
  onDelete,
}: FichaCardProps) {
  const statusVariant =
    status === "online" ? "success" : status === "idle" ? "warning" : "default";
  const statusLabel =
    status === "online" ? "Online" : status === "idle" ? "Idle" : "Offline";

  return (
    <Card hover glass>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-cinzel font-bold text-lg text-aq-title">
              {nome}
            </h3>
            <p className="text-sm text-aq-text-muted">
              {playerClass && `${playerClass} • `}
              Nível {level}
            </p>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </div>

        <p className="text-xs text-aq-text-subtle mb-4">{system}</p>

        <div className="flex gap-2">
          {onPlay && (
            <Button
              variant="primary"
              size="sm"
              icon={<Play size={14} />}
              onClick={onPlay}
            >
              Jogar
            </Button>
          )}
          {onEdit && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Edit size={14} />}
              onClick={onEdit}
            >
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={onDelete}
            >
              Remover
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type FichaGridProps = {
  fichas: FichaCardProps[];
  isLoading?: boolean;
  cols?: number;
  onCreateNew?: () => void;
};

/**
 * Grid otimizado para exibir múltiplas fichas
 */
export function FichaGrid({
  fichas,
  isLoading = false,
  cols = 3,
  onCreateNew,
}: FichaGridProps) {
  if (isLoading) {
    return (
      <Grid cols={cols}>
        {Array(6)
          .fill(null)
          .map((_, i) => (
            <Card key={i} glass className="h-40 animate-pulse" />
          ))}
      </Grid>
    );
  }

  if (fichas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-aq-text-muted mb-4">Nenhuma ficha encontrada</p>
        {onCreateNew && (
          <Button variant="primary" onClick={onCreateNew}>
            Criar Primeira Ficha
          </Button>
        )}
      </div>
    );
  }

  return (
    <Grid cols={cols}>
      {fichas.map((ficha) => (
        <FichaCard key={ficha.id} {...ficha} />
      ))}
    </Grid>
  );
}
