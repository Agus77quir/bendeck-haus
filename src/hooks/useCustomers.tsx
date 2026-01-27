import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessStore } from '@/stores/businessStore';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/integrations/supabase/types';

export type Customer = Tables<'customers'>;
export type AccountMovement = Tables<'account_movements'>;
export type Sale = Tables<'sales'>;

export const useCustomers = (searchTerm: string = '') => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBusiness } = useBusinessStore();
  const { isAdmin } = useAuthStore();

  const refetch = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('customers')
          .select('*')
          .eq('active', true)
          .order('name');

        if (selectedBusiness && !isAdmin) {
          query = query.eq('business', selectedBusiness);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching customers:', error);
          return;
        }

        setCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [selectedBusiness, isAdmin, refreshKey]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    
    const term = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(term) ||
      customer.code.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.includes(term)
    );
  }, [customers, searchTerm]);

  return {
    customers: filteredCustomers,
    allCustomers: customers,
    isLoading,
    refetch,
  };
};

export const useCustomerDetail = (customerId: string | null) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [movements, setMovements] = useState<AccountMovement[]>([]);
  const [sales, setSales] = useState<(Sale & { items_count: number; items_total: number })[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCustomerData = useCallback(async () => {
    if (!customerId) {
      setCustomer(null);
      setMovements([]);
      setSales([]);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();

      if (customerError) {
        console.error('Error fetching customer:', customerError);
        return;
      }

      setCustomer(customerData);

      // Fetch account movements
      const { data: movementsData, error: movementsError } = await supabase
        .from('account_movements')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (movementsError) {
        console.error('Error fetching movements:', movementsError);
      } else {
        setMovements(movementsData || []);
      }

      // Fetch sales history
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, sale_items(quantity, total)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (salesError) {
        console.error('Error fetching sales:', salesError);
      } else {
        const salesWithCounts = (salesData || []).map(sale => ({
          ...sale,
          items_count: (sale.sale_items as any[])?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
          items_total: (sale.sale_items as any[])?.reduce((sum: number, item: any) => sum + item.total, 0) || 0,
        }));
        setSales(salesWithCounts);
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomerData();
  }, [fetchCustomerData]);

  return {
    customer,
    movements,
    sales,
    isLoading,
    refetch: fetchCustomerData,
  };
};
