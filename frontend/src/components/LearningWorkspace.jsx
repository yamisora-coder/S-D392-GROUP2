import React, { useEffect, useState, useRef } from 'react';
import { request } from '../services/api.js';
import { createGeneration, runGeneration } from '../services/questionGeneration.js';
const blooms = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
const bloomLabels = ['1 · Nhớ', '2 · Hiểu', '3 · Vận dụng', '4 · Phân tích', '5 · Đánh giá', '6 · Sáng tạo'];
const field = 'min-w-0 max-w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400';
const button = 'shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors';
export default function LearningWorkspace({ subjects, onChanged }) {
  const [aiCheck, setAiCheck] = useState(null);
  const [checkingAI, setCheckingAI] = useState(false);
  async function checkAI() { setCheckingAI(true);setAiCheck(null);try { setAiCheck(await request('/api/ai/check', {method:'POST'})); } catch(e) {setAiCheck({ok:false,message:e.message});} finally {setCheckingAI(false);} }
  const [panel, setPanel] = useState(null);
  const [subject, setSubject] = useState('');
  const [subjectCode,setSubjectCode]=useState(''),[subjectName,setSubjectName]=useState('');
  const [chapters, setChapters] = useState([]), [chapter, setChapter] = useState('');
  const [materials, setMaterials] = useState([]), [material, setMaterial] = useState('');
  const [title, setTitle] = useState(''), [bloom, setBloom] = useState('REMEMBER');
  const [topic,setTopic]=useState(''),[excerpts,setExcerpts]=useState([]);
  const [startPage, setStartPage] = useState(1);
  const [difficulty, setDifficulty] = useState('EASY'), [count, setCount] = useState(3);
  const storageKey=useRef('aives_generation_'+(()=>{try{return JSON.parse(localStorage.getItem('aives_current_user'))?.dbId||'local';}catch{return 'local';}})()).current;
  const [generation,setGeneration]=useState(()=>{try{const value=JSON.parse(sessionStorage.getItem(storageKey));return value?.version===1?value:null;}catch{return null;}});
  const generating=useRef(false),pauseGeneration=useRef(false);
  function saveGeneration(job){setGeneration(job?{...job,completed:[...job.completed]}:null);try{if(job)sessionStorage.setItem(storageKey,JSON.stringify(job));else sessionStorage.removeItem(storageKey);}catch{/* In-memory progress remains usable when browser storage is full. */}}
  async function generateQuestions(){
    if(generating.current)return;
    generating.current=true;pauseGeneration.current=false;setBusy(true);setMessage('');
    let job=generation;
    try {
      if(!job)job=createGeneration({subject,chapter,materialId:material,bloomLevel:bloom,difficulty,count,startPage,topic,label:materials.find(m=>m.id===material)?.filename||'Tài liệu'});
      const done=await runGeneration(job,{send:request,shouldPause:()=>pauseGeneration.current,onProgress:current=>{saveGeneration(current);onChanged();}});
      if(done){saveGeneration(null);setMessage(`Đã tạo ${job.completed.length} câu hỏi chờ duyệt.`);}
      else setMessage(`Đã tạm dừng. ${job.completed.length}/${job.config.count} câu đã lưu; có thể tiếp tục.`);
    }catch(e){if(job)saveGeneration(job);setMessage(`Đã lưu ${job?.completed.length||0}/${job?.config.count||count} câu. ${e.message} Bấm Tiếp tục để xử lý phần còn lại.`);}
    finally{setBusy(false);generating.current=false;onChanged();}
  }
  const [elapsed, setElapsed] = useState(0);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  useEffect(() => { if (!busy) return; const started=Date.now();setElapsed(0);const id=setInterval(()=>setElapsed(Math.floor((Date.now()-started)/1000)),1000);return ()=>clearInterval(id); }, [busy]);
  const [templateName, setTemplateName] = useState(''), [templates, setTemplates] = useState([]);
  const [criteria, setCriteria] = useState([
    { criteriaName: 'Đúng kiến thức', maxScore: 4, description: '0: sai; 2: đúng một phần; 4: đúng và đầy đủ.' },
    { criteriaName: 'Lập luận', maxScore: 3, description: '0: không giải thích; 1.5: giải thích thiếu; 3: giải thích mạch lạc, chính xác.' },
    { criteriaName: 'Vận dụng', maxScore: 3, description: '0: không có ví dụ; 1.5: ví dụ chưa phù hợp; 3: ví dụ đúng, giải thích được cách áp dụng.' },
  ]);
  useEffect(() => { if (!subject && subjects.length) setSubject(generation?.config.subject || subjects[0].id); }, [subjects, subject]);
  useEffect(()=>{if(generation){setCount(generation.config.count);setBloom(generation.config.bloomLevel);setDifficulty(generation.config.difficulty);setStartPage(generation.config.startPage);setTopic(generation.config.topic||'');}},[generation?.config]);
  useEffect(() => {
    let live = true; setChapters([]); setChapter('');
    if (subject) request('/api/chapters', { params: { subjectId: subject } }).then(v => { if (live) { setChapters(v); setChapter(v.find(c=>c.id===generation?.config.chapter)?.id || v[0]?.id || ''); } }).catch(e => setMessage(e.message));
    return () => { live = false; };
  }, [subject]);
  useEffect(() => {
    let live = true; setMaterials([]); setMaterial('');
    if (chapter) request(`/api/chapters/${chapter}/materials`).then(v => { if (live) { setMaterials(v); setMaterial(v.find(m=>m.id===generation?.config.materialId)?.id || v[0]?.id || ''); } }).catch(e => setMessage(e.message));
    return () => { live = false; };
  }, [chapter]);
  useEffect(() => { request('/api/rubric-templates').then(setTemplates).catch(e => setMessage(e.message)); }, []);
  async function run(task) { setBusy(true); setMessage('Đang xử lý…'); try { await task(); } catch (e) { setMessage(e.message); } finally { setBusy(false); } }
  async function upload(file, path) {
    if (!file) return;
    await run(async () => {
      const body = new FormData(); body.append('file', file);
      const result = await request(path, { method: 'POST', body });
      if (Array.isArray(result)) { setMessage(`Đã nhập ${result.length} câu hỏi chờ duyệt.`); onChanged(); }
      else { setMaterials(prev => [result, ...prev]); setMaterial(result.id); setMessage('Đã tải tài liệu.'); }
    });
  }
  return <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
    <div className="flex flex-wrap items-center gap-2 p-3">
      {[['generate', 'auto_awesome', 'Tạo từ tài liệu'], ['import', 'upload_file', 'Nhập file'], ['rubric', 'checklist', 'Rubric mẫu']].map(([id, icon, label]) => <button key={id} type="button" aria-expanded={panel === id} aria-controls={`learning-${id}`} onClick={() => setPanel(panel === id ? null : id)} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${panel === id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}><span aria-hidden="true" className="material-symbols-outlined text-[18px]">{icon}</span>{label}<span aria-hidden="true" className="material-symbols-outlined text-base">{panel === id ? 'expand_less' : 'expand_more'}</span></button>)}
    </div>
    {panel === 'generate' && <div id="learning-generate" className="border-t border-slate-100 p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={checkingAI || busy} onClick={checkAI} className="text-sm text-blue-700 border border-blue-100 px-3 py-2 rounded-xl disabled:opacity-40">{checkingAI ? 'Đang kiểm tra (tối đa 15 giây)…' : 'Kiểm tra AI'}</button><span className="text-xs text-slate-400">Thử kết nối trước khi tạo câu hỏi</span></div>
      {aiCheck && <p role="status" className={`rounded-xl p-3 text-sm ${aiCheck.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{aiCheck.message}{aiCheck.model ? ` · Model: ${aiCheck.model}` : ''}{aiCheck.transport ? ` · ${aiCheck.transport}` : ''}{aiCheck.elapsedMs != null ? ` · ${(aiCheck.elapsedMs/1000).toFixed(1)}s` : ''}</p>}


    <details><summary className="cursor-pointer">Tạo môn học</summary><div className="flex flex-wrap gap-2 mt-2"><input aria-label="Mã môn học" className={field} placeholder="SWD392" value={subjectCode} onChange={e=>setSubjectCode(e.target.value)} /><input aria-label="Tên môn học" className={field} placeholder="Tên môn học" value={subjectName} onChange={e=>setSubjectName(e.target.value)} /><button className={button} disabled={busy || !subjectCode.trim() || !subjectName.trim()} onClick={()=>run(async()=>{await request('/api/subjects',{method:'POST',body:{code:subjectCode,name:subjectName}});onChanged();setSubjectCode('');setSubjectName('');setMessage('Đã tạo môn học.');})}>Lưu môn học</button></div></details>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <select disabled={busy || !!generation} aria-label="Môn học" className={field} value={subject} onChange={e => setSubject(e.target.value)}>{subjects.map(s => <option key={s.id} value={s.id}>{s.code} · {s.name.split(" (")[0]}</option>)}</select>
      <select disabled={busy || !!generation} aria-label="Chương" className={field} value={chapter} onChange={e => setChapter(e.target.value)}><option value="">Chọn chương</option>{chapters.map(c => <option key={c.id} value={c.id}>{c.position}. {c.title}</option>)}</select>
      </div><details className="text-sm text-slate-500"><summary className="cursor-pointer hover:text-blue-700">Thêm chương</summary><div className="flex flex-wrap gap-2 mt-3"><input aria-label="Tên chương mới" className={field} value={title} onChange={e => setTitle(e.target.value)} placeholder="Tên chương mới" />
      <button className={button} disabled={busy || !subject || !title.trim()} onClick={() => run(async () => { const c = await request('/api/chapters', { method: 'POST', body: { subjectId: subject, title, position: chapters.length + 1 } }); setChapters(v => [...v, c]); setChapter(c.id); setTitle(''); setMessage('Đã tạo chương.'); })}>Tạo chương</button></div></details>
    <div className="flex flex-wrap gap-3 items-center">
      <label className="inline-flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-600 cursor-pointer hover:bg-slate-50"><span aria-hidden="true" className="material-symbols-outlined text-lg">upload_file</span>Tải tài liệu<input className="sr-only" aria-label="Tài liệu chương" disabled={busy || !!generation || !chapter} type="file" accept=".pdf,.pptx,.txt" onChange={e => { upload(e.target.files[0], `/api/chapters/${chapter}/materials`); e.target.value = ''; }} /><span className="text-xs text-slate-400">PDF, PPTX, TXT · 20 MB</span></label>
      <select disabled={busy || !!generation} aria-label="Phiên bản tài liệu" className={field} value={material} onChange={e => setMaterial(e.target.value)}><option value="">Chọn tài liệu</option>{materials.map(m => <option key={m.id} value={m.id}>{m.filename} · {new Date(m.uploadedAt).toLocaleString('vi-VN')}</option>)}</select>
    </div>
    <div className="space-y-2"><label className="block text-sm text-slate-600">Chủ đề cần tạo câu hỏi (tùy chọn)<input aria-label="Chủ đề truy xuất tài liệu" className={field+' w-full mt-1'} disabled={busy||!!generation} maxLength={1000} value={topic} onChange={e=>{setTopic(e.target.value);setExcerpts([]);}} placeholder="Ví dụ: Dependency Injection, kiến trúc phân lớp…"/></label><button disabled={busy||!material||!topic.trim()} className="text-sm text-blue-700" onClick={()=>run(async()=>{setExcerpts(await request(`/api/materials/${material}/search`,{params:{q:topic,startPage}}));setMessage('Đã tìm các đoạn nguồn liên quan.');})}>Xem trích đoạn liên quan</button>{excerpts.length>0&&<details><summary className="text-sm cursor-pointer">{excerpts.length} đoạn nguồn</summary>{excerpts.map((x,i)=><blockquote className="text-sm border-l-2 pl-3 mt-3 text-slate-600" key={i}><strong>Trang {x.page}</strong><p>{x.text}</p></blockquote>)}</details>}</div>
    <div className="flex flex-wrap gap-2 items-center">
      <label className="text-sm text-slate-500">Từ trang <input aria-label="Trang bắt đầu" disabled={busy || !!generation} type="number" min="1" className={field + ' w-20'} value={startPage} onChange={e=>setStartPage(Number(e.target.value))} /></label>
      <select disabled={busy || !!generation} aria-label="Mức Bloom" className={field} value={bloom} onChange={e => setBloom(e.target.value)}>{blooms.map((b, i) => <option key={b} value={b}>Bloom {bloomLabels[i]}</option>)}</select>
      <select disabled={busy || !!generation} aria-label="Độ khó" className={field} value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="EASY">Dễ</option><option value="MEDIUM">Trung bình</option><option value="HARD">Khó</option></select>
      <input aria-label="Số câu hỏi" disabled={busy || !!generation} className={field + ' w-20'} type="number" min="1" max="10" value={count} onChange={e => setCount(Number(e.target.value))} />
      <button className={button} disabled={busy || (!material && !generation)} onClick={generateQuestions}>{busy && generation ? `Đã lưu ${generation.completed.length}/${generation.config.count} · ${elapsed}s` : generation ? `Tiếp tục ${generation.completed.length}/${generation.config.count}` : 'Tạo câu hỏi'}</button>
      {busy && generation && <button className="text-sm text-slate-600 border rounded-xl px-3 py-2" onClick={()=>{pauseGeneration.current=true;setMessage('Sẽ dừng sau đợt hiện tại.');}}>Tạm dừng sau đợt này</button>}
      {!busy && generation && <button className="text-sm text-slate-500" onClick={()=>{saveGeneration(null);setMessage('Đã kết thúc đợt. Các câu đã lưu vẫn ở Chờ duyệt.');}}>Kết thúc đợt</button>}
    </div>
    {generation && <div role="status" className="space-y-2"><progress aria-label="Tiến độ tạo câu hỏi" className="w-full h-2" max={generation.config.count} value={generation.completed.length}/><p className="text-sm text-slate-600">{generation.config.label} · Đã lưu {generation.completed.length}/{generation.config.count}{busy?' · Mỗi đợt tối đa 3 câu.':''}</p></div>}
    <p className="text-xs text-slate-500">Có chủ đề: tìm các đoạn liên quan từ trang đã chọn. Không nhập chủ đề: dùng nội dung tuần tự từ trang đó.</p>
    </div>}
    {panel === 'import' && <div id="learning-import" className="border-t border-slate-100 p-5 space-y-3">
      <p className="text-sm text-slate-500">Nhập câu hỏi kèm rubric từ CSV hoặc Excel.</p>
      <label className="inline-flex items-center gap-2 border border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-600 cursor-pointer hover:bg-slate-50"><span aria-hidden="true" className="material-symbols-outlined text-lg">upload_file</span>Chọn file<input className="sr-only" aria-label="Import ngân hàng câu hỏi" disabled={busy} type="file" accept=".csv,.xlsx" onChange={e => { upload(e.target.files[0], '/api/questions/import'); e.target.value = ''; }} /></label>
    </div>}
    {panel === 'rubric' && <div id="learning-rubric" className="border-t border-slate-100 p-5">
      <div className="space-y-2 mt-3">
        <select aria-label="Chọn rubric mẫu" className={field} defaultValue="" onChange={e => { const t = templates.find(t => t.id === e.target.value); if (t) { setCriteria(JSON.parse(t.criteriaJson)); setTemplateName(t.name); } }}><option value="">Chọn mẫu đã lưu</option>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
        <input className={field} aria-label="Tên rubric mẫu" placeholder="Tên mẫu rubric" value={templateName} onChange={e => setTemplateName(e.target.value)} />
        {criteria.map((r, i) => <div key={i} className="flex flex-wrap gap-2"><input aria-label={`Tiêu chí ${i + 1}`} className={field} value={r.criteriaName} onChange={e => setCriteria(v => v.map((x, j) => i === j ? { ...x, criteriaName: e.target.value } : x))} /><input aria-label={`Điểm tiêu chí ${i + 1}`} className={field + ' w-20'} type="number" min="0.25" step="0.25" value={r.maxScore} onChange={e => setCriteria(v => v.map((x, j) => i === j ? { ...x, maxScore: Number(e.target.value) } : x))} /><textarea aria-label={`Mô tả mức điểm ${i + 1}`} className={field + ' flex-1'} value={r.description} onChange={e => setCriteria(v => v.map((x, j) => i === j ? { ...x, description: e.target.value } : x))} /><button onClick={() => setCriteria(v => v.filter((_, j) => j !== i))}>Xóa</button></div>)}
        <button className={field} onClick={() => setCriteria(v => [...v, { criteriaName: '', maxScore: 1, description: '' }])}>Thêm tiêu chí</button>
        <button className={button} disabled={busy || !templateName.trim()} onClick={() => run(async () => { const t = await request('/api/rubric-templates', { method: 'POST', body: { name: templateName, criteria } }); setTemplates(v => [...v, t]); setMessage('Đã lưu mẫu rubric.'); })}>Lưu rubric</button>
      </div>
    </div>}
    {message && <p role="status" className="px-5 pb-4 text-sm text-blue-800">{busy && generation ? `Đã lưu ${generation.completed.length}/${generation.config.count} câu · Đang tạo đợt tiếp theo (${elapsed}s).` : busy ? `Đang xử lý · ${elapsed} giây…` : message}</p>}
  </section>;
}
