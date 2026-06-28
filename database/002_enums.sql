CREATE TYPE user_role AS ENUM
(
    'candidate',
    'recruiter',
    'admin'
);

CREATE TYPE account_status AS ENUM
(
    'active',
    'inactive',
    'suspended'
);

CREATE TYPE verification_status AS ENUM
(
    'pending',
    'verified'
);

CREATE TYPE application_status AS ENUM
(
    'applied',
    'reviewing',
    'shortlisted',
    'interview_scheduled',
    'interview_completed',
    'offer_extended',
    'accepted',
    'rejected',
    'withdrawn'
);

CREATE TYPE document_type AS ENUM
(
    'resume',
    'job_description',
    'recruiter_guideline',
    'career_resource'
);

CREATE TYPE employment_type AS ENUM
(
    'full_time',
    'internship',
    'part_time',
    'contract'
);

CREATE TYPE work_mode AS ENUM
(
    'onsite',
    'hybrid',
    'remote'
);
