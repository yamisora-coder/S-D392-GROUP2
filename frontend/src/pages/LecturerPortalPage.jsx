import React, { useState, useEffect, useMemo } from 'react';
import { api, shortId, formatDate, formatDateTime } from '../services/api.js';

const round2 = (n) => Math.round(n * 100) / 100;
const roundQuarter = (n) => Math.round(n * 4) / 4;

// Xây dựng bài làm (submission) cho Split-View từ ca thi + ngân hàng câu hỏi của môn.
// Backend hiện chỉ lưu điểm tổng (AI gợi ý & điểm chốt), nên điểm từng tiêu chí được
// phân bổ theo tỷ lệ điểm tổng và thang rubric được quy đổi để tổng bài = 10 điểm.
function buildSubmission(session, exam, subjectQuestions) {
  const pool = subjectQuestions.filter((q) => q.status === 'APPROVED');
  const picked = pool.slice(0, Math.max(1, exam?.maxMainQuestions || 3));
  const aiScore = session.aiSuggestedScore ?? 0;
  const lecturerTotal = session.finalTeacherScore ?? aiScore;
  const perQuestionMax = picked.length ? 10 / picked.length : 10;

  const questions = picked.map((q, idx) => {
    const totalRubric = q.totalRubricScore || q.rubrics.reduce((a, r) => a + r.maxScore, 0) || 1;
    const rubrics = q.rubrics.map((r) => {
      const max = round2((r.maxScore / totalRubric) * perQuestionMax);
      return {
        id: r.id,
        title: r.criteriaName,
        desc: r.description || '',
        max,
        ai: roundQuarter(max * (aiScore / 10)),
        lecturer: roundQuarter(max * (lecturerTotal / 10)),
        aiFeedback: 'Ước tính theo điểm AI tổng (backend chưa lưu điểm từng tiêu chí).',
      };
    });
    return {
      id: q.id,
      title: `Câu ${idx + 1}: ${q.content}`,
      maxScore: round2(perQuestionMax),
      aiScore: round2(rubrics.reduce((a, r) => a + r.ai, 0)),
      lecturerScore: round2(rubrics.reduce((a, r) => a + r.lecturer, 0)),
      bloom: q.bloomLevel,
      rubrics,
      dialogue: [],
    };
  });

  return {
    id: session.id,
    studentId: session.studentCode,
    studentName: session.studentName || 'Thí sinh',
    examId: session.examId,
    examTitle: session.examTitle,
    status: session.finalTeacherScore != null ? 'GRADED' : 'PENDING_APPROVAL',
    aiScore,
    lecturerScore: round2(lecturerTotal),
    feedback: session.teacherFeedback || '',
    submittedAt: formatDateTime(session.scheduledStartTime),
    duration: `${exam?.durationPerStudentMins ?? '--'} phút`,
    violationsCount: 0,
    currentQuestionIdx: 0,
    questions,
  };
}

