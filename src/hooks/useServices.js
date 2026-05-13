import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';

export default function useServices({ categoryId = 'all', limit = 20, providerId = null } = {}) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, [categoryId, providerId]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('services')
        .select(`
          *,
          provider:profiles(
            id, full_name, avatar_url,
            nin_verified, photo_verified,
            city, state, rating
          )
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }

      if (providerId) {
        query = query.eq('provider_id', providerId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error('useServices error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  return { services, loading, refreshing, error, refresh };
}