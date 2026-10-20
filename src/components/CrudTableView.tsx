import React, { useState, useMemo } from 'react';
import {
  Search,
  PlusCircle,
  Trash2,
  Pencil,
  Eye,
  Copy,
  Star,
  Gamepad2,
  Film,
  Music,
  Download,
  CheckSquare,
  Square,
  X,
  SlidersHorizontal,
  Heart,
  Calendar,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import type { Recommendation, CategoryType } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface CrudTableViewProps {
  recommendations: Recommendation[];
  onOpenCreate: () => void;
  onEdit: (item: Recommendation) => void;
  onDelete: (item: Recommendation) => void;
  onViewDetails: (item: Recommendation) => void;
  onDuplicate: (item: Recommendation) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onToggleLike: (id: string) => void;
}

const CATEGORY_MAP: Record<CategoryType, { label: string; icon: React.FC<{ className?: string }>; color: string }> = {
  game: { label: 'Game', icon: Gamepad2, color: 'text-purple-400 bg-purple-950/60 border-purple-800/60' },
  movie: { label: 'Filme', icon: Film, color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' },
  music: { label: 'Música', icon: Music, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' },
};

export const CrudTableView: React.FC<CrudTableViewProps> = ({
  recommendations,
  onOpenCreate,
  onEdit,
  onDelete,
  onViewDetails,
  onDuplicate,
  onBulkDelete,
  onToggleLike,
}) => {
  const { user, openAuthModal } = useAuth();

  const [tableSearch, setTableSearch] = useState('');
  const [tableCategory, setTableCategory] = useState<CategoryType | 'all'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortField, setSortField] = useState<'title' | 'rating' | 'category' | 'createdAt' | 'likes'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return recommendations
      .filter((item) => {
        if (tableCategory !== 'all' && item.category !== tableCategory) return false;
        if (minRating > 0 && item.rating < minRating) return false;
        if (tableSearch.trim()) {
          const q = tableSearch.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchGenre = item.genre?.toLowerCase().includes(q) || false;
          const matchAuthor = item.user?.displayName.toLowerCase().includes(q) || false;
          return matchTitle || matchDesc || matchGenre || matchAuthor;
        }
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'title') {
          cmp = a.title.localeCompare(b.title);
        } else if (sortField === 'rating') {
          cmp = a.rating - b.rating;
        } else if (sortField === 'category') {
          cmp = a.category.localeCompare(b.category);
        } else if (sortField === 'likes') {
          cmp = a.likesCount - b.likesCount;
        } else {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return sortDirection === 'asc' ? cmp : -cmp;
      });
  }, [recommendations, tableCategory, minRating, tableSearch, sortField, sortDirection]);

  // Selection handlers
  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) {
      // Remove all current filtered items from selection
      const filteredIds = new Set(filteredItems.map((i) => i.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      // Add all current filtered items to selection
      const newIds = new Set([...selectedIds, ...filteredItems.map((i) => i.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteConfirm = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Tem certeza de que deseja excluir permanentemente ${selectedIds.length} indicações selecionadas?`
      )
    ) {
      return;
    }

    try {
      setIsBulkDeleting(true);
      await onBulkDelete(selectedIds);
      setSelectedIds([]);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir itens em lote');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Export handlers
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicacoes_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Título', 'Categoria', 'Gênero', 'Avaliação', 'Autor', 'Curtidas', 'Data de Criação'];
    const rows = filteredItems.map((i) => [
      `"${i.id}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.category}"`,
      `"${(i.genre || '').replace(/"/g, '""')}"`,
      i.rating,
      `"${(i.user?.displayName || '').replace(/"/g, '""')}"`,
      i.likesCount,
      `"${i.createdAt}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicacoes_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSortToggle = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Toolbar */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Buscar em todas as indicações (título, autor, gênero)..."
              className="w-full pl-10 pr-9 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {tableSearch && (
              <button
                onClick={() => setTableSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={tableCategory}
              onChange={(e) => setTableCategory(e.target.value as any)}
              className="px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-medium cursor-pointer focus:outline-none"
            >
              <option value="all">Todas as Categorias</option>
              <option value="game">🎮 Games</option>
              <option value="movie">🎬 Filmes</option>
              <option value="music">🎵 Músicas</option>
            </select>

            {/* Min Rating Filter */}
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="px-3 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-zinc-200 font-medium cursor-pointer focus:outline-none"
            >
              <option value="0">Qualquer Avaliação</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 estrelas)</option>
              <option value="4">⭐⭐⭐⭐ (4+ estrelas)</option>
              <option value="3">⭐⭐⭐ (3+ estrelas)</option>
            </select>

            {/* Export Buttons */}
            <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={handleExportCSV}
                className="px-2 py-1 text-[11px] font-semibold text-zinc-300 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
                title="Exportar como CSV"
              >
                CSV
              </button>
              <span className="text-zinc-700">|</span>
              <button
                onClick={handleExportJSON}
                className="px-2 py-1 text-[11px] font-semibold text-zinc-300 hover:text-white rounded hover:bg-zinc-800 transition cursor-pointer"
                title="Exportar como JSON"
              >
                JSON
              </button>
            </div>

            {/* Nova Indicação button */}
            <button
              onClick={onOpenCreate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Nova Indicação</span>
            </button>
          </div>
        </div>

        {/* Bulk Action Strip (When items are selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-indigo-200 font-medium">
              <CheckSquare className="w-4 h-4 text-indigo-400" />
              <span>
                <strong>{selectedIds.length}</strong> {selectedIds.length === 1 ? 'indicação selecionada' : 'indicações selecionadas'}
              </span>
              <button
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-indigo-400 hover:underline ml-2 cursor-pointer"
              >
                Desmarcar todas
              </button>
            </div>

            <button
              onClick={handleBulkDeleteConfirm}
              disabled={isBulkDeleting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition cursor-pointer shadow-sm shadow-rose-600/30"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Selecionadas ({selectedIds.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-semibold select-none">
                <th className="py-3 px-4 w-10 text-center">
                  <button
                    onClick={handleToggleSelectAll}
                    className="p-1 rounded text-zinc-400 hover:text-white transition cursor-pointer"
                    title={allFilteredSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3 w-16">Capa</th>
                <th
                  onClick={() => handleSortToggle('title')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition"
                >
                  <div className="flex items-center gap-1">
                    <span>Título & Gênero</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('category')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition w-28"
                >
                  <div className="flex items-center gap-1">
                    <span>Categoria</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => handleSortToggle('rating')}
                  className="py-3 px-4 cursor-pointer hover:text-white transition w-28"
                >
                  <div className="flex items-center gap-1">
                    <span>Avaliação</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 hidden md:table-cell max-w-xs">Resenha</th>
                <th className="py-3 px-4 hidden sm:table-cell">Autor</th>
                <th
                  onClick={() => handleSortToggle('likes')}
                  className="py-3 px-3 cursor-pointer hover:text-white transition text-center w-20"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Curtidas</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right w-36">Ações CRUD</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-zinc-400">
                    <p className="text-sm font-semibold text-zinc-300">
                      Nenhuma indicação encontrada na tabela
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Altere os filtros de pesquisa ou crie uma nova indicação.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const catInfo = CATEGORY_MAP[item.category] || CATEGORY_MAP.game;
                  const CatIcon = catInfo.icon;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-zinc-800/40 transition group ${
                        isSelected ? 'bg-indigo-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleToggleSelectOne(item.id)}
                          className="p-1 rounded text-zinc-400 hover:text-white transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : (
                            <Square className="w-4 h-4 text-zinc-600" />
                          )}
                        </button>
                      </td>

                      {/* Capa */}
                      <td className="py-3 px-3">
                        <div
                          onClick={() => onViewDetails(item)}
                          className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-950 border border-zinc-800 cursor-pointer hover:opacity-80 transition flex-shrink-0"
                          title="Clique para ver detalhes"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </td>

                      {/* Título & Gênero */}
                      <td className="py-3 px-4">
                        <div
                          onClick={() => onViewDetails(item)}
                          className="font-bold text-white hover:text-indigo-300 transition cursor-pointer"
                        >
                          {item.title}
                        </div>
                        {item.genre && (
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {item.genre}
                          </div>
                        )}
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${catInfo.color}`}
                        >
                          <CatIcon className="w-3 h-3" />
                          <span>{catInfo.label}</span>
                        </span>
                      </td>

                      {/* Avaliação */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span className="font-bold text-xs text-white">{item.rating}.0</span>
                        </div>
                      </td>

                      {/* Resenha */}
                      <td className="py-3 px-4 hidden md:table-cell max-w-xs text-zinc-300">
                        <p className="line-clamp-2 text-[11px] leading-relaxed">
                          {item.description}
                        </p>
                      </td>

                      {/* Autor */}
                      <td className="py-3 px-4 hidden sm:table-cell text-zinc-300">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              item.user?.avatarUrl ||
                              `https://api.dicebear.com/7.x/identicon/svg?seed=${item.user?.displayName || 'U'}`
                            }
                            alt="Autor"
                            className="w-5 h-5 rounded-full object-cover bg-zinc-800 flex-shrink-0"
                          />
                          <span className="text-[11px] truncate max-w-[100px]">
                            {item.user?.displayName || 'Anônimo'}
                          </span>
                        </div>
                      </td>

                      {/* Curtidas */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onToggleLike(item.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                            item.isLikedByCurrentUser
                              ? 'bg-rose-500/15 border-rose-500/40 text-rose-400'
                              : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                          title="Curtir / Descurtir"
                        >
                          <Heart
                            className={`w-3 h-3 ${
                              item.isLikedByCurrentUser ? 'fill-rose-500 text-rose-500' : ''
                            }`}
                          />
                          <span>{item.likesCount}</span>
                        </button>
                      </td>

                      {/* Ações CRUD */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1 bg-zinc-950/80 p-1 rounded-xl border border-zinc-800">
                          {/* Visualizar */}
                          <button
                            onClick={() => onViewDetails(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition cursor-pointer"
                            title="Visualizar detalhes da indicação"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Duplicar */}
                          <button
                            onClick={() => onDuplicate(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition cursor-pointer"
                            title="Duplicar esta indicação"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => onEdit(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
                            title="Editar indicação"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => onDelete(item)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition cursor-pointer"
                            title="Excluir indicação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Summary */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <span>
            Exibindo <strong>{filteredItems.length}</strong> de <strong>{recommendations.length}</strong> indicações
          </span>
          <span className="text-zinc-500 font-mono text-[11px]">
            CRUD Completo: Visualizar, Criar, Editar, Duplicar e Excluir
          </span>
        </div>
      </div>
    </div>
  );
};
