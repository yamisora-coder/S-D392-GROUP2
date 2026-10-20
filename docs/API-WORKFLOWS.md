# AIVES workflow API
All /api endpoints require Authorization: Bearer <token> except login and public registration.
POST /api/auth/login -> user fields, isAdmin, accessToken (8 hour lifetime).
POST /api/auth/register (alias /api/users/register) always creates STUDENT.
POST /api/admin/users/admins creates ADMIN, restricted to ADMIN.
POST /api/admin/users creates a user with selected role, restricted to ADMIN.
GET /api/auth/me; POST /api/auth/logout.
GET/POST /api/chapters: subjectId, title, position.
POST /api/chapters/{id}/materials: multipart file PDF/PPTX/TXT, maximum 20MB.
GET /api/chapters/{id}/materials lists extracted text and source page/slide chunks.
POST /api/chapters/{id}/generate: materialId, bloomLevel, difficulty, count, optional startPage (1-based within uploaded PDF). Context is limited to 12,000 text characters from that page onward.
POST /api/questions/import: multipart file CSV/XLSX; atomic import, all DRAFT.
CSV columns: question_code,chapter_id,content,bloom,difficulty,sample_answer,rubric_name,max_score,scoring_description.
Each row is one rubric; repeat question_code to group criteria. UTF-8 CSV.
Question create/update supports chapterId, difficulty; approval requires rubric descriptions and total 10.
GET/POST /api/rubric-templates: name, criteria (RubricRequest array, total 10).
POST /api/sessions/{id}/start freezes approved questions/rubrics, respects exam schedule.
GET /api/sessions/{id}/attempt returns snapshot (student view omits reference answers/rubrics).
POST /api/sessions/{id}/answers: answers [{questionId, text}], saves before AI grading.
POST /api/sessions/{id}/ai-grade: grades submitted answers against frozen rubrics.
GET /api/admin/ai-results: AI score, criterion evidence, final teacher score.
PATCH /api/sessions/{id}/grade: human approval, requires submitted attempt.
AI requires AI_API_KEY, AI_MODEL; AI_BASE_URL defaults to https://api.openai.com/v1.
Absent AI configuration returns 503; no synthetic AI results. No embeddings needed for chapter-scoped generation.
Tokens are held in memory: restarting backend requires login again. Use HTTPS outside localhost.
Demo seeds are disabled by default; enable AIVES_DEMO_ENABLED=true only for local demos.
Bootstrap admin with AIVES_ADMIN_EMAIL, AIVES_ADMIN_CODE, AIVES_ADMIN_PASSWORD.

POST /api/ai/check: real short connectivity prompt, maximum 15 seconds, teacher/admin only. Optional model query tests an alternate model without persisting configuration.
GET /api/ai/models: lists available text generation models using server credentials; never returns the key.
Google hosts use native generateContent automatically; AI_PROTOCOL=gemini/openai overrides detection.


## Adaptive viva dialogue
Only the student who owns an active attempt may send responses or request follow-ups.
POST /api/sessions/{id}/responses accepts {questionId, text, followupId?}.
Omit followupId for the main answer; include the server turn ID for a follow-up answer.
Text must be nonblank and at most 20,000 characters. Sent answers are immutable;
repeating identical data is safe. Save is independent of AI generation.
POST /api/sessions/{id}/follow-up accepts {questionId} after the main answer is saved.
Returns the attempt with followups [{id, questionId, question, answer, askedAt, answeredAt}]
and maxFollowupsPerQuestion. A pending question is returned again without another AI call.
The limit is frozen from exam.maxFollowupQuestions at start; legacy attempts use zero.
After reaching the limit, or after deadline/submission, generation returns 409.
Foreign student / teacher / admin response writes return 403; unknown question returns 400.
Only saving answers has the existing 30-second submission grace period.
A follow-up AI request has a 20-second total budget and no automatic retries. On error,
read the attempt and retry; the main answer stays saved. This is a timeout cap, not a
latency guarantee. Concurrent writes use the attempt version to prevent silent data loss.
Final grading combines main and answered follow-up responses under the original rubric;
unanswered turns receive no additional evidence. Lecturer sees the complete dialogue.
No final teacher score is generated or approved automatically.

Demo: create a NEW session on an exam with maxFollowupQuestions=2, start as its student,
answer a main question then click “Gửi câu trả lời”. Answer each AI probing question.
Repeat for the remaining main questions, submit, request AI grading, then open the
lecturer grading screen to inspect transcript, rubric evidence and approve the score.
Old submitted attempts remain read-only.
Browser SpeechSynthesis reads Vietnamese questions; SpeechRecognition transcribes input
where supported. Review the text before sending. Voice quality/accuracy depends on the
browser and installed voices; this is not a stored audio/video recording feature.


