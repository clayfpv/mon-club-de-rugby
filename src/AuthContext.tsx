import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js'; // AJOUT: AuthChangeEvent
import { supabase } from './supabaseClient';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  authEvent: AuthChangeEvent | null; // AJOUT: Pour connaître le type d'événement
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps { children: ReactNode; }

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [authEvent, setAuthEvent] = useState<AuthChangeEvent | null>(null); // AJOUT

  useEffect(() => {
    async function getInitialData() {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      const currentUser = initialSession?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        setProfile(profileData);
      }
      setLoading(false);
    }
    getInitialData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log("Auth event:", event, currentSession); // Ligne de debug utile
        setAuthEvent(event); // AJOUT: On stocke l'événement
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        // Si l'utilisateur se déconnecte, on vide le profil
        if (event === 'SIGNED_OUT') {
          setProfile(null);
        } else if (event === 'USER_UPDATED' || (event === 'SIGNED_IN' && user?.id === currentSession?.user?.id)) {
            // Si l'utilisateur met à jour ses infos ou se reconnecte, on recharge le profil
            if (currentSession?.user) {
                supabase.from('profiles').select('*').eq('id', currentSession.user.id).single().then(({ data }) => setProfile(data));
            }
        }
      }
    );

    return () => { authListener.subscription.unsubscribe(); };
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };
  
  const value = { session, user, profile, loading, authEvent, signOut }; // AJOUT: authEvent

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
};