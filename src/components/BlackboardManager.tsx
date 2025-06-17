import { useEffect, useState } from 'react';
import { DndContext, useDroppable  } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { supabase } from '../supabaseClient';
import PlayerCard from './PlayerCard';
import PositionBox from './PositionBox';
import { useAuth } from '../AuthContext';
import { type Position } from './PositionBox';

interface Player {
  id: string;
  name: string;
  positions?: string[] | null;
}

type Composition = Record<string, string | null>;

interface BlackboardManagerProps {
  eventId: string;
  teamId: string;
  onClose: () => void;
}

function BlackboardManager({ eventId, teamId, onClose }: BlackboardManagerProps) {
  const { user } = useAuth();
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [availablePlayerIds, setAvailablePlayerIds] = useState<Set<string>>(new Set());
  const [composition, setComposition] = useState<Composition>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); // AJOUT : État pour le bouton de sauvegarde

  // On rend le composant Droppable pour la piscine des joueurs ici
  const { setNodeRef: playerPoolRef } = useDroppable({ id: 'player-pool' });

  const allPositions: Position[] = [
    // Première Ligne
    { name: 'Pilier Gauche', number: 1, type: 'starter', top: '15%', left: '32%' },
    { name: 'Talonneur', number: 2, type: 'starter', top: '15%', left: '50%' },
    { name: 'Pilier Droit', number: 3, type: 'starter', top: '15%', left: '67%' },
    // Deuxième Ligne
    { name: 'Deuxième Ligne 4', number: 4, type: 'starter', top: '27%', left: '38%' },
    { name: 'Deuxième Ligne 5', number: 5, type: 'starter', top: '27%', left: '62%' },
    // Troisième Ligne
    { name: 'Troisième Ligne Aile 6', number: 6, type: 'starter', top: '39%', left: '30%' },
    { name: 'Troisième Ligne Aile 7', number: 7, type: 'starter', top: '39%', left: '70%' },
    { name: 'Troisième Ligne Centre', number: 8, type: 'starter', top: '39%', left: '50%' },
    // Charnière
    { name: 'Demi de Mêlée', number: 9, type: 'starter', top: '53%', left: '38%' },
    { name: 'Demi d\'Ouverture', number: 10, type: 'starter', top: '55%', left: '60%' },
    // Trois-quarts
    { name: 'Ailier Gauche', number: 11, type: 'starter', top: '67%', left: '20%' },
    { name: 'Premier Centre', number: 12, type: 'starter', top: '69%', left: '40%' },
    { name: 'Second Centre', number: 13, type: 'starter', top: '69%', left: '60%' },
    { name: 'Ailier Droit', number: 14, type: 'starter', top: '67%', left: '80%' },
    // Arrière
    { name: 'Arrière', number: 15, type: 'starter', top: '82%', left: '50%' },
    // Remplaçants
    { name: 'Remplaçant', number: 16, type: 'sub' },
    { name: 'Remplaçant', number: 17, type: 'sub' },
    { name: 'Remplaçant', number: 18, type: 'sub' },
    { name: 'Remplaçant', number: 19, type: 'sub' },
    { name: 'Remplaçant', number: 20, type: 'sub' },
    { name: 'Remplaçant', number: 21, type: 'sub' },
    { name: 'Remplaçant', number: 22, type: 'sub' },
    { name: 'Remplaçant', number: 23, type: 'sub' },
  ];

  const startersPositions = allPositions.filter(p => p.type === 'starter');
  const subsPositions = allPositions.filter(p => p.type === 'sub');

  // La logique de récupération des données reste la même, elle charge déjà la composition existante.
  useEffect(() => {
    async function fetchEventData() {
      // ... (la fonction useEffect existante reste la même) ...
      setLoading(true);
      setError(null);
      const { data: playersData, error: playersError } = await supabase.from('players').select('id, name, positions').eq('team_id', teamId);
      if (playersError) { setError(playersError.message); setLoading(false); return; }
      if (playersData) setAllPlayers(playersData as Player[]);

      const { data: availabilitiesData, error: availError } = await supabase.from('player_availabilities').select('player_id, status').eq('event_id', eventId);
      if (availError) { setError(availError.message); setLoading(false); return; }
      if (availabilitiesData) setAvailablePlayerIds(new Set(availabilitiesData.filter(a => a.status === 'Présent').map(a => a.player_id)));

      const { data: eventData, error: eventError } = await supabase.from('events').select('composition').eq('id', eventId).single();
      if (eventError && eventError.code !== 'PGRST116') { // Ignorer l'erreur si la ligne n'est juste pas trouvée
        setError(eventError.message); 
        setLoading(false); 
        return; 
      }
      if (eventData?.composition) setComposition(eventData.composition as Composition);
      else setComposition({}); // S'assurer que la composition est vide si rien n'est sauvegardé

      setLoading(false);
    }
    fetchEventData();
  }, [eventId, teamId]);

  // La logique de Drag and Drop reste la même
  function handleDragEnd(event: DragEndEvent) {
    // ... (la fonction handleDragEnd existante reste la même) ...
    const { active, over } = event;
    if (!over) return;
    const draggedPlayerId = active.id as string;
    const targetPositionId = over.id as string;

    setComposition(prevComposition => {
      const newCompo = { ...prevComposition };
      const previousPositionId = Object.keys(newCompo).find(posId => newCompo[posId] === draggedPlayerId);
      if (previousPositionId) { newCompo[previousPositionId] = null; }
      
      const displacedPlayerId = newCompo[targetPositionId];
      newCompo[targetPositionId] = draggedPlayerId;
      if (displacedPlayerId && previousPositionId) { newCompo[previousPositionId] = displacedPlayerId; }
      
      return newCompo;
    });
  }

  // AJOUT : Fonction pour sauvegarder la composition
  async function handleSaveComposition() {
    if (!user) return; // Sécurité
    setIsSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from('events')
      .update({ composition: composition }) // On sauvegarde l'objet composition
      .eq('id', eventId)
      .eq('user_id', user.id); // La politique RLS le vérifie déjà, mais c'est une bonne double vérification

    if (updateError) {
      console.error("Erreur de sauvegarde de la composition:", updateError);
      setError(updateError.message);
      alert(`Erreur: ${updateError.message}`);
    } else {
      alert("Composition sauvegardée avec succès !");
    }
    setIsSaving(false);
  }

  // AJOUT : Fonction pour réinitialiser la composition
  function handleResetComposition() {
      if (window.confirm("Voulez-vous vraiment effacer toute la composition actuelle ?")) {
          setComposition({});
      }
  }

  const assignedPlayerIds = new Set(Object.values(composition).filter(Boolean));
  const unassignedPlayers = allPlayers
    .filter(p => availablePlayerIds.has(p.id) && !assignedPlayerIds.has(p.id))
    .sort((a, b) => {
        // Logique de tri simple : on compare le premier poste de chaque joueur
        const posA = a.positions?.[0] || 'zzz'; // Mettre 'zzz' pour que ceux sans poste aillent à la fin
        const posB = b.positions?.[0] || 'zzz';
        return posA.localeCompare(posB);
    });

  if (loading) return <p>Chargement des données du tableau noir...</p>;
  if (error) return <p style={{ color: 'red' }}>Erreur: {error}</p>;


  return (
  <DndContext onDragEnd={handleDragEnd}>
    <div className="p-4 border-2 border-gray-800 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-6"> {/* Marge en bas augmentée */}
        <h3 className="text-2xl font-bold">Tableau Noir / Composition d'Équipe</h3>
        <div>
            <button onClick={handleResetComposition} style={{marginRight: '10px', backgroundColor: 'gray', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px'}}>
              Réinitialiser
            </button>
            <button onClick={handleSaveComposition} disabled={isSaving} style={{backgroundColor: '#28a745', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px'}}>
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder la Composition'}
            </button>
            <button onClick={onClose} style={{marginLeft: '10px'}}>Fermer</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        
        {/* Colonne des joueurs disponibles (prend 1/6 de l'espace) */}
        <div className="lg:col-span-1 bg-gray-100 p-4 rounded-md h-fit">
          <h4 className="font-bold mb-2">Joueurs Disponibles ({unassignedPlayers.length})</h4>
          <div ref={playerPoolRef} className="space-y-2 min-h-[50px]">
            {unassignedPlayers.map(player => (
               <div key={player.id}>
                <PlayerCard player={player} />
                <p className="text-xs text-gray-500 italic ml-2">{player.positions?.join(', ') || 'N/D'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terrain de rugby (prend 4/6 de l'espace) */}
        <div className="lg:col-span-4 h-[80vh] bg-green-700 rounded-md relative overflow-hidden p-2">
          <img src="/field.jpg" alt="Terrain de rugby" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          {startersPositions.map(pos => (
            <PositionBox 
              key={pos.name + '-' + pos.number} 
              position={pos} 
              player={allPlayers.find(p => p.id === composition[pos.name + '-' + pos.number]) || null}
            />
          ))}
        </div>
        
        {/* Colonne des remplaçants (prend 1/6 de l'espace et s'aligne en hauteur) */}
        <div className="lg:col-span-1 bg-gray-200 p-4 rounded-md h-[80vh] overflow-y-auto">
            <h4 className="font-bold mb-2">Remplaçants</h4>
            <div className="space-y-3">
                {subsPositions.map(pos => (
                    <PositionBox 
                        key={pos.name + '-' + pos.number} 
                        position={pos} 
                        player={allPlayers.find(p => p.id === composition[pos.name + '-' + pos.number]) || null}
                    />
                ))}
            </div>
        </div>

      </div>
    </div>
  </DndContext>
)};

export default BlackboardManager;