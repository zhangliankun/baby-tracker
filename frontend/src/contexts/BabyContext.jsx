import { createContext, useContext, useState, useCallback } from 'react';
import { babyAPI } from '../services/api';

const BabyContext = createContext(null);

export function BabyProvider({ children }) {
  const [baby, setBaby] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchBaby = useCallback(async () => {
    setLoading(true);
    try {
      const res = await babyAPI.get();
      if (res.success) {
        setBaby(res.data);
        localStorage.setItem('baby', JSON.stringify(res.data));
      }
    } catch (err) {
      console.error('获取婴儿档案失败:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBaby = useCallback(async (data) => {
    const res = await babyAPI.update(data);
    if (res.success) {
      setBaby(res.data);
      localStorage.setItem('baby', JSON.stringify(res.data));
    }
    return res;
  }, []);

  return (
    <BabyContext.Provider value={{ baby, loading, fetchBaby, updateBaby, setBaby }}>
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby() {
  const context = useContext(BabyContext);
  if (!context) throw new Error('useBaby must be used within BabyProvider');
  return context;
}

export default BabyContext;
