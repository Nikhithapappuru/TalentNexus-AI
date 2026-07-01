# TalentNexus AI

AI-powered talent intelligence and recruitment platform with candidate profiles,
job matching, resume analysis, document RAG, recruiter workflows, and admin
controls.

## Tech Stack

- Backend: Node.js, Express, PostgreSQL, pgvector, JWT, bcrypt, Multer
- AI: Gemini generation and embeddings
- Frontend: React, Vite, Axios
- Database: PostgreSQL 17 with `vector` extension

## Project Structure

```text
backend/     Express API, controllers, middleware, uploads
database/    PostgreSQL setup scripts
docs/        API docs and Postman collection
frontend/    React frontend
```

## Prerequisites

- Node.js 20+
- PostgreSQL 17
- pgvector installed for your PostgreSQL server
- Gemini API key

On Windows, use `npm.cmd` if PowerShell blocks the normal `npm` command.

## Database Setup

Create a fresh database:

```bash
createdb -U postgres talentnexus
```

Run the database scripts in this order:

```bash
psql -U postgres -d talentnexus -f database/001_extensions.sql
psql -U postgres -d talentnexus -f database/002_enums.sql
psql -U postgres -d talentnexus -f database/003_users.sql
psql -U postgres -d talentnexus -f database/004_companies.sql
psql -U postgres -d talentnexus -f database/005_profiles.sql
psql -U postgres -d talentnexus -f database/006_jobs.sql
psql -U postgres -d talentnexus -f database/008_skills.sql
psql -U postgres -d talentnexus -f database/009_candidate_data.sql
psql -U postgres -d talentnexus -f database/010_documents.sql
psql -U postgres -d talentnexus -f database/007_applications.sql
psql -U postgres -d talentnexus -f database/011_indexes.sql
```

`007_applications.sql` runs after `010_documents.sql` because applications can
reference uploaded resume documents.

## Backend Setup

```bash
cd backend
npm install
copy .env.example .env
```

Update `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=talentnexus
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=replace_with_a_long_random_secret
GEMINI_API_KEY=your_gemini_api_key
```

Start the API:

```bash
npm.cmd run dev
```

Health check:

```text
GET http://localhost:5000/health
```

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
```

Start the app:

```bash
npm.cmd run dev
```

Default frontend URL:

```text
http://localhost:5173
```

## Manual Test Flow

1. Register a candidate account.
2. Create candidate profile, skills, and projects.
3. Upload a resume using the resume intelligence panel.
4. Prepare the uploaded resume for Q&A.
5. Ask a document question and generate resume feedback.
6. Register a recruiter account.
7. Create company and recruiter profile.
8. Post a job and add required skills.
9. Upload and prepare company hiring documents.
10. Register or login as candidate and apply to the job.
11. As recruiter, load applicants, rank applicants, view match, and update status.
12. Register or login as admin and check stats, users, companies, and status controls.

## API Docs

See [docs/API.md](docs/API.md) for endpoint details.

Import [docs/TalentNexus.postman_collection.json](docs/TalentNexus.postman_collection.json)
into Postman to test the backend locally.

For a complete browser-based manual test flow, see
[docs/LOCAL_TESTING.md](docs/LOCAL_TESTING.md).

## Build Checks

Frontend:

```bash
cd frontend
npm.cmd run build
```

Backend syntax/start check:

```bash
cd backend
npm.cmd start
```
