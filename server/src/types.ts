export type User = {
	id: number;
	email: string;
};

export type Question = {
	id: number;
	title: string;
	body: string | null;
	created_by: number | null;
};

export type Answer = {
	id: number;
	question_id: number;
	body: string;
	is_correct: boolean;
	created_by: number | null;
};


