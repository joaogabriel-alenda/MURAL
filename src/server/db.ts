import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  StoredUser,
  StoredRecommendation,
  StoredLike,
  User,
  Recommendation,
  CategoryType,
  CreateRecommendationInput,
  UpdateRecommendationInput,
  StatsResponse,
} from '../types.ts';

interface DatabaseSchema {
  users: StoredUser[];
  recommendations: StoredRecommendation[];
  likes: StoredLike[];
}

const DB_FILE = path.resolve(process.cwd(), 'database', 'mural_data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'mural-de-indicacoes-secret-key-2026';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(testHash, 'hex'));
  } catch {
    return false;
  }
}

export function createToken(userId: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 dias
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payloadObj = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (payloadObj.exp && payloadObj.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payloadObj.sub || null;
  } catch {
    return null;
  }
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    recommendations: [],
    likes: [],
  };
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        this.isLoaded = true;
      } else {
        this.seedInitialData();
      }
    } catch (err) {
      console.error('Erro ao carregar banco de dados:', err);
      this.seedInitialData();
    }
  }

  private persist() {
    try {
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Erro ao persistir banco:', err);
    }
  }

  private seedInitialData() {
    const user1Id = 'u-ana-silva';
    const user2Id = 'u-carlos-dev';
    const user3Id = 'u-mariana-geek';

    const users: StoredUser[] = [
      {
        id: user1Id,
        email: 'ana.silva@exemplo.com',
        displayName: 'Ana Silva',
        passwordHash: hashPassword('123456'),
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      },
      {
        id: user2Id,
        email: 'carlos.dev@exemplo.com',
        displayName: 'Carlos Eduardo',
        passwordHash: hashPassword('123456'),
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
      {
        id: user3Id,
        email: 'mariana.geek@exemplo.com',
        displayName: 'Mariana Costa',
        passwordHash: hashPassword('123456'),
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ];

    const recommendations: StoredRecommendation[] = [
      // GAMES
      {
        id: 'rec-game-1',
        userId: user1Id,
        title: 'Elden Ring',
        category: 'game',
        description:
          'Uma obra-prima absoluta de exploração em mundo aberto e combate desafiador. As Terras Intermédias oferecem segredos infinitos, atmosfera gótica e direção de arte impecável da FromSoftware.',
        imageUrl:
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80',
        rating: 5,
        genre: 'Soulslike / RPG de Ação',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
      },
      {
        id: 'rec-game-2',
        userId: user2Id,
        title: 'Hollow Knight',
        category: 'game',
        description:
          'O ápice dos jogos indie de plataforma e exploração (Metroidvania). Hallownest é um reino decadente e fascinante com trilha sonora sublime de Christopher Larkin e jogabilidade extremamente precisa.',
        imageUrl:
          'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
        rating: 5,
        genre: 'Metroidvania / Indie',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      },
      {
        id: 'rec-game-3',
        userId: user3Id,
        title: 'Cyberpunk 2077: Phantom Liberty',
        category: 'game',
        description:
          'Night City atinge seu potencial máximo com a expansão Phantom Liberty. A trama de espionagem política em Dogtown, com Idris Elba e Keanu Reeves, traz dilemas morais brutais e visuais de tirar o fôlego.',
        imageUrl:
          'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=800&auto=format&fit=crop&q=80',
        rating: 4,
        genre: 'Ficção Científica / RPG',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },

      // FILMES
      {
        id: 'rec-movie-1',
        userId: user2Id,
        title: 'Interestelar (Interstellar)',
        category: 'movie',
        description:
          'Dirigido por Christopher Nolan, é uma jornada cinematográfica emocionante sobre amor, tempo e a sobrevivência da humanidade através de buracos de minhoca. A trilha de Hans Zimmer é inesquecível.',
        imageUrl:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        rating: 5,
        genre: 'Ficção Científica / Drama',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      },
      {
        id: 'rec-movie-2',
        userId: user1Id,
        title: 'Duna: Parte 2 (Dune: Part Two)',
        category: 'movie',
        description:
          'Denis Villeneuve entrega um espetáculo épico em Arrakis. Fotografia monumental, design de som estrondoso e a ascensão messiânica de Paul Atreides constroem uma experiência cinematográfica definitiva.',
        imageUrl:
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
        rating: 5,
        genre: 'Épico / Sci-Fi',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      },
      {
        id: 'rec-movie-3',
        userId: user3Id,
        title: 'Homem-Aranha no Aranhaverso',
        category: 'movie',
        description:
          'Revolucionou a linguagem visual da animação moderna mesclando estética de quadrinhos com narrativa comovente sobre amadurecimento e representatividade através de Miles Morales.',
        imageUrl:
          'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&auto=format&fit=crop&q=80',
        rating: 5,
        genre: 'Animação / Ação',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      },

      // MÚSICAS
      {
        id: 'rec-music-1',
        userId: user3Id,
        title: 'Random Access Memories - Daft Punk',
        category: 'music',
        description:
          'Um tributo analógico primoroso à disco music dos anos 70/80 com baterias orgânicas gravadas em estúdio lendário. Faixas como "Get Lucky", "Giorgio by Moroder" e "Instant Crush" são patrimônios sonoros.',
        imageUrl:
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
        rating: 5,
        genre: 'Eletrônica / Funk Disco',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      },
      {
        id: 'rec-music-2',
        userId: user1Id,
        title: 'Clube da Esquina - Milton Nascimento & Lô Borges',
        category: 'music',
        description:
          'Um dos maiores álbuns da história da música mundial (1972). Uma fusão celestial de bossa nova, rock progressivo, música mineira e jazz. "Trem Azul" e "O Trem das Sete" arrepiam a cada audição.',
        imageUrl:
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
        rating: 5,
        genre: 'MPB / Rock Psicodélico',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
      },
      {
        id: 'rec-music-3',
        userId: user2Id,
        title: 'The Dark Side of the Moon - Pink Floyd',
        category: 'music',
        description:
          'O álbum conceitual por excelência. Trata de loucura, ganância, tempo e morte com engenharia de áudio inovadora de Alan Parsons. Ouça do início ao fim com fones de ouvido.',
        imageUrl:
          'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
        rating: 5,
        genre: 'Rock Progressivo',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
    ];

    const likes: StoredLike[] = [
      { id: 'l1', userId: user1Id, recommendationId: 'rec-game-2', createdAt: new Date().toISOString() },
      { id: 'l2', userId: user3Id, recommendationId: 'rec-game-2', createdAt: new Date().toISOString() },
      { id: 'l3', userId: user2Id, recommendationId: 'rec-game-1', createdAt: new Date().toISOString() },
      { id: 'l4', userId: user3Id, recommendationId: 'rec-game-1', createdAt: new Date().toISOString() },
      { id: 'l5', userId: user1Id, recommendationId: 'rec-movie-1', createdAt: new Date().toISOString() },
      { id: 'l6', userId: user3Id, recommendationId: 'rec-movie-1', createdAt: new Date().toISOString() },
      { id: 'l7', userId: user2Id, recommendationId: 'rec-music-2', createdAt: new Date().toISOString() },
      { id: 'l8', userId: user1Id, recommendationId: 'rec-music-1', createdAt: new Date().toISOString() },
    ];

    this.data = { users, recommendations, likes };
    this.persist();
    this.isLoaded = true;
  }

  // --- Auth / Users ---
  findUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    const u = this.data.users.find((user) => user.id === id);
    if (!u) return undefined;
    const { passwordHash, ...rest } = u;
    return rest;
  }

  createUser(email: string, password: string,displayName: string, avatarUrl?: string): User {
    const existing = this.findUserByEmail(email);
    if (existing) {
      throw new Error('E-mail já cadastrado');
    }
    const newUser: StoredUser = {
      id: `u-${crypto.randomUUID()}`,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim(),
      passwordHash: hashPassword(password),
      avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(displayName)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.persist();
    const { passwordHash, ...safeUser } = newUser;
    return safeUser;
  }

  validateCredentials(email: string, password: string): User | null {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // --- Recommendations ---
  getRecommendations(params: {
    category?: CategoryType | 'all';
    search?: string;
    sortBy?: 'recent' | 'rating' | 'likes';
    userId?: string;
    currentUserId?: string;
  }): Recommendation[] {
    let list = [...this.data.recommendations];

    // Filter by Category
    if (params.category && params.category !== 'all') {
      list = list.filter((r) => r.category === params.category);
    }

    // Filter by Author User ID
    if (params.userId) {
      list = list.filter((r) => r.userId === params.userId);
    }

    // Filter by Search Query
    if (params.search && params.search.trim() !== '') {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          (r.genre && r.genre.toLowerCase().includes(q))
      );
    }

    // Map to Recommendation with likes and user details
    const result: Recommendation[] = list.map((r) => {
      const author = this.findUserById(r.userId);
      const likes = this.data.likes.filter((l) => l.recommendationId === r.id);
      const isLiked = params.currentUserId
        ? likes.some((l) => l.userId === params.currentUserId)
        : false;

      return {
        ...r,
        user: author
          ? {
              id: author.id,
              displayName: author.displayName,
              email: author.email,
              avatarUrl: author.avatarUrl,
            }
          : {
              id: r.userId,
              displayName: 'Usuário Desconhecido',
              email: 'anonymo@exemplo.com',
            },
        likesCount: likes.length,
        isLikedByCurrentUser: isLiked,
      };
    });

    // Sorting
    const sort = params.sortBy || 'recent';
    if (sort === 'likes') {
      result.sort((a, b) => b.likesCount - a.likesCount);
    } else if (sort === 'rating') {
      result.sort((a, b) => b.rating - a.rating || b.likesCount - a.likesCount);
    } else {
      // Recent
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }

  getRecommendationById(id: string, currentUserId?: string): Recommendation | null {
    const r = this.data.recommendations.find((item) => item.id === id);
    if (!r) return null;
    const author = this.findUserById(r.userId);
    const likes = this.data.likes.filter((l) => l.recommendationId === r.id);
    const isLiked = currentUserId ? likes.some((l) => l.userId === currentUserId) : false;

    return {
      ...r,
      user: author
        ? {
            id: author.id,
            displayName: author.displayName,
            email: author.email,
            avatarUrl: author.avatarUrl,
          }
        : undefined,
      likesCount: likes.length,
      isLikedByCurrentUser: isLiked,
    };
  }

  createRecommendation(userId: string, input: CreateRecommendationInput): Recommendation {
    if (!input.title || !input.description || !input.imageUrl || !input.rating || !input.category) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos');
    }
    if (input.rating < 1 || input.rating > 5) {
      throw new Error('A avaliação deve ser entre 1 e 5 estrelas');
    }

    const now = new Date().toISOString();
    const newRec: StoredRecommendation = {
      id: `rec-${crypto.randomUUID()}`,
      userId,
      title: input.title.trim(),
      category: input.category,
      description: input.description.trim(),
      imageUrl: input.imageUrl.trim(),
      rating: Math.round(input.rating),
      genre: input.genre?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.data.recommendations.unshift(newRec);
    this.persist();

    return this.getRecommendationById(newRec.id, userId)!;
  }

  updateRecommendation(
    id: string,
    userId: string,
    input: UpdateRecommendationInput,
    asAdmin: boolean = true
  ): Recommendation {
    const index = this.data.recommendations.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('Indicação não encontrada');
    }
    const current = this.data.recommendations[index];
    if (!asAdmin && current.userId !== userId) {
      throw new Error('Apenas o autor pode editar esta indicação');
    }

    if (input.rating && (input.rating < 1 || input.rating > 5)) {
      throw new Error('A avaliação deve ser entre 1 e 5 estrelas');
    }

    const updated: StoredRecommendation = {
      ...current,
      title: input.title !== undefined ? input.title.trim() : current.title,
      category: input.category !== undefined ? input.category : current.category,
      description: input.description !== undefined ? input.description.trim() : current.description,
      imageUrl: input.imageUrl !== undefined ? input.imageUrl.trim() : current.imageUrl,
      rating: input.rating !== undefined ? Math.round(input.rating) : current.rating,
      genre: input.genre !== undefined ? input.genre.trim() || undefined : current.genre,
      updatedAt: new Date().toISOString(),
    };

    this.data.recommendations[index] = updated;
    this.persist();

    return this.getRecommendationById(id, userId)!;
  }

  deleteRecommendation(id: string, userId: string, asAdmin: boolean = true): boolean {
    const index = this.data.recommendations.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('Indicação não encontrada');
    }
    const current = this.data.recommendations[index];
    if (!asAdmin && current.userId !== userId) {
      throw new Error('Apenas o criador pode excluir esta indicação');
    }

    // Remove recommendation
    this.data.recommendations.splice(index, 1);
    // Cascade delete likes
    this.data.likes = this.data.likes.filter((l) => l.recommendationId !== id);
    this.persist();

    return true;
  }

  bulkDeleteRecommendations(ids: string[]): number {
    let deletedCount = 0;
    for (const id of ids) {
      const idx = this.data.recommendations.findIndex((r) => r.id === id);
      if (idx !== -1) {
        this.data.recommendations.splice(idx, 1);
        this.data.likes = this.data.likes.filter((l) => l.recommendationId !== id);
        deletedCount++;
      }
    }
    if (deletedCount > 0) {
      this.persist();
    }
    return deletedCount;
  }

  duplicateRecommendation(id: string, userId: string): Recommendation {
    const original = this.data.recommendations.find((r) => r.id === id);
    if (!original) {
      throw new Error('Indicação não encontrada para duplicação');
    }

    const now = new Date().toISOString();
    const duplicated: StoredRecommendation = {
      id: `rec-${crypto.randomUUID()}`,
      userId,
      title: `${original.title} (Cópia)`,
      category: original.category,
      description: original.description,
      imageUrl: original.imageUrl,
      rating: original.rating,
      genre: original.genre,
      createdAt: now,
      updatedAt: now,
    };

    this.data.recommendations.unshift(duplicated);
    this.persist();

    return this.getRecommendationById(duplicated.id, userId)!;
  }

  toggleLike(recommendationId: string, userId: string): { liked: boolean; likesCount: number } {
    const rec = this.data.recommendations.find((r) => r.id === recommendationId);
    if (!rec) {
      throw new Error('Indicação não encontrada');
    }

    const existingIndex = this.data.likes.findIndex(
      (l) => l.recommendationId === recommendationId && l.userId === userId
    );

    let liked = false;
    if (existingIndex >= 0) {
      // Dislike / remove like
      this.data.likes.splice(existingIndex, 1);
      liked = false;
    } else {
      // Add like
      this.data.likes.push({
        id: `like-${crypto.randomUUID()}`,
        userId,
        recommendationId,
        createdAt: new Date().toISOString(),
      });
      liked = true;
    }

    this.persist();

    const count = this.data.likes.filter((l) => l.recommendationId === recommendationId).length;
    return { liked, likesCount: count };
  }

  getStats(): StatsResponse {
    const totalRecommendations = this.data.recommendations.length;
    const totalGames = this.data.recommendations.filter((r) => r.category === 'game').length;
    const totalMovies = this.data.recommendations.filter((r) => r.category === 'movie').length;
    const totalMusic = this.data.recommendations.filter((r) => r.category === 'music').length;
    const totalUsers = this.data.users.length;
    const totalLikes = this.data.likes.length;

    return {
      totalRecommendations,
      totalGames,
      totalMovies,
      totalMusic,
      totalUsers,
      totalLikes,
    };
  }

  resetSeed(): void {
    this.seedInitialData();
  }
}

export const db = new Database();
