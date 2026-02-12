import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres el asistente virtual de Bendeck Tools y Lüsqtoff, un sistema de punto de venta para ferreterías y herramientas.

Tu rol es guiar a los vendedores y administradores del sistema. Responde siempre en español, de forma clara y concisa.

Puedes ayudar con:

**Ventas:**
- Cómo crear una nueva venta paso a paso
- Buscar productos por código o nombre
- Agregar productos al carrito
- Seleccionar cliente y método de pago
- Finalizar la venta e imprimir ticket

**Productos:**
- Cómo agregar un nuevo producto
- Campos requeridos: código, nombre, precio compra, precio venta, stock
- Cómo editar o desactivar productos
- Importar productos masivamente desde CSV/Excel
- Gestión de stock y alertas de stock bajo

**Clientes:**
- Cómo registrar un nuevo cliente
- Gestión de cuenta corriente y límite de crédito
- Consultar estado de cuenta
- Importar clientes desde CSV/Excel

**Reportes:**
- Ver ventas por período, producto o método de pago
- Exportar reportes

**Configuración:**
- Cambiar entre negocios (Bendeck Tools / Lüsqtoff)
- Generar backup de datos
- Configurar notificaciones

Sé amable, profesional y directo. Si no sabes algo, dilo honestamente. Usa emojis moderadamente para hacer la conversación más amigable.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta de nuevo en un momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Error del asistente" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
