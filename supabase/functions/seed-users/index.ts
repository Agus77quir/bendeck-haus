import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const users = [
      { email: "admin@bendeck.com", password: "admin123", full_name: "Administrador", role: "admin", business: null },
      { email: "vend1@bendeck.com", password: "vend1123", full_name: "Vendedor 1 Bendeck", role: "seller", business: "bendeck_tools" },
      { email: "vend2@bendeck.com", password: "vend2123", full_name: "Vendedor 2 Bendeck", role: "seller", business: "bendeck_tools" },
      { email: "vend1@lusqtoff.com", password: "vend1123", full_name: "Vendedor 1 Lüsqtoff", role: "seller", business: "lusqtoff" },
      { email: "vend2@lusqtoff.com", password: "vend2123", full_name: "Vendedor 2 Lüsqtoff", role: "seller", business: "lusqtoff" },
    ];

    const results = [];

    for (const user of users) {
      // Check if user exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
        results.push({ email: user.email, status: "already exists", userId });
      } else {
        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

        if (createError) {
          results.push({ email: user.email, status: "error", error: createError.message });
          continue;
        }

        userId = newUser.user.id;
        results.push({ email: user.email, status: "created", userId });
      }

      // Update profile with business
      if (user.business) {
        await supabaseAdmin
          .from("profiles")
          .update({ business: user.business })
          .eq("id", userId);
      }

      // Check if role exists
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (!existingRole) {
        // Insert role
        await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: user.role });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
