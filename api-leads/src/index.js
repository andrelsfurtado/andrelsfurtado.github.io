export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 👇 proteção contra GET
    if (request.method !== "POST") {
      return new Response("Use POST", {
        status: 405,
        headers: corsHeaders
      });
    }

    if (url.pathname === "/api/lead") {

      let body;

      try {
        body = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: "JSON inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const pixelId = "1679467643222276";
      const eventData = {
        data: [{
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: body.event_id || ("lead_" + Date.now()),
          action_source: "website"
        }]
      };

      try {
        await fetch(
          `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${env.FB_TOKEN}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData)
          }
        );
      } catch (_) {}

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};