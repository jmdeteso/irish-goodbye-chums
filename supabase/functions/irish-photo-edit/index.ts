import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageBase64, style } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompts: Record<string, string> = {
      shamrock: "Add a few cute small shamrock (☘️) decorations scattered around the edges of this photo. Keep them subtle and tasteful like a photo filter. Add a small 'Irish Goodbye 🍀' watermark in the bottom right corner. Keep the original photo intact and recognizable.",
      beer: "Add a playful Irish pub theme to this photo: add small cartoon pint of Guinness or green beer illustrations in the corners. Add a small 'Irish Goodbye 🍻' watermark in the bottom right. Keep the original photo intact and recognizable.",
      leprechaun: "Add a tiny cute cartoon leprechaun peeking from one corner of this photo, with a few gold coins and a rainbow accent. Add a small 'Irish Goodbye 🌈' watermark in the bottom right. Keep the original photo intact and recognizable.",
      full: "Transform this photo with a full festive Irish theme: add a decorative green and gold border, scatter small shamrocks, add a tiny leprechaun, and put 'Irish Goodbye 🍀' text at the bottom. Keep the original photo recognizable but make it look like a fun party souvenir.",
    };

    const prompt = prompts[style] || prompts.shamrock;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI gateway error [${response.status}]: ${errText}`);
    }

    const data = await response.json();
    const editedImage = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!editedImage) {
      throw new Error("No image returned from AI");
    }

    return new Response(JSON.stringify({ image: editedImage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error("Error editing photo:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
