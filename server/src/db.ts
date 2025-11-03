import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

const pool = mysql.createPool({
	host: process.env.MYSQL_HOST || "localhost",
	user: process.env.MYSQL_USER || "root",
	password: process.env.MYSQL_PASSWORD || "",
	database: process.env.MYSQL_DATABASE || "quizgrad",
	connectionLimit: 10,
});

export async function initializeDatabase(): Promise<void> {
	const connection = await pool.getConnection();
	try {
		// Topics table
		await connection.query(`CREATE TABLE IF NOT EXISTS topics (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(255) NOT NULL,
			description VARCHAR(1000) NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`);

		await connection.query(`CREATE TABLE IF NOT EXISTS users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(50) NULL UNIQUE,
			email VARCHAR(255) NOT NULL UNIQUE,
			password_hash VARBINARY(255) NULL,
			salt VARBINARY(255) NULL,
			role ENUM('admin','quiz_manager','user') NOT NULL DEFAULT 'user',
			reset_token VARCHAR(255) NULL,
			reset_expires DATETIME NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`);

		// Ensure ENUM includes new roles in case table already existed
		try { await connection.query("ALTER TABLE users MODIFY role ENUM('admin','quiz_manager','user') NOT NULL DEFAULT 'user'"); } catch {}
		// Add username column if missing and ensure unique index
		try { await connection.query("ALTER TABLE users ADD COLUMN username VARCHAR(50) NULL"); } catch {}
		try { await connection.query("CREATE UNIQUE INDEX idx_users_username ON users (username)"); } catch {}
		try { await connection.query("ALTER TABLE users MODIFY password_hash VARBINARY(255) NULL"); } catch {}
		try { await connection.query("ALTER TABLE users MODIFY salt VARBINARY(255) NULL"); } catch {}
		try { await connection.query("ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL"); } catch {}
		try { await connection.query("ALTER TABLE users ADD COLUMN reset_expires DATETIME NULL"); } catch {}

		await connection.query(`CREATE TABLE IF NOT EXISTS questions (
			id INT AUTO_INCREMENT PRIMARY KEY,
			title VARCHAR(500) NOT NULL,
			body TEXT,
			topic_id INT NULL,
			created_by INT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
			FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE SET NULL
		)`);

		await connection.query(`CREATE TABLE IF NOT EXISTS answers (
			id INT AUTO_INCREMENT PRIMARY KEY,
			question_id INT NOT NULL,
			body TEXT NOT NULL,
			is_correct BOOLEAN DEFAULT FALSE,
			created_by INT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
			FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
		)`);

		await connection.query(`CREATE TABLE IF NOT EXISTS quiz_results (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL,
			topic_id INT NOT NULL,
			score INT NOT NULL,
			total_questions INT NOT NULL,
			taken_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
			FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
		)`);

		// Backfill topic_id from JSON in body if present (one-time safe no-op per row)
		try {
			const [rows] = await connection.query(`SELECT id, body, topic_id FROM questions`);
			const items = rows as Array<{ id: number; body: string | null; topic_id: number | null }>; 
			for (const q of items) {
				if (q.topic_id == null && q.body) {
					try {
						const parsed = JSON.parse(q.body);
						if (parsed && typeof parsed.topic_id === 'number') {
							await connection.query(`UPDATE questions SET topic_id = ? WHERE id = ?`, [parsed.topic_id, q.id]);
						}
					} catch {}
				}
			}
		} catch {}
	} finally {
		connection.release();
	}
}

export default pool;


