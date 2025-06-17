import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { EventCardPlayerView } from '../components/EventCardPlayerView';
import ClubChat from '../components/ClubChat';

// Interface pour les données que nous récupérons et affichons
interface EventWithAvailability {
  id: string; 
  type: string; 
  event_date: string; 
  location?: string | null;
  opponent?: string | null;
  player_availabilities: { 
    id: string; 
    status: 'Présent' | 'Absent' | 'Indécis'; 
  }[];
}

function PlayerDashboard() {
  const { user, profile, signOut } = useAuth(); // On récupère aussi le profil et signOut
  const [upcomingEvents, setUpcomingEvents] = useState<EventWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // La clause de garde pour s'assurer que l'utilisateur et son profil sont chargés
    if (!user || !profile) {
      // Si le profil n'est pas encore chargé mais que l'utilisateur l'est, on attend.
      // S'il n'y a pas d'utilisateur, on ne fait rien.
      if (!loading) setLoading(false);
      return;
    }

    async function fetchDashboardData() {
      // La garde est maintenant la première chose à l'intérieur de la fonction asynchrone.
      if (!user || !profile) {
        // Si le profil n'est pas encore chargé, on peut choisir d'attendre ou ne rien faire.
        // Mettre loading à false évite de rester bloqué sur "chargement" si user est null.
        if (!loading) setLoading(false);
        return;
      }
      // --- FIN DE LA CORRECTION ---

      setLoading(true);
      setError(null);

      // 1. Trouver le profil du joueur pour obtenir son team_id
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('id, team_id')
        .eq('user_id', user.id) // <-- Cette ligne est maintenant garantie d'être sûre
        .single();
      
      if (playerError || !playerData) {
        setError("Impossible de trouver le profil joueur associé à votre compte.");
        setLoading(false);
        return;
      }

      const teamId = playerData.team_id;

      // 2. Récupérer les événements futurs de son équipe et sa disponibilité
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`id, type, event_date, location, opponent, details, player_availabilities!inner(id, status)`)
        .eq('team_id', teamId)
        .eq('player_availabilities.player_id', playerData.id)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true });
      
      if (eventsError) {
        setError(eventsError.message);
      } else {
        setUpcomingEvents(eventsError as any || []);
      }
      setLoading(false);
    }

    fetchDashboardData();
  }, [user, profile, loading]); // On dépend de `user` et `profile` pour lancer la récupération

  if (loading) {
    return <div className="p-6"><h1>Chargement de votre espace...</h1></div>;
  }
  
  if (error) {
    return <div className="p-6"><h1 className="text-red-500">Erreur : {error}</h1></div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Mon Espace Joueur</h1>
        <div className="text-sm flex items-center gap-4">
          <span>{profile?.full_name || user?.email}</span>
          <button onClick={signOut} className="text-red-600 hover:underline">Déconnexion</button>
        </div>
      </header>

      <main className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Mes Prochains Événements</h2>
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map((event) => (
                <EventCardPlayerView key={event.id} event={event} />
              ))
            ) : (
              <p className="text-gray-500">Aucun événement à venir pour votre équipe pour le moment.</p>
            )}
          </div>

          <div className="lg:col-span-1">
            <ClubChat />
          </div>

        </div>
      </main>
    </div>
  );
}

export default PlayerDashboard;