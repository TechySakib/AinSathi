# AinSathi (আইনসাথী) - AI Legal Assistant ⚖️

AinSathi is a secure, professional, and visually immersive AI-powered legal assistant platform specifically tailored for the Bangladesh legal framework. It leverages Retrieval-Augmented Generation (RAG) to provide accurate, context-aware, and cited legal insights.

## ✨ Key Features

- **3D Interactive Homepage:** A stunning "Temple of Justice" immersive experience built with Three.js.
- **RAG-Powered Legal AI:** A bilingual intelligent chatbot handling complex queries regarding the Bangladesh legal framework.
- **Hybrid AI Model Integration:** Interacts with local, custom-trained AI models via a FastAPI proxy server, alongside Google Gemini capabilities.
- **Secure Authentication:** User management and reliable data persistence powered by Supabase.
- **Privacy-First "Incognito Mode":** Advanced chat session management offering an ephemeral, private-session chat experience.
- **Premium Design:** A cohesive design system utilizing a deep blue and gold color palette to establish legal authority, trust, and exceptional aesthetics.

## 🛠️ Technology Stack

- **Frontend:** Next.js, React, TypeScript
- **3D Rendering:** Three.js
- **Backend & Auth:** Supabase (PostgreSQL), Next.js Server Components
- **AI SDKs:** `@google/generative-ai` and Custom Python Model Server
- **Styling:** CSS Modules with Vanilla CSS constraints, targeting high-end dynamic web design

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18+)
- npm

### Local Setup

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Set up Environment Variables:**
   Ensure you have a `.env.local` file configured in the root directory. This must include your Supabase connection details:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # Any AI model API keys if needed
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Navigate to the App:** 
   Open [http://localhost:3000](http://localhost:3000) in your web browser to experience AinSathi.

## 🗄️ Database Setup

The project relies on a Supabase PostgreSQL database for:
- User Authentication (Supabase Auth)
- Chat History Persistence (`schema.sql`)
- [Optional] Vector embeddings for local RAG retrieval

Make sure to push your `schema.sql` to your Supabase project to ensure the backend interacts properly.

