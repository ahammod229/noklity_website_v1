import { supabase } from '../lib/supabase';
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
  paymentSubmission?: {
    id: string;
    paymentMethod: string;
    transactionReference?: string;
    documentPath?: string;
    status: string;
  };
}

const mapPaymentStatus = (status?: string): 'Paid' | 'Pending' | 'Failed' => {
  if (status === 'paid') return 'Paid';
  if (status === 'failed') return 'Failed';
  return 'Pending';
};

/**
 * Fetches all orders for the admin panel.
 */
export const getAllAdminOrders = async (): Promise<AdminOrderDetail[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        user:users(email, display_name),
        order_items(
          quantity,
          price,
          product:products(id, title, image_url)
        ),
        payment_submissions(
          id,
          payment_method,
          transaction_reference,
          document_path,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((order: any) => {
      const shipping = order.shipping_address || {};
      const submission = order.payment_submissions?.[0];
      return {
        id: order.id,
        customerName: shipping.fullName || 'Guest',
        email: shipping.email || order.user?.email || 'N/A',
        phone: shipping.phone || 'N/A',
        date: new Date(order.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        total: Number(order.total_amount) || 0,
        status: order.status,
        itemsCount: (order.order_items || []).length,
        paymentStatus: mapPaymentStatus(order.payment_status),
        shippingAddress: {
          street: shipping.address || '',
          city: shipping.city || '',
          state: shipping.state || '',
          zip: shipping.zip || '',
          country: shipping.country || ''
        },
        items: (order.order_items || []).map((item: any) => ({
          id: item.product?.id || 'unknown',
          name: item.product?.title || 'Unknown Product',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 0,
          image: item.product?.image_url || ''
        })),
        paymentSubmission: submission ? {
          id: submission.id,
          paymentMethod: submission.payment_method,
          transactionReference: submission.transaction_reference,
          documentPath: submission.document_path,
          status: submission.status
        } : undefined
      };
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    return [];
  }
};

/**
 * Updates the status of an existing order.
 */
export const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating admin order status:', error);
    return false;
  }
};

export const updateOrderPaymentStatus = async (orderId: string, paymentStatus: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId);
    if (error) throw error;
    
    // Also try to update payment_submissions status if it exists
    await supabase
      .from('payment_submissions')
      .update({ status: paymentStatus === 'paid' ? 'approved' : paymentStatus === 'failed' ? 'rejected' : 'pending' })
      .eq('order_id', orderId);
      
    return true;
  } catch (error) {
    console.error('Error updating admin payment status:', error);
    return false;
  }
};

/**
 * Retrieves full details for a single order.
 */
export const getAdminOrderDetails = async (orderId: string): Promise<AdminOrderDetail | null> => {
  const allOrders = await getAllAdminOrders();
  return allOrders.find(o => o.id === orderId) || null;
};
