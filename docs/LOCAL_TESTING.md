# Local Testing Guide

Use this guide after the database, backend, and frontend are running.

## Start Services

Backend:

```bash
cd backend
npm.cmd run dev
```

Frontend:

```bash
cd frontend
npm.cmd run dev
```

Open:

```text
http://localhost:5173
```

## Test Accounts

Create these from the frontend register screen:

```text
candidate@test.com / password123 / candidate
recruiter@test.com / password123 / recruiter
admin@test.com / password123 / admin
```

## Candidate Flow

1. Login as `candidate@test.com`.
2. Create candidate profile.
3. Add at least three skills, for example React, Node.js, PostgreSQL.
4. Add one project with a matching tech stack.
5. Upload a PDF or TXT resume.
6. Click `Prepare` on the uploaded resume.
7. Ask a document question.
8. Click `Get feedback`.
9. Browse open jobs.
10. Click `View match`, `Skill gap`, and `Apply`.

Expected result:

- Resume upload creates chunks.
- Prepared resume can answer questions.
- AI feedback appears after Gemini responds.
- Matching and skill-gap outputs show scores/guidance.
- Applied jobs change to `Applied`.

## Recruiter Flow

1. Login as `recruiter@test.com`.
2. Create a company.
3. Create recruiter profile using the created company ID.
4. Post a job.
5. Add required skills to the job.
6. Upload a company document.
7. Click `Prepare` on the uploaded document.
8. Ask a company document question.
9. Load applicants for the posted job.
10. Rank applicants.
11. View an applicant match.
12. Update application status.

Expected result:

- Posted job appears for candidates.
- Company documents can be prepared and queried.
- Applicant review lists candidate applications.
- Ranking displays match percentages.
- Status dropdown updates the application.

## Admin Flow

1. Login as `admin@test.com`.
2. Confirm platform stats load.
3. Review users and companies.
4. Change a user's account status.
5. Change a user's verification status.

Expected result:

- Counts reflect created candidates, recruiters, companies, jobs, applications, and documents.
- User status changes persist after refresh.

## Common Checks

- Backend health: `GET http://localhost:5000/health`
- API docs: `docs/API.md`
- Postman collection: `docs/TalentNexus.postman_collection.json`
- Frontend build:

```bash
cd frontend
npm.cmd run build
```

## Troubleshooting

- If document Q&A says no embedded chunks were found, click `Prepare` on the document first.
- If resume feedback fails, confirm `GEMINI_API_KEY` is set in `backend/.env`.
- If embeddings fail with `models/text-embedding-004 is not found`, set `GEMINI_EMBEDDING_MODEL=gemini-embedding-001` and restart the backend.
- If AI actions fail with `429 RESOURCE_EXHAUSTED`, your Gemini project has hit its current quota. Wait for the retry window, reduce repeated AI requests, or check billing/rate limits in Google AI Studio.
- If AI actions fail with `503 UNAVAILABLE` or high demand, retry after a short wait or temporarily use another available generation model.
- If uploads fail with `Field name missing`, the multipart file key must be `file`.
- If pgvector fails during setup, install the `vector` extension for the PostgreSQL server you are actually running.
