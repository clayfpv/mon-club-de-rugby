import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';

function CoachLayout() {
  const { user, signOut } = useAuth();
  const navLinkClass = "flex items-center px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors font-medium";
  const activeNavLinkClass = "bg-blue-600 text-white hover:bg-blue-600";

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <nav className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-xl font-bold">Mon Club de Rugby</h3>
          {user?.email && <p className="text-sm text-gray-500 truncate mt-1" title={user.email}>{user.email}</p>}
        </div>
        <ul className="flex flex-col gap-y-1 p-4">
          <li><NavLink to="/dashboard" className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>Tableau de Bord</NavLink></li>
          <li><NavLink to="/equipes" className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>Gestion des Équipes</NavLink></li>
          <li><NavLink to="/compositions" className={({ isActive }) => `${navLinkClass} ${isActive ? activeNavLinkClass : ''}`}>Compositions d'Équipe</NavLink></li>
        </ul>
        <div className="mt-auto p-4"><Button variant="outline" className="w-full" onClick={signOut}>Déconnexion</Button></div>
      </nav>
      <main className="flex-1 p-6 overflow-y-auto"><Outlet /></main>
      <Toaster />
    </div>
  );
}

export default CoachLayout;