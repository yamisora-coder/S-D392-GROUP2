-- ====================================================================
-- AIVES Database Migration V1: Initial Schema (18 Tables & 5 Enums)
-- Conforms 100% with docs/database/database-design.sql
-- ====================================================================

-- 0. Clean up legacy prototype tables if they exist
DROP TABLE IF EXISTS "exam_sessions" CASCADE;
DROP TABLE IF EXISTS "exams" CASCADE;
DROP TABLE IF EXISTS "question_rubrics" CASCADE;
DROP TABLE IF EXISTS "questions" CASCADE;
DROP TABLE IF EXISTS "subjects" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 1. Custom Enum Types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_enum') THEN
        CREATE TYPE role_enum AS ENUM ('ADMIN', 'LECTURER', 'STUDENT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bloom_level_enum') THEN
        CREATE TYPE bloom_level_enum AS ENUM ('REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_source_enum') THEN
        CREATE TYPE question_source_enum AS ENUM ('MANUAL', 'IMPORTED', 'AI_GENERATED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'question_status_enum') THEN
        CREATE TYPE question_status_enum AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'turn_type_enum') THEN
        CREATE TYPE turn_type_enum AS ENUM ('MAIN', 'FOLLOW_UP');
    END IF;
END $$;

-- 2. Core Users & Roles
CREATE TABLE IF NOT EXISTS "role" (
    role_id SERIAL PRIMARY KEY,
    role_name role_enum NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "user" (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "user_role" (
    user_id BIGINT REFERENCES "user"(user_id) ON DELETE CASCADE,
    role_id INT REFERENCES "role"(role_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 3. Course & Documents
CREATE TABLE IF NOT EXISTS "course" (
    course_id BIGSERIAL PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(255) NOT NULL,
    managed_by BIGINT NOT NULL REFERENCES "user"(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "course_document" (
    document_id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES "course"(course_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Question Generation Workflow (RAG)
CREATE TABLE IF NOT EXISTS "question_generation_request" (
    request_id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES "course"(course_id),
    requested_by BIGINT NOT NULL REFERENCES "user"(user_id),
    topic VARCHAR(255) NOT NULL,
    bloom_level bloom_level_enum,
    target_count INT NOT NULL DEFAULT 5,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "generation_document" (
    request_id BIGINT REFERENCES "question_generation_request"(request_id) ON DELETE CASCADE,
    document_id BIGINT REFERENCES "course_document"(document_id) ON DELETE CASCADE,
    PRIMARY KEY (request_id, document_id)
);

-- 5. Question Bank & Rubric
CREATE TABLE IF NOT EXISTS "rubric" (
    rubric_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "rubric_criterion" (
    criterion_id BIGSERIAL PRIMARY KEY,
    rubric_id BIGINT NOT NULL REFERENCES "rubric"(rubric_id) ON DELETE CASCADE,
    criterion_name VARCHAR(255) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    expected_answer_keywords TEXT
);

CREATE TABLE IF NOT EXISTS "question" (
    question_id           BIGSERIAL PRIMARY KEY,
    course_id             BIGINT NOT NULL REFERENCES "course"(course_id),
    rubric_id             BIGINT NOT NULL REFERENCES "rubric"(rubric_id),
    generation_request_id BIGINT REFERENCES "question_generation_request"(request_id) ON DELETE SET NULL,
    question_text         TEXT NOT NULL,
    sample_answer         TEXT,
    bloom_level           bloom_level_enum NOT NULL,
    difficulty            SMALLINT NOT NULL DEFAULT 1,
    source_type           question_source_enum NOT NULL,
    status                question_status_enum NOT NULL DEFAULT 'DRAFT',
    reviewed_by           BIGINT REFERENCES "user"(user_id) ON DELETE SET NULL,
    reviewed_at           TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Exam Management
CREATE TABLE IF NOT EXISTS "exam" (
    exam_id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES "course"(course_id),
    title VARCHAR(255) NOT NULL,
    duration_minutes INT NOT NULL,
    max_follow_up_per_q INT NOT NULL DEFAULT 2,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "exam_question" (
    exam_id BIGINT REFERENCES "exam"(exam_id) ON DELETE CASCADE,
    question_id BIGINT REFERENCES "question"(question_id) ON DELETE CASCADE,
    question_order INT NOT NULL,
    PRIMARY KEY (exam_id, question_id)
);

-- 7. Runtime Exam Session & Turns
CREATE TABLE IF NOT EXISTS "exam_session" (
    session_id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES "exam"(exam_id),
    student_id BIGINT NOT NULL REFERENCES "user"(user_id),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ONGOING'
);

CREATE TABLE IF NOT EXISTS "session_turn" (
    turn_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES "exam_session"(session_id) ON DELETE CASCADE,
    question_id BIGINT REFERENCES "question"(question_id),
    parent_turn_id BIGINT REFERENCES "session_turn"(turn_id) ON DELETE CASCADE,
    turn_type turn_type_enum NOT NULL,
    question_text TEXT NOT NULL,
    sequence_number INT NOT NULL,
    time_limit_seconds INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "transcript" (
    transcript_id BIGSERIAL PRIMARY KEY,
    turn_id BIGINT NOT NULL UNIQUE REFERENCES "session_turn"(turn_id) ON DELETE CASCADE,
    student_audio_url VARCHAR(1000),
    stt_text TEXT NOT NULL,
    answer_duration_seconds INT,
    fluency_score DECIMAL(5,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Grading & Results
CREATE TABLE IF NOT EXISTS "ai_grading_suggestion" (
    suggestion_id BIGSERIAL PRIMARY KEY,
    turn_id BIGINT NOT NULL UNIQUE REFERENCES "session_turn"(turn_id) ON DELETE CASCADE,
    suggested_score DECIMAL(5,2) NOT NULL,
    strengths TEXT,
    weaknesses TEXT,
    missing_points TEXT,
    generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "final_grade" (
    grade_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL UNIQUE REFERENCES "exam_session"(session_id) ON DELETE CASCADE,
    confirmed_by BIGINT NOT NULL REFERENCES "user"(user_id),
    final_score DECIMAL(5,2) NOT NULL,
    lecturer_feedback TEXT,
    confirmed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "exam_result" (
    result_id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL UNIQUE REFERENCES "exam_session"(session_id) ON DELETE CASCADE,
    completion_status VARCHAR(50) NOT NULL,
    total_turns INT NOT NULL,
    overall_duration_seconds INT,
    calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_course_managed_by ON "course"(managed_by);
CREATE INDEX IF NOT EXISTS idx_question_course_id ON "question"(course_id);
CREATE INDEX IF NOT EXISTS idx_question_rubric_id ON "question"(rubric_id);
CREATE INDEX IF NOT EXISTS idx_exam_course_id ON "exam"(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_session_student ON "exam_session"(student_id);
CREATE INDEX IF NOT EXISTS idx_session_turn_session ON "session_turn"(session_id);
