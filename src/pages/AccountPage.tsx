import { useAuth } from '../AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form as ShadcnForm, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Schéma de validation pour le formulaire de mot de passe
const passwordFormSchema = z.object({
  password: z.string().min(8, { message: "Le mot de passe doit contenir au moins 8 caractères." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"], // L'erreur s'affichera sur le champ de confirmation
});

function AccountPage() {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  
  // États et logique pour le formulaire de profil
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
    }
  }, [profile]);

  const handleProfileUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setIsProfileSubmitting(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Succès", description: "Votre profil a été mis à jour." }); }
    setIsProfileSubmitting(false);
  };

  // Logique et formulaire pour le changement de mot de passe
  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function handlePasswordUpdate(values: z.infer<typeof passwordFormSchema>) {
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Succès", description: "Votre mot de passe a été modifié." });
      passwordForm.reset();
    }
  }

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mon Compte</h1>
        <p className="text-gray-500 mt-1">Gérez ici les informations de votre profil et vos paramètres de sécurité.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Ces informations sont visibles par les membres de votre club.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-sm">
            <div>
              <Label>Email</Label>
              <Input type="email" value={user?.email || ''} disabled />
              <p className="text-xs text-gray-500 mt-1">L'adresse email ne peut pas être modifiée ici.</p>
            </div>
            <div>
              <Label htmlFor="fullName">Nom complet</Label>
              <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <Button type="submit" disabled={isProfileSubmitting}>
              {isProfileSubmitting ? 'Mise à jour...' : 'Mettre à jour le profil'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      {/* AJOUT : Carte pour le changement de mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
          <CardDescription>Assurez-vous d'utiliser un mot de passe sécurisé.</CardDescription>
        </CardHeader>
        <CardContent>
          <ShadcnForm {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4 max-w-sm">
              <FormField
                control={passwordForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? 'Modification...' : 'Changer le mot de passe'}
              </Button>
            </form>
          </ShadcnForm>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccountPage;