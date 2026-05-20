import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface TokenPayload {
  userId: string;
  role: string;
}

export const generateToken = (userId: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'super_secret_dev_key_for_smart_leads';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId, role }, secret, { expiresIn: expiresIn as any });
};


export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET || 'super_secret_dev_key_for_smart_leads';
  return jwt.verify(token, secret) as TokenPayload;
};

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
