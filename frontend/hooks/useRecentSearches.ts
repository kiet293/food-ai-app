import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@recent_searches_v1';
const MAX = 4;

export default function useRecentSearches() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const s = await AsyncStorage.getItem(KEY);
        if (s) setItems(JSON.parse(s));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const persist = async (list: string[]) => {
    setItems(list);
    try {
      await AsyncStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  };

  const addSearch = async (term: string) => {
    const t = term.trim();
    if (!t) return;
    const dedup = [t, ...items.filter((i) => i !== t)].slice(0, MAX);
    await persist(dedup);
  };

  const remove = async (term: string) => {
    await persist(items.filter((i) => i !== term));
  };

  const clear = async () => {
    await persist([]);
  };

  return { items, addSearch, remove, clear } as const;
}
