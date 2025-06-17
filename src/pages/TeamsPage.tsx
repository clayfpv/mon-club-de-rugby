import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';
// AJOUT: Import des nouveaux composants UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Interfaces (inchangées)
interface Team {
  id: string;
  name: string;
  club_id: string;
}
interface Profile {
  id: string;
  club_id: string;
}

function TeamsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Les fonctions de récupération de données et de logique restent les mêmes
  async function fetchTeamsData() {
    // ... (votre fonction fetchTeamsData existante, inchangée)
    if (!user) return;
    setLoading(true);
    setError(null);
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('club_id').eq('id', user.id).single();
    if (profileError || !profileData || !profileData.club_id) {
      setError("Impossible de charger le profil ou le club associé.");
      setLoading(false);
      return;
    }
    setProfile(profileData as Profile);
    const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*').eq('club_id', profileData.club_id).order('name', { ascending: true });
    if (teamsError) { setError(teamsError.message); } 
    else { setTeams(teamsData as Team[]); }
    setLoading(false);
  }

  useEffect(() => { fetchTeamsData(); }, [user]);

  async function handleAddTeam(event: FormEvent) {
    event.preventDefault();
    if (!teamName.trim() || !profile) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('teams').insert({ name: teamName.trim(), club_id: profile.club_id });
    if (error) { alert(error.message); } 
    else { setTeamName(''); await fetchTeamsData(); }
    setIsSubmitting(false);
  }

  async function handleEditTeam(team: Team) {
    const newName = prompt("Nouveau nom de l'équipe :", team.name); // On gardera prompt pour l'instant
    if (newName && newName.trim() && newName.trim() !== team.name) {
      setIsSubmitting(true);
      await supabase.from('teams').update({ name: newName.trim() }).eq('id', team.id);
      await fetchTeamsData();
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTeam(teamId: string) {
    if (window.confirm("Supprimer cette équipe ? Tous ses joueurs, événements et posts seront aussi supprimés !")) {
      setIsSubmitting(true);
      await supabase.from('teams').delete().eq('id', teamId);
      await fetchTeamsData();
      setIsSubmitting(false);
    }
  }

  if (loading) return <div>Chargement de la liste des équipes...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestion des Équipes</h1>
        <p className="text-gray-500 mt-1">Créez et gérez ici les différentes équipes de votre club.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter une nouvelle équipe</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddTeam} className="flex items-center gap-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="teamName">Nom de l'équipe</Label>
              <Input
                type="text"
                id="teamName"
                placeholder="Ex: Seniors A, U18, Loisirs..."
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="self-end">
              {isSubmitting ? 'Ajout...' : 'Ajouter Équipe'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes Équipes ({teams.length})</CardTitle>
          <CardDescription>Cliquez sur le nom d'une équipe pour la gérer en détail.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {teams.map((team) => (
              <li 
                key={team.id}
                className="p-4 border rounded-md flex justify-between items-center hover:bg-gray-50"
              >
                <Link to={`/equipes/${team.id}`} className="font-bold text-lg text-blue-600 hover:underline">
                  {team.name}
                </Link>
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditTeam(team)} disabled={isSubmitting}>Modifier</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteTeam(team.id)} disabled={isSubmitting}>Supprimer</Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

    </div>
  );
}

export default TeamsPage;