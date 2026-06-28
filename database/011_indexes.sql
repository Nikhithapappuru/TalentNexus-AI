CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_users_role ON users(role);

CREATE INDEX idx_candidate_profiles_user_id ON candidate_profiles(user_id);

CREATE INDEX idx_recruiter_profiles_user_id ON recruiter_profiles(user_id);

CREATE INDEX idx_recruiter_profiles_company_id ON recruiter_profiles(company_id);

CREATE INDEX idx_jobs_company_id ON jobs(company_id);

CREATE INDEX idx_jobs_created_by ON jobs(created_by);

CREATE INDEX idx_jobs_employment_type ON jobs(employment_type);

CREATE INDEX idx_jobs_work_mode ON jobs(work_mode);

CREATE INDEX idx_candidate_skills_candidate_id ON candidate_skills(candidate_id);

CREATE INDEX idx_candidate_skills_skill_id ON candidate_skills(skill_id);

CREATE INDEX idx_job_skills_job_id ON job_skills(job_id);

CREATE INDEX idx_job_skills_skill_id ON job_skills(skill_id);

CREATE INDEX idx_projects_candidate_id ON projects(candidate_id);

CREATE INDEX idx_education_candidate_id ON education(candidate_id);

CREATE INDEX idx_experience_candidate_id ON experience(candidate_id);

CREATE INDEX idx_documents_owner_user_id ON documents(owner_user_id);

CREATE INDEX idx_documents_company_id ON documents(company_id);

CREATE INDEX idx_documents_document_type ON documents(document_type);

CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);

CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);

CREATE INDEX idx_applications_job_id ON applications(job_id);

CREATE INDEX idx_applications_status ON applications(status);

CREATE INDEX idx_document_chunks_embedding
    ON document_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
