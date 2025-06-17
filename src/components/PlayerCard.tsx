// import React from 'react';
import { useDraggable } from '@dnd-kit/core';

interface Player {
  id: string;
  name: string;
}

interface PlayerCardProps {
  player: Player;
}

function PlayerCard({ player }: PlayerCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id, // ID unique pour cet élément déplaçable
    data: { player }, // On peut attacher des données supplémentaires, ici l'objet joueur entier
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 99, // Pour que l'élément soit au-dessus des autres quand on le déplace
  } : undefined;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className="player-card" // On utilisera cette classe pour le style
    >
      {player.name}
    </div>
  );
}

export default PlayerCard;