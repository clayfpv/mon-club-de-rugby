import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function AuthForm() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte avec votre email et votre mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          // --- CORRECTION ICI ---
          // On passe un tableau vide pour n'avoir aucun fournisseur social.
          // Le formulaire email/mot de passe est affiché par défaut.
          providers={[]} 
          localization={{
            variables: {
              sign_in: { 
                email_label: 'Adresse email', 
                password_label: 'Mot de passe',
                button_label: 'Se connecter',
                link_text: 'Déjà un compte ? Connectez-vous'
              },
              sign_up: {
                email_label: 'Adresse email', 
                password_label: 'Mot de passe',
                button_label: 'S\'inscrire',
                link_text: 'Pas encore de compte ? Inscrivez-vous'
              },
              forgotten_password: {
                email_label: 'Adresse email',
                button_label: 'Envoyer les instructions',
                link_text: 'Mot de passe oublié ?'
              }
            },
          }}
        />
      </CardContent>
      <CardFooter>
        <p className="text-xs text-center text-gray-500 w-full">
          Pas encore de club ?{' '}
          <Link to="/signup" className="underline hover:text-blue-600">
            Créez le vôtre
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default AuthForm;