import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// 从环境变量获取JWT密钥，如果没有则生成一个随机密钥（仅用于开发环境）
const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  
  if (process.env.NODE_ENV === 'development') {
    return 'dev-secret-key-' + Math.random().toString(36).substring(2);
  }
  
  throw new Error('JWT_SECRET环境变量未设置');
};

const JWT_SECRET = getJwtSecret();

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function extractTokenFromRequest(req: NextRequest): string | null {
  // 从Authorization header提取token
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 从cookie提取token
  const tokenCookie = req.cookies.get('token');
  if (tokenCookie) {
    return tokenCookie.value;
  }
  
  return null;
}

export async function authenticateRequest(req: NextRequest): Promise<JWTPayload | null> {
  try {
    const token = extractTokenFromRequest(req);
    if (!token) {
      return null;
    }
    
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

export function requireAuth(req: NextRequest): Promise<JWTPayload> {
  return new Promise(async (resolve, reject) => {
    const payload = await authenticateRequest(req);
    if (!payload) {
      reject(new Error('未授权访问'));
    } else {
      resolve(payload);
    }
  });
}

export function requireAdmin(req: NextRequest): Promise<JWTPayload> {
  return new Promise(async (resolve, reject) => {
    const payload = await authenticateRequest(req);
    if (!payload) {
      reject(new Error('未授权访问'));
    } else if (payload.role !== 'admin') {
      reject(new Error('需要管理员权限'));
    } else {
      resolve(payload);
    }
  });
}
