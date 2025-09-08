import { Router } from "express";
import db, { initializeDatabase } from "./db";
import { login, signup, requireUserId } from "./auth";

const router = Router();

// Ensure tables exist on first request if not already initialized (also export a function for index.ts)
let initialized = false;
async function ensureInit() {
	if (!initialized) {
		await initializeDatabase();
		initialized = true;
	}
}

router.use(async (_req, _res, next) => {
	await ensureInit();
	next();
});

// Auth
router.post("/auth/signup", signup);
router.post("/auth/login", login);

// Topics
router.get("/topics", async (_req, res) => {
    const [rows] = await db.query("SELECT id, title, description, created_at FROM topics ORDER BY id DESC");
    res.json(rows);
});

router.post("/topics", requireUserId, async (req, res) => {
    const { title, description } = req.body || {};
    if (!title) return res.status(400).json({ error: "title required" });
    const [result] = await db.execute(
        "INSERT INTO topics (title, description) VALUES (?, ?)",
        [title, description || null]
    );
    // @ts-ignore
    res.status(201).json({ id: result.insertId });
});

router.put("/topics/:id", requireUserId, async (req, res) => {
    const id = Number(req.params.id);
    const { title, description } = req.body || {};
    await db.execute("UPDATE topics SET title = ?, description = ? WHERE id = ?", [title, description || null, id]);
    res.json({ ok: true });
});

router.delete("/topics/:id", requireUserId, async (req, res) => {
    const id = Number(req.params.id);
    await db.execute("DELETE FROM topics WHERE id = ?", [id]);
    res.json({ ok: true });
});

// Questions CRUD
router.get("/questions", async (req, res) => {
	const topicId = req.query.topicId ? Number(req.query.topicId) : null;
	if (topicId) {
		const [rows] = await db.query("SELECT * FROM questions WHERE topic_id = ? ORDER BY id DESC", [topicId]);
		return res.json(rows);
	}
	const [rows] = await db.query("SELECT * FROM questions ORDER BY id DESC");
	return res.json(rows);
});

router.post("/questions", requireUserId, async (req, res) => {
	try {
		const { title, body, topicId } = req.body || {};
		if (!title) return res.status(400).json({ error: "title required" });
		const topicIdNum = topicId != null ? Number(topicId) : null;
		if (topicIdNum != null && Number.isNaN(topicIdNum)) {
			return res.status(400).json({ error: "invalid topicId" });
		}
		if (topicIdNum != null) {
			const [existsRows] = await db.query("SELECT id FROM topics WHERE id = ?", [topicIdNum]);
			const exists = (existsRows as any[]).length > 0;
			if (!exists) return res.status(400).json({ error: "topic does not exist" });
		}
		const [result] = await db.execute(
			"INSERT INTO questions (title, body, topic_id, created_by) VALUES (?, ?, ?, ?)",
			[title, body || null, topicIdNum, (req as any).userId]
		);
		// @ts-ignore - Ok to cast for insertId
		res.status(201).json({ id: result.insertId });
	} catch (e: any) {
		console.error(e);
		res.status(500).json({ error: process.env.NODE_ENV === 'production' ? "failed to create question" : (e?.message || "failed to create question") });
	}
});

router.put("/questions/:id", requireUserId, async (req, res) => {
	try {
		const { title, body, topicId } = req.body || {};
		const id = Number(req.params.id);
		const topicIdNum = topicId != null ? Number(topicId) : null;
		if (topicIdNum != null && Number.isNaN(topicIdNum)) {
			return res.status(400).json({ error: "invalid topicId" });
		}
		if (topicIdNum != null) {
			const [existsRows] = await db.query("SELECT id FROM topics WHERE id = ?", [topicIdNum]);
			const exists = (existsRows as any[]).length > 0;
			if (!exists) return res.status(400).json({ error: "topic does not exist" });
		}
		await db.execute(
			"UPDATE questions SET title = ?, body = ?, topic_id = ? WHERE id = ?",
			[title, body || null, topicIdNum, id]
		);
		res.json({ ok: true });
	} catch (e: any) {
		console.error(e);
		res.status(500).json({ error: process.env.NODE_ENV === 'production' ? "failed to update question" : (e?.message || "failed to update question") });
	}
});

router.delete("/questions/:id", requireUserId, async (req, res) => {
	try {
		const id = Number(req.params.id);
		await db.execute("DELETE FROM questions WHERE id = ?", [id]);
		res.json({ ok: true });
	} catch (e) {
		console.error(e);
		res.status(500).json({ error: "failed to delete question" });
	}
});

// Answers CRUD
router.get("/questions/:id/answers", async (req, res) => {
	const questionId = Number(req.params.id);
	const [rows] = await db.execute(
		"SELECT * FROM answers WHERE question_id = ? ORDER BY id ASC",
		[questionId]
	);
	res.json(rows);
});

router.post("/questions/:id/answers", requireUserId, async (req, res) => {
	const questionId = Number(req.params.id);
	const { body, is_correct } = req.body || {};
	if (!body) return res.status(400).json({ error: "body required" });
	const [result] = await db.execute(
		"INSERT INTO answers (question_id, body, is_correct, created_by) VALUES (?, ?, ?, ?)",
		[questionId, body, Boolean(is_correct), (req as any).userId]
	);
	// @ts-ignore
	res.status(201).json({ id: result.insertId });
});

router.put("/answers/:id", requireUserId, async (req, res) => {
	const answerId = Number(req.params.id);
	const { body, is_correct } = req.body || {};
	await db.execute(
		"UPDATE answers SET body = ?, is_correct = ? WHERE id = ?",
		[body, Boolean(is_correct), answerId]
	);
	res.json({ ok: true });
});

router.delete("/answers/:id", requireUserId, async (req, res) => {
	const answerId = Number(req.params.id);
	await db.execute("DELETE FROM answers WHERE id = ?", [answerId]);
	res.json({ ok: true });
});

// Results
router.get("/results", requireUserId, async (req, res) => {
	const userId = (req as any).userId as number;
	const [rows] = await db.execute(
		"SELECT id, user_id, topic_id, score, total_questions, taken_at FROM quiz_results WHERE user_id = ? ORDER BY taken_at DESC",
		[userId]
	);
	res.json(rows);
});

router.post("/results", requireUserId, async (req, res) => {
	const userId = (req as any).userId as number;
	const { topic_id, score, total_questions } = req.body || {};
	if (!topic_id || score == null || total_questions == null) {
		return res.status(400).json({ error: "topic_id, score, total_questions required" });
	}
	await db.execute(
		"INSERT INTO quiz_results (user_id, topic_id, score, total_questions) VALUES (?, ?, ?, ?)",
		[userId, Number(topic_id), Number(score), Number(total_questions)]
	);
	res.status(201).json({ ok: true });
});

export default router;


