-- =========================================================================
-- MURAL DE INDICAÇÕES - SCRIPT SQL COMPLETO
-- Compatível com PostgreSQL / Supabase e SQLite
-- =========================================================================

-- 1. TABELA DE USUÁRIOS / PERFIS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE INDICAÇÕES (GAMES, FILMES, MÚSICAS)
CREATE TABLE IF NOT EXISTS recommendations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('game', 'movie', 'music')),
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    genre VARCHAR(80),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_recommendations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. TABELA DE CURTIDAS (LIKES / UPVOTES)
CREATE TABLE IF NOT EXISTS likes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    recommendation_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_likes_recommendation FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_recommendation_like UNIQUE (user_id, recommendation_id)
);

-- ÍNDICES PARA ALTA PERFORMANCE EM BUSCA E FILTROS
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_recommendation_id ON likes(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- =========================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - SUPABASE POSTGRESQL)
-- Ative se estiver executando no painel SQL do Supabase
-- =========================================================================
/*
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Visitantes e usuários podem ler todas as recomendações:
CREATE POLICY "Qualquer pessoa pode visualizar indicações"
ON recommendations FOR SELECT USING (true);

-- Apenas usuários autenticados podem inserir:
CREATE POLICY "Usuários autenticados podem criar indicações"
ON recommendations FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Apenas o criador pode atualizar:
CREATE POLICY "Apenas o autor pode atualizar sua indicação"
ON recommendations FOR UPDATE USING (auth.uid()::text = user_id);

-- Apenas o criador pode deletar:
CREATE POLICY "Apenas o autor pode excluir sua indicação"
ON recommendations FOR DELETE USING (auth.uid()::text = user_id);

-- Curtidas:
CREATE POLICY "Qualquer pessoa pode ler curtidas"
ON likes FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem curtir"
ON likes FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Usuários podem remover sua própria curtida"
ON likes FOR DELETE USING (auth.uid()::text = user_id);
*/
