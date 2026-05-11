import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: "Missing Supabase credentials" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const demoAccounts = [
      {
        email: "guru@sekolah.sch.id",
        password: "guru123",
        full_name: "Guru Satu",
        nip: "123456789",
        role: "guru",
        subject: "Guru Informatika",
      },
      {
        email: "guru2@sekolah.sch.id",
        password: "guru123",
        full_name: "Guru Dua",
        nip: "987654321",
        role: "guru",
        subject: "Guru Bahasa Indonesia",
      },
      {
        email: "admin@sekolah.sch.id",
        password: "admin123",
        full_name: "Administrator Sekolah",
        nip: "111222333",
        role: "admin",
        subject: "Administrator",
      },
    ];

    const results: {
      email: string;
      status: string;
      userId?: string;
      error?: string;
    }[] = [];

    for (const account of demoAccounts) {
      const signUpRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          email: account.email,
          password: account.password,
        }),
      });

      const signUpData = await signUpRes.json();

      if (signUpRes.ok && signUpData.user) {
        const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            id: signUpData.user.id,
            full_name: account.full_name,
            nip: account.nip,
            role: account.role,
            subject: account.subject,
            phone: "",
          }),
        });

        if (profileRes.ok) {
          results.push({
            email: account.email,
            status: "created",
            userId: signUpData.user.id,
          });
        } else {
          results.push({
            email: account.email,
            status: "user_created_profile_failed",
            userId: signUpData.user.id,
            error: await profileRes.text(),
          });
        }
      } else {
        results.push({
          email: account.email,
          status: "failed",
          error: signUpData.message || "Unknown error",
        });
      }
    }

    return new Response(JSON.stringify({ message: "Demo account setup completed", results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
