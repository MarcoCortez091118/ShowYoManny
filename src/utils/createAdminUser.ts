import { supabase } from '@/lib/supabase';

export const createAdminUser = async () => {
  const email = 'marco@showyo.app';
  const password = 'qazwsxQAZqaz#23';

  try {
    console.log('Creating admin user with email:', email);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      console.error('Error during sign up:', signUpError);
      return { success: false, error: signUpError.message };
    }

    if (!authData.user) {
      console.error('No user returned from sign up');
      return { success: false, error: 'No user returned' };
    }

    console.log('User created in auth, ID:', authData.user.id);

    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        display_name: 'Marco',
        roles: ['admin', 'user'],
      });

    if (insertError) {
      console.log('User might already exist in users table, trying update...');

      const { error: updateError } = await supabase
        .from('users')
        .update({
          roles: ['admin', 'user'],
          display_name: 'Marco',
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return { success: false, error: updateError.message };
      }
    }

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('You can now login with these credentials');

    return {
      success: true,
      user: {
        id: authData.user.id,
        email,
        roles: ['admin', 'user'],
      },
    };
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return { success: false, error: error.message || 'Unexpected error' };
  }
};