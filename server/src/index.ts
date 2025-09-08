import express from "express";
import dotenv from "dotenv";
import routes from "./routes";
import { initializeDatabase } from "./db";

dotenv.config();

const app = express();

// Minimal CORS for local dev
app.use((req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	const reqHeaders = (req.headers["access-control-request-headers"] as string) || "Content-Type, Authorization, x-user-id";
	res.header("Access-Control-Allow-Headers", reqHeaders);
	res.header("Access-Control-Max-Age", "600");
	if (req.method === "OPTIONS") {
		return res.sendStatus(200);
	}
	next();
});
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true });
});

app.use("/api", routes);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;
initializeDatabase()
	.then(() => {
		app.listen(port, () => {
			console.log(`API listening on http://localhost:${port}`);
		});
	})
	.catch((err) => {
		console.error("Failed to initialize database:", err);
		process.exit(1);
	});


