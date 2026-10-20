# Implemented workflows

## Run
Java 17, Maven, Node.js and PostgreSQL are required. Create aives_db first.
Set DB_PASSWORD in the shell (see backend/.env.example). Set bootstrap admin email/code/password for the first run.
Run `mvn spring-boot:run` from backend and `npm ci` then `npm run dev` from frontend.
Login with the bootstrap admin; create instructor/student accounts in Admin > Thêm người dùng.
Demo accounts are available only when AIVES_DEMO_ENABLED=true. Never enable demo seeds on a shared deployment.

## Use
1. Lecturer: create subject and chapter in the new workspace.
2. Upload a chapter PDF/PPTX/TXT. Each upload is a separate immutable material version; text is chunked by page/slide.
3. Select material version, Bloom 1–6, difficulty and count (1–10). Generate draft questions with suggested rubrics.
4. Alternatively import CSV/XLSX using question-import-template.csv; replace chapter UUID first. Every row is a criterion; grouped rubric must sum to 10. Import is atomic.
5. Open Question Bank, review question, source, reference answer and score bands. Apply saved rubric templates if appropriate. Approve only after review.
6. Create an exam and schedule students via POST /api/sessions (Swagger documents request fields).
7. Student starts a scheduled exam. Server freezes questions/rubrics and enforces deadline. Answers are typed or dictated using browser speech recognition where supported.
8. Submit persists text answers first. Click AI grading; provider failures leave the submitted work intact and permit retry.
9. Lecturer sees the frozen questions and answer text, adjusts grading and approves. Admin sees AI score, criterion evidence and final teacher score.

## AI configuration and limits
Set AI_API_KEY, AI_MODEL and optionally AI_BASE_URL. For Google hosts the backend uses native Gemini generateContent with JSON output; other providers use Chat Completions JSON mode. AI_PROTOCOL=gemini or openai can override automatic detection. Source documents/answers are sent to this provider only when generation/grading is requested.
Without configuration these operations return 503; no mock results are returned by the application.
Generation uses up to 12,000 extracted text characters from the selected starting page (startPage, default 1). Change startPage to cover later sections. Native Gemini requests use thinkingLevel=LOW to reduce latency. Bloom prompts specify the required cognitive task for all six levels.
Uploads and generation run synchronously in this implementation. There is no resumable document upload, server background generation queue, OCR, or semantic embedding/pgvector index. Topic-based retrieval uses a persisted sparse term index and BM25.
Scanned PDF images require OCR outside the app before upload. Submissions contain text transcripts. Opt-in audio recording is uploaded in protected chunks with consent, retention and deletion; no video recording. Browser dictation availability depends on browser and permissions.
Bearer tokens expire in 8 hours and are revoked on logout; backend restart requires login. Account lock and role changes apply on each request.
Default CORS origins are localhost:5173 and 127.0.0.1:5173. Configure additional origins in CorsConfig for deployments.

## Verification
`mvn test` runs Spring Boot integration tests against isolated H2 with mocked AI responses. No real provider key is required.
`npm run build` verifies frontend production compilation.
See TEST-RESULTS-VIVA.md, TEST-RESULTS-GENERATION.md and TEST-RESULTS-HARDENING.md for local PostgreSQL/browser evidence. Broader provider quality, real speech accuracy, load and deployment still need their own measurements.

## Diagnose slow generation
Use Kiểm tra AI in the document panel: it sends only a short prompt (no PDF) and reports the configured model, protocol and elapsed time without exposing the key. POST /api/ai/check?model=<model-id> tests an alternative without changing server configuration. GET /api/ai/models lists available text generation models. Both require instructor/admin access. Changing AI_MODEL in the backend terminal and restarting applies the selected model to generation.
