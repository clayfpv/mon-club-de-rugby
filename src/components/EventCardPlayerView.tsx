import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // L'utilitaire pour combiner les classes Tailwind

interface EventWithAvailability {
  id: string; type: string; event_date: string;
  location?: string | null; opponent?: string | null;
  player_availabilities: { id: string; status: 'Présent' | 'Absent' | 'Indécis'; }[];
}

interface EventCardPlayerViewProps {
  event: EventWithAvailability;
}

export function EventCardPlayerView({ event }: EventCardPlayerViewProps) {
  const { toast } = useToast();
  const availability = event.player_availabilities[0];

  const [currentStatus, setCurrentStatus] = useState(availability?.status);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setCurrentStatus(availability?.status);
  }, [availability]);

  const handleStatusUpdate = async (newStatus: 'Présent' | 'Absent' | 'Indécis') => {
    if (!availability?.id) {
      toast({ title: "Erreur", description: "Impossible de trouver l'enregistrement de disponibilité.", variant: "destructive" });
      return;
    }

    setIsUpdating(true);
    const { error } = await supabase
      .from('player_availabilities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', availability.id);

    if (error) {
      toast({ title: "Erreur", description: "Votre statut n'a pas pu être sauvegardé.", variant: "destructive" });
    } else {
      toast({ title: "Statut mis à jour", description: `Vous êtes maintenant marqué comme : ${newStatus}` });
      setCurrentStatus(newStatus); // Met à jour l'état local après le succès de la requête
    }
    setIsUpdating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event.type === 'Match' ? `Match vs ${event.opponent || 'N/A'}` : 'Entraînement'}</CardTitle>
        <CardDescription>
          {new Date(event.event_date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {event.location && <p className="text-sm text-gray-600"><strong>Lieu :</strong> {event.location}</p>}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <p className="text-sm font-semibold">Ma disponibilité :</p>
        <div className="flex gap-2">
          {(['Présent', 'Absent', 'Indécis'] as const).map((statusOption) => (
            <Button
              key={statusOption}
              variant={currentStatus === statusOption ? 'default' : 'outline'}
              onClick={() => handleStatusUpdate(statusOption)}
              disabled={isUpdating}
              className={cn(
                currentStatus === statusOption && statusOption === 'Présent' && 'bg-green-600 hover:bg-green-700',
                currentStatus === statusOption && statusOption === 'Absent' && 'bg-red-600 hover:bg-red-700',
                currentStatus === statusOption && statusOption === 'Indécis' && 'bg-yellow-500 hover:bg-yellow-600',
              )}
            >
              {isUpdating ? '...' : statusOption}
            </Button>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}