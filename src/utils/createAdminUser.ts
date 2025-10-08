import { supabase } from "@/integrations/supabase/client";

export const createAdminUser = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-auth', {
      body: {
        action: 'create_admin',
        email: 'admin@showyo.app',
        password: 'Tank1224'
      }
    });

    if (error) {
      console.error('Error creating admin user:', error);
      return { success: false, error: error.message };
    }

    if (data?.success) {
      console.log('Admin user created successfully');
      return { success: true };
    }

    return { success: false, error: data?.error || 'Unknown error' };
  } catch (error) {
    console.error('Failed to create admin user:', error);
    return { success: false, error: 'Network error' };
  }
};