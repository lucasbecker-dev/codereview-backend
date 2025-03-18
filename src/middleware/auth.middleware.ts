import { Request, Response, NextFunction } from 'express';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import User, { IUser, UserRole } from '../models/user.model';

// Extend the Express Request interface to include user property
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

// Interface for JWT payload
interface JwtPayload {
    id: string;
}

// Middleware to authenticate JWT token
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authentication required. No token provided.' });
        }

        const token = authHeader.split(' ')[1];
        const SECRET_KEY = process.env.JWT_SECRET || 'default_jwt_secret';

        // Verify token
        const decoded = jwt.verify(token, SECRET_KEY) as JwtPayload;

        // Find user by decoded ID
        const user = await User.findById(decoded.id);
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Authentication failed. User not found or inactive.' });
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid token.' });
        } else if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token expired.' });
        }

        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// Middleware to check if user has required role
export const authorize = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        if (!roles.includes(req.user.role as UserRole)) {
            return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
        }

        next();
    };
};

// Generate JWT token
export const generateAuthToken = (user: IUser): string => {
    const SECRET_KEY = process.env.JWT_SECRET || 'default_jwt_secret';
    const TOKEN_EXPIRY = process.env.JWT_EXPIRY || '7d';

    const options: SignOptions = { expiresIn: TOKEN_EXPIRY };

    return jwt.sign(
        { id: user._id.toString() },
        SECRET_KEY as Secret,
        options
    );
}; 