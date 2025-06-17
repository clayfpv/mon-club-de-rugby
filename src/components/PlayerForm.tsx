import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // On va l'ajouter
import { supabase } from '../supabaseClient';
import { RUGBY_POSITIONS } from "@/lib/constants";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

// Schéma de validation avec Zod
const formSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Adresse email invalide." }).optional().or(z.literal('')),
  positions: z.array(z.string()).optional(), // C'est maintenant un tableau
  license_status: z.string().optional(),
});

interface Player {
  id: string; name: string; email: string | null;
  positions?: string[] | null; license_status?: string | null; team_id: string;
}

interface PlayerFormProps {
  teamId: string; playerToEdit?: Player | null; onFormSubmit: () => void;
}

export function PlayerForm({ teamId, playerToEdit, onFormSubmit }: PlayerFormProps) {
  const isEditMode = !!playerToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: playerToEdit?.name || "",
      email: playerToEdit?.email || "",
      positions: playerToEdit?.positions || [], // Le défaut est un tableau vide
      license_status: playerToEdit?.license_status || "En attente",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // La conversion en tableau n'est plus nécessaire ! 'values.positions' est déjà un tableau.
    const playerData = {
      name: values.name,
      email: values.email || null,
      positions: values.positions, // On passe directement le tableau
      license_status: values.license_status,
      team_id: teamId,
    };

    let error;
    if (isEditMode) {
      // Mode UPDATE
      const { error: updateError } = await supabase
        .from('players').update(playerData).eq('id', playerToEdit!.id);
      error = updateError;
    } else {
      // Mode INSERT
      const { error: insertError } = await supabase
        .from('players').insert(playerData);
      error = insertError;
    }

    if (error) {
      alert(`Erreur: ${error.message}`);
    } else {
      onFormSubmit(); // Succès, on notifie le parent
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom du joueur</FormLabel>
              <FormControl>
                <Input placeholder="Jean Dupont" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (pour l'invitation)</FormLabel>
              <FormControl>
                <Input placeholder="joueur@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="positions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poste(s)</FormLabel>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className="w-full justify-between">
                      <span>{field.value?.length ? field.value.join(', ') : "Sélectionner un ou plusieurs postes"}</span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                  {RUGBY_POSITIONS.map((position) => (
                    <DropdownMenuCheckboxItem
                      key={position}
                      checked={field.value?.includes(position)}
                      onCheckedChange={(checked) => {
                        const currentValue = field.value || [];
                        if (checked) {
                          field.onChange([...currentValue, position]);
                        } else {
                          field.onChange(currentValue.filter(p => p !== position));
                        }
                      }}
                    >
                      {position}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* On va ajouter le statut de la licence avec un <Select> */}
        {/* ... pour l'instant on se concentre sur ces champs */}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </form>
    </Form>
  );
}