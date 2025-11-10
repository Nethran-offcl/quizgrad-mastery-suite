🧠 QuizGrad

An intelligent, modern quiz and learning mastery platform built with React + TypeScript (frontend) and Express.js (backend) — designed to enhance learning through quizzes, progress tracking, and personalized feedback.

🚀 Overview

QuizGrad Mastery Suite is a web-based application that allows users to:

Take quizzes on various subjects.

Track progress and performance.

View analytics and mastery insights.

Experience smooth UI/UX with modern animations and responsive design.

Built with scalability, modularity, and developer experience in mind — using Vite, Tailwind CSS, and ShadCN/UI components for a clean, maintainable frontend, and Express + TypeScript for the backend API.

🧩 Tech Stack
Frontend

⚛️ React + TypeScript

⚡ Vite (for blazing fast builds)

🎨 Tailwind CSS

🧱 ShadCN/UI components

🌙 Dark/Light Theme Toggle

🔐 Protected Routes (Authentication integrated)

Backend

🧠 Express.js + TypeScript

🗄️ Database integration (configured in server/src/db.ts)

🔑 Authentication logic (JWT/session handling in server/src/auth.ts)

📡 RESTful APIs (defined in server/src/routes.ts)

🛠️ Project Structure
quizgrad-mastery-suite/
├── src/                     # Frontend source (React + TS)
│   ├── components/          # Reusable UI and functional components
│   ├── App.tsx              # Root React component
│   ├── main.tsx             # Entry point
│   └── styles, assets...    # Global CSS, icons, etc.
│
├── server/                  # Backend (Express)
│   ├── src/
│   │   ├── index.ts         # Entry point for backend server
│   │   ├── auth.ts          # Authentication middleware
│   │   ├── db.ts            # Database configuration
│   │   ├── routes.ts        # API route definitions
│   │   └── types.ts         # Shared TypeScript types
│   └── package.json         # Backend dependencies
│
├── public/                  # Static files (favicon, robots.txt, etc.)
├── package.json             # Frontend dependencies
├── vite.config.ts           # Frontend Vite configuration
└── tailwind.config.ts       # Tailwind customization

⚙️ Installation & Setup
1. Clone the repository
git clone https://github.com/<your-username>/quizgrad-mastery-suite.git
cd quizgrad-mastery-suite

2. Install dependencies
npm install

3. Setup backend
cd server
npm install
npm run dev

4. Run frontend

Open another terminal in the root folder:

npm run dev

5. Access the app

Open your browser and go to:
👉 http://localhost:5173

🧰 Available Scripts
Command	Description
npm run dev	Starts the frontend in development mode
npm run build	Builds the production-ready frontend
npm run lint	Runs ESLint checks
npm run preview	Previews the production build locally
cd server && npm run dev	Runs backend server in watch mode
🔒 Environment Variables

Create a .env file inside the server/ directory with the following fields:

PORT=5000
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url

🎯 Key Features

✅ User authentication & protected routes
✅ Fully responsive UI with light/dark mode
✅ Modular quiz and result tracking system
✅ REST API for backend integration
✅ Modern developer experience (Vite + TypeScript)
✅ Easy extensibility for adding subjects or quiz types

🧑‍💻 Development Notes

Type Safety: The entire codebase uses TypeScript for reliable development.

Code Style: ESLint and Prettier are configured for consistent code formatting.

UI: Built using Tailwind CSS and ShadCN/UI for elegant and consistent design.

📦 Deployment

To build for production:

npm run build


This generates optimized static files in the dist/ folder.

For backend deployment, ensure your environment variables are set and deploy the Express server via Render, Vercel, or Railway.

🤝 Contributing

Contributions are welcome!
Please fork the repository, make your changes, and submit a pull request.

📜 License

This project is licensed under the MIT License.

🌟 Acknowledgements

Vite

Tailwind CSS

ShadCN/UI

Express.js

TypeScript
