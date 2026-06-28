CREATE TABLE projects
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    candidate_id UUID NOT NULL,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    project_url TEXT,

    github_url TEXT,

    tech_stack TEXT[],

    start_date DATE,

    end_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_project_candidate
        FOREIGN KEY(candidate_id)
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE
);


CREATE TABLE education
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    candidate_id UUID NOT NULL,

    institution_name VARCHAR(255) NOT NULL,

    degree VARCHAR(255),

    field_of_study VARCHAR(255),

    start_year INTEGER,

    end_year INTEGER,

    grade VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_education_candidate
        FOREIGN KEY(candidate_id)
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE
);


CREATE TABLE experience
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    candidate_id UUID NOT NULL,

    company_name VARCHAR(255) NOT NULL,

    role_title VARCHAR(255) NOT NULL,

    description TEXT,

    start_date DATE,

    end_date DATE,

    is_current BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_experience_candidate
        FOREIGN KEY(candidate_id)
        REFERENCES candidate_profiles(id)
        ON DELETE CASCADE
);
