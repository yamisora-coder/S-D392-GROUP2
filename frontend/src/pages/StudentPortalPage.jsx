import React, { useState, useRef, useEffect } from 'react';
import DeviceCheckModal from '../components/DeviceCheckModal.jsx';
import VivaRoomModal from '../components/VivaRoomModal.jsx';
import { api, formatDate, formatTime, formatDateTime } from '../services/api.js';

export default function StudentPortalPage({ currentUser, onLogout, onSwitchToAdmin, onSwitchToLecturer }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [historySearch, setHistorySearch] = useState('');
  const [activeTab, setActiveTab] = useState('exams');
  const [selectedExamDetails, setSelectedExamDetails] = useState(null);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');
  const [appealToast, setAppealToast] = useState('');

  // Device check & Viva Room modal states
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [deviceCheckTargetExam, setDeviceCheckTargetExam] = useState(null);
  const [activeVivaRoomExam, setActiveVivaRoomExam] = useState(null);

  // User menu dropdown state (topbar & sidebar)
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSidebarUserDropdown, setShowSidebarUserDropdown] = useState(false);
  const userMenuRef = useRef(null);
  const sidebarMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (sidebarMenuRef.current && !sidebarMenuRef.current.contains(event.target)) {
        setShowSidebarUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ================= DỮ LIỆU CA THI CỦA THÍ SINH (PostgreSQL) =================
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [examHistory, setExamHistory] = useState([]);
  const [examsLoading, setExamsLoading] = useState(true);
  const [examsError, setExamsError] = useState('');

  const ratingOf = (score) => {
    if (score >= 9) return { rating: 'Xuất sắc', ratingClass: 'text-emerald-600' };
    if (score >= 8) return { rating: 'Giỏi', ratingClass: 'text-emerald-600' };
    if (score >= 6.5) return { rating: 'Khá', ratingClass: 'text-blue-600' };
    if (score >= 5) return { rating: 'Trung bình', ratingClass: 'text-amber-600' };
    return { rating: 'Không đạt', ratingClass: 'text-rose-600' };
  };

  useEffect(() => {
    const load = async () => {
      if (!currentUser?.dbId) {
        setExamsLoading(false);
        setExamsError('Phiên đăng nhập cũ không có mã tài khoản hệ thống. Vui lòng đăng xuất và đăng nhập lại.');
        return;
      }
      setExamsLoading(true);
      setExamsError('');
      try {
        const [sessions, exams] = await Promise.all([api.getSessionsByStudent(currentUser.dbId), api.getExams()]);
        const examById = new Map((exams || []).map((e) => [e.id, e]));
        const now = Date.now();

        const upcoming = (sessions || [])
          .filter((s) => s.status === 'SCHEDULED' || (s.status === 'IN_PROGRESS' && s.aiSuggestedScore == null))
          .sort((a, b) => new Date(a.scheduledStartTime) - new Date(b.scheduledStartTime))
          .map((s) => {
            const exam = examById.get(s.examId);
            const mins = exam?.durationPerStudentMins ?? 15;
            const start = new Date(s.scheduledStartTime).getTime();
            const end = start + mins * 60000;
            const isActive = s.status === 'IN_PROGRESS' || (now >= start - 15 * 60000 && now <= end);
            return {
              id: s.id,
              examId: s.examId,
              title: s.examTitle,
              subjectCode: exam?.subjectCode || '',
              subjectId: exam?.subjectId,
              maxMainQuestions: exam?.maxMainQuestions ?? 3,
              format: 'Vấn đáp AI',
              status: isActive ? 'active' : 'upcoming',
              statusLabel: isActive ? 'Đang mở phòng thi' : 'Sắp diễn ra',
              deviceStatus: '🟠 Chưa kiểm tra',
              questionsCount: `${exam?.maxMainQuestions ?? 3} câu chính + ${exam?.maxFollowupQuestions ?? 2} câu hỏi xoáy`,
              timeSlot: `${formatTime(start)} - ${formatTime(end)} • ${formatDate(start)}`,
              duration: `${mins} phút`,
              passingScore: '5.0/10 điểm',
              canEnter: false,
              deviceChecked: false,
            };
          });

        const history = (sessions || [])
          .filter((s) => s.status === 'COMPLETED' || s.finalTeacherScore != null || s.aiSuggestedScore != null)
          .sort((a, b) => new Date(b.scheduledStartTime) - new Date(a.scheduledStartTime))
          .map((s) => {
            const exam = examById.get(s.examId);
            const graded = s.finalTeacherScore != null;
            const score = graded ? s.finalTeacherScore : s.aiSuggestedScore;
            const r = graded ? ratingOf(score) : { rating: 'Chờ duyệt', ratingClass: 'text-blue-600' };
            return {
              id: s.id,
              title: s.examTitle,
              code: exam?.subjectCode || s.subjectName || '',
              status: graded ? 'graded' : 'pending',
              statusText: graded ? '🟢 Đã chốt điểm' : '🟡 Chờ duyệt',
              statusBadgeClass: graded ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700',
              score: score != null ? `${score}/10` : '--',
              percentage: score != null ? `${Math.round(score * 10)}%` : null,
              numericScore: graded ? score : null,
              rating: r.rating,
              ratingClass: r.ratingClass,
              duration: `${exam?.durationPerStudentMins ?? '--'} phút`,
              submittedAt: formatDateTime(s.scheduledStartTime),
              feedback: graded
                ? s.teacherFeedback || 'Giảng viên chưa để lại nhận xét.'
                : `AI đã đề xuất ${s.aiSuggestedScore ?? '--'}/10. Giảng viên phụ trách đang rà soát để chốt điểm.`,
            };
          });

        setUpcomingExams(upcoming);
        setExamHistory(history);
      } catch (err) {
        setExamsError(err.message);
      } finally {
        setExamsLoading(false);
      }
    };
    load();
  }, [currentUser?.dbId]);

  const gradedScores = examHistory.filter((h) => h.numericScore != null).map((h) => h.numericScore);
  const gpa = gradedScores.length ? (gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length).toFixed(1) : null;

  const filteredHistory = examHistory.filter((item) => {
    const matchesFilter =
      historyFilter === 'all' || item.status === historyFilter;
    const matchesSearch =
      item.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.code.toLowerCase().includes(historySearch.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDeviceCheck = (exam) => {
    setDeviceCheckTargetExam(exam);
    setShowDeviceModal(true);
  };

  const handleDeviceCheckComplete = () => {
    if (deviceCheckTargetExam) {
      setUpcomingExams((prev) =>
        prev.map((ex) =>
          ex.id === deviceCheckTargetExam.id
            ? {
                ...ex,
                deviceStatus: '🟢 Đã kiểm tra',
                deviceChecked: true,
                canEnter: true,
              }
            : ex
        )
      );
    }
  };

  const handleEnterRoom = (exam) => {
    if (!exam.deviceChecked && !exam.canEnter) {
      handleDeviceCheck(exam);
      return;
    }
    setActiveVivaRoomExam(exam);
  };

  const userInitial = (currentUser?.fullName || 'User').trim().charAt(0).toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 text-slate-800 font-sans antialiased">
      {/* Sidebar Navigation - Stitch Design */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shrink-0">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            AIVES
          </span>
          <span className="ml-2 px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-600 rounded-md border border-blue-100">
            Student Portal
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Tổng quan
          </p>
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'text-blue-600 bg-blue-50/80 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-house w-5 mr-3 text-slate-400"></i>
            Tổng quan
          </button>

          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">
            Kỳ thi
          </p>
          <button
            onClick={() => setActiveTab('exams')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              activeTab === 'exams'
                ? 'text-blue-600 bg-blue-50/80 font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-file-lines w-5 mr-3 text-blue-600"></i>
            Kỳ thi của tôi
            <span className="ml-auto bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
              2
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'text-blue-600 bg-blue-50/80 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <i className="fa-solid fa-clock-rotate-left w-5 mr-3 text-slate-400"></i>
            Lịch sử bài thi
          </button>

          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mt-6 mb-2">
            Hệ thống
          </p>
          <button
            onClick={() => {
              setActiveTab('devices');
              handleDeviceCheck(upcomingExams[0]);
            }}
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-laptop-code w-5 mr-3 text-slate-400"></i>
            Kiểm tra thiết bị
          </button>
          <button
            onClick={() =>
              alert('Cài đặt tài khoản & thông báo của thí sinh đã sẵn sàng.')
            }
            className="w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-xl text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-gear w-5 mr-3 text-slate-400"></i>
            Cài đặt
          </button>
        </nav>

        {/* Sidebar Footer User Area with Dropdown */}
        <div className="relative p-4 border-t border-slate-100 bg-slate-50/50" ref={sidebarMenuRef}>
          <div
            onClick={() => setShowSidebarUserDropdown(!showSidebarUserDropdown)}
            className="flex items-center space-x-3 cursor-pointer p-1.5 -m-1.5 rounded-xl hover:bg-white hover:shadow-xs transition-all select-none"
            title="Nhấp vào để mở menu Sign Out"
          >
            {/* Logo/Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center shrink-0 shadow-xs ring-2 ring-blue-100">
              {userInitial}
            </div>
            <div className="text-sm truncate flex-1">
              <p className="font-semibold text-slate-800 leading-none truncate">
                {currentUser?.fullName || 'Người dùng'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                {currentUser?.id || currentUser?.identifier || 'Tài khoản'}
              </p>
            </div>
            <i className="fa-solid fa-ellipsis-vertical text-slate-400 hover:text-slate-600 text-xs px-1"></i>
          </div>

          {/* Sidebar Sign Out Dropdown Popover */}
          {showSidebarUserDropdown && (
            <div className="absolute bottom-16 left-3 right-3 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">{currentUser?.fullName}</p>
                <p className="text-[11px] text-slate-400 font-mono">{currentUser?.email || currentUser?.id}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {currentUser?.role || 'STUDENT'}
                </span>
              </div>
              {onSwitchToLecturer && (
                <button
                  onClick={() => {
                    setShowSidebarUserDropdown(false);
                    onSwitchToLecturer();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-chalkboard-user text-indigo-600"></i>
                  <span>Cổng Giảng viên</span>
                </button>
              )}
              {onSwitchToAdmin && (
                <button
                  onClick={() => {
                    setShowSidebarUserDropdown(false);
                    onSwitchToAdmin();
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <i className="fa-solid fa-shield-halved text-amber-600"></i>
                  <span>Cổng Quản trị (Admin)</span>
                </button>
              )}
              <button
                onClick={() => {
                  setShowSidebarUserDropdown(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-right-from-bracket text-rose-500"></i>
                <span>Sign Out (Đăng xuất)</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar with User Logo & Name + SignOut Dropdown */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="relative w-80 md:w-96">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <i className="fa-solid fa-magnifying-glass text-sm"></i>
            </span>
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              placeholder="Tìm kiếm kỳ thi, môn học, tài liệu..."
              type="text"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden lg:flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-emerald-200/80 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Hệ thống: Sẵn sàng</span>
            </div>

            <button
              onClick={() => alert('Thông báo mới: Lịch thi ENG-106 bắt đầu lúc 08:15.')}
              className="relative text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1"
            >
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              <i className="fa-regular fa-bell text-lg"></i>
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* User Profile Pill with Logo & Name - Click opens Signout Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-3 p-1.5 pl-2.5 pr-3 rounded-full hover:bg-slate-100/90 border border-transparent hover:border-slate-200 transition-all cursor-pointer select-none group"
                title="Nhấp vào để xem tùy chọn hoặc Sign Out"
              >
                {/* User Name & Role info */}
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
                    {currentUser?.fullName || 'Thí sinh'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono leading-tight">
                    {currentUser?.id || 'SE180123'}
                  </p>
                </div>

                {/* User Logo / Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md ring-2 ring-white group-hover:ring-blue-200 transition-all">
                  {userInitial}
                </div>

                <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 group-hover:text-slate-600 transition-transform"></i>
              </button>

              {/* Signout Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-fade-in divide-y divide-slate-100">
                  <div className="px-4 py-2.5">
                    <p className="text-xs font-bold text-slate-800">{currentUser?.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser?.email || currentUser?.id}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      Vai trò: {currentUser?.role || 'STUDENT'}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        alert(`Mã định danh: ${currentUser?.id}\nĐơn vị: ${currentUser?.department || 'FPT University'}`);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <i className="fa-regular fa-id-badge text-slate-400 w-4"></i>
                      <span>Hồ sơ thí sinh</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        alert('Kiểm tra thiết bị thành công.');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-laptop text-slate-400 w-4"></i>
                      <span>Kiểm tra thiết bị</span>
                    </button>
                  </div>

                  {/* Sign Out Action Button */}
                  <div className="pt-1">
                    {onSwitchToLecturer && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onSwitchToLecturer();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-chalkboard-user text-indigo-600 w-4"></i>
                        <span>Cổng Giảng viên</span>
                      </button>
                    )}
                    {onSwitchToAdmin && (
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          onSwitchToAdmin();
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 flex items-center space-x-2 transition-colors cursor-pointer"
                      >
                        <i className="fa-solid fa-shield-halved text-amber-600 w-4"></i>
                        <span>Cổng Quản trị (Admin)</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors cursor-pointer"
                    >
                      <i className="fa-solid fa-right-from-bracket text-rose-500 w-4"></i>
                      <span>Sign Out (Đăng xuất)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-50/60">
          <div key={activeTab} className="animate-fade-in-up">
            {/* Greeting Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                  {activeTab === 'history' && 'Lịch sử bài thi'}
                  {activeTab === 'exams' && 'Kỳ thi của tôi'}
                  {activeTab === 'overview' && 'Tổng quan Khảo thí Thí sinh'}
                  {activeTab === 'devices' && 'Kiểm tra Thiết bị Khảo thí'}
                </h1>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {activeTab === 'history' && 'Toàn bộ bài thi bạn đã hoàn thành, bảng điểm Rubric và đơn phúc khảo.'}
                  {activeTab === 'exams' && 'Danh sách các ca thi vấn đáp AI đã được xếp lịch cho bạn.'}
                  {activeTab === 'overview' && `Chào mừng, ${currentUser?.fullName || 'Thí sinh'}! Theo dõi lịch thi và tiến độ khảo thí.`}
                  {activeTab === 'devices' && 'Kiểm tra Webcam 1080p, Microphone và Tai nghe trước giờ vào thi.'}
                </p>
              </div>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-semibold border border-blue-100 flex items-center shadow-2xs self-start md:self-auto transition-transform hover:scale-105">
                <i className="fa-regular fa-calendar-days mr-2"></i>
                Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>

            {/* OVERVIEW STATS (Chỉ hiển thị khi ở tab Tổng quan) */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs interactive-card">
                  <span className="text-xs text-slate-500 font-medium">Kỳ thi sắp diễn ra</span>
                  <p className="text-2xl font-extrabold text-blue-600 mt-1">{upcomingExams.length}</p>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                    Đã xếp ca thi
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs interactive-card">
                  <span className="text-xs text-slate-500 font-medium">Bài thi đã hoàn thành</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">{examHistory.length}</p>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                    Đã lưu trữ hệ thống
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs interactive-card">
                  <span className="text-xs text-slate-500 font-medium">Điểm trung bình (GPA)</span>
                  <p className="text-2xl font-extrabold text-indigo-600 mt-1">{gpa ? `${gpa} / 10` : '--'}</p>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                    {gpa ? `Xếp loại ${ratingOf(Number(gpa)).rating}` : 'Chưa có điểm chốt'}
                  </span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs interactive-card">
                  <span className="text-xs text-slate-500 font-medium">Trạng thái thiết bị</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">Sẵn sàng</p>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold inline-block mt-2">
                    Cam / Mic đạt chuẩn
                  </span>
                </div>
              </div>
            )}

            {/* UPCOMING EXAMS SECTION - CHỈ HIỂN THỊ KHI Ở TAB 'exams' HOẶC 'overview' */}
            {(activeTab === 'exams' || activeTab === 'overview') && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full mr-2.5 animate-pulse"></span>
                    Kỳ thi sắp diễn ra
                  </h2>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {upcomingExams.length} ca thi đang chờ
                  </span>
                </div>

                {/* Grid 2 Cards */}
                {(examsLoading || examsError || upcomingExams.length === 0) && (
                  <div className={`p-6 rounded-2xl border text-center text-sm font-semibold ${examsError ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                    {examsLoading ? 'Đang tải lịch thi từ máy chủ...' : examsError ? `Không tải được lịch thi: ${examsError}` : 'Bạn chưa được xếp ca thi nào.'}
                  </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {upcomingExams.map((exam) => (
                    <div
                      key={exam.id}
                      className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm interactive-card group p-6 flex flex-col justify-between relative overflow-hidden border-l-4 ${
                        exam.status === 'active' ? 'border-l-emerald-500' : 'border-l-amber-500'
                      }`}
                    >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        {exam.status === 'active' ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 rounded-full flex items-center border border-emerald-100">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-1.5"></span>
                            {exam.statusLabel}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                            {exam.statusLabel}
                          </span>
                        )}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            exam.status === 'active'
                              ? 'text-emerald-700 bg-emerald-50'
                              : 'text-amber-700 bg-amber-50'
                          }`}
                        >
                          {exam.deviceStatus}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-slate-800 text-base mb-1">
                        {exam.title}
                      </h3>
                      <p className="text-xs text-slate-500 mb-4 font-medium">
                        Mã môn: <span className="font-semibold">{exam.subjectCode}</span> • Hình thức:{' '}
                        <span className="text-blue-600 font-semibold">{exam.format}</span>
                      </p>

                      <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-3.5 rounded-xl mb-6 border border-slate-100">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Số câu hỏi:</span>
                          <span className="font-medium text-slate-700">{exam.questionsCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Khung giờ của bạn:</span>
                          <span className="font-bold text-blue-600">{exam.timeSlot}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Thời lượng:</span>
                          <span className="font-medium text-slate-700">{exam.duration}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Điểm đạt yêu cầu:</span>
                          <span className="font-medium text-slate-700">{exam.passingScore}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleDeviceCheck(exam)}
                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center cursor-pointer"
                      >
                        <i className="fa-solid fa-laptop mr-1.5 text-slate-500"></i> Kiểm tra thiết bị
                      </button>
                      {exam.canEnter ? (
                        <button
                          onClick={() => handleEnterRoom(exam)}
                          className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center shadow-sm shadow-blue-300 cursor-pointer active:scale-95"
                        >
                          <i className="fa-solid fa-right-to-bracket mr-1.5"></i> Vào phòng thi
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            alert(
                              'Ca thi chưa tới giờ bắt đầu hoặc bạn cần hoàn thành bước Kiểm tra thiết bị trước.'
                            )
                          }
                          className="flex-1 py-2.5 px-3 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl flex items-center justify-center cursor-not-allowed"
                          title="Yêu cầu kiểm tra thiết bị trước khi vào phòng thi"
                        >
                          <i className="fa-solid fa-lock mr-1.5"></i> Vào phòng thi
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* EXAM HISTORY SECTION - CHỈ HIỂN THỊ KHI Ở TAB 'history' */}
          {activeTab === 'history' && (
            <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Lịch sử bài thi
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Danh sách toàn bộ các bài thi bạn đã tham gia.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                      <i className="fa-solid fa-magnifying-glass text-xs"></i>
                    </span>
                    <input
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                      placeholder="Tìm tên môn thi..."
                      type="text"
                    />
                  </div>

                  <select
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl text-xs px-3 py-2 text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="all">Trạng thái: Tất cả</option>
                    <option value="graded">🟢 Đã chốt điểm</option>
                    <option value="pending">🟡 Chờ giảng viên duyệt</option>
                    <option value="dispute">🔵 Đang khiếu nại / Phúc khảo</option>
                  </select>
                </div>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Tên môn / Bài thi</th>
                      <th className="py-3 px-4">Trạng thái chấm</th>
                      <th className="py-3 px-4">Điểm số</th>
                      <th className="py-3 px-4">Xếp loại</th>
                      <th className="py-3 px-4">Thời gian làm</th>
                      <th className="py-3 px-4">Thời gian nộp</th>
                      <th className="py-3 px-4 text-right">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredHistory.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {row.title}
                          <span className="block text-xs font-normal text-slate-400 font-mono">
                            {row.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 text-xs font-bold rounded-full inline-block ${row.statusBadgeClass}`}
                          >
                            {row.statusText}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {row.score}{' '}
                          {row.percentage && (
                            <span className="text-xs font-medium text-emerald-600">
                              ({row.percentage})
                            </span>
                          )}
                        </td>
                        <td className={`py-3.5 px-4 font-bold ${row.ratingClass}`}>
                          {row.rating}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-xs">
                          {row.duration}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {row.submittedAt}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedExamDetails(row)}
                            className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center justify-end ml-auto space-x-1 cursor-pointer"
                          >
                            <span>Xem chi tiết</span>
                            <i className="fa-solid fa-arrow-right text-[10px]"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <div>Hiển thị {filteredHistory.length} trong tổng số {examHistory.length} bài thi</div>
                <div className="flex items-center space-x-1">
                  <button className="px-3 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-400 cursor-not-allowed">
                    Trước
                  </button>
                  <button className="px-3 py-1.5 border border-blue-500 rounded-lg bg-blue-50 text-blue-600 font-bold">
                    1
                  </button>
                  <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    Sau
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* DEVICE DIAGNOSTICS SECTION (Khi ở tab Kiểm tra thiết bị) */}
          {activeTab === 'devices' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-800 flex items-center">
                <i className="fa-solid fa-laptop-code text-blue-600 mr-2.5"></i>
                Chẩn đoán Thiết bị &amp; Môi trường Phòng thi
              </h2>
              <p className="text-xs text-slate-500">
                Hệ thống AIVES yêu cầu kiểm tra toàn diện Webcam, Microphone và Tai nghe trước khi bắt đầu ca thi vấn đáp trực tuyến.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">1. Webcam HD</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Sẵn sàng</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Camera tích hợp hoặc rời đạt chuẩn 1080p, góc quay rõ khuôn mặt.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">2. Microphone</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Sẵn sàng</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Mic thu âm rõ ràng, có bước ghi âm và nghe lại giọng nói tự kiểm tra.</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">3. Loa / Tai nghe</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Sẵn sàng</span>
                  </div>
                  <p className="text-[11px] text-slate-500">Âm thanh nghe rõ câu hỏi từ AI Giám khảo, có nút chọn thiết bị ra.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeviceCheck(upcomingExams[0])}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm shadow-blue-500/20"
                >
                  <i className="fa-solid fa-play text-xs"></i>
                  <span>Bắt đầu Kiểm tra Thiết bị ngay</span>
                </button>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Appeal Toast Notification */}
      {appealToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-2.5 border border-slate-700 backdrop-blur-md animate-fade-in">
          <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
          <span>{appealToast}</span>
        </div>
      )}

      {/* RICH STUDENT EXAM REPORT & RUBRIC DETAILS MODAL (Stitch Design) */}
      {selectedExamDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">assessment</span>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Báo cáo Kết quả Bài thi &amp; Bảng điểm Rubric
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedExamDetails.title} • {selectedExamDetails.code}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExamDetails(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto text-xs pr-1">
              {/* Score Banner */}
              <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-100 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Điểm tổng kết</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black font-mono text-blue-700">{selectedExamDetails.score}</span>
                    <span className="text-xs font-bold text-slate-400">/ 10.0</span>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ml-2 ${selectedExamDetails.ratingClass}`}>
                      {selectedExamDetails.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[11px] text-slate-500 block">Trạng thái: <strong>{selectedExamDetails.statusText}</strong></span>
                  <span className="text-[11px] text-slate-400 block font-mono">Nộp lúc: {selectedExamDetails.submittedAt}</span>
                </div>
              </div>

              {/* Rubric Breakdown Cards */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-indigo-600">tune</span>
                  Phân rã tiêu chí chấm điểm theo Rubric (Rubric Criteria)
                </h4>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">1. Kiến thức cốt lõi &amp; Độ chính xác (Trọng số 40%)</span>
                    <span className="font-mono font-bold text-blue-700">3.8 / 4.0đ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Nắm chắc định nghĩa nguyên lý phân trang, bảng trang và hiện tượng phân mảnh.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">2. Lập luận phân tích &amp; Giải quyết vấn đề (Trọng số 35%)</span>
                    <span className="font-mono font-bold text-blue-700">3.2 / 3.5đ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Phân tích đúng các giải pháp giảm kích thước trang và sự đánh đổi overhead bộ nhớ.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">3. Phản xạ vấn đáp &amp; Giao tiếp tự tin (Trọng số 25%)</span>
                    <span className="font-mono font-bold text-blue-700">2.5 / 2.5đ</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Độ trễ phản hồi nhanh (&lt; 2.0s), ngữ điệu tự tin, phát âm tiếng Anh học thuật chuẩn.
                  </p>
                </div>
              </div>

              {/* Lecturer Official Feedback */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">rate_review</span>
                  Nhận xét chính thức từ Giảng viên &amp; AI:
                </span>
                <p className="text-slate-700 leading-relaxed text-xs">
                  {selectedExamDetails.feedback}
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowAppealModal(true);
                }}
                className="px-3.5 py-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-sm">help_outline</span>
                <span>Gửi yêu cầu Phúc khảo / Phản hồi</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => alert('Đang tạo và tải bản ghi âm & transcript đối thoại AI định dạng PDF...')}
                  className="px-3.5 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl cursor-pointer"
                >
                  Tải Transcript AI
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExamDetails(null)}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GRADE APPEAL MODAL */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">help</span>
                Yêu cầu Phúc khảo &amp; Phản hồi Điểm thi
              </h3>
              <button
                type="button"
                onClick={() => setShowAppealModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAppealModal(false);
                setAppealToast('Đã gửi đơn phúc khảo đến Giảng viên phụ trách môn thi!');
                setTimeout(() => setAppealToast(''), 4000);
                setAppealReason('');
              }}
              className="py-4 space-y-3.5 text-xs"
            >
              <div>
                <span className="text-slate-500 font-medium">Môn thi:</span>
                <p className="font-bold text-slate-800 mt-0.5">{selectedExamDetails?.title}</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung phản hồi / Căn cứ xin phúc khảo *
                </label>
                <textarea
                  required
                  rows="4"
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  placeholder="Ví dụ: Em xin phép đề nghị xem lại phần trả lời ở Câu 2 về cơ chế TLB Miss, em có nêu rõ thời gian truy cập hiệu dụng EAT ở phút 06:28 nhưng AI ghi nhận thiếu..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900">
                Lưu ý: Giảng viên sẽ nghe lại toàn bộ bản ghi video &amp; transcript đối thoại của bạn để đưa ra quyết định phúc khảo chính thức.
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-amber-500/20"
                >
                  Gửi đơn Phúc khảo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Device Check Modal Wizard */}
      <DeviceCheckModal
        isOpen={showDeviceModal}
        examTitle={deviceCheckTargetExam?.title || 'Kỳ thi vấn đáp AI'}
        onClose={() => setShowDeviceModal(false)}
        onComplete={handleDeviceCheckComplete}
      />

      {/* AI Viva Examination Room Modal */}
      <VivaRoomModal
        isOpen={Boolean(activeVivaRoomExam)}
        exam={activeVivaRoomExam}
        currentUser={currentUser}
        onClose={() => setActiveVivaRoomExam(null)}
      />
    </div>
  );
}
