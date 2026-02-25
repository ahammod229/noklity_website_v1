
import { supabase } from '../lib/supabase';

/**
 * Customer Service
 * Handles administrative user management tasks via Supabase.
 */

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  status: 'Active' | 'Blocked';
  joinedDate: string;
  lastOrderDate: string;
  address: string;
  recentOrders?: Array<{
    id: string;
    date: string;
    total: number;
    status: string;
  }>;
}

/**
 * Fetches all registered customers with aggregated order statistics.
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    // 1. Fetch profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin'); // Optional: Exclude admins from customer list if desired

    if (profileError) throw profileError;

    // 2. Fetch orders (simplified fetch for client-side aggregation)
    // In production with thousands of orders, this should be an RPC or Edge Function
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, created_at, shipping_address, status');

    if (orderError) throw orderError;

    // 3. Merge data
    const customers: Customer[] = profiles.map(profile => {
      const userOrders = orders?.filter(o => o.user_id === profile.id) || [];
      
      // Sort orders descending
      userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      
      let lastOrderDate = 'N/A';
      let address = 'N/A';
      
      if (userOrders.length > 0) {
        lastOrderDate = new Date(userOrders[0].created_at).toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric' 
        });
        
        // Extract address from last order if available
        const shipping = userOrders[0].shipping_address as any;
        if (shipping) {
          address = `${shipping.address || ''}, ${shipping.city || ''}, ${shipping.country || ''}`.replace(/^, |^, /, '').trim();
          if (address === ', ,') address = 'N/A';
        }
      }

      // Map recent orders for details view (limit 5)
      const recentOrders = userOrders.slice(0, 5).map(o => ({
        id: o.id,
        date: new Date(o.created_at).toLocaleDateString(),
        total: Number(o.total_amount),
        status: o.status
      }));

      return {
        id: profile.id,
        name: profile.full_name || 'Guest User',
        email: profile.email || '',
        phone: profile.phone || 'N/A',
        ordersCount: userOrders.length,
        totalSpent,
        status: (profile.status === 'blocked' ? 'Blocked' : 'Active') as 'Active' | 'Blocked',
        joinedDate: new Date(profile.created_at).toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric' 
        }),
        lastOrderDate,
        address,
        recentOrders
      };
    });

    return customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
};

/**
 * Toggles a customer's access status.
 */
export const updateCustomerStatus = async (id: string, status: 'Active' | 'Blocked'): Promise<boolean> => {
  try {
    const dbStatus = status === 'Blocked' ? 'blocked' : 'active';
    const { error } = await supabase
      .from('profiles')
      .update({ status: dbStatus })
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error updating status for ${id}:`, error);
    return false;
  }
};

/**
 * Retrieves deep-dive details for a specific customer (Not strictly needed if getCustomers fetches all, 
 * but useful if pagination is added later).
 */
export const getCustomerDetails = async (id: string): Promise<Customer | null> => {
  // Re-use logic or fetch single profile
  const all = await getCustomers();
  return all.find(c => c.id === id) || null;
};
