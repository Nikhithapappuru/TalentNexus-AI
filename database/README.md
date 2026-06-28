# TalentNexus AI Database

Run these files against a fresh PostgreSQL database in this order:

1. `001_extensions.sql`
2. `002_enums.sql`
3. `003_users.sql`
4. `004_companies.sql`
5. `005_profiles.sql`
6. `006_jobs.sql`
7. `008_skills.sql`
8. `009_candidate_data.sql`
9. `010_documents.sql`
10. `007_applications.sql`
11. `011_indexes.sql`

`007_applications.sql` must run after `010_documents.sql` because applications can reference uploaded resume documents.
