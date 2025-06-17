import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import PlayerList from './PlayerList';
import EventManager from './EventManager';
import PostList from './PostList';
import { PostForm } from './PostForm';

interface Team {
  id: string;
  name: string;
  club_id: string; // La team a maintenant un club_id
}

interface Profile {
    id: string;
    club_id: string;
    role: string;
}

function TeamManager() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  // ... autres états pour l'UI que vous pouvez garder : addingTeam, editingTeamId, showAddPostForm ...

  useEffect(() => {
    async function fetchInitialData() {
      if (!user) return;

      setLoading(true);
      setError(null);

      // 1. Récupérer le profil de l'utilisateur pour connaître son club_id et son rôle
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, club_id, role')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        setError("Impossible de charger votre profil. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }
      setProfile(profileData);
      const clubId = profileData.club_id;

      // 2. Récupérer les équipes qui appartiennent à ce club
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('club_id', clubId);

      if (teamsError) {
        setError(teamsError.message);
      } else {
        setTeams(teamsData as Team[]);
      }
      setLoading(false);
    }

    fetchInitialData();
  }, [user]);

  // Fonction pour ajouter une équipe au club du coach
  async function handleAddTeam(event: FormEvent) {
    event.preventDefault();
    if (!teamName.trim() || !profile) return;

    const { error: insertError } = await supabase
      .from('teams')
      .insert({ name: teamName.trim(), club_id: profile.club_id }); // On insère avec le club_id

    if (insertError) {
      alert(insertError.message);
    } else {
      // Re-fetcher les données initiales pour mettre à jour la liste des équipes
      const { data: teamsData } = await supabase.from('teams').select('*').eq('club_id', profile.club_id);
      if (teamsData) setTeams(teamsData as Team[]);
      setTeamName('');
    }
  }

  // Le reste de la logique (edit team, delete team, etc.) devra être adapté de la même manière
  // pour utiliser le club_id dans les requêtes si nécessaire.

  if (loading) return <p>Chargement des données du club...</p>;
  if (error) return <p style={{ color: 'red' }}>Erreur: {error}</p>;

  return (
    <div style={{ padding: '20px' }}>
        <h2>Gestion de votre Club</h2>
        <p>Bienvenue sur le tableau de bord de votre club.</p>
        <hr style={{margin: '20px 0'}} />
        {/* ... Intégration de la logique de TeamManager que nous avions avant ... */}
        {/* Pour l'instant, nous affichons juste les équipes */}
        <h3>Équipes du Club</h3>
        <form onSubmit={handleAddTeam} style={{ margin: '20px 0' }}>
            <input
              type="text"
              placeholder="Nom de la nouvelle équipe"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
              style={{ marginRight: '10px', padding: '8px' }}
            />
            <button type="submit" style={{ padding: '8px 12px' }}>
              Ajouter Équipe
            </button>
        </form>
        <ul>
            {teams.map(team => (
                <li key={team.id}>{team.name}</li>
            ))}
        </ul>

        {/* Ici nous ré-intégrerons la logique de sélection d'équipe et d'affichage 
            des joueurs, événements, et posts */}
    </div>
  );
}

export default TeamManager;