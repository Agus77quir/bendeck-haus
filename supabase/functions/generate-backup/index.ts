import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [products, customers, sales, saleItems, suppliers, categories] = await Promise.all([
      adminClient.from('products').select('*').then(r => r.data || []),
      adminClient.from('customers').select('*').then(r => r.data || []),
      adminClient.from('sales').select('*').then(r => r.data || []),
      adminClient.from('sale_items').select('*').then(r => r.data || []),
      adminClient.from('suppliers').select('*').then(r => r.data || []),
      adminClient.from('categories').select('*').then(r => r.data || []),
    ]);

    const wb = XLSX.utils.book_new();

    const addSheet = (name: string, data: Record<string, unknown>[]) => {
      const ws = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{}]);
      XLSX.utils.book_append_sheet(wb, ws, name);
    };

    addSheet('Productos', products);
    addSheet('Clientes', customers);
    addSheet('Ventas', sales);
    addSheet('Items de Venta', saleItems);
    addSheet('Proveedores', suppliers);
    addSheet('Categorias', categories);

    const xlsBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const timestamp = new Date().toISOString().slice(0, 10);

    return new Response(xlsBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="backup_${timestamp}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
