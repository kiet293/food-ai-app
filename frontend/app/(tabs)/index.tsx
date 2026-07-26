import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getUserProfile } from '@/services/auth/authService';
import useRecentSearches from '@/hooks/useRecentSearches';
import {
  MOCK_COLLECTIONS,
  MOCK_TRENDING_RECIPES,
  MOCK_HOT_TAGS,
  MOCK_EXPLORE_GRID,
  MOCK_POSTS,
  PostItem,
} from '@/services/mock/mockCommunityData';
import { fetchPopularChefs, ChefInfo } from '@/services/user/userService';
import { fetchTrendingRecipes, TrendingRecipeItem } from '@/services/recipe/recipeService';
import { fetchHotTags, TagInfo } from '@/services/tag/tagService';

// Modular Refactored Components
import { HomeHeader } from '@/components/explore/HomeHeader';
import { ExploreSearchBar } from '@/components/explore/ExploreSearchBar';
import { SubTabBar } from '@/components/explore/SubTabBar';
import { AiMealSuggestionBanner } from '@/components/explore/AiMealSuggestionBanner';
import { PopularIngredientsSection, IngredientCard } from '@/components/explore/PopularIngredientsSection';
import { TopCollectionsSection } from '@/components/explore/TopCollectionsSection';
import { PopularChefsSection } from '@/components/explore/PopularChefsSection';
import { TrendingRecipesSection } from '@/components/explore/TrendingRecipesSection';
import { HotTagsSection } from '@/components/explore/HotTagsSection';
import { ExploreGridSection } from '@/components/explore/ExploreGridSection';
import { FollowingFeedSection } from '@/components/explore/FollowingFeedSection';
import { IngredientDetailModal } from '@/components/explore/IngredientDetailModal';
import { CreatePostModal } from '@/components/community/CreatePostModal';
import { CommentModal } from '@/components/community/CommentModal';
import { SharePostModal } from '@/components/community/SharePostModal';

