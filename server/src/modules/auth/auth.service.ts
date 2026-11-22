import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/errors/AppError';
import type { AuthUserRecord, IAuthRepository } from './auth.repository';
import type { LoginDto, RegisterDto } from './auth.schema';

interface UserShape {
  id: number;
  email: string;
  name: string | null;
  role: string;
}

interface AuthResult {
  token: string;
  user: UserShape;
}

function getJwtSecret(): string {
  const secret = process.env['JWT_SECRET'];
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

function toUserShape(user: AuthUserRecord): UserShape {
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export class AuthService {
  constructor(private readonly repository: IAuthRepository) {}

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.repository.findByEmail(dto.email);
    if (!user || !user.isActive) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValid = await bcrypt.compare(dto.password, user.hashPassword);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    return this.issueToken(user);
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.repository.findByEmail(dto.email);
    if (existing) {
      throw new AppError('Email is already registered', 409);
    }

    const hashPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.repository.create({ email: dto.email, name: dto.name, hashPassword });
    return this.issueToken(user);
  }

  async getMe(userId: number): Promise<UserShape> {
    const user = await this.repository.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError('Authentication required', 401);
    }
    return toUserShape(user);
  }

  private issueToken(user: AuthUserRecord): AuthResult {
    const token = jwt.sign({ userId: user.id, role: user.role }, getJwtSecret(), { expiresIn: '8h' });
    return { token, user: toUserShape(user) };
  }
}
