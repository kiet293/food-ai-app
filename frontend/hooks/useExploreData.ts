import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchPopularChefs, ChefInfo } from '@/services/user/userService';
import { fetchTrendingRecipes, TrendingRecipeItem } from '@/services/recipe/recipeService';
import { fetchHotTags, TagInfo } from '@/services/tag/tagService';

export function useExploreData() {
  const [chefs, setChefs] = useState<ChefInfo[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<TrendingRecipeItem[]>([]);
  const [hotTags, setHotTags] = useState<TagInfo[]>([]);
  const generation = useRef(0);

  const refreshExplore = useCallback(async () => {
    const current = ++generation.current;
    const [chefsResult, recipesResult, tagsResult] = await Promise.allSettled([
      fetchPopularChefs(), fetchTrendingRecipes(), fetchHotTags(),
    ]);
    if (current !== generation.current) return;
    if (chefsResult.status === 'fulfilled') setChefs(chefsResult.value);
    if (recipesResult.status === 'fulfilled') setTrendingRecipes(recipesResult.value);
    if (tagsResult.status === 'fulfilled') setHotTags(tagsResult.value || []);
  }, []);

  useEffect(() => {
    void refreshExplore();
    return () => { generation.current += 1; };
  }, [refreshExplore]);

  return { chefs, setChefs, trendingRecipes, setTrendingRecipes, hotTags, refreshExplore };
}
