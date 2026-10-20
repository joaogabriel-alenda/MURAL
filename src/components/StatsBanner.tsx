import React from 'react';
import { Gamepad2, Film, Music, Heart, Users, Sparkles } from 'lucide-react';
import type { StatsResponse } from '../types.ts';

interface StatsBannerProps {
  stats: StatsResponse | null;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-medium text-zinc-400 block">Total</span>
          <span className="text-lg font-bold text-white tracking-tight">{stats.totalRecommendations}</span>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <Gamepad2 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-medium text-zinc-400 block">Games</span>
          <span className="text-lg font-bold text-white tracking-tight">{stats.totalGames}</span>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Film className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-medium text-zinc-400 block">Filmes</span>
          <span className="text-lg font-bold text-white tracking-tight">{stats.totalMovies}</span>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Music className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-medium text-zinc-400 block">Músicas</span>
          <span className="text-lg font-bold text-white tracking-tight">{stats.totalMusic}</span>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <Heart className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-medium text-zinc-400 block">Curtidas</span>
          <span className="text-lg font-bold text-white tracking-tight">{stats.totalLikes}</span>
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Users className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-medium text-zinc-400 block">Autores</span>
          <span className="text-lg font-bold text-white tracking-tight">{stats.totalUsers}</span>
        </div>
      </div>
    </div>
  );
};
