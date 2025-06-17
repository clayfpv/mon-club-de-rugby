import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Layouts et Pages
import CoachLayout from './components/CoachLayout';
import PlayerDashboard from './pages/PlayerDashboard';
import DashboardPage from './pages/DashboardPage';
import TeamsPage from './pages/TeamsPage';
import TeamDetailPage from './pages/TeamDetailPage';
import CompositionsPage from './pages/CompositionsPage.tsx';

function App() {
  const { session, loading, profile } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><h1>Chargement...</h1></div>;
  }

  // Si l'utilisateur n'est pas connecté, il est redirigé vers la page de connexion.
  // C'est notre "Route Protégée" principale.
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  
  // Si l'utilisateur est connecté, on détermine son interface grâce à son rôle
  const role = profile?.role;

  return (
    <Routes>
      {/* Routes pour le Coach */}
      {role === 'admin_coach' && (
        <Route path="/" element={<CoachLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="equipes" element={<TeamsPage />} />
          <Route path="equipes/:teamId" element={<TeamDetailPage />} />
          <Route path="compositions" element={<CompositionsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      )}

      {/* Routes pour le Joueur */}
      {role === 'player' && (
        // Le joueur n'a qu'un seul layout/page principale pour l'instant
        <Route path="/*" element={<PlayerDashboard />} />
      )}
      
      {/* Si l'utilisateur est connecté mais n'a pas de rôle, on affiche un message */}
      {!role && (
         <Route path="*" element={
           <div>
             <h1>Compte en attente</h1>
             <p>Votre rôle n'est pas encore défini. Veuillez patienter ou contacter un administrateur.</p>
           </div>
         } />
      )}
    </Routes>
  );
}

export default App;