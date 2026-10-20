import React from 'react';
import {
  Gamepad2,
  Film,
  Music,
  LayoutGrid,
  Search,
  X,
  SlidersHorizontal,
  UserCheck,
} from 'lucide-react';
import type { CategoryType } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface CategoryFilterProps {
  currentCategory: CategoryType | 'all';
  onSelectCategory: (cat: CategoryType | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: 'recent' | 'rating' | 'likes';
  onSortChange: (sort: 'recent' | 'rating' | 'likes') => void;
  onlyMine: boolean;
  onToggleOnlyMine: (val: boolean) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  currentCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  onlyMine,
  onToggleOnlyMine,
}) => {
  const { user } = useAuth();

  const categories = [
    { id: 'all', label: 'Todos', icon: LayoutGrid, activeColor: 'bg-indigo-600 text-white' },
    { id: 'game', label: 'Games', icon: Gamepad2, activeColor: 'bg-purple-600 text-white' },
    { id: 'movie', label: 'Filmes', icon: Film, activeColor: 'bg-amber-600 text-white' },
    { id: 'music', label: 'Músicas', icon: Music, activeColor: 'bg-emerald-600 text-white' },
  ] as const;

  return (
    <div className="space-y-4 mb-8">
      {/* Search Bar & Primary Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Bar */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por título, resenha ou gênero..."
            className="w-full pl-10 pr-9 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort & Filter Controls */}
        <div className="flex items-center gap-2">
          {/* My Recommendations Toggle (if logged in) */}
          {user && (
            <button
              onClick={() => onToggleOnlyMine(!onlyMine)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                onlyMine
                  ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Minhas</span>
            </button>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as any)}
              className="bg-transparent text-xs text-zinc-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="recent" className="bg-zinc-900 text-zinc-200">
                Mais Recentes
              </option>
              <option value="rating" className="bg-zinc-900 text-zinc-200">
                Melhor Avaliados
              </option>
              <option value="likes" className="bg-zinc-900 text-zinc-200">
                Mais Curtidos
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = currentCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                isActive
                  ? `${cat.activeColor} shadow-md`
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
