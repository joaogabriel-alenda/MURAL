import React, { useState, useEffect } from 'react';
import {
  X,
  Gamepad2,
  Film,
  Music,
  Star,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import type { Recommendation, CategoryType, CreateRecommendationInput } from '../types.ts';

interface RecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRecommendationInput) => Promise<void>;
  initialData?: Recommendation | null;
  mode: 'create' | 'edit';
}

const PRESET_IDEAS: Array<{
  title: string;
  category: CategoryType;
  genre: string;
  rating: number;
  imageUrl: string;
  description: string;
}> = [
  {
    title: 'The Legend of Zelda: Tears of the Kingdom',
    category: 'game',
    genre: 'Aventura / Mundo Aberto',
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
    description: 'Liberdade criativa sem precedentes. A mecânica de construção de veículos e a exploração vertical das ilhas celestes redefinem jogos de aventura.',
  },
  {
    title: 'Oppenheimer',
    category: 'movie',
    genre: 'Drama Histórico / Biografia',
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80',
    description: 'Uma obra monumental sobre a criação da bomba atômica. Cillian Murphy e Robert Downey Jr. entregam atuações avassaladoras sob a direção magistral de Christopher Nolan.',
  },
  {
    title: 'Discovery - Daft Punk',
    category: 'music',
    genre: 'French House / Synthpop',
    rating: 5,
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    description: 'Um dos discos mais icônicos do início dos anos 2000. Faixas como "One More Time", "Aerodynamic" e "Harder, Better, Faster, Stronger" moldaram a história da música pop.',
  },
];

export const RecommendationModal: React.FC<RecommendationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryType>('game');
  const [genre, setGenre] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [description, setDescription] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCategory(initialData.category);
      setGenre(initialData.genre || '');
      setImageUrl(initialData.imageUrl);
      setRating(initialData.rating);
      setDescription(initialData.description);
    } else {
      setTitle('');
      setCategory('game');
      setGenre('');
      setImageUrl('');
      setRating(5);
      setDescription('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Por favor, informe o título da indicação');
      return;
    }
    if (!description.trim()) {
      setError('Por favor, escreva uma breve resenha ou opinião');
      return;
    }
    if (!imageUrl.trim()) {
      setError('Por favor, insira o link da imagem de capa');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        title: title.trim(),
        category,
        genre: genre.trim() || undefined,
        imageUrl: imageUrl.trim(),
        rating,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar indicação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (preset: typeof PRESET_IDEAS[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setGenre(preset.genre);
    setImageUrl(preset.imageUrl);
    setRating(preset.rating);
    setDescription(preset.description);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div>
            <h2 className="text-base font-bold text-white">
              {mode === 'create' ? 'Nova Indicação' : 'Editar Indicação'}
            </h2>
            <p className="text-xs text-zinc-400">
              Compartilhe sua obra favorita com a comunidade
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets (only in create mode) */}
        {mode === 'create' && (
          <div className="px-6 pt-4 pb-2 bg-zinc-950/30 border-b border-zinc-800/40">
            <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 mb-2">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Sugestões rápidas de preenchimento para teste:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_IDEAS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 transition cursor-pointer"
                >
                  {preset.category === 'game' && '🎮 '}
                  {preset.category === 'movie' && '🎬 '}
                  {preset.category === 'music' && '🎵 '}
                  {preset.title.split(' - ')[0].split(':')[0]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Categoria *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCategory('game')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  category === 'game'
                    ? 'bg-purple-950/80 border-purple-600 text-purple-200'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-purple-400" />
                <span>Games</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('movie')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  category === 'movie'
                    ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Film className="w-4 h-4 text-amber-400" />
                <span>Filmes</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('music')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  category === 'music'
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-200'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Music className="w-4 h-4 text-emerald-400" />
                <span>Músicas</span>
              </button>
            </div>
          </div>

          {/* Título & Gênero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Título da Obra *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Elden Ring, Interestelar, etc."
                className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Gênero / Estilo (Opcional)
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Ex: RPG, Sci-Fi, MPB, Rock"
                className="w-full px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* URL da Capa + Preview */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              URL da Imagem de Capa *
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/poster.jpg"
                className="flex-1 px-3.5 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                required
              />
              {imageUrl && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-zinc-700 flex-shrink-0 bg-zinc-950">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              Cole o link de uma imagem pública (ex: Unsplash, IMDb, Wikipedia).
            </p>
          </div>

          {/* Avaliação (Estrelas 1 a 5) */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Sua Avaliação (1 a 5 estrelas) *
            </label>
            <div className="flex items-center gap-2 bg-zinc-800/40 border border-zinc-800 p-2.5 rounded-xl">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(star)}
                    className="p-1 rounded hover:scale-110 transition cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoverRating ?? rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-zinc-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-400 ml-2">
                {rating} de 5 estrelas
              </span>
            </div>
          </div>

          {/* Resenha / Descrição */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                Sua Resenha / Motivo da Indicação *
              </label>
              <span className="text-[11px] text-zinc-400">{description.length} caracteres</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="O que torna essa obra tão marcante? Fale sobre história, gameplay, trilha sonora, atuações ou momentos inesquecíveis..."
              className="w-full px-3.5 py-2.5 bg-zinc-800/80 border border-zinc-700 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
              required
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <span>{mode === 'create' ? 'Publicar Indicação' : 'Salvar Alterações'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
