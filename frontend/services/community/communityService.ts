/** Compatibility exports; implementations live in their owning domain. */
export type { CommentInfo } from '../shared/types';
export { postRecipeComment, postRecipeRating, favoriteRecipe, unfavoriteRecipe } from '../recipe/recipeService';
export { followUser, unfollowUser, fetchUserFollowers, fetchUserFollowing } from '../user/userService';
export type { FollowListItem, FollowListResponse } from '../user/userService';
