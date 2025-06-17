import { useState } from 'react';
import type {FormEvent} from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext'; // Au cas où on en aurait besoin plus tard

interface AddPlayerFormProps {
  teamId: string; // L'ID de l'équipe à laquelle ajouter le joueur
  onPlayerAdded: () => void; // Fonction pour rafraîchir la liste des joueurs après ajout
  onCancel: () => void; // Fonction pour fermer le formulaire
}

function AddPlayerForm({ teamId, onPlayerAdded, onCancel }: AddPlayerFormProps) {
  const { user } = useAuth(); // On récupère l'utilisateur au cas où
  const [playerName, setPlayerName] = useState('');
  const [playerPosition, setPlayerPosition] = useState(''); // Pour les postes
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!playerName.trim() || !user) {
      setError("Le nom du joueur est requis.");
      return;
    }

    setIsAdding(true);
    setError(null);

    const positionsArray = playerPosition.trim() ? playerPosition.split(',').map(p => p.trim()).filter(p => p) : null;

    const { error: insertError } = await supabase
      .from('players')
      .insert({
        name: playerName.trim(),
        team_id: teamId,
        positions: positionsArray,
        // license_status aura sa valeur par défaut depuis la DB si on ne le spécifie pas
      });

    if (insertError) {
      console.error("Erreur d'insertion du joueur:", insertError);
      setError(insertError.message);
    } else {
      setPlayerName('');
      setPlayerPosition('');
      onPlayerAdded(); // Signaler que le joueur a été ajouté (pour rafraîchir la liste)
    }
    setIsAdding(false);
  }

  return (
    <div style={{ border: '1px solid #ddd', padding: '15px', marginTop: '15px', borderRadius: '5px' }}>
      <h4>Ajouter un Nouveau Joueur à cette Équipe</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="playerName" style={{ display: 'block', marginBottom: '5px' }}>Nom du joueur :</label>
          <input
            id="playerName"
            type="text"
            placeholder="Nom complet"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            required
            style={{ padding: '8px', width: 'calc(100% - 16px)' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="playerPosition" style={{ display: 'block', marginBottom: '5px' }}>Poste(s) (séparés par une virgule) :</label>
          <input
            id="playerPosition"
            type="text"
            placeholder="Pilier, Talonneur"
            value={playerPosition}
            onChange={(e) => setPlayerPosition(e.target.value)}
            style={{ padding: '8px', width: 'calc(100% - 16px)' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>Erreur: {error}</p>}
        <div style={{ marginTop: '10px' }}>
          <button type="submit" disabled={isAdding} style={{ padding: '8px 12px', marginRight: '10px' }}>
            {isAdding ? 'Ajout...' : 'Ajouter Joueur'}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: '8px 12px' }}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddPlayerForm;