import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Fonction pour gérer les requêtes CORS (Cross-Origin)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Gérer la requête preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Récupérer l'email et l'ID du joueur depuis le corps de la requête
    const { email, playerId } = await req.json();
    if (!email || !playerId) {
      throw new Error("L'email et l'ID du joueur sont requis.");
    }

    // 2. Créer un client Supabase "Admin" avec les droits de service
    // Ces variables d'environnement (SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY)
    // sont automatiquement disponibles dans les Edge Functions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Envoyer l'invitation
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError) throw inviteError;

    // 4. Mettre à jour la table players avec l'email (si ce n'est pas déjà fait)
    const { error: updateError } = await supabaseAdmin
      .from('players')
      .update({ email: email })
      .eq('id', playerId);

    if (updateError) throw updateError;

    // 5. Retourner une réponse de succès
    return new Response(JSON.stringify({ message: `Invitation envoyée à ${email}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Gérer les erreurs
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})