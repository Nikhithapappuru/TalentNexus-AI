const fs = require("fs/promises");
const { PDFParse } = require("pdf-parse");
const pool = require("../config/db");
const chunkText = require("../utils/textChunker");
const {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  embedTexts,
  toPgVector,
} = require("../services/embeddingService");
const {
  GENERATION_MODEL,
  generateGroundedAnswer,
} = require("../services/generationService");

const recruiterDocumentTypes = [
  "job_description",
  "recruiter_guideline",
  "career_resource",
];

const extractTextFromFile = async (file) => {
  if (file.mimetype === "text/plain") {
    return fs.readFile(file.path, "utf8");
  }

  if (file.mimetype === "application/pdf") {
    const buffer = await fs.readFile(file.path);
    const parser = new PDFParse({ data: buffer });

    try {
      const result = await parser.getText();
      return result.text || null;
    } finally {
      await parser.destroy();
    }
  }

  return null;
};

const createDocument = async ({
  ownerUserId,
  companyId,
  documentType,
  file,
  extractedText,
}) => {
  const result = await pool.query(
    `INSERT INTO documents
      (
        owner_user_id,
        company_id,
        document_type,
        original_filename,
        storage_path,
        mime_type,
        file_size_bytes,
        extracted_text,
        processed_at
      )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
     RETURNING id, owner_user_id, company_id, document_type, original_filename,
       storage_path, mime_type, file_size_bytes, uploaded_at, processed_at`,
    [
      ownerUserId,
      companyId,
      documentType,
      file.originalname,
      file.path,
      file.mimetype,
      file.size,
      extractedText,
    ]
  );

  return result.rows[0];
};

const createDocumentChunks = async (documentId, extractedText) => {
  const chunks = chunkText(extractedText);

  await pool.query("DELETE FROM document_chunks WHERE document_id = $1", [documentId]);

  if (chunks.length === 0) {
    return [];
  }

  const insertedChunks = [];

  for (const [index, chunk] of chunks.entries()) {
    const result = await pool.query(
      `INSERT INTO document_chunks (document_id, chunk_index, content, token_count)
       VALUES ($1, $2, $3, $4)
       RETURNING id, document_id, chunk_index, content, token_count, created_at`,
      [documentId, index, chunk.content, chunk.tokenCount]
    );

    insertedChunks.push(result.rows[0]);
  }

  return insertedChunks;
};

