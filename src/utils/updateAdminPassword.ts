import { supabase } from "@/integrations/supabase/client";

export const updateAdminPassword = async (newPassword: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-auth', {
      body: {
        action: 'update_password',
        email: 'admin@showyo.app',
        newPassword
      }
    });

    if (error) {
      console.error('Error updating admin password:', error);
      return { success: false, error: error.message };
    }

    if (data?.success) {
      console.log('Admin password updated successfully');
      return { success: true };
    }

    return { success: false, error: data?.error || 'Unknown error' };
  } catch (error) {
    console.error('Failed to update admin password:', error);
    return { success: false, error: 'Network error' };
  }
};
