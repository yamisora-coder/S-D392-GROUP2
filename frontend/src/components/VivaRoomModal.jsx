import React, { useState, useEffect, useRef } from 'react';
import AttemptRecorder from './AttemptRecorder.jsx';
import { request } from '../services/api.js';
export default function VivaRoomModal({isOpen,onClose,exam,currentUser}) {
  const [attempt,setAttempt]=useState(null),[answers,setAnswers]=useState({}),[index,setIndex]=useState(0);
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[seconds,setSeconds]=useState(0),[saved,setSaved]=useState(false);
  const audioRecorder=useRef(null);
  const video=useRef(null),stream=useRef(null),speech=useRef(null),submitting=useRef(false),latestAnswers=useRef({}),expired=useRef(false);
  const [interim,setInterim]=useState(''),[replySeconds,setReplySeconds]=useState(null),[voices,setVoices]=useState([]),[voice,setVoice]=useState('');
  const timedOut=useRef(new Set());
  const [listening,setListening]=useState(false),[followupDrafts,setFollowupDrafts]=useState({});
  const latestDrafts=useRef({}),latestAttempt=useRef(null),requesting=useRef(false);
  function apply(a){latestAttempt.current=a;setAttempt(a);const sent=Object.fromEntries(a.answers.map(x=>[x.questionId,x.text]));latestAnswers.current={...latestAnswers.current,...sent};setAnswers({...latestAnswers.current});}
  function draft(id,text){latestDrafts.current={...latestDrafts.current,[id]:text};setFollowupDrafts({...latestDrafts.current});}
  function read(text){if(!window.speechSynthesis)return;window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text);utterance.lang='vi-VN';utterance.voice=window.speechSynthesis.getVoices().find(v=>v.voiceURI===voice)||window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('vi'))||null;window.speechSynthesis.speak(utterance);}
  async function send(qid){
    if(requesting.current || submitting.current)return;requesting.current=true;setBusy(true);setError('');speech.current?.stop();
    try{
      let a=latestAttempt.current;const pending=(a.followups||[]).find(t=>t.questionId===qid && t.answer===null);
      const sent=a.answers.some(x=>x.questionId===qid);
      if(pending || !sent){
        const text=pending?latestDrafts.current[pending.id]:latestAnswers.current[qid];
        if(!text?.trim())throw new Error('Vui lòng nhập câu trả lời.');
        a=await request(`/api/sessions/${exam.id}/responses`,{method:'POST',body:{questionId:qid,text,...(pending?{followupId:pending.id}:{})}});apply(a);
      }
      if(submitting.current || expired.current)return;
      const count=(a.followups||[]).filter(t=>t.questionId===qid).length;
      if(count<a.maxFollowupsPerQuestion){
        a=await request(`/api/sessions/${exam.id}/follow-up`,{method:'POST',body:{questionId:qid}});
        if(!submitting.current && !expired.current){apply(a);const turn=a.followups.filter(t=>t.questionId===qid).at(-1);if(turn)read(turn.question);}
      }
    }catch(e){setError(e.message);}finally{setBusy(false);requesting.current=false;}
  }
  useEffect(()=>{
    if(!isOpen)return;
    let alive=true;latestAnswers.current={};latestDrafts.current={};latestAttempt.current=null;setFollowupDrafts({});setAnswers({});setAttempt(null);setError('');setSaved(false);setIndex(0);expired.current=false;timedOut.current=new Set();
    request(`/api/sessions/${exam.id}/start`,{method:'POST'}).then(a=>{if(!alive)return;apply(a);setSaved(a.submitted);}).catch(e=>{if(alive)setError(e.message);});
    navigator.mediaDevices?.getUserMedia({video:true,audio:false}).then(s=>{if(!alive){s.getTracks().forEach(t=>t.stop());return;}stream.current=s;if(video.current)video.current.srcObject=s;}).catch(()=>{});
    return ()=>{alive=false;stream.current?.getTracks().forEach(t=>t.stop());stream.current=null;speech.current?.stop();window.speechSynthesis?.cancel();};
  },[isOpen,exam?.id]);
  useEffect(()=>{
    if(!attempt || saved)return;
    const tick=()=>{const left=Math.max(0,Math.ceil((new Date(attempt.deadline).getTime()-Date.now())/1000));setSeconds(left);if(!left && !expired.current){expired.current=true;submit(attempt);}};
    tick();const id=setInterval(tick,1000);return ()=>clearInterval(id);
  },[attempt,saved]);
  useEffect(()=>{if(!window.speechSynthesis)return;const update=()=>setVoices(window.speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('vi')));update();window.speechSynthesis.addEventListener('voiceschanged',update);return()=>window.speechSynthesis.removeEventListener('voiceschanged',update);},[]);
  useEffect(()=>{
    const a=latestAttempt.current,qid=a?.questions[index]?.id;
    if(!isOpen||!qid||saved||!a.answerTimeSeconds||a.answerDeadlines?.[qid])return;
    let alive=true;setBusy(true);request(`/api/sessions/${exam.id}/question`,{method:'POST',body:{questionId:qid}}).then(next=>{if(alive)apply(next);}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setBusy(false);});return()=>{alive=false;};
  },[isOpen,index,attempt?.sessionId,saved]);
  useEffect(()=>{
    if(!attempt||saved||!attempt.answerTimeSeconds){setReplySeconds(null);return;}
    const qid=attempt.questions[index]?.id,turn=attempt.followups?.find(t=>t.questionId===qid&&t.answer===null);
    const mainSent=attempt.answers.some(a=>a.questionId===qid),deadline=turn?.answerDeadline||(!mainSent?attempt.answerDeadlines?.[qid]:null);
    if(!deadline){setReplySeconds(null);return;}
    const key=turn?.id||qid;
    const tick=()=>{const left=Math.max(0,Math.ceil((new Date(deadline).getTime()-Date.now())/1000));setReplySeconds(left);
      if(!left&&!timedOut.current.has(key)&&!requesting.current&&!submitting.current){timedOut.current.add(key);speech.current?.stop();const text=turn?(latestDrafts.current[turn.id]||''):(latestAnswers.current[qid]||'');
        request(`/api/sessions/${exam.id}/responses`,{method:'POST',body:{questionId:qid,text,...(turn?{followupId:turn.id}:{})}}).then(apply).catch(e=>setError(e.message));}
    };tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[attempt,index,saved]);
  useEffect(()=>{const leave=e=>{if(isOpen && attempt && !saved){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',leave);return ()=>window.removeEventListener('beforeunload',leave);},[isOpen,attempt,saved]);
  async function submit(a=attempt){
    if(!a || submitting.current)return;submitting.current=true;setBusy(true);setError('');speech.current?.stop();
    try{
      await audioRecorder.current?.stop();
      const current=latestAttempt.current||a;
      if(current.answerTimeSeconds)for(const question of current.questions)if(!current.answers.some(x=>x.questionId===question.id)&&latestAnswers.current[question.id]?.trim()){
        try{apply(await request(`/api/sessions/${exam.id}/responses`,{method:'POST',body:{questionId:question.id,text:latestAnswers.current[question.id]}}));}
        catch(e){if(e.status===409){latestAnswers.current[question.id]='';}else throw e;}
      }
      for(const turn of current.followups||[])if(turn.answer===null && latestDrafts.current[turn.id]?.trim()){try{await request(`/api/sessions/${exam.id}/responses`,{method:'POST',body:{questionId:turn.questionId,followupId:turn.id,text:latestDrafts.current[turn.id]}});}catch(e){if(e.status!==409)throw e;}}
      await request(`/api/sessions/${exam.id}/answers`,{method:'POST',body:{answers:a.questions.map(q=>({questionId:q.id,text:latestAnswers.current[q.id]||''}))}});setSaved(true);window.speechSynthesis?.cancel();stream.current?.getTracks().forEach(t=>t.stop());}
    catch(e){setError(e.message);}finally{setBusy(false);submitting.current=false;}
  }
  async function grade(){setBusy(true);setError('');try{await request(`/api/sessions/${exam.id}/ai-grade`,{method:'POST'});setError('AI đã chấm xong. Bài thi đang chờ giảng viên duyệt.');}catch(e){setError(`Bài đã lưu. ${e.message}. Có thể thử chấm lại sau.`);}finally{setBusy(false);}}
  function change(id,text){setAnswers(prev=>{const next={...prev,[id]:text};latestAnswers.current=next;return next;});}
  function dictate(){
    if(listening){speech.current?.stop();return;}
    window.speechSynthesis?.cancel();
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){setError('Trình duyệt không hỗ trợ nhập giọng nói. Vui lòng nhập câu trả lời bằng văn bản.');return;}
    const recognizer=new Recognition();recognizer.lang='vi-VN';recognizer.continuous=true;recognizer.interimResults=true;
    const id=attempt.questions[index].id;const pending=(attempt.followups||[]).find(t=>t.questionId===id && t.answer===null);
    recognizer.onresult=e=>{const current=latestAttempt.current;if(pending?current?.followups?.find(t=>t.id===pending.id)?.answer!==null:current?.answers?.some(a=>a.questionId===id))return;let extra='',preview='';for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)extra+=e.results[i][0].transcript+' ';else preview+=e.results[i][0].transcript+' ';}setInterim(preview);if(!extra)return;if(pending)draft(pending.id,(latestDrafts.current[pending.id]||'')+' '+extra);else change(id,(latestAnswers.current[id]||'')+' '+extra);};
    recognizer.onend=()=>{setListening(false);setInterim('');};recognizer.onerror=e=>setError(`Nhập giọng nói: ${e.error}. Bạn vẫn có thể nhập văn bản.`);speech.current=recognizer;recognizer.start();setListening(true);
  }
  if(!isOpen)return null;
  const q=attempt?.questions[index];
  const turns=(attempt?.followups||[]).filter(t=>t.questionId===q?.id),pending=turns.find(t=>t.answer===null);
  const mainSent=attempt?.answers.some(x=>x.questionId===q?.id),limit=attempt?.maxFollowupsPerQuestion||0;
  const finished=mainSent && !pending && (turns.length>=limit||!answers[q?.id]?.trim());
  const responseValue=pending?(followupDrafts[pending.id]||''):(answers[q?.id]||'');
  return <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto p-5"><div className="max-w-4xl mx-auto bg-white rounded-2xl p-6 space-y-5">
    <header className="flex justify-between gap-4"><div><h2 className="font-bold text-xl">{exam?.title}</h2><p>{currentUser?.fullName}</p></div><strong>{saved?'Đã lưu bài':`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`}</strong><button onClick={()=>{if(saved || !attempt || confirm('Câu trả lời chưa nộp sẽ không được lưu. Rời phòng thi?')){speech.current?.stop();window.speechSynthesis?.cancel();onClose();}}}>Đóng</button></header>
    <video ref={video} autoPlay muted playsInline className="w-48 rounded-xl bg-slate-900" />
    {attempt&&<AttemptRecorder ref={audioRecorder} sessionId={exam.id} disabled={saved}/>}
    <p role="alert" className="text-rose-700">{error}</p>
    {!attempt && !error && <p>Đang chuẩn bị đề thi…</p>}
    {saved ? <section><h3 className="font-bold text-emerald-700">Bài thi đã được lưu trên hệ thống.</h3><p>Chấm AI là điểm đề xuất, giảng viên sẽ duyệt kết quả.</p><button className="bg-blue-700 text-white p-3 rounded mt-3 disabled:opacity-50" disabled={busy} onClick={grade}>{busy?'Đang chấm…':'Gửi AI chấm / Thử lại'}</button></section> : q && <>
      <div className="flex flex-wrap gap-3 items-center"><span className="text-sm text-slate-600">{replySeconds!==null?`Thời gian trả lời: ${replySeconds}s`:attempt.answerTimeSeconds?`Mỗi lượt: ${attempt.answerTimeSeconds}s`:''}</span><select aria-label="Giọng đọc tiếng Việt" className="border rounded p-2 text-sm" value={voice} onChange={e=>setVoice(e.target.value)}><option value="">Giọng tiếng Việt mặc định</option>{voices.map(v=><option value={v.voiceURI} key={v.voiceURI}>{v.name}</option>)}</select></div>
      <p>Câu {index+1}/{attempt.questions.length} · Bloom {q.bloomLevel} · {q.difficulty}</p><h3 className="text-lg font-bold">{q.content}</h3>
      <button className="text-blue-700" onClick={()=>read(q.content)}>Đọc câu hỏi</button>
      {mainSent && <div className="rounded-xl bg-slate-50 p-4 whitespace-pre-wrap"><strong>Bạn</strong><p>{answers[q.id]}</p></div>}
      {turns.map((t,i)=><section key={t.id} className="space-y-3"><div className="rounded-xl bg-blue-50 p-4"><strong>AI · Hỏi xoáy {i+1}/{limit}</strong><p>{t.question}</p><button className="text-blue-700 mt-2" onClick={()=>read(t.question)}>Đọc câu hỏi</button></div>{t.answer!==null && <div className="rounded-xl bg-slate-50 p-4 whitespace-pre-wrap"><strong>Bạn</strong><p>{t.answer}</p></div>}</section>)}
      {(!mainSent || pending) && <textarea aria-label={pending?'Trả lời câu hỏi phụ':'Câu trả lời'} maxLength={20000} className="w-full border rounded-xl p-4 min-h-40" disabled={busy || seconds===0 || replySeconds===0} value={responseValue} onChange={e=>pending?draft(pending.id,e.target.value):change(q.id,e.target.value)} placeholder="Nhập hoặc dùng giọng nói, sau đó gửi câu trả lời." />}
      {interim&&<p role="status" className="text-slate-500 italic">Đang nhận giọng nói: {interim}</p>}
      {finished?<p className="text-emerald-700">Đã hoàn thành câu này. Chọn câu tiếp hoặc nộp bài.</p>:<button className="bg-blue-700 text-white p-3 rounded disabled:opacity-50" disabled={busy || seconds===0 || (replySeconds===0&&(!mainSent||!!pending))} onClick={()=>send(q.id)}>{busy?'Đang xử lý…':mainSent&&!pending?'Thử hỏi tiếp':'Gửi câu trả lời'}</button>}
      <div className="flex flex-wrap gap-3"><button className="border p-3 rounded" disabled={busy || seconds===0 || replySeconds===0 || (mainSent&&!pending)} onClick={dictate}>{listening?'Dừng nhập giọng nói':'Nhập bằng giọng nói'}</button><button disabled={index===0 || busy} onClick={()=>{speech.current?.stop();window.speechSynthesis?.cancel();setError('');setIndex(i=>i-1);}}>Câu trước</button><button disabled={index===attempt.questions.length-1 || busy} onClick={()=>{speech.current?.stop();window.speechSynthesis?.cancel();setError('');setIndex(i=>i+1);}}>Câu tiếp</button><button className="bg-emerald-700 text-white p-3 rounded disabled:opacity-50" disabled={busy} onClick={()=>submit()}>{busy?'Đang lưu…':'Nộp bài'}</button></div>
    </>}
  </div></div>;
}
