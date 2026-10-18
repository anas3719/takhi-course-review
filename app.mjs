import { WatchGate } from './watch-gate.mjs';
const REQUIRED_END = 249.5;
const contentId = '062055dcac2a8998cc2b6ea55744445f7b47465fade591005f1999bd40892226-v1-249.5';
const key = `takhi-executive-review:${contentId}`;
const $ = id => document.getElementById(id);
const video = $('course'), ack = $('ack'), cover = $('cover');
let saved = {};
try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
const gate = new WatchGate(REQUIRED_END, Array.isArray(saved.ranges) ? saved.ranges : []);
let lastMedia = 0, lastWall = performance.now(), active = false, ready = false, restoring = false, lastSave = 0;
const ar = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const time = value => { const n = Math.max(0, Math.ceil(value)); return ar(`${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`); };
function persist() {
  try { localStorage.setItem(key, JSON.stringify({ranges: gate.ranges, acknowledged: gate.complete && ack.checked, contentId})); }
  catch { announce('تعذّر حفظ التقدّم على هذا الجهاز. يمكنك إكمال الدورة الآن.'); }
}
function baseline() { lastMedia = video.currentTime; lastWall = performance.now(); }
function announce(message) { $('notice').textContent = message; }
function render() {
  const percent = gate.complete ? 100 : Math.min(99, Math.floor(gate.ratio * 100));
  $('percent').textContent = ar(percent) + '٪';
  $('progress-fill').style.width = percent + '%';
  document.querySelector('.progress-heading').style.setProperty('--angle', `${gate.ratio*360}deg`);
  document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', percent);
  ack.disabled = !ready || !gate.complete;
  if (ack.disabled) ack.checked = false;
  $('ack-section').classList.toggle('unlocked', !ack.disabled);
  $('ack-section').classList.toggle('confirmed', ack.checked);
  $('remaining').textContent = gate.complete ? 'اكتملت المشاهدة' : `${time(REQUIRED_END - gate.frontier)} متبقية`;
  $('watch-status').textContent = gate.complete ? 'المحتوى مكتمل، يمكنك الآن تأكيد استعدادك' : gate.frontier > 0.1 ? 'يُحفظ تقدّمك على هذا الجهاز تلقائيًا' : 'شاهد الدورة، ثم أكّد استعدادك';
  $('ack-help').querySelector('span').textContent = ack.checked ? 'تم حفظ إقرارك على هذا الجهاز' : gate.complete ? 'المربع متاح الآن؛ أكّد استعدادك عندما تكون جاهزًا' : 'يتاح الإقرار بعد إكمال المشاهدة';
  $('success').hidden = !ack.checked;
  const current = ack.checked ? 3 : gate.frontier > .1 ? 2 : 1;
  document.querySelectorAll('[data-step]').forEach(el => {el.classList.toggle('current', +el.dataset.step === current); el.classList.toggle('done', +el.dataset.step < current || ack.checked);});
}
function sample() {
  const now = performance.now(), current = video.currentTime;
  const mediaDelta = current - lastMedia, wallDelta = (now-lastWall)/1000;
  // Only continuous foreground playback at normal speed; jumps never count.
  if (ready && active && !document.hidden && !video.seeking && video.playbackRate === 1 && mediaDelta > 0 && mediaDelta <= wallDelta * 1.3 + .12 && wallDelta < 2 && lastMedia <= gate.frontier + .04) {
    gate.add(lastMedia, current);
  }
  lastMedia = current; lastWall = now;
  render();
  if (now-lastSave > 1000) {persist();lastSave = now;}
}
video.addEventListener('loadedmetadata', () => {
  ready = Math.abs(video.duration - 252.981406) < .8;
  if (!ready) {announce('تعذّر التحقق من نسخة الدورة. أعد تحميل الصفحة.');render();return;}
  ack.checked = gate.complete && saved.acknowledged === true;
  if (gate.frontier > .1 && !gate.complete) { restoring = true; video.currentTime = Math.max(0,gate.frontier-.15); }
  baseline();render();
});
video.addEventListener('playing', () => {active = true;cover.hidden = true;baseline();announce('');});
video.addEventListener('timeupdate', sample);
video.addEventListener('pause', () => {sample();active = false;baseline();persist();});
video.addEventListener('waiting', () => {active = false;baseline();});
video.addEventListener('seeking', () => {
  active = false;
  if (ready && video.currentTime > gate.frontier + .15 && !gate.complete && !restoring) {
    video.currentTime = Math.max(0, gate.frontier);
    announce('يمكنك إعادة ما شاهدته. أكمل المشاهدة لفتح الإقرار.');
  }
  baseline();
});
video.addEventListener('seeked', () => {restoring = false;active = !video.paused && !document.hidden;baseline();});
video.addEventListener('ratechange', () => {if(video.playbackRate !== 1)video.playbackRate = 1;baseline();});
video.addEventListener('error', () => announce('تعذّر تحميل الفيديو. تحقق من الاتصال ثم أعد تحميل الصفحة.'));
document.addEventListener('visibilitychange', () => {if(document.hidden){video.pause();active=false;persist();}baseline();});
window.addEventListener('pagehide', persist);
cover.addEventListener('click', () => video.play().catch(() => announce('اضغط تشغيل من شريط الفيديو لبدء المشاهدة.')));
document.querySelector('.start-button').addEventListener('click', () => {video.play().catch(() => {});});
ack.addEventListener('change', () => {if (!gate.complete || !ready) ack.checked=false;render();persist();});
let lastTick = 0;
function tick(now) {if(active && now-lastTick >= 100){sample();lastTick=now;}requestAnimationFrame(tick);}
requestAnimationFrame(tick);
render();
