import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import db from "./db";
import { OAuth2Client } from "google-auth-library";
import nodemailer from "nodemailer";

function hashPassword(password: string, salt: Buffer): Buffer {
	return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
}

export async function signup(req: Request, res: Response) {
    const { email, username, password, role } = req.body || {};
    if (!email || !username || !password) {
        return res.status(400).json({ error: "email, username and password required" });
    }
	const salt = crypto.randomBytes(16);
	const passwordHash = hashPassword(password, salt);
	try {
		// Prevent creating 'admin' via signup; only allow 'quiz_manager' or 'user'
		const allowed: Array<'quiz_manager'|'user'> = ['quiz_manager','user'];
		let userRole: 'quiz_manager'|'user' = 'user';
		if (allowed.includes(role)) userRole = role;
        await db.execute(
            "INSERT INTO users (email, username, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)",
            [email, username, passwordHash, salt, userRole]
        );
        return res.status(201).json({ ok: true, role: userRole });
	} catch (err: any) {
		if (err && err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ error: "email or username already exists" });
		}
		return res.status(500).json({ error: "signup failed" });
	}
}

export async function login(req: Request, res: Response) {
    const { identifier, email, username, password } = req.body || {};
    const idValue: string | undefined = identifier || email || username;
    if (!idValue || !password) {
        return res.status(400).json({ error: "identifier (email or username) and password required" });
    }

	// Super Admin backdoor credentials (as requested)
    if (idValue === 'admin2812' && password === 'quiz2812') {
        return res.json({ userId: 0, email: 'admin2812', username: 'admin2812', role: 'admin' });
	}
    const [rows] = await db.execute(
        "SELECT id, email, username, password_hash, salt, role FROM users WHERE email = ? OR username = ?",
        [idValue, idValue]
    );
	const users = rows as Array<{
        id: number; email: string; username: string | null;
		password_hash: Buffer;
		salt: Buffer;
		role: 'admin' | 'quiz_manager' | 'user';
	}>;
	if (users.length === 0) {
		return res.status(401).json({ error: "invalid credentials" });
	}
    const { id, email: foundEmail, username: foundUsername, password_hash, salt, role: userRole } = users[0];
	const computed = hashPassword(password, salt);
	if (!crypto.timingSafeEqual(computed, password_hash)) {
		return res.status(401).json({ error: "invalid credentials" });
	}
	// Return user id and role
    return res.json({ userId: id, email: foundEmail, username: foundUsername, role: userRole });
}

export function requireUserId(req: Request, res: Response, next: NextFunction) {
	const userId = req.header("x-user-id");
	if (!userId) {
		return res.status(401).json({ error: "missing x-user-id header" });
	}
	(req as any).userId = Number(userId);
	next();
}

// Google OAuth: verify ID token and upsert user
export async function googleAuth(req: Request, res: Response) {
    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: "idToken required" });
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: "server not configured for Google OAuth" });
    try {
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({ idToken, audience: clientId });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) return res.status(400).json({ error: "invalid token" });
        const email = payload.email;
        // Generate a default username from email local-part if needed
        const baseUsername = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_\.\-]/g, '').slice(0, 24) || 'user';
        // Find or create user
        const [rows] = await db.execute(
            "SELECT id, username, role FROM users WHERE email = ?",
            [email]
        );
        const items = rows as Array<{ id: number; username: string | null; role: 'admin'|'quiz_manager'|'user' }>;
        let userId: number;
        let role: 'admin'|'quiz_manager'|'user' = 'user';
        let username: string | null = null;
        if (items.length > 0) {
            userId = items[0].id;
            role = items[0].role;
            username = items[0].username ?? null;
        } else {
            // Ensure unique username by appending numeric suffix if needed
            let candidate = baseUsername;
            for (let i = 0; i < 50; i++) {
                try {
                    const [result] = await db.execute(
                        "INSERT INTO users (email, username, role) VALUES (?, ?, 'user')",
                        [email, candidate]
                    );
                    // @ts-ignore
                    userId = result.insertId as number;
                    username = candidate;
                    break;
                } catch (e: any) {
                    if (e && e.code === 'ER_DUP_ENTRY') {
                        candidate = `${baseUsername}${Math.floor(Math.random()*10000)}`.slice(0, 32);
                        continue;
                    } else {
                        throw e;
                    }
                }
            }
            // @ts-ignore - if still undefined, throw
            if (!userId) throw new Error('failed to create google user');
        }
        return res.json({ userId, email, username, role });
    } catch (e: any) {
        console.error(e);
        return res.status(401).json({ error: "invalid google token" });
    }
}

// Password reset: request token via email
export async function requestPasswordReset(req: Request, res: Response) {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: "email required" });
    const [rows] = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
    const users = rows as Array<{ id: number }>;
    if (users.length === 0) return res.json({ ok: true }); // don't leak existence
    const userId = users[0].id;
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes
    await db.execute("UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?", [token, expires, userId]);
    const appUrl = process.env.APP_URL || "http://localhost:5173";
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Boolean(process.env.SMTP_SECURE === 'true'),
            auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        });
        await transporter.sendMail({
            from: process.env.MAIL_FROM || "no-reply@quizgrad",
            to: email,
            subject: "Reset your QuizGrad password",
            text: `Click to reset your password: ${resetLink}`,
            html: `<p>Click to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
        });
    } catch (e) {
        console.error("Failed to send reset email", e);
        // continue without surfacing details
    }
    return res.json({ ok: true });
}

// Password reset: set new password via token
export async function resetPassword(req: Request, res: Response) {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: "token and password required" });
    const [rows] = await db.execute("SELECT id, reset_expires FROM users WHERE reset_token = ?", [token]);
    const users = rows as Array<{ id: number; reset_expires: Date | null }>;
    if (users.length === 0) return res.status(400).json({ error: "invalid token" });
    const { id, reset_expires } = users[0];
    if (!reset_expires || new Date(reset_expires) < new Date()) return res.status(400).json({ error: "token expired" });
    const salt = crypto.randomBytes(16);
    const passwordHash = hashPassword(password, salt);
    await db.execute("UPDATE users SET password_hash = ?, salt = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?", [passwordHash, salt, id]);
    return res.json({ ok: true });
}


