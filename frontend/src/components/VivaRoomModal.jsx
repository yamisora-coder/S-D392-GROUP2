import React, { useState, useEffect, useRef } from 'react';

export default function VivaRoomModal({ isOpen, onClose, exam, currentUser }) {
  const [timer, setTimer] = useState(100); // 1:40
  const [isAnswering, setIsAnswering] = useState(true);
  const [audioStream, setAudioStream] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showExitWarningModal, setShowExitWarningModal] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);

  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const questions = [
    {
      round: 'CÂU 1/3 • VÒNG HỎI SÂU (ADAPTIVE FOLLOW-UP)',
      text: '“Bạn vừa nhắc đến cơ chế Phân trang (Paging), vậy hiện tượng Phân mảnh nội vi (Internal Fragmentation) xảy ra như thế nào trong cơ chế này?”',
      transcript: '“Thưa thầy cô, phân mảnh nội vi xảy ra khi kích thước tiến trình không chia hết cho kích thước của khung trang (page frame)... do đó trang cuối cùng được cấp phát chỉ sử dụng một phần dữ liệu, để thừa khoảng trống không dùng đến...”',
    },
    {
      round: 'CÂU 2/3 • CÂU HỎI THỰC HÀNH HỆ THỐNG',
      text: '“Làm thế nào để hệ điều hành giải quyết tranh chấp (Race Condition) khi nhiều tiến trình cùng truy cập vào Vùng găng (Critical Section)?”',
      transcript: '“Dạ, để giải quyết Race condition, hệ điều hành áp dụng các cơ chế đồng bộ như Mutex, Semaphore hoặc các chỉ thị phần cứng nguyên tử như Test-and-Set...”',
    },
    {
      round: 'CÂU 3/3 • VẤN ĐÁP NÂNG CAO & TỔNG KẾT',
      text: '“So sánh cơ chế lập lịch CPU Round Robin (RR) và Shortest Job First (SJF) trong điều kiện tải cao?”',
      transcript: '“Dạ với Round Robin thì đảm bảo tính công bằng và thời gian đáp ứng tốt cho các ứng dụng tương tác, còn SJF tối ưu thời gian chờ trung bình nhưng dễ dẫn đến đói tài nguyên (Starvation)...”',
    },
  ];

  // Browser reload/leave confirmation prevention
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isOpen && !examSubmitted) {
        e.preventDefault();
        e.returnValue = 'Bạn đang trong ca thi vấn đáp AI. Nếu thoát bây giờ, toàn bộ kết quả bài thi sẽ bị hủy bỏ!';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, examSubmitted]);

  useEffect(() => {
    if (isOpen) {
      setTimer(100);
      setIsAnswering(true);
      setShowExitWarningModal(false);
      setExamSubmitted(false);
      startWebcam();
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            return 100;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopWebcam();
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      stopWebcam();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setAudioStream(stream);
    } catch (e) {
      console.warn('Webcam not accessible in room:', e);
    }
  };

  const stopWebcam = () => {
    if (audioStream) {
      audioStream.getTracks().forEach((t) => t.stop());
      setAudioStream(null);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleExitClick = () => {
    setShowExitWarningModal(true);
  };

  const handleConfirmExit = () => {
    setShowExitWarningModal(false);
    stopWebcam();
    onClose();
  };

  const handleSubmitExam = () => {
    setExamSubmitted(true);
    alert('Chúc mừng bạn đã hoàn thành bài thi vấn đáp AI!\nBài thi đã được ghi nhận và gửi đến Hội đồng Khảo thí.');
    stopWebcam();
    onClose();
  };

  if (!isOpen) return null;

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-md animate-fade-in overflow-y-auto">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        {/* Left: Exam Info */}
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {exam?.subjectCode || 'CS201'} • {exam?.title || 'Phòng thi vấn đáp AI'}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">{currentUser?.fullName || 'Trần Hoàng Phúc'}</span>
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-mono">
              {currentUser?.id || 'SE180123'}
            </span>
          </div>
        </div>

        {/* Center: Timer */}
        <div className="bg-amber-50 border border-amber-200 px-4 py-1.5 rounded-xl flex items-center gap-3 shadow-xs">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-amber-700 text-base">timer</span>
            <span className="text-[11px] font-bold text-amber-900 uppercase">Thời gian trả lời:</span>
          </div>
          <span className="font-mono text-lg font-bold text-amber-700 border-l border-amber-200 pl-2">
            {formatTimer(timer)}
          </span>
        </div>

        {/* Right: Exit / Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Đường truyền ổn định</span>
          </div>
          <button
            type="button"
            onClick={handleExitClick}
            className="border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:shadow-xs active:scale-95"
            title="Thoát ca thi"
          >
            <span className="material-symbols-outlined text-base text-rose-600">logout</span>
            <span>Thoát phòng thi</span>
          </button>
        </div>
      </header>

      {/* Main Examination Stage */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 md:p-8 flex flex-col gap-6">
          {/* Top Stage Row: AI Examiner Info & Student Live Camera Stream */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 shadow-md text-white shrink-0">
                <span className="material-symbols-outlined text-2xl animate-pulse">psychology</span>
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Giám khảo AI (AIVES Viva Examiner)</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    v2.4 Adaptive
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đang lắng nghe thí sinh
                  </span>
                </div>
              </div>
            </div>

            {/* Live Proctoring Webcam */}
            <div className="w-52 aspect-video rounded-2xl overflow-hidden border border-slate-300 shadow-sm relative bg-slate-950 shrink-0">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute top-2 left-2 bg-slate-900/80 text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                <span>REC • Trực tiếp Viva</span>
              </div>
              <div className="absolute bottom-2 left-2 bg-slate-900/80 text-emerald-400 text-[9px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[11px]">verified</span>
                <span>Hình ảnh rõ nét • Đã kết nối</span>
              </div>
            </div>
          </div>

          {/* Question Section */}
          <div className="flex flex-col items-center text-center px-4 pt-1">
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full w-fit mx-auto uppercase tracking-wide">
              {currentQ.round}
            </span>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 text-center max-w-2xl mx-auto leading-relaxed pt-3">
              {currentQ.text}
            </h2>

            {/* Dynamic Soundwave Visualizer */}
            <div className="flex items-center justify-center gap-1.5 h-10 my-4">
              <span className="w-1.5 rounded-full bg-blue-600 h-3 animate-pulse" style={{ animationDuration: '800ms' }}></span>
              <span className="w-1.5 rounded-full bg-blue-600 h-5 animate-pulse" style={{ animationDuration: '650ms' }}></span>
              <span className="w-1.5 rounded-full bg-blue-600 h-7 animate-pulse" style={{ animationDuration: '900ms' }}></span>
              <span className="w-1.5 rounded-full bg-blue-600 h-6 animate-pulse" style={{ animationDuration: '720ms' }}></span>
              <span className="w-1.5 rounded-full bg-blue-600 h-8 animate-pulse" style={{ animationDuration: '500ms' }}></span>
              <span className="w-1.5 rounded-full bg-blue-600 h-6 animate-pulse" style={{ animationDuration: '750ms' }}></span>
              <span className="w-1.5 rounded-full bg-blue-600 h-7 animate-pulse" style={{ animationDuration: '600ms' }}></span>
              <span className="w-1.5 rounded-full bg-blue-600 h-5 animate-pulse" style={{ animationDuration: '850ms' }}></span>
              <span className="w-1.5 rounded-full bg-blue-600 h-4 animate-pulse" style={{ animationDuration: '700ms' }}></span>
            </div>

            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Micro đang thu âm trả lời</span>
              </div>
            </div>
          </div>

          {/* Realtime STT Transcript Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-w-3xl mx-auto w-full text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-600">record_voice_over</span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Bản ghi giọng nói thời gian thực (Speech-to-Text)
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Độ tin cậy: 98.6%
              </span>
            </div>
            <p className="text-slate-800 text-sm md:text-base leading-relaxed">
              {currentQ.transcript}
              <span className="inline-block w-0.5 h-4 ml-0.5 bg-blue-600 align-middle animate-pulse"></span>
            </p>
          </div>

          {/* Bottom Step Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-semibold">
              Câu hỏi <span className="text-blue-600 font-bold">{currentQuestionIndex + 1}</span> trên 3
            </div>
            <div className="flex gap-2">
              {currentQuestionIndex < 2 ? (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentQuestionIndex((prev) => prev + 1);
                    setTimer(100);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span>Chuyển câu tiếp theo</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitExam}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <span className="material-symbols-outlined text-base">check</span>
                  <span>Nộp bài &amp; Kết thúc</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Notification Modal when Exit Clicked */}
      {showExitWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 font-bold shadow-xs">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900 mb-2">
              Cảnh báo: Bạn có chắc chắn muốn rời phòng thi?
            </h3>

            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 text-left mb-5 space-y-1.5 leading-relaxed">
              <p className="font-bold flex items-center gap-1.5 text-rose-900">
                <span className="material-symbols-outlined text-base">error</span>
                <span>Hủy bỏ kết quả bài thi</span>
              </p>
              <p>
                Nếu bạn rời khỏi phòng thi lúc này, <strong>toàn bộ kết quả câu trả lời của bạn sẽ bị hủy bỏ</strong> và hệ thống sẽ ghi nhận ca thi chưa hoàn thành hoặc bị gián đoạn.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowExitWarningModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tiếp tục làm bài thi
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-600/25 cursor-pointer"
              >
                Xác nhận thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
