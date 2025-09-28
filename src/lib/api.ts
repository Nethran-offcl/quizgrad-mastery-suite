const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(path: string, options: { method?: HttpMethod; body?: any; userId?: number | null } = {}): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (options.userId !== undefined && options.userId !== null) headers["x-user-id"] = String(options.userId);

	const res = await fetch(`${BASE_URL}${path}`, {
		method: options.method || "GET",
		headers,
		body: options.body ? JSON.stringify(options.body) : undefined,
	});

	if (!res.ok) {
		let message = `HTTP ${res.status}`;
		try {
			const data = await res.json();
			message = data.error || message;
		} catch {}
		const err: any = new Error(message);
		err.status = res.status;
		throw err;
	}

	try {
		return (await res.json()) as T;
	} catch {
		return undefined as unknown as T;
	}
}

export const api = {
	auth: {
		signup: (email: string, password: string, role?: 'admin' | 'quiz_manager' | 'user') => request<{ ok: true; role: 'admin' | 'quiz_manager' | 'user' }>(`/api/auth/signup`, { method: "POST", body: { email, password, role } }),
		login: (email: string, password: string) => request<{ userId: number; email: string; role: 'admin' | 'quiz_manager' | 'user' }>(`/api/auth/login`, { method: "POST", body: { email, password } }),
	},
	topics: {
		list: () => request<any[]>(`/api/topics`),
		create: (title: string, description: string | null, userId: number) => request<{ id: number }>(`/api/topics`, { method: "POST", body: { title, description }, userId }),
		update: (id: number, title: string, description: string | null, userId: number) => request<unknown>(`/api/topics/${id}`, { method: "PUT", body: { title, description }, userId }),
		remove: (id: number, userId: number) => request<unknown>(`/api/topics/${id}`, { method: "DELETE", userId }),
	},
	questions: {
		list: (topicId?: number) => request<any[]>(topicId ? `/api/questions?topicId=${topicId}` : `/api/questions`),
		create: (title: string, body: string | null, userId: number, topicId?: number) => request<{ id: number }>(`/api/questions`, { method: "POST", body: { title, body, topicId }, userId }),
		update: (id: number, title: string, body: string | null, userId: number, topicId?: number) => request<unknown>(`/api/questions/${id}`, { method: "PUT", body: { title, body, topicId }, userId }),
		remove: (id: number, userId: number) => request<unknown>(`/api/questions/${id}`, { method: "DELETE", userId }),
	},
	answers: {
		listForQuestion: (questionId: number) => request<any[]>(`/api/questions/${questionId}/answers`),
		create: (questionId: number, body: string, is_correct: boolean, userId: number) => request<{ id: number }>(`/api/questions/${questionId}/answers`, { method: "POST", body: { body, is_correct }, userId }),
		update: (answerId: number, body: string, is_correct: boolean, userId: number) => request<unknown>(`/api/answers/${answerId}`, { method: "PUT", body: { body, is_correct }, userId }),
		remove: (answerId: number, userId: number) => request<unknown>(`/api/answers/${answerId}`, { method: "DELETE", userId }),
	},
	results: {
		listMine: (userId: number) => request<any[]>(`/api/results`, { method: "GET", userId }),
		save: (userId: number, topic_id: number, score: number, total_questions: number) => request<unknown>(`/api/results`, { method: "POST", body: { topic_id, score, total_questions }, userId }),
	},
	users: {
		listAll: (userId: number) => request<any[]>(`/api/users`, { method: "GET", userId }),
		remove: (id: number, userId: number) => request<unknown>(`/api/users/${id}`, { method: "DELETE", userId }),
	},
	admin: {
		results: {
			listAll: (userId: number) => request<any[]>(`/api/admin/results`, { method: "GET", userId }),
			remove: (id: number, userId: number) => request<unknown>(`/api/admin/results/${id}`, { method: "DELETE", userId }),
		},
		stats: (userId: number) => request<{ usersCount: number; resultsCount: number; topicsCount: number; averageScorePercent: number; byUser: any[]; byTopic: any[] }>(`/api/admin/stats`, { method: "GET", userId }),
	},
};


