import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { EventForm } from './EventForm';
import { EventPlayerAvailability } from './EventPlayerAvailability';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical, CalendarPlus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- Définition des types ---
interface Player { id: string; name: string; }
interface Availability { id: string; player_id: string; status: 'Présent' | 'Absent' | 'Indécis'; }
interface Event {
  id: string; type: string; event_date: string;
  location?: string | null; opponent?: string | null; details?: string | null;
  player_availabilities: Availability[]; // Chaque événement contiendra ses disponibilités
}
interface EventManagerProps { selectedTeamId: string | null; }

function EventManager({ selectedTeamId }: EventManagerProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]); // Liste des joueurs de l'équipe
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
  const { toast } = useToast();

  async function fetchData() {
    if (!selectedTeamId) return;
    setLoading(true);

    // Récupérer en parallèle les joueurs de l'équipe ET les événements avec leurs disponibilités
    const [playersResponse, eventsResponse] = await Promise.all([
      supabase.from('players').select('id, name').eq('team_id', selectedTeamId),
      supabase.from('events').select('*, player_availabilities(*)').eq('team_id', selectedTeamId).order('event_date', { ascending: true })
    ]);

    const { data: playersData, error: playersError } = playersResponse;
    const { data: eventsData, error: eventsError } = eventsResponse;

    if (playersError || eventsError) {
      setError(playersError?.message || eventsError?.message || "Une erreur est survenue.");
    } else {
      setTeamPlayers((playersData as Player[]) || []);
      setEvents((eventsData as Event[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, [selectedTeamId]);

  const handleFormSubmit = () => { setIsModalOpen(false); fetchData(); };
  const handleOpenAddModal = () => { setEventToEdit(null); setIsModalOpen(true); };
  const handleOpenEditModal = (event: Event) => { setEventToEdit(event); setIsModalOpen(true); };

  async function handleDeleteEvent(eventId: string) {
    if (!window.confirm("Supprimer cet événement ?")) return;
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Succès", description: "Événement supprimé." }); fetchData(); }
  }

  if (!selectedTeamId) return null;
  if (loading) return <p>Chargement des événements...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Événements</h3>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild><Button onClick={handleOpenAddModal}><CalendarPlus className="mr-2 h-4 w-4" /> Créer un Événement</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>{eventToEdit ? "Modifier l'événement" : "Créer un nouvel événement"}</DialogTitle></DialogHeader>
            <EventForm teamId={selectedTeamId} eventToEdit={eventToEdit} onFormSubmit={handleFormSubmit} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {events.length > 0 ? (
          events.map((event) => (
            <Card key={event.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{event.type === 'Match' ? `Match vs ${event.opponent || 'N/A'}` : 'Entraînement'}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenEditModal(event)}>Modifier</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteEvent(event.id)} className="text-red-600">Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
                <CardDescription>{new Date(event.event_date).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' })}</CardDescription>
              </CardHeader>
              <CardContent>
                {event.location && <p><strong>Lieu :</strong> {event.location}</p>}
                {event.details && <p className="text-sm text-gray-600 mt-2"><strong>Détails :</strong> {event.details}</p>}

                <Accordion type="single" collapsible className="w-full mt-4">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Gérer les Disponibilités</AccordionTrigger>
                    <AccordionContent>
                      {teamPlayers.length > 0 ? teamPlayers.map(player => {
                        const availability = event.player_availabilities.find(avail => avail.player_id === player.id);
                        return (
                          <EventPlayerAvailability 
                            key={player.id} 
                            player={player} 
                            eventId={event.id}
                            initialAvailability={availability} 
                          />
                        );
                      }) : <p className="text-sm text-gray-500">Aucun joueur dans cette équipe.</p>}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

              </CardContent>
            </Card>
          ))
        ) : ( <p className="text-center text-gray-500 mt-8">Aucun événement programmé.</p> )}
      </div>
    </div>
  );
}

export default EventManager;