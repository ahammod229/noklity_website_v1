/**
 * Customer Service (Placeholder)
 * 
 * Handles administrative user management tasks.
 * Designed to be swapped with real Supabase Auth/DB calls later.
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
  avatar?: string;
}

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'CUST-101',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 123-4567',
    ordersCount: 12,
    totalSpent: 4250.00,
    status: 'Active',
    joinedDate: 'Mar 12, 2024',
    lastOrderDate: 'Oct 12, 2024',
    address: '123 Performance Blvd, Speedway City, CA'
  },
  {
    id: 'CUST-102',
    name: 'Sarah Jenkins',
    email: 'sarah.j@auto.net',
    phone: '+1 (555) 987-6543',
    ordersCount: 5,
    totalSpent: 1200.50,
    status: 'Active',
    joinedDate: 'May 05, 2024',
    lastOrderDate: 'Sep 28, 2024',
    address: '456 Tech Lane, Silicon Valley, CA'
  },
  {
    id: 'CUST-103',
    name: 'Robert Fox',
    email: 'robert.fox@foxmail.com',
    phone: '+1 (555) 555-0199',
    ordersCount: 0,
    totalSpent: 0,
    status: 'Blocked',
    joinedDate: 'Aug 21, 2024',
    lastOrderDate: 'N/A',
    address: '789 Maple Drive, Gotham, NY'
  },
  {
    id: 'CUST-104',
    name: 'Diana Prince',
    email: 'diana@themyscira.gov',
    phone: '+1 (555) 222-3333',
    ordersCount: 22,
    totalSpent: 18450.75,
    status: 'Active',
    joinedDate: 'Jan 15, 2024',
    lastOrderDate: 'Oct 10, 2024',
    address: '1 Paradise Island, Greece'
  }
];

/**
 * Fetches all registered customers with filtering options.
 */
export const getCustomers = async (): Promise<Customer[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [...MOCK_CUSTOMERS];
};

/**
 * Toggles a customer's access status.
 */
export const updateCustomerStatus = async (id: string, status: 'Active' | 'Blocked'): Promise<boolean> => {
  console.log(`[Customer Service] Updating status for ${id} to ${status}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  return true;
};

/**
 * Retrieves deep-dive details for a specific customer.
 */
export const getCustomerDetails = async (id: string): Promise<Customer | null> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_CUSTOMERS.find(c => c.id === id) || null;
};
