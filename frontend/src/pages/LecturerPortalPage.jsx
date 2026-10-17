import React, { useState } from 'react';

export default function LecturerPortalPage({ currentUser, onLogout, onSwitchPortal }) {
  const [activeTab, setActiveTab] = useState('grading'); // 'dashboard' | 'grading' | 'questions' | 'exams' | 'analytics'

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState('ALL');
  const [questionBloomFilter, setQuestionBloomFilter] = useState('ALL');

  // Modal states
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // ================= DỮ LIỆU CHẤM ĐIỂM SPLIT-VIEW (HUMAN-IN-THE-LOOP) =================
  const [submissions, setSubmissions] = useState([
    {
      id: 'SUB-001',
      studentId: 'SE180123',
      studentName: 'Trần Hoàng Phúc',
      examId: 'CS201',
      examTitle: 'Kiến trúc máy tính & Hệ điều hành (CS201)',
      status: 'PENDING_APPROVAL', // 'PENDING_APPROVAL' | 'GRADED'
      aiScore: 8.5,
      lecturerScore: 8.75,
      submittedAt: '14:20 - Hôm nay',
      duration: '18 phút 45 giây',
      violationsCount: 0,
      currentQuestionIdx: 0,
      questions: [
        {
          id: 'Q1',
          title: 'Câu 1: Cơ chế Phân trang & Phân mảnh nội vi',
          maxScore: 4.0,
          aiScore: 3.5,
          lecturerScore: 3.75,
          bloom: 'ANALYZE',
          note: 'Thí sinh nắm rất chắc bản chất, trình bày rành mạch logic.',
          rubrics: [
            {
              id: 'R1_1',
              title: 'Tiêu chí 1: Nắm vững định nghĩa & Nguyên lý (Definition)',
              desc: 'Định nghĩa chuẩn cơ chế Paging, kích thước trang, khung trang.',
              max: 1.5,
              ai: 1.5,
              lecturer: 1.5,
              aiFeedback: 'Khớp 100% định nghĩa chuẩn. Trả lời ngay trong 3 giây đầu.',
            },
            {
              id: 'R1_2',
              title: 'Tiêu chí 2: Phân tích nguyên nhân & Biện pháp giảm thiểu',
              desc: 'Chỉ rõ nguyên nhân trang cuối không lấp đầy và biện pháp khắc phục.',
              max: 1.5,
              ai: 1.25,
              lecturer: 1.25,
              aiFeedback: 'Nêu đúng giảm page size & overhead. Chưa nhắc tới Multi-level Paging.',
            },
            {
              id: 'R1_3',
              title: 'Tiêu chí 3: Phản xạ & Độ trôi chảy (Fluency & Latency)',
              desc: 'Độ trễ phản xạ < 2.0s, ngữ điệu tự tin, không ấp úng ngắt quãng.',
              max: 1.0,
              ai: 0.75,
              lecturer: 1.0,
              aiFeedback: 'Phản xạ nhanh 1.8s, điểm tự tin AI đánh giá 88/100.',
            },
          ],
          dialogue: [
            {
              speaker: 'AI Giám khảo',
              time: '00:15',
              text: 'Chào bạn Phúc! Bạn vừa nhắc đến cơ chế Phân trang (Paging), vậy hiện tượng Phân mảnh nội vi (Internal Fragmentation) xảy ra như thế nào trong cơ chế này?',
              isAi: true,
            },
            {
              speaker: 'Thí sinh Trần Hoàng Phúc',
              time: '00:32',
              text: 'Thưa thầy cô, phân mảnh nội vi xảy ra khi kích thước tiến trình không chia hết cho kích thước của khung trang (page frame)... do đó trang cuối cùng được cấp phát chỉ sử dụng một phần dữ liệu, để thừa khoảng trống không dùng đến.',
              isAi: false,
            },
            {
              speaker: 'AI Hỏi xoáy sâu (Follow-up)',
              time: '02:10',
              text: 'Rất chính xác! Vậy làm thế nào để giảm thiểu kích thước phân mảnh nội vi này trong thiết kế hệ điều hành thực tế?',
              isAi: true,
            },
            {
              speaker: 'Thí sinh Trần Hoàng Phúc',
              time: '02:24',
              text: 'Dạ chúng ta có thể giảm kích thước trang (page size). Tuy nhiên nhược điểm là sẽ làm tăng kích thước bảng trang (page table size) và overhead bộ nhớ ạ.',
              isAi: false,
            },
          ],
        },
        {
          id: 'Q2',
          title: 'Câu 2: Bộ nhớ ảo & Bộ đệm chuyển đổi TLB',
          maxScore: 3.5,
          aiScore: 3.0,
          lecturerScore: 3.0,
          bloom: 'APPLY',
          note: 'Giải thích tốt về TLB Hit và TLB Miss.',
          rubrics: [
            {
              id: 'R2_1',
              title: 'Tiêu chí 1: Vai trò phần cứng TLB',
              desc: 'Giải thích bộ nhớ liên kết nhanh giảm số lần truy cập RAM.',
              max: 2.0,
              ai: 1.75,
              lecturer: 1.75,
              aiFeedback: 'Mô tả rõ chu trình hit/miss.',
            },
            {
              id: 'R2_2',
              title: 'Tiêu chí 2: Đánh đổi hiệu năng (Performance Trade-off)',
              desc: 'Tính toán thời gian truy cập hiệu dụng EAT.',
              max: 1.5,
              ai: 1.25,
              lecturer: 1.25,
              aiFeedback: 'Công thức EAT chính xác.',
            },
          ],
          dialogue: [
            {
              speaker: 'AI Giám khảo',
              time: '06:12',
              text: 'Hãy giải thích vai trò của Translation Lookaside Buffer (TLB) khi CPU tra cứu địa chỉ?',
              isAi: true,
            },
            {
              speaker: 'Thí sinh Trần Hoàng Phúc',
              time: '06:28',
              text: 'TLB là bộ nhớ cache tốc độ rất cao nằm trong MMU, lưu trữ các ánh xạ trang gần đây nhất để CPU không cần tốn 2 lần đọc RAM.',
              isAi: false,
            },
          ],
        },
      ],
    },
    {
      id: 'SUB-002',
      studentId: 'SE170002',
      studentName: 'Lê Thị Bình',
      examId: 'CS201',
      examTitle: 'Kiến trúc máy tính & Hệ điều hành (CS201)',
      status: 'PENDING_APPROVAL',
      aiScore: 7.25,
      lecturerScore: 7.5,
      submittedAt: '13:50 - Hôm nay',
      duration: '16 phút 10 giây',
      violationsCount: 0,
      currentQuestionIdx: 0,
      questions: [
        {
          id: 'Q1',
          title: 'Câu 1: Cơ chế Phân trang & Phân mảnh nội vi',
          maxScore: 4.0,
          aiScore: 3.0,
          lecturerScore: 3.0,
          bloom: 'ANALYZE',
          note: 'Trả lời đúng ý chính.',
          rubrics: [
            {
              id: 'R1_1',
              title: 'Tiêu chí 1: Nắm vững định nghĩa',
              desc: 'Định nghĩa phân trang',
              max: 1.5,
              ai: 1.25,
              lecturer: 1.25,
              aiFeedback: 'Tốt',
            },
          ],
          dialogue: [],
        },
      ],
    },
    {
      id: 'SUB-003',
      studentId: 'SE170003',
      studentName: 'Phạm Minh Cường',
      examId: 'CS201',
      examTitle: 'Kiến trúc máy tính & Hệ điều hành (CS201)',
      status: 'GRADED',
      aiScore: 9.0,
      lecturerScore: 9.0,
      submittedAt: '10:15 - Hôm qua',
      duration: '19 phút 00 giây',
      violationsCount: 0,
      currentQuestionIdx: 0,
      questions: [],
    },
  ]);

  const [selectedSubIdx, setSelectedSubIdx] = useState(0);
  const [selectedQuestionTab, setSelectedQuestionTab] = useState(0);
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
        return { ...sub, questions: newQuestions, lecturerScore: totalLecturer };
      })
    );
  };

  const handleApproveGrade = () => {
    setSubmissions((prev) =>
      prev.map((sub, idx) =>
        idx === selectedSubIdx
          ? { ...sub, status: 'GRADED' }
          : sub
      )
    );
    showNotification(`Đã duyệt & chốt điểm bài thi của thí sinh ${currentSubmission.studentName} thành công! Điểm: ${currentSubmission.lecturerScore}/10.0`);
  };

  // ================= DỮ LIỆU NGÂN HÀNG CÂU HỎI & RUBRIC =================
  const [questionsList, setQuestionsList] = useState([
    {
      id: 'QUEST-101',
      subject: 'Hệ điều hành (OS)',
      code: 'CS201',
      title: 'Phân tích cơ chế Phân trang (Paging) và Phân mảnh bộ nhớ nội vi',
      bloom: 'ANALYZE',
      status: 'APPROVED',
      maxScore: 4.0,
      keywords: ['Paging', 'Internal Fragmentation', 'Page Size', 'Overhead'],
      rubricCount: 3,
    },
    {
      id: 'QUEST-102',
      subject: 'Hệ điều hành (OS)',
      code: 'CS201',
      title: 'Nguyên lý hoạt động và hiệu năng của bộ đệm chuyển đổi địa chỉ TLB',
      bloom: 'APPLY',
      status: 'APPROVED',
      maxScore: 3.5,
      keywords: ['TLB Hit', 'TLB Miss', 'Page Table Walk', 'EAT'],
      rubricCount: 2,
    },
    {
      id: 'QUEST-103',
      subject: 'Mạng máy tính',
      code: 'NET102',
      title: 'So sánh cơ chế bắt tay 3 bước TCP và giao thức UDP trong truyền streaming',
      bloom: 'EVALUATE',
      status: 'APPROVED',
      maxScore: 5.0,
      keywords: ['TCP 3-way handshake', 'UDP', 'Congestion Control', 'Flow Control'],
      rubricCount: 4,
    },
    {
      id: 'QUEST-104',
      subject: 'Kỹ thuật Phần mềm',
      code: 'SWE301',
      title: 'Áp dụng Design Pattern Factory Method vs Abstract Factory',
      bloom: 'CREATE',
      status: 'DRAFT',
      maxScore: 4.5,
      keywords: ['Creational Patterns', 'Loose Coupling', 'Polymorphism'],
      rubricCount: 3,
    },
  ]);

  // Add Question Form State
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    subject: 'CS201',
    bloom: 'UNDERSTAND',
    maxScore: '4.0',
    keywords: '',
    rubric1: 'Kiến thức lý thuyết cốt lõi (Trọng số 40%)',
    rubric2: 'Khả năng lập luận phản xạ (Trọng số 30%)',
    rubric3: 'Ví dụ thực tiễn & Giải quyết vấn đề (Trọng số 30%)',
  });

  const handleAddQuestion = (e) => {
    e.preventDefault();
    if (!newQuestion.title.trim()) return;
    const item = {
      id: `QUEST-${Date.now().toString().slice(-4)}`,
      subject: newQuestion.subject === 'CS201' ? 'Hệ điều hành (OS)' : 'Kỹ thuật phần mềm',
      code: newQuestion.subject,
      title: newQuestion.title,
      bloom: newQuestion.bloom,
      status: 'APPROVED',
      maxScore: parseFloat(newQuestion.maxScore) || 4.0,
      keywords: newQuestion.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      rubricCount: 3,
    };
    setQuestionsList([item, ...questionsList]);
    setShowAddQuestionModal(false);
    showNotification('Đã thêm câu hỏi và tiêu chí Rubric thành công vào Ngân hàng!');
    setNewQuestion({
      title: '',
      subject: 'CS201',
      bloom: 'UNDERSTAND',
      maxScore: '4.0',
      keywords: '',
      rubric1: 'Kiến thức lý thuyết cốt lõi (Trọng số 40%)',
      rubric2: 'Khả năng lập luận phản xạ (Trọng số 30%)',
      rubric3: 'Ví dụ thực tiễn & Giải quyết vấn đề (Trọng số 30%)',
    });
  };

  // ================= DỮ LIỆU QUẢN LÝ KỲ THI =================
  const [examsList, setExamsList] = useState([
    {
      id: 'EXAM-2026-01',
      title: 'Kỳ thi Vấn đáp Cuối kỳ - Hệ điều hành (CS201)',
      subject: 'Kiến trúc máy tính & HĐH',
      durationMinutes: 20,
      totalQuestionsAi: 3,
      totalCandidates: 45,
      gradedCount: 31,
      status: 'ACTIVE',
      date: '14/10/2026 - 18/10/2026',
    },
    {
      id: 'EXAM-2026-02',
      title: 'Bảo vệ Đồ án Kỹ thuật Phần mềm (SWE301)',
      subject: 'Kỹ thuật Phần mềm Chuyên sâu',
      durationMinutes: 30,
      totalQuestionsAi: 4,
      totalCandidates: 28,
      gradedCount: 28,
      status: 'COMPLETED',
      date: '05/10/2026',
    },
    {
      id: 'EXAM-2026-03',
      title: 'Thi Đánh giá Năng lực Mạng máy tính (NET102)',
      subject: 'Mạng máy tính căn bản',
      durationMinutes: 15,
      totalQuestionsAi: 2,
      totalCandidates: 52,
      gradedCount: 12,
      status: 'UPCOMING',
      date: '20/10/2026',
    },
  ]);

  const [newExam, setNewExam] = useState({
    title: '',
    subject: 'Kiến trúc máy tính & HĐH',
    durationMinutes: 20,
    totalQuestionsAi: 3,
    date: '25/10/2026',
  });

  const handleCreateExam = (e) => {
    e.preventDefault();
    if (!newExam.title.trim()) return;
    const created = {
      id: `EXAM-${Date.now().toString().slice(-4)}`,
      title: newExam.title,
      subject: newExam.subject,
      durationMinutes: Number(newExam.durationMinutes),
      totalQuestionsAi: Number(newExam.totalQuestionsAi),
      totalCandidates: 30,
      gradedCount: 0,
      status: 'UPCOMING',
      date: newExam.date,
    };
    setExamsList([created, ...examsList]);
    setShowCreateExamModal(false);
    showNotification(`Đã khởi tạo kỳ thi "${created.title}" thành công!`);
  };

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
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>PostgreSQL aives_db: Đồng bộ</span>
            </div>
            {activeTab === 'questions' && (
              <button
                onClick={() => setShowAddQuestionModal(true)}
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
        {activeTab === 'grading' && (
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
                          defaultValue={activeQuestion.note}
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
                      onClick={() => showNotification('Đã lưu bản nháp điểm số!')}
                      className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs"
                    >
                      Lưu nháp
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveGrade}
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
                  <option value="CS201">Hệ điều hành (CS201)</option>
                  <option value="NET102">Mạng máy tính (NET102)</option>
                  <option value="SWE301">Kỹ thuật phần mềm (SWE301)</option>
                </select>
                <select
                  value={questionBloomFilter}
                  onChange={(e) => setQuestionBloomFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                >
                  <option value="ALL">Thang Bloom: Tất cả</option>
                  <option value="REMEMBER">Nhận biết (Remember)</option>
                  <option value="UNDERSTAND">Thông hiểu (Understand)</option>
                  <option value="APPLY">Vận dụng (Apply)</option>
                  <option value="ANALYZE">Phân tích (Analyze)</option>
                  <option value="EVALUATE">Đánh giá (Evaluate)</option>
                  <option value="CREATE">Sáng tạo (Create)</option>
                </select>
              </div>

              <div className="text-xs text-slate-500 font-semibold">
                Tổng cộng: <strong className="text-slate-800">{questionsList.length} câu hỏi</strong> đã chuẩn hóa Rubric
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
                  {questionsList.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{q.subject}</span>
                        <span className="text-[10px] font-mono text-slate-400">{q.id} • {q.code}</span>
                      </td>
                      <td className="py-3.5 px-4 max-w-md">
                        <p className="font-semibold text-slate-800 line-clamp-2">{q.title}</p>
                        <div className="flex gap-1.5 mt-1">
                          {q.keywords?.map((kw, i) => (
                            <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                              #{kw}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700">
                          {q.bloom}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800">{q.maxScore} điểm</span>
                        <span className="block text-[10px] text-slate-400">{q.rubricCount} tiêu chí đánh giá</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${q.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => alert(`Xem chi tiết Rubric cho câu hỏi ${q.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                        >
                          Chi tiết Rubric
                        </button>
                      </td>
                    </tr>
                  ))}
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
                    <span className="text-[10px] font-mono font-bold text-slate-400">{ex.id}</span>
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
                        {ex.gradedCount}/{ex.totalCandidates} ({Math.round((ex.gradedCount / ex.totalCandidates) * 100)}%)
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
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">71</p>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                  Tỷ lệ hoàn thành 84%
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
                <p className="text-2xl font-extrabold text-indigo-600 mt-1">8.12</p>
                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                  Độ tin cậy AI: 94.2%
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
              <h3 className="font-extrabold text-sm text-slate-800">Phổ điểm Đánh giá Kỳ thi CS201</h3>
              <div className="grid grid-cols-5 gap-3 text-center">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Xuất sắc (9.0 - 10)</span>
                  <p className="text-xl font-bold text-emerald-600 mt-1">12 thí sinh</p>
                  <span className="text-[10px] text-slate-400">26.6%</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Giỏi (8.0 - 8.9)</span>
                  <p className="text-xl font-bold text-blue-600 mt-1">18 thí sinh</p>
                  <span className="text-[10px] text-slate-400">40.0%</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Khá (7.0 - 7.9)</span>
                  <p className="text-xl font-bold text-cyan-600 mt-1">10 thí sinh</p>
                  <span className="text-[10px] text-slate-400">22.2%</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Trung bình (5.0 - 6.9)</span>
                  <p className="text-xl font-bold text-amber-600 mt-1">4 thí sinh</p>
                  <span className="text-[10px] text-slate-400">8.8%</span>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Không đạt (&lt; 5.0)</span>
                  <p className="text-xl font-bold text-rose-600 mt-1">1 thí sinh</p>
                  <span className="text-[10px] text-slate-400">2.2%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL: THÊM CÂU HỎI & RUBRIC MỚI ================= */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">post_add</span>
                Thêm Câu hỏi Vấn đáp &amp; Thiết lập Tiêu chí Rubric
              </h3>
              <button
                type="button"
                onClick={() => setShowAddQuestionModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddQuestion} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nội dung câu hỏi vấn đáp *</label>
                <textarea
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
                    value={newQuestion.subject}
                    onChange={(e) => setNewQuestion({ ...newQuestion, subject: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="CS201">CS201 - Hệ điều hành</option>
                    <option value="NET102">NET102 - Mạng máy tính</option>
                    <option value="SWE301">SWE301 - KT Phần mềm</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thang Bloom</label>
                  <select
                    value={newQuestion.bloom}
                    onChange={(e) => setNewQuestion({ ...newQuestion, bloom: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                  >
                    <option value="REMEMBER">Nhận biết</option>
                    <option value="UNDERSTAND">Thông hiểu</option>
                    <option value="APPLY">Vận dụng</option>
                    <option value="ANALYZE">Phân tích</option>
                    <option value="EVALUATE">Đánh giá</option>
                    <option value="CREATE">Sáng tạo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm tối đa</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newQuestion.maxScore}
                    onChange={(e) => setNewQuestion({ ...newQuestion, maxScore: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50 font-bold text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Từ khóa cốt lõi (Keywords cho AI nhận dạng)</label>
                <input
                  type="text"
                  value={newQuestion.keywords}
                  onChange={(e) => setNewQuestion({ ...newQuestion, keywords: e.target.value })}
                  placeholder="Cách nhau bằng dấu phẩy, e.g. SYN, ACK, Sequence Number"
                  className="w-full p-2 border border-slate-200 rounded-xl bg-slate-50"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 mb-2">Tiêu chí Rubric Đánh giá:</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newQuestion.rubric1}
                    onChange={(e) => setNewQuestion({ ...newQuestion, rubric1: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  />
                  <input
                    type="text"
                    value={newQuestion.rubric2}
                    onChange={(e) => setNewQuestion({ ...newQuestion, rubric2: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  />
                  <input
                    type="text"
                    value={newQuestion.rubric3}
                    onChange={(e) => setNewQuestion({ ...newQuestion, rubric3: e.target.value })}
                    className="w-full p-2 border border-slate-200 rounded-xl bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
                >
                  Lưu vào Ngân hàng
                </button>
              </div>
            </form>
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
                  value={newExam.subject}
                  onChange={(e) => setNewExam({ ...newExam, subject: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50"
                >
                  <option value="Kiến trúc máy tính & HĐH">Kiến trúc máy tính &amp; HĐH (CS201)</option>
                  <option value="Mạng máy tính căn bản">Mạng máy tính căn bản (NET102)</option>
                  <option value="Kỹ thuật Phần mềm Chuyên sâu">Kỹ thuật Phần mềm Chuyên sâu (SWE301)</option>
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
                <label className="block font-bold text-slate-700 mb-1">Ngày thi</label>
                <input
                  type="text"
                  value={newExam.date}
                  onChange={(e) => setNewExam({ ...newExam, date: e.target.value })}
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
