![Hired](/public/hired-banner.png)

### AI-Powered Job Application Platform _(Work in Progress)_

Hired is an AI-driven job application assistant designed to help users **discover relevant opportunities**, **optimize resumes**, and **prepare for interviews** using intelligent, agent-driven workflows.

> **Project Status**  
> Hired is actively under development. Core infrastructure, architecture, and initial UI are in place, with features being implemented incrementally.

---

## Vision

Job seekers spend significant time manually searching, tailoring resumes, and preparing for interviews across multiple platforms.  
Hired aims to **automate and optimize the entire job application lifecycle** using Generative AI and agentic workflows.

The platform focuses on:

- Reducing manual effort
- Improving job match quality
- Providing actionable career insights
- Supporting long-term career growth

---

## Demo Preview

> A full demo will be added once core workflows are implemented.

For now, here’s an early preview of the product direction:

![Landing Page](/public/screenshots/landing-page.png)

---

## Planned Core Features

### AI-Powered Job Matching

- Intelligent job recommendations based on resume and preferences
- Semantic matching using embeddings
- Filtering based on role, location, and experience

### Resume Analysis & Optimization

- AI-based resume evaluation
- Keyword and structure improvement suggestions
- Role-specific resume feedback

### Agentic Workflows

- Background job alerts and notifications
- Multi-step agent-driven task execution

### Career Insights & Analytics

- Skill-gap detection and recommendations
- Application tracking and outcome analysis
- Long-term career progression insights

---

## Architecture Overview

Hired is being built as a **full-stack, AI-first application**:

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Drizzle ORM
- **API Layer**: Elysia
- **AI Models**: Gemini API
- **Async Workflows**: Inngest
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

The architecture is designed to support:

- Background AI workflows
- Structured AI outputs
- Scalable agent execution
- Strong data consistency

---

## Tech Stack

- Next.js
- TypeScript
- PostgreSQL
- Drizzle ORM
- Elysia
- Gemini API
- Inngest
- Tailwind CSS

---

## Local Development

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud)

### Setup

1. **Clone and install dependencies**

```bash
git clone https://github.com/asadsid004/hired.git
cd hired
npm install
```

2. **Set up environment variables**

```bash
cp .env.example .env
```

Configure your `.env` file with:

- `DATABASE_URL` - Your PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Generate a random secret key
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - OAuth credentials from Google Console
- `BETTER_AUTH_URL` & `NEXT_PUBLIC_API_URL` - Set to `http://localhost:3000` for local dev

3. **Set up the database**

```bash
npm run db:push  # Push schema to database
# or
npm run db:migrate  # Run migrations
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

### Running the App

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
