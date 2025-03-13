const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../../models');
const { protect, authorize } = require('../../middleware/auth');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../models', () => ({
    User: {
        findById: jest.fn()
    }
}));

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup request, response, and next function mocks
        req = {
            cookies: {},
            headers: {
                authorization: ''
            }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });

    describe('protect middleware', () => {
        it('should return 401 if no token is provided', async () => {
            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized, no token'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should extract token from cookies', async () => {
            const token = 'valid-token';
            req.cookies.auth_token = token;

            const userId = new mongoose.Types.ObjectId();
            jwt.verify.mockReturnValue({ id: userId });

            const mockUser = {
                _id: userId,
                name: 'Test User',
                email: 'test@example.com',
                role: 'student',
                isActive: true
            };

            User.findById.mockResolvedValue(mockUser);

            await protect(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });

        it('should extract token from authorization header', async () => {
            const token = 'valid-token';
            req.headers.authorization = `Bearer ${token}`;

            const userId = new mongoose.Types.ObjectId();
            jwt.verify.mockReturnValue({ id: userId });

            const mockUser = {
                _id: userId,
                name: 'Test User',
                email: 'test@example.com',
                role: 'student',
                isActive: true
            };

            User.findById.mockResolvedValue(mockUser);

            await protect(req, res, next);

            expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET);
            expect(User.findById).toHaveBeenCalledWith(userId);
            expect(req.user).toEqual(mockUser);
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if token verification fails', async () => {
            req.cookies.auth_token = 'invalid-token';

            jwt.verify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Not authorized, token failed'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if user is not found', async () => {
            req.cookies.auth_token = 'valid-token';

            const userId = new mongoose.Types.ObjectId();
            jwt.verify.mockReturnValue({ id: userId });

            User.findById.mockResolvedValue(null);

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User not found'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if user account is deactivated', async () => {
            req.cookies.auth_token = 'valid-token';

            const userId = new mongoose.Types.ObjectId();
            jwt.verify.mockReturnValue({ id: userId });

            const mockUser = {
                _id: userId,
                name: 'Test User',
                email: 'test@example.com',
                role: 'student',
                isActive: false
            };

            User.findById.mockResolvedValue(mockUser);

            await protect(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'User account is deactivated'
            });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('authorize middleware', () => {
        beforeEach(() => {
            // Setup user in request
            req.user = {
                _id: new mongoose.Types.ObjectId(),
                name: 'Test User',
                email: 'test@example.com',
                role: 'student',
                isActive: true
            };
        });

        it('should call next if user role is authorized', () => {
            const authMiddleware = authorize(['student', 'admin']);

            authMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should return 403 if user role is not authorized', () => {
            const authMiddleware = authorize(['admin', 'reviewer']);

            authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Role student is not authorized to access this resource'
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should work with a single role in the array', () => {
            const authMiddleware = authorize(['student']);

            authMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        it('should work with multiple roles in the array', () => {
            req.user.role = 'admin';
            const authMiddleware = authorize(['student', 'admin', 'reviewer']);

            authMiddleware(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });
}); 