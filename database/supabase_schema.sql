-- ============================================================================
-- 🚀 MURAL DE INDICAÇÕES - SCRIPT SQL COMPLETO PARA O SUPABASE (POSTGRESQL)
-- ============================================================================
-- Este script foi projetado para ser executado diretamente no SQL Editor do Supabase.
-- Ele cria:
-- 1. Extensões e Tipos
-- 2. Tabela de Perfis integrada com Supabase Auth (auth.users)
-- 3. Tabela de Indicações (Games, Filmes e Músicas)
-- 4. Tabela de Curtidas (Upvotes com restrição única)
-- 5. Triggers automáticos para criação de perfil e atualização de timestamps
-- 6. Políticas completas de Row Level Security (RLS)
-- 7. View analítica com contagem de likes e dados do autor
-- 8. Função RPC para toggle de curtidas (curtir/descurtir atômico)
-- ============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. TABELA: PROFILES (Integrada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Comentários de documentação
COMMENT ON TABLE public.profiles IS 'Perfis públicos dos usuários vinculados à autenticação do Supabase';

-- 3. TABELA: RECOMMENDATIONS (Indicações de Games, Filmes e Músicas)
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('game', 'movie', 'music')),
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    genre TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.recommendations IS 'Mural de indicações com avaliações de 1 a 5 estrelas';

-- 4. TABELA: LIKES (Curtidas / Upvotes)
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    -- Cada usuário pode curtir uma indicação específica apenas uma única vez
    CONSTRAINT uq_user_recommendation_like UNIQUE (user_id, recommendation_id)
);

COMMENT ON TABLE public.likes IS 'Registro relacional de upvotes/curtidas por indicação';

-- ============================================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON public.recommendations(category);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON public.recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_rating ON public.recommendations(rating DESC);
CREATE INDEX IF NOT EXISTS idx_likes_recommendation_id ON public.likes(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);

-- ============================================================================
-- TRIGGERS E FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para updated_at em profiles
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para updated_at em recommendations
DROP TRIGGER IF EXISTS set_recommendations_updated_at ON public.recommendations;
CREATE TRIGGER set_recommendations_updated_at
    BEFORE UPDATE ON public.recommendations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Função para criar automaticamente um perfil público quando um novo usuário se cadastrar no auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    raw_name TEXT;
BEGIN
    raw_name := COALESCE(
        NEW.raw_user_meta_data->>'display_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    INSERT INTO public.profiles (id, email, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        raw_name,
        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            'https://api.dicebear.com/7.x/identicon/svg?seed=' || encode(raw_name::bytea, 'hex')
        )
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        updated_at = timezone('utc'::text, now());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger de vinculação com Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Políticas para PROFILES
-- ----------------------------------------------------------------------------
-- 1. Qualquer pessoa (autenticada ou anônima) pode ler perfis públicos
CREATE POLICY "Perfis públicos são visíveis para todos"
    ON public.profiles
    FOR SELECT
    USING (true);

-- 2. Usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Usuários podem editar seu próprio perfil"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Políticas para RECOMMENDATIONS
-- ----------------------------------------------------------------------------
-- 1. Leitura aberta para visitantes anônimos e usuários
CREATE POLICY "Indicações são públicas para visualização"
    ON public.recommendations
    FOR SELECT
    USING (true);

-- 2. Apenas usuários logados podem criar indicações vinculadas ao seu user_id
CREATE POLICY "Usuários autenticados podem criar indicações"
    ON public.recommendations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Criadores podem editar sua própria indicação (ou administradores)
CREATE POLICY "Autores podem atualizar suas indicações"
    ON public.recommendations
    FOR UPDATE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 4. Criadores podem excluir sua própria indicação (ou administradores)
CREATE POLICY "Autores podem excluir suas indicações"
    ON public.recommendations
    FOR DELETE
    TO authenticated
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- ----------------------------------------------------------------------------
-- Políticas para LIKES
-- ----------------------------------------------------------------------------
-- 1. Leitura aberta de curtidas
CREATE POLICY "Curtidas são visíveis publicamente"
    ON public.likes
    FOR SELECT
    USING (true);

-- 2. Apenas usuários autenticados podem dar curtidas
CREATE POLICY "Usuários autenticados podem curtir"
    ON public.likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Usuários podem remover sua própria curtida (descurtir)
CREATE POLICY "Usuários podem remover suas próprias curtidas"
    ON public.likes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================================================
-- VIEW ANALÍTICA COM CONTADORES DE LIKES
-- ============================================================================
CREATE OR REPLACE VIEW public.v_recommendations_feed AS
SELECT 
    r.id,
    r.user_id,
    r.title,
    r.category,
    r.description,
    r.image_url,
    r.rating,
    r.genre,
    r.created_at,
    r.updated_at,
    p.display_name AS author_name,
    p.avatar_url AS author_avatar,
    p.email AS author_email,
    COUNT(l.id)::INTEGER AS likes_count
FROM public.recommendations r
LEFT JOIN public.profiles p ON r.user_id = p.id
LEFT JOIN public.likes l ON r.id = l.recommendation_id
GROUP BY r.id, p.id;

-- ============================================================================
-- FUNÇÃO RPC PARA TOGGLE DE CURTIDA (ATÔMICA)
-- Chame via: const { data, error } = await supabase.rpc('toggle_recommendation_like', { rec_id: '...' });
-- ============================================================================
CREATE OR REPLACE FUNCTION public.toggle_recommendation_like(rec_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    curr_user_id UUID;
    existing_like_id UUID;
    is_liked BOOLEAN;
    total_likes INTEGER;
BEGIN
    curr_user_id := auth.uid();
    IF curr_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;

    -- Verifica se já curtiu
    SELECT id INTO existing_like_id
    FROM public.likes
    WHERE user_id = curr_user_id AND recommendation_id = rec_id;

    IF existing_like_id IS NOT NULL THEN
        -- Remove curtida
        DELETE FROM public.likes WHERE id = existing_like_id;
        is_liked := false;
    ELSE
        -- Adiciona curtida
        INSERT INTO public.likes (user_id, recommendation_id)
        VALUES (curr_user_id, rec_id);
        is_liked := true;
    END IF;

    -- Conta total de curtidas atualizado
    SELECT COUNT(*)::INTEGER INTO total_likes
    FROM public.likes
    WHERE recommendation_id = rec_id;

    RETURN jsonb_build_object(
        'liked', is_liked,
        'likesCount', total_likes
    );
END;
$$;
