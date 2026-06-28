CREATE TABLE documents
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_user_id UUID NOT NULL,

    company_id UUID,

    document_type document_type NOT NULL,

    original_filename VARCHAR(255) NOT NULL,

    storage_path TEXT NOT NULL,

    mime_type VARCHAR(120),

    file_size_bytes BIGINT,

    extracted_text TEXT,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    processed_at TIMESTAMP,

    CONSTRAINT fk_document_owner
        FOREIGN KEY(owner_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_document_company
        FOREIGN KEY(company_id)
        REFERENCES companies(id)
        ON DELETE SET NULL
);


CREATE TABLE document_chunks
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID NOT NULL,

    chunk_index INTEGER NOT NULL,

    content TEXT NOT NULL,

    embedding vector(768),

    token_count INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_chunk_document
        FOREIGN KEY(document_id)
        REFERENCES documents(id)
        ON DELETE CASCADE,

    CONSTRAINT uq_document_chunk_index
        UNIQUE(document_id, chunk_index)
);
