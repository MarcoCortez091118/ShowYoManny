import { supabase } from '@/lib/supabase';

export interface BorderTheme {
  id: string;
  name: string;
  category: 'Holiday' | 'Special Occasions' | 'Futuristic' | 'Seasonal' | 'Custom';
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBorderThemeData {
  name: string;
  category: BorderTheme['category'];
  description?: string;
  image_url: string;
  thumbnail_url?: string;
  sort_order?: number;
}

export interface UpdateBorderThemeData {
  name?: string;
  category?: BorderTheme['category'];
  description?: string;
  image_url?: string;
  thumbnail_url?: string;
  is_active?: boolean;
  sort_order?: number;
}

export const supabaseBorderThemeService = {
  async getAll(): Promise<BorderTheme[]> {
    const { data, error } = await supabase
      .from('border_themes')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching border themes:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  async getActive(): Promise<BorderTheme[]> {
    const { data, error } = await supabase
      .from('border_themes')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active border themes:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  async getByCategory(category: BorderTheme['category']): Promise<BorderTheme[]> {
    const { data, error } = await supabase
      .from('border_themes')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching border themes by category:', error);
      throw new Error(error.message);
    }

    return data || [];
  },

  async getById(id: string): Promise<BorderTheme | null> {
    const { data, error } = await supabase
      .from('border_themes')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching border theme:', error);
      throw new Error(error.message);
    }

    return data;
  },

  async create(borderTheme: CreateBorderThemeData): Promise<BorderTheme> {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('border_themes')
      .insert({
        ...borderTheme,
        created_by: userData.user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating border theme:', error);
      throw new Error(error.message);
    }

    return data;
  },

  async update(id: string, updates: UpdateBorderThemeData): Promise<BorderTheme> {
    const { data, error } = await supabase
      .from('border_themes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating border theme:', error);
      throw new Error(error.message);
    }

    return data;
  },

  async delete(id: string): Promise<void> {
    const borderTheme = await this.getById(id);

    if (borderTheme?.image_url) {
      const path = borderTheme.image_url.split('/').pop();
      if (path) {
        await supabase.storage.from('media').remove([`borders/${path}`]);
      }
    }

    if (borderTheme?.thumbnail_url) {
      const thumbPath = borderTheme.thumbnail_url.split('/').pop();
      if (thumbPath) {
        await supabase.storage.from('media').remove([`borders/${thumbPath}`]);
      }
    }

    const { error } = await supabase
      .from('border_themes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting border theme:', error);
      throw new Error(error.message);
    }
  },

  async uploadBorderImage(file: File, prefix: string = 'borders'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${prefix}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading border image:', error);
      throw new Error(error.message);
    }

    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  async toggleActive(id: string, isActive: boolean): Promise<BorderTheme> {
    return this.update(id, { is_active: isActive });
  },

  async reorder(themes: { id: string; sort_order: number }[]): Promise<void> {
    const updates = themes.map(theme =>
      supabase
        .from('border_themes')
        .update({ sort_order: theme.sort_order })
        .eq('id', theme.id)
    );

    await Promise.all(updates);
  },
};
