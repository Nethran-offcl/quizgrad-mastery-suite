import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import db from "./db";

function hashPassword(password: string, salt: Buffer): Buffer {
	return crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512");
}

export async function signup(req: Request, res: Response) {
	const { email, password, role } = req.body || {};
	if (!email || !password) {
		return res.status(400).json({ error: "email and password required" });
	}
	const salt = crypto.randomBytes(16);
	const passwordHash = hashPassword(password, salt);
	try {
		const userRole = role === 'admin' ? 'admin' : 'user';
		await db.execute(
			"INSERT INTO users (email, password_hash, salt, role) VALUES (?, ?, ?, ?)",
			[email, passwordHash, salt, userRole]
		);
		return res.status(201).json({ ok: true, role: userRole });
	} catch (err: any) {
		if (err && err.code === "ER_DUP_ENTRY") {
			return res.status(409).json({ error: "email already exists" });
		}
		return res.status(500).json({ error: "signup failed" });
	}
}

export async function login(req: Request, res: Response) {
	const { email, password } = req.body || {};
	if (!email || !password) {
		return res.status(400).json({ error: "email and password required" });
	}
	const [rows] = await db.execute(
		"SELECT id, password_hash, salt, role FROM users WHERE email = ?",
		[email]
	);
	const users = rows as Array<{
		id: number;
		password_hash: Buffer;
		salt: Buffer;
		role: 'admin' | 'user';
	}>;
	if (users.length === 0) {
		return res.status(401).json({ error: "invalid credentials" });
	}
	const { id, password_hash, salt, role: userRole } = users[0];
	const computed = hashPassword(password, salt);
	if (!crypto.timingSafeEqual(computed, password_hash)) {
		return res.status(401).json({ error: "invalid credentials" });
	}
	// Return user id and role
	return res.json({ userId: id, email, role: userRole });
}

export function requireUserId(req: Request, res: Response, next: NextFunction) {
	const userId = req.header("x-user-id");
	if (!userId) {
		return res.status(401).json({ error: "missing x-user-id header" });
	}
	(req as any).userId = Number(userId);
	next();
}


