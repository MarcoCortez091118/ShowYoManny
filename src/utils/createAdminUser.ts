import { firebaseApiClient } from "@/integrations/firebase/apiClient";

export const createAdminUser = async () => {
  try {
    const response = await firebaseApiClient.request<{ success: boolean; error?: string }>(
      'auth/create-admin',
      {
        method: 'POST',
        body: {
          email: 'admin@showyo.app',
          password: 'Tank1224',
        },
      }
    );

    if (response.success) {
      console.log('Admin user created successfully');
      return { success: true };
    }

    return { success: false, error: response.error || 'Unknown error' };
  } catch (error) {
    console.error('Failed to create admin user:', error);
    return { success: false, error: 'Network error' };
  }
};