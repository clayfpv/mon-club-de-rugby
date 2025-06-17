import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, { message: "Le contenu ne peut pas être vide." }),
  type: z.string().optional(),
});

interface Post {
    id: string;
    title?: string | null;
    content: string;
    type?: string | null;
}

interface PostFormProps {
  teamId: string | null; // L'équipe à laquelle le post est lié (pour la création)
  clubId: string; // Le club auquel le post est lié
  postToEdit?: Post | null; // Le post à modifier
  onFormSubmit: () => void; // Callback après succès
}

export function PostForm({ teamId, clubId, postToEdit, onFormSubmit }: PostFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditMode = !!postToEdit;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // On pré-remplit le formulaire avec les données du post si on est en mode édition
    defaultValues: {
      title: postToEdit?.title || "",
      content: postToEdit?.content || "",
      type: postToEdit?.type || "Annonce",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;

    const postData = {
      title: values.title || null,
      content: values.content,
      type: values.type,
      // Uniquement pour la création, on définit les liens
      user_id: user.id,
      club_id: clubId,
      team_id: teamId,
    };

    let error;
    if (isEditMode) {
      // Mode UPDATE: on ne met à jour que certains champs
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          title: values.title || null,
          content: values.content,
          type: values.type,
        })
        .eq('id', postToEdit!.id);
      error = updateError;
    } else {
      // Mode INSERT
      const { error: insertError } = await supabase
        .from('posts').insert(postData);
      error = insertError;
    }

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: `Post ${isEditMode ? 'mis à jour' : 'publié'}.` });
      onFormSubmit();
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Titre (optionnel)</FormLabel>
              <FormControl><Input placeholder="Composition pour le match de dimanche" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
         <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Catégorie</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger><SelectValue placeholder="Sélectionnez un type" /></SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Annonce">Annonce</SelectItem>
                  <SelectItem value="Composition Équipe">Composition Équipe</SelectItem>
                  <SelectItem value="Résultat Match">Résultat Match</SelectItem>
                  <SelectItem value="Info Entraînement">Info Entraînement</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
        )}/>
        <FormField control={form.control} name="content" render={({ field }) => (
            <FormItem>
              <FormLabel>Contenu du post</FormLabel>
              <FormControl><Textarea placeholder="Écrivez votre message ici..." className="resize-y" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
        )}/>
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Publication..." : "Publier"}
        </Button>
      </form>
    </Form>
  );
}