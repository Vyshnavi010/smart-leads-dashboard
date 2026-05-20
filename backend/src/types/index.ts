import { Request } from 'express';
import { TokenPayload } from '../utils/auth.js';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}
