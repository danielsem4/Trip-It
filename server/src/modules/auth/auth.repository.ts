import prisma from '../../lib/prisma';

export interface AuthUserRecord {
  id: number;
  email: string;
  name: string | null;
  hashPassword: string;
  role: string;
  isActive: boolean;
}

export interface CreateUserData {
  email: string;
  name: string;
  hashPassword: string;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<AuthUserRecord | null>;
  findById(id: number): Promise<AuthUserRecord | null>;
  create(data: CreateUserData): Promise<AuthUserRecord>;
}

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  async findById(id: number): Promise<AuthUserRecord | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async create(data: CreateUserData): Promise<AuthUserRecord> {
    return prisma.user.create({ data: { ...data, email: data.email.toLowerCase() } });
  }
}
