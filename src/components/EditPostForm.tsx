import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext'; // Pour s'assurer que l'utilisateur est bien l'auteur

// Réutiliser l'interface Post si elle est exportée ou la redéfinir au besoin
interface PostData { // Un type pour les données modifiables du post
  id: string;
  title?: string | null;
  content: string;
  type?: string | null;
  // team_id et user_id ne sont généralement pas modifiés ici
}

interface EditPostFormProps {
  postToEdit: PostData;
  onPostUpdated: () => void; // Pour rafraîchir la liste
  onCancel: () => void;      // Pour fermer le formulaire
}

function EditPostForm({ postToEdit, onPostUpdated, onCancel }: EditPostFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(postToEdit.title || '');
  const [content, setContent] = useState(postToEdit.content);
  const [postType, setPostType] = useState(postToEdit.type || 'Annonce');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(postToEdit.title || '');
    setContent(postToEdit.content);
    setPostType(postToEdit.type || 'Annonce');
  }, [postToEdit]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim() || !user) {
      setError("Le contenu du post est requis.");
      return;
    }

    setIsUpdating(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        title: title.trim() || null,
        content: content.trim(),
        type: postType,
      })
      .eq('id', postToEdit.id)
      .eq('user_id', user.id); // Sécurité supplémentaire côté client

    if (updateError) {
      console.error("Erreur de mise à jour du post:", updateError);
      setError(updateError.message);
    } else {
      onPostUpdated(); // Signaler que le post a été mis à jour
    }
    setIsUpdating(false);
  }

  return (
    <div style={{ border: '1px solid #ffc107', padding: '15px', marginTop: '15px', borderRadius: '5px', backgroundColor: '#fff8e1' }}>
      <h4>Modifier le Post</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="editPostTitle" style={{ display: 'block', marginBottom: '5px' }}>Titre (optionnel) :</label>
          <input
            id="editPostTitle"
            type="text"
            placeholder="Titre du post"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: '8px', width: 'calc(100% - 16px)' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="editPostType" style={{ display: 'block', marginBottom: '5px' }}>Type de post :</label>
          <select 
            id="editPostType" 
            value={postType} 
            onChange={(e) => setPostType(e.target.value)}
            style={{ padding: '8px', width: '100%' }}
          >
            <option value="Annonce">Annonce</option>
            <option value="Composition Équipe">Composition Équipe</option>
            <option value="Résultat Match">Résultat Match</option>
            <option value="Info Entraînement">Info Entraînement</option>
            <option value="Autre">Autre</option>
          </select>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="editPostContent" style={{ display: 'block', marginBottom: '5px' }}>Contenu :</label>
          <textarea
            id="editPostContent"
            placeholder="Écrivez votre message ici..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            required
            style={{ padding: '8px', width: 'calc(100% - 16px)' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>Erreur: {error}</p>}
        <div style={{ marginTop: '10px' }}>
          <button type="submit" disabled={isUpdating} style={{ padding: '8px 12px', marginRight: '10px' }}>
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

export default EditPostForm;