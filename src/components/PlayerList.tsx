import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { PlayerForm } from './PlayerForm';

// Import des composants Shadcn/ui
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { MoreVertical, UserPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// Interface pour un joueur
interface Player {
  id: string; 
  name: string; 
  email: string | null; 
  positions?: string[] | null;
  license_status?: string | null; 
  team_id: string; 
  user_id: string | null;
}

interface PlayerListProps { 
  selectedTeamId: string | null; 
}

function PlayerList({ selectedTeamId }: PlayerListProps) {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Pour le feedback sur les boutons

  async function fetchPlayers() {
    if (!selectedTeamId) {
        setPlayers([]); // Vider la liste si aucune équipe n'est sélectionnée
        return;
    };
    setLoading(true);
    const { data, error } = await supabase.from('players').select('*').eq('team_id', selectedTeamId).order('name');
    if (error) { setError(error.message); } else if (data) { setPlayers(data); } // Le cast n'est plus nécessaire si l'interface est correcte
    setLoading(false);
  }

  useEffect(() => { fetchPlayers(); }, [selectedTeamId]);

  async function handleDeletePlayer(player: Player) {
    if (!window.confirm(`Supprimer ${player.name} ? Cette action est irréversible.`)) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('players').delete().eq('id', player.id);
    if (error) { 
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else { 
      toast({ title: "Succès", description: `${player.name} a été supprimé.` });
      fetchPlayers();
    }
    setIsSubmitting(false);
  }

  async function handleInvitePlayer(player: Player) {
    let playerEmail = player.email || prompt(`Entrez l'adresse email pour inviter "${player.name}" :`);
    if (!playerEmail || !/\S+@\S+\.\S+/.test(playerEmail)) { alert("Adresse email invalide."); return; }
    
    if (!window.confirm(`Envoyer une invitation à ${playerEmail} ?`)) return;
    setIsSubmitting(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('invite-player', { body: { email: playerEmail, playerId: player.id } });
      if (invokeError) throw invokeError;
      toast({ title: "Invitation envoyée", description: `Un email a été envoyé à ${playerEmail}.` });
      fetchPlayers();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleOpenAddModal = () => { setPlayerToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (player: Player) => { setPlayerToEdit(player); setIsModalOpen(true); };
  
  const handleFormSubmit = () => {
    setIsModalOpen(false);
    toast({ title: "Succès", description: `Données du joueur enregistrées.` });
    fetchPlayers();
  };

  if (loading) return <p>Chargement de l'effectif...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Effectif</h3>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddModal}><UserPlus className="mr-2 h-4 w-4"/>Ajouter un Joueur</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{playerToEdit ? "Modifier le joueur" : "Ajouter un nouveau joueur"}</DialogTitle>
            </DialogHeader>
            {/* On s'assure que teamId n'est pas null avant de rendre le formulaire */}
            {selectedTeamId && <PlayerForm teamId={selectedTeamId} playerToEdit={playerToEdit} onFormSubmit={handleFormSubmit}/>}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Postes</TableHead>
                <TableHead>Statut du Compte</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="text-gray-500">{player.positions?.join(', ') || '-'}</TableCell>
                  <TableCell>
                    {player.user_id ? (<span className="text-green-600 font-semibold">Actif</span>)
                     : player.email ? (<span className="text-orange-500">Invité</span>)
                     : (<span className="text-gray-500">Non Invité</span>)
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditModal(player)}>Modifier</DropdownMenuItem>
                        {!player.user_id && <DropdownMenuItem onClick={() => handleInvitePlayer(player)}>Inviter / Renvoyer</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => handleDeletePlayer(player)} className="text-red-600 focus:text-white focus:bg-red-600">Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {!loading && players.length === 0 && <p className="text-center text-gray-500 mt-4">Aucun joueur dans cette équipe. Cliquez sur "Ajouter un Joueur" pour commencer.</p>}
    </div>
  );
}

export default PlayerList;