CREATE TABLE skills
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(120) NOT NULL UNIQUE,

    category VARCHAR(120),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE candidate_skills
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    candidate_id UUID NOT NULL,

    skill_id UUID NOT NULL,

    proficiency_level VARCHAR(50),

    years_of_experience NUMERIC(4,1),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_candidate_skill_candidate
        FOREIGN KEY(candidate_id)
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_candidate_skill_skill
        FOREIGN KEY(skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_candidate_skill
        UNIQUE(candidate_id, skill_id)
);


CREATE TABLE job_skills
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    job_id UUID NOT NULL,

    skill_id UUID NOT NULL,

    is_required BOOLEAN NOT NULL DEFAULT TRUE,

    weight NUMERIC(4,2) NOT NULL DEFAULT 1.00,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_skill_job
        FOREIGN KEY(job_id)
        REFERENCES jobs(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_job_skill_skill
        FOREIGN KEY(skill_id)
        REFERENCES skills(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_job_skill
        UNIQUE(job_id, skill_id)
);
