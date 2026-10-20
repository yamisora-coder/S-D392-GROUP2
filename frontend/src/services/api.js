// Lớp gọi REST API tới Backend Spring Boot (AIVES)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

export async function request(path, { method = 'GET', body, params } = {}) {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL')
    ).toString();
    if (query) url += `?${query}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  let response;
  try {
    response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: { ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(localStorage.getItem('aives_token') ? { Authorization: `Bearer ${localStorage.getItem('aives_token')}` } : {}) },
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    if (networkErr.name === 'AbortError') throw new Error('Yêu cầu chờ quá lâu. Hãy tải lại danh sách câu hỏi để kiểm tra kết quả trước khi thử lại.');
    throw new Error('Không thể kết nối tới máy chủ Backend. Vui lòng kiểm tra server đang chạy.');
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const details = data?.details ? Object.values(data.details).join('; ') : '';
    const error=new Error(details || data?.message || `Lỗi máy chủ (HTTP ${response.status})`);error.status=response.status;throw error;
  }
  return data;
}

export const api = {
  // Auth & Users
  login: (emailOrCode, password) => request('/api/auth/login', { method: 'POST', body: { emailOrCode, password } }),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  createUser: (payload) => request(payload.role === 'ADMIN' ? '/api/admin/users/admins' : '/api/admin/users', { method: 'POST', body: payload }),
  me: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  getUsers: (role) => request('/api/users', { params: { role } }),
  updateUserRole: (idOrCode, role) => request(`/api/users/${encodeURIComponent(idOrCode)}/role`, { method: 'PUT', body: { role } }),
  toggleUserStatus: (idOrCode) => request(`/api/users/${encodeURIComponent(idOrCode)}/status`, { method: 'PATCH' }),

  // Subjects
  getSubjects: () => request('/api/subjects'),

  // Questions
  getQuestions: (filters = {}) => request('/api/questions', { params: filters }),
  createQuestion: (payload) => request('/api/questions', { method: 'POST', body: payload }),
  updateQuestion: (id, payload) => request(`/api/questions/${id}`, { method: 'PUT', body: payload }),
  deleteQuestion: (id) => request(`/api/questions/${id}`, { method: 'DELETE' }),
  updateQuestionStatus: (id, status) => request(`/api/questions/${id}/status`, { method: 'PATCH', params: { status } }),

  // Exams
  getExams: () => request('/api/exams'),
  createExam: (payload) => request('/api/exams', { method: 'POST', body: payload }),

  // Sessions & Grading
  getSessions: () => request('/api/sessions'),
  getSessionsByStudent: (studentId) => request(`/api/sessions/student/${studentId}`),
  finalizeGrade: (sessionId, finalTeacherScore, teacherFeedback) =>
    request(`/api/sessions/${sessionId}/grade`, { method: 'PATCH', body: { finalTeacherScore, teacherFeedback } }),
};

// ---- Helpers định dạng dùng chung ----
export const shortId = (uuid, prefix = '') => (uuid ? `${prefix}${String(uuid).slice(0, 8).toUpperCase()}` : '');

export const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

export async function downloadArtifact(path,filename) {
 const response=await fetch(`${API_BASE_URL}${path}`,{headers:{Authorization:`Bearer ${localStorage.getItem('aives_token')}`}});
 if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(error?.message||`HTTP ${response.status}`);}
 const url=URL.createObjectURL(await response.blob());const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
