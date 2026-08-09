import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  ScrollView,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Modal,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { fetchRecipeDetails, RecipeDetails } from '@/services/recipe/recipeService';
import { postRecipeComment, postRecipeRating, CommentInfo, followUser, unfollowUser } from '@/services/community/communityService';
const { width } = Dimensions.get('window');
export default function RecipeDetailScreen() {
  const router = useRouter();
  const { id, tab } = useLocalSearchParams<{ id: string; tab?: string }>();

  const [recipe, setRecipe] = useState<RecipeDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recipe' | 'comments'>(tab === 'comments' ? 'comments' : 'recipe');
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [followLoading, setFollowLoading] = useState(false);

  const toggleIngredient = (idx: number) => {
    setCheckedIngredients(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleToggleFollow = async () => {
    if (!recipe || !recipe.author || followLoading) return;
    setFollowLoading(true);
    const authorId = recipe.author.id;
    const isFollowing = recipe.author.is_following;
    try {
      if (isFollowing) {
        const success = await unfollowUser(authorId);
        if (success) {
          setRecipe(prev => {
            if (!prev || !prev.author) return prev;
            return {
              ...prev,
              author: { ...prev.author, is_following: false }
            };
          });
        }
      } else {
        const success = await followUser(authorId);
        if (success) {
          setRecipe(prev => {
            if (!prev || !prev.author) return prev;
            return {
              ...prev,
              author: { ...prev.author, is_following: true }
            };
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFollowLoading(false);
    }
  };

  const loadData = async () => {
    if (!id) return;
    const data = await fetchRecipeDetails(parseInt(id as string, 10));
    setRecipe(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Polling every 5 seconds to get new comments
    const interval = setInterval(() => {
      if (id) {
        fetchRecipeDetails(parseInt(id as string, 10)).then(data => {
          if (data) setRecipe(data);
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  const handlePostComment = async () => {
    if (!commentText.trim() || !recipe || isPosting) return;
    setIsPosting(true);

    const recipeId = parseInt(id as string, 10);
    const parentId = replyTo ? replyTo.id : undefined;

    // Optimistic UI Update (Cập nhật tạm thời lên màn hình)
    const tempComment: CommentInfo = {
      id: Math.random(), // ID tạm
      content: commentText.trim(),
      created_at: new Date().toISOString(),
      user: { id: 0, name: 'You', handle: 'you', avatar: '' }, // Thông tin giả định
      is_author: false,
      replies: []
    };

    setRecipe(prev => {
      if (!prev) return prev;
      const newComments = [...(prev.comments || [])];

      if (parentId) {
        // Tìm comment cha để nhét vào (Chỉ hỗ trợ đệ quy 1 tầng tìm kiếm tạm thời)
        const addReply = (comments: CommentInfo[]) => {
          for (let c of comments) {
            if (c.id === parentId) {
              c.replies = c.replies ? [...c.replies, tempComment] : [tempComment];
              return true;
            }
            if (c.replies && addReply(c.replies)) return true;
          }
          return false;
        };
        addReply(newComments);
      } else {
        newComments.push(tempComment);
      }

      return { ...prev, comments: newComments };
    });

    setCommentText('');
    setReplyTo(null);

    // Gửi API thật
    await postRecipeComment(recipeId, tempComment.content, parentId);

    // Sau khi POST xong thì load lại data chuẩn từ server
    await loadData();
    setIsPosting(false);
  };

  const handleSubmitRating = async () => {
    if (selectedRating === 0 || !id) return;
    setIsSubmittingRating(true);
    
    const recipeId = parseInt(id as string, 10);
    const success = await postRecipeRating(recipeId, selectedRating, ratingComment);
    
    setIsSubmittingRating(false);
    setIsRatingModalVisible(false);
    
    if (success) {
      Alert.alert("Thành công", "Cảm ơn bạn đã gửi đánh giá công thức!");
      loadData(); // Tải lại để cập nhật điểm
    } else {
      Alert.alert("Lỗi", "Không thể gửi đánh giá lúc này, vui lòng thử lại sau.");
    }
  };

  const renderComment = (comment: CommentInfo, depth: number = 0, isLast: boolean = true) => {
    return (
      <View key={comment.id} style={{ marginBottom: 16, position: 'relative' }}>
        {depth > 0 && (
          <>
            {/* Đường thẳng đứng nối xuống bình luận tiếp theo (nếu không phải bình luận cuối cùng) */}
            {!isLast && (
              <View style={{
                position: 'absolute',
                left: -24,
                top: 18,
                bottom: -16,
                borderLeftWidth: 2,
                borderColor: '#ddd'
              }} />
            )}

            {/* Đường cong (chữ L) chĩa vào avatar */}
            <View style={{
              position: 'absolute',
              left: -24,
              top: 0,
              width: 24,
              height: 18,
              borderLeftWidth: 2,
              borderBottomWidth: 2,
              borderColor: '#ddd',
              borderBottomLeftRadius: 12,
            }} />
          </>
        )}

        <View style={styles.commentItem}>
          {comment.user?.avatar ? (
            <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatarImage} />
          ) : (
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>{comment.user?.name?.charAt(0) || 'U'}</Text>
            </View>
          )}
          <View style={styles.commentContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.commentUser}>{comment.user?.name || 'User'}</Text>
              {comment.is_author && (
                <View style={styles.authorBadge}>
                  <Text style={styles.authorBadgeText}>Tác giả</Text>
                </View>
              )}
            </View>
            <Text style={styles.commentText}>{comment.content}</Text>
            <TouchableOpacity
              style={{ marginTop: 4 }}
              onPress={() => setReplyTo({ id: comment.id, name: comment.user?.name || 'User' })}
            >
              <Text style={styles.replyBtnText}>Trả lời</Text>
            </TouchableOpacity>
          </View>
        </View>
        {comment.replies && comment.replies.length > 0 && (
          <View style={{ marginTop: 8, marginLeft: 42 }}>
            {comment.replies.map((reply, index) =>
              renderComment(reply, depth + 1, index === comment.replies!.length - 1)
            )}
          </View>
        )}
      </View>
    );
  };
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

      <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ flex: 1 }}>
        {/* HERO SECTION */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: recipe.image }} style={styles.heroImage} />
          {/* BACK BUTTON */}
          <TouchableOpacity
            style={[styles.backBtn, { top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 12 : 50 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* FLOATING TITLE OVERLAP CARD */}
        <View style={styles.floatingTitleCard}>
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>🍰 {recipe.category || 'Món ăn'}</Text>
            </View>
            <View style={styles.timeBadge}>
              <Feather name="clock" size={14} color="#666" style={{ marginRight: 4 }} />
              <Text style={styles.timeBadgeText}>{recipe.cook_time_minutes || 15} phút</Text>
            </View>
          </View>
          
          <Text style={styles.recipeTitleText}>{recipe.title}</Text>
        </View>

        {/* ACTION BAR CAPSULE */}
        <View style={styles.floatingActionBar}>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="bookmark" size={20} color="#fe2c55" />
            <Text style={styles.actionText}>{recipe.save_count || 0} Đã lưu</Text>
          </TouchableOpacity>
          <View style={styles.actionBarDivider} />
          
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedRating(0); setRatingComment(''); setIsRatingModalVisible(true); }}>
            <Ionicons name="star" size={20} color="#F4B400" />
            <Text style={styles.actionText}>
              {recipe.ratings_avg ? recipe.ratings_avg.toFixed(1) : "5.0"} 
              <Text style={styles.actionTextSub}> ({recipe.ratings_count || 0})</Text>
            </Text>
          </TouchableOpacity>
          <View style={styles.actionBarDivider} />
          
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="share-social-outline" size={20} color="#444" />
            <Text style={styles.actionText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>

        {/* AUTHOR CARD SECTION */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <View style={styles.authorCard}>
            <View style={styles.authorInfoLeft}>
              {recipe.author?.avatar ? (
                <Image source={{ uri: recipe.author.avatar }} style={styles.authorAvatar} />
              ) : (
                <View style={styles.authorAvatarPlaceholder}>
                  <Text style={styles.authorAvatarText}>{recipe.author?.name?.charAt(0) || 'U'}</Text>
                </View>
              )}
              <View>
                <Text style={styles.authorNameText}>{recipe.author?.name || 'Đầu bếp'}</Text>
                <Text style={styles.authorHandleText}>{recipe.author?.handle || '@user'}</Text>
              </View>
            </View>
            {!recipe.author?.is_self && (
              <TouchableOpacity
                style={[
                  styles.followBtn,
                  recipe.author?.is_following && styles.followingBtn
                ]}
                onPress={handleToggleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={recipe.author?.is_following ? "#888" : "#fff"} />
                ) : (
                  <Text style={[
                    styles.followBtnText,
                    recipe.author?.is_following && styles.followingBtnText
                  ]}>
                    {recipe.author?.is_following ? 'Đang follow' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* SEGMENTED CONTROL TABS */}
        <View style={styles.segmentedTabContainer}>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'recipe' && styles.segmentTabActive]}
            onPress={() => setActiveTab('recipe')}
          >
            <Text style={[styles.segmentTabText, activeTab === 'recipe' && styles.segmentTabTextActive]}>Công thức</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentTab, activeTab === 'comments' && styles.segmentTabActive]}
            onPress={() => setActiveTab('comments')}
          >
            <Text style={[styles.segmentTabText, activeTab === 'comments' && styles.segmentTabTextActive]}>Bình luận</Text>
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        <View style={styles.contentContainer}>
          {activeTab === 'recipe' ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {/* ORIGINAL RECIPE BADGE */}
              <View style={styles.originalBadge}>
                <Ionicons name="ribbon-outline" size={16} color="#e056fd" style={{ marginRight: 4 }} />
                <Text style={styles.originalBadgeText}>Công thức độc quyền</Text>
              </View>

              {/* INGREDIENTS INTERACTIVE CHECKLIST */}
              <Text style={styles.sectionTitle}>Nguyên liệu cần chuẩn bị</Text>
              <View style={styles.ingredientsBox}>
                {ingredientsList.length > 0 ? ingredientsList.map((ing, idx) => {
                  let parsedIng = ing;
                  if (typeof ing === 'string') {
                    try { parsedIng = JSON.parse(ing); } catch (e) { }
                  }
                  const text = typeof parsedIng === 'string' ? parsedIng : (parsedIng.name || parsedIng.description || JSON.stringify(parsedIng));
                  const isChecked = !!checkedIngredients[idx];
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.ingredientCheckRow}
                      onPress={() => toggleIngredient(idx)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isChecked ? "checkbox" : "square-outline"}
                        size={20}
                        color={isChecked ? "#fe2c55" : "#888"}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={[styles.ingredientText, isChecked && styles.ingredientTextChecked]}>
                        {text}
                      </Text>
                    </TouchableOpacity>
                  );
                }) : (
                  <Text style={styles.emptyText}>Chưa có thông tin nguyên liệu</Text>
                )}
              </View>

              {/* INSTRUCTIONS STEP CARDS */}
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Hướng dẫn các bước nấu</Text>
              <View style={styles.stepsBox}>
                {instructionsList.length > 0 ? instructionsList.map((step, idx) => {
                  let parsedStep = step;
                  if (typeof step === 'string') {
                    try { parsedStep = JSON.parse(step); } catch (e) { }
                  }
                  const text = typeof parsedStep === 'string' ? parsedStep : (parsedStep.description || parsedStep.text || JSON.stringify(parsedStep));
                  const isCompleted = !!completedSteps[idx];
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.stepCard, isCompleted && styles.stepCardCompleted]}
                      onPress={() => toggleStep(idx)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.stepHeaderRow}>
                        <Text style={[styles.stepNumberText, isCompleted && styles.stepNumberTextCompleted]}>
                          {String(idx + 1).padStart(2, '0')}
                        </Text>
                        <Ionicons
                          name={isCompleted ? "checkmark-circle" : "ellipse-outline"}
                          size={22}
                          color={isCompleted ? "#2ec4b6" : "#ccc"}
                        />
                      </View>
                      <Text style={[styles.stepTextContent, isCompleted && styles.stepTextContentCompleted]}>
                        {text}
                      </Text>
                    </TouchableOpacity>
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
                  recipe.comments.map(comment => renderComment(comment, 0))
                ) : (
                  <Text style={styles.emptyText}>Chưa có bình luận nào. Hãy là người đầu tiên!</Text>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* RATING MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isRatingModalVisible}
        onRequestClose={() => setIsRatingModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Đánh giá công thức</Text>
              <Text style={styles.modalSubtitle}>Bạn cảm thấy món ăn này thế nào?</Text>

              <View style={styles.starsSelectionRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setSelectedRating(star)} activeOpacity={0.7} style={styles.starBtn}>
                    <Ionicons
                      name={selectedRating >= star ? "star" : "star-outline"}
                      size={40}
                      color={selectedRating >= star ? "#FFD700" : "#ccc"}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.ratingTextInput}
                placeholder="Chia sẻ thêm cảm nhận của bạn (Không bắt buộc)..."
                value={ratingComment}
                onChangeText={setRatingComment}
                multiline
                textAlignVertical="top"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalCancelBtn]}
                  onPress={() => setIsRatingModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalSubmitBtn, selectedRating === 0 && { opacity: 0.5 }]}
                  disabled={selectedRating === 0 || isSubmittingRating}
                  onPress={handleSubmitRating}
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Gửi đánh giá</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* FOOTER INPUT FOR COMMENTS */}
      {activeTab === 'comments' && (
        <View style={styles.commentInputWrapper}>
          {replyTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>Đang trả lời {replyTo.name}</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder={replyTo ? "Viết câu trả lời..." : "Thêm bình luận..."}
              placeholderTextColor="#999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.postCommentBtn, (!commentText.trim() || isPosting) && { opacity: 0.5 }]}
              disabled={!commentText.trim() || isPosting}
              onPress={handlePostComment}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  loadingArea: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroContainer: {
    width: width,
    height: width * 0.95, // Giảm chiều cao xuống một chút để cân bằng tỉ lệ 4:3 đẹp mắt hơn
    position: 'relative',
    backgroundColor: '#000',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  floatingTitleCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    marginTop: -28, // Đè nhẹ lên ảnh bìa
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    backgroundColor: '#f0f3ff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 12,
  },
  categoryBadgeText: {
    color: '#3b5998',
    fontWeight: '700',
    fontSize: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  timeBadgeText: {
    color: '#555',
    fontSize: 12,
    fontWeight: '600',
  },
  recipeTitleText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1a1a1a',
    lineHeight: 32,
    letterSpacing: 0.2,
  },
  floatingActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 14,
    paddingVertical: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionText: {
    marginLeft: 6,
    color: '#222',
    fontWeight: '700',
    fontSize: 14,
  },
  actionTextSub: {
    fontWeight: '500',
    color: '#777',
    fontSize: 12,
  },
  actionBarDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#eee',
  },
  authorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1f2f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  authorInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  authorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fe2c55',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  authorNameText: {
    fontWeight: '800',
    fontSize: 15,
    color: '#1a1a1a',
  },
  authorHandleText: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: '#fe2c55',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  followingBtn: {
    backgroundColor: '#f1f2f5',
  },
  followingBtnText: {
    color: '#555',
  },
  segmentedTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f2f6',
    marginHorizontal: 16,
    marginTop: 20,
    padding: 4,
    borderRadius: 24,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  segmentTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentTabText: {
    color: '#777',
    fontWeight: '700',
    fontSize: 14,
  },
  segmentTabTextActive: {
    color: '#111',
  },
  contentContainer: {
    minHeight: 400,
  },
  originalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbf0ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  originalBadgeText: {
    color: '#b33939',
    fontWeight: '700',
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  ingredientsBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f2f6',
  },
  ingredientCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f5f5f5',
  },
  ingredientText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    lineHeight: 22,
  },
  ingredientTextChecked: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  stepsBox: {
    marginTop: 4,
  },
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f2f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  stepCardCompleted: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e8e8e8',
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumberText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fe2c55',
  },
  stepNumberTextCompleted: {
    color: '#bbb',
  },
  stepTextContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    fontWeight: '400',
  },
  stepTextContentCompleted: {
    color: '#bbb',
    textDecorationLine: 'line-through',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  commentsTabContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  commentsList: {
    paddingVertical: 16,
    flex: 1,
    paddingBottom: 40,
  },
  commentItem: {
    flexDirection: 'row',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fe2c55',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 16,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1a1a1a',
    marginRight: 6,
  },
  authorBadge: {
    backgroundColor: '#fe2c55',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  authorBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 4,
  },
  replyBtnText: {
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  commentInputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
  },
  replyingToText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#222',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  starsSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  starBtn: {
    paddingHorizontal: 4,
  },
  ratingTextInput: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 16,
    height: 100,
    fontSize: 14,
    color: '#333',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelBtn: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
  },
  modalSubmitBtn: {
    backgroundColor: '#fe2c55',
    marginLeft: 10,
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f1f2f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
  },
  postCommentBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fe2c55',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 2,
  }
});

