/* Parent-only display of dated, cloud-synced student work. No cloud writes. */
(function(){
'use strict';
const parent=document.getElementById('mom');
if(!parent)return;
const panel=document.createElement('section');
panel.id='parentActivityJournal';
panel.className='section card';
panel.style.cssText='border:2px solid #c7d8e8;background:linear-gradient(160deg,#f8fbff,#fff9fc);margin-bottom:18px';
parent.insertBefore(panel,parent.querySelector('#momContent'));
function el(tag,txt,cls){
 const n=document.createElement(tag);if(txt!==undefined)n.textContent=String(txt);
 if(cls)n.className=cls;return n;
}
function dayOf(timestamp){
 if(!timestamp)return '';
 const s=String(timestamp);
 if(/^\d{4}-\d{2}-\d{2}/.test(s))return s.slice(0,10);
 const d=new Date(timestamp);
 if(!Number.isFinite(d.getTime()))return '';
 return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
function pretty(iso){
 try{return new Date(iso+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});}
 catch(e){return iso;}
}
function asText(v){
 if(v==null)return '';
 if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')return String(v);
 if(Array.isArray(v))return v.map(asText).join(' • ');
 return Object.entries(v).map(([k,x])=>k+': '+asText(x)).join(' • ');
}
function buildRecords(s){
 const items=[],add=(date,category,title,description,detail)=>{date=dayOf(date);if(date)items.push({date,category,title,description:description||'',detail:detail||[]});};
 const histories=s.gratitudeHistory||{},plain=s.gratitude||{};
 const gratitudeDays=new Set([...Object.keys(plain),...Object.keys(histories)]);
 for(const date of gratitudeDays){
  const rec=histories[date]||{},txt=rec.text||plain[date];
  if(!txt)continue;
  add(date,'💗 Gratitude','Gabriella’s gratitude',txt,rec.prayer?[['Prayer she read',rec.prayer],['Saved',rec.savedAt||'']]:[]);
 }
 const flow=s.subjectFlow||{},done=flow.done||{},api=window.CloudberryFlow;
 const math=api?.mathSteps||[],bju=api?.bjuSteps||[];
 for(const subject of ['math','tg','bju']){
  for(const [step,date] of Object.entries(done[subject]||{})){
   const i=Number(step);
   const name=subject==='math'?(math[i]?[math[i][0],math[i][1]].join(' · '):'Math step '+(i+1)):
   subject==='tg'?'The Good and the Beautiful · Lesson '+(13+i)+' · Writing Option 1':
   (bju[i]?bju[i][0]:'BJU reading '+(i+1));
   add(date,'✅ Completed lesson',name,subject==='math'?'Math':subject==='tg'?'Language Arts':'BJU Reading',[]);
  }
 }
 for(const [step,grade] of Object.entries(flow.practiceGrades||{})){
  if(!grade||!grade.at)continue;
  add(grade.at,'📐 Math grade','Practice '+(Number(step)+1)+' · '+grade.lastPercent+'%',grade.correct+'/'+grade.questionCount+' correct · best '+grade.bestPercent+'% · '+(grade.status||''),grade.answers?.length?[['Student answers',grade.answers.join(', ')]]:[]);
 }
 for(const [step,watched] of Object.entries(s.mathVideosWatched||{})){
  if(watched?.at)add(watched.at,'🎬 Math video','Video lesson watched',watched.lesson||'Math step '+(Number(step)+1));
 }
 for(const [title,draft] of Object.entries(s.bjuDrafts||{})){
  if(!draft?.updatedAt||s.bjuAnswers?.[title]?.submittedAt)continue;
  const answers=Object.entries(draft.answers||{}).filter(([,v])=>String(v).trim());
  if(!answers.length)continue;
  const detail=answers.map(([n,v])=>['Question '+(Number(n)+1)+': '+(draft.questions?.[Number(n)]||''),v]);
  add(draft.updatedAt,'✏️ BJU draft','In-progress reading: '+title,answers.length+' written answer(s), not submitted yet',detail);
 }
 for(const [step,session] of Object.entries(s.mathPracticeAttempts||{})){
  if(!session)continue;
  for(const rec of session.history||[]){
   add(rec.at||rec.date,'✏️ Math practice','Step '+(Number(step)+1)+' · '+(rec.correct?'correct':'needs review'),rec.question+' → '+rec.studentAnswer+(rec.hintUsed?' · used hint':''),rec.correctAnswer?[['Expected answer',rec.correctAnswer]]:[]);
  }
 }
 for(const [date,doneList] of Object.entries(s.dailyPlanRoutine||{})){
  const labels={prayer:'Morning prayer and goals',breakfast:'Breakfast',meds:'Morning medications',science:'Science',lunch:'Lunch',enrichment:'Social studies / science fair / co-op',pe:'PE and movement',creative:'Creative choice'};
  const yes=Object.entries(doneList||{}).filter(([,value])=>value).map(([key])=>labels[key]||key);
  if(yes.length)add(date,'☑️ Daily plan','Completed activities',yes.join(' · '));
 }
 for(const [date,doneList] of Object.entries(s.dailyPlanChecks||{})){
  if(s.dailyPlanRoutine?.[date])continue;
  const count=Object.values(doneList||{}).filter(Boolean).length;
  if(count)add(date,'☑️ Earlier daily plan','Completed daily checkboxes',count+' items checked (older format has no saved task labels)');
 }
 for(const [title,record] of Object.entries(s.bjuAnswers||{})){
  if(!record?.submittedAt)continue;
  const detail=(record.questions||[]).map((q,i)=>['Question '+(i+1)+': '+q,record.answers?.[i]||'(blank)']);
  add(record.submittedAt,'📚 BJU answers',title,'Submitted reading comprehension',detail);
 }
 for(const r of s.readingGrades||[]){
  if(!r?.at)continue;
  add(r.at,'📖 Reading grade',r.title||'Reading',r.score==null?'Completed':r.score+'% · '+(r.feedback||''),r.response?[['Gabriella’s explanation',r.response]]:[]);
 }
 for(const r of s.readingLog||[]){
  if(!r?.date)continue;
  add(r.date,'📕 Reading log',r.title||'Reading',[(r.type||''),(r.status||''),(r.assessment||'')].filter(Boolean).join(' · '));
 }
 for(const r of s.libraryBooks||[]){
  if(!r?.date)continue;
  add(r.date,'📗 Library book',r.title||'Untitled',[(r.author||''),(r.source||''),(r.notes||'')].filter(Boolean).join(' · '));
 }
 for(const r of s.chapterAssessments||[]){
  if(!r?.at)continue;
  add(r.at,'📊 Chapter assessment',r.chapter||'Math',r.pct+'% · '+r.correct+'/'+r.total,(r.answers||[]).map((x,i)=>['#'+(i+1)+' '+x.question, 'Gabriella: '+x.selected+' · Correct: '+x.correct+(x.isCorrect?' ✅':' ❌')]));
 }
 for(const r of s.sessions||[]){
  if(!r?.at)continue;
  const detail=[];
  if(r.question)detail.push(['Question',r.question]);
  if(r.studentAnswer!=null)detail.push(['Gabriella’s answer',r.studentAnswer]);
  if(r.expectedAnswer)detail.push(['Expected answer',r.expectedAnswer]);
  if(r.feedback)detail.push(['Feedback',r.feedback]);
  add(r.at,'🧠 Learning practice',r.skill||'Practice',[(r.ok===true?'Correct':r.ok===false?'Needs review':''),(r.hints?'Hint(s): '+r.hints:'Independent')].filter(Boolean).join(' · '),detail);
 }
 for(const [key,draft] of Object.entries(s.mathDaily||{})){
  const date=dayOf(key.split(':')[0]);if(!date)continue;
  const detail=(draft.answers||[]).map((answer,i)=>['Answer '+(i+1),String(answer||'')+(draft.work?.[i]?' · work: '+draft.work[i]:'')]);
  if(detail.some(([,v])=>v.trim()))add(date,'📝 Math workspace','Saved Math lesson work',detail.length+' answers/work areas',detail);
 }
 return items.sort((a,b)=>b.date.localeCompare(a.date));
}
let selected=new Date().toLocaleDateString('en-CA');
function render(){
 panel.replaceChildren();
 const title=el('h2','📓 Gabriella’s Daily Journal & Work History');panel.append(title);
 const note=el('p','See her gratitude in her own words, reading answers, grades, completed lessons, and saved practice, organized by date.','muted');panel.append(note);
 if(document.documentElement.dataset.cloudRole!=='parent'){
  const status=el('p','Sign in with your parent Google account to view Gabriella’s synced work. This report does not use the parent device’s local study data.','notice');panel.append(status);return;
 }
 const state=window.cloudberryStateApi?.exportState?.()||{},items=buildRecords(state);
 const gr=items.filter(x=>x.category==='💗 Gratitude');
 const overview=el('div');overview.style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin:12px 0';
 [['💗 Gratitude days',gr.length],['✅ Dated activities',items.length],['📝 BJU submissions',Object.values(state.bjuAnswers||{}).filter(x=>x?.submittedAt).length]].forEach(pair=>{
  const tile=el('div');tile.style.cssText='flex:1;min-width:130px;padding:12px;background:#fff;border:1px solid #dfe4f0;border-radius:12px';
  tile.append(el('b',pair[1]+' '+pair[0]));overview.append(tile);
 });panel.append(overview);
 const controls=el('div');controls.style.cssText='display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:14px 0';
 const label=el('label','Choose a school day:');label.htmlFor='momActivityDate';const pick=el('input');pick.type='date';pick.id='momActivityDate';pick.className='textinput';pick.style.cssText='max-width:210px';pick.value=selected;
 pick.onchange=()=>{selected=pick.value;render();};controls.append(label,pick);
 const dates=Array.from(new Set(items.map(x=>x.date)));
 if(dates.length){
  const jump=el('button','Most recent activity');jump.type='button';jump.className='soft';
  jump.onclick=()=>{selected=dates[0];render()};controls.append(jump);
 }
 panel.append(controls);
 const heading=el('h3','📅 '+pretty(selected));panel.append(heading);
 const todays=items.filter(x=>x.date===selected);
 if(!todays.length){panel.append(el('p','No work is recorded in the cloud for this date. This does not necessarily mean Gabriella did no work.','muted'));}
 todays.forEach((item,idx)=>{
  const row=el('details');row.className='logrow';row.style.cssText='padding:12px;margin:10px 0;background:white;border:1px solid #e3dce9;border-radius:12px';
  if(item.category==='💗 Gratitude'||idx===0)row.open=true;
  const summary=el('summary',item.category+' · '+item.title);summary.style.cssText='font-weight:750;cursor:pointer';row.append(summary);
  if(item.description)row.append(el('p',item.description));
  for(const [k,v] of item.detail||[]){const sub=el('p');sub.append(el('b',k+': '),document.createTextNode(asText(v)));row.append(sub);}
  panel.append(row);
 });
 panel.append(el('h3','💗 Gratitude journal — all saved dates'));
 if(!gr.length){panel.append(el('p','No gratitude entries have reached the cloud yet. Once Gabriella saves an entry while signed into her student account, it will appear here.','muted'));}
 gr.forEach(r=>{
  const div=el('div');div.className='logrow';div.style.cssText='margin:8px 0;padding:11px;background:white;border-radius:12px';
  div.append(el('b',pretty(r.date)));
  const para=el('p',r.description);para.style.cssText='white-space:pre-wrap;margin:6px 0';div.append(para);
  panel.append(div);
 });
 const sf=state.scienceFair;
 if(sf&&Object.keys(sf).length){
  const current=el('details');current.className='logrow';current.style.cssText='margin:12px 0;padding:12px;background:#fff';
  current.append(el('summary','🔬 Current science fair work (undated notes and measurements)'));
  const relevant=['dueDate','answers','trials','done'];
  for(const key of relevant){if(sf[key]!=null)current.append(el('p',key+': '+asText(sf[key])));}
  panel.append(current);
 }
 const help=el('p','Only information that the student app recorded and successfully synced can appear here. A Google Drive artwork upload, for example, is stored in Drive, not automatically in the Study Buddy cloud record.','tiny muted');
 panel.append(help);
}
window.addEventListener('cloudberry:remote-update',render);
window.addEventListener('cloudberry:parent-connected',render);
window.addEventListener('cloudberry:save',render);
document.querySelector('.tab[data-view="mom"]')?.addEventListener('click',render);
render();
})();
