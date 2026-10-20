export type CategoryType = 'game' | 'movie' | 'music';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface StoredUser extends User {
  passwordHash: string;
}

export interface Recommendation {
  id: string;
  userId: string;
  title: string;
  category: CategoryType;
  description: string;
  imageUrl: string;
  rating: number; // 1 to 5
  genre?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
  likesCount: number;
  isLikedByCurrentUser?: boolean;
}

export interface StoredRecommendation {
  id: string;
  userId: string;
  title: string;
  category: CategoryType;
  description: string;
  imageUrl: string;
  rating: number;
  genre?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredLike {
  id: string;
  userId: string;
  recommendationId: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateRecommendationInput {
  title: string;
  category: CategoryType;
  description: string;
  imageUrl: string;
  rating: number;
  genre?: string;
}

export interface UpdateRecommendationInput {
  title?: string;
  category?: CategoryType;
  description?: string;
  imageUrl?: string;
  rating?: number;
  genre?: string;
}

export interface StatsResponse {
  totalRecommendations: number;
  totalGames: number;
  totalMovies: number;
  totalMusic: number;
  totalUsers: number;
  totalLikes: number;
}
