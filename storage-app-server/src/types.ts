import { Request } from 'express';
import { Document, Model, Types } from 'mongoose';

declare module 'express-serve-static-core' {
  interface Request {
    user?: DecodedUser;
  }
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  passwordHash: string;
  is_active?: boolean;
  status?: string;
  hourly_cost?: number;
  createdAt?: Date;
}

export interface DecodedUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: DecodedUser;
}

export interface IWorksite {
  client_id: Types.ObjectId;
  name: string;
  is_active?: boolean;
  address: string;
  description?: string;
  planned_hours?: number;
  end_date?: Date;
}

export interface IWorksiteDocument extends IWorksite, Document {}

export interface IWorksiteModel extends Model<IWorksiteDocument> {
  updateHours(worksiteId: string, hoursLogged: number): Promise<void>;
}
