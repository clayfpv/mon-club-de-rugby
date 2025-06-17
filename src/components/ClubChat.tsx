import { useEffect, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
// Import des composants Shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from '@/lib/utils';

// Interfaces pour nos données
interface Message {
  id: number;
  created_at: string;
  content: string;
  profile_id: string;
  profiles: {
    full_name?: string | null;
    // On pourrait ajouter une URL d'avatar ici si on gérait les photos de profil utilisateur
  } | null;
}

interface Profile {
  id: string;
  club_id: string;
}

function ClubChat() {
  const { user, profile } = useAuth(); // On a besoin du profil pour l'ID du club et l'ID du profil
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [channelId, setChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll vers le bas
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // Logique de récupération des données et de souscription (inchangée)
  useEffect(() => {
    if (!user || !profile?.club_id) return;

    async function initChat() {
      setLoading(true);
      const { data: channelData, error: channelError } = await supabase
        .from('channels').select('id').eq('club_id', profile.club_id).single();

      if (channelError || !channelData) {
        setError("Canal de discussion introuvable."); setLoading(false); return;
      }
      setChannelId(channelData.id);

      const { data: messagesData, error: messagesError } = await supabase
        .from('messages').select(`*, profiles(full_name)`).eq('channel_id', channelData.id).order('created_at').limit(100);

      if (messagesError) { setError(messagesError.message); } 
      else { setMessages((messagesData as Message[]) || []); }

      setLoading(false);
    }
    initChat();
  }, [user, profile]);

  useEffect(() => {
    if (!channelId) return;
    const subscription = supabase.channel(`public:messages:channel_id=eq.${channelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` },
        async (payload) => {
          const { data: profileData } = await supabase.from('profiles').select('full_name').eq('id', payload.new.profile_id).single();
          const newMessageWithProfile = { ...payload.new, profiles: profileData } as Message;
          setMessages(currentMessages => [...currentMessages, newMessageWithProfile]);
        }
      ).subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [channelId]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  async function handleSendMessage(event: FormEvent) {
    event.preventDefault();
    const content = newMessage.trim();
    if (content && profile && channelId) {
      setNewMessage('');
      await supabase.from('messages').insert({ content, profile_id: profile.id, channel_id: channelId });
    }
  }

  if (loading) return <Card><CardHeader><CardTitle>Chargement du tchat...</CardTitle></CardHeader></Card>;
  if (error) return <Card><CardHeader><CardTitle className="text-red-500">Erreur du tchat</CardTitle></CardHeader><CardContent>{error}</CardContent></Card>;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Tchat du Club</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-4 pr-4">
        {messages.map(msg => {
          const isCurrentUser = msg.profile_id === profile?.id;
          const authorName = msg.profiles?.full_name || 'Anonyme';
          const initials = authorName.split(' ').map(n => n[0]).join('').substring(0, 2);

          return (
            <div key={msg.id} className={cn("flex items-end gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
              {!isCurrentUser && (
                 <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
              )}
              <div className={cn("max-w-[75%] p-3 rounded-lg", isCurrentUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800")}>
                {!isCurrentUser && <p className="text-xs font-bold mb-1">{authorName}</p>}
                <p className="text-sm">{msg.content}</p>
                <p className="text-xs opacity-70 text-right mt-1">{new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
               {isCurrentUser && (
                 <Avatar className="h-8 w-8">
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
              )}
            </div>
          );
        })}
        <div ref={messagesContainerRef} />
      </CardContent>

      <div className="p-4 border-t bg-gray-50">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            autoComplete="off"
          />
          <Button type="submit" disabled={!newMessage.trim()}>Envoyer</Button>
        </form>
      </div>
    </Card>
  );
}

export default ClubChat;