import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';


interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null; // Pour stocker les infos de notre table 'profiles'
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cette fonction s'exécute une seule fois au chargement
    async function getInitialData() {
      setLoading(true);
      
      const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Erreur getSession:", sessionError);
        setLoading(false);
        return;
      }
      
      const currentUser = initialSession?.user ?? null;
      setSession(initialSession);
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        setProfile(profileData);
      }
      
      setLoading(false);
    }

    getInitialData();

    // L'écouteur est simple : il met à jour l'état quand l'auth change.
    // React s'occupera de re-rendre les composants nécessaires.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, changedSession) => {
        setSession(changedSession);
        setUser(changedSession?.user ?? null);
        // Re-fetcher le profil si l'utilisateur change
        if (changedSession?.user) {
          supabase.from('profiles').select('*').eq('id', changedSession.user.id).single().then(({ data }) => {
            setProfile(data);
          });
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // <-- Tableau de dépendances VIDE. Crucial pour ne s'exécuter qu'une fois.

  const signOut = async () => {
    await supabase.auth.signOut();
    // Le onAuthStateChange va s'occuper de mettre les états session/user/profile à null.
  };
  
  const value = { session, user, profile, loading, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};