import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { PostForm } from './PostForm';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { MoreVertical } from "lucide-react"; // Une icône pour le menu d'actions
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  created_at: string;
  title?: string | null;
  content: string;
  type?: string | null;
  team_id: string | null;
  user_id: string;
  author_name?: string;
}

interface PostListProps { 
    teamId: string | null; 
}

function PostList({ teamId }: PostListProps) {
  const { user: currentUser, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]); // Mettre le type 'any' temporairement pour simplicité
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);

  async function fetchPosts() {
    // ... votre fonction fetchPosts existante ...
    if (typeof teamId === 'undefined') {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    let postsQuery = supabase
      .from('posts')
      .select('id, created_at, title, content, type, team_id, user_id')
      .order('created_at', { ascending: false });

    if (teamId === null) {
      postsQuery = postsQuery.is('team_id', null);
    } else {
      postsQuery = postsQuery.eq('team_id', teamId);
    }

    const { data: postsData, error: postsError } = await postsQuery;

    if (postsError) {
      setError(postsError.message);
      setLoading(false);
      return;
    }

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // 2. Récupérer les noms des auteurs en une seule requête sur notre nouvelle vue
    const authorIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: authorsData, error: authorsError } = await supabase
      .from('public_users') // On requête notre vue sécurisée
      .select('id, full_name')
      .in('id', authorIds);

    if (authorsError) {
      console.warn("Avertissement lors de la récupération des auteurs:", authorsError.message);
    }

    // 3. Créer une "map" pour associer facilement ID et nom
    const authorMap = new Map(authorsData?.map(a => [a.id, a.full_name]));

    // 4. Enrichir nos posts avec le nom de l'auteur
    const enrichedPosts = postsData.map(post => ({
      ...post,
      author_name: authorMap.get(post.user_id) || 'Auteur inconnu'
    }));

    setPosts(enrichedPosts as Post[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchPosts();
  }, [teamId]);
  
  async function handleDeletePost(postId: string) {
    if (!window.confirm("Supprimer ce post ?")) return;
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive"}); }
    else { toast({ title: "Succès", description: "Post supprimé." }); fetchPosts(); }
  }

  const handleOpenAddModal = () => {
    setPostToEdit(null); // On s'assure qu'on est en mode "création"
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (post: Post) => {
    setPostToEdit(post); // On met le post à modifier dans l'état
    setIsModalOpen(true);
  };

  const handleFormSubmit = () => {
    setIsModalOpen(false);
    setPostToEdit(null);
    fetchPosts();
  };
  
  // ... (Logique de chargement et d'erreur) ...

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-bold">Actualités</h3>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenAddModal}>Écrire un Post</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              {/* Le titre de la modale est maintenant dynamique */}
              <DialogTitle>{postToEdit ? "Modifier le post" : "Publier une nouvelle actualité"}</DialogTitle>
            </DialogHeader>
            {/* On passe les props nécessaires au formulaire, y compris le profil pour le club_id */}
            <PostForm 
              teamId={teamId} 
              clubId={profile?.club_id}
              postToEdit={postToEdit}
              onFormSubmit={handleFormSubmit} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-start">
                  <span>{post.title || `Post du ${new Date(post.created_at).toLocaleDateString()}`}</span>
                  {/* Menu d'actions pour l'auteur du post */}
                  {currentUser && post.user_id === currentUser.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditModal(post)}>Modifier</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-red-600">Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardTitle>
                <CardDescription>
                  Publié le {new Date(post.created_at).toLocaleString('fr-FR')}
                  {post.author_name && ` par ${post.author_name}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{post.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          !loading && <p>Aucun post à afficher.</p>
        )}
      </div>
    </div>
  );
}

export default PostList;