## Generation batches (large requests)
The UI splits 1–10 requested questions into batches of at most 3, sequentially.
Each POST /api/chapters/{id}/generate still returns a question array and accepts
optional batchId (UUID) and excludeContents (up to 30 nonblank strings, max 2000 chars).
The idempotency receipt is scoped to authenticated actor + batchId and fingerprints
chapter and request body. Replaying the same committed request returns its original
response without an AI call or extra rows; changed payload with the same ID returns 409.
Receipt and generated questions commit together. Failed or invalid batches roll back;
retry with the same ID. Concurrent insert conflicts return 409; retry later with that ID.
Requests without batchId keep the earlier behavior. Cached response is the creation
snapshot; it does not reflect later edits/deletion of a question.
The client persists pending batch ID, configuration and completed results in tab-local
sessionStorage scoped to the signed-in user. Reload the same tab and use Continue.
Stopping waits for the current batch to finish. Completed batches remain DRAFT even if
a later batch fails. Closing the tab clears this local resume state; bank rows remain.
Generation is not a background server job. Smaller outputs improve time to first results;
total latency and availability still depend on the provider. No parallel burst is sent.
excludeContents guides semantic variety; server rejects identical normalized content,
but instructor review is still needed for paraphrased or semantically duplicate questions.


## Runtime settings, audit, per-answer timers and evidence storage
GET/PUT /api/admin/settings (ADMIN only): model (empty = AI_MODEL), temperature 0..1,
followupTimeoutSeconds 5..30, answerTimeSeconds 15..600, recordingRetentionDays 1..365.
Model/temperature apply to subsequent AI requests; existing frozen attempts keep their
answer time. GET /api/runtime-options exposes only non-secret timing/retention options
to signed-in users. AI credentials and provider URL remain server environment settings.
GET /api/admin/audit?limit=100 returns at most 500 recent persisted events (ADMIN only).
Events include account code/role, timestamp, HTTP method, path, result and remote IP;
request/response bodies, credentials, answer text and audio are never copied into audit.

Exam create/update accepts optional answerTimeSeconds (default from runtime settings).
New attempt snapshots the exam value; legacy exams/attempts with null retain old timing.
The first question starts at attempt creation; POST /api/sessions/{id}/question with
{questionId} reveals another main question and starts its immutable timer. Student views
hide unopened question content. Follow-ups get their own answerDeadline when generated.
Responses have 3 seconds transport grace after the answer deadline; new late answers
return 409. Identical saved responses are safe to retry. The final answers endpoint
cannot bypass per-answer checks with new nonblank text. Overall exam deadline still wins.

GET /api/sessions/{id}/transcript downloads a UTF-8 .txt (no-store). Students only get
their submitted transcript and final teacher score; reference answers/rubrics stay hidden.
Teacher/admin exports may include rubric grading. Existing ownership checks apply.

POST /api/sessions/{id}/recording-consent {accepted:true}: owning student, active attempt.
Returns expiresAt and maxBytes; expiry snapshots the configured retention period.
POST /api/sessions/{id}/recordings multipart: sequence (0..1000), recordingId (UUID),
file (audio/webm, audio/ogg or audio/mp4, <=2MB/chunk), <=50MB per attempt.
Upload requires consent; allowed until 2 minutes after submission/deadline. Same sequence
and bytes retries return the saved result; different bytes at that sequence return 409.
GET /api/sessions/{id}/recordings lists nonexpired metadata, not raw binary data.
GET /api/sessions/{id}/recordings/{sequence} returns protected audio bytes (no-store).
Clients combine consecutive chunks with the same recordingId in sequence order to play.
DELETE /api/sessions/{id}/recordings withdraws consent and deletes recordings, preserving
text transcript and grades; only owner student/admin. Deleting the session deletes audio.
Expired recordings are inaccessible immediately (410 or 404 after cleanup); an hourly
cleanup physically deletes expired audio. No public media URL or upload to an AI provider.
Browser recording is opt-in, audio only, with chunks approximately every 10 seconds.
Unacknowledged chunks are held in memory for retry while the page stays open; there is
no guarantee they survive closing the tab, process failure or prolonged offline use.

## Retrieval-augmented document generation
Upload persists a sparse term index next to the extracted chunks; existing materials
are indexed lazily on first search. GET /api/materials/{id}/search?q=...&startPage=1
(teacher/admin) ranks matching chunks using BM25 and returns up to 6 passages, <=12,000
text characters, with page, filename, materialId and relevance score.
GenerateInput accepts optional topic (<=1000 chars); when supplied, these retrieved
passages form the AI input. With no topic the existing sequential-page selection applies.
This is lexical retrieval, not semantic embeddings/pgvector. Exact source-language terms
work best; a small software vocabulary expansion supports common Vietnamese queries.
A topic with no matching passages returns 400 instead of inventing document context.
