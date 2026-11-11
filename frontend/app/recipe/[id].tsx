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
  Alert,
  DeviceEventEmitter
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { fetchRecipeDetails, RecipeDetails } from '@/services/recipe/recipeService';
import { postRecipeComment, postRecipeRating, CommentInfo, followUser, unfollowUser } from '@/services/community/communityService';
import { CreatePostModal } from '@/components/community/CreatePostModal';
import { SaveToCollectionModal } from '@/components/collections/SaveToCollectionModal';
import { getWsBaseUrl } from '@/services/shared/apiConfig';
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
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<Record<number, boolean>>({});
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [followLoading, setFollowLoading] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    const wsUrl = `${getWsBaseUrl()}/recipes/${id}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Removed SAVE_UPDATE handling as save count is no longer tracked
      } catch (e) {
        console.error('WS Error:', e);
      }
    };

    return () => {
      ws.close();
    };
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
    Keyboard.dismiss();

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
          <TouchableOpacity onPress={() => comment.user?.id && router.push(`/user/${comment.user.id}` as any)}>
            {comment.user?.avatar ? (
              <Image source={{ uri: comment.user.avatar }} style={styles.commentAvatarImage} />
            ) : (
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>{comment.user?.name?.charAt(0) || 'U'}</Text>
              </View>
            )}
          </TouchableOpacity>
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
        <ActivityIndicator size="large" color="#28a745" />
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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ flex: 1 }}>

        {/* ═══════════════════════════════════════════
            HERO — full-bleed image với overlay title
        ═══════════════════════════════════════════ */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: recipe.image }} style={styles.heroImage} />

          {/* Gradient overlay mờ dần từ dưới lên */}
          <View style={styles.heroGradient} />

          {/* TOP BAR: nút back bên trái + save/share/edit bên phải */}
          <View style={[styles.heroTopBar, {
            top: Platform.OS === 'android' ? (StatusBar.currentHeight || 20) + 10 : 52
          }]}>
            <TouchableOpacity style={styles.heroIconBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroTopRight}>
              <TouchableOpacity style={styles.heroIconBtn} onPress={() => setIsSaveModalVisible(true)}>
                <Ionicons
                  name={recipe.is_in_collection ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={recipe.is_in_collection ? "#4ade80" : "#fff"}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.heroIconBtn}>
                <Ionicons name="share-social-outline" size={22} color="#fff" />
              </TouchableOpacity>
              {recipe.author?.is_self && (
                <TouchableOpacity style={styles.heroIconBtn} onPress={() => setIsEditModalVisible(true)}>
                  <Ionicons name="pencil" size={20} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* BOTTOM OVERLAY: category + time badges + tiêu đề đè lên ảnh */}
          <View style={styles.heroBottomOverlay}>
            <View style={styles.heroBadgesRow}>
              <View style={styles.heroCategoryBadge}>
                <Text style={styles.heroCategoryText}>🍰 {recipe.category || 'Món ăn'}</Text>
              </View>
              <View style={styles.heroTimeBadge}>
                <Feather name="clock" size={12} color="rgba(255,255,255,0.9)" style={{ marginRight: 4 }} />
                <Text style={styles.heroTimeText}>{recipe.cook_time_minutes || 15} phút</Text>
              </View>
            </View>
            <Text style={styles.heroTitle} numberOfLines={2}>{recipe.title}</Text>
          </View>
        </View>

        {/* ═══════════════════════════════════════════
            WHITE CONTENT SHEET — bo góc trên, đè nhẹ lên ảnh
        ═══════════════════════════════════════════ */}
        <View style={styles.contentSheet}>

          {/* ── AUTHOR ROW compact ─────────────────── */}
          <View style={styles.authorRow}>
            <TouchableOpacity
              style={styles.authorLeft}
              activeOpacity={0.8}
              onPress={() => recipe.author?.id && router.push(`/user/${recipe.author.id}` as any)}
            >
              {recipe.author?.avatar ? (
                <Image source={{ uri: recipe.author.avatar }} style={styles.authorAvatar} />
              ) : (
                <View style={styles.authorAvatarPlaceholder}>
                  <Text style={styles.authorAvatarText}>{recipe.author?.name?.charAt(0) || 'U'}</Text>
                </View>
              )}
              <View>
                <Text style={styles.authorNameText}>{recipe.author?.name || 'Đầu bếp'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <Ionicons name="star" size={12} color="#f59e0b" />
                  <Text style={styles.authorRatingText}>
                    {' '}{recipe.ratings_avg ? recipe.ratings_avg.toFixed(1) : '5.0'} · {recipe.ratings_count || 0} đánh giá
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {!recipe.author?.is_self && (
              <TouchableOpacity
                style={[styles.followBtn, recipe.author?.is_following && styles.followingBtn]}
                onPress={handleToggleFollow}
                disabled={followLoading}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={recipe.author?.is_following ? "#388e3c" : "#fff"} />
                ) : (
                  <Text style={[styles.followBtnText, recipe.author?.is_following && styles.followingBtnText]}>
                    {recipe.author?.is_following ? 'Đang follow' : 'Follow'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* ── QUICK RATE ROW ─────────────────────── */}
          <TouchableOpacity
            style={styles.ratePromptRow}
            activeOpacity={0.75}
            onPress={() => { setSelectedRating(0); setRatingComment(''); setIsRatingModalVisible(true); }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons
                  key={s}
                  name={Math.round(recipe.ratings_avg || 5) >= s ? "star" : "star-outline"}
                  size={16}
                  color="#f59e0b"
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            <Text style={styles.ratePromptText}>Chạm để đánh giá công thức này</Text>
            <Ionicons name="chevron-forward" size={15} color="#bbb" />
          </TouchableOpacity>

          <View style={styles.sectionDivider} />

          {/* ── TAB SWITCHER ───────────────────────── */}
          <View style={styles.segmentedTabContainer}>
            <TouchableOpacity
              style={[styles.segmentTab, activeTab === 'recipe' && styles.segmentTabActive]}
              onPress={() => setActiveTab('recipe')}
            >
              <Text style={[styles.segmentTabText, activeTab === 'recipe' && styles.segmentTabTextActive]}>
                📋  Công thức
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentTab, activeTab === 'comments' && styles.segmentTabActive]}
              onPress={() => setActiveTab('comments')}
            >
              <Text style={[styles.segmentTabText, activeTab === 'comments' && styles.segmentTabTextActive]}>
                💬  Bình luận
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── TAB CONTENT ────────────────────────── */}
          <View style={styles.tabContent}>
            {activeTab === 'recipe' ? (
              <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
                {/* ORIGINAL RECIPE BADGE */}
                <View style={styles.originalBadge}>
                  <Ionicons name="ribbon-outline" size={14} color="#7b1fa2" style={{ marginRight: 5 }} />
                  <Text style={styles.originalBadgeText}>Công thức độc quyền</Text>
                </View>

                {/* INGREDIENTS */}
                <Text style={styles.sectionTitle}>🛒  Nguyên liệu cần chuẩn bị</Text>
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
                        style={[
                          styles.ingredientCheckRow,
                          idx === ingredientsList.length - 1 && { borderBottomWidth: 0 }
                        ]}
                        onPress={() => toggleIngredient(idx)}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.checkCircle, isChecked && styles.checkCircleChecked]}>
                          {isChecked && <Ionicons name="checkmark" size={13} color="#fff" />}
                        </View>
                        <Text style={[styles.ingredientText, isChecked && styles.ingredientTextChecked]}>
                          {text}
                        </Text>
                      </TouchableOpacity>
                    );
                  }) : (
                    <Text style={styles.emptyText}>Chưa có thông tin nguyên liệu</Text>
                  )}
                </View>

                {/* INSTRUCTIONS */}
                <Text style={[styles.sectionTitle, { marginTop: 28 }]}>👨‍🍳  Hướng dẫn các bước nấu</Text>
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
                        <View style={[styles.stepNumberCircle, isCompleted && styles.stepNumberCircleCompleted]}>
                          {isCompleted
                            ? <Ionicons name="checkmark" size={15} color="#fff" />
                            : <Text style={styles.stepNumberText}>{idx + 1}</Text>
                          }
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
                    <View style={styles.emptyComments}>
                      <Text style={styles.emptyCommentsIcon}>💬</Text>
                      <Text style={styles.emptyCommentsTitle}>Chưa có bình luận nào</Text>
                      <Text style={styles.emptyCommentsSubtext}>Hãy là người đầu tiên nhận xét!</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ═══ RATING MODAL ═══ */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRatingModalVisible}
        onRequestClose={() => setIsRatingModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Đánh giá công thức</Text>
              <Text style={styles.modalSubtitle}>Bạn cảm thấy món ăn này thế nào?</Text>

              <View style={styles.starsSelectionRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setSelectedRating(star)} activeOpacity={0.7} style={styles.starBtn}>
                    <Ionicons
                      name={selectedRating >= star ? "star" : "star-outline"}
                      size={42}
                      color={selectedRating >= star ? "#FFD700" : "#ddd"}
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
                placeholderTextColor="#aaa"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalCancelBtn]}
                  onPress={() => setIsRatingModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionBtn, styles.modalSubmitBtn, selectedRating === 0 && { opacity: 0.45 }]}
                  disabled={selectedRating === 0 || isSubmittingRating}
                  onPress={handleSubmitRating}
                >
                  {isSubmittingRating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalSubmitText}>Gửi đánh giá ⭐</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ═══ FOOTER COMMENT INPUT ═══ */}
      {activeTab === 'comments' && (
        <View style={styles.commentInputWrapper}>
          {replyTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>↩ Đang trả lời <Text style={{ fontWeight: '700', color: '#28a745' }}>{replyTo.name}</Text></Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <Ionicons name="close-circle" size={20} color="#aaa" />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder={replyTo ? "Viết câu trả lời..." : "Thêm bình luận..."}
              placeholderTextColor="#aaa"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={[styles.postCommentBtn, (!commentText.trim() || isPosting) && { opacity: 0.45 }]}
              disabled={!commentText.trim() || isPosting}
              onPress={handlePostComment}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ═══ EDIT MODAL ═══ */}
      <CreatePostModal
        visible={isEditModalVisible}
        onClose={() => setIsEditModalVisible(false)}
        isEditMode={true}
        recipeId={id as string}
        initialData={recipe}
        onPostCreated={() => {
          setIsEditModalVisible(false);
          loadData();
        }}
      />

      <SaveToCollectionModal
        visible={isSaveModalVisible}
        onClose={() => setIsSaveModalVisible(false)}
        recipeId={id as string}
        onSavedChange={(isSavedInAny) => {
          setRecipe((prev) => {
            if (!prev || prev.is_in_collection === isSavedInAny) return prev;
            DeviceEventEmitter.emit('recipeSavedStateChanged', { recipeId: Number(id), isSaved: isSavedInAny });
            return { ...prev, is_in_collection: isSavedInAny };
          });
        }}
      />
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
  // ─── HERO ────────────────────────────────────────────────────
  heroContainer: {
    width: width,
    height: width * 0.95,
    position: 'relative',
    backgroundColor: '#111',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.92,
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroTopBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  heroTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  heroBottomOverlay: {
    position: 'absolute',
    bottom: 34,
    left: 20,
    right: 20,
    zIndex: 5,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  heroCategoryBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  heroCategoryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  heroTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  heroTimeText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // ─── CONTENT SHEET ──────────────────────────────────────────
  contentSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -24,
    paddingTop: 18,
    minHeight: 500,
  },

  // ─── AUTHOR ROW ─────────────────────────────────────────────
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  authorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#e8f5e9',
  },
  authorAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#28a745',
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
    color: '#1a2e1a',
  },
  authorRatingText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  followBtn: {
    backgroundColor: '#28a745',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  followBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  followingBtn: {
    backgroundColor: '#f1f5f1',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  followingBtnText: {
    color: '#2e7d32',
  },

  // ─── QUICK RATE ROW ─────────────────────────────────────────
  ratePromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8faf8',
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#edf4ed',
  },
  ratePromptText: {
    fontSize: 13,
    color: '#556b2f',
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#f0f4f0',
    marginHorizontal: 20,
    marginTop: 14,
  },

  // ─── SEGMENTED TABS ──────────────────────────────────────────
  segmentedTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f1',
    marginHorizontal: 16,
    marginTop: 14,
    padding: 4,
    borderRadius: 24,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 20,
  },
  segmentTabActive: {
    backgroundColor: '#28a745',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentTabText: {
    color: '#4a5d4e',
    fontWeight: '700',
    fontSize: 13,
  },
  segmentTabTextActive: {
    color: '#fff',
  },
  tabContent: {
    minHeight: 350,
  },

  // ─── RECIPE CONTENT ──────────────────────────────────────────
  originalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbf0ff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 16,
  },
  originalBadgeText: {
    color: '#7b1fa2',
    fontWeight: '700',
    fontSize: 11,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a2e1a',
    marginBottom: 12,
    letterSpacing: 0.1,
  },
  ingredientsBox: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#e8f0e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  ingredientCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f4f0',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#c8d6c8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkCircleChecked: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  ingredientText: {
    fontSize: 14,
    color: '#2e4a2e',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
  ingredientTextChecked: {
    textDecorationLine: 'line-through',
    color: '#94a3b8',
  },
  stepsBox: {
    marginTop: 4,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8f0e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  stepCardCompleted: {
    backgroundColor: '#f9fdf9',
    borderColor: '#c8e6c9',
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 1,
  },
  stepNumberCircleCompleted: {
    backgroundColor: '#28a745',
  },
  stepNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#28a745',
  },
  stepTextContent: {
    fontSize: 14,
    color: '#2e4a2e',
    lineHeight: 22,
    flex: 1,
  },
  stepTextContentCompleted: {
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  emptyText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },

  // ─── COMMENTS ─────────────────────────────────────────────────
  commentsTabContainer: {
    flex: 1,
    minHeight: 280,
    paddingHorizontal: 16,
  },
  commentsList: {
    paddingVertical: 14,
    flex: 1,
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCommentsIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyCommentsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
  },
  emptyCommentsSubtext: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 3,
  },
  commentItem: {
    flexDirection: 'row',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#28a745',
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
    backgroundColor: '#f1f8f1',
    padding: 12,
    borderRadius: 16,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#1a2e1a',
    marginRight: 6,
  },
  authorBadge: {
    backgroundColor: '#28a745',
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
    color: '#2e4a2e',
    lineHeight: 20,
    marginTop: 4,
  },
  replyBtnText: {
    color: '#28a745',
    fontSize: 12,
    fontWeight: '700',
  },

  // ─── COMMENT INPUT ────────────────────────────────────────────
  commentInputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e8f5e9',
  },
  replyingToContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f1f8f1',
  },
  replyingToText: {
    fontSize: 13,
    color: '#388e3c',
    fontWeight: '600',
  },
  commentInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#f1f8f1',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    minHeight: 42,
    maxHeight: 100,
    fontSize: 15,
    color: '#1a2e1a',
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  postCommentBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 1,
  },

  // ─── RATING MODAL ────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1a2e1a',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 18,
  },
  starsSelectionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starBtn: {
    paddingHorizontal: 5,
  },
  ratingTextInput: {
    width: '100%',
    backgroundColor: '#f8faf8',
    borderRadius: 16,
    padding: 14,
    height: 95,
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2ece2',
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
    backgroundColor: '#f1f5f9',
    marginRight: 10,
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
  },
  modalSubmitBtn: {
    backgroundColor: '#28a745',
    marginLeft: 10,
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});

