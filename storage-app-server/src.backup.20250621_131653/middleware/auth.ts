import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { DecodedUser } from '../types';

// Define a custom type for the JWT payload
interface JwtPayload {
  user: DecodedUser
}

const auth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, `${process.env.JWT_SECRET}`) as JwtPayload;
    decoded.user = { ...decoded.user, id: decoded.user._id };
    req.user = decoded.user;
    next();
  } catch (_err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

export default auth;