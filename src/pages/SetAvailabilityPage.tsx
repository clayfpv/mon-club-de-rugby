import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Hook pour lire les paramètres de l'URL
import { supabase } from '../supabaseClient';

// Types pour les données que nous allons récupérer
interface AvailabilityInfo {
  status: 'Présent' | 'Absent' | 'Indécis' | '';
  notes?: string | null;
  player: { name: string } | null;
  event: {
    type: string;
    event_date: string;
    location?: string | null;
    opponent?: string | null;
  } | null;
}

function SetAvailabilityPage() {
  const { availabilityId } = useParams<{ availabilityId: string }>(); // Récupère l'ID de la disponibilité depuis l'URL
  const [availability, setAvailability] = useState<AvailabilityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<'Présent' | 'Absent' | 'Indécis' | ''>('');
  const [newNotes, setNewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    async function fetchAvailability() {
      if (!availabilityId) {
        setError("ID de disponibilité manquant dans l'URL.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('player_availabilities')
        .select(`
          status,
          notes,
          player:players ( name ),
          event:events ( type, event_date, location, opponent )
        `)
        .eq('id', availabilityId)
        .single(); // On s'attend à un seul résultat

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setAvailability(data as any);
        setNewStatus(data.status || '');
        setNewNotes(data.notes || '');
      }
      setLoading(false);
    }

    fetchAvailability();
  }, [availabilityId]);

  const handleSave = async () => {
    if (!availabilityId || !newStatus) return;

    setIsSaving(true);
    setError(null);
    setIsSaved(false);

    const { error: updateError } = await supabase
      .from('player_availabilities')
      .update({
        status: newStatus,
        notes: newNotes,
        updated_at: new Date().toISOString() // Mettre à jour la date de modification
      })
      .eq('id', availabilityId);

    if (updateError) {
      setError(updateError.message);
    } else {
      setIsSaved(true);
      // Mettre à jour l'état local pour refléter le changement
      if (availability) {
        setAvailability({ ...availability, status: newStatus, notes: newNotes });
      }
    }
    setIsSaving(false);
  };

  if (loading) return <h1>Chargement...</h1>;
  if (error) return <h1 style={{color: 'red'}}>Erreur : {error}</h1>;
  if (!availability) return <h1>Disponibilité non trouvée.</h1>;

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Mise à jour de votre disponibilité</h2>
      <h3>Bonjour, {availability.player?.name || 'Joueur'} !</h3>
      <hr />
      <h4>Détails de l'événement :</h4>
      <p><strong>Type :</strong> {availability.event?.type}</p>
      <p><strong>Date :</strong> {availability.event?.event_date ? new Date(availability.event.event_date).toLocaleString() : 'N/A'}</p>
      {availability.event?.location && <p><strong>Lieu :</strong> {availability.event.location}</p>}
      {availability.event?.type === 'Match' && availability.event?.opponent && <p><strong>Adversaire :</strong> {availability.event.opponent}</p>}
      <hr />
      <h4>Votre statut :</h4>
      <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
        {(['Présent', 'Absent', 'Indécis'] as const).map(statusOption => (
          <button 
            key={statusOption}
            onClick={() => setNewStatus(statusOption)}
            style={{
              padding: '10px 15px',
              border: newStatus === statusOption ? '2px solid #007bff' : '2px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer',
              backgroundColor: newStatus === statusOption ? 'lightblue' : 'white',
              fontSize: '1em'
            }}
          >
            {statusOption}
          </button>
        ))}
      </div>

      <div>
        <label htmlFor="notes" style={{display: 'block', marginBottom: '5px'}}>Note (optionnel) :</label>
        <textarea
          id="notes"
          value={newNotes}
          onChange={(e) => setNewNotes(e.target.value)}
          rows={3}
          placeholder="Ex: J'arriverai 15min en retard."
          style={{ width: 'calc(100% - 20px)', padding: '8px' }}
        />
      </div>

      <button onClick={handleSave} disabled={isSaving || !newStatus} style={{marginTop: '20px', padding: '12px 20px', fontSize: '1.1em', width: '100%'}}>
        {isSaving ? 'Enregistrement...' : 'Enregistrer mon statut'}
      </button>

      {isSaved && <p style={{color: 'green', marginTop: '10px', textAlign: 'center'}}>Votre statut a bien été enregistré. Merci !</p>}
    </div>
  );
}

export default SetAvailabilityPage;