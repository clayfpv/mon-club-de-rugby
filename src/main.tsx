import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './AuthContext.tsx'

// On importe toutes nos pages
import LoginPage from './pages/LoginPage.tsx';
import SignUpPage from './pages/SignUpPage.tsx';
import SetAvailabilityPage from './pages/SetAvailabilityPage.tsx';

// Définition simple et unique des routes
const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/signup",
    element: <SignUpPage />,
  },
  {
    path: "/dispo/:availabilityId",
    element: <SetAvailabilityPage />,
  },
  {
    path: "/*", // Route "attrape-tout" qui gère l'application principale
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)