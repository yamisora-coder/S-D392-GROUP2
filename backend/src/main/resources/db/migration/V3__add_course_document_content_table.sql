-- ====================================================================
-- AIVES Migration V3: Bảng lưu nội dung văn bản tài liệu cho RAG/AI
-- Không thay đổi bất kỳ bảng nào đã có, chỉ thêm bảng mới.
-- ====================================================================

CREATE TABLE IF NOT EXISTS "course_document_content" (
    content_id  BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL UNIQUE REFERENCES "course_document"(document_id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_content_document_id ON "course_document_content"(document_id);
