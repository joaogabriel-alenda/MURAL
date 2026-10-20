import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { db, createToken, verifyToken } from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AuthRequest extends Request {
  userId?: string;
}

// Middleware de Autenticação
function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de autenticação não fornecido ou inválido' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const userId = verifyToken(token);

  if (!userId) {
    res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    return;
  }

  req.userId = userId;
  next();
}

// Middleware Opcional de Usuário (para identificar se o visitante está logado em rotas públicas)
function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const userId = verifyToken(token);
    if (userId) {
      req.userId = userId;
    }
  }
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // ==========================================
  // ROTAS DE AUTENTICAÇÃO
  // ==========================================

  // Registro de novo usuário
  app.post('/api/auth/register', (req: Request, res: Response) => {
    try {
      const { email, password, displayName, avatarUrl } = req.body;

      if (!email || !password || !displayName) {
        res.status(400).json({ error: 'E-mail, senha e nome de exibição são obrigatórios' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres' });
        return;
      }

      const user = db.createUser(email, password, displayName, avatarUrl);
      const token = createToken(user.id);

      res.status(201).json({ user, token });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao criar conta' });
    }
  });

  // Login de usuário
  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
        return;
      }

      const user = db.validateCredentials(email, password);
      if (!user) {
        res.status(401).json({ error: 'E-mail ou senha incorretos' });
        return;
      }

      const token = createToken(user.id);
      res.json({ user, token });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro interno ao realizar login' });
    }
  });

  // Obter perfil autenticado atual
  app.get('/api/auth/me', authMiddleware, (req: AuthRequest, res: Response) => {
    const user = db.findUserById(req.userId!);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }
    res.json({ user });
  });

  // Login rápido de demonstração (Demo)
  app.post('/api/auth/demo', (req: Request, res: Response) => {
    const targetEmail = req.body.email || 'carlos.dev@exemplo.com';
    const user = db.validateCredentials(targetEmail, '123456');
    if (!user) {
      // Se não achar Carlos, pega o primeiro
      const first = db.getRecommendations({})[0]?.user;
      if (first) {
        const found = db.findUserById(first.id);
        if (found) {
          const token = createToken(found.id);
          res.json({ user: found, token });
          return;
        }
      }
      res.status(404).json({ error: 'Conta de demonstração não disponível' });
      return;
    }
    const token = createToken(user.id);
    res.json({ user, token });
  });

  // ==========================================
  // ROTAS DE INDICAÇÕES (CRUD + LIKES)
  // ==========================================

  // Listar indicações com filtros, busca e ordenação
  app.get('/api/recommendations', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const { category, search, sortBy, userId } = req.query;

      const recommendations = db.getRecommendations({
        category: category as any,
        search: typeof search === 'string' ? search : undefined,
        sortBy: sortBy as any,
        userId: typeof userId === 'string' ? userId : undefined,
        currentUserId: req.userId,
      });

      res.json({ data: recommendations });
    } catch (err: any) {
      res.status(500).json({ error: 'Erro ao buscar indicações' });
    }
  });

  // Obter detalhes de uma indicação específica
  app.get('/api/recommendations/:id', optionalAuthMiddleware, (req: AuthRequest, res: Response) => {
    const recommendation = db.getRecommendationById(req.params.id, req.userId);
    if (!recommendation) {
      res.status(404).json({ error: 'Indicação não encontrada' });
      return;
    }
    res.json({ data: recommendation });
  });

  // Criar nova indicação (Apenas autenticado)
  app.post('/api/recommendations', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const { title, category, description, imageUrl, rating, genre } = req.body;

      if (!title || !category || !description || !imageUrl || rating === undefined) {
        res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos' });
        return;
      }

      if (!['game', 'movie', 'music'].includes(category)) {
        res.status(400).json({ error: 'Categoria inválida. Escolha entre game, movie ou music.' });
        return;
      }

      const recommendation = db.createRecommendation(req.userId!, {
        title,
        category,
        description,
        imageUrl,
        rating: Number(rating),
        genre,
      });

      res.status(201).json({ data: recommendation });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao criar indicação' });
    }
  });

  // Editar indicação (Suporta edição de qualquer indicação no modo CRUD)
  app.put('/api/recommendations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const { title, category, description, imageUrl, rating, genre } = req.body;

      const updated = db.updateRecommendation(
        req.params.id,
        req.userId!,
        {
          title,
          category,
          description,
          imageUrl,
          rating: rating !== undefined ? Number(rating) : undefined,
          genre,
        },
        true // Permite gerenciamento completo (CRUD Total)
      );

      res.json({ data: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao atualizar indicação' });
    }
  });

  // Excluir indicação (Suporta exclusão de qualquer indicação no modo CRUD)
  app.delete('/api/recommendations/:id', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      db.deleteRecommendation(req.params.id, req.userId!, true);
      res.json({ success: true, message: 'Indicação excluída com sucesso' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao excluir indicação' });
    }
  });

  // Exclusão em lote (Bulk Delete para o painel CRUD)
  app.post('/api/recommendations/bulk-delete', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'Nenhum item selecionado para exclusão' });
        return;
      }
      const count = db.bulkDeleteRecommendations(ids);
      res.json({ success: true, count, message: `${count} indicações excluídas com sucesso` });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao excluir em lote' });
    }
  });

  // Duplicar indicação
  app.post('/api/recommendations/:id/duplicate', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const duplicated = db.duplicateRecommendation(req.params.id, req.userId!);
      res.status(201).json({ data: duplicated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao duplicar indicação' });
    }
  });

  // Curtir / Descurtir (Toggle Like)
  app.post('/api/recommendations/:id/like', authMiddleware, (req: AuthRequest, res: Response) => {
    try {
      const result = db.toggleLike(req.params.id, req.userId!);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Erro ao processar curtida' });
    }
  });

  // Estatísticas gerais
  app.get('/api/stats', (_req: Request, res: Response) => {
    const stats = db.getStats();
    res.json(stats);
  });

  // Resetar dados de demonstração
  app.post('/api/database/seed', (_req: Request, res: Response) => {
    db.resetSeed();
    res.json({ success: true, message: 'Dados de demonstração restaurados' });
  });

  // Obter schemas (SQL e Prisma) para visualização na UI
  app.get('/api/database/schemas', (_req: Request, res: Response) => {
    try {
      const prismaPath = path.resolve(__dirname, 'prisma', 'schema.prisma');
      const sqlPath = path.resolve(__dirname, 'database', 'schema.sql');
      const supabasePath = path.resolve(__dirname, 'database', 'supabase_schema.sql');

      const prismaContent = fs.existsSync(prismaPath) ? fs.readFileSync(prismaPath, 'utf-8') : '';
      const sqlContent = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, 'utf-8') : '';
      const supabaseContent = fs.existsSync(supabasePath) ? fs.readFileSync(supabasePath, 'utf-8') : '';

      res.json({
        prisma: prismaContent,
        sql: sqlContent,
        supabase: supabaseContent,
      });
    } catch {
      res.status(500).json({ error: 'Erro ao carregar schemas' });
    }
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // CONFIGURAÇÃO FRONTEND (Vite / SPA)
  // ==========================================
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor Mural de Indicações rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha fatal ao iniciar o servidor:', err);
  process.exit(1);
});
