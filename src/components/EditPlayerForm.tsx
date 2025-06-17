import { useState, useEffect } from 'react'; // AJOUT: ChangeEvent
import type { FormEvent, ChangeEvent } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext'; // AJOUT: Pour user.id dans le chemin du fichier

interface Player {
  id: string;
  name: string;
  positions?: string[] | null;
  license_status?: string | null;
  team_id: string;
  photo_url?: string | null; // AJOUT: Pour la photo
}

interface EditPlayerFormProps {
  playerToEdit: Player;
  onPlayerUpdated: () => void;
  onCancel: () => void;
}

function EditPlayerForm({ playerToEdit, onPlayerUpdated, onCancel }: EditPlayerFormProps) {
  const { user } = useAuth(); // AJOUT: Pour l'user ID
  const [playerName, setPlayerName] = useState(playerToEdit.name);
  const [playerPosition, setPlayerPosition] = useState(playerToEdit.positions?.join(', ') || '');
  const [licenseStatus, setLicenseStatus] = useState(playerToEdit.license_status || 'En attente');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // AJOUT: Pour le fichier image
  const [uploading, setUploading] = useState(false); // AJOUT: État de téléversement

  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlayerName(playerToEdit.name);
    setPlayerPosition(playerToEdit.positions?.join(', ') || '');
    setLicenseStatus(playerToEdit.license_status || 'En attente');
    setSelectedFile(null); // Réinitialiser le fichier sélectionné
  }, [playerToEdit]);

  // AJOUT: Gérer la sélection du fichier
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!playerName.trim() || !user) { // Vérifier l'utilisateur
      setError("Le nom du joueur est requis.");
      return;
    }

    setIsUpdating(true);
    setError(null);

    let newPhotoUrl = playerToEdit.photo_url; // Garder l'ancienne URL par défaut

    // Si un nouveau fichier est sélectionné, on le téléverse
    if (selectedFile) {
      setUploading(true);
      // Créer un nom de fichier unique pour éviter les conflits
      const fileExtension = selectedFile.name.split('.').pop();
      if (!user) { 
          setError("Utilisateur non authentifié, impossible de téléverser.");
          setUploading(false);
          setIsUpdating(false);
          return;
      }
    const fileName = `${playerToEdit.id}-${Date.now()}.${fileExtension}`;
    // LE CHEMIN EST CONSTRUIT COMME : "USER_ID/FILENAME.EXT"
    const filePath = 'test-public-upload.png'; // Chemin le plus simple possible
    console.log("Tentative d'upload vers:", filePath);
    console.log("Fichier sélectionné:", selectedFile); 

    if (!selectedFile) {
        setError("Aucun fichier sélectionné.");
        setIsUpdating(false);
        setUploading(false);
        return;
    }

      const { error: uploadError } = await supabase.storage
        .from('player-photos') // Nom de votre bucket
        .upload(filePath, selectedFile, {
          cacheControl: '3600', // Optionnel: mise en cache
          upsert: true, // Remplacer le fichier s'il existe déjà au même chemin
        });
      
      setUploading(false);
      if (uploadError) {
        console.error("Erreur de téléversement de la photo:", uploadError);
        setError(`Erreur photo: ${uploadError.message}`);
        setIsUpdating(false);
        return;
      }
      // Obtenir l'URL publique du fichier téléversé
      const { data: urlData } = supabase.storage
        .from('player-photos')
        .getPublicUrl(filePath);
      newPhotoUrl = urlData?.publicUrl || null;
    }

    const positionsArray = playerPosition.trim() ? playerPosition.split(',').map(p => p.trim()).filter(p => p) : null;

    const { error: updateError } = await supabase
      .from('players')
      .update({
        name: playerName.trim(),
        positions: positionsArray,
        license_status: licenseStatus,
        photo_url: newPhotoUrl, // AJOUT: Mettre à jour l'URL de la photo
      })
      .eq('id', playerToEdit.id);

    if (updateError) {
      console.error("Erreur de mise à jour du joueur:", updateError);
      setError(updateError.message);
    } else {
      onPlayerUpdated();
    }
    setIsUpdating(false);
  }

  return (
    <div style={{ border: '1px solid #007bff', padding: '15px', marginTop: '15px', borderRadius: '5px', backgroundColor: '#f0f8ff' }}>
      <h4>Modifier le Joueur : {playerToEdit.name}</h4>
      {/* AJOUT: Affichage de la photo actuelle */}
      {playerToEdit.photo_url && !selectedFile && (
        <img src={playerToEdit.photo_url} alt={playerToEdit.name} style={{maxWidth: '100px', maxHeight: '100px', marginBottom: '10px', display:'block'}} />
      )}
      {selectedFile && (
         <p style={{fontSize: '0.9em', color: 'green'}}>Nouvelle photo sélectionnée: {selectedFile.name}</p>
      )}

      <form onSubmit={handleSubmit}>
        {/* ... (champs nom, postes, licence inchangés) ... */}
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="editPlayerName" style={{ display: 'block', marginBottom: '5px' }}>Nom du joueur :</label>
          <input id="editPlayerName" type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} required style={{ padding: '8px', width: 'calc(100% - 16px)' }}/>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="editPlayerPosition" style={{ display: 'block', marginBottom: '5px' }}>Poste(s) (séparés par une virgule) :</label>
          <input id="editPlayerPosition" type="text" value={playerPosition} onChange={(e) => setPlayerPosition(e.target.value)} style={{ padding: '8px', width: 'calc(100% - 16px)' }}/>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="editLicenseStatus" style={{ display: 'block', marginBottom: '5px' }}>Statut Licence :</label>
          <select id="editLicenseStatus" value={licenseStatus} onChange={(e) => setLicenseStatus(e.target.value)} style={{ padding: '8px', width: '100%' }}>
            <option value="En attente">En attente</option>
            <option value="Validée">Validée</option>
            <option value="Refusée">Refusée</option>
            <option value="Expirée">Expirée</option>
          </select>
        </div>

        {/* AJOUT: Champ pour téléverser la photo */}
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="playerPhoto" style={{ display: 'block', marginBottom: '5px' }}>Photo du joueur :</label>
          <input 
            type="file" 
            id="playerPhoto" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleFileChange} 
          />
        </div>

        {uploading && <p>Téléversement de la photo...</p>}
        {error && <p style={{ color: 'red' }}>Erreur: {error}</p>}
        <div style={{ marginTop: '10px' }}>
          <button type="submit" disabled={isUpdating || uploading} style={{ padding: '8px 12px', marginRight: '10px' }}>
            {isUpdating ? 'Mise à jour...' : 'Mettre à Jour'}
          </button>
          <button type="button" onClick={onCancel} style={{ padding: '8px 12px' }}>
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditPlayerForm;