import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escapeCsv(row[h])).join(','));
  }
  return lines.join('\n');
}

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

    // Verify user is admin
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

    // Check admin role
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

    // Fetch all tables data
    const [products, customers, sales, saleItems, suppliers, categories] = await Promise.all([
      adminClient.from('products').select('*').then(r => r.data || []),
      adminClient.from('customers').select('*').then(r => r.data || []),
      adminClient.from('sales').select('*').then(r => r.data || []),
      adminClient.from('sale_items').select('*').then(r => r.data || []),
      adminClient.from('suppliers').select('*').then(r => r.data || []),
      adminClient.from('categories').select('*').then(r => r.data || []),
    ]);

    const timestamp = new Date().toISOString().slice(0, 10);

    // Build a multi-sheet CSV (separated by markers)
    const sections = [
      `=== PRODUCTOS (${timestamp}) ===\n${toCsv(products)}`,
      `\n\n=== CLIENTES (${timestamp}) ===\n${toCsv(customers)}`,
      `\n\n=== VENTAS (${timestamp}) ===\n${toCsv(sales)}`,
      `\n\n=== ITEMS DE VENTA (${timestamp}) ===\n${toCsv(saleItems)}`,
      `\n\n=== PROVEEDORES (${timestamp}) ===\n${toCsv(suppliers)}`,
      `\n\n=== CATEGORIAS (${timestamp}) ===\n${toCsv(categories)}`,
    ];

    const csvContent = sections.join('');

    // Return CSV as downloadable content
    return new Response(csvContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="backup_${timestamp}.csv"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
