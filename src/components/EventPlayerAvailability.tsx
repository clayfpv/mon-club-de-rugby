import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Button } from '@/components/ui/button'; // On utilise notre bouton stylisé

interface Player { id: string; name: string; }
interface Availability { id?: string; player_id: string; status: 'Présent' | 'Absent' | 'Indécis'; }
interface EventPlayerAvailabilityProps {
  player: Player;
  eventId: string;
  initialAvailability?: Availability | null;
}

export function EventPlayerAvailability({ player, eventId, initialAvailability }: EventPlayerAvailabilityProps) {
  const [status, setStatus] = useState<'Présent' | 'Absent' | 'Indécis'>(initialAvailability?.status || 'Indécis');
  const [isSaving, setIsSaving] = useState(false);
  const [availabilityId, setAvailabilityId] = useState<string | undefined>(initialAvailability?.id);

  useEffect(() => {
    setStatus(initialAvailability?.status || 'Indécis');
    setAvailabilityId(initialAvailability?.id);
  }, [initialAvailability]);

  const handleStatusChange = async (newStatus: 'Présent' | 'Absent' | 'Indécis') => {
    setIsSaving(true);
    const availabilityData = { event_id: eventId, player_id: player.id, status: newStatus };
    const { data: newData, error } = await supabase.from('player_availabilities').upsert(availabilityData, { onConflict: 'event_id, player_id' }).select('id').single();
    if (error) { console.error("Erreur disponibilité:", error); }
    else if (newData) { setAvailabilityId(newData.id); setStatus(newStatus); }
    setIsSaving(false);
  };
  
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
      <span className="text-sm font-medium">{player.name}</span>
      <div className="flex items-center gap-2">
        {isSaving && <span className="text-xs text-gray-500 animate-pulse">Enreg...</span>}
        {(['Présent', 'Absent', 'Indécis'] as const).map(statusOption => (
          <Button
            key={statusOption}
            variant={status === statusOption ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleStatusChange(statusOption)}
            disabled={isSaving}
            className={`
              ${status === 'Présent' && status === statusOption ? 'bg-green-600 hover:bg-green-700' : ''}
              ${status === 'Absent' && status === statusOption ? 'bg-red-600 hover:bg-red-700' : ''}
              ${status === 'Indécis' && status === statusOption ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
            `}
          >
            {statusOption}
          </Button>
        ))}
        {availabilityId && (
          <Button 
            variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/dispo/${availabilityId}`)}
            title="Copier le lien de mise à jour pour ce joueur"
          >
            🔗
          </Button>
        )}
      </div>
    </div>
  );
}