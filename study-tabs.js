(()=>{'use strict';
const P=window.StudyPlanner,api=window.cloudberryStateApi,$=id=>document.getElementById(id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let ownSave=false;
const persist=()=>{const state=api.exportState();ownSave=true;try{api.importState(state);window.dispatchEvent(new CustomEvent('cloudberry:save',{detail:JSON.parse(JSON.stringify(state))}))}finally{ownSave=false}};
$('science-fair').append($('scienceFairLab'));
const legacy=window.cloudberryScienceLab.get();
if(!api.exportState().scienceFair){api.exportState().scienceFair={...legacy,dueDate:legacy.dates?.[7]||''};persist()}
window.cloudberrySaveScience=data=>{api.exportState().scienceFair={...api.exportState().scienceFair,...data};persist()};
const daily=document.createElement('section');daily.id='scienceDailyTasks'; // Science tasks live in the Science Fair tab, not Today.
const mathPlan=document.createElement('p');mathPlan.id='mathPlanLink'; // No obsolete Chapter 2 link on Today.
const parent=document.createElement('section');parent.className='section card';parent.id='parentStudyWork';$('mom').append(parent);
const due=$('sfDueDate');due.addEventListener('change',()=>{if(due.value&&!P.parse(due.value))return;const sf=api.exportState().scienceFair;sf.dueDate=due.value;persist()});
function renderScience(){
 const sf=api.exportState().scienceFair||{};due.value=sf.dueDate||'';
 window.cloudberryScienceLab.refresh(sf);
 const schedule=P.schedule(sf.dueDate);$('sfScheduleStatus').textContent=!schedule.length?'Due date unconfirmed. Explore the lessons and experiment; dated tasks will appear once a date is set.':sf.dueDate<P.iso()?'The project due date has passed. Complete remaining work or update the official due date.':schedule[0].date<P.iso()?'Some preparation dates have passed. Unfinished tasks are in today’s catch-up plan.':'Your milestones are planned backwards from '+sf.dueDate+'.';
 $('sfDates').replaceChildren();schedule.forEach(t=>{const label=document.createElement('label');label.className='task';const check=document.createElement('input');check.type='checkbox';check.checked=!!sf.done?.[t.id];check.onchange=()=>{sf.done={...sf.done,[t.id]:check.checked};persist()};label.append(check,document.createTextNode(`${t.date} · ${t.title}`));$('sfDates').append(label)});
 const tasks=P.tasksForDay(sf);daily.innerHTML='<h3>🌳 Today’s science fair work</h3>';
 if(!schedule.length)daily.insertAdjacentHTML('beforeend','<p class="muted">Awaiting the project due date. Set it in Science Fair to create your plan.</p>');
 else if(!tasks.length)daily.insertAdjacentHTML('beforeend','<p class="muted">No science fair tasks due today.</p>');
 tasks.forEach(t=>{const label=document.createElement('label');label.className='task';const check=document.createElement('input');check.type='checkbox';check.onchange=()=>{sf.done={...sf.done,[t.id]:true};persist()};label.append(check,document.createTextNode((t.overdue?'Catch up · ':'')+t.title+(t.overdue?' (scheduled '+t.date+')':'')));daily.append(label)});
 const link=document.createElement('button');link.className='soft';link.textContent='Open Science Fair →';link.onclick=()=>document.querySelector('[data-view="science-fair"]').click();daily.append(link);
}
let renderedKey='',saveTimer;
function renderMath(force=false){
 return; // Superseded by current Chapter 3 common-multiples work in Math tab.
 const state=api.exportState(),day=P.iso(),lesson=state.mathLesson??0,key=day+':'+lesson;
 mathPlan.replaceChildren();const link=document.createElement('button');link.className='soft';link.textContent=`🔢 Daily math practice · Chapter 2 · Lesson ${lesson+1}: ${P.lessons[lesson]} →`;link.onclick=()=>document.querySelector('[data-view="math"]').click();mathPlan.append(link);
 if(!force&&renderedKey===key)return;renderedKey=key;
 const draft=state.mathDaily?.[key]||{answers:['','',''],work:['','',''],hints:[false,false,false]},questions=P.questions(day,lesson);
 const host=$('dailyMath');host.innerHTML='<h2>Today’s lesson practice</h2><p>Current textbook assignment: Chapter 2, problems 2, 3 and 5. Select the lesson you are studying; it stays selected until you change it. New original questions appear each day.</p><label for="dailyMathLesson">Chapter 2 · Addition and Subtraction · lesson</label><select class="select" id="dailyMathLesson">'+P.lessons.map((x,i)=>`<option value="${i}">${i+1}. ${safe(x)}</option>`).join('')+'</select><p class="tiny muted">Original supplemental practice aligned to the lesson topics, not copied textbook problems. Chapter checks below cover all nine chapters.</p><form id="dailyMathForm"></form><p id="dailyMathResult" role="status"></p>';
 const select=$('dailyMathLesson');select.value=lesson;select.onchange=()=>{clearTimeout(saveTimer);store();api.exportState().mathLesson=Number(select.value);persist();renderMath(true)};
 function store(){api.exportState().mathDaily={...api.exportState().mathDaily,[key]:draft}}
 function saveDraft(){store();clearTimeout(saveTimer);saveTimer=setTimeout(persist,350)}
 const form=$('dailyMathForm');questions.forEach((q,i)=>{const card=document.createElement('div');card.className='quizbox';card.innerHTML=`<label for="dailyAnswer${i}"><b>${i+1}. ${safe(q.q)}</b></label><input id="dailyAnswer${i}" inputmode="numeric" autocomplete="off" required aria-label="Answer ${i+1}" value="${safe(draft.answers[i])}"><label for="dailyWork${i}">Show your work: regrouping, equations or a bar model</label><textarea id="dailyWork${i}" rows="4" style="width:100%;background-image:linear-gradient(#eee 1px,transparent 1px),linear-gradient(90deg,#eee 1px,transparent 1px);background-size:24px 24px" placeholder="Type your steps here, or use your device’s handwriting keyboard.">${safe(draft.work[i])}</textarea><button type="button" class="soft">💡 Hint</button><p class="tiny" id="dailyHint${i}"></p>`;
 card.querySelector('input').oninput=e=>{draft.answers[i]=e.target.value;saveDraft()};card.querySelector('textarea').oninput=e=>{draft.work[i]=e.target.value;saveDraft()};card.querySelector('button').onclick=()=>{draft.hints[i]=true;$('dailyHint'+i).textContent=q.hint;saveDraft()};form.append(card);if(draft.hints[i])$('dailyHint'+i).textContent=q.hint});
 const submit=document.createElement('button');submit.className='primary';submit.textContent='Check today’s practice';form.append(submit);
 function result(){if(draft.submittedAt)$('dailyMathResult').textContent=`Saved practice: ${draft.correct}/3 correct. Mom can review your answers, hints and written work. You may revise and check again.`}result();
 form.onsubmit=e=>{e.preventDefault();clearTimeout(saveTimer);draft.correct=questions.filter((q,i)=>/^\d+$/.test(draft.answers[i].replaceAll(',','').trim())&&Number(draft.answers[i].replaceAll(',','').trim())===q.a).length;draft.submittedAt=new Date().toISOString();draft.questions=questions;store();persist();result();questions.forEach((q,i)=>{$('dailyHint'+i).textContent=(Number(draft.answers[i].replaceAll(',','').trim())===q.a?'✓ Correct.':'Try again. Expected: '+q.a+'. ')+q.hint})};
}
function renderParent(){const state=api.exportState(),sf=state.scienceFair||{};parent.innerHTML='<h2>Math & Science Fair work</h2><h3>Daily lesson math</h3>';
 Object.entries(state.mathDaily||{}).sort(([a],[b])=>b.localeCompare(a)).slice(0,30).forEach(([key,d])=>{const lesson=Number(key.split(':')[1]),details=document.createElement('details');details.innerHTML=`<summary>${safe(key.split(':')[0])} · Chapter 2, Lesson ${lesson+1}: ${safe(P.lessons[lesson])} · ${d.submittedAt?d.correct+'/3':'Draft'}</summary>`;P.questions(key.split(':')[0],lesson).forEach((q,i)=>{const p=document.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=`${q.q}\nAnswer: ${d.answers[i]||'Not answered'} · Expected: ${q.a}\nHint used: ${d.hints[i]?'Yes':'No'}\nWork: ${d.work[i]||'No written work yet'}`;details.append(p)});parent.append(details)});
 if(!Object.keys(state.mathDaily||{}).length)parent.insertAdjacentHTML('beforeend','<p>No daily math work saved yet.</p>');
 const science=document.createElement('div');science.innerHTML='<h3>Science fair</h3><p>Due date: '+safe(sf.dueDate||'Unconfirmed')+'</p>'+P.schedule(sf.dueDate).map(t=>`<p>${sf.done?.[t.id]?'✓':'○'} ${safe(t.date)} · ${safe(t.title)}</p>`).join('');
 Object.entries(sf.answers||{}).forEach(([i,a])=>{const p=document.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=`Lesson ${Number(i)+1} reflection: ${a}`;science.append(p)});
 const measures=document.createElement('p');measures.textContent='Runoff measurements (mL): '+Array.from({length:3},(_,i)=>`Trial ${i+1}: A ${sf.trials?.[i*2]??'—'}, B ${sf.trials?.[i*2+1]??'—'}`).join(' · ');science.append(measures);parent.append(science);
}
let scienceStamp='';function refresh(){const stamp=JSON.stringify(api.exportState().scienceFair);if(stamp!==scienceStamp){scienceStamp=stamp;renderScience()}renderMath();renderParent()}
window.addEventListener('cloudberry:remote-update',()=>{if(!ownSave)renderedKey='';refresh()});window.addEventListener('cloudberry:save',refresh);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){renderedKey='';scienceStamp='';refresh()}});
document.querySelector('[data-view="math"]').addEventListener('click',()=>renderMath());
// Keep the current lesson shortcut in Today without adding science fair project cards.
document.querySelectorAll('#subjectCards .subject').forEach(card=>{if(card.textContent.includes('Math'))card.onclick=()=>document.querySelector('[data-view="math"]').click()});
refresh();
})();
