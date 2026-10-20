import test from 'node:test';
import assert from 'node:assert/strict';
import {createGeneration,runGeneration} from './questionGeneration.js';
const config={chapter:'chapter',materialId:'material',bloomLevel:'UNDERSTAND',difficulty:'MEDIUM',count:10,startPage:1};
function results(start,count){return Array.from({length:count},(_,i)=>({id:`q${start+i}`,content:`Question ${start+i}`}));}
test('ten questions are committed in batches 3,3,3,1 with previous contents excluded',async()=>{
  const job=createGeneration(config),sizes=[],progress=[];
  const done=await runGeneration(job,{send:async(path,{body})=>{assert.equal(path,'/api/chapters/chapter/generate');assert.equal(body.excludeContents.length,job.completed.length);sizes.push(body.count);return results(job.completed.length,body.count);},onProgress:j=>progress.push(j.completed.length)});
  assert.equal(done,true);assert.deepEqual(sizes,[3,3,3,1]);assert.equal(job.completed.length,10);assert.ok(progress.includes(3));assert.ok(progress.includes(6));assert.ok(progress.includes(9));
});
test('failure retains saved batches and resumes with the same pending ID after reload',async()=>{
  let job=createGeneration(config),calls=0,failedId;
  await assert.rejects(runGeneration(job,{send:async(path,{body})=>{if(++calls===2){failedId=body.batchId;throw new Error('503');}return results(0,body.count);}}),/503/);
  assert.equal(job.completed.length,3);job=JSON.parse(JSON.stringify(job));
  let first=true;
  await runGeneration(job,{send:async(path,{body})=>{if(first){assert.equal(body.batchId,failedId);assert.equal(body.excludeContents.length,3);first=false;}return results(job.completed.length,body.count);}});
  assert.equal(job.completed.length,10);assert.equal(new Set(job.completed.map(q=>q.id)).size,10);
});
test('pause finishes the current batch and resumes remaining work',async()=>{
  const job=createGeneration(config);let pause=false;
  assert.equal(await runGeneration(job,{send:async(path,{body})=>{pause=true;return results(0,body.count);},shouldPause:()=>pause}),false);
  assert.equal(job.completed.length,3);assert.equal(job.pending,null);
  await runGeneration(job,{send:async(path,{body})=>results(job.completed.length,body.count)});assert.equal(job.completed.length,10);
});
test('invalid response leaves the pending ID for a safe retry',async()=>{
  const job=createGeneration(config);
  await assert.rejects(runGeneration(job,{send:async()=>[]}),/chưa hợp lệ/);assert.equal(job.completed.length,0);assert.ok(job.pending.batchId);
});

test('retrieval topic is kept on every batch and retry payload',async()=>{
 const job=createGeneration({...config,count:4,topic:'Dependency injection'});
 await runGeneration(job,{send:async(path,{body})=>{assert.equal(body.topic,'Dependency injection');return results(job.completed.length,body.count);}});
 assert.equal(job.completed.length,4);
});
