import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Un meilleur composant pour les descriptions
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  type: z.enum(["Match", "Entraînement"], { required_error: "Le type d'événement est requis." }),
  event_date: z.string().min(1, { message: "La date est requise." }),
  location: z.string().optional(),
  opponent: z.string().optional(),
  details: z.string().optional(),
});

interface EventData {
    id: string;
    type: string;
    event_date: string;
    location?: string | null;
    opponent?: string | null;
    details?: string | null;
}

interface EventFormProps {
  teamId: string;
  eventToEdit?: EventData | null;
  onFormSubmit: () => void;
}

export function EventForm({ teamId, eventToEdit, onFormSubmit }: EventFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditMode = !!eventToEdit;

  const formatDateTimeForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    // Soustrait le décalage horaire pour afficher l'heure locale correcte
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: (eventToEdit?.type as "Match" | "Entraînement") || "Entraînement",
      event_date: eventToEdit ? formatDateTimeForInput(eventToEdit.event_date) : "",
      location: eventToEdit?.location || "",
      opponent: eventToEdit?.opponent || "",
      details: eventToEdit?.details || "",
    },
  });

  const eventType = form.watch("type");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    const eventData = {
        type: values.type,
        event_date: new Date(values.event_date).toISOString(),
        location: values.location || null,
        opponent: values.type === 'Match' ? values.opponent || null : null,
        details: values.details || null,
        team_id: teamId,
        user_id: user.id, // L'auteur de l'action
    };

    let error;
    if (isEditMode) {
      const { error: updateError } = await supabase
        .from('events').update(eventData).eq('id', eventToEdit!.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('events').insert(eventData);
      error = insertError;
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: `Événement ${isEditMode ? 'mis à jour' : 'créé'}.` });
      onFormSubmit();
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type d'événement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez un type" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Entraînement">Entraînement</SelectItem>
                  <SelectItem value="Match">Match</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="event_date" render={({ field }) => (
            <FormItem>
              <FormLabel>Date et Heure</FormLabel>
              <FormControl><Input type="datetime-local" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
        <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem>
              <FormLabel>Lieu</FormLabel>
              <FormControl><Input placeholder="Stade Municipal" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
        {eventType === 'Match' && (
          <FormField control={form.control} name="opponent" render={({ field }) => (
              <FormItem>
                <FormLabel>Adversaire</FormLabel>
                <FormControl><Input placeholder="Nom de l'équipe adverse" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
          )}/>
        )}
        <FormField control={form.control} name="details" render={({ field }) => (
            <FormItem>
              <FormLabel>Détails supplémentaires</FormLabel>
              <FormControl><Textarea placeholder="Heure de RDV, notes..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting 
            ? (isEditMode ? "Mise à jour..." : "Création...") 
            : (isEditMode ? "Mettre à Jour" : "Créer l'Événement")}
        </Button>
      </form>
    </Form>
  );
}