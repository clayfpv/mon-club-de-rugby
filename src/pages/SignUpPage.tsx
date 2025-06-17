import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    coachFullName: '',
    email: '',
    password: '',
    clubName: '',
    clubCity: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke('create-club-and-coach', {
        body: formData,
      });

      if (invokeError) throw invokeError;

      setSuccessMessage(data.message + " Vous pouvez maintenant vous connecter.");
      // Optionnel: rediriger vers la page de connexion après un délai
      setTimeout(() => navigate('/'), 3000);

    } catch (err: any) {
      setError(err.data?.error || err.message || "Une erreur inconnue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Créer votre Compte et votre Club</h2>
      <form onSubmit={handleSubmit}>
        <h4>Vos Informations (Coach)</h4>
        <div style={{ marginBottom: '10px' }}>
          <label>Votre nom complet</label>
          <input type="text" name="coachFullName" onChange={handleChange} required style={{ width: '95%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Votre email</label>
          <input type="email" name="email" onChange={handleChange} required style={{ width: '95%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Votre mot de passe</label>
          <input type="password" name="password" onChange={handleChange} required minLength={6} style={{ width: '95%', padding: '8px' }} />
        </div>
        <hr style={{margin: '20px 0'}} />
        <h4>Informations de votre Club</h4>
        <div style={{ marginBottom: '10px' }}>
          <label>Nom du club</label>
          <input type="text" name="clubName" onChange={handleChange} required style={{ width: '95%', padding: '8px' }} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Ville du club</label>
          <input type="text" name="clubCity" onChange={handleChange} style={{ width: '95%', padding: '8px' }} />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', fontSize: '1.2em' }}>
          {loading ? 'Création en cours...' : 'Créer mon Club'}
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>Erreur: {error}</p>}
        {successMessage && <p style={{ color: 'green', marginTop: '10px' }}>{successMessage}</p>}
      </form>
      <p style={{textAlign: 'center', marginTop: '20px'}}>
        Déjà un compte ? <Link to="/">Connectez-vous ici</Link>.
      </p>
    </div>
  );
}

export default SignUpPage;