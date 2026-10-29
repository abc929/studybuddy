const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{try{const file=path.join(root,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');res.end(fs.readFileSync(file))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(8128,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://www.gstatic.com/**',r=>r.abort());
  await page.clock.setFixedTime(new Date('2026-10-29T13:00:00-04:00'));await page.goto('http://127.0.0.1:8128');
  await page.locator('[data-view="bju-tab"]').click();
  const before=await page.evaluate(()=>({flow:JSON.stringify(cloudberryStateApi.exportState().subjectFlow),bju:CloudberryFlow.item('bju','2026-10-30').title}));
  assert.equal(await page.locator('#indReadingDate').inputValue(),'2026-10-29');
  assert.equal(await page.evaluate(()=>(cloudberryStateApi.exportState().readingLog||[]).filter(r=>r.source==='Independent reading').length),0);
  await page.evaluate(()=>window.addEventListener('cloudberry:save',e=>window.lastReadingSave=e.detail));
  for(const day of ['2026-10-27','2026-10-28']){
   await page.locator('#indReadingDate').fill(day);await page.locator('#indReadingTitle').fill('Synthetic test book');await page.locator('#indReadingAuthor').fill('Test author');await page.locator('#indReadingChapters').fill('Test chapter');await page.locator('#independentReadingForm button').click();
  }
  await page.locator('#independentReadingForm button').click();
  assert.equal(await page.evaluate(()=>lastReadingSave.readingLog.filter(r=>r.source==='Independent reading').length),2);
  assert.deepEqual(await page.evaluate(()=>({flow:JSON.stringify(cloudberryStateApi.exportState().subjectFlow),bju:CloudberryFlow.item('bju','2026-10-30').title})),before);
  await page.reload();await page.locator('[data-view="bju-tab"]').click();assert.match(await page.locator('#indReadingHistory').innerText(),/2026-10-27/);
  await page.evaluate(()=>{document.documentElement.dataset.cloudRole='parent';document.documentElement.dataset.parentDataReady='yes';window.dispatchEvent(new Event('cloudberry:parent-connected'));});
  assert.equal(await page.locator('#indReadingTitle').isDisabled(),true);
  await page.evaluate(()=>{const pick=document.getElementById('momActivityDate');pick.value='2026-10-28';pick.dispatchEvent(new Event('change'));});
  assert.match(await page.locator('#parentActivityJournal').textContent(),/Test author/);assert.match(await page.locator('#readingGradeHistory').textContent(),/Test chapter/);
  await page.evaluate(()=>{const s=cloudberryStateApi.exportState();s.readingLog.push({id:'remote',source:'Independent reading',date:'2026-10-29',title:'Remote book',author:'Remote author',chapters:'Remote chapter',credit:true});cloudberryStateApi.importState(s);});
  assert.match(await page.locator('#indReadingHistory').textContent(),/Remote book/);
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);console.log('PASS: dated credit, persistence, repeat-save deduplication, save-event payload, parent report, remote import, BJU isolation and mobile layout. Synthetic data only; Firebase blocked.');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
