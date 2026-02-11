import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessStore } from '@/stores/businessStore';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom';

interface DateRange {
  from: Date;
  to: Date;
}

interface SaleData {
  date: string;
  total: number;
  count: number;
}

interface ProductSaleData {
  id: string;
  name: string;
  code: string;
  totalSold: number;
  revenue: number;
}

interface PaymentMethodData {
  method: string;
  total: number;
  count: number;
}

interface ReportStats {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  previousPeriodRevenue: number;
  revenueChange: number;
}

export const useReports = (period: ReportPeriod, customRange?: DateRange) => {
  const { selectedBusiness } = useBusinessStore();
  const [isLoading, setIsLoading] = useState(true);
  const [salesByDate, setSalesByDate] = useState<SaleData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSaleData[]>([]);
  const [leastProducts, setLeastProducts] = useState<ProductSaleData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodData[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    totalSales: 0,
    totalRevenue: 0,
    averageTicket: 0,
    previousPeriodRevenue: 0,
    revenueChange: 0,
  });

  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        return {
          from: subDays(startOfDay(now), 6),
          to: endOfDay(now),
        };
      case 'weekly':
        return {
          from: subDays(startOfWeek(now, { locale: es }), 28),
          to: endOfWeek(now, { locale: es }),
        };
      case 'monthly':
        return {
          from: startOfMonth(subDays(now, 180)),
          to: endOfMonth(now),
        };
      case 'custom':
        return customRange || { from: subDays(now, 30), to: now };
      default:
        return { from: subDays(now, 7), to: now };
    }
  }, [period, customRange]);

  const previousDateRange = useMemo(() => {
    const diff = dateRange.to.getTime() - dateRange.from.getTime();
    return {
      from: new Date(dateRange.from.getTime() - diff),
      to: new Date(dateRange.from.getTime() - 1),
    };
  }, [dateRange]);

  const fetchReports = async () => {
    setIsLoading(true);
    
    try {
      // Fetch sales for current period
      let salesQuery = supabase
        .from('sales')
        .select('id, total, created_at, payment_method')
        .eq('status', 'completed')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      if (selectedBusiness) {
        salesQuery = salesQuery.eq('business', selectedBusiness);
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      // Fetch sales for previous period (for comparison)
      let prevSalesQuery = supabase
        .from('sales')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', previousDateRange.from.toISOString())
        .lte('created_at', previousDateRange.to.toISOString());

      if (selectedBusiness) {
        prevSalesQuery = prevSalesQuery.eq('business', selectedBusiness);
      }

      const { data: prevSalesData } = await prevSalesQuery;

      // Fetch sale items with products for top/least sold
      let itemsQuery = supabase
        .from('sale_items')
        .select(`
          quantity,
          total,
          product_id,
          products!inner(id, name, code, business)
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());

      const { data: itemsData, error: itemsError } = await itemsQuery;

      if (itemsError) throw itemsError;

      // Process sales by date
      const salesByDateMap = new Map<string, { total: number; count: number }>();
      
      // Initialize all dates in range
      let intervals: Date[];
      let dateFormat: string;
      
      if (period === 'daily' || period === 'custom') {
        intervals = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
        dateFormat = 'dd/MM';
      } else if (period === 'weekly') {
        intervals = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to }, { locale: es });
        dateFormat = "'Sem' w";
      } else {
        intervals = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
        dateFormat = 'MMM yy';
      }

      intervals.forEach(date => {
        const key = format(date, dateFormat, { locale: es });
        salesByDateMap.set(key, { total: 0, count: 0 });
      });

      // Fill in actual sales data
      (salesData || []).forEach(sale => {
        const saleDate = new Date(sale.created_at);
        let key: string;
        
        if (period === 'daily' || period === 'custom') {
          key = format(saleDate, 'dd/MM', { locale: es });
        } else if (period === 'weekly') {
          key = format(saleDate, "'Sem' w", { locale: es });
        } else {
          key = format(saleDate, 'MMM yy', { locale: es });
        }

        const existing = salesByDateMap.get(key) || { total: 0, count: 0 };
        salesByDateMap.set(key, {
          total: existing.total + sale.total,
          count: existing.count + 1,
        });
      });

      const salesByDateArray = Array.from(salesByDateMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));

      setSalesByDate(salesByDateArray);

      // Process payment methods
      const paymentMethodsMap = new Map<string, { total: number; count: number }>();
      (salesData || []).forEach(sale => {
        const method = sale.payment_method || 'Sin especificar';
        const existing = paymentMethodsMap.get(method) || { total: 0, count: 0 };
        paymentMethodsMap.set(method, {
          total: existing.total + sale.total,
          count: existing.count + 1,
        });
      });

      const paymentMethodsArray = Array.from(paymentMethodsMap.entries()).map(([method, data]) => ({
        method: translatePaymentMethod(method),
        ...data,
      }));

      setPaymentMethods(paymentMethodsArray);

      // Process products
      const productsMap = new Map<string, ProductSaleData>();
      
      (itemsData || []).forEach((item: any) => {
        const product = item.products;
        if (!product) return;
        
        // Filter by business if selected
        if (selectedBusiness && product.business !== selectedBusiness) return;

        const existing = productsMap.get(product.id) || {
          id: product.id,
          name: product.name,
          code: product.code,
          totalSold: 0,
          revenue: 0,
        };

        productsMap.set(product.id, {
          ...existing,
          totalSold: existing.totalSold + item.quantity,
          revenue: existing.revenue + item.total,
        });
      });

      const productsArray = Array.from(productsMap.values());
      const sortedByQuantity = [...productsArray].sort((a, b) => b.totalSold - a.totalSold);
      
      setTopProducts(sortedByQuantity.slice(0, 10));
      setLeastProducts(sortedByQuantity.filter(p => p.totalSold > 0).slice(-5).reverse());

      // Calculate stats
      const totalRevenue = (salesData || []).reduce((sum, sale) => sum + sale.total, 0);
      const totalSales = salesData?.length || 0;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
      const previousPeriodRevenue = (prevSalesData || []).reduce((sum, sale) => sum + sale.total, 0);
      const revenueChange = previousPeriodRevenue > 0 
        ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
        : 0;

      setStats({
        totalSales,
        totalRevenue,
        averageTicket,
        previousPeriodRevenue,
        revenueChange,
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange, previousDateRange, selectedBusiness]);

  // Realtime: re-fetch when sales or sale_items change
  useEffect(() => {
    const channel = supabase
      .channel('reports-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        () => fetchReports()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sale_items' },
        () => fetchReports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateRange, previousDateRange, selectedBusiness]);

  return {
    isLoading,
    salesByDate,
    topProducts,
    leastProducts,
    paymentMethods,
    stats,
    dateRange,
  };
};

const translatePaymentMethod = (method: string): string => {
  const translations: Record<string, string> = {
    'cash': 'Efectivo',
    'credit_card': 'Tarjeta Crédito',
    'debit_card': 'Tarjeta Débito',
    'transfer': 'Transferencia',
    'cuenta_corriente': 'Cuenta Corriente',
    'Sin especificar': 'Sin especificar',
  };
  return translations[method] || method;
};
