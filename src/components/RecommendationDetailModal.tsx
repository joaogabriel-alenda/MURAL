import React from 'react';
import {
  X,
  Star,
  Heart,
  Gamepad2,
  Film,
  Music,
  Calendar,
  Pencil,
  Trash2,
  Copy,
  User,
  Share2,
} from 'lucide-react';
import type { Recommendation, CategoryType } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface RecommendationDetailModalProps {
  recommendation: Recommendation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: Recommendation) => void;
  onDelete: (item: Recommendation) => void;
  onDuplicate: (item: Recommendation) => void;
  onToggleLike: (id: string) => void;
}

const CATEGORY_CONFIG: Record<
  CategoryType,
  { label: string; icon: React.FC<{ className?: string }>; badgeColor: string }
> = {
  game: {
    label: 'Games',
    icon: Gamepad2,
    badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-800/80',
  },
  movie: {
    label: 'Filmes',
    icon: Film,
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
  },
  music: {
    label: 'Músicas',
    icon: Music,
    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
  },
};

export const RecommendationDetailModal: React.FC<RecommendationDetailModalProps> = ({
  recommendation,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleLike,
}) => {
  const { user, openAuthModal } = useAuth();

  if (!isOpen || !recommendation) return null;

  const categoryInfo = CATEGORY_CONFIG[recommendation.category] || CATEGORY_CONFIG.game;
  const CategoryIcon = categoryInfo.icon;

  const handleLike = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    onToggleLike(recommendation.id);
  };

  const formattedDate = new Date(recommendation.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden my-8">
        {/* Header Cover Banner */}
        <div className="relative h-64 sm:h-72 w-full bg-zinc-950 overflow-hidden">
          <img
            src={recommendation.imageUrl}
            alt={recommendation.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-black/30" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges on top left */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-lg ${categoryInfo.badgeColor}`}
            >
              <CategoryIcon className="w-3.5 h-3.5" />
              <span>{categoryInfo.label}</span>
            </span>

            {recommendation.genre && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-950/80 text-zinc-300 border border-zinc-700/80 backdrop-blur-md">
                {recommendation.genre}
              </span>
            )}
          </div>

          {/* Title & Rating in header bottom */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                {recommendation.title}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= recommendation.rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold text-amber-300">
                  {recommendation.rating}.0 / 5.0
                </span>
              </div>
            </div>

            {/* Like Counter */}
            <button
              onClick={handleLike}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer self-start sm:self-auto ${
                recommendation.isLikedByCurrentUser
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-zinc-700 text-zinc-300'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  recommendation.isLikedByCurrentUser ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
              <span>{recommendation.likesCount} Curtidas</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Review / Resenha */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
              Resenha & Opinião
            </h4>
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {recommendation.description}
            </div>
          </div>

          {/* Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 text-xs">
            <div className="flex items-center gap-3">
              <img
                src={
                  recommendation.user?.avatarUrl ||
                  `https://api.dicebear.com/7.x/identicon/svg?seed=${
                    recommendation.user?.displayName || 'User'
                  }`
                }
                alt={recommendation.user?.displayName || 'Autor'}
                className="w-10 h-10 rounded-full object-cover bg-zinc-800"
              />
              <div>
                <span className="text-zinc-400 block text-[11px]">Indicado por</span>
                <span className="font-bold text-white text-sm">
                  {recommendation.user?.displayName || 'Usuário da Comunidade'}
                </span>
                <span className="text-[11px] text-zinc-500 font-mono block">
                  {recommendation.user?.email}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:justify-end text-zinc-400">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <div>
                <span className="text-zinc-400 block text-[11px]">Publicado em</span>
                <span className="text-zinc-200 font-medium">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Edit, Delete, Duplicate */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onDuplicate(recommendation);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
                title="Criar cópia desta indicação"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Duplicar</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onEdit(recommendation);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar Indicação</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onDelete(recommendation);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-300 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/60 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
