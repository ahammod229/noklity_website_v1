/**
 * Profile Service (Placeholder)
 * 
 * Handles customer profile data operations.
 * Designed to be swapped with real Supabase/API calls later.
 */

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  lastLogin: string;
  memberSince: string;
}

const MOCK_PROFILE: UserProfile = {
  id: 'user-8821',
  fullName: 'Alex Morgan',
  email: 'alex.morgan@example.com',
  phone: '+1 (555) 123-4567',
  lastLogin: 'Today at 10:24 AM',
  memberSince: 'March 2024'
};

/**
 * Retrieves the current user's profile details.
 */
export const getProfile = async (): Promise<UserProfile> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  /*
    TODO: SUPABASE INTEGRATION
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .single();
  */

  return { ...MOCK_PROFILE };
};

/**
 * Updates the user's profile information.
 */
export const updateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
  console.log('[Profile Service] Updating profile with:', updates);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  /*
    TODO: SUPABASE INTEGRATION
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
  */

  return true;
};
