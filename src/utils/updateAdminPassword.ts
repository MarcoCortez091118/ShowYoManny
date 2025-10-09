import { firebaseApiClient } from "@/integrations/firebase/apiClient";

export const updateAdminPassword = async (newPassword: string) => {
  try {
    const response = await firebaseApiClient.request<{ success: boolean; error?: string }>(
      'auth/update-admin-password',
      {
        method: 'POST',
        body: {
          email: 'admin@showyo.app',
          newPassword,
        },
      }
    );

    if (response.success) {
      console.log('Admin password updated successfully');
      return { success: true };
    }

    return { success: false, error: response.error || 'Unknown error' };
  } catch (error) {
    console.error('Failed to update admin password:', error);
    return { success: false, error: 'Network error' };
  }
};
