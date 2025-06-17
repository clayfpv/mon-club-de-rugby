import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Import des composants de gestion
import PlayerList from '../components/PlayerList';
import EventManager from '../components/EventManager';
import PostList from '../components/PostList';

// Import des composants Shadcn/ui
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

interface TeamDetails {
  id: string;
  name: string;
}

function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>(); 
  const [team, setTeam] = useState<TeamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTeamDetails() {
      if (!teamId) {
        setError("Aucun ID d'équipe fourni.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('id', teamId)
        .single();

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setTeam(data as TeamDetails);
      }
      setLoading(false);
    }

    fetchTeamDetails();
  }, [teamId]);

  if (loading) return <div>Chargement de l'équipe...</div>;
  if (error) return <div className="text-red-600">Erreur: {error}</div>;
  if (!team) return <div>Équipe non trouvée.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link to="/equipes" className="p-2 rounded-md hover:bg-gray-200">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Équipe : {team.name}</h1>
      </div>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="players">Effectif</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="posts">Actualités</TabsTrigger>
        </TabsList>
        
        <TabsContent value="players" className="mt-4">
          {/* CORRECTION ICI */}
          <PlayerList selectedTeamId={teamId || null} />
        </TabsContent>
        
        <TabsContent value="events" className="mt-4">
          {/* CORRECTION ICI */}
          <EventManager selectedTeamId={teamId || null} />
        </TabsContent>
        
        <TabsContent value="posts" className="mt-4">
          {/* CORRECTION ICI (en supposant que PostList attend 'teamId') */}
          <PostList teamId={teamId || null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TeamDetailPage;