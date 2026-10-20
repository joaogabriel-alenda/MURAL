import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Code2,
  Copy,
  Check,
  FileCode,
  Layers,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface SchemaViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaViewerModal: React.FC<SchemaViewerModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'prisma' | 'sql' | 'architecture'>('supabase');
  const [prismaCode, setPrismaCode] = useState('');
  const [sqlCode, setSqlCode] = useState('');
  const [supabaseCode, setSupabaseCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api
        .getSchemas()
        .then((data) => {
          setPrismaCode(data.prisma);
          setSqlCode(data.sql);
          if (data.supabase) {
            setSupabaseCode(data.supabase);
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentContent =
    activeTab === 'supabase'
      ? supabaseCode
      : activeTab === 'prisma'
      ? prismaCode
      : sqlCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Setup do Banco de Dados & Arquitetura
              </h2>
              <p className="text-xs text-zinc-400">
                Schemas relacionais prontos para Prisma ORM, PostgreSQL (Supabase) e SQLite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-zinc-800 bg-zinc-950/40">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('supabase')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'supabase'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>⚡ Supabase SQL (Pronto p/ Rodar)</span>
            </button>

            <button
              onClick={() => setActiveTab('prisma')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'prisma'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>schema.prisma</span>
            </button>

            <button
              onClick={() => setActiveTab('sql')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'sql'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>schema.sql (Genérico)</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`py-3 px-3.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'architecture'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Arquitetura & RLS</span>
            </button>
          </div>

          {activeTab !== 'architecture' && (
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-zinc-950/90 font-mono text-xs text-zinc-300">
          {activeTab === 'architecture' ? (
            <div className="font-sans space-y-6 text-zinc-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-indigo-400 font-bold text-sm mb-1">1. users / profiles</div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Armazena contas de usuários autenticados, com hashes de senha seguros, dados de exibição e timestamps.
                  </p>
                  <ul className="text-[11px] font-mono text-zinc-300 space-y-1">
                    <li>• <span className="text-indigo-300">id</span>: UUID (PK)</li>
                    <li>• <span className="text-indigo-300">email</span>: VARCHAR(255) UNIQUE</li>
                    <li>• <span className="text-indigo-300">display_name</span>: VARCHAR(120)</li>
                    <li>• <span className="text-indigo-300">password_hash</span>: VARCHAR(255)</li>
                    <li>• <span className="text-indigo-300">avatar_url</span>: TEXT</li>
                    <li>• <span className="text-indigo-300">created_at</span>: TIMESTAMP</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-purple-400 font-bold text-sm mb-1">2. recommendations</div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Indicações nas categorias Games, Filmes e Músicas com avaliações de 1 a 5 estrelas e vínculo ao autor.
                  </p>
                  <ul className="text-[11px] font-mono text-zinc-300 space-y-1">
                    <li>• <span className="text-purple-300">id</span>: UUID (PK)</li>
                    <li>• <span className="text-purple-300">user_id</span>: UUID (FK ➔ users)</li>
                    <li>• <span className="text-purple-300">title</span>: VARCHAR(255)</li>
                    <li>• <span className="text-purple-300">category</span>: 'game'|'movie'|'music'</li>
                    <li>• <span className="text-purple-300">rating</span>: INT (1 a 5)</li>
                    <li>• <span className="text-purple-300">image_url</span>: TEXT</li>
                    <li>• <span className="text-purple-300">description</span>: TEXT</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-rose-400 font-bold text-sm mb-1">3. likes (Upvotes)</div>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                    Tabela relacional de curtidas com chave única composta (1 curtida por usuário por indicação).
                  </p>
                  <ul className="text-[11px] font-mono text-zinc-300 space-y-1">
                    <li>• <span className="text-rose-300">id</span>: UUID (PK)</li>
                    <li>• <span className="text-rose-300">user_id</span>: UUID (FK ➔ users)</li>
                    <li>• <span className="text-rose-300">recommendation_id</span>: UUID (FK)</li>
                    <li>• <span className="text-rose-300">created_at</span>: TIMESTAMP</li>
                    <li>• <span className="text-amber-300">UNIQUE(user_id, rec_id)</span></li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40">
                <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Políticas de Segurança e Integridade (Row-Level Security & Cascade)</span>
                </div>
                <div className="text-xs text-zinc-300 space-y-2">
                  <p>
                    • <strong>Cascading Deletes:</strong> Quando um usuário é removido, todas as suas recomendações e curtidas são excluídas automaticamente (<code className="text-indigo-300">ON DELETE CASCADE</code>).
                  </p>
                  <p>
                    • <strong>Integridade de Avaliação:</strong> Restrição <code className="text-indigo-300">CHECK (rating &gt;= 1 AND rating &lt;= 5)</code> garante notas válidas tanto no banco quanto na API.
                  </p>
                  <p>
                    • <strong>Proteção de Autoria:</strong> Tanto no backend Express quanto via políticas RLS no Supabase, apenas o titular da indicação pode executar operações de <code className="text-indigo-300">UPDATE</code> e <code className="text-indigo-300">DELETE</code>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <pre className="overflow-x-auto text-xs leading-relaxed text-zinc-300 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
              <code>{currentContent}</code>
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/70 flex items-center justify-between text-xs text-zinc-400">
          <span>Localização no projeto: /prisma/schema.prisma e /database/schema.sql</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
