import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { Recommendation } from '../types.ts';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  recommendation: Recommendation | null;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recommendation,
  isDeleting,
}) => {
  if (!isOpen || !recommendation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-sm font-bold text-white mb-1">
          Excluir esta indicação?
        </h3>

        <p className="text-xs text-zinc-400 mb-4">
          Tem certeza de que deseja remover permanentemente{' '}
          <strong className="text-zinc-200">"{recommendation.title}"</strong>? Esta
          ação não poderá ser desfeita.
        </p>

        <div className="flex items-center gap-2 justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition cursor-pointer shadow-md shadow-rose-600/30 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sim, Excluir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
