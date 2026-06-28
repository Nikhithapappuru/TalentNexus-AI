CREATE TABLE applications
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    candidate_id UUID NOT NULL,

    job_id UUID NOT NULL,

    resume_document_id UUID,

    status application_status NOT NULL DEFAULT 'applied',

    semantic_match_score DECIMAL(5,2),

    ai_explanation TEXT,

    recruiter_notes TEXT,

    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_candidate

        FOREIGN KEY(candidate_id)

        REFERENCES candidate_profiles(id)

        ON DELETE RESTRICT,

    CONSTRAINT fk_job

        FOREIGN KEY(job_id)

        REFERENCES jobs(id)

        ON DELETE RESTRICT,

    CONSTRAINT fk_resume

        FOREIGN KEY(resume_document_id)

        REFERENCES documents(id)

        ON DELETE SET NULL,

    CONSTRAINT uq_candidate_job_application

        UNIQUE(candidate_id, job_id),

    CONSTRAINT chk_semantic_match_score

        CHECK
        (
            semantic_match_score IS NULL
            OR
            (
                semantic_match_score >= 0
                AND
                semantic_match_score <= 100
            )
        )
);
