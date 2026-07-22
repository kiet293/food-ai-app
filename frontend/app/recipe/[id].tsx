import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  TextInput,
  KeyboardAvoidingView
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { fetchRecipeDetails, RecipeDetails } from '@/services/exploreService';
const { width } = Dimensions.get('window');
export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recipe' | 'comments'>('recipe');
  const [commentText, setCommentText] = useState('');
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      setIsLoading(true);
      const data = await fetchRecipeDetails(parseInt(id as string, 10));
      setRecipe(data);
      setIsLoading(false);
    };
    loadData();
  }, [id]);
  if (isLoading || !recipe) {
    return (
      <SafeAreaView style={styles.loadingArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color="#ff5a5f" />
      </SafeAreaView>
    );
  }
  // Parse JSON nếu cần (Tuỳ vào cách DB trả về chuỗi hay mảng)
  let ingredientsList: any[] = [];
  let instructionsList: any[] = [];
  try {
    ingredientsList = typeof recipe.ingredients === 'string' ? JSON.parse(recipe.ingredients) : (recipe.ingredients || []);
    instructionsList = typeof recipe.instructions === 'string' ? JSON.parse(recipe.instructions) : (recipe.instructions || []);
  } catch (e) { }
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: recipe.image }} style={styles.heroImage} />

          <View style={styles.heroOverlay}>
            <View style={styles.timeTag}>
              <Feather name="clock" size={14} color="#fff" />
              <Text style={styles.timeText}>{recipe.cook_time_minutes || 15} mins</Text>
            </View>
            <Text style={styles.heroTitle}>{recipe.title.toUpperCase()}</Text>

            <View style={styles.tagsContainer}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>🍰 {recipe.category || 'Dessert'}</Text>
              </View>
            </View>
          </View>
          {/* BACK BUTTON */}
          <TouchableOpacity
            style={[styles.backBtn, { top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 50 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        {/* ACTION BAR */}
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn}>
            <Feather name="bookmark" size={22} color="#f04d4f" />
            <Text style={styles.actionText}>{recipe.save_count || 0}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionBtn}>
            <Feather name="star" size={22} color="#555" />
            <Text style={styles.actionText}>Đánh giá</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionBtn}>
            <Feather name="send" size={22} color="#555" />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
        {/* AUTHOR SECTION */}
        <View style={styles.authorSection}>
          <View style={styles.authorInfoLeft}>
            {recipe.author?.avatar ? (
              <Image source={{ uri: recipe.author.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{recipe.author?.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
            <View>
              <Text style={styles.authorName}>{recipe.author?.name || 'Unknown User'}</Text>
              <Text style={styles.authorHandle}>{recipe.author?.handle || '@user'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.followButton}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>
        {/* TABS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'recipe' && styles.tabBtnActive]}
            onPress={() => setActiveTab('recipe')}
          >
            <Text style={[styles.tabText, activeTab === 'recipe' && styles.tabTextActive]}>công thức</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'comments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('comments')}
          >
            <Text style={[styles.tabText, activeTab === 'comments' && styles.tabTextActive]}>bình luận</Text>
          </TouchableOpacity>
        </View>
        {/* CONTENT */}
        <View style={styles.contentContainer}>
          {activeTab === 'recipe' ? (
            <View>
              {/* ORIGINAL RECIPE BADGE */}
              <View style={styles.originalBadge}>
                <Text style={styles.originalBadgeText}>Original Recipe</Text>
              </View>
              {/* INGREDIENTS */}
              <Text style={styles.sectionTitle}>Nguyên liệu</Text>
              <View style={styles.ingredientsList}>
                {ingredientsList.length > 0 ? ingredientsList.map((ing, idx) => {
                  let parsedIng = ing;
                  if (typeof ing === 'string') {
                    try { parsedIng = JSON.parse(ing); } catch (e) {}
                  }
                  const text = typeof parsedIng === 'string' ? parsedIng : (parsedIng.name || parsedIng.description || JSON.stringify(parsedIng));
                  return (
                    <View key={idx} style={styles.ingredientRow}>
                      <Text style={styles.ingredientDot}>•</Text>
                      <Text style={styles.ingredientText}>{text}</Text>
                    </View>
                  );
                }) : (
                  <Text style={styles.emptyText}>Chưa có thông tin nguyên liệu</Text>
                )}
              </View>
              {/* INSTRUCTIONS */}
              <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Cách làm</Text>
              <View style={styles.instructionsList}>
                {instructionsList.length > 0 ? instructionsList.map((step, idx) => {
                  let parsedStep = step;
                  if (typeof step === 'string') {
                    try { parsedStep = JSON.parse(step); } catch (e) {}
                  }
                  const text = typeof parsedStep === 'string' ? parsedStep : (parsedStep.description || parsedStep.text || JSON.stringify(parsedStep));
                  return (
                    <View key={idx} style={styles.stepRow}>
                      <View style={styles.stepCircle}>
                        <Text style={styles.stepCircleText}>{parsedStep.order || idx + 1}</Text>
                      </View>
                      <View style={styles.stepTextContainer}>
                        <Text style={styles.stepText}>{text}</Text>
                      </View>
                    </View>
                  );
                }) : (
                  <Text style={styles.emptyText}>Chưa có hướng dẫn cách làm</Text>
                )}
              </View>
              <View style={{ height: 60 }} />
            </View>
          ) : (
            <View style={styles.commentsTabContainer}>
              <View style={styles.commentsList}>
                {recipe.comments && recipe.comments.length > 0 ? (
                  recipe.comments.map((comment, idx) => (
                    <View key={idx} style={styles.commentItem}>
                      <View style={styles.commentAvatar}>
                        <Text style={styles.commentAvatarText}>{comment.user?.name?.charAt(0) || 'U'}</Text>
                      </View>
                      <View style={styles.commentContent}>
                        <Text style={styles.commentUser}>{comment.user?.name || 'User'}</Text>
                        <Text style={styles.commentText}>{comment.content}</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
                )}
              </View>
              
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Thêm bình luận..."
                  placeholderTextColor="#999"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.postCommentBtn, !commentText.trim() && { opacity: 0.5 }]}
                  disabled={!commentText.trim()}
                >
                  <Ionicons name="send" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingArea: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    width: width,
    height: width * 1.25, // Khá cao
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tagsContainer: {
    flexDirection: 'row',
  },
  categoryTag: {
    backgroundColor: '#e6f0ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryTagText: {
    color: '#4b7bec',
    fontWeight: 'bold',
    fontSize: 13,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 6,
    color: '#555',
    fontWeight: '600',
    fontSize: 15,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
  },
  authorSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  authorInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff5a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  authorName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#111',
  },
  authorHandle: {
    color: '#888',
    fontSize: 13,
  },
  followButton: {
    backgroundColor: '#ff5a5f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#ff5a5f',
  },
  tabText: {
    color: '#999',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabTextActive: {
    color: '#333',
  },
  contentContainer: {
    backgroundColor: '#fafafa',
    minHeight: 400,
  },
  originalBadge: {
    backgroundColor: '#e0e0e0',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  originalBadgeText: {
    color: '#555',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  ingredientsList: {
    paddingHorizontal: 16,
  },
  ingredientRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  ingredientDot: {
    fontSize: 20,
    color: '#ff5a5f',
    lineHeight: 24,
    marginRight: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 24,
    flex: 1,
  },
  instructionsList: {
    paddingHorizontal: 16,
  },
  stepRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff5a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepCircleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  emptyText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  commentsTabContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'space-between',
  },
  commentsList: {
    padding: 16,
    flex: 1,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff5a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
  },
  postCommentBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff5a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2,
  }
});
