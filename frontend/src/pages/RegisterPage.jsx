import React, { useState } from 'react';
import { mockAuthService } from '../services/auth.js';

export default function RegisterPage({ onNavigate, onRegisterSuccess }) {
  const [fullName, setFullName] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('Khoa Công nghệ Thông tin');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Active focus trackers
  const [focusedField, setFocusedField] = useState(null);

  // Password rules evaluation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumOrSpec = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  const isMatch = password.length > 0 && password === confirmPassword;

  // Strength score
  let strengthScore = 0;
  if (password.length > 0) strengthScore++;
  if (hasMinLength) strengthScore++;
  if (hasUpper) strengthScore++;
  if (hasNumOrSpec) strengthScore++;

  const getStrengthLabel = () => {
    if (password.length === 0) return { text: 'Chưa nhập', color: 'text-slate-400' };
    if (strengthScore <= 2) return { text: 'Yếu', color: 'text-rose-600' };
    if (strengthScore === 3) return { text: 'Trung bình', color: 'text-amber-600' };
    return { text: 'Mạnh & Đạt chuẩn', color: 'text-emerald-600' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !institutionId.trim() || !email.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ các trường thông tin bắt buộc (*)');
      return;
    }
    if (!hasMinLength || !hasUpper || !hasNumOrSpec) {
      setErrorMsg('Mật khẩu chưa đáp ứng tiêu chuẩn an toàn!');
      return;
    }
    if (!isMatch) {
      setErrorMsg('Mật khẩu xác nhận không khớp!');
      return;
    }
    if (!termsConsent) {
      setErrorMsg('Vui lòng đồng ý với Quy chế Khảo thí và Điều khoản Bảo mật!');
      return;
    }

    setLoading(true);

    try {
      // Lưu trực tiếp vào Mock Storage LocalStorage
      const res = await mockAuthService.register({
        id: institutionId.trim().toUpperCase(),
        fullName: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
        role: 'STUDENT',
        department,
        phone: phone.trim()
      });

      if (res.success) {
        onRegisterSuccess(res.user);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Lỗi khi đăng ký tài khoản!');
    } finally {
      setLoading(false);
    }
  };

  const strengthInfo = getStrengthLabel();

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 py-8 overflow-hidden bg-slate-900/5">
      {/* Background Animated Blobs */}
      <div className="absolute top-1/6 right-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none animate-blob"></div>
      <div className="absolute bottom-1/6 left-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl pointer-events-none animate-blob [animation-delay:4s]"></div>

      <div className="relative z-10 max-w-2xl w-full mx-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-blue-900/10 border border-white/80 overflow-hidden animate-fade-in-up transition-all duration-300">
        {/* Top Header Card */}
        <div className="p-8 pb-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/25 animate-float">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg text-slate-900 leading-tight tracking-tight">
                  AIVES
                </span>
                <span className="text-xs text-slate-500 font-medium">Viva Exam &amp; Assessment Portal</span>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">school</span>
              <span>Dành cho Thí sinh</span>
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Tạo tài khoản AIVES
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Đăng ký tài khoản sinh viên để tham gia phòng thi vấn đáp trực tuyến.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-xs">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Row 1: Full name & Student ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Họ và tên thí sinh <span className="text-rose-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all duration-200 ${
                    focusedField === 'fullName'
                      ? 'border-blue-600 bg-white ring-4 ring-blue-600/10 shadow-xs'
                      : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    badge
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onFocus={() => setFocusedField('fullName')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Trần Hoàng Phúc"
                    className="w-full h-11 pl-10 pr-3.5 bg-transparent text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mã số sinh viên (MSSV) <span className="text-rose-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all duration-200 ${
                    focusedField === 'institutionId'
                      ? 'border-blue-600 bg-white ring-4 ring-blue-600/10 shadow-xs'
                      : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    pin
                  </span>
                  <input
                    type="text"
                    required
                    value={institutionId}
                    onFocus={() => setFocusedField('institutionId')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setInstitutionId(e.target.value)}
                    placeholder="e.g. SE180123"
                    className="w-full h-11 pl-10 pr-3.5 bg-transparent text-slate-900 text-sm font-medium uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Institutional Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Trường cấp (@edu.vn) <span className="text-rose-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all duration-200 ${
                    focusedField === 'email'
                      ? 'border-blue-600 bg-white ring-4 ring-blue-600/10 shadow-xs'
                      : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu.vn"
                    className="w-full h-11 pl-10 pr-3.5 bg-transparent text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Số điện thoại liên hệ
                </label>
                <div
                  className={`relative rounded-xl border transition-all duration-200 ${
                    focusedField === 'phone'
                      ? 'border-blue-600 bg-white ring-4 ring-blue-600/10 shadow-xs'
                      : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    call
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onFocus={() => setFocusedField('phone')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912 345 678"
                    className="w-full h-11 pl-10 pr-3.5 bg-transparent text-slate-900 text-sm font-medium focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Khoa / Bộ môn chuyên ngành <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-900 text-xs md:text-sm font-semibold focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/10 transition-all cursor-pointer"
              >
                <option value="Khoa Công nghệ Thông tin">Khoa Công nghệ Thông tin (CNTT &amp; KTPM)</option>
                <option value="Khoa Hệ thống Thông tin">Khoa Hệ thống Thông tin</option>
                <option value="Khoa An toàn Thông tin">Khoa An toàn Thông tin &amp; Mạng máy tính</option>
                <option value="Khoa Trí tuệ Nhân tạo">Khoa Khoa học Dữ liệu &amp; Trí tuệ Nhân tạo (AI)</option>
              </select>
            </div>

            {/* Row 3: Password & Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu đăng nhập <span className="text-rose-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all duration-200 ${
                    focusedField === 'password'
                      ? 'border-blue-600 bg-white ring-4 ring-blue-600/10 shadow-xs'
                      : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    className="w-full h-11 pl-10 pr-10 bg-transparent text-slate-900 text-sm font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Xác nhận lại mật khẩu <span className="text-rose-500">*</span>
                </label>
                <div
                  className={`relative rounded-xl border transition-all duration-200 ${
                    focusedField === 'confirmPassword'
                      ? 'border-blue-600 bg-white ring-4 ring-blue-600/10 shadow-xs'
                      : 'border-slate-200/90 bg-slate-50/80 hover:bg-slate-50'
                  }`}
                >
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock_reset
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại chính xác"
                    className="w-full h-11 pl-10 pr-10 bg-transparent text-slate-900 text-sm font-medium focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Password Strength Meter */}
            <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5 transition-all">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-semibold">Độ an toàn mật khẩu:</span>
                <span className={`font-bold ${strengthInfo.color}`}>{strengthInfo.text}</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    strengthScore >= 1
                      ? strengthScore <= 2
                        ? 'bg-rose-500'
                        : strengthScore === 3
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      : 'bg-transparent'
                  }`}
                ></div>
                <div
                  className={`h-full transition-all duration-300 ${
                    strengthScore >= 2
                      ? strengthScore <= 2
                        ? 'bg-rose-500'
                        : strengthScore === 3
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      : 'bg-transparent'
                  }`}
                ></div>
                <div
                  className={`h-full transition-all duration-300 ${
                    strengthScore >= 3
                      ? strengthScore === 3
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                      : 'bg-transparent'
                  }`}
                ></div>
                <div
                  className={`h-full transition-all duration-300 ${
                    strengthScore >= 4 ? 'bg-emerald-500' : 'bg-transparent'
                  }`}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    hasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {hasMinLength ? 'check_circle' : 'circle'}
                  </span>
                  <span>Tối thiểu 8 ký tự</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {hasUpper ? 'check_circle' : 'circle'}
                  </span>
                  <span>Ít nhất 1 chữ hoa (A-Z)</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    hasNumOrSpec ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {hasNumOrSpec ? 'check_circle' : 'circle'}
                  </span>
                  <span>Chứa số hoặc ký tự đặc biệt</span>
                </div>
                <div
                  className={`flex items-center gap-1.5 transition-colors ${
                    isMatch ? 'text-emerald-700 font-bold' : 'text-slate-400'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isMatch ? 'check_circle' : 'circle'}
                  </span>
                  <span>Mật khẩu khớp nhau</span>
                </div>
              </div>
            </div>

            {/* Terms Consent */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms_consent"
                type="checkbox"
                checked={termsConsent}
                onChange={(e) => setTermsConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer transition-all"
              />
              <label
                htmlFor="terms_consent"
                className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none"
              >
                Tôi xác nhận thông tin học thuật chính xác và cam kết tuân thủ{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      'Quy chế thi vấn đáp trực tuyến: Thí sinh phải bật camera, mic trong suốt quá trình thi và không dùng tài liệu trái phép.'
                    );
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Quy chế Khảo thí Viva Trực tuyến
                </a>{' '}
                cùng{' '}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert(
                      'Dữ liệu sinh trắc (khuôn mặt, giọng nói) chỉ được bảo mật và phục vụ công tác chấm thi khách quan của nhà trường.'
                    );
                  }}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Điều khoản Bảo mật Dữ liệu Sinh trắc
                </a>{' '}
                của Hội đồng Giám khảo AIVES.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-500/25 hover:shadow-lg transition-all duration-200 cursor-pointer disabled:opacity-60"
            >
              <span>{loading ? 'Đang lưu vào Mock Storage...' : 'Đăng ký tài khoản Thí sinh'}</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-7 pt-5 border-t border-slate-100 text-center space-y-3">
            <p className="text-xs text-slate-600">
              Đã có tài khoản AIVES?{' '}
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-blue-600 font-bold hover:text-blue-700 hover:underline ml-1 cursor-pointer transition-colors"
              >
                Đăng nhập ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
