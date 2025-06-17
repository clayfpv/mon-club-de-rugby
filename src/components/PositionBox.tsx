import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import PlayerCard from './PlayerCard';
import { cn } from "@/lib/utils";

interface Player {
  id: string;
  name: string;
}

export interface Position {
  name: string;
  number: number;
  type: 'starter' | 'sub'; // Type strict
  top?: string;
  left?: string;
}

interface PositionBoxProps {
  position: Position;
  player: Player | null;
}

function PositionBox({ position, player }: PositionBoxProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: position.name + '-' + position.number,
  });

  const wrapperStyle: React.CSSProperties = position.type === 'starter' ? {
    position: 'absolute',
    top: position.top,
    left: position.left,
    transform: 'translate(-50%, -50%)',
  } : {};

  return (
    <div
      ref={setNodeRef}
      // Positionnement absolu sur le terrain
      style={wrapperStyle}
      // Classes Tailwind pour le style de la vignette
      className={cn(
        "h-20 rounded-md shadow-lg flex flex-col items-center justify-center transition-all",
        // Taille différente pour les remplaçants
        position.type === 'starter' ? "w-32" : "w-full", 
        isOver ? "ring-4 ring-white ring-opacity-80" : "ring-1 ring-black ring-opacity-30",
        player ? "bg-red-800" : "bg-gray-700 bg-opacity-80"
      )}
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-black font-bold text-sm mb-1">
        {position.number}
      </div>
      <div className="h-10 text-white font-semibold text-center text-sm">
        {player ? (
          // On affiche la PlayerCard si un joueur est assigné
          <PlayerCard player={player} />
        ) : (
          // Pour les remplaçants, on n'affiche pas le nom du poste "Remplaçant"
          position.type === 'starter' && <span className="opacity-60">{position.name.split(' ')[0]}</span>
        )}
      </div>
    </div>
  );
}

export default PositionBox;