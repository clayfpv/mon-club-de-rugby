import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';

// Types pour les données que nous allons manipuler
interface EventWithAvailability {
  id: string; // ID de l'événement
  type: string;
  event_date: string;
  location?: string | null;
  opponent?: string | null;
  details?: string | null;
  // La disponibilité du joueur connecté pour cet événement
  player_availabilities: {
    id: string; // ID de la ligne de disponibilité
    status: 'Présent' | 'Absent' | 'Indécis';
  }[]; // C'est un tableau, mais il ne devrait contenir qu'un seul élément
}

function PlayerDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayerInfoAndEvents() {
      if (!user) return;

      setLoading(true);
      setError(null);

      // 1. Trouver le profil du joueur pour obtenir son team_id
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('team_id')
        .eq('user_id', user.id)
        .single();
      
      if (playerError || !playerData) {
        setError("Impossible de trouver le profil joueur associé à votre compte.");
        setLoading(false);
        return;
      }

      const teamId = playerData.team_id;

      // 2. Récupérer les événements futurs de l'équipe,
      //    et en même temps, la disponibilité du joueur pour chaque événement.
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          id,
          type,
          event_date,
          location,
          opponent,
          details,
          player_availabilities ( id, status )
        `)
        .eq('team_id', teamId)
        .gte('event_date', new Date().toISOString()) // Uniquement les événements futurs
        .order('event_date', { ascending: true });
      
      if (eventsError) {
        setError(eventsError.message);
      } else if (eventsData) {
        setEvents(eventsData as EventWithAvailability[]);
      }
      setLoading(false);
    }

    fetchPlayerInfoAndEvents();
  }, [user]);

  // Fonction pour mettre à jour le statut
  async function updateStatus(availabilityId: string, newStatus: 'Présent' | 'Absent' | 'Indécis') {
    // Optimistic UI update: met à jour l'interface immédiatement
    setEvents(currentEvents => currentEvents.map(event => {
      const avail = event.player_availabilities[0];
      if (avail && avail.id === availabilityId) {
        return { ...event, player_availabilities: [{ ...avail, status: newStatus }] };
      }
      return event;
    }));
    
    // Puis envoie la requête à Supabase en arrière-plan
    const { error: updateError } = await supabase
      .from('player_availabilities')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', availabilityId);
    
    if (updateError) {
      console.error("Erreur de mise à jour du statut:", updateError);
      alert("Une erreur est survenue. Votre statut n'a peut-être pas été sauvegardé.");
      // On pourrait vouloir re-fetcher les données pour annuler la mise à jour optimiste
    }
  }

  if (loading) return <h1>Chargement de votre programme...</h1>;
  if (error) return <h1 style={{color: 'red'}}>Erreur : {error}</h1>;
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Mon Programme</h2>
      <p>Voici les prochains événements pour votre équipe. Pensez à indiquer vos disponibilités !</p>
      <hr style={{margin: '20px 0'}} />

      {events.length > 0 ? (
        events.map((event) => {
          const availability = event.player_availabilities[0]; // Le joueur n'a qu'une dispo par event
          const currentStatus = availability?.status;
          
          return (
            <div key={event.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '8px' }}>
              <h3 style={{marginTop: 0}}>{event.type} - {new Date(event.event_date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</h3>
              {event.location && <p><strong>Lieu :</strong> {event.location}</p>}
              {event.type === 'Match' && event.opponent && <p><strong>Adversaire :</strong> {event.opponent}</p>}
              
              <div style={{marginTop: '15px'}}>
                <strong>Ma disponibilité :</strong>
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  {(['Présent', 'Absent', 'Indécis'] as const).map(statusOption => (
                    <button
                      key={statusOption}
                      onClick={() => availability && updateStatus(availability.id, statusOption)}
                      disabled={!availability}
                      style={{
                        padding: '8px 12px',
                        border: currentStatus === statusOption ? '2px solid #007bff' : '2px solid #ccc',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        backgroundColor: currentStatus === statusOption ? 'lightblue' : 'white',
                        fontWeight: currentStatus === statusOption ? 'bold' : 'normal',
                      }}
                    >
                      {statusOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <p>Aucun événement à venir pour le moment.</p>
      )}
    </div>
  );
}

export default PlayerDashboard;