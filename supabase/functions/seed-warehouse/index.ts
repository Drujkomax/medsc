import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Sample warehouse items
    const sampleItems = [
      {
        name: {
          ru: "УЗИ аппарат Mindray DC-70",
          en: "Mindray DC-70 Ultrasound System",
          uz: "Mindray DC-70 Ultratovush tizimi"
        },
        description: {
          ru: "Современный ультразвуковой сканер с высоким разрешением для диагностики",
          en: "Modern high-resolution ultrasound scanner for diagnostics",
          uz: "Diagnostika uchun zamonaviy yuqori aniqlikdagi ultratovush skaneri"
        },
        images: {
          cover: "/lovable-uploads/ultrasound-machine.jpg",
          gallery: []
        },
        quantity: 3,
        unit: "шт",
        location: "Стеллаж A1",
        condition: "new",
        purchase_price: 45000.00,
        selling_price: 58000.00,
        notes: "В наличии на складе, готов к отгрузке",
        minimum_stock: 2,
        notify_low_stock: true
      },
      {
        name: {
          ru: "Рентген аппарат GE AMX 4 Plus",
          en: "GE AMX 4 Plus X-Ray System",
          uz: "GE AMX 4 Plus rentgen tizimi"
        },
        description: {
          ru: "Цифровой рентгеновский аппарат для общей рентгенографии",
          en: "Digital X-ray system for general radiography",
          uz: "Umumiy rentgenografiya uchun raqamli rentgen tizimi"
        },
        images: {
          cover: null,
          gallery: []
        },
        quantity: 1,
        unit: "шт",
        location: "Стеллаж B3",
        condition: "refurbished",
        purchase_price: 35000.00,
        selling_price: 42000.00,
        notes: "Восстановлен, проверен, гарантия 12 месяцев",
        minimum_stock: 1,
        notify_low_stock: true
      }
    ];

    const { data, error } = await supabaseClient
      .from('warehouse_items')
      .insert(sampleItems)
      .select();

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true, items: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});