export default function LecturerPortalPage({ currentUser, onLogout, onSwitchPortal }) {
  const [activeTab, setActiveTab] = useState('grading'); // 'dashboard' | 'grading' | 'questions' | 'exams' | 'analytics'

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState('ALL');
  const [questionBloomFilter, setQuestionBloomFilter] = useState('ALL');
  const [questionStatusFilter, setQuestionStatusFilter] = useState('ACTIVE'); // ACTIVE | DRAFT | AI_DRAFT | APPROVED | ARCHIVED | ALL

  // Modal states
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null); // null = thêm mới
  const [detailQuestion, setDetailQuestion] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ================= DỮ LIỆU TỪ BACKEND =================
  const [subjects, setSubjects] = useState([]);
  const [rawQuestions, setRawQuestions] = useState([]);
  const [rawExams, setRawExams] = useState([]);
  const [rawSessions, setRawSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [subs, qs, exs, ss] = await Promise.all([
        api.getSubjects(),
        api.getQuestions(),
        api.getExams(),
        api.getSessions(),
      ]);
      setSubjects(subs || []);
      setRawQuestions(qs || []);
      setRawExams(exs || []);
      setRawSessions(ss || []);
    } catch (err) {
      setLoadError(err.message);
      showNotification(`Lỗi tải dữ liệu: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // ================= DỮ LIỆU CHẤM ĐIỂM SPLIT-VIEW (HUMAN-IN-THE-LOOP) =================
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const examById = new Map(rawExams.map((e) => [e.id, e]));
    const built = rawSessions
      .filter((s) => s.status === 'IN_PROGRESS' || s.status === 'COMPLETED' || s.aiSuggestedScore != null)
      .sort((a, b) => (a.finalTeacherScore != null) - (b.finalTeacherScore != null))
      .map((s) => {
        const exam = examById.get(s.examId);
        const subjectQuestions = rawQuestions.filter((q) => q.subjectId === exam?.subjectId);
        return buildSubmission(s, exam, subjectQuestions);
      });
    setSubmissions(built);
  }, [rawSessions, rawExams, rawQuestions]);

  const [selectedSubIdx, setSelectedSubIdx] = useState(0);
  const [selectedQuestionTab, setSelectedQuestionTab] = useState(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const currentSubmission = submissions[selectedSubIdx] || submissions[0];
  const activeQuestion = currentSubmission?.questions?.[selectedQuestionTab] || currentSubmission?.questions?.[0];

  // Adjust score handlers
  const handleScoreChange = (rubricId, delta) => {
    setSubmissions((prev) =>
      prev.map((sub, sIdx) => {
        if (sIdx !== selectedSubIdx) return sub;
        const newQuestions = sub.questions.map((q, qIdx) => {
          if (qIdx !== selectedQuestionTab) return q;
          const newRubrics = q.rubrics.map((r) => {
            if (r.id !== rubricId) return r;
            const newScore = Math.max(0, Math.min(r.max, Number((r.lecturer + delta).toFixed(2))));
            return { ...r, lecturer: newScore };
          });
          const newQLecturer = Number(newRubrics.reduce((acc, cur) => acc + cur.lecturer, 0).toFixed(2));
          return { ...q, rubrics: newRubrics, lecturerScore: newQLecturer };
        });
        const totalLecturer = Number(newQuestions.reduce((acc, cur) => acc + cur.lecturerScore, 0).toFixed(2));
        return { ...sub, questions: newQuestions, lecturerScore: Math.min(10, totalLecturer) };
      })
    );
  };

  const handleFeedbackChange = (value) => {
    setSubmissions((prev) => prev.map((sub, idx) => (idx === selectedSubIdx ? { ...sub, feedback: value } : sub)));
  };

  const handleApproveGrade = async () => {
    if (!currentSubmission) return;
    setIsFinalizing(true);
    try {
      const score = Math.max(0, Math.min(10, Number(currentSubmission.lecturerScore) || 0));
      const updated = await api.finalizeGrade(currentSubmission.id, score, currentSubmission.feedback || null);
      setRawSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      showNotification(`Đã duyệt & chốt điểm bài thi của thí sinh ${currentSubmission.studentName} thành công! Điểm: ${score}/10.0`);
    } catch (err) {
      showNotification(`Lỗi chốt điểm: ${err.message}`);
    } finally {
      setIsFinalizing(false);
    }
  };

  // ================= DỮ LIỆU NGÂN HÀNG CÂU HỎI & RUBRIC =================
  const BLOOM_LABELS = {
    REMEMBER: 'Nhớ (Remember)',
    UNDERSTAND: 'Hiểu (Understand)',
    APPLY: 'Vận dụng (Apply)',
    ANALYZE: 'Phân tích (Analyze)',
  };
  const STATUS_META = {
    DRAFT: { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-800' },
    APPROVED: { label: 'Đã duyệt', cls: 'bg-emerald-100 text-emerald-800' },
    ARCHIVED: { label: 'Lưu trữ', cls: 'bg-slate-200 text-slate-600' },
  };

  const questionsList = useMemo(
    () =>
      rawQuestions.map((q) => ({
        id: q.id,
        subjectId: q.subjectId,
        isAiGenerated: !!q.isAiGenerated,
        createdByName: q.createdByName,
        displayId: shortId(q.id, 'Q-'),
        subject: q.subjectName,
        code: q.subjectCode,
        title: q.content,
        bloom: q.bloomLevel,
        status: q.status,
        maxScore: q.totalRubricScore ?? 0,
        keywords: q.isAiGenerated ? ['AI Generated'] : [],
        rubricCount: q.rubrics?.length || 0,
        rubrics: q.rubrics || [],
        sampleAnswer: q.sampleAnswer,
      })),
    [rawQuestions]
  );

  const matchStatusFilter = (q, filter) => {
    switch (filter) {
      case 'ACTIVE': return q.status !== 'ARCHIVED';
      case 'DRAFT': return q.status === 'DRAFT';
      case 'AI_DRAFT': return q.status === 'DRAFT' && q.isAiGenerated;
      case 'APPROVED': return q.status === 'APPROVED';
      case 'ARCHIVED': return q.status === 'ARCHIVED';
      default: return true;
    }
  };

  const questionStatusTabs = [
    { key: 'ACTIVE', label: 'Đang sử dụng' },
    { key: 'DRAFT', label: 'Chờ duyệt' },
    { key: 'AI_DRAFT', label: 'AI sinh – chờ duyệt' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'ARCHIVED', label: 'Lưu trữ' },
    { key: 'ALL', label: 'Tất cả' },
  ].map((t) => ({ ...t, count: questionsList.filter((q) => matchStatusFilter(q, t.key)).length }));

  const filteredQuestions = questionsList.filter((q) => {
    const matchSubject = questionSubjectFilter === 'ALL' || q.code === questionSubjectFilter;
    const matchBloom = questionBloomFilter === 'ALL' || q.bloom === questionBloomFilter;
    const matchStatus = matchStatusFilter(q, questionStatusFilter);
    const matchSearch = !searchTerm.trim() || q.title.toLowerCase().includes(searchTerm.trim().toLowerCase());
    return matchSubject && matchBloom && matchStatus && matchSearch;
  });

  let rubricKeySeq = 0;
  const makeRubricRow = (criteriaName = '', maxScore = '', description = '', id = null) => ({
    key: `r-${Date.now()}-${rubricKeySeq++}-${Math.random().toString(36).slice(2, 7)}`,
    id,
    criteriaName,
    maxScore: maxScore === '' || maxScore == null ? '' : String(maxScore),
    description: description || '',
  });

  const defaultQuestionForm = () => ({
    title: '',
    subject: subjects[0]?.id || '',
    bloom: 'UNDERSTAND',
    sampleAnswer: '',
    status: 'APPROVED',
    isAiGenerated: false,
    rubrics: [
      makeRubricRow('Kiến thức lý thuyết cốt lõi', 4, 'Trình bày đúng, đủ khái niệm/định nghĩa then chốt'),
      makeRubricRow('Khả năng lập luận, phản xạ', 3, 'Giải thích mạch lạc, trả lời được câu hỏi phụ'),
      makeRubricRow('Ví dụ thực tiễn & giải quyết vấn đề', 3, 'Đưa ra ví dụ/tình huống áp dụng phù hợp'),
    ],
  });

  // Add/Edit Question Form State
  const [newQuestion, setNewQuestion] = useState(defaultQuestionForm);

  useEffect(() => {
    if (!newQuestion.subject && subjects.length) {
      setNewQuestion((prev) => ({ ...prev, subject: subjects[0].id }));
    }
  }, [subjects]);

  const formRubricTotal = round2(
    newQuestion.rubrics.reduce((sum, r) => sum + (parseFloat(r.maxScore) || 0), 0)
  );

  const openAddQuestion = () => {
    setEditingQuestionId(null);
    setNewQuestion(defaultQuestionForm());
    setShowAddQuestionModal(true);
  };

  const openEditQuestion = (questionId) => {
    const q = rawQuestions.find((x) => x.id === questionId);
    if (!q) return;
    setEditingQuestionId(q.id);
    setNewQuestion({
      title: q.content || '',
      subject: q.subjectId,
      bloom: q.bloomLevel,
      sampleAnswer: q.sampleAnswer || '',
      status: q.status,
      isAiGenerated: !!q.isAiGenerated,
      rubrics: (q.rubrics?.length ? q.rubrics : [{}]).map((r) =>
        makeRubricRow(r.criteriaName || '', r.maxScore ?? '', r.description || '', r.id || null)
      ),
    });
    setDetailQuestion(null);
    setShowAddQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowAddQuestionModal(false);
    setEditingQuestionId(null);
  };

  const updateRubricRow = (key, field, value) =>
    setNewQuestion((prev) => ({
      ...prev,
      rubrics: prev.rubrics.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    }));

  const addRubricRow = () =>
    setNewQuestion((prev) => ({ ...prev, rubrics: [...prev.rubrics, makeRubricRow()] }));

  const removeRubricRow = (key) =>
    setNewQuestion((prev) => ({
      ...prev,
      rubrics: prev.rubrics.length > 1 ? prev.rubrics.filter((r) => r.key !== key) : prev.rubrics,
    }));

  const replaceQuestion = (updated) =>
    setRawQuestions((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.title.trim()) return showNotification('Vui lòng nhập nội dung câu hỏi.');
    if (!newQuestion.subject) return showNotification('Vui lòng chọn môn học.');
    if (!newQuestion.rubrics.length) return showNotification('Rubric cần ít nhất 1 tiêu chí.');
    for (const [i, r] of newQuestion.rubrics.entries()) {
      if (!r.criteriaName.trim()) return showNotification(`Tiêu chí #${i + 1} chưa có tên.`);
      const score = parseFloat(r.maxScore);
      if (!(score > 0)) return showNotification(`Tiêu chí #${i + 1} phải có điểm tối đa > 0.`);
    }

    const payload = {
      subjectId: newQuestion.subject,
      content: newQuestion.title.trim(),
      sampleAnswer: newQuestion.sampleAnswer.trim() || null,
      bloomLevel: newQuestion.bloom,
      isAiGenerated: newQuestion.isAiGenerated,
      status: newQuestion.status,
      createdById: currentUser?.dbId || null,
      rubrics: newQuestion.rubrics.map((r) => ({
        criteriaName: r.criteriaName.trim(),
        maxScore: round2(parseFloat(r.maxScore)),
        description: r.description.trim() || null,
      })),
    };

    setSavingQuestion(true);
    try {
      if (editingQuestionId) {
        const updated = await api.updateQuestion(editingQuestionId, payload);
        replaceQuestion(updated);
        showNotification('Đã cập nhật câu hỏi và Rubric.');
      } else {
        const created = await api.createQuestion(payload);
        setRawQuestions((prev) => [created, ...prev]);
        showNotification('Đã thêm câu hỏi và tiêu chí Rubric vào Ngân hàng!');
      }
      closeQuestionModal();
      setNewQuestion(defaultQuestionForm());
    } catch (err) {
      showNotification(`Lỗi lưu câu hỏi: ${err.message}`);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleChangeQuestionStatus = async (q, status) => {
    try {
      const updated = await api.updateQuestionStatus(q.id, status);
      replaceQuestion(updated);
      if (detailQuestion?.id === q.id) setDetailQuestion(null);
      const msg = {
        APPROVED: q.status === 'ARCHIVED' ? 'Đã khôi phục câu hỏi vào ngân hàng chính thức.' : 'Đã duyệt câu hỏi vào ngân hàng chính thức.',
        ARCHIVED: 'Đã chuyển câu hỏi vào Lưu trữ (không dùng cho kỳ thi mới).',
        DRAFT: 'Đã chuyển câu hỏi về trạng thái Chờ duyệt.',
      }[status];
      showNotification(msg);
    } catch (err) {
      showNotification(`Lỗi cập nhật trạng thái: ${err.message}`);
    }
  };

  const handleDeleteQuestion = async (q) => {
    if (!window.confirm(`Xóa vĩnh viễn câu hỏi ${q.displayId}?\n\n"${q.title.slice(0, 120)}"\n\nThao tác này không thể hoàn tác.`)) return;
    try {
      await api.deleteQuestion(q.id);
      setRawQuestions((prev) => prev.filter((x) => x.id !== q.id));
      if (detailQuestion?.id === q.id) setDetailQuestion(null);
      showNotification('Đã xóa câu hỏi khỏi ngân hàng.');
    } catch (err) {
      showNotification(`Không thể xóa (có thể câu hỏi đã được dùng trong phiên thi). Hãy dùng "Lưu trữ". Chi tiết: ${err.message}`);
    }
  };

  const handleShowRubric = (q) => setDetailQuestion(q);

  // ================= DỮ LIỆU QUẢN LÝ KỲ THI =================
  const examsList = useMemo(
    () =>
      rawExams.map((ex) => {
        const sessions = rawSessions.filter((s) => s.examId === ex.id);
        const graded = sessions.filter((s) => s.finalTeacherScore != null).length;
        const times = sessions.map((s) => new Date(s.scheduledStartTime).getTime()).filter(Boolean).sort((a, b) => a - b);
        let status = 'UPCOMING';
        if (sessions.length && graded === sessions.length) status = 'COMPLETED';
        else if (sessions.some((s) => s.status !== 'SCHEDULED')) status = 'ACTIVE';
        const date = times.length
          ? times[0] === times[times.length - 1] || formatDate(times[0]) === formatDate(times[times.length - 1])
            ? formatDate(times[0])
            : `${formatDate(times[0])} - ${formatDate(times[times.length - 1])}`
          : 'Chưa xếp lịch';
        return {
          id: ex.id,
          displayId: shortId(ex.id, 'EXAM-'),
          title: ex.title,
          subject: ex.subjectName,
          durationMinutes: ex.durationPerStudentMins,
          totalQuestionsAi: ex.maxMainQuestions,
          totalCandidates: sessions.length,
          gradedCount: graded,
          status,
          date,
        };
      }),
    [rawExams, rawSessions]
  );

  const [newExam, setNewExam] = useState({
    title: '',
    subject: '',
    durationMinutes: 15,
    totalQuestionsAi: 3,
    maxFollowupQuestions: 2,
  });

  const handleCreateExam = async (e) => {
    e.preventDefault();
    const subjectId = newExam.subject || subjects[0]?.id;
    if (!newExam.title.trim() || !subjectId) return;
    try {
      const created = await api.createExam({
        subjectId,
        title: newExam.title.trim(),
        durationPerStudentMins: Number(newExam.durationMinutes),
        maxMainQuestions: Number(newExam.totalQuestionsAi),
        maxFollowupQuestions: Number(newExam.maxFollowupQuestions),
      });
      setRawExams((prev) => [created, ...prev]);
      setShowCreateExamModal(false);
      showNotification(`Đã khởi tạo kỳ thi "${created.title}" thành công!`);
      setNewExam((prev) => ({ ...prev, title: '' }));
    } catch (err) {
      showNotification(`Lỗi tạo kỳ thi: ${err.message}`);
    }
  };

  // ================= THỐNG KÊ =================
  const gradedSessions = rawSessions.filter((s) => s.finalTeacherScore != null);
  const finishedSessions = rawSessions.filter((s) => s.status === 'COMPLETED' || s.status === 'IN_PROGRESS' || s.finalTeacherScore != null);
  const completionRate = finishedSessions.length ? Math.round((gradedSessions.length / finishedSessions.length) * 100) : 0;
  const avgScore = gradedSessions.length
    ? (gradedSessions.reduce((a, s) => a + s.finalTeacherScore, 0) / gradedSessions.length).toFixed(2)
    : '--';
  const aiDeviation = gradedSessions.filter((s) => s.aiSuggestedScore != null);
  const aiReliability = aiDeviation.length
    ? (100 - (aiDeviation.reduce((a, s) => a + Math.abs(s.finalTeacherScore - s.aiSuggestedScore), 0) / aiDeviation.length) * 10).toFixed(1)
    : '--';
  const scoreBands = [
    { label: 'Xuất sắc (9.0 - 10)', min: 9, max: 10.01, color: 'text-emerald-600' },
    { label: 'Giỏi (8.0 - 8.9)', min: 8, max: 9, color: 'text-blue-600' },
    { label: 'Khá (7.0 - 7.9)', min: 7, max: 8, color: 'text-cyan-600' },
    { label: 'Trung bình (5.0 - 6.9)', min: 5, max: 7, color: 'text-amber-600' },
    { label: 'Không đạt (< 5.0)', min: 0, max: 5, color: 'text-rose-600' },
  ].map((b) => {
    const count = gradedSessions.filter((s) => s.finalTeacherScore >= b.min && s.finalTeacherScore < b.max).length;
    return { ...b, count, pct: gradedSessions.length ? ((count / gradedSessions.length) * 100).toFixed(1) : '0.0' };
  });

  const pendingApprovalCount = submissions.filter((s) => s.status === 'PENDING_APPROVAL').length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-800 font-sans antialiased">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-slate-700 backdrop-blur-md animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================= LEFT SIDEBAR (Stitch Design) ================= */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-20 shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-xs font-bold">
              <span className="material-symbols-outlined text-[20px]">psychology</span>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-slate-900 leading-none">AIVES</span>
              <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-1">Giảng viên &amp; Chấm thi</span>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Hệ thống Giảng viên</p>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2.5 text-blue-600">grid_view</span>
            <span>Dashboard Tổng quan</span>
          </button>

          <button
            onClick={() => setActiveTab('grading')}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'grading'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center">
              <span className={`material-symbols-outlined text-[18px] mr-2.5 ${activeTab === 'grading' ? 'text-white' : 'text-blue-600'}`}>fact_check</span>
              <span>Chấm điểm &amp; Duyệt (Split)</span>
            </div>
            {pendingApprovalCount > 0 && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === 'grading' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'}`}>
                {pendingApprovalCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`w-full flex items-center px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2.5 text-indigo-600">menu_book</span>
            <span>Ngân hàng &amp; Rubric AI</span>
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            className={`w-full flex items-center px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'exams'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2.5 text-cyan-600">calendar_month</span>
            <span>Quản lý Kỳ thi &amp; Lịch</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center px-3 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] mr-2.5 text-emerald-600">monitoring</span>
            <span>Báo cáo &amp; Phổ điểm</span>
          </button>

          {/* Quick Portal Switchers */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chuyển đổi phân hệ nhanh</p>
            <button
              onClick={() => onSwitchPortal('student_home')}
              className="w-full flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] mr-2 text-blue-600">school</span>
              <span>Cổng Thí sinh</span>
            </button>
            <button
              onClick={() => onSwitchPortal('admin_home')}
              className="w-full flex items-center px-3 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] mr-2 text-amber-600">shield_person</span>
              <span>Cổng Quản trị (Admin)</span>
            </button>
          </div>
        </nav>

        {/* Profile & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-blue-700 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-xs">
                GV
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.fullName || 'ThS. Nguyễn Văn Giảng'}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser?.department || 'Khoa Công nghệ Thông tin'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================= MAIN CONTENT WORKSPACE ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              {activeTab === 'grading' && 'Không gian Chấm điểm & Duyệt kết quả Vấn đáp AI (Human-in-the-loop)'}
              {activeTab === 'questions' && 'Ngân hàng Câu hỏi & Tiêu chí Rubric Khảo thí'}
              {activeTab === 'exams' && 'Quản lý Kỳ thi & Lập lịch Ca thi'}
              {activeTab === 'dashboard' && 'Dashboard Giảng viên & Tổng quan kỳ thi'}
              {activeTab === 'analytics' && 'Báo cáo Thống kê & Phổ điểm Đánh giá'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${loadError ? 'bg-rose-500' : loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span>PostgreSQL aives_db: {loadError ? 'Mất kết nối' : loading ? 'Đang tải...' : 'Đồng bộ'}</span>
            </div>
            {activeTab === 'questions' && (
              <button
                onClick={openAddQuestion}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Thêm câu hỏi mới</span>
              </button>
            )}
            {activeTab === 'exams' && (
              <button
                onClick={() => setShowCreateExamModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Tạo kỳ thi mới</span>
              </button>
            )}
          </div>
        </header>

        {/* ================= TAB 1: SPLIT-VIEW GRADING WORKSPACE ================= */}
        {activeTab === 'grading' && !currentSubmission && (
          <div className="flex-1 flex items-center justify-center p-10">
            <div className="text-center bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs max-w-md">
              <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
              <p className="text-sm font-bold text-slate-700 mt-2">
                {loading ? 'Đang tải bài thi từ máy chủ...' : loadError ? `Không tải được dữ liệu: ${loadError}` : 'Chưa có bài thi nào cần chấm.'}
              </p>
              {!loading && (
                <button onClick={loadAll} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer">
                  Tải lại
                </button>
              )}
            </div>
          </div>
        )}
        {activeTab === 'grading' && currentSubmission && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Student Candidate Navigation Sub-header */}
            <div className="h-12 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-900">
                  {currentSubmission.studentName}{' '}
                  <span className="font-mono font-medium text-slate-500">({currentSubmission.studentId})</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    currentSubmission.status === 'GRADED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                  {currentSubmission.status === 'GRADED' ? 'Đã chốt điểm' : 'Chờ giảng viên duyệt'}
                </span>
                <span className="text-xs text-slate-400">• Thời lượng: {currentSubmission.duration}</span>
              </div>

              {/* Candidate Selector */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
                  <button
                    onClick={() => setSelectedSubIdx((prev) => Math.max(0, prev - 1))}
                    disabled={selectedSubIdx === 0}
                    className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <span className="px-2 font-bold text-slate-800">
                    Thí sinh {selectedSubIdx + 1} / {submissions.length}
                  </span>
                  <button
                    onClick={() => setSelectedSubIdx((prev) => Math.min(submissions.length - 1, prev + 1))}
                    disabled={selectedSubIdx === submissions.length - 1}
                    className="w-7 h-7 rounded flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white disabled:opacity-30 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Split View Body */}
            <main className="flex-1 flex gap-5 p-5 overflow-hidden bg-slate-50">
              {/* Left Pane (42%): Video & AI Dialog Transcript */}
              <div className="w-[42%] flex flex-col gap-3.5 h-full overflow-hidden">
                {/* Media Player Mock */}
                <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm relative aspect-video flex-shrink-0 border border-slate-800 flex flex-col justify-between p-3">
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-sm text-emerald-400 font-mono text-[10px] font-bold border border-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Tín hiệu ghi hình: Ổn định
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 font-mono text-[10px] border border-slate-700">
                      Ghi hình Viva CAM-01 • 1080p
                    </span>
                  </div>

                  {/* Candidate Video Simulation */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-950/80 via-slate-900/50 to-slate-950/80">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-600/30 text-blue-400 mx-auto flex items-center justify-center text-2xl font-bold mb-2 border border-blue-400/40">
                        {currentSubmission.studentName.charAt(0)}
                      </div>
                      <p className="text-xs font-bold text-white">{currentSubmission.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{currentSubmission.studentId}</p>
                    </div>
                  </div>

                  {/* Player Controls Bar */}
                  <div className="z-10 bg-slate-950/80 backdrop-blur-md px-3 py-2 rounded-xl flex items-center justify-between border border-slate-800">
                    <div className="flex items-center gap-2">
                      <button className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 cursor-pointer">
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                      </button>
                      <span className="font-mono text-xs text-slate-300">04:12 / {currentSubmission.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">1.25x</span>
                      <span className="material-symbols-outlined text-base text-slate-300">volume_up</span>
                    </div>
                  </div>
                </div>

                {/* AI Dialog Transcript Timeline */}
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col overflow-hidden">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-blue-600">forum</span>
                      Bản ghi đối thoại AI &amp; Thí sinh (Transcript)
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Tự động nhận diện STT</span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                    {activeQuestion?.dialogue?.length > 0 ? (
                      activeQuestion.dialogue.map((item, idx) => (
                        <div key={idx} className={`p-2.5 rounded-xl border ${item.isAi ? 'bg-blue-50/60 border-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between font-bold mb-1">
                            <span className={item.isAi ? 'text-blue-700' : 'text-slate-800'}>{item.speaker}</span>
                            <span className="font-mono text-[10px] text-slate-400">{item.time}</span>
                          </div>
                          <p className="text-slate-700 leading-relaxed">{item.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic text-center py-8">Chưa có transcript đối thoại cho câu hỏi này.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Pane (58%): Rubric Evaluation & Approval */}
              <div className="w-[58%] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm h-full overflow-hidden">
                {/* Question Tabs */}
                <div className="border-b border-slate-200 flex bg-slate-50/90 rounded-t-2xl px-4 pt-2.5 gap-2 flex-shrink-0">
                  {currentSubmission.questions?.map((q, qIdx) => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestionTab(qIdx)}
                      className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        selectedQuestionTab === qIdx
                          ? 'bg-white text-blue-700 border-b-2 border-blue-600 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      <span>Câu {qIdx + 1}</span>
                      <span className="font-mono text-[11px] text-slate-400">({q.lecturerScore}/{q.maxScore}đ)</span>
                    </button>
                  ))}
                </div>

                {/* Question Evaluation Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {activeQuestion && (
                    <>
                      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase rounded">
                            {activeQuestion.title} • Thang điểm tối đa {activeQuestion.maxScore}đ
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 font-mono">Bloom: {activeQuestion.bloom}</span>
                        </div>
                      </div>

                      {/* Rubric Criteria List */}
                      <div className="space-y-3">
                        {activeQuestion.rubrics?.map((r) => (
                          <div key={r.id} className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs space-y-2.5">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-slate-900 text-xs">{r.title}</h4>
                                <p className="text-[11px] text-slate-500 mt-0.5">{r.desc}</p>
                              </div>
                              <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                                Tối đa: {r.max}đ
                              </span>
                            </div>

                            {/* AI Analysis Box */}
                            <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-2.5 text-xs text-slate-700 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                <span><strong>AI Đánh giá:</strong> {r.aiFeedback}</span>
                              </div>
                              <span className="font-bold font-mono text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 text-xs">
                                AI: {r.ai}đ
                              </span>
                            </div>

                            {/* Instructor Score Adjustment */}
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-xs font-bold text-slate-700">Điểm Giảng viên chốt:</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleScoreChange(r.id, -0.25)}
                                  className="w-7 h-7 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-12 text-center font-mono font-bold text-sm text-blue-700 bg-blue-50/50 py-1 rounded border border-blue-200">
                                  {r.lecturer}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleScoreChange(r.id, 0.25)}
                                  className="w-7 h-7 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Instructor Note */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-1">
                        <label className="text-xs font-bold text-slate-700">Ghi chú &amp; Lời phê của Giảng viên:</label>
                        <textarea
                          rows="2"
                          value={currentSubmission.feedback || ''}
                          onChange={(e) => handleFeedbackChange(e.target.value)}
                          placeholder="Nhập nhận xét sư phạm dành riêng cho sinh viên..."
                          className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-600"
                        ></textarea>
                      </div>
                    </>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="border-t border-slate-200 bg-slate-50/80 px-6 py-3.5 flex justify-between items-center flex-shrink-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs text-slate-500 font-medium">Tổng điểm bài thi:</span>
                    <span className="text-xl font-extrabold font-mono text-blue-700">{currentSubmission.lecturerScore}</span>
                    <span className="text-xs text-slate-400 font-mono">/ 10.0đ</span>
                    <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold ml-2">
                      AI gợi ý: {currentSubmission.aiScore}đ
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => showNotification('Bản nháp đang được giữ trên trình duyệt. Bấm "Duyệt & Chốt Điểm" để lưu vào hệ thống.')}
                      className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                    >
                      Lưu nháp
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveGrade}
                      disabled={isFinalizing}
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Duyệt &amp; Chốt Điểm (Finalize Grade)</span>
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        )}

        {/* ================= TAB 2: NGÂN HÀNG CÂU HỎI & RUBRIC AI ================= */}
        {activeTab === 'questions' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {/* Status Tabs: Đang dùng / Chờ duyệt / AI chờ duyệt / Đã duyệt / Lưu trữ */}
            <div className="flex flex-wrap items-center gap-2">
              {questionStatusTabs.map((t) => {
                const active = questionStatusFilter === t.key;
                const highlight = (t.key === 'DRAFT' || t.key === 'AI_DRAFT') && t.count > 0;
                return (
                  <button
                    key={t.key}
                    id={`question-status-tab-${t.key.toLowerCase()}`}
                    type="button"
                    onClick={() => setQuestionStatusFilter(t.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-colors ${
                      active
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t.key === 'AI_DRAFT' && <span className="material-symbols-outlined text-sm">auto_awesome</span>}
                    <span>{t.label}</span>
                    <span
                      className={`min-w-5 px-1.5 py-0.5 rounded-full text-[10px] ${
                        active ? 'bg-white/25 text-white' : highlight ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm nội dung câu hỏi, từ khóa..."
                  className="w-72 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500"
                />
                <select
                  value={questionSubjectFilter}
                  onChange={(e) => setQuestionSubjectFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="ALL">Tất cả Môn học</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </select>
                <select
                  value={questionBloomFilter}
                  onChange={(e) => setQuestionBloomFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="ALL">Thang Bloom: Tất cả</option>
                  <option value="REMEMBER">Nhớ (Remember)</option>
                  <option value="UNDERSTAND">Hiểu (Understand)</option>
                  <option value="APPLY">Vận dụng (Apply)</option>
                  <option value="ANALYZE">Phân tích (Analyze)</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Hiển thị: <strong className="text-slate-800">{filteredQuestions.length} câu hỏi</strong>
              </div>
            </div>

            {/* Questions Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Mã &amp; Môn học</th>
                    <th className="py-3 px-4">Nội dung câu hỏi vấn đáp</th>
                    <th className="py-3 px-4">Thang Bloom</th>
                    <th className="py-3 px-4">Điểm &amp; Rubric</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuestions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-slate-400 font-semibold">
                        {questionStatusFilter === 'AI_DRAFT' || questionStatusFilter === 'DRAFT'
                          ? 'Không có câu hỏi nào đang chờ duyệt.'
                          : 'Không có câu hỏi phù hợp bộ lọc.'}
                      </td>
                    </tr>
                  )}
                  {filteredQuestions.map((q) => {
                    const meta = STATUS_META[q.status] || { label: q.status, cls: 'bg-slate-100 text-slate-600' };
                    return (
                      <tr
                        key={q.id}
                        className={`hover:bg-slate-50/80 transition-colors ${q.status === 'DRAFT' ? 'bg-amber-50/40' : ''} ${q.status === 'ARCHIVED' ? 'opacity-60' : ''}`}
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{q.subject}</span>
                          <span className="text-[10px] font-mono text-slate-400">{q.displayId} • {q.code}</span>
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          <p className="font-semibold text-slate-800 line-clamp-2">{q.title}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {q.isAiGenerated ? (
                              <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-bold flex items-center gap-0.5">
                                <span className="material-symbols-outlined text-[11px]">auto_awesome</span>
                                AI sinh
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                {q.createdByName || 'Giảng viên'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 whitespace-nowrap">
                            {BLOOM_LABELS[q.bloom] || q.bloom}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800">{q.maxScore} điểm</span>
                          <span className="block text-[10px] text-slate-400">{q.rubricCount} tiêu chí đánh giá</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${meta.cls}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {q.status === 'DRAFT' && (
                              <button
                                id={`question-approve-${q.id}`}
                                type="button"
                                onClick={() => handleChangeQuestionStatus(q, 'APPROVED')}
                                title="Duyệt vào ngân hàng chính thức"
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Duyệt
                              </button>
                            )}
                            <button
                              id={`question-detail-${q.id}`}
                              type="button"
                              onClick={() => handleShowRubric(q)}
                              title="Xem chi tiết Rubric"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                            </button>
                            <button
                              id={`question-edit-${q.id}`}
                              type="button"
                              onClick={() => openEditQuestion(q.id)}
                              title="Sửa câu hỏi & Rubric"
                              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            {q.status === 'ARCHIVED' ? (
                              <button
                                id={`question-restore-${q.id}`}
                                type="button"
                                onClick={() => handleChangeQuestionStatus(q, 'APPROVED')}
                                title="Khôi phục vào ngân hàng"
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">unarchive</span>
                              </button>
                            ) : (
                              <button
                                id={`question-archive-${q.id}`}
                                type="button"
                                onClick={() => handleChangeQuestionStatus(q, 'ARCHIVED')}
                                title={q.status === 'DRAFT' ? 'Loại bỏ (lưu trữ)' : 'Lưu trữ'}
                                className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-base">archive</span>
                              </button>
                            )}
                            <button
                              id={`question-delete-${q.id}`}
                              type="button"
                              onClick={() => handleDeleteQuestion(q)}
                              title="Xóa vĩnh viễn"
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: QUẢN LÝ KỲ THI & LẬP LỊCH ================= */}
        {activeTab === 'exams' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {examsList.map((ex) => (
                <div key={ex.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">{ex.displayId}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ex.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700'
                          : ex.status === 'COMPLETED'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {ex.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{ex.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{ex.subject}</p>
                  </div>
                  <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Thời lượng:</span>
                      <span className="font-semibold">{ex.durationMinutes} phút</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Số câu AI vấn đáp:</span>
                      <span className="font-semibold">{ex.totalQuestionsAi} câu/thí sinh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Tiến độ chấm:</span>
                      <span className="font-bold text-blue-600">
                        {ex.gradedCount}/{ex.totalCandidates} ({ex.totalCandidates ? Math.round((ex.gradedCount / ex.totalCandidates) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('grading');
                      showNotification(`Đã mở danh sách chấm bài của kỳ thi "${ex.title}"`);
                    }}
                    className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Vào phòng chấm thi (Split-View)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 4: DASHBOARD TỔNG QUAN ================= */}
        {activeTab === 'dashboard' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Tổng số bài thi cần duyệt</span>
                <p className="text-2xl font-extrabold text-amber-600 mt-1">{pendingApprovalCount}</p>
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                  Cần xử lý trong ngày
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Đã chốt điểm (Finalized)</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">{gradedSessions.length}</p>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                  Tỷ lệ hoàn thành {completionRate}%
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Ngân hàng câu hỏi active</span>
                <p className="text-2xl font-extrabold text-blue-600 mt-1">{questionsList.length}</p>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                  Đã chuẩn hóa Bloom &amp; Rubric
                </span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs text-slate-500 font-medium">Điểm trung bình kỳ thi</span>
                <p className="text-2xl font-extrabold text-indigo-600 mt-1">{avgScore}</p>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                  Độ tin cậy AI: {aiReliability}{aiReliability !== '--' ? '%' : ''}
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-extrabold text-sm text-slate-800 mb-3">Quy trình Khảo thí Vấn đáp AI khép kín (AI Viva Lifecycle)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100">
                  <span className="font-bold text-blue-800 block text-sm mb-1">1. Ngân hàng &amp; Rubric</span>
                  <p className="text-slate-600">Giảng viên thiết lập câu hỏi, từ khóa, độ khó Bloom và thang điểm Rubric rõ ràng.</p>
                </div>
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100">
                  <span className="font-bold text-indigo-800 block text-sm mb-1">2. AI Examiner Viva</span>
                  <p className="text-slate-600">AI hỏi thi trực tiếp, tương tác hai chiều, phát hiện gian lận và ghi hình toàn bộ.</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100">
                  <span className="font-bold text-amber-800 block text-sm mb-1">3. Chấm sơ bộ AI</span>
                  <p className="text-slate-600">Hệ thống phân tích transcript, đối sánh rubric và đưa ra điểm gợi ý khách quan.</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="font-bold text-emerald-800 block text-sm mb-1">4. Human-in-the-loop</span>
                  <p className="text-slate-600">Giảng viên nghe lại, xem video, tinh chỉnh điểm số và chốt điểm chính thức.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: BÁO CÁO & PHỔ ĐIỂM ================= */}
        {activeTab === 'analytics' && (
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-800">Phổ điểm Đánh giá (tất cả bài đã chốt điểm: {gradedSessions.length})</h3>
              <div className="grid grid-cols-5 gap-3 text-center">
                {scoreBands.map((b) => (
                  <div key={b.label} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">{b.label}</span>
                    <p className={`text-xl font-bold ${b.color} mt-1`}>{b.count} thí sinh</p>
                    <span className="text-[10px] text-slate-400">{b.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: THÊM CÂU HỎI & RUBRIC MỚI ================= */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">{editingQuestionId ? 'edit_note' : 'post_add'}</span>
                {editingQuestionId ? 'Sửa Câu hỏi Vấn đáp & Rubric' : 'Thêm Câu hỏi Vấn đáp & Thiết lập Tiêu chí Rubric'}
                {newQuestion.isAiGenerated && (
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-bold">AI sinh</span>
                )}
              </h3>
              <button
                type="button"
                onClick={closeQuestionModal}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form id="question-form" onSubmit={handleSaveQuestion} className="py-4 space-y-3.5 text-xs overflow-y-auto pr-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung câu hỏi vấn đáp *</label>
                <textarea
                  id="question-form-content"
                  required
                  rows="3"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                  placeholder="Ví dụ: Phân tích cơ chế bắt tay 3 bước TCP và các rủi ro SYN Flood attack..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                  <select
                    id="question-form-subject"
                    value={newQuestion.subject}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thang Bloom</label>
                  <select
                    id="question-form-bloom"
                    value={newQuestion.bloom}
                    onChange={(e) => setNewQuestion({ ...newQuestion, bloom: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="REMEMBER">Nhớ (Remember)</option>
                    <option value="UNDERSTAND">Hiểu (Understand)</option>
                    <option value="APPLY">Vận dụng (Apply)</option>
                    <option value="ANALYZE">Phân tích (Analyze)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái</label>
                  <select
                    id="question-form-status"
                    value={newQuestion.status}
                    onChange={(e) => setNewQuestion({ ...newQuestion, status: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="DRAFT">Chờ duyệt (Draft)</option>
                    <option value="APPROVED">Đã duyệt (Approved)</option>
                    <option value="ARCHIVED">Lưu trữ (Archived)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Đáp án mẫu / Dàn ý gợi ý (căn cứ cho AI chấm)</label>
                <textarea
                  id="question-form-sample-answer"
                  rows="3"
                  value={newQuestion.sampleAnswer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, sampleAnswer: e.target.value })}
                  placeholder="Các ý chính cần có, từ khóa cốt lõi (SYN, ACK, Sequence Number...)"
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-slate-700">Tiêu chí Rubric Đánh giá ({newQuestion.rubrics.length})</label>
                  <span className="font-bold text-slate-600">
                    Tổng điểm: <span className="text-blue-700 text-sm">{formRubricTotal}</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span className="col-span-4">Tên tiêu chí *</span>
                    <span className="col-span-2">Điểm tối đa *</span>
                    <span className="col-span-5">Mô tả / mức đạt</span>
                    <span className="col-span-1"></span>
                  </div>
                  {newQuestion.rubrics.map((r, idx) => (
                    <div key={r.key} className="grid grid-cols-12 gap-2 items-start">
                      <input
                        id={`rubric-name-${idx}`}
                        type="text"
                        required
                        value={r.criteriaName}
                        onChange={(e) => updateRubricRow(r.key, 'criteriaName', e.target.value)}
                        placeholder={`Tiêu chí #${idx + 1}`}
                        className="col-span-4 p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600"
                      />
                      <input
                        id={`rubric-score-${idx}`}
                        type="number"
                        required
                        min="0.25"
                        step="0.25"
                        value={r.maxScore}
                        onChange={(e) => updateRubricRow(r.key, 'maxScore', e.target.value)}
                        placeholder="0"
                        className="col-span-2 p-2 border border-slate-200 rounded-xl bg-white font-bold text-blue-700 focus:outline-none focus:border-blue-600"
                      />
                      <input
                        id={`rubric-desc-${idx}`}
                        type="text"
                        value={r.description}
                        onChange={(e) => updateRubricRow(r.key, 'description', e.target.value)}
                        placeholder="Mô tả yêu cầu để đạt điểm tối đa"
                        className="col-span-5 p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeRubricRow(r.key)}
                        disabled={newQuestion.rubrics.length <= 1}
                        title="Xóa tiêu chí"
                        className="col-span-1 p-2 rounded-xl text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex justify-center"
                      >
                        <span className="material-symbols-outlined text-base">remove_circle</span>
                      </button>
                    </div>
                  ))}
                  <button
                    id="rubric-add-row"
                    type="button"
                    onClick={addRubricRow}
                    className="w-full py-2 border border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Thêm tiêu chí
                  </button>
                </div>
              </div>
            </form>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={closeQuestionModal}
                className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                id="question-form-submit"
                type="submit"
                form="question-form"
                disabled={savingQuestion}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
              >
                {savingQuestion ? 'Đang lưu...' : editingQuestionId ? 'Lưu thay đổi' : 'Lưu vào Ngân hàng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CHI TIẾT CÂU HỎI & RUBRIC ================= */}
      {detailQuestion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setDetailQuestion(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-mono text-slate-400">{detailQuestion.displayId} • {detailQuestion.code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${(STATUS_META[detailQuestion.status] || {}).cls || ''}`}>
                    {(STATUS_META[detailQuestion.status] || {}).label || detailQuestion.status}
                  </span>
                  <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700">
                    {BLOOM_LABELS[detailQuestion.bloom] || detailQuestion.bloom}
                  </span>
                  {detailQuestion.isAiGenerated && (
                    <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded font-bold">AI sinh</span>
                  )}
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">{detailQuestion.title}</h3>
                <p className="text-slate-400 mt-0.5">{detailQuestion.subject}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailQuestion(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div>
                <p className="font-bold text-slate-700 mb-1">Đáp án mẫu / Dàn ý gợi ý</p>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 whitespace-pre-wrap">
                  {detailQuestion.sampleAnswer || <span className="text-slate-400 italic">Chưa có đáp án mẫu.</span>}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1">
                  Rubric chấm điểm ({detailQuestion.rubricCount} tiêu chí – tổng {detailQuestion.maxScore} điểm)
                </p>
                <table className="w-full border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-2 px-3 text-left w-8">#</th>
                      <th className="py-2 px-3 text-left">Tiêu chí</th>
                      <th className="py-2 px-3 text-left">Mô tả</th>
                      <th className="py-2 px-3 text-right">Điểm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {detailQuestion.rubrics.length === 0 && (
                      <tr>
                        <td colSpan="4" className="py-4 text-center text-slate-400">Chưa có tiêu chí.</td>
                      </tr>
                    )}
                    {detailQuestion.rubrics.map((r, i) => (
                      <tr key={r.id || i}>
                        <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{r.criteriaName}</td>
                        <td className="py-2 px-3 text-slate-600">{r.description || '—'}</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-700">{r.maxScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-end gap-2">
              {detailQuestion.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => handleChangeQuestionStatus(detailQuestion, 'APPROVED')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Duyệt
                </button>
              )}
              {detailQuestion.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => handleChangeQuestionStatus(detailQuestion, 'ARCHIVED')}
                  className="px-4 py-2 border border-amber-300 text-amber-700 hover:bg-amber-50 font-bold rounded-xl cursor-pointer"
                >
                  {detailQuestion.status === 'DRAFT' ? 'Loại bỏ' : 'Lưu trữ'}
                </button>
              )}
              <button
                type="button"
                onClick={() => openEditQuestion(detailQuestion.id)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
              >
                Sửa câu hỏi &amp; Rubric
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: TẠO KỲ THI MỚI ================= */}
      {showCreateExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">calendar_add_on</span>
                Tạo Kỳ thi Vấn đáp AI Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateExamModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên kỳ thi *</label>
                <input
                  required
                  type="text"
                  value={newExam.title}
                  onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
                  placeholder="Ví dụ: Kỳ thi Vấn đáp Đánh giá năng lực Khóa K18..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Môn học</label>
                <select
                  value={newExam.subject || subjects[0]?.id || ''}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thời lượng (phút)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={newExam.durationMinutes}
                    onChange={(e) => setNewExam({ ...newExam, durationMinutes: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số câu AI hỏi</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newExam.totalQuestionsAi}
                    onChange={(e) => setNewExam({ ...newExam, totalQuestionsAi: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Số câu hỏi đào sâu tối đa / câu chính</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={newExam.maxFollowupQuestions}
                  onChange={(e) => setNewExam({ ...newExam, maxFollowupQuestions: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateExamModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Khởi tạo kỳ thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
