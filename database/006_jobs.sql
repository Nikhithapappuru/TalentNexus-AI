CREATE TABLE jobs
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    created_by UUID NOT NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT NOT NULL,

    experience_required INTEGER DEFAULT 0,

    minimum_salary NUMERIC,

    maximum_salary NUMERIC,

    employment_type employment_type NOT NULL,

    work_mode work_mode NOT NULL,

    location VARCHAR(255),

    application_deadline DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_job_company
        FOREIGN KEY(company_id)
        REFERENCES companies(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_created_by
        FOREIGN KEY(created_by)
        REFERENCES recruiter_profiles(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_salary
        CHECK
        (
            minimum_salary IS NULL
            OR
            maximum_salary IS NULL
            OR
            minimum_salary <= maximum_salary
        )
);