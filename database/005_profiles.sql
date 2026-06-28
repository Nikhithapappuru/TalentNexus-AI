CREATE TABLE candidate_profiles
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL,

    full_name VARCHAR(255) NOT NULL,

    phone VARCHAR(20),

    headline TEXT,

    bio TEXT,

    location VARCHAR(255),

    profile_photo_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_candidate_user

        FOREIGN KEY(user_id)

        REFERENCES users(id)

        ON DELETE CASCADE
);


CREATE TABLE recruiter_profiles
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID UNIQUE NOT NULL,

    company_id UUID,

    full_name VARCHAR(255) NOT NULL,

    designation VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recruiter_user

        FOREIGN KEY(user_id)

        REFERENCES users(id)

        ON DELETE CASCADE,

    CONSTRAINT fk_company

        FOREIGN KEY(company_id)

        REFERENCES companies(id)

        ON DELETE SET NULL
);