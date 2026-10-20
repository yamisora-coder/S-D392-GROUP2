// Each committed batch is retained; retries reuse the same server receipt ID.
export function createGeneration(config) {
  if(!Number.isInteger(config.count) || config.count<1 || config.count>10)throw new Error('Chọn từ 1 đến 10 câu hỏi.');
  return {version:1,config:{...config},completed:[],pending:null};
}
export async function runGeneration(job,{send,onProgress=()=>{},shouldPause=()=>false}) {
  while(job.completed.length<job.config.count) {
    if(shouldPause())return false;
    if(!job.pending)job.pending={batchId:crypto.randomUUID(),count:Math.min(3,job.config.count-job.completed.length)};
    onProgress(job);
    const {chapter,materialId,bloomLevel,difficulty,startPage,topic}=job.config;
    const result=await send(`/api/chapters/${chapter}/generate`,{method:'POST',body:{materialId,bloomLevel,difficulty,startPage,...(topic?{topic}:{}),...job.pending,excludeContents:job.completed.map(q=>q.content.slice(0,2000))}});
    if(!Array.isArray(result) || result.length!==job.pending.count || result.some(q=>!q.id || !q.content) || new Set([...job.completed,...result].map(q=>q.id)).size!==job.completed.length+result.length)throw new Error('Phản hồi đợt chưa hợp lệ. Hãy tiếp tục để kiểm tra lại kết quả đã lưu.');
    job.completed.push(...result);job.pending=null;onProgress(job);
  }
  return true;
}
