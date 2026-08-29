
import { supabase } from '../lib/supabase';
import { auth } from './firebaseClient';
import { createNotification } from './notificationService';
import { CartItem, Order } from '../types';
import { getTenantConfig } from './tenantConfigService';
import { getShortOrderId } from '../utils/orderId';

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
  paymentMethod: 'bkash' | 'nogad' | 'bank_transfer';
  total: number;
}

// Extended types for UI consumption
export interface OrderDetail extends Order {
  shippingAddress: any;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed';
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  deliveryProvider?: 'steadfast' | 'manual' | null;
  deliveryConsignmentId?: string | null;
  deliveryTrackingCode?: string | null;
  deliveryTrackingUrl?: string | null;
  deliveryStatus?:
    | 'not_created'
    | 'created'
    | 'pending_pickup'
    | 'picked'
    | 'in_transit'
    | 'delivered'
    | 'cancelled'
    | 'failed'
    | 'unknown';
  deliveryLastSyncedAt?: string | null;
}

const mapPaymentMethodLabel = (paymentMethod: string) => {
  switch (paymentMethod) {
    case 'bkash':
      return 'bKash';
    case 'nogad':
      return 'Nogad';
    case 'bank_transfer':
      return 'Bank Transfer';
    case 'cod':
      return 'Cash on Delivery';
    case 'card':
      return 'Card';
    default:
      return paymentMethod || 'Unknown';
  }
};

/**
 * Creates a new order using Supabase RPC for transaction safety.
 */
export const createOrder = async (orderData: OrderData): Promise<{ success: boolean; orderId: string }> => {
  try {
    const tenantConfig = await getTenantConfig();
    const featureMap = tenantConfig.featureFlags;
    if (!featureMap.catalog_public) {
      throw new Error('Ordering is currently unavailable for this plan.');
    }
    if (orderData.paymentMethod === 'bkash' && !featureMap.payment_bkash) {
      throw new Error('bKash payment is disabled for this plan.');
    }
    if (orderData.paymentMethod === 'nogad' && !featureMap.payment_nogad) {
      throw new Error('Nogad payment is disabled for this plan.');
    }
    if (orderData.paymentMethod === 'bank_transfer' && !featureMap.payment_bank_transfer) {
      throw new Error('Bank transfer is disabled for this plan.');
    }

    const currentFirebaseUser = auth.currentUser;
    const isGuestCheckout = !currentFirebaseUser;
    if (isGuestCheckout && !featureMap.checkout_guest) {
      throw new Error('Guest checkout is disabled. Please sign in to place an order.');
    }

    const quantityByProduct = new Map<string, { name: string; quantity: number }>();
    for (const item of orderData.items) {
      const current = quantityByProduct.get(item.id);
      if (current) {
        current.quantity += Number(item.quantity || 0);
      } else {
        quantityByProduct.set(item.id, {
          name: item.name || 'Product',
          quantity: Number(item.quantity || 0)
        });
      }
    }

    const productIds = Array.from(quantityByProduct.keys());
    if (productIds.length === 0) {
      throw new Error('Cart is empty. Please add products before checkout.');
    }

    const { data: productRows, error: productError } = await supabase
      .from('products')
      .select('id,title,stock,status,is_active')
      .in('id', productIds);

    if (productError) {
      throw new Error(`Unable to validate stock: ${productError.message}`);
    }

    const productMap = new Map<string, any>();
    for (const row of productRows || []) {
      productMap.set(String(row.id), row);
    }

    const stockIssues: string[] = [];
    for (const [productId, payload] of quantityByProduct.entries()) {
      const row = productMap.get(productId);
      const productName = row?.title || payload.name;
      const requestedQty = Math.max(0, Number(payload.quantity || 0));
      const availableStock = Math.max(0, Number(row?.stock || 0));
      const inactive = row?.is_active === false || (row?.status && row?.status !== 'active');

      if (!row || inactive || availableStock <= 0) {
        stockIssues.push(`${productName} is out of stock.`);
        continue;
      }

      if (requestedQty < 1) {
        stockIssues.push(`${productName} has an invalid quantity.`);
        continue;
      }

      if (availableStock < requestedQty) {
        stockIssues.push(`${productName} has only ${availableStock} item(s) left.`);
      }
    }

    if (stockIssues.length > 0) {
      throw new Error(stockIssues.slice(0, 3).join(' '));
    }

    // User profile is already synced to the users table by AuthContext on login.

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

    // Fire-and-forget: send "Order Placed" notification
    const currentUser = auth.currentUser;
    if (currentUser?.uid && data) {
      const shortId = getShortOrderId(data);
      createNotification({
        user_id: currentUser.uid,
        title: 'Order Placed Successfully!',
        message: `Your order #${shortId} has been placed. We'll notify you when it's being processed.`,
        type: 'order_placed',
        link: `/orders/${data}`,
      }).catch(() => {}); // silent fail
    }

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
    if (!sessionData.session?.user && !auth.currentUser) return [];

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

    const mapPaymentStatus = (status?: string) => {
      if (status === 'paid') return 'Paid';
      if (status === 'failed') return 'Failed';
      return 'Pending';
    };

    return data.map((order: any) => {
      const firstItem = order.items?.[0];
      const firstProduct = firstItem?.product;
      
      return {
        id: order.id,
        displayId: getShortOrderId(order.id),
        date: new Date(order.created_at).toLocaleDateString(),
        total: order.total_amount,
        status: order.status,
        itemCount: order.items?.length || 0,
        previewName: firstProduct?.title || 'Unknown Product',
        previewImage: firstProduct?.image_url || '',
        paymentStatus: mapPaymentStatus(order.payment_status),
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
    // UI shows a short 13-digit display ID, but backend lookups always use UUID.
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

    const paymentStatus = data.payment_status === 'paid'
      ? 'Paid'
      : data.payment_status === 'failed'
        ? 'Failed'
        : 'Pending';

    return {
      id: data.id,
      customerName: shipping?.fullName || 'Customer',
      email: shipping?.email || '',
      date: new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      status: data.status as any,
      paymentMethod: mapPaymentMethodLabel(data.payment_method),
      paymentStatus,
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
      itemsCount: items.length,
      deliveryProvider: data.delivery_provider || null,
      deliveryConsignmentId: data.delivery_consignment_id || null,
      deliveryTrackingCode: data.delivery_tracking_code || null,
      deliveryTrackingUrl: data.delivery_tracking_url || null,
      deliveryStatus: data.delivery_status || 'not_created',
      deliveryLastSyncedAt: data.delivery_last_synced_at || null
    };

  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
};
