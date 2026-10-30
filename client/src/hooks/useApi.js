import { useCallback, useEffect, useState } from 'react';
import api from '../api/axios.js';

// const { data, loading, error, reload } = useApi('/villages', { district })
export default function useApi(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});

  const load = useCallback(() => {
    if (!url) return;
    setLoading(true);
    setError('');
    api.get(url, { params: JSON.parse(key) })
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load data. Is the server running?'))
      .finally(() => setLoading(false));
  }, [url, key]);

  useEffect(load, [load]);

  return { data, loading, error, reload: load };
}
