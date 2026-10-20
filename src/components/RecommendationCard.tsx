import React, { useState } from 'react';
import {
  Gamepad2,
  Film,
  Music,
  Star,
  Heart,
  Pencil,
  Trash2,
  Calendar,
  Share2,
  Check,
  Eye,
  Copy,
} from 'lucide-react';
import type { Recommendation, CategoryType } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onEdit: (item: Recommendation) => void;
  onDelete: (item: Recommendation) => void;
  onToggleLike: (id: string) => void;
  onViewDetails?: (item: Recommendation) => void;
  onDuplicate?: (item: Recommendation) => void;
}

const CATEGORY_CONFIG: Record<
  CategoryType,
  { label: string; icon: React.FC<{ className?: string }>; badgeColor: string; glowBorder: string }
> = {
  game: {
    label: 'Game',
    icon: Gamepad2,
    badgeColor: 'bg-purple-950/70 text-purple-300 border-purple-800/60',
    glowBorder: 'hover:border-purple-500/40',
  },
  movie: {
    label: 'Filme',
    icon: Film,
    badgeColor: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
    glowBorder: 'hover:border-amber-500/40',
  },
  music: {
    label: 'Música',
    icon: Music,
    badgeColor: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
    glowBorder: 'hover:border-emerald-500/40',
  },
};

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 2) return 'agora há pouco';
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'recentemente';
  }
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onEdit,
  onDelete,
  onToggleLike,
  onViewDetails,
  onDuplicate,
}) => {
  const { user, openAuthModal } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const categoryInfo = CATEGORY_CONFIG[recommendation.category] || CATEGORY_CONFIG.game;
  const CategoryIcon = categoryInfo.icon;

  const fallbackImage =
    recommendation.category === 'game'
      ? 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80'
      : recommendation.category === 'movie'
      ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      openAuthModal('login');
      return;
    }
    onToggleLike(recommendation.id);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}#${recommendation.id}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(recommendation);
    }
  };

  return (
    <article
      id={recommendation.id}
      className={`group relative flex flex-col rounded-2xl bg-zinc-900/70 border border-zinc-800/80 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 ${categoryInfo.glowBorder}`}
    >
      {/* Cover Image Container */}
      <div
        onClick={handleCardClick}
        className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950 cursor-pointer"
      >
        <img
          src={imageError ? fallbackImage : recommendation.imageUrl}
          alt={recommendation.title}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

        {/* Category Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-sm ${categoryInfo.badgeColor}`}
          >
            <CategoryIcon className="w-3.5 h-3.5" />
            <span>{categoryInfo.label}</span>
          </span>

          {recommendation.genre && (
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-950/80 text-zinc-300 border border-zinc-800 backdrop-blur-md">
              {recommendation.genre}
            </span>
          )}
        </div>

        {/* Full CRUD Action Controls for all recommendations */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-zinc-950/85 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-lg z-10">
          {/* Visualizar */}
          {onViewDetails && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(recommendation);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition cursor-pointer"
              title="Visualizar detalhes completos"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Duplicar */}
          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  openAuthModal('login');
                  return;
                }
                onDuplicate(recommendation);
              }}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition cursor-pointer"
              title="Duplicar indicação"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Editar */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                openAuthModal('login');
                return;
              }
              onEdit(recommendation);
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
            title="Editar indicação"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>

          {/* Excluir */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                openAuthModal('login');
                return;
              }
              onDelete(recommendation);
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/50 transition cursor-pointer"
            title="Excluir indicação"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Star Rating on Image bottom right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-zinc-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800/80 shadow-md">
          <div className="flex items-center gap-0.5 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3.5 h-3.5 ${
                  star <= recommendation.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-zinc-700'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-bold text-white ml-1">
            {recommendation.rating}.0
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        {/* Title */}
        <h3
          onClick={handleCardClick}
          className="text-base font-bold text-white tracking-tight line-clamp-1 group-hover:text-indigo-300 transition-colors cursor-pointer"
        >
          {recommendation.title}
        </h3>

        {/* Review / Description */}
        <p
          className={`text-xs text-zinc-300/90 leading-relaxed ${
            isExpanded ? '' : 'line-clamp-3'
          }`}
        >
          {recommendation.description}
        </p>

        {recommendation.description.length > 140 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium self-start cursor-pointer transition"
          >
            {isExpanded ? 'Mostrar menos' : 'Ler resenha completa...'}
          </button>
        )}

        <div className="mt-auto pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-3 text-xs">
          {/* Author info */}
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={
                recommendation.user?.avatarUrl ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${
                  recommendation.user?.displayName || 'User'
                }`
              }
              alt={recommendation.user?.displayName || 'Autor'}
              className="w-6 h-6 rounded-full object-cover bg-zinc-800 flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="font-medium text-zinc-200 truncate block text-[11px]">
                {recommendation.user?.displayName || 'Anônimo'}
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                {formatRelativeTime(recommendation.createdAt)}
              </span>
            </div>
          </div>

          {/* Likes & Share interaction */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition cursor-pointer"
              title="Copiar link da indicação"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Like Button */}
            <button
              onClick={handleLikeClick}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer active:scale-90 ${
                recommendation.isLikedByCurrentUser
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-sm shadow-rose-500/10'
                  : 'bg-zinc-800/70 hover:bg-zinc-800 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
              }`}
              title={user ? 'Curtir esta indicação' : 'Faça login para curtir'}
            >
              <Heart
                className={`w-3.5 h-3.5 transition-transform ${
                  recommendation.isLikedByCurrentUser ? 'fill-rose-500 text-rose-500 scale-110' : ''
                }`}
              />
              <span>{recommendation.likesCount}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

