import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useBusinessStore } from '@/stores/businessStore';

interface DashboardStats {
  totalSalesToday: number;
  totalSalesWeek: number;
  totalSalesMonth: number;
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  salesCount: number;
}

interface TopProduct {
  id: string;
  name: string;
  code: string;
  totalSold: number;
  revenue: number;
}

interface SalesData {
  date: string;
  total: number;
  count: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSalesToday: 0,
    totalSalesWeek: 0,
    totalSalesMonth: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    totalCustomers: 0,
    salesCount: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [leastSoldProducts, setLeastSoldProducts] = useState<TopProduct[]>([]);
  const [dailySales, setDailySales] = useState<SalesData[]>([]);
  const [weeklySales, setWeeklySales] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { isAdmin } = useAuthStore();
  const { selectedBusiness } = useBusinessStore();

  const fetchStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Build base queries with business filter
      const addBusinessFilter = (query: any) => {
        if (selectedBusiness && !isAdmin) {
          return query.eq('business', selectedBusiness);
        }
        return query;
      };

      // Execute all main queries in parallel
      const [
        salesTodayResult,
        salesWeekResult,
        salesMonthResult,
        productsResult,
        customersResult,
        saleItemsResult
      ] = await Promise.all([
        // Sales today
        addBusinessFilter(
          supabase.from('sales').select('total').gte('created_at', todayStart).eq('status', 'completed')
        ),
        // Sales week
        addBusinessFilter(
          supabase.from('sales').select('total').gte('created_at', weekStart).eq('status', 'completed')
        ),
        // Sales month
        addBusinessFilter(
          supabase.from('sales').select('total').gte('created_at', monthStart).eq('status', 'completed')
        ),
        // Products
        addBusinessFilter(
          supabase.from('products').select('id, stock, min_stock', { count: 'exact' })
        ),
        // Customers
        addBusinessFilter(
          supabase.from('customers').select('id', { count: 'exact' })
        ),
        // Sale items for top products
        supabase
          .from('sale_items')
          .select(`quantity, total, product_id, products!inner(id, name, code, business)`)
          .gte('created_at', monthStart)
      ]);

      const salesToday = salesTodayResult.data;
      const salesWeek = salesWeekResult.data;
      const salesMonth = salesMonthResult.data;
      const products = productsResult.data;
      const productsCount = productsResult.count;
      const customersCount = customersResult.count;
      const saleItems = saleItemsResult.data;

      // Count low stock products
      const lowStock = products?.filter(p => p.stock <= p.min_stock).length || 0;

      setStats({
        totalSalesToday: salesToday?.reduce((acc, s) => acc + Number(s.total), 0) || 0,
        totalSalesWeek: salesWeek?.reduce((acc, s) => acc + Number(s.total), 0) || 0,
        totalSalesMonth: salesMonth?.reduce((acc, s) => acc + Number(s.total), 0) || 0,
        totalProducts: productsCount || 0,
        lowStockProducts: lowStock,
        totalCustomers: customersCount || 0,
        salesCount: salesToday?.length || 0,
      });

      // Process top products
      if (saleItems) {
        const filteredItems = !isAdmin && selectedBusiness
          ? saleItems.filter((item: any) => item.products?.business === selectedBusiness)
          : saleItems;

        const productSales = filteredItems.reduce((acc: Record<string, TopProduct>, item: any) => {
          const productId = item.product_id;
          if (!acc[productId]) {
            acc[productId] = {
              id: productId,
              name: item.products?.name || 'Desconocido',
              code: item.products?.code || '',
              totalSold: 0,
              revenue: 0,
            };
          }
          acc[productId].totalSold += item.quantity;
          acc[productId].revenue += Number(item.total);
          return acc;
        }, {});

        const sortedProducts = Object.values(productSales).sort((a, b) => b.totalSold - a.totalSold);
        setTopProducts(sortedProducts.slice(0, 5));
        setLeastSoldProducts(sortedProducts.slice(-5).reverse());
      }

      // Generate daily sales data for last 7 days - fetch all at once
      const dailySalesPromises = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
        const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

        return addBusinessFilter(
          supabase.from('sales').select('total').gte('created_at', dayStart).lt('created_at', dayEnd).eq('status', 'completed')
        ).then(result => ({
          date: date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
          total: result.data?.reduce((acc, s) => acc + Number(s.total), 0) || 0,
          count: result.data?.length || 0,
        }));
      });

      // Generate weekly sales data for last 4 weeks - fetch all at once
      const weeklySalesPromises = Array.from({ length: 4 }, (_, i) => {
        const weekEnd = new Date(now.getTime() - (3 - i) * 7 * 24 * 60 * 60 * 1000);
        const weekStartDate = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

        return addBusinessFilter(
          supabase.from('sales').select('total').gte('created_at', weekStartDate.toISOString()).lt('created_at', weekEnd.toISOString()).eq('status', 'completed')
        ).then(result => ({
          date: `Sem ${i + 1}`,
          total: result.data?.reduce((acc, s) => acc + Number(s.total), 0) || 0,
          count: result.data?.length || 0,
        }));
      });

      // Execute daily and weekly queries in parallel
      const [dailyResults, weeklyResults] = await Promise.all([
        Promise.all(dailySalesPromises),
        Promise.all(weeklySalesPromises)
      ]);

      setDailySales(dailyResults);
      setWeeklySales(weeklyResults);

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up realtime subscription for sales
    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, selectedBusiness]);

  return {
    stats,
    topProducts,
    leastSoldProducts,
    dailySales,
    weeklySales,
    isLoading,
    refetch: fetchStats,
  };
};
