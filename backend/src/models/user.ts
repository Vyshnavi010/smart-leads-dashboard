import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'Admin' | 'Sales User';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['Admin', 'Sales User'], default: 'Sales User', required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
