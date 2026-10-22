/* Cloudberry Academy subject progression — 2026-10-22 to 2026-11-14.
 * Every subject advances only after Gabriella explicitly checks its daily box.
 * Work completed today unlocks the next item on the next school day.
 */
(function () {
'use strict';
var KEY = 'cloudberry-subject-flow-v1';
var START = '2026-10-22';
var mathSteps = [
 ['4A Ch 3, Lesson 2','Common multiples','5 problems; then a brief estimation check'],
 ['4A Ch 3, Lessons 3 & 5','Factors and common factors','Both lessons together as requested'],
 ['4A Ch 3, Lesson 4','Prime and composite numbers','Use factor pairs to classify numbers'],
 ['4A Ch 4, Lessons 1 & 2','Textbook lessons 1 and 2','Work both Singapore lesson examples'],
 ['4A Ch 4, Lesson 3','Textbook lesson 3','Practice multiplication and show steps'],
 ['4A Ch 4, Practice','Estimation and multiplication','Mixed review'],
 ['4A Ch 4, Lesson 5','Textbook lesson 5','Follow the textbook and demonstrate understanding'],
 ['4A Ch 4, Lesson 6','Textbook lesson 6','Follow the textbook and demonstrate understanding'],
 ['4A Ch 4, Lesson 7','Textbook lesson 7','Follow the textbook and demonstrate understanding'],
 ['4A Ch 4, Practice','Multiplication and estimation','Review, correct mistakes, ask for help if needed'],
 ['4A Ch 5, Lesson 1','Chapter 5 · Lesson 1','Topic and video pending chapter-title photos'],
 ['4A Ch 5, Lesson 2','Chapter 5 · Lesson 2','Topic and video pending chapter-title photos'],
 ['4A Ch 5, Lesson 3','Chapter 5 · Lesson 3','Topic and video pending chapter-title photos'],
 ['4A Ch 5, Lesson 4 · Practice','Chapter 5 practice','70% or higher required to proceed; parent-supplied questions'],
 ['4A Ch 5, Lesson 5','Chapter 5 · Lesson 5','Topic and video pending chapter-title photos'],
 ['4A Ch 5, Lesson 6','Chapter 5 · Lesson 6','Topic and video pending chapter-title photos'],
 ['4A Ch 5, Lesson 7 · Practice','Chapter 5 Lesson 7 + practice','Practice assessment; 70% or higher required to proceed']
];
/* Short, directly linked topic lessons. One or two videos per unlocked Math lesson. */
var mathVideos = [
 [['Math Antics • Least Common Multiple (basic method)','https://www.youtube.com/watch?v=Nu6AC6X3_E4']],
 [['Math Antics • Greatest Common Factor','https://www.youtube.com/watch?v=CUEOL3_Wm3Y'],['Math Antics • Prime Factorization','https://www.youtube.com/watch?v=XGbOiYhHY2c']],
 [['Khan Academy • Prime and composite numbers','https://www.youtube.com/watch?v=3h4UK62Qrbo']],
 [['Math Antics • Multi-Digit Multiplication, Part 1','https://www.youtube.com/watch?v=FJ5qLWP3Fqo']],
 [['Math Antics • Multi-Digit Multiplication, Part 1','https://www.youtube.com/watch?v=FJ5qLWP3Fqo']],
 [['Math Antics • Rounding','https://www.youtube.com/watch?v=fd-E18EqSVk'],['Math Antics • Multi-Digit Multiplication, Part 1','https://www.youtube.com/watch?v=FJ5qLWP3Fqo']],
 [['Math Antics • Multi-Digit Multiplication, Part 2','https://www.youtube.com/watch?v=RVYwunbpMHA']],
 [['Math Antics • Multi-Digit Multiplication, Part 2','https://www.youtube.com/watch?v=RVYwunbpMHA']],
 [['Math Antics • Multi-Digit Multiplication, Part 2','https://www.youtube.com/watch?v=RVYwunbpMHA']],
 [['Math Antics • Rounding','https://www.youtube.com/watch?v=fd-E18EqSVk'],['Math Antics • Multi-Digit Multiplication, Part 2','https://www.youtube.com/watch?v=RVYwunbpMHA']],
 [],
 [],
 [],
 [],
 [],
 [],
 []

];
var bjuSteps = [
 ['The Beginning of the Armadillos',90,'Fantasy'],
 ['Nanabozho Makes the Earth',102,'Myth'],
 ['The Wonderful Flight to the Mushroom Planet',108,'Science fiction'],
 ['The Wind and the Sun',142,'Fable'],
 ['Feathers',144,'Folktale'],
 ['The Bridge',156,'Poetry'],
 ['From Vanity Fair to Doubting Castle',158,'Allegory'],
 ['I Was Dreaming to Come to America',192,'Oral history'],
 ['Ellis Island: New Hope in a New Land',180,'Informational text'],
 ['What I Had Was Singing: The Story of Marian Anderson',214,'Biography'],
 ['I Hear America Singing',228,'Poetry'],
 ['Thanks a Million',244,'Poetry'],
 ['The Queen Who Saved Her People',466,'Bible account'],
 ['The Spirit of ’76',240,'Informational text'],
 ['By the Dawn’s Early Light',230,'Narrative nonfiction'],
 ['Let’s Roll!: Ordinary People, Extraordinary Courage',478,'Biography'],
 ['Moon over Tennessee',446,'Free verse narrative']
];
var tgSteps = Array.from({length:17},function(_,i){return ['Grade 5, Lesson '+(13+i),'Writing: Option 1','https://courses.goodandbeautiful.com/'];});
var qs = {
  0:[['LCM of 2 and 3?',6,'List the multiples of 2 and 3.'],['LCM of 3 and 4?',12,'Count by 3 and by 4 until they meet.'],['LCM of 4 and 6?',12,'List multiples for each.'],['LCM of 5 and 8?',40,'Skip count by 5 and by 8.'],['LCM of 6 and 9?',18,'Find their first shared multiple.']],
  1:[['Greatest common factor of 12 and 18?',6,'List factor pairs.'],['Greatest common factor of 8 and 20?',4,'List factors of 8 and 20.'],['Greatest common factor of 9 and 15?',3,'What divides both?'],['How many factors does 7 have?',2,'Try 1 and 7.'],['Greatest common factor of 16 and 24?',8,'List factors of both.']],
  2:[['Is 29 prime or composite?','prime','Only 1 and itself divide a prime.'],['Is 21 prime or composite?','composite','Try dividing by 3.'],['Is 2 prime or composite?','prime','2 is the only even prime.'],['Is 49 prime or composite?','composite','7 times 7.'],['Is 31 prime or composite?','prime','Check factors.']],
  3:[['7 × 6',42,'Break apart 7 × (5+1).'],['8 × 4',32,'Double, then double.'],['12 × 3',36,'(10×3)+(2×3).'],['9 × 6',54,'(10×6)-6.'],['14 × 2',28,'Double fourteen.']],
  4:[['23 × 3',69,'Multiply ones, then tens.'],['42 × 4',168,'Four groups of forty-two.'],['16 × 5',80,'Use (10×5)+(6×5).'],['34 × 2',68,'Double thirty-four.'],['27 × 3',81,'Multiply each place.']],
  5:[['Estimate 48 × 6 by 50 × 6',300,'Round 48 to 50.'],['Estimate 19 × 8 by 20 × 8',160,'Round 19 to 20.'],['24 × 4',96,'Break into 20×4 and 4×4.'],['37 × 2',74,'Double 37.'],['Estimate 101 × 7 by 100 × 7',700,'Round to 100.']],
  6:[['64 × 3',192,'60×3 plus 4×3.'],['125 × 2',250,'Double 125.'],['48 × 4',192,'Multiply and regroup.'],['215 × 3',645,'Multiply by each place value.'],['92 × 5',460,'(90×5)+(2×5).']],
  7:[['106 × 4',424,'Split 100, 0, and 6.'],['234 × 3',702,'Hundreds, tens, ones.'],['135 × 5',675,'Break into hundreds/tens/ones.'],['207 × 2',414,'Double 207.'],['416 × 2',832,'Multiply by place value.']],
  8:[['314 × 2',628,'Use vertical multiplication.'],['128 × 4',512,'Multiply ones and regroup.'],['609 × 3',1827,'Remember the zero in the tens.'],['245 × 2',490,'Double 245.'],['306 × 5',1530,'Multiply by each place.']],
  9:[['Estimate 52 × 3 as 50 × 3',150,'Round 52 to 50.'],['83 × 2',166,'Double 83.'],['Estimate 197 × 4 as 200 × 4',800,'Round 197 to 200.'],['36 × 7',252,'Break apart 30 and 6.'],['124 × 3',372,'Multiply by place value.']]
};

/* Official textbook-based practice problems will be added when Mom provides photos/questions.
 * Format: [question, correct answer, optional hint]. Do not fill with guessed textbook content.
 * Chapter 4 practice: steps 6 and 10. Chapter 5: Lesson 4 practice and Lesson 7 practice.
 */
var practiceBanks = {5:[],9:[],13:[],16:[]};
var PRACTICE_MINIMUM=70;
function isPractice(idx){return Object.prototype.hasOwnProperty.call(practiceBanks,idx);}
function practiceBankId(idx){return (practiceBanks[idx]||[]).map(function(q){return String(q[0]);}).join('|');}
function practiceGrade(idx){var d=data(),r=(d.practiceGrades||{})[idx];return r||null;}
function practicePassed(idx){
 var bank=practiceBanks[idx],r=practiceGrade(idx);
 return !!(bank&&bank.length&&r&&r.setId===practiceBankId(idx)&&r.questionCount===bank.length&&r.bestPercent>=PRACTICE_MINIMUM);
}
function saveGrade(idx,answers){
 var bank=practiceBanks[idx]||[];
 if(!bank.length||answers.length!==bank.length) return null;
 var norm=function(x){return String(x).trim().toLowerCase().replace(/,/g,'').replace(/\s+/g,' ');};
 var correct=bank.filter(function(q,i){return norm(answers[i])===norm(q[1]);}).length;
 var pct=Math.round(correct*100/bank.length);
 var flow=clone(data()),past=(flow.practiceGrades||{})[idx]||{};
 var bankId=practiceBankId(idx),best=(past.setId===bankId)?Math.max(past.bestPercent||0,pct):pct;
 flow.practiceGrades=flow.practiceGrades||{};
 flow.practiceGrades[idx]={lastPercent:pct,bestPercent:best,correct:correct,questionCount:bank.length,setId:bankId,at:new Date().toISOString(),answers:answers.slice(),status:best>=PRACTICE_MINIMUM?'Passed':'Needs more practice'};
 localStorage.setItem(KEY,JSON.stringify(flow));
 var api=window.cloudberryStateApi;if(api){var st=api.exportState();st.subjectFlow=flow;api.importState(st);window.dispatchEvent(new CustomEvent('cloudberry:save',{detail:clone(api.exportState())}));}
 return flow.practiceGrades[idx];
}
function practiceView(panel,idx){
 var bank=practiceBanks[idx]||[],grade=practiceGrade(idx),status=document.createElement('section');
 status.className='quizbox';status.style.margin='16px 0';
 var h=document.createElement('h3');h.textContent='📝 Graded practice · 70% required';status.append(h);
 var p=document.createElement('p');p.textContent='Gabriella completes the questions here in Study Buddy. She must score at least 70% AND check Math finished in Today to advance on the next school day.';status.append(p);
 if(!bank.length){
   var wait=document.createElement('p');wait.className='notice';
   wait.textContent='⏳ Practice problems are awaiting Mom’s photos/questions. This checkpoint is locked until the official questions are added; it will not use invented textbook questions.';
   status.append(wait);
 }else{
   if(grade&&grade.setId===practiceBankId(idx)){
     var prior=document.createElement('p');prior.className='notice';
     prior.textContent='Latest grade: '+grade.lastPercent+'% · Best: '+grade.bestPercent+'% · '+(practicePassed(idx)?'✅ Passed. Check Math finished on Today to advance.':'Keep practicing and retry until you reach 70%.');
     status.append(prior);
   }
   var form=document.createElement('form'),inputs=[];
   bank.forEach(function(q,n){
     var block=document.createElement('div');block.className='logrow';block.style.margin='10px 0';
     var label=document.createElement('label');label.textContent=(n+1)+'. '+q[0];label.style.cssText='display:block;font-weight:700';
     var entry=document.createElement('input');entry.className='textinput';entry.required=true;entry.autocomplete='off';entry.setAttribute('aria-label','Answer practice question '+(n+1));
     inputs.push(entry);block.append(label,entry);form.append(block);
   });
   var submit=document.createElement('button');submit.type='submit';submit.className='primary';submit.textContent='Grade my practice';
   var feedback=document.createElement('p');feedback.setAttribute('role','status');form.append(submit,feedback);
   form.onsubmit=function(e){e.preventDefault();var answers=inputs.map(function(x){return x.value.trim();});if(answers.some(function(a){return !a;})){feedback.textContent='Answer every question before grading.';return;}
     var g=saveGrade(idx,answers);
     feedback.textContent='Score: '+g.lastPercent+'% ('+g.correct+'/'+g.questionCount+'). '+(g.bestPercent>=70?'✅ You passed! Check Math finished on Today; the next lesson opens on the next school day.':'You need at least 70%. Review your steps and try again.');
   };
   status.append(form);
 }
 panel.append(status);
}
function iso(d){d=d||new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function isSchool(d){return d.getDay()!==0&&d.getDay()!==6;}
function clone(obj){return JSON.parse(JSON.stringify(obj));}
function data(){var api=window.cloudberryStateApi;var state=api&&api.exportState();var stored={};try{stored=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){}
return state&&state.subjectFlow&&typeof state.subjectFlow==='object'?state.subjectFlow:stored;}
function doneMap(){var d=data();return d.done||{math:{},tg:{},bju:{}};}
function currentIndex(subject,date){var marks=doneMap()[subject]||{};var i=0;while(i<17&&marks[i]&&marks[i]<date&&(!isPractice(i)||practicePassed(i)))i++;return Math.min(i,16);}
function item(subject,date){date=date||iso();var idx=currentIndex(subject,date);if(subject==='math')return {idx:idx,title:'Singapore Dimensions Math 4A · '+mathSteps[idx][0]+': '+mathSteps[idx][1],topic:mathSteps[idx][1],notes:mathSteps[idx][2]};if(subject==='tg')return {idx:idx,title:'The Good and the Beautiful Grade 5 · Lesson '+(13+idx)+' · Writing Option 1',url:'https://courses.goodandbeautiful.com/'};
var b=bjuSteps[idx];return {idx:idx,title:'BJU Reading 5 · '+b[0]+' · p. '+b[1],story:b[0],page:b[1],genre:b[2],assigned:[''+date,b[0],b[1],b[2]]};}
function checked(subject,date){var x=item(subject,date),marks=doneMap()[subject]||{};return marks[x.idx]===date;}
function saveCheck(subject,date,isDone){
var api=window.cloudberryStateApi,st=api&&api.exportState(),flow=clone(data());flow.done=flow.done||{};
flow.done[subject]=flow.done[subject]||{};
var idx=item(subject,date).idx;
if(isDone&&subject==='math'&&isPractice(idx)&&!practicePassed(idx))return false;
if(isDone)flow.done[subject][idx]=date;else if(flow.done[subject][idx]===date)delete flow.done[subject][idx];
localStorage.setItem(KEY,JSON.stringify(flow));
if(st&&api){st.subjectFlow=flow;api.importState(st);window.dispatchEvent(new CustomEvent('cloudberry:save',{detail:clone(api.exportState())}));}
return true;
}
function itemForDate(subject,date){return subject==='bju'?item('bju',date).assigned:item(subject,date);}
function mount(box){
function render(){
 var now=new Date(),date=iso(now),weekend=!isSchool(now),coop=now.getDay()===2;
 box.replaceChildren();
 var summary=document.createElement('p');
 summary.innerHTML='<b>'+new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric'}).format(now)+'</b> · Gabriella checks each item when finished';
 box.append(summary);
 if(weekend){var off=document.createElement('p');off.className='notice';off.textContent='Weekend — no new lessons. Unfinished work will still be here on the next school day.';box.append(off);return;}
 var lines=[
 ['prayer','🙏','11:00','Prayer and daily goals',null],
 ['breakfast','🍽️','11:15','Breakfast',null],
 ['meds','💊','','AM medicines — mark only after taken',null],
 ['tg','📖','11:35',item('tg',date).title,item('tg',date).url],
 ['bju','📚','12:10',item('bju',date).title,'#bju-tab'],
 ['science','🔬','12:35','Miacademy Structures of Science · assigned lesson','https://miacademy.co/login?Flavor=Practice&isAssignmentMode=False'],
 ['lunch','🥗','1:15','Lunch and break',null],
 ['math','➗','2:00',item('math',date).title,'#math'],
 ['enrichment',coop?'🧪':'🌎','2:45',coop?'Co-op: science, cryptology, Strong Minds and clay':(now.getDay()===1||now.getDay()===3||now.getDay()===5?'Miacademy social studies':'Science Fair · Saving the Trees'),'#science-fair'],
 ['pe','🏃','3:15','PE and movement',null],
 ['creative','🎨','','Optional creative choice',null]
 ];
 var completed=0,routine={};try{routine=JSON.parse(localStorage.getItem('cloudberry-routine-'+date)||'{}')}catch(e){}
 var list=document.createElement('div');list.style.cssText='display:grid;gap:9px';
 lines.forEach(function(line){
 var id=line[0],r=document.createElement('label');r.className='task';r.style.cssText='display:flex;gap:12px;align-items:center;padding:12px';
 var c=document.createElement('input');c.type='checkbox';c.style.cssText='width:21px;height:21px;flex-shrink:0';
 var isSubject=id==='math'||id==='tg'||id==='bju';c.checked=isSubject?checked(id,date):!!routine[id];if(c.checked)completed++;
 var label=document.createElement('span');label.style.flex='1';label.style.overflowWrap='anywhere';
 var words=(line[2]?line[2]+' · ':'')+line[1]+' '+line[3]+(id==='math'&&isPractice(item('math',date).idx)?(practicePassed(item('math',date).idx)?' · ✅ Practice passed':' · 🔒 70% required'):'');
 if(line[4]){
  var a=document.createElement('a');a.textContent=words+' ↗';a.href=line[4].startsWith('#')?line[4]:line[4];if(line[4].startsWith('#')){a.onclick=function(e){e.preventDefault();document.querySelector('.tab[data-view="'+line[4].slice(1)+'"]')?.click();};}else{a.target='_blank';a.rel='noopener noreferrer';}label.append(a);
 }else label.textContent=words;
 c.onchange=function(){
   if(isSubject){var accepted=saveCheck(id,date,c.checked);if(accepted===false){c.checked=false;var reminder=document.getElementById('practiceGateMessage');if(!reminder){reminder=document.createElement('p');reminder.id='practiceGateMessage';reminder.className='notice';box.insertBefore(reminder,list);}reminder.textContent='Math practice is still locked. Complete the in-app assessment and earn at least 70% before checking this lesson finished.';return;}}
   else{routine[id]=c.checked;localStorage.setItem('cloudberry-routine-'+date,JSON.stringify(routine));var api=window.cloudberryStateApi;if(api){var st=api.exportState();st.dailyPlanRoutine=st.dailyPlanRoutine||{};st.dailyPlanRoutine[date]=clone(routine);api.importState(st);window.dispatchEvent(new CustomEvent('cloudberry:save',{detail:clone(api.exportState())}));}}
   render();
 };
 r.append(c,label);list.append(r);
 });
 var count=document.createElement('p');count.className='tiny muted';count.textContent=completed+' of '+lines.length+' finished • A completed lesson advances on the NEXT school day only.';
 box.append(count,list);
 var note=document.createElement('p');note.className='tiny muted';note.textContent='If Math, BJU, or The Good and the Beautiful is not checked, that subject remains on the same lesson tomorrow. Weekends do not move the queue.';box.append(note);
}
render();
var active=false;
function refresh(){if(active)return;active=true;try{render();}finally{active=false;}}
window.addEventListener('cloudberry:remote-update',refresh);
document.addEventListener('visibilitychange',function(){if(!document.hidden)refresh()});
}
function renderMath(){
var math=document.getElementById('math');if(!math)return;
['mathAnticsFeatured','chapter2Estimation','dailyMath','commonMultiplesLesson'].forEach(function(id){var old=document.getElementById(id);if(old)old.remove();});
var oldText=math.querySelector('p');if(oldText&&/Chapter 2/.test(oldText.textContent))oldText.textContent='Singapore Dimensions Math 4A · lesson-by-lesson';
var panel=document.getElementById('flowMathLesson');
if(!panel){panel=document.createElement('section');panel.id='flowMathLesson';panel.className='section card';math.insertBefore(panel,math.firstChild);}
var d=iso(),i=item('math',d),idx=i.idx,arr=isPractice(idx)?[]:(qs[idx]||[]);
var attempts={};try{attempts=JSON.parse(localStorage.getItem('cloudberry-math-attempts-'+idx)||'{}')}catch(e){}
panel.replaceChildren();
var h=document.createElement('h2');h.textContent='🔢 '+i.title;panel.append(h);
var p=document.createElement('p');p.textContent='Follow the Singapore textbook examples. '+i.notes+'. Work through FIVE independent questions below. Checking your Math lesson in Today is the only way to unlock the next lesson.';panel.append(p);
// Video of the lesson stays with the current topic if she needs another day.
var lessonVideos=mathVideos[idx]||mathVideos[mathVideos.length-1];
var lessonBox=document.createElement('section');lessonBox.className='quizbox';lessonBox.style.cssText='margin:16px 0;background:#f2f4ff;border:1px solid #d9daf8';
var videoHeading=document.createElement('h3');videoHeading.textContent='🎬 Watch before practicing • '+i.topic;lessonBox.append(videoHeading);
var guidance=document.createElement('p');guidance.className='tiny muted';guidance.textContent='Start with the first video. When two videos are listed, watch both for this combined lesson. These are supplemental skill videos, not official Singapore textbook videos.';lessonBox.append(guidance);
if(!lessonVideos.length){var pendingVideo=document.createElement('p');pendingVideo.className='notice';pendingVideo.textContent='Chapter 5 video pending: Mom will provide chapter and lesson title photos so the correct topic video can be matched. No unrelated video will be assigned.';lessonBox.append(pendingVideo);}
lessonVideos.forEach(function(v,n){var link=document.createElement('a');link.className='soft';link.style.cssText='display:block;margin:8px 0;padding:11px 14px;text-decoration:none';link.href=v[1];link.target='_blank';link.rel='noopener noreferrer';link.textContent='▶ Video '+(n+1)+': '+v[0]+' ↗';lessonBox.append(link);});
var videoLabel=document.createElement('label');videoLabel.style.cssText='display:flex;align-items:center;gap:9px;margin:12px 0 0';
var watched=document.createElement('input');watched.type='checkbox';watched.style.cssText='width:20px;height:20px;accent-color:#56856e';
var watchedKey='cloudberry-math-videos-watched-'+idx;
watched.checked=localStorage.getItem(watchedKey)==='yes';
watched.onchange=function(){localStorage.setItem(watchedKey,watched.checked?'yes':'no');};
videoLabel.append(watched,document.createTextNode('I watched the video lesson and am ready for the 5 problems.'));
lessonBox.append(videoLabel);
panel.append(lessonBox);
if(isPractice(idx)){practiceView(panel,idx);return;}
if(!arr.length){var pending=document.createElement('p');pending.className='notice';pending.textContent='The Chapter 5 topic and practice questions will be filled in after Mom sends the textbook photos. The lesson stays here until completed.';panel.append(pending);return;}
var correctCount=0;
arr.forEach(function(q,k){
 var div=document.createElement('div');div.className='quizbox';div.style.margin='12px 0';
 var strong=document.createElement('b');strong.textContent=(k+1)+'. '+q[0];div.append(strong);
 var input=document.createElement('input');input.className='textinput';input.setAttribute('aria-label','Answer question '+(k+1));input.placeholder='Type your answer';input.value=attempts[k]?.value||'';
 var status=document.createElement('p');status.className='tiny';
 if(attempts[k]?.correct){correctCount++;status.textContent='✅ Correct!';}
 else if(attempts[k])status.textContent='Not quite. Use the hint and try again.';
 var check=document.createElement('button');check.type='button';check.className='soft';check.textContent='Check answer';
 check.onclick=function(){var v=input.value.trim().toLowerCase().replace(/,/g,'');var answer=String(q[1]).toLowerCase();attempts[k]={value:input.value,correct:v===answer};localStorage.setItem('cloudberry-math-attempts-'+idx,JSON.stringify(attempts));renderMath();};
 var hint=document.createElement('button');hint.type='button';hint.className='soft';hint.style.marginLeft='8px';hint.textContent='Hint';
 hint.onclick=function(){status.textContent='💡 '+q[2];};
 div.append(input,check,hint,status);panel.append(div);
});
var footer=document.createElement('p');footer.className='notice';footer.textContent=correctCount+'/5 correct. '+(correctCount===5?'Great! Complete the short review below when shown, then check Math finished in Today.':'Keep practicing; five attempts help us assess understanding.');panel.append(footer);
if(idx===0&&correctCount===5){
 var section=document.createElement('section');section.className='quizbox';section.innerHTML='<h3>⭐ Quick estimation check</h3><p>Estimate 497 + 201 by rounding each number to the nearest hundred.</p><input class="textinput" type="number" placeholder="Estimated sum" aria-label="Estimated sum"><button type="button" class="soft">Check</button><p aria-live="polite"></p>';
 section.querySelector('button').onclick=function(){section.querySelector('p:last-child').textContent=Number(section.querySelector('input').value)===700?'✅ Correct: 500 + 200 ≈ 700.':'Round 497 to 500 and 201 to 200, then add.';};panel.append(section);
}
}

function showPracticeGrades(){
var mom=document.getElementById('mom');if(!mom)return;
var host=document.getElementById('flowPracticeGrades');
if(!host){host=document.createElement('section');host.id='flowPracticeGrades';host.className='section card';mom.prepend(host);}
host.replaceChildren();
var h=document.createElement('h2');h.textContent='📝 Math practice checkpoints • 70% to pass';host.append(h);
var sub=document.createElement('p');sub.className='muted tiny';sub.textContent='Official question sets come from Mom. The student must earn at least 70% and check Today complete before advancing.';host.append(sub);
[[5,'Step 6 • Chapter 4 Practice'],[9,'Step 10 • Chapter 4 Practice'],[13,'Step 14 • Chapter 5 Lesson 4 Practice'],[16,'Step 17 • Chapter 5 Lesson 7 Practice']].forEach(function(x){
 var r=document.createElement('div');r.className='logrow';r.style.margin='8px 0';
 var grade=practiceGrade(x[0]),title=document.createElement('b');title.textContent=x[1];r.append(title);
 var info=document.createElement('p');info.className='tiny muted';info.textContent=!practiceBanks[x[0]].length?'Awaiting problem photos — locked':grade&&grade.setId===practiceBankId(x[0])?('Last: '+grade.lastPercent+'% • Best: '+grade.bestPercent+'% • '+(practicePassed(x[0])?'PASSED':'Not yet passed')):'No grade yet — locked';
 r.append(info);host.append(r);
});
}
document.addEventListener('DOMContentLoaded',showPracticeGrades);
window.addEventListener('cloudberry:save',showPracticeGrades);
window.addEventListener('cloudberry:remote-update',showPracticeGrades);
window.CloudberryFlow={item:item,itemForDate:itemForDate,mount:mount,mathSteps:mathSteps,mathVideos:mathVideos,bjuSteps:bjuSteps,tgSteps:tgSteps,renderMath:renderMath,currentIndex:currentIndex,practiceBanks:practiceBanks,isPractice:isPractice,practicePassed:practicePassed,saveGrade:saveGrade,saveCheck:saveCheck,mathVideoList:mathVideos};
document.addEventListener('DOMContentLoaded',renderMath);
window.addEventListener('cloudberry:remote-update',function(){renderMath();});
})();
