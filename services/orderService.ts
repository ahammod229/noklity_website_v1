
import { supabase } from '../lib/supabase';
import { CartItem, Order } from '../types';

export interface OrderData {
  items: CartItem[];
  shipping: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    zip: string;
  };
  paymentMethod: 'cod' | 'card' | 'wallet';
  total: number;
}

// Extended types for UI consumption
export interface OrderDetail extends Order {
  shippingAddress: any;
  paymentMethod: string;
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
}

/**
 * Creates a new order using Supabase RPC for transaction safety.
 */
export const createOrder = async (orderData: OrderData): Promise<{ success: boolean; orderId: string }> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    if (!userId) throw new Error('User not authenticated');

    const formattedItems = orderData.items.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      price: item.price
    }));

    const { data, error } = await supabase.rpc('create_order', {
      order_items: formattedItems,
      total_amount: orderData.total,
      shipping_address: orderData.shipping,
      payment_method: orderData.paymentMethod
    });

    if (error) throw error;

    return {
      success: true,
      orderId: data, // RPC returns the UUID string
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

/**
 * Retrieves a list of orders for the current user.
 */
export const getOrders = async (): Promise<any[]> => {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session?.user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((order: any) => {
      const firstItem = order.items?.[0];
      const firstProduct = firstItem?.product;
      
      return {
        id: order.id,
        displayId: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
        date: new Date(order.created_at).toLocaleDateString(),
        total: order.total_amount,
        status: order.status,
        itemCount: order.items?.length || 0,
        previewName: firstProduct?.title || 'Unknown Product',
        previewImage: firstProduct?.image_url || '',
        paymentStatus: 'Paid', // Simplified logic
        items: order.items?.map((i: any) => ({
          id: i.product_id,
          name: i.product?.title,
          price: i.price,
          qty: i.quantity,
          image: i.product?.image_url
        })),
        address: `${order.shipping_address?.address}, ${order.shipping_address?.city}, ${order.shipping_address?.zip}`
      };
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

/**
 * Retrieves details for a specific order by ID.
 */
export const getOrderById = async (id: string): Promise<OrderDetail | null> => {
  try {
    // If we have "ORD-" prefix from URL, assume the ID is the UUID part if possible, 
    // but typically the UI passes the UUID as `id` in `getOrders` mapper. 
    // If `id` passed here is just a UUID, we query directly.
    
    // Note: If ID passed is "ORD-XXXX", this query will fail for UUID type. 
    // The UI `Orders.tsx` passes `order.id` which is the UUID from `getOrders` mapper.
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    const shipping = data.shipping_address as any;
    const items = data.items.map((i: any) => ({
      id: i.product_id,
      name: i.product?.title || 'Product Removed',
      category: i.product?.category || 'General',
      price: i.price,
      quantity: i.quantity,
      image: i.product?.image_url || ''
    }));

    return {
      id: data.id,
      customerName: shipping?.fullName || 'Customer',
      email: shipping?.email || '',
      date: new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: data.status as any,
      paymentMethod: data.payment_method === 'cod' ? 'Cash on Delivery' : 'Card',
      shippingAddress: {
        name: shipping?.fullName,
        street: shipping?.address,
        city: shipping?.city,
        state: shipping?.state || 'N/A',
        zip: shipping?.zip,
        country: shipping?.country
      },
      items: items,
      subtotal: data.total_amount, // Simplified: assuming total_amount includes everything
      shipping: 0, // In this model, shipping was included in total or calculated at checkout. Displaying 0 for simplicity or extract if saved separately.
      tax: 0,
      total: data.total_amount,
      itemsCount: items.length
    };

  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
};
