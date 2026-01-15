/**
 * Admin Order Service (Placeholder)
 * 
 * Handles all order-related operations for the administrative panel.
 * Designed to be swapped with real Supabase/API calls later.
 */

import { Order } from '../types';

export interface AdminOrderDetail extends Order {
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  phone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
}

const MOCK_ADMIN_ORDERS: AdminOrderDetail[] = [
  { 
    id: 'ORD-7782', 
    customerName: 'Alex Morgan', 
    email: 'alex@example.com', 
    phone: '+1 (555) 123-4567',
    date: '2024-03-10', 
    total: 1250.00, 
    status: 'Processing', 
    itemsCount: 1,
    paymentStatus: 'Paid',
    shippingAddress: { street: '123 Performance Blvd', city: 'Speedway City', state: 'CA', zip: '90210', country: 'US' },
    items: [{ id: '1', name: 'Brembo GT Braking System Kit', price: 1250, quantity: 1, image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop' }]
  },
  { 
    id: 'ORD-7781', 
    customerName: 'Sarah Connor', 
    email: 'sarah@skynet.com', 
    phone: '+1 (555) 987-6543',
    date: '2024-03-09', 
    total: 89.00, 
    status: 'Shipped', 
    itemsCount: 1,
    paymentStatus: 'Paid',
    shippingAddress: { street: '456 Future Lane', city: 'Tech Valley', state: 'CA', zip: '94043', country: 'US' },
    items: [{ id: '2', name: 'Sparco Racing Gloves', price: 89, quantity: 1, image: 'https://images.unsplash.com/photo-1599951304911-37d044439031?q=80&w=2787&auto=format&fit=crop' }]
  },
  { 
    id: 'ORD-7780', 
    customerName: 'Bruce Wayne', 
    email: 'bruce@wayne.ent', 
    phone: '+1 (555) 000-0000',
    date: '2024-03-08', 
    total: 3200.00, 
    status: 'Delivered', 
    itemsCount: 1,
    paymentStatus: 'Paid',
    shippingAddress: { street: '1007 Mountain Drive', city: 'Gotham', state: 'NJ', zip: '07001', country: 'US' },
    items: [{ id: '3', name: 'Akrapovič Titanium Exhaust', price: 3200, quantity: 1, image: 'https://images.unsplash.com/photo-1565538361093-9c59573887c3?q=80&w=2940&auto=format&fit=crop' }]
  },
  { 
    id: 'ORD-7779', 
    customerName: 'Diana Prince', 
    email: 'diana@themyscira.gov', 
    phone: '+1 (555) 111-2222',
    date: '2024-03-07', 
    total: 1895.50, 
    status: 'Pending', 
    itemsCount: 1,
    paymentStatus: 'Pending',
    shippingAddress: { street: '1 Paradise Island', city: 'Themyscira', state: 'GR', zip: '00000', country: 'GR' },
    items: [{ id: '4', name: 'KW V3 Coilover Suspension', price: 1895.50, quantity: 1, image: 'https://images.unsplash.com/photo-1614251412693-4a1f6494cb68?q=80&w=2940&auto=format&fit=crop' }]
  }
];

/**
 * Fetches all orders for the admin panel.
 */
export const getAllAdminOrders = async (): Promise<AdminOrderDetail[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  /*
    TODO: SUPABASE INTEGRATION
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:profiles(full_name, email), order_items(*, product:products(*))')
      .order('created_at', { ascending: false });
  */

  return [...MOCK_ADMIN_ORDERS];
};

/**
 * Updates the status of an existing order.
 */
export const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
  console.log(`[Admin Service] Updating order ${orderId} status to: ${status}`);
  
  /*
    TODO: SUPABASE INTEGRATION
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
  */

  return true;
};

/**
 * Retrieves full details for a single order.
 */
export const getAdminOrderDetails = async (orderId: string): Promise<AdminOrderDetail | null> => {
  return MOCK_ADMIN_ORDERS.find(o => o.id === orderId) || null;
};