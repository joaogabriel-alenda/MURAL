import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  PlusCircle,
  RotateCcw,
  Search,
  Layers,
  Heart,
  Gamepad2,
  Film,
  Music,
  Database,
  Shield,
  Loader2,
  Code2,
  Table,
  LayoutGrid,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { StatsBanner } from './components/StatsBanner.tsx';
import { CategoryFilter } from './components/CategoryFilter.tsx';
import { RecommendationCard } from './components/RecommendationCard.tsx';
import { CrudTableView } from './components/CrudTableView.tsx';
import { RecommendationModal } from './components/RecommendationModal.tsx';
import { RecommendationDetailModal } from './components/RecommendationDetailModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.tsx';
import { SchemaViewerModal } from './components/SchemaViewerModal.tsx';
import { api } from './services/api.ts';
import type { Recommendation, CategoryType, StatsResponse, CreateRecommendationInput } from './types.ts';

function MuralApp() {
  const { user, openAuthModal } = useAuth();

  // Estados de dados
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modo de visualização: 'cards' (Mural) ou 'table' (Tabela Gerencial CRUD)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filtros para a visão em Cards
  const [category, setCategory] = useState<CategoryType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'likes'>('recent');
  const [onlyMine, setOnlyMine] = useState(false);

  // Modais de CRUD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Recommendation | null>(null);
  const [deletingItem, setDeletingItem] = useState<Recommendation | null>(null);
  const [detailItem, setDetailItem] = useState<Recommendation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSchemasOpen, setIsSchemasOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [items, statsData] = await Promise.all([
        api.getRecommendations({
          category: viewMode === 'cards' ? category : 'all',
          search: viewMode === 'cards' && search.trim() ? search.trim() : undefined,
          sortBy: viewMode === 'cards' ? sortBy : 'recent',
          userId: viewMode === 'cards' && onlyMine && user ? user.id : undefined,
        }),
        api.getStats(),
      ]);

      setRecommendations(items);
      setStats(statsData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar dados do mural');
    } finally {
      setIsLoading(false);
    }
  }, [category, search, sortBy, onlyMine, user, viewMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Se o usuário deslogar, desativa o filtro "Minhas"
  useEffect(() => {
    if (!user && onlyMine) {
      setOnlyMine(false);
    }
  }, [user, onlyMine]);

  // Abertura do Modal de Criação (Protegida)
  const handleOpenCreate = () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Abertura do Modal de Edição (Permite editar qualquer indicação no modo CRUD)
  const handleOpenEdit = (item: Recommendation) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Abertura do Modal de Exclusão (Permite excluir qualquer indicação no modo CRUD)
  const handleOpenDelete = (item: Recommendation) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setDeletingItem(item);
  };

  // Salvar (Criar ou Editar no CRUD)
  const handleSaveRecommendation = async (data: CreateRecommendationInput) => {
    if (editingItem) {
      const updated = await api.updateRecommendation(editingItem.id, data);
      setRecommendations((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      if (detailItem && detailItem.id === updated.id) {
        setDetailItem(updated);
      }
    } else {
      const created = await api.createRecommendation(data);
      setRecommendations((prev) => [created, ...prev]);
    }
    // Atualiza contadores
    const statsData = await api.getStats();
    setStats(statsData);
  };

  // Exclusão Individual (Delete no CRUD)
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      await api.deleteRecommendation(deletingItem.id);
      setRecommendations((prev) => prev.filter((r) => r.id !== deletingItem.id));
      if (detailItem && detailItem.id === deletingItem.id) {
        setDetailItem(null);
      }
      setDeletingItem(null);
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir');
    } finally {
      setIsDeleting(false);
    }
  };

  // Exclusão em Lote (Bulk Delete no CRUD)
  const handleBulkDelete = async (ids: string[]) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    await api.bulkDeleteRecommendations(ids);
    setRecommendations((prev) => prev.filter((r) => !ids.includes(r.id)));
    if (detailItem && ids.includes(detailItem.id)) {
      setDetailItem(null);
    }
    const statsData = await api.getStats();
    setStats(statsData);
  };

  // Duplicar Indicação
  const handleDuplicate = async (item: Recommendation) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const duplicated = await api.duplicateRecommendation(item.id);
      setRecommendations((prev) => [duplicated, ...prev]);
      const statsData = await api.getStats();
      setStats(statsData);
    } catch (err: any) {
      alert(err.message || 'Erro ao duplicar indicação');
    }
  };

  // Curtir / Descurtir
  const handleToggleLike = async (id: string) => {
    try {
      const res = await api.toggleLike(id);
      setRecommendations((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              isLikedByCurrentUser: res.liked,
              likesCount: res.likesCount,
            };
          }
          return item;
        })
      );
      if (detailItem && detailItem.id === id) {
        setDetailItem((prev) =>
          prev
            ? {
                ...prev,
                isLikedByCurrentUser: res.liked,
                likesCount: res.likesCount,
              }
            : null
        );
      }
      setStats((prev) =>
        prev
          ? {
              ...prev,
              totalLikes: res.liked ? prev.totalLikes + 1 : Math.max(0, prev.totalLikes - 1),
            }
          : prev
      );
    } catch (err: any) {
      console.error('Erro ao curtir:', err);
    }
  };

  // Restaurar dados iniciais de demonstração
  const handleResetData = async () => {
    if (!confirm('Deseja restaurar as indicações padrão de demonstração?')) return;
    try {
      setIsResetting(true);
      await api.resetSeed();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header com Navegação, Seletor de Modo e Sessão */}
      <Header
        onOpenCreate={handleOpenCreate}
        onOpenSchemas={() => setIsSchemasOpen(true)}
        currentView={viewMode}
        onViewChange={setViewMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative mb-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-zinc-900/60 to-purple-950/30 border border-zinc-800/80 overflow-hidden shadow-2xl">
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CRUD Completo de Indicações Culturais</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
              Gerencie e explore indicações de{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent">
                Games, Filmes e Músicas
              </span>
            </h1>

            <p className="text-sm text-zinc-300/90 leading-relaxed mb-6">
              Sistema completo com operações de <strong>Criação</strong>, <strong>Leitura detalhada</strong>,{' '}
              <strong>Edição</strong>, <strong>Duplicação</strong> e <strong>Exclusão</strong> individual ou em lote para todas as indicações cadastradas.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition cursor-pointer active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Indicação</span>
              </button>

              <button
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 transition cursor-pointer"
              >
                {viewMode === 'cards' ? (
                  <>
                    <Table className="w-4 h-4 text-purple-400" />
                    <span>Abrir Tabela CRUD (Todas)</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-4 h-4 text-indigo-400" />
                    <span>Ver Mural (Cards)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setIsSchemasOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition cursor-pointer"
              >
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Ver Schema (Prisma/SQL)</span>
              </button>

              <button
                onClick={handleResetData}
                disabled={isResetting}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 transition cursor-pointer ml-auto"
                title="Restaurar indicações padrão"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Restaurar Exemplos</span>
              </button>
            </div>
          </div>
        </div>

        {/* Métricas e Estatísticas */}
        <StatsBanner stats={stats} />

        {/* Barra de Alternância de Visão (Mobile + Tablet) */}
        <div className="flex md:hidden items-center justify-between p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 mb-6 text-xs font-semibold">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex-1 py-2 rounded-lg text-center transition cursor-pointer ${
              viewMode === 'cards' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400'
            }`}
          >
            🖼️ Mural (Cards)
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 py-2 rounded-lg text-center transition cursor-pointer ${
              viewMode === 'table' ? 'bg-indigo-600 text-white shadow' : 'text-zinc-400'
            }`}
          >
            📋 Tabela CRUD (Todas)
          </button>
        </div>

        {/* Feedback de Erro */}
        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-rose-950/60 hover:bg-rose-900/60 rounded-lg text-rose-200 font-semibold cursor-pointer"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* RENDERIZAÇÃO: MODO TABELA CRUD vs MODO MURAL */}
        {viewMode === 'table' ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Table className="w-5 h-5 text-indigo-400" />
                  Painel de Gestão CRUD (Todas as Indicações)
                </h2>
                <p className="text-xs text-zinc-400">
                  Operações completas de Criação, Leitura, Edição, Duplicação e Exclusão em lote.
                </p>
              </div>
            </div>

            <CrudTableView
              recommendations={recommendations}
              onOpenCreate={handleOpenCreate}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
              onViewDetails={(item) => setDetailItem(item)}
              onDuplicate={handleDuplicate}
              onBulkDelete={handleBulkDelete}
              onToggleLike={handleToggleLike}
            />
          </div>
        ) : (
          <div>
            {/* Filtros da visão em Cards */}
            <CategoryFilter
              currentCategory={category}
              onSelectCategory={setCategory}
              searchQuery={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onlyMine={onlyMine}
              onToggleOnlyMine={setOnlyMine}
            />

            {/* Grid de Recomendações */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <span className="text-xs font-medium">Carregando indicações...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/20">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-400 mb-3">
                  <Search className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">
                  Nenhuma indicação encontrada
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                  {search
                    ? `Não encontramos resultados para "${search}". Tente outro termo ou categoria.`
                    : onlyMine
                    ? 'Você ainda não publicou nenhuma indicação no mural.'
                    : 'Não há indicações nesta categoria ainda. Seja o primeiro a indicar!'}
                </p>
                <div className="flex items-center justify-center gap-2">
                  {(search || category !== 'all' || onlyMine) && (
                    <button
                      onClick={() => {
                        setCategory('all');
                        setSearch('');
                        setOnlyMine(false);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
                    >
                      Limpar Filtros
                    </button>
                  )}
                  <button
                    onClick={handleOpenCreate}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition cursor-pointer"
                  >
                    Criar Indicação
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendations.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    onEdit={handleOpenEdit}
                    onDelete={handleOpenDelete}
                    onToggleLike={handleToggleLike}
                    onViewDetails={(item) => setDetailItem(item)}
                    onDuplicate={handleDuplicate}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-200">Mural de Indicações</span>
            <span>•</span>
            <span>CRUD Completo para Games 🎮, Filmes 🎬 & Músicas 🎵</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSchemasOpen(true)}
              className="text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Schema Prisma & SQL</span>
            </button>
            <span>•</span>
            <span>React + Tailwind CSS + Express API</span>
          </div>
        </div>
      </footer>

      {/* Modais Globais de CRUD */}
      <RecommendationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveRecommendation}
        initialData={editingItem}
        mode={editingItem ? 'edit' : 'create'}
      />

      <RecommendationDetailModal
        recommendation={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        onDuplicate={handleDuplicate}
        onToggleLike={handleToggleLike}
      />

      <AuthModal />

      <DeleteConfirmModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
        recommendation={deletingItem}
        isDeleting={isDeleting}
      />

      <SchemaViewerModal
        isOpen={isSchemasOpen}
        onClose={() => setIsSchemasOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MuralApp />
    </AuthProvider>
  );
}
