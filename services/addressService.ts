
import { supabase } from '../lib/supabase';
import { auth } from './firebaseClient';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

// Mapper functions to translate between DB and UI models
const mapFromDb = (row: any): Address => ({
  id: row.id,
  label: row.label || 'Home',
  fullName: row.full_name,
  phone: row.phone,
  street: row.address_line,
  city: row.city,
  state: row.state,
  zip: row.postal_code,
  country: row.country,
  isDefault: row.is_default,
});

/** Returns current Firebase UID or null */
const getUid = (): string | null => auth.currentUser?.uid ?? null;

/**
 * Fetches all saved addresses for the user.
 */
export const getAddresses = async (): Promise<Address[]> => {
  try {
    const userId = getUid();
    if (!userId) return [];

    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFromDb);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
};

/**
 * Adds a new address to the user's account.
 */
export const addAddress = async (address: Omit<Address, 'id'>): Promise<Address> => {
  try {
    const userId = getUid();
    if (!userId) throw new Error('Not authenticated');

    if (address.isDefault) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await supabase
      .from('user_addresses')
      .insert({
        user_id:      userId,
        full_name:    address.fullName,
        phone:        address.phone,
        address_line: address.street,
        city:         address.city,
        state:        address.state,
        postal_code:  address.zip,
        country:      address.country,
        label:        address.label,
        is_default:   address.isDefault,
      })
      .select()
      .single();

    if (error) throw error;
    return mapFromDb(data);
  } catch (error) {
    console.error('Error adding address:', error);
    throw error;
  }
};

/**
 * Updates an existing address.
 */
export const updateAddress = async (id: string, updates: Partial<Address>): Promise<boolean> => {
  try {
    const userId = getUid();
    if (!userId) throw new Error('Not authenticated');

    if (updates.isDefault === true) {
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const payload: any = {};
    if (updates.fullName  !== undefined) payload.full_name    = updates.fullName;
    if (updates.phone     !== undefined) payload.phone        = updates.phone;
    if (updates.street    !== undefined) payload.address_line = updates.street;
    if (updates.city      !== undefined) payload.city         = updates.city;
    if (updates.state     !== undefined) payload.state        = updates.state;
    if (updates.zip       !== undefined) payload.postal_code  = updates.zip;
    if (updates.country   !== undefined) payload.country      = updates.country;
    if (updates.label     !== undefined) payload.label        = updates.label;
    if (updates.isDefault !== undefined) payload.is_default   = updates.isDefault;

    const { error } = await supabase
      .from('user_addresses')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating address:', error);
    return false;
  }
};

/**
 * Deletes an address.
 */
export const deleteAddress = async (id: string): Promise<boolean> => {
  try {
    const userId = getUid();
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting address:', error);
    return false;
  }
};

/**
 * Sets a specific address as the default shipping location.
 */
export const setDefaultAddress = async (id: string): Promise<boolean> => {
  return updateAddress(id, { isDefault: true });
};
