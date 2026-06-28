CREATE TABLE companies
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_name VARCHAR(255) NOT NULL,

    description TEXT,

    website TEXT,

    location VARCHAR(255),

    logo_url TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);