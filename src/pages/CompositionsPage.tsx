import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import BlackboardManager from '../components/BlackboardManager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Interface pour nos objets de données
interface Team {
  id: string;
  name: string;
  club_id: string;
}
interface EventData {
  id: string;
  type: string;
  event_date: string;
  opponent?: string | null;
  team_id: string;
}
// Notre type final, où chaque événement est "enrichi" avec les données de son équipe
interface EnrichedEvent extends EventData {
  team: Team | undefined; // L'équipe est maintenant une propriété de premier niveau
}

function CompositionsPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EnrichedEvent | null>(null);

  useEffect(() => {
    async function fetchUpcomingEvents() {
      if (!profile?.club_id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      // --- DÉBUT DE LA LOGIQUE CORRIGÉE ---

      // 1. On lance les deux requêtes en parallèle pour plus d'efficacité
      const [teamsResponse, eventsResponse] = await Promise.all([
        supabase.from('teams').select('*').eq('club_id', profile.club_id),
        supabase.from('events').select('*').gte('event_date', new Date().toISOString()).order('event_date', { ascending: true })
      ]);

      const { data: teamsData, error: teamsError } = teamsResponse;
      const { data: eventsData, error: eventsError } = eventsResponse;

      if (teamsError || eventsError) {
        setError(teamsError?.message || eventsError?.message || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      // 2. On crée une "Map" des équipes pour une recherche facile (id -> objet équipe)
      const teamsMap = new Map(teamsData.map(team => [team.id, team]));

      // 3. On enrichit chaque événement avec les données de son équipe
      const enrichedEvents = eventsData
        // On s'assure de ne garder que les événements des équipes du club
        .filter(event => teamsMap.has(event.team_id)) 
        .map(event => ({
          ...event,
          team: teamsMap.get(event.team_id)
        }));

      setEvents(enrichedEvents as EnrichedEvent[]);
      setLoading(false);
      // --- FIN DE LA LOGIQUE CORRIGÉE ---
    }

    if (profile) {
        fetchUpcomingEvents();
    }
  }, [profile]);

  // Si on a sélectionné un événement, on affiche le tableau noir
  if (selectedEvent && selectedEvent.team) { // On vérifie que .team existe bien
    return (
      <BlackboardManager 
        eventId={selectedEvent.id}
        teamId={selectedEvent.team.id}
        onClose={() => setSelectedEvent(null)}
      />
    );
  }

  if (loading) return <div>Chargement des événements...</div>;
  if (error) return <div className="text-red-500">Erreur: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Compositions d'Équipe</h1>
        <p className="text-gray-500 mt-1">Sélectionnez un événement pour préparer ou consulter sa composition.</p>
      </div>
      <div className="space-y-4">
        {events.length > 0 ? events.map(event => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle>{event.type === 'Match' ? `Match vs ${event.opponent || 'N/A'}` : 'Entraînement'}</CardTitle>
              <CardDescription>
                {new Date(event.event_date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}
                {' - '}
                {/* On accède maintenant à event.team.name */}
                <span className="font-semibold">{event.team?.name || 'Équipe inconnue'}</span>
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => setSelectedEvent(event)}>Composer l'Équipe</Button>
            </CardFooter>
          </Card>
        )) : (
          <p>Aucun événement à venir trouvé pour les équipes de votre club.</p>
        )}
      </div>
    </div>
  );
}

export default CompositionsPage;