const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Resume file is required",
      });
    }

    const extractedText = await extractTextFromFile(req.file);
    const document = await createDocument({
      ownerUserId: req.user.id,
      companyId: null,
      documentType: "resume",
      file: req.file,
      extractedText,
    });
    const chunks = await createDocumentChunks(document.id, extractedText);

    return res.status(201).json({
      status: "success",
      document,
      extractedTextAvailable: Boolean(extractedText),
      chunkCount: chunks.length,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const uploadCompanyDocument = async (req, res) => {
  try {
    const { documentType = "recruiter_guideline" } = req.body;

    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "Document file is required",
      });
    }

    if (!recruiterDocumentTypes.includes(documentType)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid recruiter document type",
      });
    }

    const recruiterProfile = await pool.query(
      "SELECT company_id FROM recruiter_profiles WHERE user_id = $1",
      [req.user.id]
    );

    if (recruiterProfile.rows.length === 0 || !recruiterProfile.rows[0].company_id) {
      return res.status(400).json({
        status: "error",
        message: "Recruiter profile must be linked to a company",
      });
    }

    const extractedText = await extractTextFromFile(req.file);
    const document = await createDocument({
      ownerUserId: req.user.id,
      companyId: recruiterProfile.rows[0].company_id,
      documentType,
      file: req.file,
      extractedText,
    });
    const chunks = await createDocumentChunks(document.id, extractedText);

    return res.status(201).json({
      status: "success",
      document,
      extractedTextAvailable: Boolean(extractedText),
      chunkCount: chunks.length,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getMyDocuments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, company_id, document_type, original_filename, storage_path,
          mime_type, file_size_bytes, uploaded_at, processed_at
       FROM documents
       WHERE owner_user_id = $1
       ORDER BY uploaded_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      documents: result.rows,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, company_id, document_type, original_filename, storage_path,
          mime_type, file_size_bytes, extracted_text, uploaded_at, processed_at
       FROM documents
       WHERE id = $1
         AND owner_user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Document not found",
      });
    }

    return res.status(200).json({
      status: "success",
      document: result.rows[0],
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const getDocumentChunks = async (req, res) => {
  try {
    const document = await pool.query(
      "SELECT id FROM documents WHERE id = $1 AND owner_user_id = $2",
      [req.params.id, req.user.id]
    );

    if (document.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Document not found",
      });
    }

    const result = await pool.query(
      `SELECT id, document_id, chunk_index, content, token_count, created_at
       FROM document_chunks
       WHERE document_id = $1
       ORDER BY chunk_index ASC`,
      [req.params.id]
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      chunks: result.rows,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const regenerateDocumentChunks = async (req, res) => {
  try {
    const document = await pool.query(
      `SELECT id, extracted_text
       FROM documents
       WHERE id = $1
         AND owner_user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (document.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Document not found",
      });
    }

    const chunks = await createDocumentChunks(
      document.rows[0].id,
      document.rows[0].extracted_text
    );

    return res.status(200).json({
      status: "success",
      count: chunks.length,
      chunks,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const embedDocumentChunks = async (req, res) => {
  try {
    const document = await pool.query(
      "SELECT id FROM documents WHERE id = $1 AND owner_user_id = $2",
      [req.params.id, req.user.id]
    );

    if (document.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Document not found",
      });
    }

    const chunks = await pool.query(
      `SELECT id, content
       FROM document_chunks
       WHERE document_id = $1
       ORDER BY chunk_index ASC`,
      [req.params.id]
    );

    if (chunks.rows.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "No chunks found for this document",
      });
    }

    const embeddings = await embedTexts(
      chunks.rows.map((chunk) => chunk.content),
      "RETRIEVAL_DOCUMENT"
    );

    if (embeddings.length !== chunks.rows.length) {
      return res.status(502).json({
        status: "error",
        message: "Embedding provider returned an unexpected number of vectors",
      });
    }

    for (const [index, chunk] of chunks.rows.entries()) {
      await pool.query(
        "UPDATE document_chunks SET embedding = $1::vector WHERE id = $2",
        [toPgVector(embeddings[index]), chunk.id]
      );
    }

    return res.status(200).json({
      status: "success",
      embeddedChunkCount: embeddings.length,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const searchDocumentChunks = async (req, res) => {
  try {
    const { query, limit = 5, companyId } = req.body;

    if (!query) {
      return res.status(400).json({
        status: "error",
        message: "Search query is required",
      });
    }

    const normalizedLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
    const [queryEmbedding] = await embedTexts([query], "RETRIEVAL_QUERY");

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return res.status(502).json({
        status: "error",
        message: "Embedding provider did not return a query vector",
      });
    }

    const conditions = ["document_chunks.embedding IS NOT NULL"];
    const values = [toPgVector(queryEmbedding), normalizedLimit];

    if (req.user.role === "recruiter") {
      const recruiterProfile = await pool.query(
        "SELECT company_id FROM recruiter_profiles WHERE user_id = $1",
        [req.user.id]
      );

      if (
        recruiterProfile.rows.length === 0 ||
        !recruiterProfile.rows[0].company_id
      ) {
        return res.status(400).json({
          status: "error",
          message: "Recruiter profile must be linked to a company",
        });
      }

      values.push(recruiterProfile.rows[0].company_id);
      conditions.push(`documents.company_id = $${values.length}`);
    } else if (companyId) {
      values.push(companyId);
      conditions.push(`documents.company_id = $${values.length}`);
    } else {
      conditions.push("(documents.owner_user_id = $3 OR documents.company_id IS NOT NULL)");
      values.push(req.user.id);
    }

    const result = await pool.query(
      `SELECT
          document_chunks.id,
          document_chunks.document_id,
          document_chunks.chunk_index,
          document_chunks.content,
          document_chunks.token_count,
          documents.document_type,
          documents.original_filename,
          documents.company_id,
          1 - (document_chunks.embedding <=> $1::vector) AS similarity
       FROM document_chunks
       INNER JOIN documents ON documents.id = document_chunks.document_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY document_chunks.embedding <=> $1::vector
       LIMIT $2`,
      values
    );

    return res.status(200).json({
      status: "success",
      count: result.rows.length,
      results: result.rows,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

const answerFromDocuments = async (req, res) => {
  try {
    const { question, limit = 5, companyId } = req.body;

    if (!question) {
      return res.status(400).json({
        status: "error",
        message: "Question is required",
      });
    }

    const normalizedLimit = Math.min(Math.max(Number(limit) || 5, 1), 10);
    const [queryEmbedding] = await embedTexts([question], "RETRIEVAL_QUERY");

    if (!queryEmbedding || queryEmbedding.length === 0) {
      return res.status(502).json({
        status: "error",
        message: "Embedding provider did not return a query vector",
      });
    }

    const conditions = ["document_chunks.embedding IS NOT NULL"];
    const values = [toPgVector(queryEmbedding), normalizedLimit];

    if (req.user.role === "recruiter") {
      const recruiterProfile = await pool.query(
        "SELECT company_id FROM recruiter_profiles WHERE user_id = $1",
        [req.user.id]
      );

      if (
        recruiterProfile.rows.length === 0 ||
        !recruiterProfile.rows[0].company_id
      ) {
        return res.status(400).json({
          status: "error",
          message: "Recruiter profile must be linked to a company",
        });
      }

      values.push(recruiterProfile.rows[0].company_id);
      conditions.push(`documents.company_id = $${values.length}`);
    } else if (companyId) {
      values.push(companyId);
      conditions.push(`documents.company_id = $${values.length}`);
    } else {
      values.push(req.user.id);
      conditions.push(`documents.owner_user_id = $${values.length}`);
    }

    const retrieved = await pool.query(
      `SELECT
          document_chunks.id,
          document_chunks.document_id,
          document_chunks.chunk_index,
          document_chunks.content,
          document_chunks.token_count,
          documents.document_type,
          documents.original_filename,
          documents.company_id,
          1 - (document_chunks.embedding <=> $1::vector) AS similarity
       FROM document_chunks
       INNER JOIN documents ON documents.id = document_chunks.document_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY document_chunks.embedding <=> $1::vector
       LIMIT $2`,
      values
    );

    if (retrieved.rows.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "No embedded document chunks found for this question",
      });
    }

    const answer = await generateGroundedAnswer({
      question,
      chunks: retrieved.rows,
    });

    return res.status(200).json({
      status: "success",
      answer,
      sources: retrieved.rows.map((chunk, index) => ({
        sourceNumber: index + 1,
        documentId: chunk.document_id,
        documentName: chunk.original_filename,
        documentType: chunk.document_type,
        chunkIndex: chunk.chunk_index,
        similarity: chunk.similarity,
      })),
      models: {
        generation: GENERATION_MODEL,
        embedding: EMBEDDING_MODEL,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  uploadResume,
  uploadCompanyDocument,
  getMyDocuments,
  getDocumentById,
  getDocumentChunks,
  regenerateDocumentChunks,
  embedDocumentChunks,
  searchDocumentChunks,
  answerFromDocuments,
};
