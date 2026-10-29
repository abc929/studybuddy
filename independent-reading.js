/* Daily reading evidence uses the existing synced readingLog, never BJU completion. */
(function () {
'use strict';
const api = window.cloudberryStateApi;
const host = document.getElementById('bju-tab') || document.getElementById('bjuReading')?.parentElement;
if (!api || !host) return;
const today = () => { const d = new Date(); return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); };
const card = document.createElement('section');
card.id = 'independentReading'; card.className = 'section card';
card.innerHTML = '<h2>📖 My daily independent reading</h2><p>Record what you read to earn reading credit for that date. Your BJU lesson stays here until you check that BJU lesson finished.</p><form id="independentReadingForm"><label for="indReadingDate">Reading date</label><input id="indReadingDate" type="date" required><label for="indReadingTitle">Book title</label><input id="indReadingTitle" maxlength="200" required><label for="indReadingAuthor">Author</label><input id="indReadingAuthor" maxlength="200" required><label for="indReadingChapters">Chapters read</label><input id="indReadingChapters" maxlength="200" placeholder="For example: chapters 2–3" required><button class="primary" type="submit">Save reading & credit this date</button></form><p id="indReadingStatus" role="status"></p><div id="indReadingHistory"></div>';
host.append(card);
const form = card.querySelector('form'), date = card.querySelector('#indReadingDate');
date.value = today(); date.max = today();
const fields = ['Title','Author','Chapters'].map(s => card.querySelector('#indReading'+s));
function render() {
 const parent = document.documentElement.dataset.cloudRole === 'parent';
 for (const input of form.elements) input.disabled = parent;
 const box = card.querySelector('#indReadingHistory'); box.replaceChildren();
 const records = (api.exportState().readingLog || []).filter(r => r.source === 'Independent reading');
 for (const r of records.slice().sort((a,b) => b.date.localeCompare(a.date))) {
  const row = document.createElement('p'); row.className = 'logrow';
  row.textContent = r.date+' · '+r.title+' · '+(r.author || 'Author not recorded')+' · '+(r.chapters || 'Chapters not recorded')+' · Reading credit';
  box.append(row);
 }
}
form.addEventListener('submit', e => {
 e.preventDefault();
 if (document.documentElement.dataset.cloudRole === 'parent') return;
 const [title,author,chapters] = fields.map(f => f.value.trim());
 const status = card.querySelector('#indReadingStatus');
 if (!date.value || date.value > today() || !title || !author || !chapters || !form.checkValidity()) {
  status.textContent = 'Enter a valid reading date (today or earlier), book title, author, and chapters read.'; return;
 }
 const state = JSON.parse(JSON.stringify(api.exportState()));
 state.readingLog = state.readingLog || [];
 // Stable identity makes repeat saves of the same book on a date update its evidence.
 const id = 'independent:'+date.value+':'+title.toLowerCase()+':'+author.toLowerCase();
 const record = {id,date:date.value,title,author,chapters,source:'Independent reading',type:'Independent reading',status:'Reading credit',credit:true,savedAt:new Date().toISOString()};
 const index = state.readingLog.findIndex(r => r.id === id);
 if (index < 0) state.readingLog.push(record); else state.readingLog[index] = record;
 api.importState(state);
 window.dispatchEvent(new CustomEvent('cloudberry:save',{detail:JSON.parse(JSON.stringify(api.exportState()))}));
 status.textContent = 'Reading credit saved for '+date.value+' on this device. Check the cloud connection status for syncing.';
});
window.addEventListener('cloudberry:remote-update',render);
window.addEventListener('cloudberry:parent-connected',render);
render();
})();
