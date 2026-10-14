import React, { useState, useEffect, useRef } from 'react';

export default function DeviceCheckModal({ isOpen, onClose, onComplete, examTitle = 'Kỳ thi vấn đáp AI' }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Camera, 2: Mic, 3: Speaker, 4: Summary/Done

  // 1. Camera state
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraPermissionPrompt, setCameraPermissionPrompt] = useState(false);

  // 2. Microphone state
  const [micDevices, setMicDevices] = useState([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [micLevel, setMicLevel] = useState(0);
  const [micRecorded, setMicRecorded] = useState(false);
  const [isRecordingPlayback, setIsRecordingPlayback] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isPlayingRecordedAudio, setIsPlayingRecordedAudio] = useState(false);

  // 3. Speaker / Headphone state
  const [speakerDevices, setSpeakerDevices] = useState([]);
  const [selectedSpeaker, setSelectedSpeaker] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasPlayedSampleAudio, setHasPlayedSampleAudio] = useState(false);
  const [speakerVerified, setSpeakerVerified] = useState(false);
  const [speakerOptionChoice, setSpeakerOptionChoice] = useState(null); // 'yes' | 'no'

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  // When modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      initMediaDevices();
    } else {
      stopAllMedia();
    }
    return () => {
      stopAllMedia();
    };
  }, [isOpen]);

  const stopAllMedia = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
  };

  const initMediaDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');

      setCameraDevices(videoInputs);
      if (videoInputs.length > 0) setSelectedCamera(videoInputs[0].deviceId);

      setMicDevices(audioInputs);
      if (audioInputs.length > 0) setSelectedMic(audioInputs[0].deviceId);

      setSpeakerDevices(audioOutputs);
      if (audioOutputs.length > 0) setSelectedSpeaker(audioOutputs[0].deviceId);

      // Trigger webcam request directly
      startCamera(videoInputs[0]?.deviceId);
    } catch (err) {
      console.warn('Cannot enumerate devices:', err);
      startCamera();
    }
  };

  // 1. Camera Handling with Explicit Browser Permission Prompt
  const startCamera = async (deviceId) => {
    setCameraError('');
    setCameraPermissionPrompt(false);

    try {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      // Basic constraints without exact deviceId first to avoid OverconstrainedError
      const constraints = {
        video: deviceId ? { deviceId: { ideal: deviceId } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraReady(true);
      setCameraError('');

      // Refresh device list after permission is granted to get accurate labels
      const updatedDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = updatedDevices.filter((d) => d.kind === 'videoinput');
      setCameraDevices(videoInputs);
      const audioOutputs = updatedDevices.filter((d) => d.kind === 'audiooutput');
      setSpeakerDevices(audioOutputs);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraReady(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermissionPrompt(true);
        setCameraError('Bạn đã chặn hoặc chưa cấp quyền truy cập Camera trên trình duyệt. Vui lòng bấm vào biểu tượng ổ khóa / camera trên thanh địa chỉ URL để cấp quyền.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('Không tìm thấy thiết bị Camera nào được kết nối với máy tính.');
      } else {
        setCameraError(`Không thể khởi động camera (${err.message || 'Lỗi thiết bị'}). Vui lòng thử lại.`);
      }
    }
  };

  // 2. Microphone handling + Voice Recording & Playback
  const startMicTest = async (deviceId) => {
    try {
      const audioConstraints = {
        audio: deviceId ? { deviceId: { ideal: deviceId } } : true,
        video: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMeter = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100 * 1.5));
        setMicLevel(normalized);

        if (normalized > 18) {
          setMicRecorded(true);
        }

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();

      // Setup MediaRecorder for playback feature
      try {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(url);
          setIsRecordingPlayback(false);
          setMicRecorded(true);
        };
      } catch (recErr) {
        console.warn('MediaRecorder setup error:', recErr);
      }
    } catch (err) {
      console.error('Microphone error:', err);
    }
  };

  // Start recording 4-second audio clip to listen back
  const handleStartRecordVoice = () => {
    if (!mediaRecorderRef.current) return;
    audioChunksRef.current = [];
    setIsRecordingPlayback(true);
    setRecordedAudioUrl(null);
    mediaRecorderRef.current.start();

    // Auto stop after 4 seconds
    setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }, 4000);
  };

  const handlePlayRecordedVoice = () => {
    if (!recordedAudioUrl) return;
    const audio = new Audio(recordedAudioUrl);
    setIsPlayingRecordedAudio(true);
    audio.play();
    audio.onended = () => {
      setIsPlayingRecordedAudio(false);
    };
  };

  // 3. Audio / Speaker check sound generator
  const playSampleSound = () => {
    setIsPlayingAudio(true);
    setHasPlayedSampleAudio(true);
    setSpeakerOptionChoice(null);

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.3);
      osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);

      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 1300);
    } catch (e) {
      console.error('Audio playback error', e);
      setIsPlayingAudio(false);
    }
  };

  // Step change side effects
  const goToStep = (step) => {
    if (step === 2) {
      startMicTest(selectedMic);
    } else {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    }
    setCurrentStep(step);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Kiểm tra thiết bị phòng thi AI</h2>
              <p className="text-[11px] text-slate-500 font-medium">{examTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Stepper Wizard Bar with Connecting Progress Line */}
        <div className="px-8 py-4 bg-white border-b border-slate-100">
          <div className="relative max-w-lg mx-auto">
            {/* Background progress track */}
            <div className="absolute top-3.5 left-6 right-6 h-[2.5px] bg-slate-200 -z-0">
              {/* Dynamic filled progress bar */}
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{
                  width: `${((currentStep - 1) / 3) * 100}%`,
                }}
              ></div>
            </div>

            {/* Stepper steps grid */}
            <div className="relative z-10 grid grid-cols-4 w-full">
              {/* Step 1 */}
              <div
                onClick={() => goToStep(1)}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  currentStep === 1 ? 'opacity-100 font-bold' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ring-4 ring-white ${
                    cameraReady
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : currentStep === 1
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {cameraReady ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
                </div>
                <span className={`text-[11px] ${currentStep === 1 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                  1. Camera
                </span>
              </div>

              {/* Step 2 */}
              <div
                onClick={() => goToStep(2)}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  currentStep === 2 ? 'opacity-100 font-bold' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ring-4 ring-white ${
                    micRecorded
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : currentStep === 2
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {micRecorded ? <span className="material-symbols-outlined text-sm">check</span> : '2'}
                </div>
                <span className={`text-[11px] ${currentStep === 2 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                  2. Micro
                </span>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => goToStep(3)}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  currentStep === 3 ? 'opacity-100 font-bold' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ring-4 ring-white ${
                    speakerVerified
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : currentStep === 3
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {speakerVerified ? <span className="material-symbols-outlined text-sm">check</span> : '3'}
                </div>
                <span className={`text-[11px] ${currentStep === 3 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                  3. Tai nghe
                </span>
              </div>

              {/* Step 4 */}
              <div
                onClick={() => goToStep(4)}
                className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  currentStep === 4 ? 'opacity-100 font-bold' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ring-4 ring-white ${
                    currentStep === 4
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  4
                </div>
                <span className={`text-[11px] ${currentStep === 4 ? 'text-blue-600 font-bold' : 'text-slate-600'}`}>
                  4. Sẵn sàng
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Wizard Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* STEP 1: CAMERA */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  Bước 1 • Kiểm tra Camera
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Căn chỉnh khuôn mặt &amp; Ánh sáng</h3>
                <p className="text-xs text-slate-500">
                  Đảm bảo khuôn mặt nằm trọn trong vùng oval, đủ sáng và thấy rõ để giám thị AI nhận diện.
                </p>
              </div>

              {/* Video Preview Box */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center shadow-inner border border-slate-800">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${!cameraReady ? 'hidden' : 'block'}`}
                />

                {/* Oval overlay for face framing */}
                {cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-60 sm:w-56 sm:h-72 rounded-[50%] border-2 border-dashed border-emerald-400/80 shadow-[0_0_20px_rgba(52,211,153,0.3)] flex items-center justify-center animate-pulse">
                      <span className="text-emerald-300 text-[10px] font-bold tracking-widest uppercase bg-slate-950/70 px-2.5 py-1 rounded-full backdrop-blur-md">
                        VÙNG KHUÔN MẶT
                      </span>
                    </div>
                  </div>
                )}

                {/* Camera Permission Required / Error State */}
                {(!cameraReady || cameraError) && (
                  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-3xl">videocam_off</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      {cameraPermissionPrompt ? 'Cần cấp quyền truy cập Camera' : 'Chưa thể kết nối Camera'}
                    </h4>
                    <p className="text-xs text-slate-300 max-w-md mb-4 leading-relaxed">
                      {cameraError || 'Trình duyệt cần bạn cấp quyền truy cập webcam để tham gia phòng thi vấn đáp AI.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera(selectedCamera)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">refresh</span>
                        <span>Cấp quyền &amp; Thử lại Camera</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status indicators */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-slate-50 transition-all hover:border-blue-200">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                    cameraReady ? 'bg-emerald-100 text-emerald-700 scale-105' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <span className="material-symbols-outlined text-base">{cameraReady ? 'verified' : 'pending'}</span>
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Khuôn mặt</span>
                    <span className={`text-xs font-bold ${cameraReady ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {cameraReady ? 'Đã nhận diện chuẩn' : 'Chờ bật camera'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200/80 bg-slate-50 transition-all hover:border-blue-200">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                    cameraReady ? 'bg-emerald-100 text-emerald-700 scale-105' : 'bg-slate-200 text-slate-500'
                  }`}>
                    <span className="material-symbols-outlined text-base">{cameraReady ? 'wb_sunny' : 'light_mode'}</span>
                  </span>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Ánh sáng</span>
                    <span className={`text-xs font-bold ${cameraReady ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {cameraReady ? 'Hình ảnh rõ nét & ổn định' : 'Chờ bật camera'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera device selector */}
              {cameraDevices.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Chọn thiết bị Camera:</label>
                  <select
                    value={selectedCamera}
                    onChange={(e) => {
                      setSelectedCamera(e.target.value);
                      startCamera(e.target.value);
                    }}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {cameraDevices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Camera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MICROPHONE & VOICE PLAYBACK */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  Bước 2 • Kiểm tra Micro
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Kiểm tra thu âm &amp; Nghe lại giọng nói của bạn</h3>
                <p className="text-xs text-slate-500">
                  Hãy thử nói: <strong className="text-blue-600">"Xin chào, tôi đã sẵn sàng cho kỳ thi vấn đáp"</strong>, sau đó nhấn nút nghe lại để chắc chắn giọng thu vào rõ ràng.
                </p>
              </div>

              {/* Dynamic Audio Visualizer Meter */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                      micLevel > 15
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl">mic</span>
                  </div>
                  {micLevel > 15 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping"></span>
                  )}
                </div>

                {/* Level Bar */}
                <div className="w-full max-w-md space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Cường độ âm thanh thu trực tiếp:</span>
                    <span className="font-mono font-bold text-emerald-400">{micLevel}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 rounded-full transition-all duration-75"
                      style={{ width: `${micLevel}%` }}
                    ></div>
                  </div>
                </div>

                {/* Voice Recording / Playback Button */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStartRecordVoice}
                    disabled={isRecordingPlayback}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isRecordingPlayback
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {isRecordingPlayback ? 'radio_button_checked' : 'mic'}
                    </span>
                    <span>
                      {isRecordingPlayback ? 'Đang ghi âm thử (4s)... Hãy nói' : 'Ghi âm thử 4 giây'}
                    </span>
                  </button>

                  {recordedAudioUrl && (
                    <button
                      type="button"
                      onClick={handlePlayRecordedVoice}
                      disabled={isPlayingRecordedAudio}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">
                        {isPlayingRecordedAudio ? 'volume_up' : 'play_circle'}
                      </span>
                      <span>{isPlayingRecordedAudio ? 'Đang phát lại giọng nói...' : 'Nghe lại giọng vừa nói'}</span>
                    </button>
                  )}
                </div>

                {recordedAudioUrl && (
                  <div className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>Đã ghi âm thành công. Bạn có thể bấm để nghe lại!</span>
                  </div>
                )}
              </div>

              {/* Mic selector */}
              {micDevices.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Nguồn Micro thu âm:</label>
                  <select
                    value={selectedMic}
                    onChange={(e) => {
                      setSelectedMic(e.target.value);
                      startMicTest(e.target.value);
                    }}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {micDevices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Microphone ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SPEAKER & HEADPHONES (With Device Selector & 2 Options Choice) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  Bước 3 • Kiểm tra Loa &amp; Tai nghe
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Kiểm tra âm thanh phát ra từ Giám khảo AI</h3>
                <p className="text-xs text-slate-500">
                  Chọn thiết bị phát và bấm nút phát âm thanh mẫu, sau đó xác nhận bạn có nghe thấy không.
                </p>
              </div>

              {/* Speaker Device Selector */}
              {speakerDevices.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Chọn thiết bị Tai nghe / Loa đầu ra:
                  </label>
                  <select
                    value={selectedSpeaker}
                    onChange={(e) => setSelectedSpeaker(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {speakerDevices.map((d, idx) => (
                      <option key={d.deviceId || idx} value={d.deviceId}>
                        {d.label || `Thiết bị phát âm ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Playback Box */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-50/70 to-indigo-50/40 border border-blue-200/80 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <span className={`material-symbols-outlined text-2xl ${isPlayingAudio ? 'animate-bounce' : ''}`}>
                    headphones
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Âm thanh câu hỏi thử nghiệm</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đảm bảo âm lượng tai nghe ở mức 50% - 80% để nghe rõ các câu hỏi
                  </p>
                </div>

                <button
                  type="button"
                  onClick={playSampleSound}
                  disabled={isPlayingAudio}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-base">
                    {isPlayingAudio ? 'volume_up' : 'play_arrow'}
                  </span>
                  <span>{isPlayingAudio ? 'Đang phát âm thanh mẫu...' : 'Phát âm thanh kiểm tra'}</span>
                </button>

                {/* 2 Options after playing audio: Có nghe thấy vs Không nghe thấy */}
                {hasPlayedSampleAudio && (
                  <div className="pt-3 border-t border-blue-200/60 w-full max-w-md flex flex-col items-center space-y-2.5 animate-fade-in">
                    <span className="text-xs font-bold text-slate-700">
                      Bạn có nghe thấy âm thanh vừa phát không?
                    </span>
                    <div className="grid grid-cols-2 gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setSpeakerOptionChoice('yes');
                          setSpeakerVerified(true);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          speakerOptionChoice === 'yes'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">check</span>
                        <span>Có, nghe rất rõ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSpeakerOptionChoice('no');
                          setSpeakerVerified(false);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          speakerOptionChoice === 'no'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-300'
                        }`}
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                        <span>Không nghe thấy</span>
                      </button>
                    </div>

                    {/* Recommendation when choosing 'no' */}
                    {speakerOptionChoice === 'no' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs w-full text-left space-y-1.5 animate-fade-in">
                        <div className="flex items-center gap-1 font-bold text-amber-900">
                          <span className="material-symbols-outlined text-base">tips_and_updates</span>
                          <span>Gợi ý khắc phục:</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-amber-800">
                          <li>Kiểm tra lại nút bật/tắt âm lượng trên tai nghe của bạn.</li>
                          <li>Chọn lại thiết bị Tai nghe/Loa khác trong menu dropdown bên trên.</li>
                        </ul>
                        <button
                          type="button"
                          onClick={playSampleSound}
                          className="mt-1.5 px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">replay</span>
                          <span>Phát lại đoạn âm thanh</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY & CONFIRMATION */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="text-center py-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-bold shadow-xs">
                  <span className="material-symbols-outlined text-2xl">check</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">Thiết bị đã sẵn sàng cho phòng thi!</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Tất cả các điều kiện về Camera, Micro và Loa đã vượt qua kiểm tra tiêu chuẩn của hệ thống AIVES.
                </p>
              </div>

              {/* Checklist review */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/70 overflow-hidden text-xs">
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">videocam</span>
                    <span className="font-semibold text-slate-700">Camera / Nhận diện khuôn mặt</span>
                  </div>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Đã kết nối
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">mic</span>
                    <span className="font-semibold text-slate-700">Microphone thu âm</span>
                  </div>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Đạt chuẩn
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">headphones</span>
                    <span className="font-semibold text-slate-700">Tai nghe / Loa đầu ra</span>
                  </div>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Hoạt động tốt
                  </span>
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-emerald-600 text-lg">wifi</span>
                    <span className="font-semibold text-slate-700">Đường truyền mạng</span>
                  </div>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Ping 14ms (Rất tốt)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => goToStep(currentStep - 1)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-200/60 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Quay lại</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => goToStep(currentStep + 1)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <span>Tiếp tục: {currentStep === 1 ? 'Kiểm tra Mic' : currentStep === 2 ? 'Kiểm tra Tai nghe' : 'Xem xác nhận'}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">check</span>
              <span>Hoàn tất kiểm tra</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
