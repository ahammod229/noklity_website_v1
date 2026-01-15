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

// Extended types for UI consumption (mocking DB joins)
export interface OrderDetail extends Order {
  shippingAddress: any;
  paymentMethod: string;
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
}

/**
 * Creates a new order.
 * 
 * @param orderData - The order details
 * @returns Promise resolving to the created order ID
 */
export const createOrder = async (orderData: OrderData): Promise<{ success: boolean; orderId: string }> => {
  // MOCK BEHAVIOR
  console.log('-----------------------------------');
  console.log('MOCK: Creating Order');
  console.log('Customer:', orderData.shipping.fullName);
  console.log('Items:', orderData.items.length);
  console.log('Total:', orderData.total);
  console.log('Payment:', orderData.paymentMethod);
  console.log('-----------------------------------');

  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 2000));

  /* 
    TODO: SUPABASE INTEGRATION
    1. Validate session/user (if logged in)
    2. Start Transaction (if using RPC) or sequential inserts
    3. Insert into 'orders' table:
       const { data, error } = await supabase
         .from('orders')
         .insert({ 
           user_id: user.id, 
           total: orderData.total, 
           status: 'Pending',
           shipping_address: orderData.shipping 
         })
         .select()
         .single();
    4. Insert into 'order_items' table for each item in orderData.items
    5. Handle stock decrement in 'products' table
  */

  // Generate a random mock order ID
  const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  return {
    success: true,
    orderId,
  };
};

/**
 * Retrieves a list of orders for the current user.
 * 
 * @returns Promise resolving to an array of orders
 */
export const getOrders = async (): Promise<any[]> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 1000));

  /*
    TODO: SUPABASE INTEGRATION
    1. Get current user ID
    2. Fetch orders:
       const { data, error } = await supabase
         .from('orders')
         .select('*, order_items(*, products(*))')
         .eq('user_id', user.id)
         .order('created_at', { ascending: false });
  */

  // MOCK RETURN DATA (Matching Orders.tsx expectation)
  return [
    { 
        id: 'ORD-9921', 
        date: 'Oct 12, 2024', 
        total: 1265.00, 
        status: 'Processing', 
        itemCount: 2,
        previewName: 'Brembo GT Braking System Kit',
        previewImage: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop'
      },
      { 
        id: 'ORD-8842', 
        date: 'Sep 28, 2024', 
        total: 89.00, 
        status: 'Delivered', 
        itemCount: 1,
        previewName: 'Sparco Racing Gloves',
        previewImage: 'https://images.unsplash.com/photo-1599951304911-37d044439031?q=80&w=2787&auto=format&fit=crop'
      },
      { 
        id: 'ORD-7735', 
        date: 'Sep 15, 2024', 
        total: 2450.50, 
        status: 'Shipped', 
        itemCount: 4,
        previewName: 'Garrett G-Series Turbocharger',
        previewImage: 'https://images.unsplash.com/photo-1606775089350-f1c5039535eb?q=80&w=2940&auto=format&fit=crop'
      }
  ];
};

/**
 * Retrieves details for a specific order by ID.
 * 
 * @param id - The order ID
 * @returns Promise resolving to the order details
 */
export const getOrderById = async (id: string): Promise<OrderDetail | null> => {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  /*
    TODO: SUPABASE INTEGRATION
    1. Fetch order with joins:
       const { data, error } = await supabase
         .from('orders')
         .select('*, order_items(*, products(*))')
         .eq('id', id)
         .single();
  */

  // MOCK RETURN DATA (Matching OrderDetails.tsx expectation)
  return {
    id: id || 'ORD-7782',
    customerName: 'Alex Morgan',
    email: 'alex@example.com',
    date: 'October 12, 2024',
    status: 'Shipped', // Type cast for mock
    paymentMethod: 'Visa ending in 4242',
    shippingAddress: {
      name: 'Alex Morgan',
      street: '123 Performance Blvd',
      city: 'Speedway City',
      state: 'CA',
      zip: '90210',
      country: 'United States'
    },
    items: [
      {
        id: '101',
        name: 'Brembo GT Braking System Kit',
        category: 'Brakes',
        price: 1250.00,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1626438061453-623e1987d603?q=80&w=2940&auto=format&fit=crop'
      },
      {
        id: '108',
        name: 'K&N High-Flow Air Filter',
        category: 'Engine',
        price: 65.99,
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1508209803874-51e443831844?q=80&w=2940&auto=format&fit=crop'
      }
    ],
    subtotal: 1381.98,
    shipping: 25.00,
    tax: 110.56,
    total: 1517.54,
    itemsCount: 3
  } as unknown as OrderDetail;
};