/**
 * Address Service (Placeholder)
 * 
 * Handles customer shipping address operations.
 * Designed to be swapped with real Supabase/API calls later.
 */

export interface Address {
  id: string;
  label: string; // e.g., 'Home', 'Office'
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

let MOCK_ADDRESSES: Address[] = [
  {
    id: 'addr-1',
    label: 'Home',
    fullName: 'Alex Morgan',
    phone: '+1 (555) 123-4567',
    street: '123 Performance Blvd',
    city: 'Speedway City',
    state: 'CA',
    zip: '90210',
    country: 'United States',
    isDefault: true
  },
  {
    id: 'addr-2',
    label: 'Office',
    fullName: 'Alex Morgan',
    phone: '+1 (555) 987-6543',
    street: '456 Tech Lane, Suite 200',
    city: 'Silicon Valley',
    state: 'CA',
    zip: '94043',
    country: 'United States',
    isDefault: false
  }
];

/**
 * Fetches all saved addresses for the user.
 */
export const getAddresses = async (): Promise<Address[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return [...MOCK_ADDRESSES];
};

/**
 * Adds a new address to the user's account.
 */
export const addAddress = async (address: Omit<Address, 'id'>): Promise<Address> => {
  console.log('[Address Service] Adding new address:', address);
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newAddress = {
    ...address,
    id: 'addr-' + Math.random().toString(36).substr(2, 9)
  };

  if (address.isDefault) {
    MOCK_ADDRESSES = MOCK_ADDRESSES.map(a => ({ ...a, isDefault: false }));
  }
  
  MOCK_ADDRESSES.push(newAddress);
  return newAddress;
};

/**
 * Updates an existing address.
 */
export const updateAddress = async (id: string, updates: Partial<Address>): Promise<boolean> => {
  console.log(`[Address Service] Updating address ${id}:`, updates);
  await new Promise(resolve => setTimeout(resolve, 800));

  if (updates.isDefault) {
    MOCK_ADDRESSES = MOCK_ADDRESSES.map(a => ({ ...a, isDefault: false }));
  }

  MOCK_ADDRESSES = MOCK_ADDRESSES.map(a => 
    a.id === id ? { ...a, ...updates } : a
  );
  
  return true;
};

/**
 * Deletes an address.
 */
export const deleteAddress = async (id: string): Promise<boolean> => {
  console.log(`[Address Service] Deleting address ${id}`);
  await new Promise(resolve => setTimeout(resolve, 500));
  MOCK_ADDRESSES = MOCK_ADDRESSES.filter(a => a.id !== id);
  return true;
};

/**
 * Sets a specific address as the default shipping location.
 */
export const setDefaultAddress = async (id: string): Promise<boolean> => {
  return updateAddress(id, { isDefault: true });
};
