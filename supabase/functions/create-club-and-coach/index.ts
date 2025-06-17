import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    const { email, password, coachFullName, clubName, clubCity } = await req.json();
    if (!email || !password || !coachFullName || !clubName) {
      throw new Error("Toutes les informations (email, mot de passe, nom du coach, nom du club) sont requises.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Créer le nouvel utilisateur dans Supabase Auth
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // On peut mettre true en prod, false pour simplifier le dev
    });
    if (userError) throw userError;
    const newUserId = userData.user.id;

    // 2. Créer le nouveau club
    const { data: clubData, error: clubError } = await supabaseAdmin
      .from('clubs')
      .insert({ name: clubName, city: clubCity || null })
      .select('id')
      .single();
    if (clubError) throw clubError;
    const newClubId = clubData.id;

    // AJOUT : 3. Créer le canal de discussion pour ce nouveau club
    const { error: channelError } = await supabaseAdmin
      .from('channels')
      .insert({ club_id: newClubId, name: `Canal Général - ${clubName}` });
    if (channelError) throw channelError;

    // 3. Créer le profil du coach, en le liant à l'utilisateur et au club, et en lui donnant le rôle d'admin
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUserId,
        club_id: newClubId,
        role: 'admin_coach', // Le créateur du club est l'admin
        full_name: coachFullName
      });
    if (profileError) throw profileError;

    // Si tout s'est bien passé
    return new Response(JSON.stringify({ message: `Club '${clubName}' et compte coach créés avec succès !` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})