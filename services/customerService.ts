
import { supabase } from '../lib/supabase';
import { auth } from './firebaseClient';

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

const ADMIN_EMAIL_ALLOWLIST = (
  ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_ADMIN_EMAILS) || '') as string
)
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const isAllowlistedAdminEmail = (email?: string | null) => {
  if (!email) return false;
  return ADMIN_EMAIL_ALLOWLIST.includes(email.toLowerCase());
};

const assertAdmin = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Unauthorized');

  if (isAllowlistedAdminEmail(currentUser.email)) {
    return;
  }

  const { data: me, error: meError } = await supabase
    .from('users')
    .select('role')
    .eq('uid', currentUser.uid)
    .single();

  if (meError || me?.role !== 'admin') {
    throw new Error('Admin access required');
  }
};

/**
 * Fetches all registered customers with aggregated order statistics.
 */
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    await assertAdmin();

    // 1. Fetch users from the `users` table (Firebase-synced)
    const { data: profiles, error: profileError } = await supabase
      .from('users')
      .select('*')
      .neq('role', 'admin'); // Exclude admins from customer list

    if (profileError) throw profileError;

    // 2. Fetch orders for aggregation
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, created_at, shipping_address, status');

    if (orderError) throw orderError;

    // 3. Merge data
    const customers: Customer[] = (profiles || []).map(profile => {
      // orders.user_id matches Firebase UID (uid)
      const userOrders = orders?.filter(o => o.user_id === profile.uid) || [];
      
      // Sort orders descending
      userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      
      let lastOrderDate = 'N/A';
      let address = 'N/A';
      
      if (userOrders.length > 0) {
        lastOrderDate = new Date(userOrders[0].created_at).toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric' 
        });
        
        const shipping = userOrders[0].shipping_address as any;
        if (shipping) {
          address = `${shipping.address || ''}, ${shipping.city || ''}, ${shipping.country || ''}`.replace(/^, |^, /, '').trim();
          if (address === ', ,') address = 'N/A';
        }
      }

      const recentOrders = userOrders.slice(0, 5).map(o => ({
        id: o.id,
        date: new Date(o.created_at).toLocaleDateString(),
        total: Number(o.total_amount),
        status: o.status
      }));

      return {
        id: profile.uid,  // use uid as the customer id
        name: profile.display_name || 'Guest User',
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
    await assertAdmin();

    const dbStatus = status === 'Blocked' ? 'blocked' : 'active';
    const { error } = await supabase
      .from('users')
      .update({ status: dbStatus })
      .eq('uid', id);  // id is the Firebase UID

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
