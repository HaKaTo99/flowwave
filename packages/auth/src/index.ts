import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { FastifyRequest, FastifyReply } from 'fastify';

// Types
export interface User {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    role: 'admin' | 'user' | 'viewer';
    createdAt: Date;
    updatedAt: Date;
}

export interface JwtPayload {
    userId: string;
    email: string;
    role: string;
    iat?: number;
    exp?: number;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'flowwave-dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'flowwave-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 10;

/**
 * FlowWave Authentication Service
 */
export class FlowWaveAuth {

    /**
     * Hash a password using bcrypt
     */
    async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, SALT_ROUNDS);
    }

    /**
     * Verify a password against its hash
     */
    async verifyPassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }

    /**
     * Generate JWT tokens (access + refresh)
     */
    generateTokens(user: { id: string; email: string; role: string }): AuthTokens {
        const payload: JwtPayload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };

        const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });

        return {
            accessToken,
            refreshToken,
            expiresIn: 15 * 60 // 15 minutes in seconds
        };
    }

    /**
     * Verify an access token
     */
    verifyAccessToken(token: string): JwtPayload | null {
        try {
            return jwt.verify(token, JWT_SECRET) as JwtPayload;
        } catch (error) {
            return null;
        }
    }

    /**
     * Verify a refresh token
     */
    verifyRefreshToken(token: string): JwtPayload | null {
        try {
            return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
        } catch (error) {
            return null;
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
        const payload = this.verifyRefreshToken(refreshToken);
        if (!payload) return null;

        return this.generateTokens({
            id: payload.userId,
            email: payload.email,
            role: payload.role
        });
    }

    /**
     * Extract token from Authorization header
     */
    extractTokenFromHeader(authHeader?: string): string | null {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.slice(7);
    }
}

/**
 * Fastify authentication middleware
 */
export const authMiddleware = (auth: FlowWaveAuth) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const token = auth.extractTokenFromHeader(request.headers.authorization);

        if (!token) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'No access token provided'
            });
        }

        const payload = auth.verifyAccessToken(token);

        if (!payload) {
            return reply.status(401).send({
                error: 'Unauthorized',
                message: 'Invalid or expired token'
            });
        }

        // Attach user info to request
        (request as any).user = payload;
    };
};

/**
 * Role-based access control middleware
 */
export const requireRole = (roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const user = (request as any).user as JwtPayload;

        if (!user || !roles.includes(user.role)) {
            return reply.status(403).send({
                error: 'Forbidden',
                message: 'Insufficient permissions'
            });
        }
    };
};

// Export singleton instance
export const auth = new FlowWaveAuth();
