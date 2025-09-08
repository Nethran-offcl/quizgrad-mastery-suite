// Mock data that matches MySQL schema structure

export interface Topic {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export interface Question {
  id: number;
  topic_id: number;
  question_text: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_option: 1 | 2 | 3 | 4;
  created_at: string;
}

export interface QuizResult {
  id: number;
  user_id: number;
  topic_id: number;
  score: number;
  total_questions: number;
  taken_at: string;
}

export const mockTopics: Topic[] = [
  {
    id: 1,
    title: "JavaScript Fundamentals",
    description: "Test your knowledge of basic JavaScript concepts",
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    title: "React Basics",
    description: "Learn about React components and hooks",
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 3,
    title: "CSS Styling",
    description: "Master CSS properties and layouts",
    created_at: "2024-01-01T00:00:00Z"
  }
];

export const mockQuestions: Question[] = [
  // JavaScript questions
  {
    id: 1,
    topic_id: 1,
    question_text: "What is the correct way to declare a variable in JavaScript?",
    option1: "var myVar = 5;",
    option2: "variable myVar = 5;",
    option3: "v myVar = 5;",
    option4: "declare myVar = 5;",
    correct_option: 1,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 2,
    topic_id: 1,
    question_text: "Which method is used to add an element to the end of an array?",
    option1: "append()",
    option2: "push()",
    option3: "add()",
    option4: "insert()",
    correct_option: 2,
    created_at: "2024-01-01T00:00:00Z"
  },
  // React questions
  {
    id: 3,
    topic_id: 2,
    question_text: "What is JSX?",
    option1: "A JavaScript library",
    option2: "A syntax extension for JavaScript",
    option3: "A CSS framework",
    option4: "A database query language",
    correct_option: 2,
    created_at: "2024-01-01T00:00:00Z"
  },
  {
    id: 4,
    topic_id: 2,
    question_text: "Which hook is used for state management in React?",
    option1: "useEffect",
    option2: "useContext",
    option3: "useState",
    option4: "useReducer",
    correct_option: 3,
    created_at: "2024-01-01T00:00:00Z"
  },
  // CSS questions
  {
    id: 5,
    topic_id: 3,
    question_text: "Which CSS property is used to change the text color?",
    option1: "color",
    option2: "text-color",
    option3: "font-color",
    option4: "text-style",
    correct_option: 1,
    created_at: "2024-01-01T00:00:00Z"
  }
];

export const mockResults: QuizResult[] = [
  {
    id: 1,
    user_id: 2,
    topic_id: 1,
    score: 1,
    total_questions: 2,
    taken_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    user_id: 2,
    topic_id: 2,
    score: 2,
    total_questions: 2,
    taken_at: "2024-01-16T14:20:00Z"
  }
];