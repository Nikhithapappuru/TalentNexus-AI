# TalentNexus AI Backend API

Base URL:

```text
http://localhost:5000
```

Use JWT auth for protected endpoints:

```text
Authorization: Bearer <token>
```

## Health

```text
GET /health
GET /db-check
```

## Auth

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Register body:

```json
{
  "email": "candidate@test.com",
  "password": "password123",
  "role": "candidate"
}
```

Roles:

```text
candidate
recruiter
admin
```

## Profiles And Companies

```text
POST /api/profiles/candidate
GET  /api/profiles/candidate/me
POST /api/profiles/companies
POST /api/profiles/recruiter
GET  /api/profiles/recruiter/me
```

## Jobs

```text
GET  /api/jobs?page=1&limit=10
GET  /api/jobs/:id
GET  /api/jobs/mine?page=1&limit=10
POST /api/jobs
GET  /api/jobs/:id/skills
POST /api/jobs/:id/skills
```

Job body:

```json
{
  "title": "Full Stack Developer Intern",
  "description": "React, Node.js, PostgreSQL internship role.",
  "experienceRequired": 0,
  "minimumSalary": 10000,
  "maximumSalary": 20000,
  "employmentType": "internship",
  "workMode": "remote",
  "location": "India",
  "applicationDeadline": "2026-12-31"
}
```

## Applications

```text
POST  /api/applications
GET   /api/applications/mine
GET   /api/applications/jobs/:jobId/applicants
PATCH /api/applications/:id/status
```

Apply body:

```json
{
  "jobId": "job_uuid"
}
```

## Candidate Data

```text
POST /api/candidate-data/skills
GET  /api/candidate-data/skills
POST /api/candidate-data/projects
GET  /api/candidate-data/projects
POST /api/candidate-data/education
GET  /api/candidate-data/education
POST /api/candidate-data/experience
GET  /api/candidate-data/experience
```

## Documents And RAG

Upload uses `form-data` with file key:

```text
file
```

Endpoints:

```text
POST /api/documents/resume
POST /api/documents/company
GET  /api/documents/mine
GET  /api/documents/:id
GET  /api/documents/:id/chunks
POST /api/documents/:id/chunks/regenerate
POST /api/documents/:id/chunks/embed
POST /api/documents/search
POST /api/documents/answer
```

Search body:

```json
{
  "query": "What skills are required for this role?",
  "limit": 5
}
```

RAG answer body:

```json
{
  "question": "What is the interview process?",
  "companyId": "company_uuid",
  "limit": 5
}
```

## Matching

```text
GET /api/matches/jobs/:jobId/me
GET /api/matches/applications/:applicationId
GET /api/matches/jobs/:jobId/applicants
```

## AI Helpers

```text
GET /api/ai/resume-feedback
GET /api/ai/jobs/:jobId/skill-gap
GET /api/ai/job-recommendations?limit=10
```

## Admin

Admin role only:

```text
GET   /api/admin/stats
GET   /api/admin/users?page=1&limit=20
PATCH /api/admin/users/:userId/status
GET   /api/admin/companies?page=1&limit=20
```

User status body:

```json
{
  "accountStatus": "active",
  "verificationStatus": "verified"
}
```
