const ALLOWED_ORIGIN = "https://www.biomedicadanielyreis.com.br";
const PIXEL_ID = "1679467643222276";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Use POST", { status: 405, headers: corsHeaders });
    }

    if (url.pathname === "/api/lead") {
      let body;
      try {
        body = await request.json();
      } catch (e) {
        return new Response(JSON.stringify({ error: "JSON invalido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const eventId = typeof body.event_id === "string" && body.event_id.length <= 128
        ? body.event_id
        : "lead_" + Date.now();

      const eventData = {
        data: [{
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website"
        }]
      };

      try {
        await fetch(
          `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${env.FB_TOKEN}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(eventData)
          }
        );
      } catch (err) { console.error("FB API error:", err); }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};