const ingredientCardsData: IngredientCard[] = [
  {
    name: 'Thịt bò',
    image: { uri: 'https://cdn.tgdd.vn/2022/03/CookDish/cach-bao-quan-thit-bo-trong-tu-lanh-va-khong-co-tu-lanh-luu-y-avt-1200x676.jpg' },
    composition: ['Giàu protein chất lượng cao', 'Sắt heme dễ hấp thu', 'Kẽm, vitamin B12, B6'],
    benefits: ['Hỗ trợ tạo máu và giảm thiếu sắt', 'Giúp phục hồi cơ bắp sau vận động', 'Tạo cảm giác no lâu'],
    dishes: ['Bò xào rau củ', 'Phở bò', 'Bò kho', 'Bít tết áp chảo'],
  },
  {
    name: 'Tôm',
    image: { uri: 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=80' },
    composition: ['Protein nạc', 'I-ốt và selen', 'Vitamin B12, omega-3'],
    benefits: ['Tốt cho tuyến giáp', 'Ít béo, phù hợp bữa ăn nhẹ', 'Bổ sung khoáng chất cho cơ thể'],
    dishes: ['Tôm rang me', 'Canh chua tôm', 'Tôm hấp sả', 'Mì xào tôm'],
  },
  {
    name: 'Thịt heo',
    image: { uri: 'https://vavc.edu.vn/uploads/images/255420380_4438273872886334_6849360604609483408_n.jpg' },
    composition: ['Protein', 'Vitamin B1, B3, B6', 'Kẽm và selen'],
    benefits: ['Dễ chế biến, hợp nhiều món', 'Cung cấp năng lượng nhanh', 'Giúp đa dạng khẩu phần bữa ăn'],
    dishes: ['Thịt heo kho tàu', 'Thịt heo rang cháy cạnh', 'Sườn rim', 'Canh bí nấu thịt'],
  },
  {
    name: 'Cà chua',
    image: { uri: 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2021/9/25/tac-dung-cua-ca-chua-doi-voi-suc-khoe-1-1632310636-831-width640height427-1632567723926-16325677242441321628137.jpg' },
    composition: ['Lycopene', 'Vitamin C, K, folate', 'Chất xơ và nước'],
    benefits: ['Hỗ trợ tim mạch và làn da', 'Giúp bữa ăn tươi, dễ tiêu', 'Bổ sung chất chống oxy hóa'],
    dishes: ['Trứng chiên cà chua', 'Canh chua cà chua', 'Mì sốt cà', 'Salad cà chua'],
  },
  {
    name: 'Trứng',
    image: { uri: 'https://suckhoedoisong.qltns.mediacdn.vn/324455921873985536/2025/3/8/photo-1741408427825-17414084285131651116857.jpeg' },
    composition: ['Protein hoàn chỉnh', 'Choline', 'Vitamin A, D, B12'],
    benefits: ['Dễ ăn, dễ nấu', 'Hỗ trợ phát triển cơ và não bộ', 'Phù hợp bữa sáng nhanh'],
    dishes: ['Trứng ốp la', 'Trứng chiên', 'Trứng kho thịt', 'Canh trứng cà chua'],
  },
  {
    name: 'Khoai tây',
    image: { uri: 'https://hongngochospital.vn/wp-content/uploads/2020/02/dinh-duong-tu-khoai-tay.jpg' },
    composition: ['Tinh bột', 'Vitamin C, B6', 'Kali và chất xơ'],
    benefits: ['Cung cấp năng lượng nhanh', 'No lâu, dễ kết hợp món mặn', 'Hợp nhiều kiểu chế biến'],
    dishes: ['Khoai tây nghiền', 'Khoai tây xào', 'Canh khoai tây hầm', 'Bò hầm khoai tây'],
  },
];

export default function HomeScreen() {
  const [userAvatar, setUserAvatar] = useState<string>('👨‍🍳');
  const [userInfo, setUserInfo] = useState<{ full_name: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'GLOBAL' | 'FOLLOWING'>('GLOBAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Tất Cả');
  const [selectedIngredient, setSelectedIngredient] = useState<IngredientCard | null>(null);

  const { items: recentItems, remove: removeRecent } = useRecentSearches();

  const [posts, setPosts] = useState<PostItem[]>(MOCK_POSTS);
  const [chefs, setChefs] = useState<ChefInfo[]>([]);
  const [trendingRecipes, setTrendingRecipes] = useState<TrendingRecipeItem[]>([]);
  const [hotTags, setHotTags] = useState<TagInfo[]>([]);

  useEffect(() => {
    const loadTags = async () => {
      const tags = await fetchHotTags();
      if (tags) setHotTags(tags);
    };
    const loadChefs = async () => {
      const popularChefs = await fetchPopularChefs();
      if (popularChefs.length > 0) setChefs(popularChefs);
    };
    const loadTrending = async () => {
      const trending = await fetchTrendingRecipes();
      if (trending.length > 0) setTrendingRecipes(trending);
    };
    loadTags();
    loadChefs();
    loadTrending();
  }, []);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [activePostForModal, setActivePostForModal] = useState<PostItem | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshTrigger(prev => prev + 1);
    // Fake loading delay for other mock sections
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const loadProfile = async () => {
        const profile = await getUserProfile();
        if (profile && isActive) {
          setUserInfo(profile);
          setUserAvatar(profile.avatar || '👨‍🍳');
        }
      };
      loadProfile();
      return () => {
        isActive = false;
      };
    }, [])
  );

  const toggleFollowChef = (chefId: string) => {
    setChefs((prev) =>
      prev.map((c) => (c.id === chefId ? { ...c, isFollowing: !c.isFollowing } : c))
    );
  };

  const toggleSavePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isSaved = !p.isSaved;
          return { ...p, isSaved, savesCount: isSaved ? p.savesCount + 1 : p.savesCount - 1 };
        }
        return p;
      })
    );
  };

  const toggleCookedPost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isCooked = !p.isCooked;
          return { ...p, isCooked, cookedCount: isCooked ? p.cookedCount + 1 : p.cookedCount - 1 };
        }
        return p;
      })
    );
  };

  const toggleSaveTrending = (id: string | number) => {
    setTrendingRecipes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, saved: !t.saved } : t))
    );
  };

  const handlePostCreated = (newPostData: {
    title: string;
    description: string;
    images: string[];
    tags: string[];
  }) => {
    const createdItem: PostItem = {
      id: `post-${Date.now()}`,
      author: {
        id: 'user-me',
        name: userInfo?.full_name || 'Tôi (Chef)',
        avatar: userAvatar.startsWith('http')
          ? userAvatar
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        verified: true,
      },
      timeAgo: 'Vừa xong',
      title: newPostData.title.toUpperCase(),
      description: newPostData.description,
      images: newPostData.images,
      savesCount: 0,
      isSaved: false,
      cookedCount: 0,
      isCooked: false,
      commentsCount: 0,
      sharesCount: 0,
      tags: newPostData.tags,
    };
    setPosts([createdItem, ...posts]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Header Cá Nhân */}
      <HomeHeader userAvatar={userAvatar} fullName={userInfo?.full_name || 'Đầu Bếp Tại Gia'} />

      {/* Thanh Tìm Kiếm Đa Năng */}
      <ExploreSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        recentItems={recentItems}
        removeRecent={removeRecent}
      />

      {/* Sub Tab Switcher: GLOBAL | FOLLOWING */}
      <SubTabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      {activeTab === 'GLOBAL' ? (
        <ScrollView 
          style={styles.contentScroll} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
          }
        >
          {/* AI Meal Suggestion Banner */}
          <AiMealSuggestionBanner />

          <PopularIngredientsSection
            ingredientCards={ingredientCardsData}
            onSelectIngredient={setSelectedIngredient}
          />
          <TopCollectionsSection collections={MOCK_COLLECTIONS} />
          <PopularChefsSection chefs={chefs} toggleFollowChef={toggleFollowChef} />
          <TrendingRecipesSection
            trendingRecipes={trendingRecipes}
            toggleSaveTrending={toggleSaveTrending}
          />
          <HotTagsSection
            tags={hotTags.length > 0 ? hotTags.map(t => t.name) : MOCK_HOT_TAGS}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
          />
          <ExploreGridSection refreshTrigger={refreshTrigger} />

          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        <FollowingFeedSection
          posts={posts}
          toggleSavePost={toggleSavePost}
          toggleCookedPost={toggleCookedPost}
          onOpenComments={(post) => {
            setActivePostForModal(post);
            setIsCommentModalOpen(true);
          }}
          onOpenShare={(post) => {
            setActivePostForModal(post);
            setIsShareModalOpen(true);
          }}
        />
      )}

      {/* Nút Floating Action Button (+) */}
      <TouchableOpacity
        style={styles.fabBtn}
        activeOpacity={0.8}
        onPress={() => setIsCreateModalOpen(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Modals */}
      <CreatePostModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
      <CommentModal
        visible={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        postTitle={activePostForModal?.title}
      />
      <SharePostModal
        visible={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        postTitle={activePostForModal?.title}
      />
      <IngredientDetailModal
        selectedIngredient={selectedIngredient}
        onClose={() => setSelectedIngredient(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contentScroll: {
    flex: 1,
  },
  fabBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});