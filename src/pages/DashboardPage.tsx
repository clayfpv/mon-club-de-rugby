import ClubChat from "../components/ClubChat";
import PostList from "../components/PostList";
import { useAuth } from "../AuthContext";

function DashboardPage() {
  const { user, profile } = useAuth();

  // On pourrait récupérer le profil ici pour avoir le nom du club, etc.
  // Pour l'instant, on se contente d'afficher les composants.

  return (
    <div>
      <h1>Tableau de Bord</h1>
      <p>Bienvenue sur votre espace de gestion, {user?.email} !</p>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '20px' }}>
        <div>
          <h3 className="text-xl font-bold mb-4">Actualités Générales</h3>
          {/* On n'a plus besoin de passer profile ici, car PostList le récupère tout seul */}
          <PostList teamId={null} /> 
        </div>
        <div>
          <ClubChat />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;