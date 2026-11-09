// 서버(server.js)의 APP_VERSION과 같아야 해요. 다르면 화면 맨 위에 "파일 버전이 서로 달라요" 경고가 떠요.
const APP_VERSION = '2026.10.21-49';

// ---------- 파일 버전 확인 (이 블록은 파일 맨 앞에서, 아래 코드가 오류로 멈추더라도 독립적으로 실행돼요) ----------
// 서버·index.html·app.js가 서로 다른 시기의 파일이면 화면이 멈추거나 데이터가 비어 보일 수 있어서, 그 사실을 사용자에게 바로 알려줘요.
(function versionGuard() {
  function banner(html) {
    if (document.getElementById('versionBanner')) return;
    const el = document.createElement('div');
    el.id = 'versionBanner';
    el.setAttribute('role', 'alert');
    el.style.cssText = 'position:sticky;top:0;z-index:9999;background:#fdecea;color:#7a1f14;border-bottom:2px solid #c0584a;padding:10px 14px;font-size:14px;line-height:1.5';
    el.innerHTML = html;
    (document.body || document.documentElement).prepend(el);
  }
  function check() {
    fetch('/api/me', { cache: 'no-store' }).then(r => r.json()).then(me => {
      if (!me || !me.version) { banner('<strong>서버와 화면 파일의 버전이 달라요.</strong> 서버가 버전 정보를 주지 않아요. 서버(server.js)가 예전 파일일 수 있어요. 데이터는 지워진 게 아니라 화면이 못 읽는 것일 수 있어요. 새 파일 전체(server.js, public 폴더 전체)를 같은 버전으로 올린 뒤 다시 배포하고, 브라우저를 새로고침(Ctrl+Shift+R)해주세요.'); return; }
      if (me.version !== APP_VERSION) banner(`<strong>서버와 화면 파일의 버전이 달라요.</strong> (서버 ${me.version} / 화면 ${APP_VERSION}) 일부 파일만 새것이라 일부 화면이 멈추거나 데이터가 비어 보일 수 있어요. <u>데이터는 지워진 게 아니에요.</u> 새 파일 전체(server.js, public 폴더 전체)를 같은 버전으로 올린 뒤 다시 배포하고, 브라우저를 새로고침(Ctrl+Shift+R)해주세요.`);
    }).catch(() => { /* 서버에 못 닿으면 다른 오류 안내가 따로 나와요 */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', check); else check();
})();
// ---------- 시작 예약 (이 블록도 파일 맨 앞에서 실행돼요) ----------
// bootApp()은 발송 이력·면접 일정·양식 같은 핵심 데이터를 불러와요. 두 가지를 동시에 지켜야 해서 "예약"으로 시작해요:
//  (a) 아래 모든 상수·함수가 선언된 뒤에 시작해야 안전하고(그래서 스크립트 실행이 끝난 뒤인 load 시점),
//  (b) 아래 어딘가 한 줄이 오류를 내서 스크립트가 중간에 멈춰도 시작은 반드시 되어야 해요(예약은 이미 맨 앞에서 해뒀어요).
window.__appScriptCompleted = false;
window.addEventListener('load', function startApp() {
  // 함수 선언(bootApp)은 스크립트가 중간에 멈춰도 이미 만들어져 있어서, "정의됐나"로는 중단을 알 수 없어요.
  // 그래서 파일 맨 끝에서 켜는 __appScriptCompleted로 "끝까지 실행됐나"를 확인해요.
  if (!window.__appScriptCompleted) {
    document.body.classList.remove('booting');
    if (!document.getElementById('bootFailBanner')) {
      const el = document.createElement('div'); el.id = 'bootFailBanner'; el.setAttribute('role', 'alert');
      el.style.cssText = 'position:sticky;top:0;z-index:9999;background:#fdecea;color:#7a1f14;border-bottom:2px solid #c0584a;padding:10px 14px;font-size:14px;line-height:1.5';
      el.innerHTML = '<strong>화면 프로그램(app.js)이 중간에 멈췄어요.</strong> <u>저장된 데이터(발송 이력·면접 일정·양식)는 지워진 게 아니에요.</u> 보통 파일 일부만 새 버전으로 올렸을 때 생겨요. 새 파일 전체(server.js, public 폴더 전체)를 같은 버전으로 올려 다시 배포한 뒤 브라우저를 새로고침(Ctrl+Shift+R)해주세요. 계속되면 브라우저 개발자 도구(F12) 콘솔의 빨간 오류 글을 알려주세요.';
      (document.body || document.documentElement).prepend(el);
    }
    return;   // 중간에 멈춘 상태에서 데이터 불러오기를 시도해도 빈 화면만 되니, 경고만 보여주고 멈춰요
  }
  bootApp().catch(err => { console.error('[bootApp] 시작 중 오류:', err); document.body.classList.remove('booting'); });
});
// 이 파일이 보는 화면(index.html)이 같은 버전인지: index.html 쪽에도 같은 버전을 적어 두고 비교해요.
(function htmlVersionGuard() {
  function run() {
    const v = document.documentElement.getAttribute('data-app-version');
    if (v !== APP_VERSION && !document.getElementById('versionBanner')) {
      const el = document.createElement('div');
      el.id = 'versionBanner'; el.setAttribute('role', 'alert');
      el.style.cssText = 'position:sticky;top:0;z-index:9999;background:#fdecea;color:#7a1f14;border-bottom:2px solid #c0584a;padding:10px 14px;font-size:14px;line-height:1.5';
      el.innerHTML = `<strong>화면 파일(index.html)과 app.js의 버전이 달라요.</strong> (index.html ${v || '버전 표시 없음'} / app.js ${APP_VERSION}) 일부 파일만 새것이라 화면이 멈추거나 데이터가 비어 보일 수 있어요. <u>데이터는 지워진 게 아니에요.</u> 새 파일 전체(server.js, public 폴더 전체)를 같은 버전으로 올린 뒤 다시 배포하고, 브라우저를 새로고침(Ctrl+Shift+R)해주세요.`;
      (document.body || document.documentElement).prepend(el);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
// 로그인이 필요한 상태(401)가 되면 로그인 화면으로 보냅니다.
(function () {
  const origFetch = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const res = await origFetch(...args);
    if (res.status === 401) {
      try {
        const j = await res.clone().json();
        if (j && j.needLogin) location.href = '/login.html';
      } catch { /* 본문이 JSON이 아니면 무시 */ }
    }
    if (res.status === 403) {
      try {
        const j = await res.clone().json();
        if (j && j.code === 'forbidden') showToast(j.error);
      } catch { /* 본문이 JSON이 아니면 무시 */ }
    }
    return res;
  };
})();

function showToast(message) {
  let t = document.getElementById('permToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'permToast';
    t.className = 'perm-toast';
    document.body.appendChild(t);
  }
  t.textContent = message;
  t.hidden = false;
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { t.hidden = true; }, 4500);
}

// 지금 로그인한 사람과 메뉴별 권한 (/api/me 결과로 채워짐. 로그인 기능이 꺼진 서버에서는 모두 '수정')
const PERM_LEVEL = { none: 0, view: 1, edit: 2 };
let ME = { mode: 'none', authed: true, role: 'full', features: { postingCreate: false }, perms: { send: 'edit', history: 'edit', schedule: 'edit', resume: 'edit', interviews: 'edit', templates: 'edit' } };
// 면접 관리(interviews)는 예전에 "이력서 검토·공고(resume)" 권한으로 보던 화면이라, 그 권한이 있는 사용자도 그대로 보고 고칠 수 있어요(팀장은 interviews 보기만 있어서 읽기 전용이에요)
const permOf = (menu) => Math.max(PERM_LEVEL[ME.perms[menu]] || 0, menu === 'interviews' ? (PERM_LEVEL[ME.perms.resume] || 0) : 0);
function canView(menu) { return permOf(menu) >= 1; }
function canEdit(menu) { return permOf(menu) >= 2; }

const nameInput = document.getElementById('name');
const phoneInput = document.getElementById('phone');
const templateSelect = document.getElementById('template');
const dateField = document.getElementById('dateField');
const dateInput = document.getElementById('date');
const sendBtn = document.getElementById('sendBtn');
const statusEl = document.getElementById('status');
const previewText = document.getElementById('previewText');
const previewResetBtn = document.getElementById('previewResetBtn');
const charCount = document.getElementById('charCount');
const memoInput = document.getElementById('memo');
const historyBody = document.getElementById('historyBody');
const sortBtns = document.querySelectorAll('.sort-btn');
const historySearch = document.getElementById('historySearch');
const historyMonthFilter = document.getElementById('historyMonthFilter');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const historySelectAll = document.getElementById('historySelectAll');
const addManualHistoryBtn = document.getElementById('addManualHistoryBtn');
const manualHistoryForm = document.getElementById('manualHistoryForm');
const manualName = document.getElementById('manualName');
const manualPhone = document.getElementById('manualPhone');
const manualTemplateLabel = document.getElementById('manualTemplateLabel');
const manualResult = document.getElementById('manualResult');
const manualProposedDate = document.getElementById('manualProposedDate');
const manualMemo = document.getElementById('manualMemo');
const manualMessage = document.getElementById('manualMessage');
const manualHistorySubmitBtn = document.getElementById('manualHistorySubmitBtn');
const manualHistoryStatus = document.getElementById('manualHistoryStatus');

let historySortMode = 'date';
let historyRaw = [];
let selectedHistoryIds = new Set();

const tabBtns = document.querySelectorAll('.tab-btn');
const sendView = document.getElementById('sendView');
const manageView = document.getElementById('manageView');
const resumeView = document.getElementById('resumeView');
const postingView = document.getElementById('postingView');
const interviewView = document.getElementById('interviewView');
const companyIntroInput = document.getElementById('companyIntroInput');
const idealProfileInput = document.getElementById('idealProfileInput');
const criteriaStatus = document.getElementById('criteriaStatus');
const rubricBody = document.getElementById('rubricBody');
const evalPositionSelect = document.getElementById('evalPositionSelect');
const resumeTextInput = document.getElementById('resumeTextInput');
const screenResumeBtn = document.getElementById('screenResumeBtn');
const resumeStatus = document.getElementById('resumeStatus');
const resumeResult = document.getElementById('resumeResult');
const resultPosition = document.getElementById('resultPosition');
const resumeTotal = document.getElementById('resumeTotal');
const resumeAiTotal = document.getElementById('resumeAiTotal');
const scoreBody = document.getElementById('scoreBody');
const resumeRecommendation = document.getElementById('resumeRecommendation');
const resumeSummary = document.getElementById('resumeSummary');
const resumeStrengths = document.getElementById('resumeStrengths');
const resumeConcerns = document.getElementById('resumeConcerns');
const missingDocsBox = document.getElementById('missingDocsBox');
const resumeMissingDocs = document.getElementById('resumeMissingDocs');
const scheduleView = document.getElementById('scheduleView');
const templateManageSelect = document.getElementById('templateManageSelect');
const templateDetail = document.getElementById('templateDetail');
const addTemplateBtn = document.getElementById('addTemplateBtn');
const templateCardTpl = document.getElementById('templateCardTpl');
const scheduleCardTpl = document.getElementById('scheduleCardTpl');

const schNameInput = document.getElementById('schName');
const schPhoneInput = document.getElementById('schPhone');
const schYearInput = document.getElementById('schYear');
const schMonthInput = document.getElementById('schMonth');
const schDayInput = document.getElementById('schDay');
const schHourInput = document.getElementById('schHour');
const schMinuteInput = document.getElementById('schMinute');
const schTeamInput = document.getElementById('schTeam');
const schInterviewerInput = document.getElementById('schInterviewer');
const schLocationInput = document.getElementById('schLocation');
const schRoundInput = document.getElementById('schRound');
const schNoteInput = document.getElementById('schNote');
const addScheduleBtn = document.getElementById('addScheduleBtn');
const scheduleStatus = document.getElementById('scheduleStatus');
const scheduleDetail = document.getElementById('scheduleDetail');
const scheduleOverview = document.getElementById('scheduleOverview');
const scheduleOverviewTitle = document.getElementById('scheduleOverviewTitle');
const scheduleTeamFilter = document.getElementById('scheduleTeamFilter');
const scheduleRoundFilter = document.getElementById('scheduleRoundFilter');
const scheduleStatusFilter = document.getElementById('scheduleStatusFilter');
const scheduleNameSearch = document.getElementById('scheduleNameSearch');
const scheduleFilterResetBtn = document.getElementById('scheduleFilterResetBtn');
const schedulePeriodFilter = document.getElementById('schedulePeriodFilter');
const scheduleListBody = document.getElementById('scheduleListBody');

let templates = [];
let schedules = [];

// 기본 양식으로 바꾸기(소유주만): 같은 번호의 양식 본문을 앱의 기본 양식으로 바꾸고, 따로 만든 양식은 그대로 둬요
(function () {
  const btn = document.getElementById('applyDefaultTplBtn'); if (!btn) return;
  const sync = () => { btn.hidden = !(typeof ME !== 'undefined' && ME && (ME.role === 'owner' || ME.role === 'full')); };
  setTimeout(sync, 1500); document.addEventListener('visibilitychange', sync);
  btn.addEventListener('click', async () => {
    if (!confirm('기본 양식(t1~t17)의 이름·본문을 앱에 들어 있는 새 기본 양식으로 바꿀까요?\n\n같은 번호의 양식은 지금 내용이 덮어써지고, 따로 만든 양식은 그대로 남아요.')) return;
    btn.disabled = true;
    try {
      const r = await fetch('/api/templates/apply-defaults', { method: 'POST' }); const j = await r.json().catch(() => ({}));
      if (!r.ok) { alert(j.error || '바꾸지 못했어요.'); return; }
      await loadTemplates(); alert(`기본 양식으로 바꿨어요. 바뀐 양식 ${j.replaced}개, 새로 생긴 양식 ${j.added}개, 그대로 둔 양식 ${j.kept}개예요.`);
    } catch { alert('서버에 연결하지 못했어요.'); } finally { btn.disabled = false; }
  });
})();
// ---------- 채용과제 양식(양식 관리) ----------
let taskList = [];
async function loadTasks() {
  try { const r = await fetch('/api/tasks'); const j = await r.json().catch(() => ({})); taskList = r.ok ? (j.tasks || []) : []; } catch { taskList = []; }
  renderTaskList(); return taskList;
}
function renderTaskList() {
  const el = document.getElementById('taskList'); if (!el) return; const can = canEdit('templates') || canEdit('resume');
  el.innerHTML = taskList.length ? `<ul class="task-items">${taskList.map(t => `<li data-id="${escapeHtml(t.id)}"><strong>${escapeHtml(t.title)}</strong> <span class="ap-sub">${escapeHtml([t.team, t.job, `기한 ${t.days}일`].filter(Boolean).join(' · '))}</span>${can ? ` <button type="button" class="link-btn task-edit">수정</button> <button type="button" class="link-btn task-del">삭제</button>` : ''}<div class="ap-sub task-body">${escapeHtml(t.body.slice(0, 160))}${t.body.length > 160 ? '…' : ''}</div></li>`).join('')}</ul>` : '<p class="ap-sub">아직 과제 양식이 없어요.</p>';
}
function taskFormOpen(t) {
  const f = document.getElementById('taskForm'); f.hidden = false; document.getElementById('taskAdd').hidden = true; document.getElementById('taskMsg').textContent = '';
  document.getElementById('taskId').value = t ? t.id : ''; document.getElementById('taskTitle').value = t ? t.title : ''; document.getElementById('taskTeam').value = t ? t.team : ''; document.getElementById('taskJob').value = t ? t.job : '';
  document.getElementById('taskDays').value = t ? t.days : 7; document.getElementById('taskBody').value = t ? t.body : ''; document.getElementById('taskMethod').value = t ? t.method : 'job@openhan.kr로 메일 제출'; document.getElementById('taskTitle').focus();
}
function taskFormClose() { document.getElementById('taskForm').hidden = true; document.getElementById('taskAdd').hidden = !(canEdit('templates') || canEdit('resume')); }
document.getElementById('taskAdd').addEventListener('click', () => taskFormOpen(null));
document.getElementById('taskCancel').addEventListener('click', taskFormClose);
document.getElementById('taskSave').addEventListener('click', async () => {
  const id = document.getElementById('taskId').value; const body = { title: document.getElementById('taskTitle').value, team: document.getElementById('taskTeam').value, job: document.getElementById('taskJob').value, days: Number(document.getElementById('taskDays').value), body: document.getElementById('taskBody').value, method: document.getElementById('taskMethod').value };
  const r = await fetch(id ? '/api/tasks/' + encodeURIComponent(id) : '/api/tasks', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({}));
  if (!r.ok) { document.getElementById('taskMsg').textContent = j.error || '저장하지 못했어요.'; return; }
  taskFormClose(); await loadTasks();
});
document.getElementById('taskList').addEventListener('click', async e => {
  const li = e.target.closest('li[data-id]'); if (!li) return; const t = taskList.find(x => x.id === li.dataset.id); if (!t) return;
  if (e.target.closest('.task-edit')) taskFormOpen(t);
  if (e.target.closest('.task-del')) { if (!confirm(`"${t.title}" 과제 양식을 지울까요? 이미 지원자에게 낸 과제 기록은 그대로 남아요.`)) return; await fetch('/api/tasks/' + encodeURIComponent(t.id), { method: 'DELETE' }); await loadTasks(); }
});
let tplLoading = null;   // 양식 불러오기가 겹치면 같은 요청을 기다려요(늦게 끝난 요청이 고른 양식을 지우지 않게)
function loadTemplates() { if (!tplLoading) tplLoading = loadTemplatesNow().finally(() => { tplLoading = null; }); return tplLoading; }
async function loadTemplatesNow() {
  if (!canView('send') && !canView('templates')) return;
  templateSelect.innerHTML = '<option value="">불러오는 중...</option>';
  try {
    const res = await fetch('/api/templates');
    const data = await res.json();
    if (!Array.isArray(data)) {
      throw new Error((data && data.error) || '서버 응답 형식이 올바르지 않습니다.');
    }
    templates = data;
    templateSelect.innerHTML = '<option value="">양식을 선택하세요</option>';
    templates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.label;
      templateSelect.appendChild(opt);
    });
  } catch (err) {
    templates = [];
    templateSelect.innerHTML = `<option value="">양식을 불러오지 못했습니다 (${err.message})</option>`;
  }
}

function currentTemplate() {
  return templates.find(t => t.id === templateSelect.value);
}

function updateDateFieldVisibility() {
  const tpl = currentTemplate();
  if (tpl && tpl.hasDate) {
    dateField.hidden = false;
  } else {
    dateField.hidden = true;
    dateInput.value = '';
  }
}

function validate() {
  const ok = nameInput.value.trim() && phoneInput.value.trim() && templateSelect.value;
  sendBtn.disabled = !ok;
  return ok;
}

let previewEdited = false;

// ---------- 보낼 수 없는 글자 미리 검사 ----------
const textWarn = document.getElementById('textWarn');
let textCheckTimer = null;
let textCheckSeq = 0;

function scheduleTextCheck() {
  clearTimeout(textCheckTimer);
  textCheckTimer = setTimeout(runTextCheck, 400);
}

async function runTextCheck() {
  const text = previewText.value;
  const seq = ++textCheckSeq;
  if (!templateSelect.value || !text.trim()) { textWarn.hidden = true; return; }
  try {
    const res = await fetch('/api/check-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (seq !== textCheckSeq) return; // 그 사이 내용이 또 바뀌었으면 오래된 결과는 버림
    const invalid = data.invalid || [];
    const fixes = data.fixes || [];
    if (invalid.length) {
      textWarn.className = 'text-warn text-warn-err';
      textWarn.textContent = '⚠ 문자로 보낼 수 없는 글자가 있어요: '
        + invalid.map(i => `${i.char} (${i.codePoint})${i.count > 1 ? ' ×' + i.count : ''}`).join(', ')
        + ' — 지우고 보내주세요.';
      textWarn.hidden = false;
    } else if (fixes.length) {
      textWarn.className = 'text-warn text-warn-info';
      textWarn.textContent = 'ℹ 보낼 때 자동으로 바뀌어요: '
        + fixes.map(f => `${f.desc} (${f.count}개)`).join(', ');
      textWarn.hidden = false;
    } else {
      textWarn.hidden = true;
    }
  } catch {
    // 검사 실패는 조용히 무시 (발송 시 서버가 다시 검사함)
  }
}
const PREVIEW_PLACEHOLDER = '왼쪽에서 이름과 양식을 선택하면 실제 발송될 문자 내용이 여기에 표시됩니다.';

async function updatePreview() {
  if (!templateSelect.value) {
    previewText.value = PREVIEW_PLACEHOLDER;
    charCount.textContent = '0자';
    previewEdited = false;
    previewResetBtn.hidden = true;
    textWarn.hidden = true;
    return;
  }
  if (previewEdited) {
    // 사용자가 직접 수정한 내용은 자동으로 덮어쓰지 않음 (글자수만 갱신)
    charCount.textContent = `${previewText.value.length}자`;
    return;
  }
  const res = await fetch('/api/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      templateId: templateSelect.value,
      name: nameInput.value.trim() || '{{이름}}',
      date: dateInput.value.trim(),
    }),
  });
  const data = await res.json();
  previewText.value = data.message || '';
  charCount.textContent = `${(data.message || '').length}자`;
  scheduleTextCheck();
}

previewText.addEventListener('input', () => {
  previewEdited = true;
  previewResetBtn.hidden = false;
  charCount.textContent = `${previewText.value.length}자`;
  scheduleTextCheck();
});

previewResetBtn.addEventListener('click', () => {
  previewEdited = false;
  previewResetBtn.hidden = true;
  updatePreview();
});

async function handleSend(confirmLeftover) {
  if (!validate()) return;
  sendBtn.disabled = true;
  sendBtn.textContent = '발송 중...';
  statusEl.textContent = '';
  statusEl.className = 'status';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);
    const res = await fetch('/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: templateSelect.value,
        name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        date: dateInput.value.trim(),
        memo: memoInput.value.trim(),
        message: previewText.value, // 미리보기에 보이는 내용(수정했다면 수정된 그대로) 발송
        notionPageId: (notionCtx && notionWriteBack.checked) ? notionCtx.pageId : undefined,
        confirmLeftover: confirmLeftover === true ? true : undefined,   // 사람이 "그래도 보내기"를 확인한 경우에만
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();

    // 채워지지 않은 칸(【 】·빈 날짜)이 남았다고 서버가 알려주면, 사람이 확인한 뒤에만 다시 보냄
    if (res.status === 409 && data.code === 'leftover_confirm') {
      const list = [...new Set((data.leftovers || []).map(x => x.text))].slice(0, 5).join(', ');
      statusEl.textContent = ''; statusEl.className = 'status';
      if (confirm(`문자에 채워지지 않은 칸이 남아 있어요:\n${list}\n\n지원자에게 그대로 나갈 수 있어요. 그래도 보낼까요?`)) { await handleSend(true); return; }   // 안쪽 발송이 끝날 때까지 기다려야 바깥 finally가 버튼을 먼저 풀어서 이중 발송이 되는 일이 없어요
      statusEl.textContent = '보내지 않았어요. 칸을 채운 뒤 다시 보내주세요.'; statusEl.className = 'status err';
      return;
    }

    if (res.ok && data.success) {
      const fixNote = (data.fixes && data.fixes.length)
        ? ' (자동으로 바꿔서 보냈어요: ' + data.fixes.map(f => `${f.desc} ${f.count}개`).join(', ') + ')'
        : '';
      let notionNote = '';
      if (data.notion) {
        notionNote = data.notion.ok
          ? " 노션에도 '문자 발송 완료'로 기록했어요."
          : ' (노션 기록은 실패했어요: ' + (data.notion.error || '') + ')';
      }
      if (notionCtx) clearNotionCtx();
      statusEl.textContent = '문자가 발송되었습니다.' + fixNote + notionNote;
      statusEl.className = 'status ok';
      textWarn.hidden = true;
      previewEdited = false;
      previewResetBtn.hidden = true;
      loadHistory();
    } else {
      statusEl.textContent = `발송 실패: ${data.error || '알 수 없는 오류'}`;
      statusEl.className = 'status err';
      loadHistory();
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      statusEl.textContent = '서버 응답이 너무 오래 걸려 중단했습니다 (35초 초과). 다시 시도해주세요.';
    } else {
      statusEl.textContent = '서버와 통신 중 오류가 발생했습니다.';
    }
    statusEl.className = 'status err';
  } finally {
    sendBtn.textContent = '문자 보내기';
    validate();
  }
}

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function loadHistory() {
  if (!canView('history')) return;
  try {
    const res = await fetch('/api/history');
    historyRaw = await res.json();
    updateMonthFilterOptions();
    renderHistory();
  } catch (err) {
    // 이력 로딩 실패는 조용히 무시 (핵심 기능 아님)
  }
}

// ---------- 발송 이력 보기 범위: 기본은 최근 30일, 그보다 오래된 문자는 "이전 발송 조회"에서 (지우지 않아요) ----------
const HISTORY_RECENT_DAYS = 30;
let historyScope = 'recent';   // 'recent' | 'older'
const historyCutoff = () => Date.now() - HISTORY_RECENT_DAYS * 24 * 3600 * 1000;
const historyIsRecent = item => new Date(item.sentAt).getTime() >= historyCutoff();
function historyScopeItems() { return historyRaw.filter(item => (historyScope === 'recent') === historyIsRecent(item)); }
function historySetScope(scope) {
  if (historyScope === scope) return; historyScope = scope;
  selectedHistoryIds.clear(); updateDeleteSelectedBtn();   // 안 보이게 된 줄이 선택된 채 남아 실수로 지워지지 않게 선택을 비워요
  historyMonthFilter.value = ''; updateMonthFilterOptions(); renderHistory();
}
function monthKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function updateMonthFilterOptions() {
  const months = [...new Set(historyScopeItems().map(h => monthKey(h.sentAt)))].sort().reverse();   // 지금 보기 범위에 있는 달만
  const current = historyMonthFilter.value;
  historyMonthFilter.innerHTML = '<option value="">전체 월</option>';
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    const [y, mo] = m.split('-');
    opt.textContent = `${y}년 ${mo}월`;
    historyMonthFilter.appendChild(opt);
  });
  historyMonthFilter.value = months.includes(current) ? current : '';
}

// ---------- 보낸 문자 확인 모달 ----------
const msgModal = document.getElementById('msgModal');
const msgModalMeta = document.getElementById('msgModalMeta');
const msgModalBody = document.getElementById('msgModalBody');

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// ---------- 발송 이력 수정 (잘못 고른 양식 이름 등을 바로잡아요) ----------
let histEditId = '';
const histEl = id => document.getElementById(id);
function histEditStatus(msg, cls) { histEl('histEditStatus').textContent = msg || ''; histEl('histEditStatus').className = 'status' + (cls ? ' ' + cls : ''); }
function histTemplateChoices(current) {   // 지금 앱의 양식 + 이력에 쓰인 다른 양식 이름(수기 입력·지운 양식의 옛 이름) + 현재 값
  const names = [];
  const add = n => { n = String(n || '').trim(); if (n && !names.includes(n)) names.push(n); };
  (typeof templates !== 'undefined' ? templates : []).forEach(t => add(t.label));
  historyRaw.forEach(h => add(h.templateLabel));
  add(current);
  return names;
}
function openHistEdit(item) {
  histEditId = item.id;
  histEl('histEditWho').innerHTML = `<strong>${escapeHtml(item.name)}</strong> (${escapeHtml(item.phone)}) · 발송 ${escapeHtml(formatDateTime(item.sentAt))}`;
  const sel = histEl('histEditTemplate');
  sel.innerHTML = histTemplateChoices(item.templateLabel).map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('') + '<option value="__custom__">직접 입력…</option>';
  sel.value = item.templateLabel; histEl('histEditTemplateCustom').hidden = true; histEl('histEditTemplateCustom').value = '';
  histEl('histEditProposed').value = item.proposedDate || ''; histEl('histEditMemo').value = item.memo || '';
  const orig = histEl('histEditOrig'); orig.hidden = !item.templateLabelOriginal; orig.textContent = item.templateLabelOriginal ? `처음에 기록된 양식: "${item.templateLabelOriginal}"${item.editedAt ? ` · 마지막으로 고친 시각 ${formatDateTime(item.editedAt)}` : ''}` : '';
  histEl('histEditRevert').hidden = !item.templateLabelOriginal;
  histEditStatus(''); histEl('histEditSave').disabled = false;
  histEl('histEditModal').hidden = false; sel.focus();
}
function closeHistEdit() { histEl('histEditModal').hidden = true; histEditId = ''; }
histEl('histEditTemplate').addEventListener('change', e => { const c = e.target.value === '__custom__'; histEl('histEditTemplateCustom').hidden = !c; if (c) histEl('histEditTemplateCustom').focus(); });
histEl('histEditClose').addEventListener('click', closeHistEdit);
histEl('histEditCancel').addEventListener('click', closeHistEdit);
histEl('histEditModal').addEventListener('click', e => { if (e.target === histEl('histEditModal')) closeHistEdit(); });
async function histEditSend(body) {
  histEl('histEditSave').disabled = true; histEl('histEditRevert').disabled = true;
  try {
    const res = await fetch(`/api/history/${encodeURIComponent(histEditId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => null);
    if (!res.ok || !j) throw new Error((j && j.error) || '저장하지 못했어요.');
    const i = historyRaw.findIndex(h => h.id === j.id); if (i >= 0) historyRaw[i] = j;
    renderHistory(); closeHistEdit();
  } catch (err) { histEditStatus(err.message || '저장 중 오류가 발생했어요.', 'err'); }
  finally { histEl('histEditSave').disabled = false; histEl('histEditRevert').disabled = false; }
}
histEl('histEditSave').addEventListener('click', () => {
  const sel = histEl('histEditTemplate'); const label = (sel.value === '__custom__' ? histEl('histEditTemplateCustom').value : sel.value).trim();
  if (!label) { histEditStatus('양식 이름을 입력해주세요.', 'err'); return; }
  histEditSend({ templateLabel: label, proposedDate: histEl('histEditProposed').value, memo: histEl('histEditMemo').value });
});
histEl('histEditRevert').addEventListener('click', () => {
  const item = historyRaw.find(h => h.id === histEditId); if (!item || !item.templateLabelOriginal) return;
  histEditSend({ templateLabel: item.templateLabelOriginal });
});

function openMsgModal(item) {
  const rows = [
    ['발송일시', formatDateTime(item.sentAt)],
    ['받는 사람', `${item.name} (${item.phone})`],
    ['양식', item.templateLabel],
    ['결과', item.success ? '성공' : '실패'],
  ];
  if (item.proposedDate) rows.push(['면접 제안 일시', item.proposedDate]);
  if (item.memo) rows.push(['메모', item.memo]);
  if (!item.success && item.error) rows.push(['실패 사유', item.error]);
  if (item.templateLabelOriginal) rows.push(['안내', `이 문자는 "${item.templateLabelOriginal}" 양식으로 보낸 문자예요. 기록의 양식 이름만 "${item.templateLabel}"(으)로 고쳤어요.`]);
  msgModalMeta.innerHTML = rows.map(([k, v]) => `<div><span>${k}</span>${escapeHtml(v)}</div>`).join('');
  msgModalBody.textContent = item.message
    ? item.message
    : '저장된 문자 내용이 없습니다. (문자 내용 저장 기능이 추가되기 전에 발송한 건이거나, 수기로 추가한 건입니다.)';
  msgModal.hidden = false;
}

function closeMsgModal() { msgModal.hidden = true; }
document.getElementById('msgModalClose').addEventListener('click', closeMsgModal);
msgModal.addEventListener('click', (e) => { if (e.target === msgModal) closeMsgModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMsgModal(); });

function renderHistory() {
  const keyword = historySearch.value.trim().toLowerCase();
  const monthValue = historyMonthFilter.value;

  const matchesKw = item => !keyword
    || item.name.toLowerCase().includes(keyword)
    || (item.phone || '').replace(/-/g, '').includes(keyword.replace(/-/g, ''));
  const inScope = historyScopeItems();
  let filtered = inScope.filter(item => matchesKw(item) && (!monthValue || monthKey(item.sentAt) === monthValue));
  // 보기 범위 안내: 기본(최근 30일)과 이전 발송을 오가는 버튼, 그리고 건수
  const nRecent = historyRaw.filter(historyIsRecent).length, nOlder = historyRaw.length - nRecent;
  document.getElementById('historyScopeInfo').textContent = historyScope === 'recent' ? `최근 ${HISTORY_RECENT_DAYS}일 발송 ${nRecent}건 · 그보다 오래된 발송 ${nOlder}건은 "이전 발송 조회"에서 볼 수 있어요` : `${HISTORY_RECENT_DAYS}일보다 오래된 이전 발송 ${nOlder}건 (지우지 않고 보관돼 있어요)`;
  document.getElementById('historyScopeBtn').textContent = historyScope === 'recent' ? '이전 발송 조회' : `최근 ${HISTORY_RECENT_DAYS}일로 돌아가기`;
  document.getElementById('historyScopeBar').hidden = !historyRaw.length || (historyScope === 'recent' && !nOlder);

  if (!filtered.length) {
    const other = historyRaw.filter(item => (historyScope === 'recent') !== historyIsRecent(item) && matchesKw(item)).length;   // 이름을 쳤는데 반대쪽 기록에 있을 때 알려줘요(사람을 못 찾는 일이 없게)
    historyBody.innerHTML = `<tr><td colspan="10" class="empty-row">조건에 맞는 발송 이력이 없습니다.${keyword && other ? ` ${historyScope === 'recent' ? `${HISTORY_RECENT_DAYS}일보다 오래된 기록에 ${other}건 있어요 — "이전 발송 조회"를 눌러보세요.` : `최근 ${HISTORY_RECENT_DAYS}일 기록에 ${other}건 있어요 — "최근 ${HISTORY_RECENT_DAYS}일로 돌아가기"를 눌러보세요.`}` : ''}</td></tr>`;
    return;
  }

  filtered.sort((a, b) => {
    if (historySortMode === 'name') {
      return a.name.localeCompare(b.name, 'ko');
    }
    return new Date(b.sentAt) - new Date(a.sentAt); // 날짜순: 최신순
  });

  historyBody.innerHTML = filtered.map(item => `
    <tr>
      <td><input type="checkbox" class="history-row-check" data-edit="history" data-id="${item.id}" ${selectedHistoryIds.has(item.id) ? 'checked' : ''} /></td>
      <td data-label="일시">${formatDateTime(item.sentAt)}</td>
      <td data-label="이름"><button class="history-name-btn" data-id="${item.id}" title="${escapeHtml(item.name)} — 눌러서 일정 등록 폼에 채우기">${item.name}</button></td>
      <td data-label="연락처">${item.phone}</td>
      <td data-label="양식"><button class="history-msg-btn" data-id="${item.id}" title="${escapeHtml(item.templateLabel)} — 눌러서 보낸 문자 확인">${escapeHtml(item.templateLabel)}</button>${item.templateLabelOriginal ? `<span class="hist-edited" title="${escapeHtml(`처음 양식: ${item.templateLabelOriginal}${item.editedAt ? ` · 고친 시각: ${formatDateTime(item.editedAt)}` : ''}`)}">수정됨</span>` : ''}</td>
      <td data-label="면접 제안 일시" title="${escapeHtml(item.proposedDate || '')}">${item.proposedDate || '-'}</td>
      <td data-label="메모" title="${escapeHtml(item.memo || '')}">${item.memo || '-'}</td>
      <td data-label="결과" class="${item.success ? 'result-ok' : 'result-err'}">${item.success ? '성공' : '실패'}</td>
      <td data-label="참석여부">${canEdit('history') ? `
        <select class="attendance-select" data-id="${item.id}">
          <option value="미응답" ${item.attendance === '미응답' || !item.attendance ? 'selected' : ''}>미응답</option>
          <option value="참석" ${item.attendance === '참석' ? 'selected' : ''}>참석</option>
          <option value="불참석" ${item.attendance === '불참석' ? 'selected' : ''}>불참석</option>
        </select>` : escapeHtml(item.attendance || '미응답')}
      </td>
      <td class="history-actions-cell"><button class="history-schedule-btn" data-edit="schedule" data-id="${item.id}">일정 등록</button> <button class="history-edit-btn" data-edit="history" data-id="${item.id}">수정</button></td>
    </tr>
  `).join('');

  historyBody.querySelectorAll('.history-row-check').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.checked) selectedHistoryIds.add(cb.dataset.id);
      else selectedHistoryIds.delete(cb.dataset.id);
      updateDeleteSelectedBtn();
    });
  });

  historyBody.querySelectorAll('.attendance-select').forEach(sel => {
    sel.addEventListener('change', async () => {
      await fetch(`/api/history/${sel.dataset.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendance: sel.value }),
      });
      const item = historyRaw.find(h => h.id === sel.dataset.id);
      if (item) item.attendance = sel.value;
    });
  });

  function fillScheduleFormFrom(item) {
    if (!canEdit('schedule')) return; // 일정 등록 권한이 없으면 폼이 숨겨져 있으므로 채우지 않음
    schNameInput.value = item.name;
    schPhoneInput.value = item.phone;
    schNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    schYearInput.focus();
  }

  historyBody.querySelectorAll('.history-name-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = historyRaw.find(h => h.id === btn.dataset.id);
      if (item) fillScheduleFormFrom(item);
    });
  });

  historyBody.querySelectorAll('.history-msg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = historyRaw.find(h => h.id === btn.dataset.id);
      if (item) openMsgModal(item);
    });
  });

  historyBody.querySelectorAll('.history-schedule-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = historyRaw.find(h => h.id === btn.dataset.id);
      if (item) fillScheduleFormFrom(item);
    });
  });

  historyBody.querySelectorAll('.history-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = historyRaw.find(h => h.id === btn.dataset.id);
      if (item) openHistEdit(item);
    });
  });

}

sortBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    sortBtns.forEach(b => b.classList.toggle('active', b === btn));
    historySortMode = btn.dataset.sort;
    renderHistory();
  });
});

historySearch.addEventListener('input', renderHistory);
historyMonthFilter.addEventListener('change', renderHistory);
document.getElementById('historyScopeBtn').addEventListener('click', () => historySetScope(historyScope === 'recent' ? 'older' : 'recent'));

function updateDeleteSelectedBtn() {
  deleteSelectedBtn.textContent = `삭제 (${selectedHistoryIds.size})`;
  deleteSelectedBtn.disabled = selectedHistoryIds.size === 0;
}

historySelectAll.addEventListener('change', () => {
  historyBody.querySelectorAll('.history-row-check').forEach(cb => {
    cb.checked = historySelectAll.checked;
    if (historySelectAll.checked) selectedHistoryIds.add(cb.dataset.id);
    else selectedHistoryIds.delete(cb.dataset.id);
  });
  updateDeleteSelectedBtn();
});

deleteSelectedBtn.addEventListener('click', async () => {
  if (selectedHistoryIds.size === 0) return;
  if (!confirm(`선택한 ${selectedHistoryIds.size}건을 삭제할까요?`)) return;
  deleteSelectedBtn.disabled = true;
  await Promise.all([...selectedHistoryIds].map(id =>
    fetch(`/api/history/${id}`, { method: 'DELETE' })
  ));
  selectedHistoryIds.clear();
  historySelectAll.checked = false;
  updateDeleteSelectedBtn();
  loadHistory();
});

addManualHistoryBtn.addEventListener('click', () => {
  manualHistoryForm.hidden = !manualHistoryForm.hidden;
});

manualHistorySubmitBtn.addEventListener('click', async () => {
  const name = manualName.value.trim();
  const phone = manualPhone.value.trim();
  if (!name || !phone) {
    manualHistoryStatus.textContent = '이름과 연락처는 필수입니다.';
    manualHistoryStatus.className = 'status err';
    return;
  }
  manualHistorySubmitBtn.disabled = true;
  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        templateLabel: manualTemplateLabel.value.trim(),
        proposedDate: manualProposedDate.value.trim(),
        memo: manualMemo.value.trim(),
        message: manualMessage.value.trim(),
        success: manualResult.value === 'true',
      }),
    });
    if (!res.ok) throw new Error();
    manualHistoryStatus.textContent = '이력이 추가되었습니다.';
    manualHistoryStatus.className = 'status ok';
    manualName.value = '';
    manualPhone.value = '';
    manualTemplateLabel.value = '';
    manualProposedDate.value = '';
    manualMemo.value = '';
    manualMessage.value = '';
    manualResult.value = 'true';
    loadHistory();
  } catch {
    manualHistoryStatus.textContent = '추가 중 오류가 발생했습니다.';
    manualHistoryStatus.className = 'status err';
  } finally {
    manualHistorySubmitBtn.disabled = false;
  }
});

[nameInput, dateInput].forEach(el => el.addEventListener('input', () => { validate(); updatePreview(); }));
phoneInput.addEventListener('input', validate);
templateSelect.addEventListener('change', () => {
  previewEdited = false;
  previewResetBtn.hidden = true;
  updateDateFieldVisibility();
  validate();
  updatePreview();
});
sendBtn.addEventListener('click', () => handleSend());

// ---------- 탭 전환 ----------
function showTab(tab) {
  if (typeof interviewDirty === 'function' && interviewDirty() && tab !== 'interview' && !confirm('면접 관리에 보내지 않은 답변이 있어요. 다른 탭으로 가도 작성한 답변은 이 화면에 남지만, 새로고침하거나 지원자를 바꾸면 사라져요.\n\n그래도 이동할까요?')) return;
  if (tab === 'posting' && !postingCreateOn()) tab = 'resume';   // 공고 만들기는 정비 전이라 숨겨져 있어요(켜는 법: 서버 환경변수 SHOW_POSTING_CREATE=1)
  if (tab === 'resume' || tab === 'posting') lastManageTab = tab;   // 공고 관리를 다시 누르면 직전에 보던 화면을 열어요
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab || (b.dataset.group === 'manage' && (tab === 'resume' || tab === 'posting'))));
  document.querySelectorAll('.manage-subnav .sub-btn').forEach(b => b.classList.toggle('active', b.dataset.sub === tab));
  sendView.hidden = tab !== 'send';
  document.body.classList.toggle('wide-tab', tab === 'interview');
  if (tab === 'manage') loadTasks();   // 채용과제 양식도 함께 보여줘요   // 면접 관리는 화면 가로 폭을 넓게 써요(목록·칸반이 한눈에 보이게)
  resumeView.hidden = tab !== 'resume';
  postingView.hidden = tab !== 'posting';
  interviewView.hidden = tab !== 'interview';
  manageView.hidden = tab !== 'manage';
  if (tab === 'manage') refreshTemplateManageSelect();
  if (tab === 'resume' || tab === 'posting') loadResumeData();
  if (tab === 'interview' && apView !== 'sched') loadApplicants(true);   // 면접 관리 = 노션 지원자 목록(예전 지원자 관리) + 면접 질문·답변
  if (tab === 'send') loadTemplates(); // 양식 변경사항 반영
}

let lastManageTab = 'resume';
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => { showTab(btn.dataset.group === 'manage' ? lastManageTab : btn.dataset.tab); if (btn.dataset.tab === 'interview' && typeof apView !== 'undefined' && apView === 'sched') apSetView('list'); });   // 위의 면접 탭을 누르면 지원자 목록부터 보여요
});
document.querySelectorAll('.manage-subnav .sub-btn').forEach(b => b.addEventListener('click', () => showTab(b.dataset.sub)));

// ---------- 양식 관리 ----------
function renderTemplateCard(tpl, container) {
  container.innerHTML = '';
  const node = templateCardTpl.content.cloneNode(true);
  const card = node.querySelector('.tpl-card');
  const labelView = node.querySelector('.tpl-label-view');
  const labelInput = node.querySelector('.tpl-label-input');
  const bodyView = node.querySelector('.tpl-body-view');
  const bodyInput = node.querySelector('.tpl-body-input');
  const editBtn = node.querySelector('.tpl-edit-btn');
  const saveBtn = node.querySelector('.tpl-save-btn');
  const cancelBtn = node.querySelector('.tpl-cancel-btn');
  const deleteBtn = node.querySelector('.tpl-delete-btn');
  const statusP = node.querySelector('.tpl-status');

  const isNew = !tpl.id;

  function setViewMode() {
    labelView.textContent = tpl.label || '';
    bodyView.textContent = tpl.body || '';
    labelView.hidden = false;
    bodyView.hidden = false;
    labelInput.hidden = true;
    bodyInput.hidden = true;
    editBtn.hidden = false;
    saveBtn.hidden = true;
    cancelBtn.hidden = true;
    deleteBtn.hidden = false;
  }

  function setEditMode() {
    labelInput.value = tpl.label || '';
    bodyInput.value = tpl.body || '';
    labelView.hidden = true;
    bodyView.hidden = true;
    labelInput.hidden = false;
    bodyInput.hidden = false;
    editBtn.hidden = true;
    saveBtn.hidden = false;
    cancelBtn.hidden = false;
    deleteBtn.hidden = true;
  }

  isNew ? setEditMode() : setViewMode();

  editBtn.addEventListener('click', setEditMode);

  cancelBtn.addEventListener('click', () => {
    if (isNew) {
      container.innerHTML = '';
      templateManageSelect.value = '';
      return;
    }
    statusP.textContent = '';
    setViewMode();
  });

  saveBtn.addEventListener('click', async () => {
    const label = labelInput.value.trim();
    const body = bodyInput.value.trim();
    if (!label || !body) {
      statusP.textContent = '양식 이름과 본문을 모두 입력하세요.';
      statusP.className = 'tpl-status err';
      return;
    }
    saveBtn.disabled = true;
    try {
      const url = isNew ? '/api/templates' : `/api/templates/${tpl.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '저장 실패');
      await refreshTemplateManageSelect();
      templateManageSelect.value = data.id;
      showSelectedTemplate();
      templateDetail.querySelector('.tpl-status').textContent = '저장되었습니다.';
      templateDetail.querySelector('.tpl-status').className = 'tpl-status ok';
    } catch (err) {
      statusP.textContent = err.message || '저장 중 오류가 발생했습니다.';
      statusP.className = 'tpl-status err';
    } finally {
      saveBtn.disabled = false;
    }
  });

  deleteBtn.addEventListener('click', async () => {
    if (!confirm(`"${tpl.label}" 양식을 삭제할까요?`)) return;
    try {
      const res = await fetch(`/api/templates/${tpl.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      await refreshTemplateManageSelect();
      templateManageSelect.value = '';
      templateDetail.innerHTML = '';
    } catch (err) {
      statusP.textContent = '삭제 중 오류가 발생했습니다.';
      statusP.className = 'tpl-status err';
    }
  });

  container.appendChild(card);
}

async function refreshTemplateManageSelect() {
  if (!canView('templates')) return;
  const res = await fetch('/api/templates/full');
  templates = await res.json();
  const current = templateManageSelect.value;
  templateManageSelect.innerHTML = '<option value="">양식을 선택하세요</option>';
  templates.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.label;
    templateManageSelect.appendChild(opt);
  });
  templateManageSelect.value = templates.some(t => t.id === current) ? current : '';
}

function showSelectedTemplate() {
  const tpl = templates.find(t => t.id === templateManageSelect.value);
  if (!tpl) {
    templateDetail.innerHTML = '';
    return;
  }
  renderTemplateCard(tpl, templateDetail);
}

templateManageSelect.addEventListener('change', showSelectedTemplate);

addTemplateBtn.addEventListener('click', () => {
  templateManageSelect.value = '';
  renderTemplateCard({ label: '', body: '' }, templateDetail);
});

// ---------- 면접 일정 ----------
// ---------- 날짜/시간 선택 헬퍼 (연/월/일 드롭다운 + 시/분 2자리 입력) ----------
function populateDateSelects(yearEl, monthEl, dayEl) {
  yearEl.innerHTML = ['2026', '2027', '2028']
    .map(y => `<option value="${y}" ${y === '2026' ? 'selected' : ''}>${y}년</option>`)
    .join('');
  monthEl.innerHTML = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0');
    return `<option value="${m}" ${m === '01' ? 'selected' : ''}>${i + 1}월</option>`;
  }).join('');
  dayEl.innerHTML = Array.from({ length: 31 }, (_, i) => {
    const d = String(i + 1).padStart(2, '0');
    return `<option value="${d}">${i + 1}일</option>`;
  }).join('');
}

function getDateTimeValue(yearEl, monthEl, dayEl, hourEl, minuteEl) {
  if (hourEl.value === '' || minuteEl.value === '') return '';
  const hh = String(Math.min(23, Math.max(0, Number(hourEl.value)))).padStart(2, '0');
  const mm = String(Math.min(59, Math.max(0, Number(minuteEl.value)))).padStart(2, '0');
  return `${yearEl.value}-${monthEl.value}-${dayEl.value}T${hh}:${mm}`;
}

function setDateTimeValue(yearEl, monthEl, dayEl, hourEl, minuteEl, iso) {
  if (!iso) {
    hourEl.value = '';
    minuteEl.value = '';
    return;
  }
  const [datePart, timePart] = iso.split('T');
  const [y, mo, d] = datePart.split('-');
  if (y) yearEl.value = y;
  if (mo) monthEl.value = mo;
  if (d) dayEl.value = d;
  if (timePart) {
    const [hh, mm] = timePart.split(':');
    hourEl.value = hh;
    minuteEl.value = mm;
  }
}

function formatSchedule(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' });
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

// 구글캘린더 URL이 요구하는 "로컬 시각 그대로" 포맷 (타임존 변환 없이 YYYYMMDDTHHMMSS)
function toCalendarLocal(dateObj) {
  return `${dateObj.getFullYear()}${pad2(dateObj.getMonth() + 1)}${pad2(dateObj.getDate())}T${pad2(dateObj.getHours())}${pad2(dateObj.getMinutes())}00`;
}

// 면접진행자 이메일 매핑 (도메인: openhan.kr) — 매핑이 없는 진행자는 참석자로 추가되지 않음
const INTERVIEWER_EMAIL_MAP = {
  '니콜': 'nicole',
  '로이': 'loi',
  '카라': 'kara',
  '한스': 'hans',
  '마리네뜨': 'marinette',
  '케빈': 'kevin',
  '안나': 'anna',
  '헨리': 'henry',
};
const INTERVIEWER_EMAIL_DOMAIN = 'openhan.kr';

// 구글캘린더 "일정 추가" 링크 생성 (OAuth 없이 동작, 기본 1시간짜리 일정)
// - SCM팀은 장소 태그를 붙이지 않고, 그 외 팀은 제목 앞에 [3F] 표기
// - 장소(location), 설명(details)은 넣지 않음, 면접진행자를 참석자로 추가 (이메일 매핑이 있는 경우만)
function buildGoogleCalendarUrl(s) {
  const start = new Date(s.interviewAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const floorTag = s.team === 'SCM팀' ? '' : '[3F] ';
  const title = `${floorTag}${s.team} 면접 - ${s.name}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toCalendarLocal(start)}/${toCalendarLocal(end)}`,
  });

  const username = INTERVIEWER_EMAIL_MAP[s.interviewer];
  if (username) {
    params.set('add', `${username}@${INTERVIEWER_EMAIL_DOMAIN}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}


// ---------- 오랩 일정에 추가 (오랩 캘린더 https://ohlab.ai/cal 은 주소로 칸을 채울 수 없어서, 오랩 "새 일정"에 넣을 값을 복사해요) ----------
const ORAB_CAL_URL = 'https://ohlab.ai/cal';
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];
function orabClock(d) { const h = d.getHours(), m = d.getMinutes(); return `${h < 12 ? '오전' : '오후'} ${h % 12 === 0 ? 12 : h % 12}:${pad2(m)}`; }
function orabDay(d) { return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAY_KO[d.getDay()]})`; }
// 오랩 "새 일정" 창이 받는 값(제목·날짜·시작–끝·설명). 기본 1시간(지금 구글 링크와 같아요). 지원자 연락처는 넣지 않아요(캘린더는 팀이 같이 봐요).
function buildOrabFields(s) {
  const start = new Date(s.interviewAt), end = new Date(start.getTime() + 60 * 60 * 1000);
  const floorTag = s.team === 'SCM팀' ? '' : '[3F] ';
  const sameDay = start.toDateString() === end.toDateString();
  const desc = [s.interviewer ? `면접 진행자: ${s.interviewer}` : '', s.location ? `장소: ${s.location}` : ''].filter(Boolean).join(' / ');
  return [
    { key: 'title', label: '제목', value: `${floorTag}${s.team} 면접 - ${s.name}` },
    { key: 'date', label: '날짜', value: orabDay(start) },
    { key: 'time', label: '시간', value: `${orabClock(start)} – ${sameDay ? '' : orabDay(end) + ' '}${orabClock(end)}` },
    ...(desc ? [{ key: 'desc', label: '설명', value: desc }] : []),
  ];
}
async function orabCopy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch { try { const t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); const ok = document.execCommand('copy'); t.remove(); return ok; } catch { return false; } }
}
function orabRender(box, s) {
  const f = buildOrabFields(s);
  box.hidden = false;
  box.innerHTML = `<div class="manage-hint" style="margin:0 0 4px">오랩 "새 일정" 창에 아래 값을 넣어주세요. 넣을 곳은 "오랩 일정"을 고르고 "나만 보기"는 꺼야 팀이 봐요.</div>` + f.map(x => `<div class="sch-orab-row"><span class="sch-orab-label">${x.label}</span><span class="sch-orab-value">${escapeHtml(x.value)}</span><button type="button" class="link-btn sch-orab-copy" data-key="${x.key}">복사</button></div>`).join('') + '<div class="sch-orab-msg status" aria-live="polite"></div>';
  box.onclick = async e => {
    const b = e.target.closest('.sch-orab-copy'); if (!b) return;
    const x = f.find(v => v.key === b.dataset.key); const ok = await orabCopy(x.value);
    const msg = box.querySelector('.sch-orab-msg'); msg.textContent = ok ? `"${x.label}"을 복사했어요.` : '복사하지 못했어요. 값을 직접 선택해서 복사해주세요.'; msg.className = 'sch-orab-msg status' + (ok ? ' ok' : ' err');
  };
  return f;
}

function renderScheduleCard(s, container) {
  container.innerHTML = '';
  const node = scheduleCardTpl.content.cloneNode(true);
  const card = node.querySelector('.tpl-card');
  const nameView = node.querySelector('.sch-name-view');
  const viewBlock = node.querySelector('.sch-detail-view');
  const editBlock = node.querySelector('.sch-detail-edit');
  const phoneView = node.querySelector('.sch-phone-view');
  const dateView = node.querySelector('.sch-date-view');
  const teamView = node.querySelector('.sch-team-view');
  const interviewerView = node.querySelector('.sch-interviewer-view');
  const locationView = node.querySelector('.sch-location-view');
  const roundView = node.querySelector('.sch-round-view');
  const noteView = node.querySelector('.sch-note-view');
  const statusView = node.querySelector('.sch-status-view');
  const cancelRow = node.querySelector('.sch-cancel-row');
  const cancelView = node.querySelector('.sch-cancel-view');
  const changeLogBox = node.querySelector('.sch-change-log');
  const changeListEl = node.querySelector('.sch-change-list');
  const statusInputEl = node.querySelector('.sch-status-input');
  const reasonInputEl = node.querySelector('.sch-reason-input');
  const phoneInputEl = node.querySelector('.sch-phone-input');
  const yearInputEl = node.querySelector('.sch-year-input');
  const monthInputEl = node.querySelector('.sch-month-input');
  const dayInputEl = node.querySelector('.sch-day-input');
  const hourInputEl = node.querySelector('.sch-hour-input');
  const minuteInputEl = node.querySelector('.sch-minute-input');
  const teamInputEl = node.querySelector('.sch-team-input');
  const interviewerInputEl = node.querySelector('.sch-interviewer-input');
  const locationInputEl = node.querySelector('.sch-location-input');
  const roundInputEl = node.querySelector('.sch-round-input');
  const noteInputEl = node.querySelector('.sch-note-input');
  const editBtn = node.querySelector('.sch-edit-btn');
  const saveBtn = node.querySelector('.sch-save-btn');
  const cancelBtn = node.querySelector('.sch-cancel-btn');
  const deleteBtn = node.querySelector('.sch-delete-btn');
  const calendarBtn = node.querySelector('.sch-calendar-btn');
  const orabBtn = node.querySelector('.sch-orab-btn'), orabBox = node.querySelector('.sch-orab-box');
  const statusMsg = node.querySelector('.sch-status-msg');

  setupInterviewPanel(card, s);   // 면접 질문 추천(노션 문항 은행 + 이력서 맞춤)

  orabBtn.addEventListener('click', async () => {
    const f = orabRender(orabBox, s);
    const ok = await orabCopy(f[0].value);   // 제목을 바로 복사해 두고, 나머지는 칸마다 복사해요
    const msg = orabBox.querySelector('.sch-orab-msg'); msg.textContent = ok ? `제목을 복사했어요. 오랩 "새 일정"에 붙여넣고, 날짜·시간은 아래 값을 넣어주세요.` : '오랩 캘린더를 열었어요. 아래 값을 직접 복사해서 넣어주세요.'; msg.className = 'sch-orab-msg status' + (ok ? ' ok' : ' err');
    const win = window.open(ORAB_CAL_URL, '_blank', 'noopener');
    if (!win) msg.textContent += ' (새 탭이 막혔어요. 팝업을 허용하거나 오랩 캘린더를 직접 열어주세요)';
  });
  calendarBtn.addEventListener('click', () => {
    try {
      const url = buildGoogleCalendarUrl(s);
      const win = window.open(url, '_blank');
      if (!win) {
        // 팝업이 차단된 경우: 같은 탭에서 이동하는 방식으로 대체
        location.href = url;
      }
    } catch (err) {
      alert('구글캘린더 링크를 만드는 중 오류가 발생했습니다: ' + err.message);
    }
  });

  fillTeamOptions(teamInputEl);
  fillInterviewerOptions(interviewerInputEl);
  fillLocationOptions(locationInputEl);
  fillRoundOptions(roundInputEl);
  populateDateSelects(yearInputEl, monthInputEl, dayInputEl);

  function setViewMode() {
    nameView.textContent = s.name;
    phoneView.textContent = s.phone || '-';
    dateView.textContent = formatSchedule(s.interviewAt);
    teamView.textContent = s.team || '-';
    interviewerView.textContent = s.interviewer || '-';
    locationView.textContent = s.location || '-';
    roundView.textContent = s.round || '-';
    noteView.textContent = s.note || '-';
    const cancelled = s.status === '취소';
    const changes = Array.isArray(s.changeLog) ? s.changeLog : [];
    statusView.textContent = cancelled ? '취소됨' : (changes.length ? `예정 (일정 ${changes.length}회 변경됨)` : '예정');
    cancelRow.hidden = !cancelled;
    cancelView.textContent = cancelled
      ? `${s.cancelReason || '사유 없음'}${s.cancelledAt ? ' (' + formatDateTime(s.cancelledAt) + ' 취소)' : ''}`
      : '';
    changeLogBox.hidden = changes.length === 0;
    changeListEl.innerHTML = changes.map(c =>
      `<li>${formatSchedule(c.from)} → ${formatSchedule(c.to)}${c.reason ? ' · ' + c.reason : ''} <span class="sch-change-at">(${formatDateTime(c.at)} 변경)</span></li>`
    ).join('');
    viewBlock.hidden = false;
    editBlock.hidden = true;
    editBtn.hidden = false;
    saveBtn.hidden = true;
    cancelBtn.hidden = true;
    deleteBtn.hidden = false;
  }

  function setEditMode() {
    phoneInputEl.value = s.phone || '';
    setDateTimeValue(yearInputEl, monthInputEl, dayInputEl, hourInputEl, minuteInputEl, s.interviewAt || '');
    teamInputEl.value = s.team || '';
    interviewerInputEl.value = s.interviewer || '';
    locationInputEl.value = s.location || '';
    roundInputEl.value = s.round || '';
    noteInputEl.value = s.note || '';
    statusInputEl.value = s.status === '취소' ? '취소' : '예정';
    reasonInputEl.value = '';
    viewBlock.hidden = true;
    editBlock.hidden = false;
    editBtn.hidden = true;
    saveBtn.hidden = false;
    cancelBtn.hidden = false;
    deleteBtn.hidden = true;
  }

  setViewMode();
  editBtn.addEventListener('click', setEditMode);
  cancelBtn.addEventListener('click', () => {
    statusMsg.textContent = '';
    setViewMode();
  });

  saveBtn.addEventListener('click', async () => {
    const phone = phoneInputEl.value.trim();
    const interviewAt = getDateTimeValue(yearInputEl, monthInputEl, dayInputEl, hourInputEl, minuteInputEl);
    const team = teamInputEl.value;
    if (!phone || !interviewAt || !team) {
      statusMsg.textContent = '연락처, 면접 일시, 팀은 필수입니다.';
      statusMsg.className = 'tpl-status sch-status-msg err';
      return;
    }
    saveBtn.disabled = true;
    try {
      const res = await fetch(`/api/schedules/${s.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone, interviewAt, team,
          interviewer: interviewerInputEl.value.trim(),
          location: locationInputEl.value.trim(),
          round: roundInputEl.value,
          note: noteInputEl.value.trim(),
          status: statusInputEl.value,
          reason: reasonInputEl.value.trim(),
        }),
      });
      if (!res.ok) throw new Error('저장 실패');
      await loadSchedules();
      const updated = schedules.find(x => x.id === s.id);
      if (updated) renderScheduleCard(updated, scheduleDetail);
      const msgEl = scheduleDetail.querySelector('.sch-status-msg');
      if (msgEl) {
        msgEl.textContent = '저장되었습니다.';
        msgEl.className = 'tpl-status sch-status-msg ok';
      }
    } catch (err) {
      statusMsg.textContent = '저장 중 오류가 발생했습니다.';
      statusMsg.className = 'tpl-status sch-status-msg err';
    } finally {
      saveBtn.disabled = false;
    }
  });

  deleteBtn.addEventListener('click', async () => {
    if (!confirm(`"${s.name}" 일정을 삭제할까요?`)) return;
    try {
      const res = await fetch(`/api/schedules/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('삭제 실패');
      scheduleDetail.innerHTML = '';
      await loadSchedules();
    } catch (err) {
      statusMsg.textContent = '삭제 중 오류가 발생했습니다.';
      statusMsg.className = 'tpl-status sch-status-msg err';
    }
  });

  container.appendChild(card);
}

let teamList = [];

async function loadTeams() {
  if (!canView('schedule')) return;
  const res = await fetch('/api/teams');
  teamList = await res.json();
  fillTeamOptions(schTeamInput);
  updateTeamFilterOptions();
}

function fillTeamOptions(selectEl) {
  const current = selectEl.value;
  const placeholder = selectEl === scheduleTeamFilter ? '전체 팀' : '팀을 선택하세요';
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  teamList.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    selectEl.appendChild(opt);
  });
  if (teamList.includes(current)) selectEl.value = current;
}

let interviewerList = [];
let locationList = [];

async function loadInterviewers() {
  if (!canView('schedule')) return;
  const res = await fetch('/api/interviewers');
  interviewerList = await res.json();
  fillInterviewerOptions(schInterviewerInput);
}

function fillInterviewerOptions(selectEl) {
  const current = selectEl.value;
  selectEl.innerHTML = '<option value="">면접진행자를 선택하세요</option>';
  interviewerList.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    selectEl.appendChild(opt);
  });
  if (interviewerList.includes(current)) selectEl.value = current;
}

async function loadLocations() {
  if (!canView('schedule')) return;
  const res = await fetch('/api/locations');
  locationList = await res.json();
  fillLocationOptions(schLocationInput);
}

function fillLocationOptions(selectEl) {
  const current = selectEl.value;
  selectEl.innerHTML = '<option value="">면접장소를 선택하세요</option>';
  locationList.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    selectEl.appendChild(opt);
  });
  if (locationList.includes(current)) selectEl.value = current;
}

let roundList = [];

async function loadRounds() {
  if (!canView('schedule')) return;
  const res = await fetch('/api/rounds');
  roundList = await res.json();
  fillRoundOptions(schRoundInput);
  fillRoundFilterOptions();
}

function fillRoundOptions(selectEl) {
  const current = selectEl.value;
  selectEl.innerHTML = '<option value="">구분을 선택하세요</option>';
  roundList.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    selectEl.appendChild(opt);
  });
  if (roundList.includes(current)) selectEl.value = current;
}

function fillRoundFilterOptions() {
  const current = scheduleRoundFilter.value;
  scheduleRoundFilter.innerHTML = '<option value="">전체구분</option>';
  roundList.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r;
    opt.textContent = r;
    scheduleRoundFilter.appendChild(opt);
  });
  if (roundList.includes(current)) scheduleRoundFilter.value = current;
}

async function loadSchedules() {
  if (!canView('schedule')) return;
  const res = await fetch('/api/schedules');
  schedules = await res.json();
  renderScheduleOverview();
  renderScheduleList();
}

function dateKey(iso) {
  if (!iso) return '';
  return iso.slice(0, 10); // YYYY-MM-DD
}

function todayKeyStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatTimeOnly(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

// "2026년 9월 10일 14시 30분" 형식
function formatFullKorean(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}시 ${mm}분`;
}

// 오늘 날짜를 "2026년 9월 10일" 형식으로 표시
function formatTodayHeading() {
  const now = new Date();
  return `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 오늘의 면접일정`;
}

// 오늘 면접자만 보여주는 하단 개요 (시간/이름/팀/면접진행자/면접장소)
function renderScheduleOverview() {
  scheduleOverviewTitle.textContent = formatTodayHeading();

  const todayKey = todayKeyStr();
  const todays = schedules
    .filter(s => dateKey(s.interviewAt) === todayKey && s.status !== '취소')
    .sort((a, b) => a.interviewAt.localeCompare(b.interviewAt));

  if (!todays.length) {
    scheduleOverview.innerHTML = '<p class="manage-hint">오늘 예정된 면접이 없습니다.</p>';
    return;
  }

  scheduleOverview.innerHTML = `
    <table class="history-table overview-table">
      <thead>
        <tr>
          <th>일시</th>
          <th>이름</th>
          <th>장소</th>
          <th>팀</th>
          <th>면접자</th>
        </tr>
      </thead>
      <tbody>
        ${todays.map(s => `
          <tr class="overview-row" data-id="${s.id}">
            <td data-label="일시">${formatFullKorean(s.interviewAt)}</td>
            <td data-label="이름">${s.name}</td>
            <td data-label="장소">${s.location || '-'}</td>
            <td data-label="팀">${s.team || '-'}</td>
            <td data-label="면접자">${s.interviewer || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;

  scheduleOverview.querySelectorAll('.overview-row').forEach(row => {
    row.addEventListener('click', () => selectSchedule(row.dataset.id));
  });
}

// 팀 필터 옵션 구성 (고정 팀 목록 기준)
function updateTeamFilterOptions() {
  fillTeamOptions(scheduleTeamFilter);
}

// 오늘부터 n일 뒤까지의 범위
function getRollingRange(now, days) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  end.setHours(23, 59, 59, 999);
  return [start, end];
}

// 팀/기간/이름 필터가 적용된 전체 목록 테이블
function renderScheduleList() {
  const team = scheduleTeamFilter.value;
  const round = scheduleRoundFilter.value;
  const statusFilter = scheduleStatusFilter.value;
  const period = schedulePeriodFilter.value;
  const keyword = scheduleNameSearch.value.trim().toLowerCase();
  const now = new Date();

  let range = null;
  if (period === 'day') range = getRollingRange(now, 1);
  if (period === 'week') range = getRollingRange(now, 7);
  if (period === 'month') range = getRollingRange(now, 30);
  if (period === '3month') range = getRollingRange(now, 90);

  const filtered = schedules.filter(s => {
    const matchesTeam = !team || s.team === team;
    if (!matchesTeam) return false;
    const matchesRound = !round || s.round === round;
    if (!matchesRound) return false;
    const isCancelled = s.status === '취소';
    const isChanged = Array.isArray(s.changeLog) && s.changeLog.length > 0;
    if (statusFilter === 'active' && isCancelled) return false;
    if (statusFilter === 'changed' && !isChanged) return false;
    if (statusFilter === 'cancelled' && !isCancelled) return false;
    const matchesKeyword = !keyword || s.name.toLowerCase().includes(keyword);
    if (!matchesKeyword) return false;
    if (!range) return true;
    const d = new Date(s.interviewAt);
    return d >= range[0] && d <= range[1];
  }).sort((a, b) => {
    // 다가올 일정은 위쪽에 가까운 날짜순, 지난 일정은 맨 아래로 (최근 지난 일정이 먼저, 오래된 것일수록 더 아래)
    const aFuture = new Date(a.interviewAt) >= now;
    const bFuture = new Date(b.interviewAt) >= now;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    return aFuture
      ? a.interviewAt.localeCompare(b.interviewAt)
      : b.interviewAt.localeCompare(a.interviewAt);
  });

  if (!filtered.length) {
    scheduleListBody.innerHTML = '<tr><td colspan="6" class="empty-row">조건에 맞는 일정이 없습니다.</td></tr>';
    return;
  }

  scheduleListBody.innerHTML = filtered.map(s => {
    const cancelled = s.status === '취소';
    const changed = Array.isArray(s.changeLog) && s.changeLog.length > 0;
    const badge = cancelled
      ? '<span class="badge badge-cancel">취소</span>'
      : (changed ? '<span class="badge badge-change">변경</span>' : '');
    return `
    <tr class="${cancelled ? 'row-cancelled' : ''}">
      <td data-label="일시">${formatSchedule(s.interviewAt)}</td>
      <td data-label="이름">${s.name}${badge}</td>
      <td data-label="연락처">${s.phone || '-'}</td>
      <td data-label="구분">${s.round || '-'}</td>
      <td data-label="팀">${s.team || '-'}</td>
      <td><button class="schedule-view-btn" data-id="${s.id}">상세</button></td>
    </tr>`;
  }).join('');

  scheduleListBody.querySelectorAll('.schedule-view-btn').forEach(btn => {
    btn.addEventListener('click', () => selectSchedule(btn.dataset.id));
  });
}

function selectSchedule(id) {
  const s = schedules.find(x => x.id === id);
  if (!s) return;
  renderScheduleCard(s, scheduleDetail);
  scheduleDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

scheduleTeamFilter.addEventListener('change', renderScheduleList);
scheduleRoundFilter.addEventListener('change', renderScheduleList);
scheduleStatusFilter.addEventListener('change', renderScheduleList);
schedulePeriodFilter.addEventListener('change', renderScheduleList);
scheduleNameSearch.addEventListener('input', renderScheduleList);

scheduleFilterResetBtn.addEventListener('click', () => {
  scheduleTeamFilter.value = '';
  scheduleRoundFilter.value = '';
  scheduleStatusFilter.value = '';
  schedulePeriodFilter.value = 'all';
  scheduleNameSearch.value = '';
  renderScheduleList();
});

addScheduleBtn.addEventListener('click', async () => {
  const name = schNameInput.value.trim();
  const phone = schPhoneInput.value.trim();
  const interviewAt = getDateTimeValue(schYearInput, schMonthInput, schDayInput, schHourInput, schMinuteInput);
  const team = schTeamInput.value;
  if (!name || !phone || !interviewAt || !team) {
    scheduleStatus.textContent = '이름, 연락처, 면접 일시(시/분 포함), 팀은 필수입니다.';
    scheduleStatus.className = 'status err';
    return;
  }
  addScheduleBtn.disabled = true;
  try {
    const res = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone,
        interviewAt,
        team,
        interviewer: schInterviewerInput.value.trim(),
        location: schLocationInput.value.trim(),
        round: schRoundInput.value,
        note: schNoteInput.value.trim(),
      }),
    });
    if (!res.ok) throw new Error();
    const created = await res.json();
    scheduleStatus.textContent = '일정이 등록되었습니다.';
    scheduleStatus.className = 'status ok';
    schNameInput.value = '';
    schPhoneInput.value = '';
    populateDateSelects(schYearInput, schMonthInput, schDayInput);
    schHourInput.value = '';
    schMinuteInput.value = '';
    schTeamInput.value = '';
    schInterviewerInput.value = '';
    schLocationInput.value = '';
    schRoundInput.value = '';
    schNoteInput.value = '';
    await loadSchedules();
    selectSchedule(created.id);
  } catch {
    scheduleStatus.textContent = '등록 중 오류가 발생했습니다.';
    scheduleStatus.className = 'status err';
  } finally {
    addScheduleBtn.disabled = false;
  }
});

populateDateSelects(schYearInput, schMonthInput, schDayInput);

// (초기 데이터 로딩은 아래 bootApp()에서 로그인/권한을 확인한 뒤에 합니다)

// ---------- 이력서 검토 ----------
let criteriaEditing = false;   // 사명·인재상을 수정 중인지
let criteriaState = null;      // { companyIntro, idealProfile, rubric: [...] }
let lastScreening = null;      // 마지막 AI 평가 결과 (총점 재계산에 사용)

function rubricRows(list) {
  return (list || []).map(r => `
    <tr>
      <td data-label="평가 영역"><strong>${escapeHtml(r.area)}</strong></td>
      <td data-label="세부 항목">${escapeHtml(r.item)}</td>
      <td data-label="배점">${r.max}점</td>
      <td data-label="평가 기준">${escapeHtml(r.criteria)}</td>
    </tr>`).join('');
}
function renderRubricTable() {
  const rs = criteriaState.rubrics || { experienced: criteriaState.rubric, junior: [] };
  rubricBody.innerHTML = rubricRows(rs.experienced);
  document.getElementById('rubricBodyJunior').innerHTML = rubricRows(rs.junior);
  document.getElementById('rubricBodyFashion').innerHTML = rubricRows(rs.fashion || []);
}

// 사명·인재상: 보기만 해요. (서버의 수정 기능은 남겨 두었고, 필요하면 나중에 따로 화면을 붙일 수 있어요)
function renderCriteria() {
  if (!criteriaEditing) {   // 수정 중에 새로고침(다른 탭 갔다 오기 등)이 일어나도 쓰던 글을 덮어쓰지 않음
    companyIntroInput.value = criteriaState.companyIntro || '';
    idealProfileInput.value = criteriaState.idealProfile || '';
    criteriaGrowAll();   // 값을 채울 때마다(처음 불러올 때·저장·되돌리기·취소) 글칸 높이를 내용에 맞춤. 접혀 있으면 상자를 펼칠 때 다시 맞춰요
  }
  renderRubricTable();
}
// 글칸을 내용 길이에 맞춰 늘려서 안쪽 스크롤바가 안 보이게 함 (상자를 펼칠 때·글을 고칠 때 호출)
function autoGrow(el) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = (el.scrollHeight + 2) + 'px';
}
function criteriaGrowAll() { autoGrow(companyIntroInput); autoGrow(idealProfileInput); }
function criteriaHasUnsaved() {
  return criteriaEditing && criteriaState && (companyIntroInput.value !== (criteriaState.companyIntro || '') || idealProfileInput.value !== (criteriaState.idealProfile || ''));
}
function setCriteriaEditing(on) {
  criteriaEditing = on;
  companyIntroInput.readOnly = !on;
  idealProfileInput.readOnly = !on;
  document.getElementById('editCriteriaBtn').hidden = on;
  document.getElementById('saveCriteriaBtn').hidden = !on;
  document.getElementById('cancelCriteriaBtn').hidden = !on;
  document.getElementById('resetCriteriaBtn').hidden = !on;
  if (on) { document.getElementById('companyBox').open = true; document.getElementById('idealBox').open = true; setTimeout(criteriaGrowAll, 0); }
}
['companyBox', 'idealBox'].forEach(id => document.getElementById(id).addEventListener('toggle', e => { if (e.target.open) criteriaGrowAll(); }));
[companyIntroInput, idealProfileInput].forEach(el => el.addEventListener('input', () => autoGrow(el)));
window.addEventListener('resize', () => { if (document.getElementById('companyBox').open || document.getElementById('idealBox').open) criteriaGrowAll(); });
document.getElementById('editCriteriaBtn').addEventListener('click', () => { criteriaStatus.textContent = ''; setCriteriaEditing(true); companyIntroInput.focus(); });
document.getElementById('cancelCriteriaBtn').addEventListener('click', () => {
  if (criteriaHasUnsaved() && !confirm('고친 내용을 저장하지 않고 닫을까요?')) return;
  setCriteriaEditing(false); renderCriteria(); criteriaStatus.textContent = '';
});
document.getElementById('saveCriteriaBtn').addEventListener('click', async () => {
  const btn = document.getElementById('saveCriteriaBtn'); btn.disabled = true;
  try {
    const res = await fetch('/api/criteria', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ companyIntro: companyIntroInput.value, idealProfile: idealProfileInput.value }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');
    criteriaState = { ...criteriaState, companyIntro: data.companyIntro, idealProfile: data.idealProfile };
    setCriteriaEditing(false); renderCriteria();
    criteriaStatus.textContent = '저장했어요. 다음 AI 공고 초안과 이력서 평가부터 반영돼요.'; criteriaStatus.className = 'status ok';
  } catch (err) {
    criteriaStatus.textContent = err.message || '저장 중 오류가 발생했어요.'; criteriaStatus.className = 'status err';
  } finally { btn.disabled = false; }
});
document.getElementById('resetCriteriaBtn').addEventListener('click', async () => {
  if (!confirm('사명·인재상을 처음 내용(노션 「사명, 비전, 인재상」 기준)으로 되돌릴까요?\n직접 고친 내용은 사라져요. 공고는 그대로예요.')) return;
  try {
    const res = await fetch('/api/criteria/reset', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '되돌리기 실패');
    criteriaState = { ...criteriaState, companyIntro: data.companyIntro, idealProfile: data.idealProfile };
    setCriteriaEditing(false); renderCriteria();
    criteriaStatus.textContent = '처음 내용으로 되돌렸어요.'; criteriaStatus.className = 'status ok';
  } catch (err) { criteriaStatus.textContent = err.message || '되돌리는 중 오류가 발생했어요.'; criteriaStatus.className = 'status err'; }
});

async function loadCriteria() {
  try {
    const res = await fetch('/api/criteria');
    const data = await res.json();
    if (!res.ok || typeof data.idealProfile !== 'string') throw new Error(data.error || '불러오기 실패');
    criteriaState = data;
    renderCriteria();
    criteriaStatus.textContent = '';
  } catch (err) {
    criteriaStatus.textContent = '사명·인재상을 불러오지 못했습니다: ' + (err.message || '');
    criteriaStatus.className = 'status err';
  }
}

// ---------- 공고 (팀 → 포지션 → 근무 조건 → 공고문 → 확정 · 조회) ----------
const postTeam = document.getElementById('postTeam');
const postProfile = document.getElementById('postProfile');
const postApplyStart = document.getElementById('postApplyStart');
const postApplyEnd = document.getElementById('postApplyEnd');
const postPortfolio = document.getElementById('postPortfolio');
const postWorkplaceHint = document.getElementById('postWorkplaceHint');
const variantBox = document.getElementById('variantBox');
const variantBtns = document.getElementById('variantBtns');
const teamRefText = document.getElementById('teamRefText');
const teamRefStatus = document.getElementById('teamRefStatus');
const postPosition = document.getElementById('postPosition');
const postPositionList = document.getElementById('postPositionList');
const postPositionHint = document.getElementById('postPositionHint');
const loadPrevPostingBtn = document.getElementById('loadPrevPostingBtn');
const postWorkplace = document.getElementById('postWorkplace');
const postType = document.getElementById('postType');
const postMonths = document.getElementById('postMonths');
const saveDefaultsBtn = document.getElementById('saveDefaultsBtn');
const postNotes = document.getElementById('postNotes');
const draftJdBtn = document.getElementById('draftJdBtn');
const postJd = document.getElementById('postJd');
const postEditing = document.getElementById('postEditing');
const confirmPostingBtn = document.getElementById('confirmPostingBtn');
const saveDraftBtn = document.getElementById('saveDraftBtn');
const copyPostingBtn = document.getElementById('copyPostingBtn');
const newPostingBtn = document.getElementById('newPostingBtn');
const postTodo = document.getElementById('postTodo');
const postStatus = document.getElementById('postStatus');
const listTeam = document.getElementById('listTeam');
const listStatus = document.getElementById('listStatus');
const listSort = document.getElementById('listSort');
const postingCount = document.getElementById('postingCount');
const postingBody = document.getElementById('postingBody');
const postingDetail = document.getElementById('postingDetail');
const postingDetailTitle = document.getElementById('postingDetailTitle');
const postingDetailJd = document.getElementById('postingDetailJd');

let postingsAll = [];      // 모든 공고(요약, 최신순)
let postTeams = [];        // 팀 선택지 (면접 일정의 팀만)
let otherTeams = [];       // 면접 일정에 없는 예전 팀 (조회 필터·예전 공고 수정에서만 보임)
let extraTeam = '';        // 예전 팀 공고를 고치는 동안만 선택지에 끼워 넣는 팀
let postTypes = [];        // 고용 형태 선택지
let postingDefaults = { workplace: '', employmentType: '', months: 3, applyMonths: 2, commonNotice: '', defaultCommonNotice: '', teamWorkplaces: {} };
let teamAliases = {};      // 앱의 팀 이름 → 공고·노션에서 쓰는 이름
let variantsState = [];    // AI 초안 여러 가지
let variantEdited = false; // 초안을 고른 뒤 사람이 고쳤는지
let portfolioTouched = false;
let applyEndTouched = false;
let editingPosting = null; // 편집기에 불러온 기존 공고 (null이면 새 공고)
let postDirty = false;     // 저장하지 않은 수정이 있는지
const POSTING_PLACEHOLDER = '[입력]';
const POSTING_RECOMMEND = '[추천]';
// 남은 표시 개수: [입력](직접 채울 곳)과 [추천](AI가 추천한 경력, 확인 후 표시를 지울 곳)
function countMarks(text) {
  return { input: (String(text).match(/\[입력\]/g) || []).length, rec: (String(text).match(/\[추천\]/g) || []).length };
}
function marksText(m) {
  const parts = [];
  if (m.input) parts.push(`${POSTING_PLACEHOLDER} ${m.input}곳`);
  if (m.rec) parts.push(`${POSTING_RECOMMEND} ${m.rec}곳(AI가 추천한 경력이에요)`);
  return parts.join(', ');
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}
function conditionText(p) {
  return [p.workplace || '근무지 미정', p.employmentType || '형태 미정', p.months ? p.months + '개월' : '기간 미정',
    ({ junior: '신입직', fashion: '패션 직무형' })[p.profile] || '', p.applyEnd ? '접수 ~' + p.applyEnd.slice(5).replace('-', '.') : ''].filter(Boolean).join(' · ');
}
// 팀: 면접 일정의 팀 중에서만 고름. (예전 공고에만 있던 팀의 공고를 고칠 때는 그 팀이 임시로 선택지에 보임)
function currentTeam() { return postTeam.value; }
function setTeamValue(team) {
  extraTeam = team && !postTeams.includes(team) ? team : '';
  renderPostTeamOptions(team || '');
  postTeam.value = team || '';
}
function workplaceForTeam(team) {
  const m = postingDefaults.teamWorkplaces || {};
  return Object.prototype.hasOwnProperty.call(m, team) ? m[team] : postingDefaults.workplace;
}
function updateWorkplaceHint() {
  const team = currentTeam();
  const m = postingDefaults.teamWorkplaces || {};
  const has = team && Object.prototype.hasOwnProperty.call(m, team);
  if (has && !m[team]) { postWorkplaceHint.hidden = false; postWorkplaceHint.textContent = `이 팀(${team})은 근무지가 다른 팀이에요. 근무지를 입력하고 "이 팀 근무지를 기본값으로 저장"을 눌러두면 다음부터 자동으로 채워져요.`; }
  else if (has) { postWorkplaceHint.hidden = false; postWorkplaceHint.textContent = `${team}의 기본 근무지가 채워졌어요.`; }
  else postWorkplaceHint.hidden = true;
}
// 디자인·포토 같은 직무는 포트폴리오 안내를 기본으로 켬 (직접 바꾸면 그대로 둠)
function wantsPortfolio() {
  const team = currentTeam();
  return ['제품디자인팀', '인디비주엘팀', '비주얼팀'].includes(team) || /디자인|디자이너|포토|그래픽|크리에이터|영상|촬영|비주얼/.test(postPosition.value);
}
function syncPortfolioDefault() { if (!portfolioTouched) postPortfolio.checked = wantsPortfolio(); }
function toDateStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function addMonthsStr(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(y, m - 1 + months, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(d, last));
  return toDateStr(t);
}
function setPostStatus(msg, cls) { postStatus.textContent = msg || ''; postStatus.className = 'status' + (cls ? ' ' + cls : ''); }

// --- 선택지 채우기 ---
function renderPostTeamOptions(keepValue) {
  const keep = keepValue !== undefined ? keepValue : postTeam.value;
  if (extraTeam && keep !== extraTeam) extraTeam = ''; // 예전 팀이 더 이상 선택돼 있지 않으면 선택지에서 뺌
  const esc = escapeHtml;
  postTeam.innerHTML = '<option value="">팀을 선택하세요</option>' + postTeams.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')
    + (extraTeam ? `<option value="${esc(extraTeam)}">${esc(extraTeam)} (면접 일정에 없는 예전 팀)</option>` : '');
  if (postTeams.includes(keep) || (extraTeam && keep === extraTeam)) postTeam.value = keep;
  const keepList = listTeam.value;
  const filterTeams = postTeams.concat(otherTeams);
  listTeam.innerHTML = '<option value="">전체 팀</option>' + filterTeams.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
  if (filterTeams.includes(keepList)) listTeam.value = keepList;
}
function renderPostTypeOptions() {
  const keep = postType.value;
  postType.innerHTML = '<option value="">(선택 안 함)</option>' + postTypes.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  postType.value = postTypes.includes(keep) ? keep : '';
}
// 선택한 팀에서 이전에 만든 포지션 이름들 (최근에 만든 순)
function positionsOfTeam(team) {
  const seen = new Set();
  const out = [];
  postingsAll.filter(p => p.team === team).forEach(p => { if (!seen.has(p.position)) { seen.add(p.position); out.push(p.position); } });
  return out;
}
// 추천 목록용: 같은 팀에서 만든 포지션을 먼저, 이어서 다른 팀에서 쓴 포지션(디자이너·MD·회계처럼 여러 팀에서 반복되는 이름)을 중복 없이 이어 붙임
function positionSuggestions(team) {
  const own = positionsOfTeam(team);
  const seen = new Set(own);
  const others = [];
  postingsAll.forEach(p => { if (p.team !== team && p.position && !seen.has(p.position)) { seen.add(p.position); others.push(p.position); } });
  return [...own, ...others];
}
function renderPositionList() {
  const team = currentTeam();
  postPosition.disabled = !team;
  postPosition.placeholder = team ? '직접 입력하거나 목록에서 고르세요' : '팀을 먼저 골라주세요';
  const names = team ? positionSuggestions(team) : [];
  postPositionList.innerHTML = names.map(n => `<option value="${escapeHtml(n)}"></option>`).join('');
  updatePositionHint();
}
function matchingPostings() {
  const team = currentTeam();
  const pos = postPosition.value.replace(/\s+/g, ' ').trim();
  if (!team || !pos) return [];
  const brand = currentBrand();
  return postingsAll.filter(p => p.team === team && p.position === pos && (p.brand || '') === brand);   // 브랜드가 다르면 다른 공고
}
function updatePositionHint() {
  const team = currentTeam();
  const known = matchingPostings();
  loadPrevPostingBtn.hidden = !(known.length && !(editingPosting && known.some(p => p.id === editingPosting.id)));
  if (!team) postPositionHint.textContent = '팀을 먼저 골라주세요. 포지션은 처음에는 직접 입력하고, 한 번 만든 포지션은 다음부터 이 칸에서 골라 쓸 수 있어요.';
  else if (known.length) postPositionHint.textContent = `이미 만든 포지션이에요 (공고 ${known.length}개). 이전 공고를 불러와서 고쳐 쓸 수 있어요.`;
  else if (!positionsOfTeam(team).length) postPositionHint.textContent = `${team}에는 아직 만든 포지션이 없어요. 직접 입력해주세요. 저장하면 다음부터 여기서 고를 수 있어요.`;
  else postPositionHint.textContent = `새 포지션이에요. 직접 입력하세요. (이 팀에서 만든 포지션 ${positionsOfTeam(team).length}개는 입력칸을 눌러 고를 수 있어요)`;
}

// --- 평가할 공고 선택 (확정된 공고만, 팀별로 묶어서) ---
// ---------- 공고 링크(사람인·잡코리아)로 공고 올리기 ----------
const linkTeamEl = document.getElementById('linkTeam'), linkUrlEl = document.getElementById('linkUrl'), linkStatusEl = document.getElementById('linkStatus');
const linkPasteBox = document.getElementById('linkPasteBox'), linkListEl = document.getElementById('linkList');
function setLinkStatus(msg, cls) { linkStatusEl.textContent = msg || ''; linkStatusEl.className = 'status' + (cls ? ' ' + cls : ''); }
function renderLinkBox() {
  const keep = linkTeamEl.value;
  linkTeamEl.innerHTML = '<option value="">팀 선택</option>' + postTeams.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  if (postTeams.includes(keep)) linkTeamEl.value = keep;
  const links = postingsAll.filter(p => p.source === 'link');
  linkListEl.innerHTML = links.length ? '<strong class="link-list-title">링크로 올린 공고</strong>' + links.map(p => {
    const ch = (p.channels || [])[0] || {};
    const meta = [p.team, ch.postedAt ? `공고일 ${ch.postedAt}` : '', p.applyEnd ? `접수 마감 ${p.applyEnd}` : '', p.career, p.education].filter(Boolean).join(' · ');
    return `<div class="link-item" data-id="${escapeHtml(p.id)}"><div><strong>${escapeHtml(p.position)}</strong><div class="ap-sub">${escapeHtml(meta)}</div></div><div class="link-item-actions"><button type="button" class="link-btn link-pick" data-id="${escapeHtml(p.id)}">이 공고로 점수 매기기</button>${/^https?:\/\//.test(ch.url || '') ? `<a class="link-btn" href="${escapeHtml(ch.url)}" target="_blank" rel="noopener noreferrer">원문</a>` : ''}</div></div>`;
  }).join('') : '';
}
function linkSelectPosting(id, msg) {
  renderEvalOptions();
  if (id && [...evalPositionSelect.options].some(o => o.value === id)) { evalPositionSelect.value = id; evalPositionSelect.dispatchEvent(new Event('change')); }
  setLinkStatus(msg, 'ok');
}
async function linkSubmit(withText) {
  const team = linkTeamEl.value, url = linkUrlEl.value.trim();
  if (!team) { setLinkStatus('팀을 먼저 골라주세요.', 'err'); return; }
  if (!url) { setLinkStatus('공고 주소를 붙여넣어 주세요.', 'err'); return; }
  const body = { team, url };
  if (withText) { body.text = document.getElementById('linkText').value; body.position = document.getElementById('linkPosition').value; }
  const btn = withText ? document.getElementById('linkPasteBtn') : document.getElementById('linkReadBtn'); btn.disabled = true;
  setLinkStatus(withText ? '붙여넣은 글을 정리하는 중...' : '공고 페이지를 읽는 중... (최대 20초)');
  try {
    const res = await fetch('/api/postings/from-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    if (res.ok && j.success) {
      await loadResumeData();
      const p = j.posting; const n = j.note || {};
      linkSelectPosting(p.id, `"${p.position}" 공고를 올렸어요${n.postedAt ? ` (공고일 ${n.postedAt})` : ''}. 위 "평가할 공고"로 골라 뒀으니, 아래에서 이력서 PDF를 올리면 이 공고 기준으로 점수를 매겨요.${n.usedAll ? ' (공고에서 업무·자격요건 제목을 못 찾아 전체 글을 요건으로 넣었어요. 점수는 전체 글을 보고 매겨요.)' : ''}`);
      linkUrlEl.value = ''; linkPasteBox.hidden = true; document.getElementById('linkText').value = ''; document.getElementById('linkPosition').value = '';
    } else if (res.status === 409 && j.existingId) {
      await loadResumeData(); linkSelectPosting(j.existingId, '이미 올린 공고예요. 그 공고를 "평가할 공고"로 골라 뒀어요.');
    } else {
      linkPasteBox.hidden = !(j.needPaste || j.needPosition);
      setLinkStatus(j.error || '공고를 올리지 못했어요.', 'err');
    }
  } catch { setLinkStatus('서버에 연결하지 못했어요. 잠시 뒤 다시 시도해주세요.', 'err'); }
  finally { btn.disabled = false; }
}
document.getElementById('linkReadBtn').addEventListener('click', () => linkSubmit(false));
document.getElementById('linkPasteBtn').addEventListener('click', () => linkSubmit(true));
linkListEl.addEventListener('click', e => { const b = e.target.closest('.link-pick'); if (b) linkSelectPosting(b.dataset.id, '이 공고를 "평가할 공고"로 골라 뒀어요. 아래에서 이력서 PDF를 올리세요.'); });

function renderEvalOptions() {
  if (typeof renderLinkBox === 'function') renderLinkBox();   // 팀 선택칸과 링크 공고 목록은 보이는 공고가 0개여도 채워져야 해요(공고가 없을 때 조기 종료되기 전에 먼저 그려요)
  const keep = evalPositionSelect.value;
  const confirmed = scorablePostings();
  if (!confirmed.length) {
    evalPositionSelect.innerHTML = (postingCreateOn() ? '<option value="">확정된 공고가 없어요 — 공고를 확정해야 여기에 나와요</option>' : '<option value="">공고가 없어요 — 위 "공고 링크로 공고 올리기"에 사람인·잡코리아 공고 주소를 붙여넣어 주세요</option>');
    renderEvalDraftNote();
    return;
  }
  const teamRank = t => { const i = postTeams.indexOf(t); return i < 0 ? 999 : i; };
  const teams = [...new Set(confirmed.map(p => p.team))].sort((x, y) => teamRank(x) - teamRank(y) || x.localeCompare(y));
  evalPositionSelect.innerHTML = '<option value="">평가할 공고를 선택하세요</option>' + teams.map(t =>
    `<optgroup label="${escapeHtml(t)}">${confirmed.filter(p => p.team === t)
      .map(p => `<option value="${escapeHtml(p.id)}">${fmtDate(p.createdAt)} · ${escapeHtml(p.position)}${p.brand ? ` [${escapeHtml(p.brand)}]` : ''}</option>`).join('')}</optgroup>`).join('');
  if (confirmed.some(p => p.id === keep)) evalPositionSelect.value = keep;
  renderEvalDraftNote();
  if (typeof batchDecorateSelect === 'function') batchDecorateSelect();   // "· 저장된 결과 N명" 표시
}
// 확정하지 않은 공고는 평가 목록에 안 나와요. 어느 공고가 왜 안 보이는지와 확정하러 가는 길을 알려줘요.
function renderEvalDraftNote() {
  const box = document.getElementById('evalDraftNote'); if (!box) return;
  const drafts = postingCreateOn() ? postingsAll.filter(p => p.status !== 'confirmed') : [];   // 공고 만들기가 숨겨져 있으면 작성 중인 공고 안내도 안 보여요
  if (!drafts.length) { box.hidden = true; box.innerHTML = ''; return; }
  const names = drafts.slice(0, 4).map(p => escapeHtml(p.position + (p.brand ? ` [${p.brand}]` : ''))).join(', ') + (drafts.length > 4 ? ` 외 ${drafts.length - 4}개` : '');
  box.hidden = false;
  box.innerHTML = `<strong>확정하지 않은 공고 ${drafts.length}개</strong>는 여기에 안 나와요: ${names}<br><span class="manage-hint" style="margin:0">공고를 <strong>확정</strong>해야 이력서 평가에 쓸 수 있어요.</span> <button type="button" class="link-btn eval-go-posting">공고 만들기로 이동</button>`;
  box.querySelector('.eval-go-posting').addEventListener('click', () => showTab('posting'));
}

// --- 공고 조회 목록 (생성일순 · 팀별) ---
// 표시 상태: 서버가 계산해 준 state(draft 작성 중 · confirmed 확정 · open 게시중 · closed 마감)를 써요
const STATE_LABEL = { draft: '작성 중', confirmed: '확정', open: '게시중', closed: '마감' };
let postingStats = {};   // 공고 id → { total, byStatus } (노션 지원자 수, 비동기로 채움)
let postingStatsTruncated = false;   // 노션 지원자가 300명을 넘어 일부만 센 경우
function statsText(p) {
  const st = postingStats[p.id]; if (!st) return '';
  if (!st.total) return '노션 지원자 0명';
  const parts = Object.entries(st.byStatus).map(([k, v]) => `${k} ${v}`).join(' · ');
  return `노션 지원자 ${st.total}명 (${parts})`;
}
function renderPostingList() {
  let list = postingsAll.filter(p => (!listTeam.value || p.team === listTeam.value) && (!listStatus.value || (listStatus.value === 'confirmed' ? p.status === 'confirmed' : p.state === listStatus.value)));
  const asc = listSort.value === 'oldest';
  list = list.slice().sort((x, y) => (asc ? 1 : -1) * String(x.createdAt).localeCompare(String(y.createdAt)));
  const cnt = k => list.filter(p => p.state === k).length;
  postingCount.textContent = (list.length ? `${list.length}개 (게시중 ${cnt('open')} · 확정 ${cnt('confirmed')} · 마감 ${cnt('closed')} · 작성 중 ${cnt('draft')})` : '조건에 맞는 공고가 없어요.') + (postingStatsTruncated ? ' · 노션 지원자가 많아 최근 300명만 세었어요(지원자 수가 실제보다 적을 수 있어요).' : '');
  postingBody.innerHTML = list.map(p => {
    const state = p.state || (p.status === 'confirmed' ? 'confirmed' : 'draft');
    const chs = (p.channels || []).map(c => c.url ? `<a href="${escapeHtml(c.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.name)}</a>` : escapeHtml(c.name)).join(' · ');
    const sTxt = statsText(p);
    return `
    <tr data-id="${escapeHtml(p.id)}">
      <td data-label="생성일">${fmtDate(p.createdAt)}</td>
      <td data-label="팀">${escapeHtml(p.team)}</td>
      <td data-label="포지션"><strong>${escapeHtml(p.position)}</strong>${p.brand ? ` <span class="notion-tag">${escapeHtml(p.brand)}</span>` : ''}<div class="manage-hint" style="margin:2px 0 0">${escapeHtml(p.jdPreview)}</div></td>
      <td data-label="근무 조건">${escapeHtml(conditionText(p))}</td>
      <td data-label="상태"><span class="notion-tag state-${state}${state === 'confirmed' || state === 'open' ? ' tag-ok' : ''}">${STATE_LABEL[state]}</span>${p.confirmedAt ? `<div class="manage-hint" style="margin:2px 0 0">확정 ${fmtDate(p.confirmedAt)}</div>` : ''}${p.closedAt ? `<div class="manage-hint" style="margin:2px 0 0">마감 처리 ${escapeHtml(p.closedAt)}</div>` : (state === 'closed' && p.applyEnd ? `<div class="manage-hint" style="margin:2px 0 0">접수 마감 ${escapeHtml(p.applyEnd)}</div>` : '')}${chs ? `<div class="manage-hint pp-chs" style="margin:2px 0 0">게시: ${chs}</div>` : ''}${sTxt ? `<div class="manage-hint pp-stats" style="margin:2px 0 0">${escapeHtml(sTxt)}</div>` : ''}</td>
      <td class="posting-row-actions">
        <button type="button" data-act="view" data-id="${escapeHtml(p.id)}">보기</button>
        ${p.status === 'confirmed' ? `<button type="button" data-act="use" data-edit="resume" data-id="${escapeHtml(p.id)}">평가에 사용</button>` : `<button type="button" data-act="confirmnow" data-edit="resume" data-id="${escapeHtml(p.id)}" title="확정해야 이력서 평가의 평가할 공고에 나와요">확정</button>`}
        ${p.status === 'confirmed' ? `<button type="button" data-act="publish" data-edit="resume" data-id="${escapeHtml(p.id)}">게시·마감</button>` : ''}
        <button type="button" data-act="edit" data-edit="resume" data-id="${escapeHtml(p.id)}">수정</button>
        <button type="button" data-act="del" data-edit="resume" data-id="${escapeHtml(p.id)}">삭제</button>
      </td>
    </tr>`;
  }).join('');
}
// 노션 지원자 수는 목록을 그린 뒤 한 번만 불러와요(노션이 없거나 실패해도 목록은 그대로예요)
async function loadPostingStats() {
  try {
    const st = await ensureNotionStatus(); if (!st || !st.configured) return;
    const res = await fetch('/api/postings/stats'); const j = await readJsonOrNull(res);
    if (!j || !res.ok || !j.success) return;
    postingStats = j.stats || {}; postingStatsTruncated = !!j.truncated; renderPostingList();
  } catch { /* 지원자 수를 못 불러와도 공고 목록은 쓸 수 있어요 */ }
}
[listTeam, listStatus, listSort].forEach(el => el.addEventListener('change', renderPostingList));

async function loadPostings() {
  try {
    const res = await fetch('/api/postings');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '불러오기 실패');
    postingsAll = data.postings || [];
    postTeams = data.teams || [];
    otherTeams = data.otherTeams || [];
    teamAliases = data.teamAliases || {};
    postTypes = data.employmentTypes || postTypes;
    renderPostTeamOptions();
    renderPostTypeOptions();
    renderPositionList();
    renderEvalOptions();
    renderPostingList();
    loadPostingStats();   // 노션 지원자 수(비동기)
  } catch (err) {
    postingCount.textContent = '공고를 불러오지 못했어요: ' + (err.message || '');
  }
}
async function loadPostingDefaults() {
  try {
    const res = await fetch('/api/posting-defaults');
    const data = await res.json();
    if (!res.ok) return;
    loadBrands();
    postingDefaults = { workplace: data.workplace || '', employmentType: data.employmentType || '', months: data.months || 3, applyMonths: data.applyMonths || 2, commonNotice: data.commonNotice || '', defaultCommonNotice: data.defaultCommonNotice || '', teamWorkplaces: data.teamWorkplaces || {} };
    document.getElementById('postNotice').value = postingDefaults.commonNotice;
    postTypes = data.employmentTypes || postTypes;
    renderPostTypeOptions();
  } catch { /* 기본값을 못 불러와도 직접 입력할 수 있음 */ }
}
function applyDefaultsToForm() {
  postProfile.value = 'experienced';
  postWorkplace.value = workplaceForTeam(currentTeam());
  postType.value = postTypes.includes(postingDefaults.employmentType) ? postingDefaults.employmentType : '';
  postMonths.value = postingDefaults.months;
  const start = toDateStr(new Date());
  postApplyStart.value = start;
  postApplyEnd.value = addMonthsStr(start, postingDefaults.applyMonths || 2);
  applyEndTouched = false;
  portfolioTouched = false;
  syncPortfolioDefault();
  updateWorkplaceHint();
}
let resumeDataReady = false;
async function loadResumeData() {
  await Promise.all([loadCriteria(), loadPostings(), loadPostingDefaults(), loadJdTemplates()]);
  if (!brandEditing) { renderBrands(); updateTeamBrandHint(); }   // 팀 목록이 채워진 뒤에 브랜드 표를 확실히 다시 그림
  if (!resumeDataReady) { resumeDataReady = true; if (!postDirty && !editingPosting) applyDefaultsToForm(); }
}

// --- 편집기 ---
function updatePostTodo() {
  const m = countMarks(postJd.value);
  postTodo.textContent = !postJd.value.trim() ? '' : (m.input || m.rec) ? `아직 표시가 남아 있어요: ${marksText(m)}. 맞는지 확인하고 고친 뒤 표시를 지우고 확정·복사하세요.` : '확정하거나 복사할 준비가 됐어요.';
}
function updatePostingButtons() {
  const confirmed = !!(editingPosting && editingPosting.status === 'confirmed');
  confirmPostingBtn.textContent = confirmed ? '✅ 수정 내용으로 다시 확정' : '✅ 공고 확정';
  saveDraftBtn.textContent = confirmed ? '작성 중으로 되돌려 저장' : '임시 저장';
  if (editingPosting) {
    postEditing.hidden = false;
    postEditing.textContent = `편집 중: ${fmtDate(editingPosting.createdAt)} 생성 · ${editingPosting.team} · ${editingPosting.position} · ${confirmed ? '확정됨 (고치면 다시 확정해야 평가에 반영돼요)' : '작성 중'}`;
  } else {
    postEditing.hidden = true;
  }
}
[postTeam, postPosition, postProfile, postWorkplace, postType, postMonths, postApplyStart, postApplyEnd, postPortfolio, postNotes, postJd].forEach(el => {
  el.addEventListener('input', () => { postDirty = true; });
  el.addEventListener('change', () => { postDirty = true; });
});
postJd.addEventListener('input', updatePostTodo);
postJd.addEventListener('input', () => { variantEdited = true; });
postPortfolio.addEventListener('change', () => { portfolioTouched = true; });
postApplyEnd.addEventListener('change', () => { applyEndTouched = true; });
postApplyStart.addEventListener('change', () => {
  if (!applyEndTouched && postApplyStart.value) postApplyEnd.value = addMonthsStr(postApplyStart.value, postingDefaults.applyMonths || 2);
});
function onTeamChanged() {
  updateTeamBrandHint('');   // 팀을 바꾸면 브랜드는 "없음(공통)"으로 되돌려요(이전 팀의 브랜드가 따라가지 않게)
  renderPositionList();
  if (!editingPosting) postWorkplace.value = workplaceForTeam(currentTeam()); // 팀마다 다른 기본 근무지
  updateWorkplaceHint();
  syncPortfolioDefault();
  loadTeamRef();
}
postTeam.addEventListener('change', onTeamChanged);
postPosition.addEventListener('input', syncPortfolioDefault);
postPosition.addEventListener('input', updatePositionHint);
postPosition.addEventListener('change', updatePositionHint);

function fillEditor(p) {
  setTimeout(runPostCheck, 0);   // 불러온 공고도 바로 점검
  setTeamValue(p.team);
  updateTeamBrandHint(p.brand || '');   // 저장된 공고의 브랜드를 그대로 보여줌(팀 목록에서 빠졌어도 이 공고에는 남아 있어요)
  renderPositionList();
  postPosition.value = p.position;
  postWorkplace.value = p.workplace || '';
  postType.value = postTypes.includes(p.employmentType) ? p.employmentType : '';
  postMonths.value = p.months || '';
  postProfile.value = ['junior', 'fashion'].includes(p.profile) ? p.profile : 'experienced';
  postApplyStart.value = p.applyStart || '';
  postApplyEnd.value = p.applyEnd || '';
  postCareer.value = p.career || ''; postEducation.value = p.education || ''; setCareerState(p.career ? 'set' : 'empty');   // 저장된 경력·학력
  applyEndTouched = true;
  postJd.value = p.jd || '';
  variantBox.hidden = true; variantsState = []; variantEdited = false;
  portfolioTouched = false; syncPortfolioDefault(); updateWorkplaceHint(); loadTeamRef();
  postDirty = false;
  updatePositionHint();
  updatePostTodo();
  updatePostingButtons();
}
function confirmDiscard() {
  return !postDirty || confirm('저장하지 않은 공고 내용이 있어요. 버리고 계속할까요?');
}
function resetEditor() {
  editingPosting = null;
  setTeamValue('');
  updateTeamBrandHint('');
  renderPositionList();
  postPosition.value = '';
  postJd.value = '';
  postNotes.value = '';
  postCheckSeq++; clearTimeout(postCheckTimer); runPostCheck();   // 새 공고에 이전 공고의 점검 결과가 남지 않게(빈 글이면 처음 안내로 돌아가요)
  jdTplSelect.value = ''; setJdTplStatus(''); jdTplRec.hidden = true; jdTplRec.innerHTML = '';
  copyDetailStatus.textContent = ''; copyDetailShown.hidden = true;   // 이전 공고의 복사 안내가 남지 않게
  postCareer.value = ''; postEducation.value = ''; setCareerState('empty');   // 이전 공고의 경력·학력이 남지 않게
  saraminList.innerHTML = ''; saraminStatus.textContent = '';   // 이전 공고의 사람인 입력용 정리가 남지 않게
  variantBox.hidden = true; variantsState = []; variantEdited = false;
  applyDefaultsToForm();
  loadTeamRef();
  postDirty = false;
  updatePositionHint();
  updatePostTodo();
  updatePostingButtons();
  setPostStatus('');
}
newPostingBtn.addEventListener('click', () => { if (confirmDiscard()) resetEditor(); });

async function fetchPosting(id) {
  const res = await fetch('/api/postings/' + encodeURIComponent(id));
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '불러오기 실패');
  return data;
}
// 같은 팀·포지션의 이전 공고를 새 공고의 바탕으로 불러오기 (기존 공고는 그대로 둠)
loadPrevPostingBtn.addEventListener('click', async () => {
  if (!confirmDiscard()) return;
  const latest = matchingPostings()[0]; // postingsAll은 최신순
  if (!latest) return;
  try {
    const p = await fetchPosting(latest.id);
    editingPosting = null;
    fillEditor({ ...p });
    postDirty = true;
    setPostStatus(`${fmtDate(p.createdAt)}에 만든 공고를 바탕으로 불러왔어요. 고친 뒤 저장하면 새 공고로 만들어져요.`, 'ok');
  } catch (err) { setPostStatus(err.message, 'err'); }
});

// 기본 근무 조건 저장 (기본 근무 기간은 2개월)
saveDefaultsBtn.addEventListener('click', async () => {
  try {
    const res = await fetch('/api/posting-defaults', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workplace: postWorkplace.value, employmentType: postType.value, months: postMonths.value === '' ? null : Number(postMonths.value) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');
    postingDefaults = { ...postingDefaults, workplace: data.workplace, employmentType: data.employmentType, months: data.months };
    setPostStatus('기본 근무 조건으로 저장했어요. 새 공고를 만들 때 처음 채워져요.', 'ok');
  } catch (err) { setPostStatus(err.message || '저장 중 오류가 발생했어요.', 'err'); }
});

const postNotice = document.getElementById('postNotice');
const noticeStatus = document.getElementById('noticeStatus');
let noticeEditing = false;
function setNoticeEditing(on) {
  noticeEditing = on;
  postNotice.readOnly = !on;
  document.getElementById('editNoticeBtn').hidden = on;
  document.getElementById('saveNoticeBtn').hidden = !on;
  document.getElementById('cancelNoticeBtn').hidden = !on;
  document.getElementById('resetNoticeBtn').hidden = !on;
}
async function putNotice(text, okMsg) {
  try {
    const res = await fetch('/api/posting-defaults', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commonNotice: text }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');
    postingDefaults.commonNotice = data.commonNotice;
    postNotice.value = data.commonNotice;
    setNoticeEditing(false);
    noticeStatus.textContent = okMsg; noticeStatus.className = 'status ok';
  } catch (err) {
    noticeStatus.textContent = err.message || '저장 중 오류가 발생했어요.'; noticeStatus.className = 'status err';
  }
}
document.getElementById('editNoticeBtn').addEventListener('click', () => { setNoticeEditing(true); noticeStatus.textContent = ''; postNotice.focus(); });
document.getElementById('cancelNoticeBtn').addEventListener('click', () => {
  if (postNotice.value !== postingDefaults.commonNotice && !confirm('고친 내용을 저장하지 않고 닫을까요?')) return;
  postNotice.value = postingDefaults.commonNotice; setNoticeEditing(false); noticeStatus.textContent = '';
});
document.getElementById('saveNoticeBtn').addEventListener('click', () => putNotice(postNotice.value, '공고 안내를 저장했어요. 다음에 만드는 AI 초안부터 맨 끝에 붙어요.'));
document.getElementById('resetNoticeBtn').addEventListener('click', () => {
  if (!confirm('공고 안내를 처음 문구(오픈한 채용 공고 기준 + 채용서류 반환·보관 안내)로 되돌릴까요?\n직접 고친 내용은 사라져요.')) return;
  putNotice(postingDefaults.defaultCommonNotice, '처음 문구로 되돌렸어요.');
});

// ---------- 팀이 맡은 브랜드 (평소엔 잠금, 수정 → 저장) ----------
const brandBody = document.getElementById('brandBody');
const brandStatus = document.getElementById('brandStatus');
let teamBrands = {};
let brandEditing = false;
function setBrandStatus(msg, cls) { brandStatus.textContent = msg || ''; brandStatus.className = 'status' + (cls ? ' ' + cls : ''); }
function renderBrands() {
  brandBody.innerHTML = postTeams.map(t => `<tr><td data-label="팀"><strong>${escapeHtml(t)}</strong></td><td data-label="맡은 브랜드"><input type="text" class="brand-input" data-team="${escapeHtml(t)}" maxlength="100" value="${escapeHtml(teamBrands[t] || '')}" placeholder="${brandEditing ? '예: 인디비주엘, 우일신' : '(아직 입력 안 함)'}" ${brandEditing ? '' : 'readonly'} aria-label="${escapeHtml(t)}이 맡은 브랜드" /></td></tr>`).join('');
  document.getElementById('editBrandBtn').hidden = brandEditing;
  document.getElementById('saveBrandBtn').hidden = !brandEditing;
  document.getElementById('cancelBrandBtn').hidden = !brandEditing;
}
// ---------- 브랜드 선택 (팀 옆: 없음(공통) / 있음) ----------
// 없음(공통)이면 특정 브랜드가 없는 공고로 봐요. 있음이면 그 팀이 맡은 브랜드 중에서 고르고, 고른 브랜드만 AI 초안에 전달돼요.
const postBrandMode = document.getElementById('postBrandMode');
const postBrand = document.getElementById('postBrand');
const postBrandHint = document.getElementById('postBrandHint');
// 서버의 brandListOf와 같은 규칙으로 팀의 브랜드 글을 목록으로 나눔
function brandListOf(text) { return [...new Set(String(text || '').split(/[,，、/·\n]+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean))]; }
function currentBrand() { return postBrandMode.value === 'has' ? postBrand.value : ''; }
// 팀을 바꾸거나 저장·불러오기 뒤에 호출: 선택지와 안내를 팀의 브랜드 목록에 맞춤. keep를 주면 그 브랜드를 선택해 둠(예: 저장된 공고를 열 때)
function updateTeamBrandHint(keep) {
  setTimeout(() => { if (typeof renderBrandQuick === 'function') renderBrandQuick(); }, 0);   // 팀·브랜드가 바뀔 때 아래 빠른 추가·삭제 칸도 같이 맞춰요
  const team = currentTeam();
  const list = team ? brandListOf(teamBrands[team]) : [];
  const want = keep !== undefined ? keep : currentBrand();
  const savedOnly = want && !list.includes(want);        // 팀 목록에서 빠졌지만 이 공고에는 저장돼 있는 브랜드
  const options = savedOnly ? [...list, want] : list;
  postBrand.innerHTML = options.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}${savedOnly && b === want ? ' (현재 목록에 없음)' : ''}</option>`).join('');
  const hasOption = postBrandMode.querySelector('option[value="has"]');
  hasOption.disabled = !options.length;
  if (want && options.includes(want)) { postBrandMode.value = 'has'; postBrand.value = want; }
  else postBrandMode.value = 'none';
  postBrand.hidden = postBrandMode.value !== 'has';
  if (!team) { postBrandHint.hidden = true; postBrandHint.textContent = ''; if (typeof updatePositionHint === 'function') updatePositionHint(); return; }
  postBrandHint.hidden = false;
  postBrandHint.textContent = !options.length
    ? `${team}에는 등록된 브랜드가 없어요. 공통 공고로 만들어져요. (브랜드는 아래 "팀과 맡은 브랜드"에서 적어두면 여기서 고를 수 있어요)`
    : postBrandMode.value === 'has' ? `${postBrand.value} 브랜드 공고예요. AI 초안이 맨 위 소개 문장에 "${team} ${postBrand.value} 소속으로 …"처럼 팀 이름 다음에 브랜드 이름을 써요. JD 템플릿으로 채워도 소개 문장에 들어가요.` : '특정 브랜드가 없는 공통 공고예요. 브랜드가 있으면 "있음"을 고르세요.';
  updatePositionHint();   // 브랜드가 바뀌면 "이미 만든 포지션이에요" 안내(같은 팀·포지션·브랜드 기준)도 다시 계산
}
postBrandMode.addEventListener('change', () => { postDirty = true; updateTeamBrandHint(postBrandMode.value === 'has' ? (postBrand.value || undefined) : ''); });
postBrand.addEventListener('change', () => { postDirty = true; updateTeamBrandHint(postBrand.value); });   // (이 코드는 postDirty 선언 뒤라서 입력칸 목록(위쪽)에 넣지 않고 여기서 직접 켜요)
// ---------- 공고 만들기에서 바로 브랜드 추가·삭제 ----------
// 저장은 "팀과 맡은 브랜드"와 같은 PUT /api/team-brands(그 팀 하나만 보내면 서버가 합쳐요)를 써서 아래 패널과 항상 같은 데이터예요.
const brandQuick = document.getElementById('brandQuick'), brandQuickChips = document.getElementById('brandQuickChips'), brandQuickInput = document.getElementById('brandQuickInput'), brandQuickStatus = document.getElementById('brandQuickStatus');
function setQuickStatus(msg, cls) { brandQuickStatus.textContent = msg || ''; brandQuickStatus.className = 'status' + (cls ? ' ' + cls : ''); }
function renderBrandQuick() {
  const team = currentTeam();
  brandQuick.hidden = !team;
  if (!team) { brandQuickChips.innerHTML = ''; return; }
  const list = brandListOf(teamBrands[team]);
  brandQuickChips.innerHTML = list.length
    ? list.map(b => `<span class="brand-chip">${escapeHtml(b)}<button type="button" class="brand-chip-x" data-brand="${escapeHtml(b)}" aria-label="${escapeHtml(b)} 삭제">✕</button></span>`).join('')
    : '<span class="manage-hint" style="margin:0">아직 없어요. 아래에 이름을 쓰고 추가하세요.</span>';
}
async function saveTeamBrandList(team, list) {
  const res = await fetch('/api/team-brands', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brands: { [team]: list.join(', ') } }) });
  const data = await res.json().catch(() => null);
  if (!data) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
  if (!res.ok || !data.brands) throw new Error(data.error || '저장하지 못했어요.');
  teamBrands = data.brands; renderBrands();
}
document.getElementById('brandQuickAddBtn').addEventListener('click', async () => {
  const team = currentTeam(); if (!team) return;
  if (brandEditing) { setQuickStatus('아래 "팀과 맡은 브랜드" 패널에서 수정 중이에요. 저장하거나 취소한 뒤 사용해주세요.', 'err'); return; }
  const name = brandQuickInput.value.replace(/\s+/g, ' ').trim();
  const list = brandListOf(teamBrands[team]);
  if (!name) { setQuickStatus('추가할 브랜드 이름을 입력해주세요.', 'err'); brandQuickInput.focus(); return; }
  if (/[,，、/·]/.test(name)) { setQuickStatus('쉼표(,)나 슬래시(/)는 쓸 수 없어요. 브랜드는 한 번에 하나씩 추가해주세요.', 'err'); return; }
  if (list.some(b => b.toLowerCase() === name.toLowerCase())) { setQuickStatus(`"${name}"은(는) 이미 ${team}의 브랜드예요.`, 'err'); return; }
  const next = [...list, name];
  if (next.join(', ').length > 100) { setQuickStatus('한 팀의 브랜드는 이름을 합쳐서 100자 이내예요. 안 쓰는 브랜드를 지우고 다시 추가해주세요.', 'err'); return; }
  const btn = document.getElementById('brandQuickAddBtn'); btn.disabled = true; setQuickStatus('');
  try {
    await saveTeamBrandList(team, next);
    brandQuickInput.value = '';
    updateTeamBrandHint(name);   // 방금 추가한 브랜드를 바로 골라 줘요(있음 + 그 브랜드)
    postDirty = true;
    setQuickStatus(`"${name}"을(를) ${team} 브랜드에 추가하고 이 공고의 브랜드로 골랐어요.`, 'ok');
  } catch (err) { setQuickStatus(err.message || '추가하지 못했어요.', 'err'); }
  finally { btn.disabled = false; }
});
brandQuickInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); document.getElementById('brandQuickAddBtn').click(); } });
brandQuickChips.addEventListener('click', async e => {
  const x = e.target.closest('.brand-chip-x'); if (!x) return;
  const team = currentTeam(); const name = x.dataset.brand; if (!team || !name) return;
  if (brandEditing) { setQuickStatus('아래 "팀과 맡은 브랜드" 패널에서 수정 중이에요. 저장하거나 취소한 뒤 사용해주세요.', 'err'); return; }
  if (!confirm(`"${name}"을(를) ${team}의 브랜드 목록에서 지울까요?\n이미 만든 공고에 적힌 브랜드는 그대로예요.`)) return;
  try {
    const wasSelected = currentBrand() === name;
    await saveTeamBrandList(team, brandListOf(teamBrands[team]).filter(b => b !== name));
    // 지금 고른 브랜드를 지웠는데, 이미 저장된 공고가 그 브랜드를 쓰는 중이면 그 공고는 그대로 유지하고(현재 목록에 없음 표시), 새 공고면 "없음"으로 돌려요
    const keepForSaved = wasSelected && editingPosting && editingPosting.brand === name;
    updateTeamBrandHint(wasSelected && !keepForSaved ? '' : undefined);
    setQuickStatus(`"${name}"을(를) 지웠어요.${keepForSaved ? ' 이 공고에는 그대로 남아 있어요.' : ''}`, 'ok');
  } catch (err) { setQuickStatus(err.message || '지우지 못했어요.', 'err'); }
});

async function loadBrands() {
  try {
    const res = await fetch('/api/team-brands');
    const data = await res.json();
    if (!res.ok || !data.brands) throw new Error(data.error || '불러오기 실패');
    teamBrands = data.brands;
    renderBrands(); updateTeamBrandHint();
  } catch (err) { setBrandStatus('팀별 브랜드를 불러오지 못했어요: ' + (err.message || ''), 'err'); }
}
document.getElementById('editBrandBtn').addEventListener('click', () => { brandEditing = true; setBrandStatus(''); renderBrands(); const f = brandBody.querySelector('input'); if (f) f.focus(); });
document.getElementById('cancelBrandBtn').addEventListener('click', () => {
  const dirty = [...brandBody.querySelectorAll('.brand-input')].some(i => i.value.trim() !== (teamBrands[i.dataset.team] || '').trim());
  if (dirty && !confirm('고친 내용을 저장하지 않고 닫을까요?')) return;
  brandEditing = false; renderBrands(); setBrandStatus('');
});
document.getElementById('saveBrandBtn').addEventListener('click', async () => {
  const brands = {};
  brandBody.querySelectorAll('.brand-input').forEach(i => { brands[i.dataset.team] = i.value.trim(); });
  try {
    const res = await fetch('/api/team-brands', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brands }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');
    teamBrands = data.brands; brandEditing = false; renderBrands(); updateTeamBrandHint();
    setBrandStatus('팀별 브랜드를 저장했어요. 다음에 만드는 AI 공고 초안부터 참고해요.', 'ok');
  } catch (err) { setBrandStatus(err.message || '저장 중 오류가 발생했어요.', 'err'); }
});

document.getElementById('saveTeamWorkplaceBtn').addEventListener('click', async () => {
  const team = currentTeam();
  if (!team) { setPostStatus('팀을 먼저 선택해주세요.', 'err'); return; }
  try {
    const res = await fetch('/api/posting-defaults', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamWorkplaces: { [team]: postWorkplace.value } }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');
    postingDefaults.teamWorkplaces = data.teamWorkplaces || {};
    updateWorkplaceHint();
    setPostStatus(`${team}의 기본 근무지로 저장했어요. 다음부터 이 팀을 고르면 자동으로 채워져요.`, 'ok');
  } catch (err) { setPostStatus(err.message || '저장 중 오류가 발생했어요.', 'err'); }
});

// 팀 직무 참고(직무정의서에서 옮긴 공개 가능한 내용): 팀별로 보고 고침
async function loadTeamRef() {
  const team = currentTeam();
  teamRefStatus.textContent = '';
  if (!team) { teamRefText.value = ''; teamRefText.disabled = true; return; }
  try {
    const res = await fetch('/api/team-refs?team=' + encodeURIComponent(team));
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '불러오기 실패');
    teamRefText.value = data.text || '';
    teamRefText.disabled = false;
    teamRefStatus.textContent = data.isDefault ? (data.hasDefault ? '직무정의서에서 옮긴 처음 내용이에요. 고치면 저장돼요.' : `이 팀(${team})은 아직 정리된 내용이 없어요. 직접 적어두면 AI가 참고해요.`) : '직접 저장한 내용이에요.';
    teamRefStatus.className = 'status';
  } catch (err) { teamRefStatus.textContent = err.message || ''; teamRefStatus.className = 'status err'; }
}
document.getElementById('saveTeamRefBtn').addEventListener('click', async () => {
  const team = currentTeam();
  if (!team) { teamRefStatus.textContent = '팀을 먼저 선택해주세요.'; teamRefStatus.className = 'status err'; return; }
  try {
    const res = await fetch('/api/team-refs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team, text: teamRefText.value }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');
    teamRefStatus.textContent = `${team}의 팀 직무 참고를 저장했어요. 다음 AI 초안과 이력서 평가부터 반영돼요.`; teamRefStatus.className = 'status ok';
  } catch (err) { teamRefStatus.textContent = err.message || '저장 중 오류가 발생했어요.'; teamRefStatus.className = 'status err'; }
});
document.getElementById('resetTeamRefBtn').addEventListener('click', async () => {
  const team = currentTeam();
  if (!team) return;
  if (!confirm(`${team}의 팀 직무 참고를 처음 내용으로 되돌릴까요?\n직접 고친 내용은 사라져요.`)) return;
  try {
    const res = await fetch('/api/team-refs', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ team, reset: true }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '실패');
    await loadTeamRef();
    teamRefStatus.textContent = '처음 내용으로 되돌렸어요.'; teamRefStatus.className = 'status ok';
  } catch (err) { teamRefStatus.textContent = err.message || ''; teamRefStatus.className = 'status err'; }
});

// 경력 칸의 상태: empty(비어 있음) / suggested(AI·템플릿이 추천한 값, 아직 확인 안 함) / set(사람이 쓰거나 확인함)
const postCareer = document.getElementById('postCareer'), postEducation = document.getElementById('postEducation');
const exIntro = document.getElementById('exIntro'), exGrowth = document.getElementById('exGrowth'), exClosing = document.getElementById('exClosing'), aiFocusEl = document.getElementById('aiFocus');
const saraminList = document.getElementById('saraminList'), saraminStatus = document.getElementById('saraminStatus');
const postCareerHint = document.getElementById('postCareerHint');
let careerState = 'empty';
function setCareerState(st) { careerState = st; postCareerHint.hidden = st !== 'suggested'; }
// 추천값은 칸이 비어 있거나 아직 추천값일 때만 채워요(사람이 직접 쓴 경력을 AI 추천이 덮어쓰지 않게)
function applyCareerSuggestion(sug) {
  const v = String(sug || '').trim();
  if (!v) return;
  if (postCareer.value.trim() && careerState === 'set') return;
  postCareer.value = v; setCareerState('suggested'); postDirty = true;
}
postCareer.addEventListener('input', () => { setCareerState(postCareer.value.trim() ? 'set' : 'empty'); postDirty = true; });
postEducation.addEventListener('input', () => { postDirty = true; });
document.getElementById('postCareerOkBtn').addEventListener('click', () => setCareerState(postCareer.value.trim() ? 'set' : 'empty'));
function collectPosting() {
  return {
    team: currentTeam(),
    brand: currentBrand(),
    position: postPosition.value,
    workplace: postWorkplace.value,
    employmentType: postType.value,
    months: postMonths.value === '' ? null : Number(postMonths.value),
    profile: postProfile.value,
    career: postCareer.value,
    education: postEducation.value,
    applyStart: postApplyStart.value,
    applyEnd: postApplyEnd.value,
    jd: postJd.value,
  };
}
function requireTeamAndPosition() {
  if (!currentTeam()) { setPostStatus('팀을 먼저 선택해주세요.', 'err'); postTeam.focus(); return false; }
  if (!postPosition.value.trim()) { setPostStatus('포지션을 입력하거나 골라주세요.', 'err'); postPosition.focus(); return false; }
  return true;
}
// 이전 공고를 바탕으로 고쳐 쓸 때, 맨 위 "모집 개요"는 서버가 새 조건으로 다시 붙이므로 떼어서 보냄
function stripOverview(jd) { return String(jd).replace(/^■ 모집 개요\n(?:- .*\n?)*\n*/, '').trim(); }

draftJdBtn.addEventListener('click', async () => {
  if (!requireTeamAndPosition()) return;
  let baseJd = '';
  if (postJd.value.trim()) {
    if (!confirm('지금 써 둔 공고문이 있어요.\n이 내용을 바탕으로 AI가 새 조건에 맞게 고쳐 쓸까요?\n\n[취소]를 누르면 아무것도 바뀌지 않아요.')) return;
    baseJd = stripOverview(postJd.value);
  }
  draftJdBtn.disabled = true;
  const label = draftJdBtn.textContent;
  draftJdBtn.textContent = '작성 중... (최대 1분)';
  setPostStatus('');
  try {
    const c = collectPosting();
    const res = await fetch('/api/postings/draft', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team: c.team, brand: c.brand, position: c.position, workplace: c.workplace, employmentType: c.employmentType, months: c.months, applyStart: c.applyStart, applyEnd: c.applyEnd, profile: c.profile, portfolio: postPortfolio.checked, variants: 3, notes: postNotes.value, baseJd, extras: { intro: exIntro.checked, growth: exGrowth.checked, closing: exClosing.checked }, aiFocus: aiFocusEl.checked }),
    });
    const data = await res.json().catch(() => null);
    if (!data) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
    if (!res.ok) throw new Error(data.error || '초안 작성 실패');
    variantsState = data.variants || [{ key: 'A', label: '초안', jd: data.jd, careerSuggestion: data.careerSuggestion || '' }];
    renderVariants(0);
    postJd.value = data.jd;
    applyCareerSuggestion(variantsState[0].careerSuggestion);   // 경력은 본문이 아니라 경력 칸에 추천값으로 들어가요
    variantEdited = false;
    postDirty = true;
    updatePostTodo();
    setPostStatus(`초안을 만들었어요${variantsState.length > 1 ? ` (${variantsState.length}가지 — 위에서 방향을 골라보세요)` : ''}. 꼭 읽어보세요. ${careerState === 'suggested' ? `경력은 AI가 추천한 값(${postCareer.value})이에요 — 위 "경력" 칸에서 확인하고 고쳐주세요. ` : ''}[입력] 표시가 남아 있으면 채워서 확정하세요.${data.failed ? ` (${data.failed}가지는 만들지 못했어요)` : ''}`, 'ok');
    postJd.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    setPostStatus(err.message || '초안을 만드는 중 오류가 발생했어요. 직접 작성하셔도 돼요.', 'err');
  } finally {
    draftJdBtn.disabled = false;
    draftJdBtn.textContent = label;
  }
});

function renderVariants(activeIdx) {
  variantBox.hidden = variantsState.length < 2;
  variantBtns.innerHTML = variantsState.map((v, i) =>
    `<button type="button" class="variant-btn${i === activeIdx ? ' active' : ''}" data-i="${i}">${escapeHtml(v.key)}안 · ${escapeHtml(v.label)}</button>`).join('');
}
variantBtns.addEventListener('click', e => {
  const btn = e.target.closest('.variant-btn');
  if (!btn) return;
  const i = Number(btn.dataset.i);
  if (variantEdited && !confirm('고른 초안을 고치셨어요.\n다른 초안으로 바꾸면 고친 내용이 사라져요. 바꿀까요?')) return;
  postJd.value = variantsState[i].jd;
  if (careerState === 'suggested') { postCareer.value = ''; setCareerState('empty'); }   // 아직 확인 안 한 추천값이면 고른 안의 추천값으로 바꿔요
  applyCareerSuggestion(variantsState[i].careerSuggestion);
  variantEdited = false;
  postDirty = true;
  updatePostTodo();
  renderVariants(i);
});

// ---------- JD 템플릿 (AI 없이 본문 채우기) ----------
const jdTplSelect = document.getElementById('jdTplSelect');
const jdTplRec = document.getElementById('jdTplRec');
const jdTplStatus = document.getElementById('jdTplStatus');
let jdTemplates = [];
let jdRecSeq = 0, jdRecTimer = null;
function setJdTplStatus(msg, cls) { jdTplStatus.textContent = msg || ''; jdTplStatus.className = 'status' + (cls ? ' ' + cls : ''); }
function renderJdTplSelect(keep) {
  const cur = keep !== undefined ? keep : jdTplSelect.value;
  jdTplSelect.innerHTML = '<option value="">템플릿을 골라주세요</option>' + jdTemplates.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.title)}${t.isDefault ? '' : ' (직접 추가)'}${t.edited ? ' (수정됨)' : ''}</option>`).join('');
  if (jdTemplates.some(t => t.id === cur)) jdTplSelect.value = cur;
}
async function loadJdTemplates() {
  try {
    const res = await fetch('/api/jd-templates'); const data = await res.json();
    if (!res.ok || !data.templates) throw new Error(data.error || '불러오기 실패');
    jdTemplates = data.templates; renderJdTplSelect(); renderJdTplMgr(); refreshJdRecommend();
  } catch (err) { setJdTplStatus('템플릿을 불러오지 못했어요: ' + (err.message || ''), 'err'); }
}
// 팀·포지션을 바꾸고 잠깐 멈추면 어울리는 템플릿을 추천 (포지션 이름에 맞는 단어가 있을 때만)
async function refreshJdRecommend() {
  const seq = ++jdRecSeq; const team = currentTeam(); const position = postPosition.value.trim();
  if (!team) { jdTplRec.hidden = true; jdTplRec.innerHTML = ''; return; }   // 팀만 골라도 그 팀의 템플릿을 보여줘요(포지션은 비어 있어도 돼요)
  try {
    const res = await fetch(`/api/jd-templates/recommend?team=${encodeURIComponent(team)}&position=${encodeURIComponent(position)}`); const data = await res.json();
    if (seq !== jdRecSeq || !res.ok) return;
    const list = data.recommended || [];
    if (!list.length) { jdTplRec.hidden = true; jdTplRec.innerHTML = ''; return; }
    jdTplRec.hidden = false;
    // 포지션 단어가 맞은 템플릿이 있으면 "추천"(맞은 것 중 첫 번째만 강조), 없으면 "이 팀의 템플릿"으로만 보여주고 어느 것도 강조하지 않아요
    const matched = list.some(r => r.hit && r.hit.length);
    jdTplRec.innerHTML = `<span class="rec-label">${matched ? '추천:' : `${escapeHtml(team)} 템플릿:`}</span>` + list.map((r, i) => `<button type="button" class="${matched && i === 0 ? 'add-btn' : 'link-btn'} rec-btn" data-id="${escapeHtml(r.id)}">${escapeHtml(r.title)}${euro(r.title)} 채우기</button>`).join('');
  } catch { /* 추천을 못 받아도 아래에서 직접 고를 수 있어요 */ }
}
function scheduleJdRecommend() { clearTimeout(jdRecTimer); jdRecTimer = setTimeout(refreshJdRecommend, 400); }
// 받침 유무에 맞는 "으로/로"(ㄹ 받침은 "로"): "재무/회계" + 로, "총무" + 로, "인사팀장" + 으로 ... 한글이 아니면 "(으)로"
function euro(word) {
  const ch = String(word || '').trim().slice(-1); const c = ch.charCodeAt(0);
  if (!(c >= 0xAC00 && c <= 0xD7A3)) return '(으)로';
  const jong = (c - 0xAC00) % 28; return jong === 0 || jong === 8 ? '로' : '으로';
}
async function fillFromTemplate(id) {
  if (!currentTeam()) { requireTeamAndPosition(); return; }
  if (!id) { setJdTplStatus('채울 템플릿을 먼저 골라주세요.', 'err'); return; }
  // 팀만 고르고 포지션을 안 썼으면(팀의 템플릿을 바로 누른 경우) 템플릿 이름으로 포지션을 채워요. 사람이 쓴 포지션은 바꾸지 않아요.
  // 덮어쓰기 확인에서 취소하면 아무것도 바뀌지 않아야 해서, 포지션 칸은 확인을 통과한 뒤에 채워요.
  let filledPosition = '';
  let nameForEmpty = '';
  if (!postPosition.value.trim()) {
    const t = jdTemplates.find(x => x.id === id);
    nameForEmpty = t ? String(t.title).replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100) : '';   // "마케팅 (브랜드 / 퍼포먼스)" → "마케팅"
  }
  if (postJd.value.trim() && !confirm('지금 써 둔 공고문이 있어요.\n템플릿 내용으로 바꿀까요? 쓰던 내용은 사라져요.\n\n[취소]를 누르면 아무것도 바뀌지 않아요.')) return;
  if (nameForEmpty && !postPosition.value.trim()) { postPosition.value = nameForEmpty; filledPosition = nameForEmpty; postDirty = true; postPosition.dispatchEvent(new Event('input')); }
  if (!requireTeamAndPosition()) return;

  const c = collectPosting();
  try {
    const res = await fetch('/api/postings/from-template', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ templateId: id, team: c.team, brand: c.brand, position: c.position, workplace: c.workplace, employmentType: c.employmentType, months: c.months, applyStart: c.applyStart, applyEnd: c.applyEnd, portfolio: postPortfolio.checked, aiFocus: aiFocusEl.checked }) });
    const data = await res.json().catch(() => null);
    if (!data) throw new Error('서버가 응답하지 못했어요.');
    if (!res.ok) throw new Error(data.error || '채우기 실패');
    postJd.value = data.jd; postDirty = true; variantEdited = false; variantBox.hidden = true; variantsState = [];
    applyCareerSuggestion(data.careerSuggestion);
    updatePostTodo(); runPostCheck();
    setJdTplStatus(`"${data.title}" 템플릿으로 채웠어요. ${filledPosition ? `포지션 칸이 비어 있어서 "${filledPosition}"${euro(filledPosition)} 채웠어요 — 필요하면 고쳐주세요. ` : ''}${careerState === 'suggested' ? `경력은 템플릿의 추천값(${postCareer.value})이에요 — 위 "경력" 칸에서 확인하고 고쳐주세요. ` : ''}${data.aiFocusApplied ? 'AI 활용 항목을 요건·우대에 넣고 지원 방법에 AI 작업 사례 줄을 붙였어요. ' : ''}${data.placeholders ? `[입력] ${data.placeholders}곳은 직접 채워주세요.` : ''}`, 'ok');
  } catch (err) { setJdTplStatus(err.message || '채우는 중 오류가 발생했어요.', 'err'); }
}
document.getElementById('jdTplFillBtn').addEventListener('click', () => fillFromTemplate(jdTplSelect.value));
jdTplRec.addEventListener('click', e => { const b = e.target.closest('.rec-btn'); if (b) { jdTplSelect.value = b.dataset.id; fillFromTemplate(b.dataset.id); } });
postPosition.addEventListener('input', scheduleJdRecommend);
postTeam.addEventListener('change', scheduleJdRecommend);

// ---------- JD 템플릿 보기·수정 (평소엔 잠금, 수정 → 저장/취소) ----------
const jdMgrSel = document.getElementById('jdTplMgrSelect');
const jdMgrTitle = document.getElementById('jdTplMgrTitle');
const jdMgrKeywords = document.getElementById('jdTplMgrKeywords');
const jdMgrBody = document.getElementById('jdTplMgrBody');
const jdMgrCareer = document.getElementById('jdTplMgrCareer');
const jdMgrStatus = document.getElementById('jdTplMgrStatus');
let jdMgrMode = 'view';   // view | edit | new
function setJdMgrStatus(msg, cls) { jdMgrStatus.textContent = msg || ''; jdMgrStatus.className = 'status' + (cls ? ' ' + cls : ''); }
function jdMgrCurrent() { return jdTemplates.find(t => t.id === jdMgrSel.value) || null; }
function jdMgrButtons() {
  const t = jdMgrMode === 'new' ? null : jdMgrCurrent(); const editing = jdMgrMode !== 'view';
  document.getElementById('jdTplEditBtn').hidden = editing || !t;
  document.getElementById('jdTplSaveBtn').hidden = !editing;
  document.getElementById('jdTplCancelBtn').hidden = !editing;
  document.getElementById('jdTplResetBtn').hidden = !(jdMgrMode === 'edit' && t && t.isDefault && t.edited);
  document.getElementById('jdTplDeleteBtn').hidden = !(jdMgrMode === 'edit' && t && !t.isDefault);
  document.getElementById('jdTplNewBtn').hidden = editing;
  jdMgrSel.disabled = editing;
  [jdMgrTitle, jdMgrKeywords, jdMgrCareer, jdMgrBody].forEach(el => { el.readOnly = !editing; });
}
function jdMgrFill() {
  const t = jdMgrCurrent();
  jdMgrTitle.value = t ? t.title : ''; jdMgrKeywords.value = t ? (t.keywords || []).join(', ') : ''; jdMgrCareer.value = t ? (t.career || '') : ''; jdMgrBody.value = t ? t.body : '';
  jdMgrButtons(); autoGrow(jdMgrBody);
}
function renderJdTplMgr(keep) {
  const cur = keep !== undefined ? keep : jdMgrSel.value;
  jdMgrSel.innerHTML = jdTemplates.map(t => `<option value="${escapeHtml(t.id)}">${escapeHtml(t.title)}${t.isDefault ? '' : ' (직접 추가)'}${t.edited ? ' (수정됨)' : ''}</option>`).join('');
  if (jdTemplates.some(t => t.id === cur)) jdMgrSel.value = cur;
  if (jdMgrMode === 'view') jdMgrFill();
}
function jdMgrDirty() {
  if (jdMgrMode === 'new') return !!(jdMgrTitle.value.trim() || jdMgrKeywords.value.trim() || jdMgrCareer.value.trim() || jdMgrBody.value.trim());
  const t = jdMgrCurrent(); if (!t) return false;
  return jdMgrTitle.value !== t.title || jdMgrKeywords.value !== (t.keywords || []).join(', ') || jdMgrCareer.value !== (t.career || '') || jdMgrBody.value !== t.body;
}
jdMgrSel.addEventListener('change', jdMgrFill);
jdMgrBody.addEventListener('input', () => autoGrow(jdMgrBody));
document.getElementById('jdTplMgrBox').addEventListener('toggle', e => { if (e.target.open) autoGrow(jdMgrBody); });
document.getElementById('jdTplEditBtn').addEventListener('click', () => { jdMgrMode = 'edit'; setJdMgrStatus(''); jdMgrButtons(); jdMgrTitle.focus(); });
document.getElementById('jdTplNewBtn').addEventListener('click', () => {
  jdMgrMode = 'new'; setJdMgrStatus('새 템플릿의 이름·단어·본문을 쓰고 저장하세요. 아래 본문은 소개 문장과 소제목 3개를 미리 넣어 둔 틀이에요.');
  jdMgrTitle.value = ''; jdMgrKeywords.value = ''; jdMgrCareer.value = '';
  jdMgrBody.value = '{{team}}{{brand}} 소속으로 (이 포지션이 하는 일을 한두 문장으로 써주세요).\n이런 일을 함께해요\n- \n이런 분이었으면 좋겠어요\n- (경력 조건을 문장으로: 예) ○○ 경험이 3년 이상 있는 분)\n- \n이런 경험이 있다면 더 좋아요\n- ';
  jdMgrButtons(); autoGrow(jdMgrBody); jdMgrTitle.focus();
});
document.getElementById('jdTplCancelBtn').addEventListener('click', () => {
  if (jdMgrDirty() && !confirm('고친 내용을 저장하지 않고 닫을까요?')) return;
  jdMgrMode = 'view'; setJdMgrStatus(''); jdMgrFill();
});
document.getElementById('jdTplSaveBtn').addEventListener('click', async () => {
  const btn = document.getElementById('jdTplSaveBtn'); btn.disabled = true;
  const body = { title: jdMgrTitle.value, keywords: jdMgrKeywords.value, career: jdMgrCareer.value, body: jdMgrBody.value };
  try {
    const isNew = jdMgrMode === 'new';
    const res = await fetch(isNew ? '/api/jd-templates' : '/api/jd-templates/' + encodeURIComponent(jdMgrSel.value), { method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => null);
    if (!data || !res.ok) throw new Error((data && data.error) || '저장하지 못했어요.');
    jdMgrMode = 'view';
    const r = await fetch('/api/jd-templates'); const list = await r.json(); jdTemplates = list.templates || jdTemplates;
    renderJdTplSelect(); renderJdTplMgr(data.template.id); refreshJdRecommend();
    setJdMgrStatus(isNew ? '새 템플릿을 추가했어요. 다음부터 포지션 이름에 맞으면 추천돼요.' : '저장했어요. 다음에 채우는 공고부터 반영돼요.', 'ok');
  } catch (err) { setJdMgrStatus(err.message || '저장 중 오류가 발생했어요.', 'err'); }
  finally { btn.disabled = false; }
});
document.getElementById('jdTplResetBtn').addEventListener('click', async () => {
  const t = jdMgrCurrent(); if (!t) return;
  if (!confirm(`"${t.title}"을(를) 처음 내용으로 되돌릴까요?\n고친 내용은 사라져요.`)) return;
  try {
    const res = await fetch(`/api/jd-templates/${encodeURIComponent(t.id)}/reset`, { method: 'POST' }); const data = await res.json().catch(() => null);
    if (!data || !res.ok) throw new Error((data && data.error) || '되돌리지 못했어요.');
    jdMgrMode = 'view'; const r = await fetch('/api/jd-templates'); jdTemplates = (await r.json()).templates || jdTemplates;
    renderJdTplSelect(); renderJdTplMgr(t.id); refreshJdRecommend(); setJdMgrStatus('처음 내용으로 되돌렸어요.', 'ok');
  } catch (err) { setJdMgrStatus(err.message || '되돌리는 중 오류가 발생했어요.', 'err'); }
});
document.getElementById('jdTplDeleteBtn').addEventListener('click', async () => {
  const t = jdMgrCurrent(); if (!t || t.isDefault) return;
  if (!confirm(`"${t.title}" 템플릿을 삭제할까요?\n이미 이 템플릿으로 만든 공고는 그대로예요.`)) return;
  try {
    const res = await fetch('/api/jd-templates/' + encodeURIComponent(t.id), { method: 'DELETE' }); const data = await res.json().catch(() => null);
    if (!data || !res.ok) throw new Error((data && data.error) || '삭제하지 못했어요.');
    jdMgrMode = 'view'; const r = await fetch('/api/jd-templates'); jdTemplates = (await r.json()).templates || jdTemplates;
    renderJdTplSelect(); renderJdTplMgr(jdTemplates[0] && jdTemplates[0].id); refreshJdRecommend(); setJdMgrStatus('삭제했어요.', 'ok');
  } catch (err) { setJdMgrStatus(err.message || '삭제 중 오류가 발생했어요.', 'err'); }
});

// ---------- 사람인 "포지션 상세" 복사 ----------
// 모집 개요와 공통 안내를 뺀 포지션 상세를 클립보드에 복사해요. [입력]·[추천] 표시가 남아 있으면 사람인에 그대로 올라가므로 먼저 확인을 물어요.
const copyDetailStatus = document.getElementById('copyDetailStatus');
const copyDetailShown = document.getElementById('copyDetailShown');
function setCopyStatus(msg, cls) { copyDetailStatus.textContent = msg || ''; copyDetailStatus.className = 'status' + (cls ? ' ' + cls : ''); }
document.getElementById('copyDetailBtn').addEventListener('click', async () => {
  const jd = postJd.value;
  if (!jd.trim()) { setCopyStatus('복사할 공고문이 비어 있어요.', 'err'); return; }
  const btn = document.getElementById('copyDetailBtn'); btn.disabled = true; setCopyStatus(''); copyDetailShown.hidden = true;
  try {
    const res = await fetch('/api/postings/position-detail', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jd }) });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
    if (!res.ok || !data.success) throw new Error(data.error || '복사할 글을 만들지 못했어요.');
    const warns = [];
    if (data.input) warns.push(`[입력] 표시가 ${data.input}곳 남아 있어요(직접 채우는 곳)`);
    if (data.recommend) warns.push(`[추천] 표시가 ${data.recommend}곳 남아 있어요(경력 조건 확인 전)`);
    if (!data.hasSections) warns.push('소제목 3개(이런 일을 함께해요 / 이런 분이었으면 좋겠어요 / 이런 경험이 있다면 더 좋아요)가 모두 있지는 않아요');
    if (warns.length && !confirm(`사람인에 올릴 글에 확인할 것이 있어요:\n· ${warns.join('\n· ')}\n\n이대로 사람인에 올라갈 수 있어요. 그래도 복사할까요?\n[취소]를 누르면 복사하지 않아요.`)) { setCopyStatus('복사하지 않았어요. 표시를 확인하고 고친 뒤 다시 눌러주세요.', 'err'); return; }
    let copied = false;
    try { await navigator.clipboard.writeText(data.text); copied = true; } catch { /* 복사 권한이 없으면 아래 글칸에 보여줘요 */ }
    copyDetailShown.value = data.text; copyDetailShown.hidden = copied;
    setCopyStatus(copied ? `포지션 상세를 복사했어요${data.legacy ? ' (예전 형식이라 소제목의 대괄호와 경력 줄을 링크 공고 형식으로 바꿨어요)' : ''}. 사람인 모집요강의 "포지션 상세" 칸에 붙여넣으세요.` : '자동 복사가 막혀 있어요. 아래 글칸의 내용을 전체 선택해서 직접 복사하세요.', 'ok');
    if (!copied) { copyDetailShown.focus(); copyDetailShown.select(); }
  } catch (err) { setCopyStatus(err.message || '복사하는 중 오류가 발생했어요.', 'err'); }
  finally { btn.disabled = false; }
});

// ---------- 사람인 입력용 정리 ----------
// 사람인 공고 등록 화면의 칸별로 값을 정리하고 칸마다 복사할 수 있게 해요. 칸이 비어 있으면(경력·학력·자격요건 등) "입력 필요"로 표시해요.
async function copyText(text, shownEl) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* 권한이 없으면 글칸에 보여줘요 */ }
  if (shownEl) { shownEl.hidden = false; shownEl.value = text; shownEl.focus(); shownEl.select(); }
  return false;
}
async function refreshSaramin() {
  if (!postJd.value.trim()) { saraminStatus.textContent = '정리할 공고문이 비어 있어요.'; saraminStatus.className = 'status err'; saraminList.innerHTML = ''; return; }
  const c = collectPosting();
  saraminStatus.textContent = ''; saraminStatus.className = 'status';
  try {
    const res = await fetch('/api/postings/saramin-fields', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jd: c.jd, career: c.career, education: c.education, employmentType: c.employmentType, months: c.months, workplace: c.workplace }) });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
    if (!res.ok || !data.success) throw new Error(data.error || '정리하지 못했어요.');
    const notes = [];
    if (data.missing.length) notes.push(`비어 있는 칸: ${data.missing.join(', ')}`);
    if (data.input) notes.push(`[입력] 표시 ${data.input}곳`);
    if (data.recommend) notes.push(`[추천] 표시 ${data.recommend}곳`);
    if (careerState === 'suggested') notes.push('경력은 추천값이고 아직 확인하지 않았어요');
    saraminList.innerHTML = (notes.length ? `<p class="manage-hint sr-warn">확인할 것: ${escapeHtml(notes.join(' · '))}</p>` : '') + data.fields.map(f => `
      <div class="sr-row${f.value ? '' : ' sr-empty'}" data-key="${escapeHtml(f.key)}">
        <div class="sr-head"><strong>${escapeHtml(f.label)}</strong>${f.value ? '' : `<span class="sr-badge">${f.needed ? '입력 필요' : '없음'}</span>`}<button type="button" class="link-btn sr-copy"${f.value ? '' : ' disabled'}>복사</button></div>
        <pre class="sr-val">${f.value ? escapeHtml(f.value) : '(비어 있어요)'}</pre>
      </div>`).join('') + '<textarea class="sr-shown" rows="6" readonly hidden aria-label="자동 복사가 안 될 때 직접 복사하세요"></textarea>';
    // 필요한 칸이 모두 찼어도 선택 칸(급여·근무일시·우대사항)이 비어 있을 수 있어서, "모든 칸이 채워졌다"고 말하지 않고 비어 있는 칸을 정확히 알려요
    const emptyOptional = data.fields.filter(f => !f.needed && !f.value).map(f => f.label);
    saraminStatus.textContent = notes.length ? '' : `필요한 칸은 모두 채워져 있어요.${emptyOptional.length ? ` (${emptyOptional.join('·')}은 비어 있어요 — 사람인에서 직접 입력하거나 비워 두세요)` : ''} 칸마다 복사해서 사람인에 붙여넣으세요.`;
    saraminStatus.className = 'status' + (notes.length ? '' : ' ok');
  } catch (err) { saraminStatus.textContent = err.message || '정리하는 중 오류가 발생했어요.'; saraminStatus.className = 'status err'; }
}
document.getElementById('saraminRefreshBtn').addEventListener('click', refreshSaramin);
saraminList.addEventListener('click', async e => {
  const b = e.target.closest('.sr-copy'); if (!b) return;
  const row = b.closest('.sr-row'); const text = row.querySelector('.sr-val').textContent;
  const ok = await copyText(text, saraminList.querySelector('.sr-shown'));
  saraminStatus.textContent = ok ? `"${row.querySelector('strong').textContent}" 칸을 복사했어요.` : '자동 복사가 막혀 있어요. 아래 글칸의 내용을 직접 복사하세요.';
  saraminStatus.className = 'status ok';
});
document.getElementById('saraminBox').addEventListener('toggle', e => { if (e.target.open) refreshSaramin(); });

// ---------- 면접 질문 추천 (면접 일정 카드) ----------
// 일정의 이름·연락처로 노션 지원자를 찾고, 문항 은행(필수·오프닝·추천 선택)과 이력서 맞춤 질문을 체크박스로 보여줘요.
// 맞춤 질문은 버튼을 눌렀을 때만 AI를 불러요(자동으로 비용이 들지 않게). API 없이 쓰려면 요청문을 복사해 Claude 채팅에 붙여넣어요.
// 공용 패널: 일정 카드(opts.btn으로 열고 이름·연락처로 지원자 찾기)와 면접 관리 탭(opts.preset으로 지원자를 바로 지정)이 같은 코드를 써요.
// 마크업은 <template id="iqPanelTpl">에서 복제해요. 맞춤 질문은 버튼을 눌렀을 때만 AI를 불러요(자동으로 비용이 들지 않게).
// 평가 사유는 노션 답변 칸 안에 "답변 ⏎⏎[평가 사유] 사유"로 함께 저장돼요(서버와 같은 규칙). 화면은 전송한 값을 "노션의 현재 값"으로 기억할 때 써요.
const REASON_MARK = '[평가 사유]';
const joinReason = (answer, reason) => { const a = String(answer ?? '').replace(/\r\n/g, '\n').split(REASON_MARK).join('').trim(); const r = String(reason ?? '').replace(/\r\n/g, '\n').split(REASON_MARK).join('').trim(); return r ? (a ? `${a}\n\n${REASON_MARK} ${r}` : `${REASON_MARK} ${r}`) : a; };
// ⭐ 점수의 공통 의미(질문별 기준은 질문 아래의 "확인"과 "좋은 답·주의 신호"를 같이 보세요). 합격·불합격 기준이 아니에요.
const STAR_SHORT = { 1: '미흡', 2: '약함', 3: '보통', 4: '좋음', 5: '매우 좋음' };   // 점수 선택 목록에 보이는 짧은 말(전체 의미는 마우스를 올리거나 위의 "⭐ 점수는 이렇게 읽어요"에서 봐요)
const STAR_MEANING = { 1: '답이 거의 없거나 질문과 맞지 않아요', 2: '일부만 답했고 근거(사례·수치·본인 역할)가 약해요', 3: '질문에 맞게 답했고 기본 근거는 있어요', 4: '구체적인 사례와 본인 역할이 분명해요', 5: '수치·본인 기여·재현 가능한 방법까지 구체적이고 인상적이에요' };
// 요건별 확인 질문을 질문 목록 항목으로: 노션 표에 맞춤 질문처럼 쓰이도록 기준 칸에 어떤 요건인지(필수 R1 + 원문)를 함께 남겨요
function toReqItem(q) {
  return { question: q.question, criteria: `[${q.kind} ${q.reqId}] ${q.requirement}${q.criteria ? ' — ' + q.criteria : ''}`.slice(0, 280), basis: '', reqId: q.reqId, kind: q.kind, requirement: q.requirement, isReq: true };
}
function mountInterviewPanel(host, opts) {
  const tpl = document.getElementById('iqPanelTpl'); if (!tpl || !host) return null;
  host.innerHTML = ''; host.appendChild(tpl.content.cloneNode(true));
  const panel = host.querySelector('.iq-panel'); const btn = opts.btn || null; const s = opts.schedule || {};
  const $ = sel => panel.querySelector(sel);
  const statusEl = $('.iq-status'), pickEl = $('.iq-pick'), modeEl = $('.iq-mode'), optsEl = $('.iq-opts'), resultEl = $('.iq-result'), promptBox = $('.iq-prompt');
  let applicant = null, data = null, custom = [], reqq = [], facts = [], scens = [], planInfo = null, srcInfo = null, existing = new Map(), answers = new Map(), dirty = false;
  const api = { isDirty: () => dirty, applicant: () => applicant };
  const setStatus = (m, c) => { statusEl.textContent = m || ''; statusEl.className = 'status iq-status' + (c ? ' ' + c : ''); };
  const digits = v => String(v || '').replace(/\D/g, '');
  const markDirty = v => { dirty = v; if (opts.onDirty) opts.onDirty(v); };
  if (opts.preset) { panel.hidden = false; applicant = opts.preset; }
  if (btn) btn.addEventListener('click', async () => {
    panel.hidden = !panel.hidden;
    if (panel.hidden || applicant) return;
    setStatus('노션에서 지원자를 찾는 중...');
    try {
      const st = await ensureNotionStatus();
      if (!st || !st.configured) { setStatus('노션이 연결돼 있지 않아서 질문을 추천할 수 없어요. (노션 연결은 설정에서 확인하세요)', 'err'); return; }
      const res = await fetch('/api/notion/applicants?status=all&q=' + encodeURIComponent(s.name || ''));
      const j = await readJsonOrNull(res);
      if (!j || !res.ok) throw new Error((j && j.error) || '노션에서 지원자를 불러오지 못했어요.');
      const list = (j.applicants || []).filter(x => x.name === s.name);
      if (!list.length) { setStatus(`노션에서 "${s.name}" 지원자를 찾지 못했어요. 노션 지원자 DB에 같은 이름으로 등록돼 있는지 확인해주세요.`, 'err'); return; }
      const exact = list.filter(x => digits(x.phone) && digits(x.phone) === digits(s.phone));
      const cands = exact.length ? exact : list;
      if (cands.length === 1) { applicant = cands[0]; showMode(); return; }
      setStatus('이름이 같은 지원자가 여러 명이에요. 누구인지 골라주세요.');
      pickEl.innerHTML = '<select class="iq-pick-sel" aria-label="노션 지원자 선택">' + cands.map((x, i) => `<option value="${i}">${escapeHtml(x.name)} · ${escapeHtml(x.team || '팀 없음')} · ${escapeHtml(x.job || '직무 없음')} · ${escapeHtml(x.phone || '연락처 없음')}</option>`).join('') + '</select> <button type="button" class="iq-pick-ok add-btn">이 지원자로 진행</button>';
      pickEl.querySelector('.iq-pick-ok').addEventListener('click', () => { applicant = cands[Number(pickEl.querySelector('.iq-pick-sel').value)]; pickEl.innerHTML = ''; showMode(); });
    } catch (err) { setStatus(err.message || '지원자를 찾는 중 오류가 발생했어요.', 'err'); }
  });
  $('.sch-iq-close').addEventListener('click', () => { if (dirty && !confirm('보내지 않은 답변이 있어요. 닫으면 작성한 답변이 사라져요.\n\n그래도 닫을까요?')) return; markDirty(false); panel.hidden = true; if (opts.onClose) opts.onClose(); });
  function showMode() {
    setStatus(`노션 지원자: ${applicant.name}${applicant.team ? ' · ' + applicant.team : ''}${applicant.job ? ' · ' + applicant.job : ''}. 방식을 고르고 "질문 추천받기"를 누르세요.`, 'ok');
    modeEl.hidden = false; optsEl.hidden = false;
  }
  const extraTa = $('.iq-extra-text'), extraCount = $('.iq-extra-count');
  extraTa.addEventListener('input', () => { extraCount.textContent = `${extraTa.value.length} / 8000자`; });
  $('.iq-pdf').addEventListener('change', () => {
    const fl = [...$('.iq-pdf').files]; const list = $('.iq-pdf-list');
    if (fl.length > 2) { $('.iq-pdf').value = ''; list.textContent = '이력서 PDF는 최대 2개까지 올릴 수 있어요.'; return; }
    const big = fl.find(f => f.size > 4 * 1024 * 1024); if (big) { $('.iq-pdf').value = ''; list.textContent = `"${big.name}"은 4MB를 넘어요. 파일을 줄여서 올려주세요.`; return; }
    const bad = fl.find(f => !/\.pdf$/i.test(f.name) && f.type !== 'application/pdf'); if (bad) { $('.iq-pdf').value = ''; list.textContent = `"${bad.name}"은 PDF 파일이 아니에요.`; return; }
    list.textContent = fl.length ? `올린 이력서: ${fl.map(f => f.name).join(', ')} (질문 추천받기를 누르면 이 이력서를 반영해요)` : '';
  });
  $('.iq-run').addEventListener('click', async () => {
    if (!applicant) return;
    const mode = $('.iq-mode-prompt').checked ? 'prompt' : 'ai';
    if (dirty && !confirm('보내지 않은 답변이 있어요. 질문을 다시 만들면 작성한 답변이 사라져요.\n\n그래도 다시 만들까요?')) return;
    answers = new Map(); reqq = []; facts = []; scens = []; planInfo = null; srcInfo = null; markDirty(false);
    const run = $('.iq-run'); run.disabled = true; setStatus(mode === 'ai' ? 'AI가 맞춤 질문을 만드는 중... (노션 문항은 바로 보여드려요)' : '요청문을 만드는 중...'); resultEl.hidden = true; promptBox.hidden = true; custom = [];
    try {
      const pdfFiles = mode === 'ai' ? [...($('.iq-pdf').files || [])] : [];
      const res = pdfFiles.length
        ? await fetch(`/api/interview/questions-pdf?applicantId=${encodeURIComponent(applicant.id)}&stage=${encodeURIComponent($('.iq-stage').value)}&minutes=${Number($('.iq-minutes').value)}`, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: await batchBundleBody(pdfFiles) })   // 앱에서 올린 이력서 PDF: 질문을 만드는 데만 쓰고 저장하지 않아요
        : await fetch('/api/interview/questions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicantId: applicant.id, mode, stage: $('.iq-stage').value, minutes: Number($('.iq-minutes').value), withResume: $('.iq-with-resume').checked, extra: extraTa.value }) });
      const j = await readJsonOrNull(res);
      if (!j) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
      if (!res.ok || !j.success) throw new Error(j.error || '질문을 만들지 못했어요.');
      data = j; custom = j.custom || []; reqq = (j.reqQuestions || []).map(toReqItem); facts = j.factChecks || []; scens = j.scenarios || []; planInfo = j.plan || null; srcInfo = { sources: j.sources || null, notes: j.notes || [] };
      const table = await loadExisting();   // 노션 채용 문항 표에 이미 있는 답변·점수를 미리 채워요
      if (mode === 'prompt') { promptBox.hidden = false; promptBox.dataset.prompt = j.prompt; }
      renderResult();
      const notes = [];
      if (!j.applicant.hasSummary) notes.push('이 지원자는 앱에서 남긴 이력서 평가 요약이 없어서 직무 기준으로만 맞춤 질문을 만들어요');
      if (j.matchedPosition) notes.push(`확정 공고("${j.matchedPosition}")의 요건을 참고했어요`);
      if (j.dropped) notes.push(`나이·가족 같은 주제의 질문 ${j.dropped}개는 뺐어요`);
      if (j.sources && j.sources.resume && j.sources.resume.uploaded) notes.push(`올린 이력서(${j.sources.resume.files.join(', ')})를 반영했어요(저장하지 않아요)`);
      (j.notes || []).forEach(x => notes.push(x.replace(/[.。]$/, '')));
      if (table && table.found === false && table.note) notes.push(table.note);
      else if (table && table.found) notes.push('노션 채용 문항 표에 답변을 바로 쓸 수 있어요');
      setStatus(mode === 'ai' ? (custom.length ? `맞춤 질문 ${custom.length}개${facts.length ? `, 사실 확인 질문 ${facts.length}개` : ''}${scens.length ? `, 직무 상황 질문 ${scens.length}개` : ''}를 만들었어요.` : '맞춤 질문을 만들지 못했어요. 문항 은행 질문은 그대로 쓸 수 있어요.') + (notes.length ? ' ' + notes.join(' · ') + '.' : '') : '요청문을 만들었어요. 아래 ①②를 진행하세요.' + (notes.length ? ' ' + notes.join(' · ') + '.' : ''), 'ok');
    } catch (err) { setStatus(err.message || '질문을 만드는 중 오류가 발생했어요.', 'err'); }
    finally { run.disabled = false; }
  });
  async function copyOut(text, shown) { try { await navigator.clipboard.writeText(text); return true; } catch { shown.hidden = false; shown.value = text; shown.focus(); shown.select(); return false; } }
  $('.iq-copy-prompt').addEventListener('click', async () => {
    const ok = await copyOut(promptBox.dataset.prompt || '', $('.iq-prompt-shown'));
    setStatus(ok ? '요청문을 복사했어요. Claude 채팅에 붙여넣고 보내세요.' : '자동 복사가 막혀 있어요. 아래 글칸의 내용을 직접 복사하세요.', ok ? 'ok' : 'err');
  });
  $('.iq-import').addEventListener('click', async () => {
    const answer = $('.iq-answer').value;
    if (!answer.trim()) { setStatus('Claude의 답변을 먼저 붙여넣어주세요.', 'err'); return; }
    try {
      const res = await fetch('/api/interview/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answer, applicantId: applicant ? applicant.id : '' }) });
      const j = await readJsonOrNull(res);
      if (!j) throw new Error('서버가 응답하지 못했어요.');
      if (!res.ok || !j.success) throw new Error(j.error || '가져오지 못했어요.');
      custom = j.custom || []; facts = j.factChecks || []; scens = j.scenarios || []; if (Array.isArray(j.reqQuestions) && j.reqQuestions.length) reqq = j.reqQuestions.map(toReqItem); renderResult(); setStatus(`맞춤 질문 ${custom.length}개${reqq.length ? `와 공고 요건 확인 질문 ${reqq.length}개` : ''}를 가져왔어요.${j.dropped ? ` (나이·가족 같은 주제 ${j.dropped}개는 뺐어요)` : ''}`, 'ok');
    } catch (err) { setStatus(err.message || '가져오는 중 오류가 발생했어요.', 'err'); }
  });
  // 노션 "채용 문항" 표에 이미 있는 답변·점수를 불러와요(있으면 미리 채우고, 이 화면이 불러온 값을 base로 기억해 충돌을 정확히 판단해요)
  async function loadExisting() {
    existing = new Map();
    try {
      const res = await fetch('/api/interview/card?applicantId=' + encodeURIComponent(applicant.id)); const j = await readJsonOrNull(res);
      if (j && res.ok && j.table) { (j.table.rows || []).forEach(r => { if (r.no) existing.set('no:' + r.no, r); if (r.question) existing.set('q:' + r.question, r); }); return j.table; }
    } catch { /* 못 불러와도 질문은 쓸 수 있어요 */ }
    return null;
  }
  const rowKey = q => (q.no ? 'no:' + q.no : 'q:' + String(q.question || '').replace(/\s+/g, ' ').trim());
  const stateOf = q => { const k = rowKey(q); if (!answers.has(k)) { const ex = existing.get(k) || (q.no ? null : existing.get('q:' + String(q.question || '').replace(/\s+/g, ' ').trim())); answers.set(k, { answer: ex ? ex.answer : '', reason: ex ? (ex.reason || '') : '', score: ex ? ex.score : 0, base: ex ? (ex.raw ?? ex.answer) : '', fromNotion: !!ex && !!(ex.answer || ex.reason || ex.score) }); } return answers.get(k); };
  // 면접 진행 순서로 한 줄 목록을 만들어요: 오프닝 → 노션 필수 질문과 이력서 맞춤 질문을 번갈아 → 공고 요건 → 직무 상황 → 사실 확인 → 추천 선택 → 그 밖의 선택.
  // 항목마다 원래 구역(data-kind)과 번호(data-i)를 그대로 써서, 체크·답변·점수·노션 전송이 구역별 보기와 똑같이 동작해요.
  function mixedHtml() {
    const more = (data.optionalAll || []).filter(x => !(data.suggested || []).some(y => y.no === x.no));
    const rows = []; const add = (list, kind, tag, checked) => (list || []).forEach((q, i) => rows.push({ q, i, kind, tag, checked }));
    add(data.opening, 'opening', '오프닝', false);
    const req = (data.required || []).map((q, i) => ({ q, i, kind: 'required', tag: '노션 문항', checked: true })), cus = (custom || []).map((q, i) => ({ q, i, kind: 'custom', tag: '이력서 맞춤', checked: true }));
    for (let k = 0; k < Math.max(req.length, cus.length); k++) { if (req[k]) rows.push(req[k]); if (cus[k]) rows.push(cus[k]); }   // 노션 필수 1 → 맞춤 1 → 노션 필수 2 → 맞춤 2 …(한쪽이 먼저 끝나면 남은 것을 이어서)
    add(reqq, 'reqq', '공고 요건', true); add(scens, 'scen', '직무 상황', true); add(facts, 'fact', '사실 확인', true);
    add(data.suggested, 'suggested', '노션 문항', true); add(more, 'more', '노션 문항', false);
    if (!rows.length) return '';
    return `<div class="iq-group iq-mixed"><strong>면접 질문 (섞어서 · 진행 순서대로)</strong><span class="manage-hint" style="margin:0 0 0 6px">노션 문항과 이력서 맞춤 질문을 한 줄로 섞었어요. 앞의 표시로 어디서 온 질문인지 구분해요</span><ul class="iq-list">${rows.map(r => itemHtml(r.q, r.i, r.kind, r.checked, r.tag)).join('')}</ul></div>`;
  }
  let iqView = 'mixed';   // 'mixed'(섞어서) | 'groups'(구역별)
  function itemHtml(q, i, kind, checked, tag) { const st = stateOf(q); return `
      <li data-kind="${kind}" data-i="${i}"><label><input type="checkbox" class="iq-chk" data-kind="${kind}" data-i="${i}"${checked ? ' checked' : ''} />
        <span class="iq-q">${tag ? `<span class="iq-src-tag">${escapeHtml(tag)}</span>` : ''}${q.isReq ? `<span class="req-kind kind-${q.kind === '우대' ? 'pref' : 'must'}">${escapeHtml(q.kind)} ${escapeHtml(q.reqId)}</span>` : (q.no ? `<span class="iq-no">${escapeHtml(q.no)}</span>` : '')}${q.type && ['경력 검증', '요건 확인', '사실 확인', '직무 상황', '인재상', '동기·조건'].includes(q.type) ? `<span class="iq-type">${escapeHtml(q.type)}</span>` : ''}${escapeHtml(q.question)}${st.fromNotion ? ' <span class="iq-badge">노션에 기록 있음</span>' : ''}</span></label>
        ${q.isReq ? `<div class="iq-sub">요건: ${escapeHtml(q.requirement)}</div>` : (q.criteria ? `<div class="iq-sub">확인: ${escapeHtml(q.criteria)}</div>` : '')}${q.basis ? `<div class="iq-sub">근거: ${escapeHtml(q.basis)}</div>` : (srcInfo && srcInfo.sources && srcInfo.sources.resume && srcInfo.sources.resume.used && !q.isReq && q.type !== undefined ? '<div class="iq-sub iq-general">일반 질문 — 이력서에서 근거를 찾지 못했어요</div>' : '')}${(q.followUps && q.followUps.length) || (q.goodSigns && q.goodSigns.length) || (q.watchSigns && q.watchSigns.length) ? `<details class="iq-more"><summary>꼬리질문 · 답변 평가 신호</summary>${q.followUps && q.followUps.length ? `<div class="iq-sub"><strong>꼬리질문</strong> ${q.followUps.map(escapeHtml).join(' / ')}</div>` : ''}${q.goodSigns && q.goodSigns.length ? `<div class="iq-sub iq-good"><strong>좋은 답의 신호</strong> ${q.goodSigns.map(escapeHtml).join(' / ')}</div>` : ''}${q.watchSigns && q.watchSigns.length ? `<div class="iq-sub iq-watch"><strong>주의 신호</strong> ${q.watchSigns.map(escapeHtml).join(' / ')}</div>` : ''}<div class="manage-hint" style="margin:2px 0 0">신호는 답을 들으며 관찰하는 참고용이에요. 합격·불합격 기준이 아니에요.</div></details>` : ''}
        <div class="iq-ans"${checked ? '' : ' hidden'}>
          <textarea class="iq-ans-text" rows="2" maxlength="6000" placeholder="면접 답변을 적어요 (노션 채용 문항 표의 '답변'에 들어가요)" aria-label="답변">${escapeHtml(st.answer)}</textarea>
          <select class="iq-ans-score" aria-label="점수(⭐)"><option value="0">점수 선택</option>${[1,2,3,4,5].map(n => `<option value="${n}"${st.score === n ? ' selected' : ''} title="${escapeHtml(STAR_MEANING[n])}">${'⭐'.repeat(n)} ${STAR_SHORT[n]}</option>`).join('')}</select>
          <input class="iq-ans-reason" maxlength="1000" placeholder="평가 사유 (선택) — 답에서 관찰한 행동·근거를 적어요. 나이·가족 같은 내용은 쓰지 마세요" aria-label="평가 사유" value="${escapeHtml(st.reason || '')}" />
          <span class="manage-hint iq-reason-hint" style="margin:0"></span>
        </div></li>`; }
  function group(title, hint, items, checked, kind) {
    if (!items.length) return '';
    return `<div class="iq-group"><strong>${escapeHtml(title)}</strong>${hint ? `<span class="manage-hint" style="margin:0 0 0 6px">${escapeHtml(hint)}</span>` : ''}<ul class="iq-list">` + items.map((q, i) => itemHtml(q, i, kind, checked)).join('') + '</ul></div>';
  }
  // 이번 질문에 쓴 자료와 면접 진행안(시간 배분)을 결과 맨 위에 보여줘요
  function planHtml() {
    const s = srcInfo && srcInfo.sources, notes = (srcInfo && srcInfo.notes) || [];
    const used = [];
    if (s) {
      if (s.summary) used.push('노션 평가 요약');
      if (s.posting) used.push('확정 공고 요건');
      if (s.ideal) used.push('공통 인재상');
      if (s.checklist) used.push(`서류 점검 "확인 필요" ${s.checklist}건`);
      if (s.resume && s.resume.used) used.push(`이력서 PDF ${s.resume.files.length}개(${s.resume.files.map(escapeHtml).join(', ')})`);
      if (s.extra) used.push('추가 자료');
    }
    const srcBox = s ? `<div class="iq-src"><strong>이번 질문에 쓴 자료</strong> ${used.length ? used.map(x => `<span class="iq-badge">${x}</span>`).join(' ') : '<span class="manage-hint">없음</span>'}${s.resume && s.resume.skipped && s.resume.skipped.length ? `<div class="manage-hint">못 읽은 파일: ${s.resume.skipped.map(escapeHtml).join(' · ')}</div>` : ''}${notes.length ? `<div class="manage-hint">${notes.map(escapeHtml).join(' · ')}</div>` : ''}</div>` : '';
    const planBox = planInfo && planInfo.timeline ? `<div class="iq-plan"><strong>면접 진행안</strong> <span class="manage-hint" style="margin:0">${escapeHtml(planInfo.stage)} 면접 · ${planInfo.minutes}분 (참고용 시간 배분이에요)</span><ol class="iq-plan-list">${planInfo.timeline.map(r => `<li><span class="iq-plan-min">${r.minutes}분</span> ${escapeHtml(r.label)}</li>`).join('')}</ol></div>` : '';
    return srcBox + planBox;
  }
  // ⭐ 점수의 공통 의미 안내(접이식). 질문 줄의 점수 선택 힌트와 같은 문구(STAR_MEANING)를 써요
  function starGuideHtml() {
    return `<details class="iq-stars"><summary>⭐ 점수는 이렇게 읽어요 (참고)</summary><ul>${[5, 4, 3, 2, 1].map(n => `<li><strong>${'⭐'.repeat(n)}</strong> ${escapeHtml(STAR_MEANING[n])}</li>`).join('')}</ul><p class="manage-hint" style="margin:2px 0 0">질문마다 "확인"(무엇을 보는지)과 "좋은 답·주의 신호"를 같이 보세요. 점수와 사유는 <strong>답에서 관찰한 행동과 근거</strong>로만 적어요(나이·결혼·가족 같은 내용은 안 돼요). 점수는 참고이고 합격·불합격은 사람이 정해요.</p></details>`;
  }
  function renderResult() {
    if (!data) return;
    resultEl.hidden = false;
    const more = (data.optionalAll || []).filter(x => !(data.suggested || []).some(y => y.no === x.no));
    const viewBar = `<div class="iq-viewbar" role="tablist" aria-label="질문 보기 방식"><button type="button" class="sub-btn iq-view-btn${iqView === 'mixed' ? ' active' : ''}" data-view="mixed" role="tab" aria-selected="${iqView === 'mixed'}">섞어서 보기</button><button type="button" class="sub-btn iq-view-btn${iqView === 'groups' ? ' active' : ''}" data-view="groups" role="tab" aria-selected="${iqView === 'groups'}">구역별로 보기</button></div>`;
    resultEl.innerHTML = planHtml() + starGuideHtml() + viewBar + (iqView === 'mixed' ? mixedHtml() : '') + (iqView === 'mixed' ? '' :
      group('공고 요건 확인 질문', '공고의 필수·우대 요건마다 하나씩 (면접에서 어떻게 했는지 확인)', reqq, true, 'reqq') +
        group('이력서 맞춤 질문', 'AI가 지원자의 이력서 평가 요약을 근거로 만든 질문', custom, true, 'custom') +
      group('직무 상황 질문', '공고의 업무를 바탕으로 한 상황 질문 (정답보다 판단 근거와 우선순위를 확인)', scens, true, 'scen') +
      group('사실 확인 질문', '이력서에서 확인이 필요한 사실을 중립적으로 묻는 질문 (점수가 아니라 사실 확인)', facts, true, 'fact') +
      group('필수 질문', `노션 문항 ${data.required.length}개`, data.required, true, 'required') +
      group('추천 선택 질문', '직무에 어울리는 노션 선택 문항', data.suggested || [], true, 'suggested') +
      group('오프닝(인사)', '면접 시작 때', data.opening || [], false, 'opening') +
      group('그 밖의 선택 질문', '필요하면 체크하세요', more, false, 'more')) +
      `<div class="posting-actions iq-actions"><button type="button" class="iq-copy-sel add-btn">선택한 질문 복사</button><button type="button" class="iq-save add-btn" data-edit="resume">노션 카드에 질문 기록</button><button type="button" class="iq-send-ans add-btn">답변을 노션에 전송</button><span class="manage-hint iq-count"></span></div>
       <p class="iq-score-sum" aria-live="polite"></p>
       <p class="manage-hint iq-ans-note">체크한 질문 아래에 답변과 점수를 적고 "답변을 노션에 전송"을 누르세요. 노션 「채용 문항」 표의 해당 질문 행에 쓰이고, 표에 없는 질문(맞춤 질문)은 새 행으로 추가돼요. 표가 없는 카드는 카드 본문에 기록해요. 노션에 이미 다른 답변이 있으면 덮어쓰기 전에 물어봐요.</p>`;
    resultEl.querySelectorAll('.iq-view-btn').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.view === iqView) return;
      const checkedNow = new Map([...resultEl.querySelectorAll('.iq-chk')].map(c => [c.dataset.kind + ':' + c.dataset.i, c.checked]));   // 보기를 바꿔도 체크 상태는 지켜요(답변·점수는 질문 객체에 있어서 그대로예요)
      iqView = b.dataset.view; renderResult();
      resultEl.querySelectorAll('.iq-chk').forEach(c => { const k = c.dataset.kind + ':' + c.dataset.i; if (checkedNow.has(k)) { c.checked = checkedNow.get(k); const li = c.closest('li'); li.querySelector('.iq-ans').hidden = !c.checked; } });
      updateCount();
    }));
    resultEl.querySelectorAll('.iq-chk').forEach(c => c.addEventListener('change', () => { const li = c.closest('li'); li.querySelector('.iq-ans').hidden = !c.checked; updateCount(); }));
    resultEl.querySelectorAll('.iq-list li').forEach(li => {
      const grp = li.dataset.kind; const idx = Number(li.dataset.i); const q = listOf(grp)[idx]; if (!q) return;
      li.querySelector('.iq-ans-text').addEventListener('input', e => { stateOf(q).answer = e.target.value; markDirty(true); });
      const hint = () => { const st = stateOf(q); const h = li.querySelector('.iq-reason-hint'); h.textContent = (st.score && (st.score <= 2 || st.score === 5) && !String(st.reason || '').trim()) ? `⭐${st.score}는 사유를 적어두면 나중에 근거로 좋아요.` : ''; };
      li.querySelector('.iq-ans-reason').addEventListener('input', e => { stateOf(q).reason = e.target.value; markDirty(true); hint(); });
      li.querySelector('.iq-ans-score').addEventListener('change', e => { stateOf(q).score = Number(e.target.value) || 0; markDirty(true); updateCount(); hint(); });
      hint();
    });
    updateCount();
    resultEl.querySelector('.iq-copy-sel').addEventListener('click', copySelected);
    resultEl.querySelector('.iq-save').addEventListener('click', () => saveSelected(false));
    resultEl.querySelector('.iq-send-ans').addEventListener('click', () => sendAnswers(false));
  }
  function listOf(kind) {
    const more = (data.optionalAll || []).filter(x => !(data.suggested || []).some(y => y.no === x.no));
    return { custom, reqq, scen: scens, fact: facts, required: data.required, suggested: data.suggested || [], opening: data.opening || [], more }[kind] || [];
  }
  function selected() {
    const pick = kind => [...resultEl.querySelectorAll(`.iq-chk[data-kind="${kind}"]:checked`)].map(c => Number(c.dataset.i));
    return {
      custom: [...pick('reqq').map(i => reqq[i]), ...pick('custom').map(i => custom[i]), ...pick('scen').map(i => scens[i]), ...pick('fact').map(i => facts[i])].filter(Boolean), required: pick('required').map(i => data.required[i]).filter(Boolean),
      suggested: [...pick('suggested').map(i => (data.suggested || [])[i]), ...pick('more').map(i => listOf('more')[i])].filter(Boolean), opening: pick('opening').map(i => (data.opening || [])[i]).filter(Boolean),
    };
  }
  // 면접 점수 요약: 점수(⭐)를 매긴 모든 질문(노션에서 불러온 값 포함)의 평균이에요. 서버에 저장하지 않고 화면에서만 계산해요.
  function scoreSummary() {
    const all = [...reqq, ...custom, ...scens, ...facts, ...data.required, ...(data.suggested || []), ...(data.opening || []), ...listOf('more')];
    const seen = new Set(); const sc = [];
    all.forEach(x => { const k = rowKey(x); if (seen.has(k)) return; seen.add(k); const v = stateOf(x).score; if (v) sc.push(v); });
    return sc.length ? { n: sc.length, avg: Math.round(sc.reduce((a, b) => a + b, 0) / sc.length * 10) / 10 } : null;
  }
  function updateCount() { const q = selected(); const n = q.custom.length + q.required.length + q.suggested.length + q.opening.length; const filled = [...q.custom, ...q.required, ...q.suggested, ...q.opening].filter(x => { const st = stateOf(x); return st.answer.trim() || String(st.reason || '').trim() || st.score; }).length; const sm = scoreSummary(); resultEl.querySelector('.iq-count').textContent = `${n}개 선택 · 답변/점수 ${filled}개 작성`; const box = resultEl.querySelector('.iq-score-sum'); if (box) box.textContent = sm ? `면접 점수 평균 ${sm.avg.toFixed(1)} / 5 (점수를 매긴 질문 ${sm.n}개)` : '아직 점수를 매긴 질문이 없어요'; }
  async function copySelected() {
    const q = selected(); const lines = [];
    const add = (t, list) => { if (list.length) { lines.push(`[${t}]`); list.forEach((x, i) => { lines.push(`${i + 1}. ${x.type ? `[${x.type}] ` : ''}${x.question}${x.criteria ? ` (확인: ${x.criteria})` : ''}`); if (x.followUps && x.followUps.length) lines.push(`   - 꼬리질문: ${x.followUps.join(' / ')}`); if (x.goodSigns && x.goodSigns.length) lines.push(`   - 좋은 답: ${x.goodSigns.join(' / ')}`); if (x.watchSigns && x.watchSigns.length) lines.push(`   - 주의: ${x.watchSigns.join(' / ')}`); }); lines.push(''); } };
    add('오프닝', q.opening); add('이력서 맞춤 질문', q.custom); add('필수 질문', q.required); add('선택 질문', q.suggested);
    if (!lines.length) { setStatus('복사할 질문을 하나 이상 골라주세요.', 'err'); return; }
    let ok = false; try { await navigator.clipboard.writeText(lines.join('\n').trim()); ok = true; } catch { /* 권한이 없으면 안내만 */ }
    setStatus(ok ? '선택한 질문을 복사했어요.' : '자동 복사가 막혀 있어요. 브라우저 설정에서 복사를 허용하거나 "노션 카드에 질문 기록"을 쓰세요.', ok ? 'ok' : 'err');
  }
  async function saveSelected(force) {
    const q = selected();
    if (!(q.custom.length + q.required.length + q.suggested.length + q.opening.length)) { setStatus('기록할 질문을 하나 이상 골라주세요.', 'err'); return; }
    const btn2 = resultEl.querySelector('.iq-save'); btn2.disabled = true; setStatus('노션 카드에 기록하는 중...');
    try {
      const res = await fetch('/api/interview/save-to-notion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicantId: applicant.id, ...q, force }) });
      const j = await readJsonOrNull(res);
      if (!j) throw new Error('서버가 응답하지 못했어요.');
      if (res.status === 409 && j.duplicate) { btn2.disabled = false; if (confirm(`${j.error}\n\n그래도 다시 기록할까요?`)) return saveSelected(true); setStatus('기록하지 않았어요.', 'err'); return; }
      if (!res.ok || !j.success) throw new Error(j.error || '기록하지 못했어요.');
      setStatus(`노션 카드 본문에 질문 ${j.count}개를 기록했어요.`, 'ok');
    } catch (err) { setStatus(err.message || '기록하는 중 오류가 발생했어요.', 'err'); }
    finally { btn2.disabled = false; }
  }
  // 체크한 질문 중 답변이나 점수를 적은 것만 노션에 보내요
  async function sendAnswers(force) {
    const q = selected(); const kinds = [['opening', '선택'], ['custom', '맞춤'], ['required', '필수'], ['suggested', '선택']];
    const items = [];
    kinds.forEach(([k, t]) => (q[k] || []).forEach(x => { const st = stateOf(x); if (st.answer.trim() || String(st.reason || '').trim() || st.score) items.push({ no: x.no || '', type: t, question: x.question, criteria: x.criteria || '', answer: st.answer, reason: st.reason || '', score: st.score, base: st.base }); }));
    if (!items.length) { setStatus('체크한 질문에 답변이나 점수를 하나 이상 적어주세요.', 'err'); return; }
    if (items.length > 60) { setStatus('한 번에 60개까지 보낼 수 있어요. 나눠서 보내주세요.', 'err'); return; }
    const btn3 = resultEl.querySelector('.iq-send-ans'); btn3.disabled = true; setStatus('노션에 답변을 보내는 중...');
    try {
      const res = await fetch('/api/interview/save-answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicantId: applicant.id, items, force }) });
      const j = await readJsonOrNull(res);
      if (!j) throw new Error('서버가 응답하지 못했어요.');
      if (res.status === 409 && j.conflict) { btn3.disabled = false; const list = (j.conflicts || []).map(c => `- ${c.no ? c.no + ' ' : ''}${c.question.slice(0, 40)}`).join('\n'); if (confirm(`노션에 이미 다른 답변이 적혀 있어요(그 사이 노션에서 고쳤을 수 있어요):\n${list}\n\n이 화면의 답변으로 덮어쓸까요?`)) return sendAnswers(true); setStatus('전송하지 않았어요. 노션의 답변이 그대로예요.', 'err'); return; }
      if (res.status === 409 && j.duplicate) { btn3.disabled = false; if (confirm(`${j.error}\n\n그래도 다시 기록할까요?`)) return sendAnswers(true); setStatus('전송하지 않았어요.', 'err'); return; }
      if (!res.ok || !j.success) throw new Error(j.error || '노션에 전송하지 못했어요.');
      // 보낸 값을 "노션의 현재 값"으로 기억해서 다음 전송에서 충돌로 오해하지 않게 해요
      items.forEach(it => { const st = answers.get(it.no ? 'no:' + it.no : 'q:' + it.question.replace(/\s+/g, ' ').trim()); if (st) { st.base = joinReason(it.answer, it.reason); st.fromNotion = true; } });
      markDirty(false); renderResult();
      const where = j.target === 'table' ? `노션 「채용 문항」 표에 기록했어요 (수정 ${j.updated} · 추가 ${j.created}${j.skipped ? ` · 변경 없음 ${j.skipped}` : ''})` : `카드 본문의 "면접 답변 기록"에 ${j.count}개를 기록했어요`;
      setStatus(where + '.' + (j.note ? ' ' + j.note : '') + ((j.failed && j.failed.length) ? ` 단, ${j.failed.length}개는 쓰지 못했어요(${j.failed.map(f => f.no || f.question.slice(0, 12)).join(', ')}).` : ''), (j.failed && j.failed.length) ? 'err' : 'ok');
    } catch (err) { setStatus(err.message || '노션에 전송하는 중 오류가 발생했어요.', 'err'); }
    finally { btn3.disabled = false; }
  }
  if (opts.preset) showMode();
  return api;
}
// 일정 카드의 기존 호출 모양을 유지해요
function setupInterviewPanel(card, s) {
  const btn = card.querySelector('.sch-iq-btn'); const host = card.querySelector('.sch-iq-slot');
  if (!btn || !host) return null;
  return mountInterviewPanel(host, { btn, schedule: s });
}

// ---------- 면접 관리 탭 ----------
// 노션 지원자 목록에서 면접자를 고르면 공용 면접 질문 패널(mountInterviewPanel)을 그 지원자로 바로 열어요.
let ivPanel = null;
function interviewDirty() { return !!(ivPanel && ivPanel.isDirty()); }
window.addEventListener('beforeunload', e => { if (interviewDirty()) { e.preventDefault(); e.returnValue = ''; } });
const ivDetail = document.getElementById('ivDetail');
async function openInterviewFor(x) {
  ivDetail.hidden = false;
  document.getElementById('ivDetailTitle').textContent = `${x.name} · ${x.team || '팀 없음'}${x.job ? ' · ' + x.job : ''}`;
  const sumBox = document.getElementById('ivSummaryBox'), sum = document.getElementById('ivSummary'), note = document.getElementById('ivTableNote');
  sumBox.hidden = true; sum.textContent = ''; note.textContent = '';
  ivPanel = mountInterviewPanel(document.getElementById('ivPanelHost'), { preset: x, onClose: () => { ivDetail.hidden = true; ivPanel = null; } });
  ivDetail.scrollIntoView({ block: 'start' });
  try {   // 이력서 평가 요약(근거)과 노션 채용 문항 표 유무를 보여줘요
    const res = await fetch('/api/interview/card?applicantId=' + encodeURIComponent(x.id)); const j = await readJsonOrNull(res);
    if (j && res.ok) {
      if (j.applicant.summary) { sum.textContent = j.applicant.summary; sumBox.hidden = false; }
      note.textContent = j.table.found ? `노션 「채용 문항」 표를 찾았어요(질문 ${j.table.rows.length}개). 답변과 점수는 이 표의 해당 질문 행에 쓰여요.` : (j.table.note || '');
    }
  } catch { /* 요약을 못 불러와도 질문은 만들 수 있어요 */ }
}
document.getElementById('ivDetailClose').addEventListener('click', () => { if (interviewDirty() && !confirm('보내지 않은 답변이 있어요. 닫으면 작성한 답변이 사라져요.\n\n그래도 닫을까요?')) return; ivDetail.hidden = true; ivPanel = null; document.getElementById('ivPanelHost').innerHTML = ''; });

// ---------- 게시·마감 관리 (공고를 올린 곳과 마감일) ----------
const ppBox = document.getElementById('postingPublish'), ppChannels = document.getElementById('ppChannels'), ppStatus = document.getElementById('ppStatus');
let ppId = '', ppDirty = false;
const setPpStatus = (m, c) => { ppStatus.textContent = m || ''; ppStatus.className = 'status' + (c ? ' ' + c : ''); };
const CHANNEL_PRESETS = ['사람인', '잡코리아', '원티드', '링크드인', '자사 홈페이지', '기타'];
function ppRow(c = {}) {
  const div = document.createElement('div'); div.className = 'pp-row';
  div.innerHTML = `
    <input class="pp-name" list="ppPresets" maxlength="20" placeholder="게시한 곳 (예: 사람인)" aria-label="게시한 곳" value="${escapeHtml(c.name || '')}" />
    <input class="pp-url" type="url" maxlength="300" placeholder="공고 주소 (https://…)" aria-label="공고 주소" value="${escapeHtml(c.url || '')}" />
    <input class="pp-date" type="date" aria-label="게시일" value="${escapeHtml(c.postedAt || '')}" />
    <input class="pp-cnt" type="number" min="0" max="99999" step="1" placeholder="지원자 수" aria-label="지원자 수(채널에서 확인한 숫자)" value="${c.applicants ? escapeHtml(String(c.applicants)) : ''}" />
    <button type="button" class="link-btn pp-del" aria-label="이 게시한 곳 삭제">삭제</button>`;
  div.querySelectorAll('input').forEach(i => i.addEventListener('input', () => { ppDirty = true; }));
  div.querySelector('.pp-del').addEventListener('click', () => { div.remove(); ppDirty = true; });
  return div;
}
if (!document.getElementById('ppPresets')) { const dl = document.createElement('datalist'); dl.id = 'ppPresets'; dl.innerHTML = CHANNEL_PRESETS.map(n => `<option value="${n}"></option>`).join(''); document.body.appendChild(dl); }
function ppRender(p) {
  ppChannels.innerHTML = ''; (p.channels || []).forEach(c => ppChannels.appendChild(ppRow(c)));
  document.getElementById('ppTitle').textContent = `게시·마감 관리 · ${p.team} · ${p.position} · ${STATE_LABEL[p.state] || ''}`;
  const closedManually = !!p.closedAt;
  document.getElementById('ppCloseBtn').hidden = closedManually; document.getElementById('ppReopenBtn').hidden = !closedManually;
  ppDirty = false;
}
async function openPublishEditor(id) {
  if (ppDirty && ppId !== id && !confirm('저장하지 않은 게시 정보가 있어요. 다른 공고를 열면 사라져요.\n\n그래도 열까요?')) return;
  try {
    const p = await fetchPosting(id); ppId = id; ppRender(p); ppBox.hidden = false; setPpStatus('');
    ppBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) { setPostStatus(err.message || '공고를 불러오지 못했어요.', 'err'); }
}
function ppCollect() {
  return [...ppChannels.querySelectorAll('.pp-row')].map(r => ({ name: r.querySelector('.pp-name').value, url: r.querySelector('.pp-url').value, postedAt: r.querySelector('.pp-date').value, applicants: r.querySelector('.pp-cnt').value }));
}
async function ppSave(extra, okMsg) {
  if (!ppId) return;
  const body = { channels: ppCollect(), ...extra };
  const btns = ['ppSaveBtn', 'ppCloseBtn', 'ppReopenBtn'].map(i => document.getElementById(i)); btns.forEach(b => { b.disabled = true; });
  try {
    const res = await fetch('/api/postings/' + encodeURIComponent(ppId), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
    if (!res.ok) throw new Error(data.error || '저장하지 못했어요.');
    ppRender(data.posting); setPpStatus(okMsg || '저장했어요.', 'ok');
    await loadPostings();   // 목록의 상태·게시한 곳·마감일을 새로 보여줘요
  } catch (err) { setPpStatus(err.message || '저장 중 오류가 발생했어요.', 'err'); }
  finally { btns.forEach(b => { b.disabled = false; }); }
}
document.getElementById('ppAddBtn').addEventListener('click', () => {
  if (ppChannels.querySelectorAll('.pp-row').length >= 6) { setPpStatus('게시한 곳은 6개까지 입력할 수 있어요.', 'err'); return; }
  const row = ppRow(); ppChannels.appendChild(row); ppDirty = true; row.querySelector('.pp-name').focus();
});
document.getElementById('ppSaveBtn').addEventListener('click', () => ppSave({}, '저장했어요. 게시한 곳이 있으면 목록에 "게시중"으로 보여요.'));
document.getElementById('ppCloseBtn').addEventListener('click', () => {
  if (!confirm('이 공고를 마감 처리할까요?\n마감해도 이력서 평가는 계속 할 수 있어요. 나중에 "마감 취소"로 되돌릴 수 있어요.')) return;
  ppSave({ closedAt: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }) }, '마감 처리했어요.');
});
document.getElementById('ppReopenBtn').addEventListener('click', () => ppSave({ closedAt: '' }, '마감을 취소했어요.'));
document.getElementById('ppClose').addEventListener('click', () => { if (ppDirty && !confirm('저장하지 않은 게시 정보가 있어요. 닫으면 사라져요.\n\n그래도 닫을까요?')) return; ppBox.hidden = true; ppId = ''; ppDirty = false; });
window.addEventListener('beforeunload', e => { if (ppDirty) { e.preventDefault(); e.returnValue = ''; } });

// ---------- 공고 점검 (서버의 규칙 기반 점검 결과를 보여줌 / AI를 쓰지 않아 비용이 들지 않아요) ----------
const postCheckList = document.getElementById('postCheckList');
const postCheckSummary = document.getElementById('postCheckSummary');
let postCheckSeq = 0;       // 오래된 응답이 최신 결과를 덮어쓰지 않게
let postCheckLast = null;   // 마지막 점검 결과 (확정할 때 확인에 씀)
const PC_LABEL = { error: '수정 필요', warn: '확인 필요', info: '참고' };
// 같은 종류(code)의 점검 결과는 한 줄로 묶어서 보여줘요(같은 말이 여러 번 나와 지저분해 보이지 않게). 위치 이동은 그 종류의 첫 번째 표현으로 가요.
function groupFindings(list) {
  const map = new Map();
  for (const f of list) {
    if (!map.has(f.code)) map.set(f.code, { ...f, items: [] });
    if (f.start >= 0) map.get(f.code).items.push(f);
  }
  return [...map.values()];
}
function renderPostCheck(r) {
  postCheckLast = r;
  const c = r.count;
  if (!r.total) { postCheckSummary.textContent = '✓ 걸리는 표현이 없어요'; postCheckSummary.className = 'post-check-summary ok'; postCheckList.innerHTML = ''; return; }
  const groups = groupFindings(r.findings);
  r._groups = groups;
  const parts = [];
  if (c.error) parts.push(`수정 필요 ${groups.filter(g => g.level === 'error').length}`);
  if (c.warn) parts.push(`확인 필요 ${groups.filter(g => g.level === 'warn').length}`);
  if (c.info) parts.push(`참고 ${groups.filter(g => g.level === 'info').length}`);
  postCheckSummary.textContent = (c.error || c.warn ? '⚠ ' : 'ℹ ') + parts.join(' · ');
  postCheckSummary.className = 'post-check-summary ' + (c.error ? 'error' : c.warn ? 'warn' : 'ok');
  postCheckList.innerHTML = groups.map((g, gi) => {
    const shown = g.items.slice(0, 3).map(x => `"${escapeHtml(x.match)}"`).join(', ') + (g.items.length > 3 ? ` 외 ${g.items.length - 3}곳` : '');
    return `<li class="${g.level}"><span class="pc-level">${PC_LABEL[g.level]}</span><strong>${escapeHtml(g.title)}</strong>${g.items.length ? ` — ${shown}` : ''}${g.items.length ? ` <button type="button" class="link-btn pc-go" data-g="${gi}">위치로 이동</button>` : ''}<span class="pc-tip">${escapeHtml(g.tip)}</span>${g.suggest ? `<span class="pc-suggest"><button type="button" class="add-btn pc-add" data-g="${gi}">추천 문구 공고문에 추가</button> <button type="button" class="link-btn pc-copy" data-g="${gi}">복사</button></span>` : ''}</li>`;
  }).join('') + (r.total > r.findings.length ? `<li class="info">그 밖에 ${r.total - r.findings.length}건이 더 있어요.</li>` : '');
}
async function runPostCheck() {
  const seq = ++postCheckSeq;
  const jd = postJd.value;
  if (!jd.trim()) { postCheckLast = null; postCheckSummary.textContent = '공고문을 쓰면 자동으로 점검해요'; postCheckSummary.className = 'post-check-summary'; postCheckList.innerHTML = ''; return null; }
  try {
    const res = await fetch('/api/postings/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jd, applyEnd: postApplyEnd.value || '' }) });
    const data = await readJsonOrNull(res);
    if (seq !== postCheckSeq) return null;           // 그 사이 글이 또 바뀜: 최신 요청이 처리할 거예요
    if (!res.ok || !data || !data.success) throw new Error((data && data.error) || '점검 실패');
    renderPostCheck(data);
    return data;
  } catch (err) {
    if (seq === postCheckSeq) { postCheckLast = null; postCheckSummary.textContent = '점검하지 못했어요: ' + (err.message || ''); postCheckSummary.className = 'post-check-summary warn'; }
    return null;
  }
}
let postCheckTimer = null;
postJd.addEventListener('input', () => { clearTimeout(postCheckTimer); postCheckTimer = setTimeout(runPostCheck, 700); });
postApplyEnd.addEventListener('change', runPostCheck);
document.getElementById('postCheckBtn').addEventListener('click', runPostCheck);
// 추천 문구가 있는 점검 항목(예: 채용서류 반환·보관·파기 안내)의 "공고문에 추가"·"복사"
postCheckList.addEventListener('click', async e => {
  const add = e.target.closest('.pc-add'), cp = e.target.closest('.pc-copy');
  if (!add && !cp) return;
  const g = postCheckLast && postCheckLast._groups && postCheckLast._groups[Number((add || cp).dataset.g)];
  if (!g || !g.suggest) return;
  if (add) {
    const head = g.suggest.split('\n')[0];   // 예: [채용서류 반환·보관 안내]
    if (postJd.value.includes(head)) { setPostStatus('이미 같은 안내가 공고문에 있어요. [입력] 칸을 채워주세요.', 'err'); postJd.focus(); return; }
    postJd.value = postJd.value.replace(/\s+$/, '') + '\n\n' + g.suggest;
    postDirty = true; updatePostTodo(); runPostCheck();
    postJd.focus(); postJd.setSelectionRange(postJd.value.length, postJd.value.length); postJd.scrollTop = postJd.scrollHeight;
    setPostStatus('추천 문구를 공고문 끝에 넣었어요. [입력] 칸(반환 청구 기간·연락처·보관 기간)을 회사 기준으로 채워주세요. 법률 자문은 아니니 노무사 확인을 권해요.', 'ok');
    return;
  }
  try { await navigator.clipboard.writeText(g.suggest); setPostStatus('추천 문구를 복사했어요.', 'ok'); }
  catch { setPostStatus('자동 복사가 막혀 있어요. "공고문에 추가"를 쓰거나 브라우저 설정에서 복사를 허용해주세요.', 'err'); }
});
postCheckList.addEventListener('click', e => {
  const b = e.target.closest('.pc-go'); if (!b || !postCheckLast || !postCheckLast._groups) return;
  const g = postCheckLast._groups[Number(b.dataset.g)]; const f = g && g.items[0]; if (!f) return;
  postJd.focus(); postJd.setSelectionRange(f.start, f.end);
  const before = postJd.value.slice(0, f.start).split('\n').length;   // 해당 줄이 보이게 스크롤
  postJd.scrollTop = Math.max(0, (before - 3) * 20);
});

async function savePosting(status) {
  if (!requireTeamAndPosition()) return;
  const c = collectPosting();
  if (status === 'confirmed') {
    const m = countMarks(c.jd);
    if ((m.input || m.rec) && !confirm(`아직 표시가 남아 있어요: ${marksText(m)}.\n${m.rec ? '[추천]은 AI가 추천한 경력이니, 맞는지 확인하고 고친 뒤 표시를 지워주세요.\n' : ''}그대로 확정할까요?`)) return;
  }
  confirmPostingBtn.disabled = saveDraftBtn.disabled = true;
  try {
    const url = editingPosting ? '/api/postings/' + encodeURIComponent(editingPosting.id) : '/api/postings';
    const res = await fetch(url, {
      method: editingPosting ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...c, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');
    editingPosting = data.posting;
    postDirty = false;
    await loadPostings();
    updatePostingButtons();
    updatePositionHint();
    if (status === 'confirmed') {
      evalPositionSelect.value = editingPosting.id;
      setPostStatus('확정했어요. 이력서 검토 탭의 "평가할 공고"에서 이 공고가 선택돼 있어요.', 'ok');
    } else {
      setPostStatus('임시 저장했어요. 확정하기 전까지는 평가에 쓰이지 않아요.', 'ok');
    }
  } catch (err) {
    setPostStatus(err.message || '저장 중 오류가 발생했어요.', 'err');
  } finally {
    confirmPostingBtn.disabled = saveDraftBtn.disabled = false;
  }
}
confirmPostingBtn.addEventListener('click', async () => {
  clearTimeout(postCheckTimer);
  const r = await runPostCheck();   // 확정 직전의 최신 글로 다시 점검
  // [입력]·[추천] 표시가 남은 것은 아래 savePosting이 따로 확인하므로, 같은 경고를 두 번 묻지 않게 여기서는 뺌
  const dup = new Set(['placeholder', 'aiTag']);
  const need = r ? r.findings.filter(f => f.level !== 'info' && !dup.has(f.code)) : [];
  // 경력 칸이 비었거나 추천값을 아직 확인하지 않았으면 같은 확인창에 함께 알려요(확인창이 연달아 뜨지 않게)
  const careerNote = careerState === 'empty' ? '경력 칸이 비어 있어요(사람인 입력용 정리에서 필요해요).' : (careerState === 'suggested' ? `경력(${postCareer.value.trim()})은 추천값이고 아직 확인하지 않았어요.` : '');
  if (!need.length && careerNote) {
    if (!confirm(`확인할 것이 있어요.\n\n· ${careerNote}\n\n그래도 확정할까요? (확정하면 이력서 평가의 기준이 돼요)\n[취소]를 누르면 확정하지 않아요.`)) return;
  }
  if (need.length) {
    const grouped = groupFindings(need);
    const nErr = grouped.filter(f => f.level === 'error').length, nWarn = grouped.length - nErr;
    const top = grouped.slice(0, 5).map(f => `· ${PC_LABEL[f.level]}: ${f.title}${f.items.length ? ` ("${f.items[0].match}"${f.items.length > 1 ? ` 외 ${f.items.length - 1}곳` : ''})` : ''}`).join('\n');
    if (!confirm(`공고 점검에서 ${nErr ? `수정 필요 ${nErr}건` : ''}${nErr && nWarn ? ', ' : ''}${nWarn ? `확인 필요 ${nWarn}건` : ''}이 나왔어요.\n\n${top}\n\n${careerNote ? `\n· 또 ${careerNote}` : ''}\n\n그래도 확정할까요? (확정하면 이력서 평가의 기준이 돼요. 판단은 담당자가 해요)`)) return;
  }
  savePosting('confirmed');
});
saveDraftBtn.addEventListener('click', () => savePosting('draft'));

postingBody.addEventListener('click', async e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const id = btn.dataset.id;
  const item = postingsAll.find(p => p.id === id);
  if (!item) return;
  try {
    if (btn.dataset.act === 'view') {
      const p = await fetchPosting(id);
      postingDetailTitle.textContent = `${fmtDate(p.createdAt)} 생성 · ${p.team} · ${p.position} · ${STATE_LABEL[p.state] || (p.status === 'confirmed' ? '확정' : '작성 중')} · ${conditionText(p)}`;
      postingDetailJd.textContent = p.jd || '(공고문이 비어 있어요)';
      postingDetail.hidden = false;
      postingDetail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else if (btn.dataset.act === 'publish') {
      openPublishEditor(id);
    } else if (btn.dataset.act === 'confirmnow') {
      btn.disabled = true;
      try {
        let c = { error: 0, warn: 0 };
        try { const pr = await fetchPosting(id); const ck = await fetch('/api/postings/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jd: pr.jd, applyEnd: pr.applyEnd, career: pr.career, education: pr.education }) }); const cj = await readJsonOrNull(ck); if (cj && cj.count) c = cj.count; } catch { /* 점검을 못 해도 확정은 할 수 있어요 */ }
        const ok = await confirmPostingNow(id, c.error || 0, c.warn || 0);
        if (ok) setPostStatus(`"${item.position}" 공고를 확정했어요. 이제 이력서 평가의 "평가할 공고"에 나와요.`, 'ok');
      } finally { btn.disabled = false; }
    } else if (btn.dataset.act === 'use') {
      showTab('resume');                       // 평가는 이력서 검토 탭에서 해요
      evalPositionSelect.value = id;
      resumeStatus.textContent = `"${item.team} - ${item.position}" 공고로 평가할 거예요.`;
      resumeStatus.className = 'status ok';
      evalPositionSelect.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (btn.dataset.act === 'edit') {
      if (!confirmDiscard()) return;
      const p = await fetchPosting(id);
      editingPosting = p;
      fillEditor(p);
      setPostStatus('');
      postTeam.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (btn.dataset.act === 'del') {
      if (!confirm(`"${item.team} - ${item.position}" 공고를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) return;
      const res = await fetch('/api/postings/' + encodeURIComponent(id), { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');
      if (editingPosting && editingPosting.id === id) resetEditor();
      postingDetail.hidden = true;
      await loadPostings();
    }
  } catch (err) { setPostStatus(err.message || '처리 중 오류가 발생했어요.', 'err'); }
});
document.getElementById('closePostingDetailBtn').addEventListener('click', () => { postingDetail.hidden = true; });

// ----- 평가 결과 표시 / 점수 수정 시 총점 재계산 -----
function recomputeTotal() {
  if (!lastScreening) return;
  let total = 0;
  let changed = 0;
  scoreBody.querySelectorAll('.score-input').forEach(inp => {
    const max = Number(inp.max);
    let v = parseInt(inp.value, 10);
    if (!Number.isFinite(v)) v = 0;
    v = Math.max(0, Math.min(max, v));
    total += v;
    const differs = v !== Number(inp.dataset.ai);
    inp.classList.toggle('score-changed', differs);
    if (differs) changed++;
  });
  resumeTotal.textContent = total;
  updateBenchmarkCompare();
  resumeAiTotal.textContent = total !== lastScreening.total
    ? `(AI 평가 ${lastScreening.total}점 → ${changed}곳 직접 수정)`
    : '';
}

function listHtml(arr) {
  return (arr || []).map(x => `<li>${escapeHtml(x)}</li>`).join('') || '<li>-</li>';
}

// 영역별 확신도: 낮으면 "확인 필요"로 표시
function confTag(c) {
  if (!c) return '';
  const cls = c === '높음' ? 'conf-hi' : c === '낮음' ? 'conf-lo' : '';
  return ` <span class="conf-tag ${cls}">확신 ${escapeHtml(c)}${c === '낮음' ? ' · 확인 필요' : ''}</span>`;
}
const usePeersEl = document.getElementById('usePeers');
// ---------- 이력서에 적힌 인적사항 보기 (점수·추천에는 쓰지 않아요) ----------
// mode 'chips': 점수 표 줄에서 한눈에 보이게 라벨 달린 칩 / 'full': 점수표(상세)·결과 화면에서 전체
function personalHtml(r, mode) {
  const p = r && r.personal;
  const NOTE = '<span class="personal-note">이력서에 적힌 정보예요. 점수·추천에는 쓰지 않아요.</span>';
  if (!p) return `<div class="personal-chips"><span class="personal-none">인적사항: 가져온 결과에 없어요</span></div>`;
  const v = x => (x && String(x).trim()) ? escapeHtml(x) : '<span class="personal-empty">-</span>';
  const school = v(p.school);   // 학교 이름만 (학교 이름이 이력서에 없으면 "-"로 보여요. 전공을 학교 칸에 넣지 않아요)
  const major = v(p.major) + (p.degree ? ` <span class="personal-sub">${escapeHtml(p.degree)}</span>` : '');
  const salary = [p.desiredSalary ? `희망 ${escapeHtml(p.desiredSalary)}` : '', p.currentSalary ? `현재 ${escapeHtml(p.currentSalary)}` : ''].filter(Boolean).join(' · ') || '<span class="personal-empty">-</span>';
  const career = p.totalCareer ? escapeHtml(p.totalCareer) + (p.totalCareerSource === '기간 합산' ? ' <span class="personal-sub">(기간 합산)</span>' : '') : '<span class="personal-empty">-</span>';
  const chip = (k, val) => `<span class="personal-chip"><em>${k}</em>${val}</span>`;
  if (mode === 'chips') return `<div class="personal-chips">${chip('성별', v(p.gender))}${chip('나이', v(p.ageLabel))}${chip('학교', school)}${chip('전공', major)}${chip('총경력', career)}${chip('연봉', salary)}</div>`;
  const row = (k, val) => `<tr><th>${k}</th><td>${val}</td></tr>`;
  return `<div class="personal-full"><strong>이력서에 적힌 인적사항</strong> ${NOTE}<table class="personal-table"><tbody>${row('성별', v(p.gender))}${row('나이', v(p.ageLabel))}${row('학교', school)}${row('전공', v(p.major))}${row('학력 상태', v(p.degree))}${row('총경력', career)}${row('연봉', salary)}${row('이메일', v(p.email))}${row('주소', v(p.address))}</tbody></table></div>`;
}
// 영역별 평가 근거 글: 비어 있을 때 AI가 직접 평가한 결과는 "-", 가져온 결과(파일)는 "가져온 결과에는 근거가 없어요"(이력서에 근거가 없다는 뜻이 아니에요)
const commentText = (r, key) => { const c = (r.comments || {})[key]; if (c) return escapeHtml(c); return r.source === 'import' ? '<span class="manage-hint" style="margin:0">가져온 결과에는 근거가 없어요</span>' : '-'; };
// 전공 관련성 + 이전 서류 합격자와의 비교 (결과 화면·일괄 점수 상세에서 같이 씀)
function peerLinesHtml(r) {
  const out = [];
  const mf = r.majorFit || {};
  if (mf.relation && mf.relation !== '확인불가') out.push(`<li><strong>전공 관련성</strong> — ${escapeHtml(mf.relation)}${mf.note ? ' · ' + escapeHtml(mf.note) : ''}</li>`);
  else out.push(mf.imported ? '<li><strong>전공 관련성</strong> — 가져온 결과에는 이 정보가 없어요. 이력서에서 직접 확인하세요.</li>' : '<li><strong>전공 관련성</strong> — 이력서에서 확인되지 않았어요.</li>');
  const pi = r.peerInfo || { status: 'off' };
  const pn = r.peerNotes || {};
  if (pi.status === 'used') {
    out.push(`<li><strong>이전 서류 합격자와 비교</strong> — 유사도 ${escapeHtml(pn.similarity || '참고 불가')} <span class="manage-hint">(노션 ${escapeHtml((pi.teams || []).join(', '))} 합격 기록 ${pi.count}명 중 ${pi.shown}명을 참고${pi.count < 5 ? ' · 인원이 적어 참고로만 봐요' : ''})</span></li>`);
    if (pn.similar) out.push(`<li>비슷한 점: ${escapeHtml(pn.similar)}</li>`);
    if (pn.different) out.push(`<li>다른 점: ${escapeHtml(pn.different)}</li>`);
    if (pn.scoreNote) out.push(`<li>점수 반영: ${escapeHtml(pn.scoreNote)}</li>`);
    if ((pi.majors || []).length) out.push(`<li>합격자 전공 분포: ${pi.majors.map(m => escapeHtml(m[0]) + ' ' + m[1] + '명').join(', ')}</li>`);
  } else {
    const why = { off: '합격자 참고를 끈 평가예요.', none: '노션에 같은 팀의 참고할 합격 기록이 없어요.', unavailable: '노션에서 합격 기록을 읽지 못해 참고하지 않았어요.' }[pi.status] || '';
    out.push(`<li><strong>이전 서류 합격자와 비교</strong> — 참고하지 않았어요. <span class="manage-hint">${why}</span></li>`);
  }
  return out.join('');
}
const CHECK_CLASS = { '확인됨': 'req-ok', '확인 필요': 'req-part', '확인 불가': 'req-unk' };   // 서류 체크리스트 상태 색(필수 요건 체크와 같은 색)
const REQ_CLASS = { '충족': 'req-ok', '부분 충족': 'req-part', '미충족': 'req-no', '확인불가': 'req-unk' };
function renderScreening(r) {
  lastScreening = r;
  resultPosition.textContent = '평가 포지션: ' + r.position.name + (r.profileLabel ? ` (${r.profileLabel} 평가표)` : '');
  scoreBody.innerHTML = r.rubric.map(item => `
    <tr>
      <td data-label="평가 영역"><strong>${escapeHtml(item.area)}</strong><div class="score-item">${escapeHtml(item.item)}</div></td>
      <td data-label="배점">${item.max}점</td>
      <td data-label="점수 (수정 가능)">
        <input type="number" class="score-input" min="0" max="${item.max}" step="1"
               value="${r.scores[item.key]}" data-ai="${r.scores[item.key]}" aria-label="${escapeHtml(item.area)} 점수" />
      </td>
      <td data-label="AI 평가 근거">${commentText(r, item.key)}${confTag((r.confidence || {})[item.key])}</td>
    </tr>`).join('');
  scoreBody.querySelectorAll('.score-input').forEach(inp => {
    inp.addEventListener('input', recomputeTotal);
    inp.addEventListener('change', () => {          // 입력을 마치면 범위를 벗어난 값/빈칸을 정리
      const max = Number(inp.max);
      let v = parseInt(inp.value, 10);
      if (!Number.isFinite(v)) v = 0;
      inp.value = Math.max(0, Math.min(max, v));
      recomputeTotal();
    });
  });
  document.getElementById('resumePersonal').innerHTML = personalHtml(r, 'full');   // 이력서에 적힌 인적사항(점수·추천에는 쓰지 않아요)
  resumeSummary.textContent = r.summary || '-';
  document.getElementById('peerList').innerHTML = peerLinesHtml(r);
  resumeRecommendation.textContent = r.recommendation;
  document.getElementById('resumeRecNote').textContent = r.recommendationNote || '';
  document.getElementById('resumeInterviewChecks').innerHTML = (r.interviewChecks || []).map(q => `<li><strong>${escapeHtml(q.label)}</strong> — ${q.value ? escapeHtml(q.value) + ' <span class="manage-hint">(' + escapeHtml(q.note) + ')</span>' : escapeHtml(q.note)}</li>`).join('');
  const reqs = r.requirements || [];
  document.getElementById('requirementsBox').hidden = !reqs.length;
  document.getElementById('resumeRequirements').innerHTML = reqs.map(q => `<li><span class="req-tag ${q.kind === '우대' && q.status === '미충족' ? 'req-unk' : (REQ_CLASS[q.status] || 'req-unk')}">${escapeHtml(q.status)}</span>${q.kind ? `<span class="req-kind kind-${q.kind === '우대' ? 'pref' : 'must'}" title="${escapeHtml(q.id || '')}">${escapeHtml(q.kind)}${q.id ? ' ' + escapeHtml(q.id) : ''}</span>` : ''}<strong>${escapeHtml(q.item)}</strong>${q.evidence ? ' — ' + escapeHtml(q.evidence) : ''}</li>`).join('');
  const ck = r.checklist || [];
  document.getElementById('checklistBox').hidden = !ck.length;
  document.getElementById('resumeChecklist').innerHTML = ck.map(q => `<li><span class="req-tag ${CHECK_CLASS[q.status] || 'req-unk'}">${escapeHtml(q.status)}</span><strong>${escapeHtml(q.item)}</strong>${q.note ? ' — ' + escapeHtml(q.note) : ''}</li>`).join('');
  resumeStrengths.innerHTML = listHtml(r.strengths);
  resumeConcerns.innerHTML = listHtml(r.concerns);
  missingDocsBox.hidden = !(r.missingDocs && r.missingDocs.length);
  resumeMissingDocs.innerHTML = listHtml(r.missingDocs);
  const ev = r.valuesEvidence || [];
  valuesBox.hidden = !ev.length;
  resumeValues.innerHTML = ev.map(v => `<li><strong>${escapeHtml(v.item)}</strong> — ${escapeHtml(v.evidence)}</li>`).join('');
  recomputeTotal();
  resumeResult.hidden = false;
  onScreeningRendered(r);
}

// ---------- PDF 이력서 올리기 ----------
const PDF_MAX_BYTES = 4 * 1024 * 1024;
const pdfBox = document.getElementById('pdfBox');
const textBox = document.getElementById('textBox');
const resumeFile = document.getElementById('resumeFile');
const pdfDrop = document.getElementById('pdfDrop');
const pdfInfo = document.getElementById('pdfInfo');
const pdfInfoName = document.getElementById('pdfInfoName');
const pdfInfoSize = document.getElementById('pdfInfoSize');
const pdfClearBtn = document.getElementById('pdfClearBtn');
let currentPdf = null;  // 지금 고른 PDF 파일
let analyzedPdf = null; // 실제로 평가한 PDF 파일 — 노션에 붙이는 건 반드시 이 파일 (평가 뒤에 다른 파일을 골라도 엉뚱한 파일이 붙지 않게)

function resumeMode() { return document.querySelector('input[name="resumeMode"]:checked').value; }
function fmtMB(bytes) { return (bytes / 1024 / 1024).toFixed(1) + 'MB'; }
function clearPdf() {
  currentPdf = null;
  pdfInfo.hidden = true;
  resumeFile.value = '';
}
function setPdf(file) {
  resumeStatus.textContent = '';
  if (!file) { clearPdf(); return; }
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  const fail = msg => { clearPdf(); resumeStatus.textContent = msg; resumeStatus.className = 'status err'; };
  if (!isPdf) return fail('PDF 파일만 올릴 수 있어요. 다른 형식이면 PDF로 저장해서 올려주세요.');
  if (file.size === 0) return fail('빈 파일이에요. 다른 파일을 골라주세요.');
  if (file.size > PDF_MAX_BYTES) return fail(`파일이 너무 커요 (${fmtMB(file.size)}). 4MB 이하로 줄여서 올려주세요. (PDF 압축이나 "인쇄 → PDF로 저장"으로 줄일 수 있어요)`);
  currentPdf = file;
  pdfInfoName.textContent = file.name;
  pdfInfoSize.textContent = fmtMB(file.size);
  pdfInfo.hidden = false;
}
document.querySelectorAll('input[name="resumeMode"]').forEach(r => r.addEventListener('change', () => {
  const mode = resumeMode();
  pdfBox.hidden = mode !== 'pdf';
  textBox.hidden = mode !== 'text';
  document.getElementById('notionPickBox').hidden = mode !== 'notion';
  document.getElementById('manualBox').hidden = mode !== 'manual';
  document.getElementById('pasteBox').hidden = mode !== 'paste';
  usePeersEl.closest('label').hidden = mode === 'manual';        // 직접 채점은 AI를 쓰지 않아서 합격자 참고 설정이 필요 없어요
  screenResumeBtn.hidden = mode === 'manual' || mode === 'paste'; // AI를 부르는 "평가하기" 버튼은 AI 없는 방법에서는 숨김
  if (mode === 'manual') renderManualRows();
  resumeStatus.textContent = '';
}));
resumeFile.addEventListener('change', () => { if (resumeFile.files[0]) setPdf(resumeFile.files[0]); });
pdfClearBtn.addEventListener('click', clearPdf);
['dragenter', 'dragover'].forEach(ev => pdfDrop.addEventListener(ev, e => { e.preventDefault(); pdfDrop.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(ev => pdfDrop.addEventListener(ev, e => { e.preventDefault(); pdfDrop.classList.remove('dragover'); }));
pdfDrop.addEventListener('drop', e => { if (e.dataTransfer.files[0]) setPdf(e.dataTransfer.files[0]); });

async function readJsonOrNull(res) {
  try { return await res.json(); } catch { return null; }
}

// ---------- API 없이 평가하기 ----------
// 직접 채점: 평가표를 보며 사람이 점수를 넣으면 서버가 AI 평가와 같은 모양의 결과를 계산해요. 붙여넣기: Claude 채팅으로 평가하고 답을 붙여넣어요.
const manualRows = document.getElementById('manualRows');
function evalPosting() { return postingsAll.find(p => p.id === evalPositionSelect.value) || null; }
function manualRubric() {
  const p = evalPosting(); if (!p) return [];
  const rs = criteriaState.rubrics || {};
  return rs[['junior', 'fashion'].includes(p.profile) ? p.profile : 'experienced'] || [];
}
// 평가 기준 글 "S(30): … / A(24): …"에서 S·A·B·C 점수를 읽어 빠른 입력 버튼을 만듦 (평가표가 바뀌어도 자동으로 맞아요)
function gradePoints(criteria) {
  const out = []; const seen = new Set(); const re = /([SABC])\((\d+)(?:\s*이하)?\)/g; let m;   // "C(12 이하)"처럼 이하가 붙은 기준도 읽어요
  while ((m = re.exec(String(criteria || '')))) { if (seen.has(m[1])) continue; seen.add(m[1]); out.push({ g: m[1], v: Number(m[2]) }); }   // 설명 문장 속의 "A(8)" 같은 같은 등급은 처음 것만
  return out;
}
function renderManualRows() {
  const p = evalPosting(); const rubric = manualRubric();
  if (!p) { manualRows.innerHTML = '<p class="manage-hint">먼저 위에서 평가할 공고를 골라주세요. 공고의 평가표대로 점수 칸이 나와요.</p>'; return; }
  manualRows.innerHTML = rubric.map(r => `
    <div class="manual-row" data-key="${escapeHtml(r.key)}" data-max="${r.max}">
      <div class="mr-head"><strong>${escapeHtml(r.area)}</strong><span class="mr-max">${escapeHtml(r.item)} · 배점 ${r.max}점</span></div>
      <div class="mr-inputs">
        <input type="number" class="mr-score" min="0" max="${r.max}" step="1" inputmode="numeric" aria-label="${escapeHtml(r.area)} 점수 (0~${r.max})" placeholder="0~${r.max}" />
        <span class="mr-quick">${gradePoints(r.criteria).map(x => `<button type="button" class="link-btn" data-v="${x.v}">${x.g} ${x.v}</button>`).join('')}</span>
        <input type="text" class="mr-comment" maxlength="400" placeholder="점수를 준 근거 한 줄 (선택)" aria-label="${escapeHtml(r.area)} 근거" />
      </div>
      <details class="help"><summary>평가 기준 보기</summary><p class="manage-hint">${escapeHtml(r.criteria)}</p></details>
    </div>`).join('') + `<p class="manage-hint" id="manualTotal"></p>`;
  updateManualTotal();
}
function updateManualTotal() {
  const el = document.getElementById('manualTotal'); if (!el) return;
  const rows = [...manualRows.querySelectorAll('.manual-row')]; const filled = rows.filter(r => r.querySelector('.mr-score').value !== '');
  const sum = filled.reduce((s, r) => s + (Number(r.querySelector('.mr-score').value) || 0), 0);
  el.textContent = filled.length ? `입력한 점수 합계 ${sum}점 (${filled.length}/${rows.length}개 영역) — 정확한 총점과 검토 우선순위는 "점수 계산하기"에서 계산해요.` : '';
}
manualRows.addEventListener('input', updateManualTotal);
manualRows.addEventListener('click', e => {
  const b = e.target.closest('.mr-quick button'); if (!b) return;
  b.closest('.manual-row').querySelector('.mr-score').value = b.dataset.v; updateManualTotal();
});
evalPositionSelect.addEventListener('change', () => {
  if (resumeMode() === 'manual') renderManualRows();
  // 공고를 고르면 그 공고로 저장된 점수 결과를 불러오고, 점수 표는 그 공고 사람만 보여요(다른 공고는 "공고별 보기" 칩으로 볼 수 있어요)
  if (evalPositionSelect.value) batchLoadSaved(evalPositionSelect.value, { focus: true, notify: true, prune: true }); else { batchPostingFilter = ''; batchRender(); }
});
document.getElementById('manualScoreBtn').addEventListener('click', async () => {
  if (!evalPositionSelect.value) { resumeStatus.textContent = '평가할 공고를 먼저 선택해주세요.'; resumeStatus.className = 'status err'; return; }
  const scores = {}, comments = {};
  for (const row of manualRows.querySelectorAll('.manual-row')) {
    const v = row.querySelector('.mr-score').value; const name = row.querySelector('.mr-head strong').textContent;
    if (v === '') { resumeStatus.textContent = `"${name}" 점수를 입력해주세요 (0~${row.dataset.max}점).`; resumeStatus.className = 'status err'; row.querySelector('.mr-score').focus(); return; }
    scores[row.dataset.key] = v; comments[row.dataset.key] = row.querySelector('.mr-comment').value;
  }
  const btn = document.getElementById('manualScoreBtn'); btn.disabled = true; resumeStatus.textContent = ''; resumeStatus.className = 'status'; resumeResult.hidden = true;
  try {
    const res = await fetch('/api/screen-resume/manual', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      positionId: evalPositionSelect.value, scores, comments, summary: document.getElementById('manualSummary').value,
      candidate: { name: document.getElementById('noapiName').value, phone: document.getElementById('noapiPhone').value, education: document.getElementById('noapiEdu').value, career: document.getElementById('noapiCareer').value },
    }) });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
    if (!res.ok || !data.success) throw new Error(data.error || '계산하지 못했어요.');
    analyzedPdf = null; notionReviewResult = null;     // 이전 평가의 PDF·노션 결과가 이번 결과에 붙지 않게
    renderScreening(data.result);
  } catch (err) { resumeStatus.textContent = err.message || '계산 중 오류가 발생했어요.'; resumeStatus.className = 'status err'; }
  finally { btn.disabled = false; }
});
const pastePromptStatus = document.getElementById('pastePromptStatus');
const pasteShown = document.getElementById('pasteShown');   // 자동 복사가 막힌 환경에서 요청문을 보여주는 읽기 전용 글칸
function setPasteStatus(msg, cls) { pastePromptStatus.textContent = msg || ''; pastePromptStatus.className = 'status' + (cls ? ' ' + cls : ''); }
document.getElementById('pastePromptBtn').addEventListener('click', async () => {
  if (!evalPositionSelect.value) { setPasteStatus('평가할 공고를 먼저 선택해주세요.', 'err'); return; }
  if (criteriaHasUnsaved() && !confirm('사명·인재상을 고치는 중이에요.\n저장하지 않은 수정은 요청문에 들어가지 않아요. 저장된 내용으로 만들까요?\n\n[취소]를 누르고 먼저 "저장"하셔도 돼요.')) return;
  const btn = document.getElementById('pastePromptBtn'); btn.disabled = true; setPasteStatus('');
  try {
    const res = await fetch('/api/screen-resume/prompt', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ positionId: evalPositionSelect.value, resumeText: document.getElementById('pasteResumeText').value, usePeers: usePeersEl.checked }) });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
    if (!res.ok || !data.success) throw new Error(data.error || '요청문을 만들지 못했어요.');
    let copied = false;
    try { await navigator.clipboard.writeText(data.prompt); copied = true; } catch { /* 복사 권한이 없으면 아래 글칸에 보여줘요 */ }
    pasteShown.value = data.prompt; pasteShown.hidden = copied;
    setPasteStatus(copied ? `요청문을 복사했어요 (${data.length.toLocaleString()}자). 이제 Claude 채팅에 붙여넣고 보내세요. ${document.getElementById('pasteResumeText').value.trim() ? '' : '이력서 PDF는 그 채팅에 첨부하세요.'}` : '자동 복사가 막혀 있어요. 아래 글칸의 내용을 전체 선택해서 직접 복사하세요.', 'ok');
    if (!copied) { pasteShown.focus(); pasteShown.select(); }
  } catch (err) { setPasteStatus(err.message || '요청문을 만드는 중 오류가 발생했어요.', 'err'); }
  finally { btn.disabled = false; }
});
document.getElementById('pasteImportBtn').addEventListener('click', async () => {
  if (!evalPositionSelect.value) { resumeStatus.textContent = '평가할 공고를 먼저 선택해주세요.'; resumeStatus.className = 'status err'; return; }
  const answer = document.getElementById('pasteAnswer').value;
  if (!answer.trim()) { resumeStatus.textContent = 'Claude의 답변을 먼저 붙여넣어주세요.'; resumeStatus.className = 'status err'; return; }
  const btn = document.getElementById('pasteImportBtn'); btn.disabled = true; resumeStatus.textContent = ''; resumeStatus.className = 'status'; resumeResult.hidden = true;
  try {
    const res = await fetch('/api/screen-resume/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ positionId: evalPositionSelect.value, answer }) });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
    if (!res.ok || !data.success) throw new Error(data.error || '가져오지 못했어요.');
    analyzedPdf = null; notionReviewResult = null;
    renderScreening(data.result);
  } catch (err) { resumeStatus.textContent = err.message || '가져오는 중 오류가 발생했어요.'; resumeStatus.className = 'status err'; }
  finally { btn.disabled = false; }
});

screenResumeBtn.addEventListener('click', async () => {
  const mode = resumeMode();
  const usePdf = mode === 'pdf';
  const useNotion = mode === 'notion';
  const resumeText = resumeTextInput.value.trim();
  if (usePdf && !currentPdf) {
    resumeStatus.textContent = '평가할 이력서 PDF를 먼저 올려주세요.';
    resumeStatus.className = 'status err';
    return;
  }
  if (useNotion && !reviewTarget) {
    resumeStatus.textContent = '평가할 노션 지원자를 먼저 골라주세요.';
    resumeStatus.className = 'status err';
    return;
  }
  if (mode === 'text' && !resumeText) {
    resumeStatus.textContent = '이력서 내용을 입력해주세요.';
    resumeStatus.className = 'status err';
    return;
  }
  if (!evalPositionSelect.value) {
    resumeStatus.textContent = '평가할 공고를 먼저 선택해주세요. (확정된 공고가 없으면 "공고 만들기" 탭에서 공고를 만들고 확정하세요)';
    resumeStatus.className = 'status err';
    return;
  }
  if (criteriaHasUnsaved() && !confirm('사명·인재상을 고치는 중이에요.\n저장하지 않은 수정은 평가에 쓰이지 않아요. 저장된 내용으로 평가할까요?\n\n[취소]를 누르고 먼저 "저장"하셔도 돼요.')) return;

  screenResumeBtn.disabled = true;
  screenResumeBtn.textContent = '평가 중... (최대 1분)';
  resumeStatus.textContent = '';
  resumeStatus.className = 'status';
  resumeResult.hidden = true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  try {
    let res;
    if (usePdf) {
      res = await fetch('/api/resume/analyze?positionId=' + encodeURIComponent(evalPositionSelect.value) + (usePeersEl.checked ? '&peers=1' : ''), {
        method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: currentPdf, signal: controller.signal,
      });
    } else if (useNotion) {
      res = await fetch('/api/notion/evaluate-applicant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ pageId: reviewTarget.id, positionId: evalPositionSelect.value, fileKey: chosenFileKey || undefined, usePeers: usePeersEl.checked }),
      });
    } else {
      res = await fetch('/api/screen-resume', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, positionId: evalPositionSelect.value, usePeers: usePeersEl.checked }), signal: controller.signal,
      });
    }
    const data = await readJsonOrNull(res);
    if (!data) throw new Error(res.status === 413 ? '파일이 너무 커서 서버가 받지 못했어요. 4MB 이하로 줄여주세요.' : '서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
    if (useNotion && res.status === 409 && data.code === 'choose_file') {
      showFileChoice(data.files);
      resumeStatus.textContent = data.error;
      resumeStatus.className = 'status';
      return;
    }
    if (!res.ok || !data.success) throw new Error(data.error || '평가 실패');
    analyzedPdf = usePdf ? currentPdf : null;
    notionReviewResult = useNotion ? data : null;
    renderScreening(data.result);
  } catch (err) {
    resumeStatus.textContent = err.name === 'AbortError'
      ? 'AI 평가가 너무 오래 걸려 중단했습니다. 다시 시도해주세요.'
      : (err.message || '평가 중 오류가 발생했습니다.');
    resumeStatus.className = 'status err';
  } finally {
    clearTimeout(timeoutId);
    screenResumeBtn.disabled = false;
    screenResumeBtn.textContent = '평가하기';
  }
});


async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

copyPostingBtn.addEventListener('click', async () => {
  if (!postJd.value.trim()) { setPostStatus('복사할 공고문이 아직 없어요.', 'err'); return; }
  const ok = await copyToClipboard(postJd.value);
  const m = countMarks(postJd.value);
  setPostStatus(ok
    ? ((m.input || m.rec) ? `복사했어요. 다만 표시가 남아 있어요: ${marksText(m)}. 붙여넣기 전에 지워주세요.` : '복사했어요. 사람인·잡코리아에 붙여넣으세요.')
    : '복사하지 못했어요. 글을 직접 선택해서 복사해주세요.', ok ? 'ok' : 'err');
});

// ---------- 노션 연동 ----------
let notionStatus = null; // /api/notion/status 결과
async function ensureNotionStatus(force = false) {
  if (notionStatus && notionStatus.configured && !force) return notionStatus;
  try {
    const res = await fetch('/api/notion/status' + (force ? '?refresh=1' : ''));
    notionStatus = await res.json();
  } catch {
    notionStatus = { configured: false, reason: 'error', message: '노션 연결 상태를 확인하지 못했어요.' };
  }
  return notionStatus;
}

function safeNotionUrl(u) {
  return /^https:\/\/([a-z0-9-]+\.)*notion\.(so|com|site)\//i.test(String(u || '')) ? u : '';
}

// --- 평가 결과 → 노션 등록 ---
const notionRegisterNotice = document.getElementById('notionRegisterNotice');
const notionRegisterForm = document.getElementById('notionRegisterForm');
const notionNameEl = document.getElementById('notionName');
const notionPhoneEl = document.getElementById('notionPhone');
const notionTeamEl = document.getElementById('notionTeam');
const notionStatusSel = document.getElementById('notionStatusSel');
const notionAppliedAtEl = document.getElementById('notionAppliedAt');
const notionRecEl = document.getElementById('notionRec');
const notionChannelsEl = document.getElementById('notionChannels');
const notionRegisterBtn = document.getElementById('notionRegisterBtn');
const notionRegisterStatus = document.getElementById('notionRegisterStatus');
const notionExtractNote = document.getElementById('notionExtractNote');
const notionAttachStatus = document.getElementById('notionAttachStatus');
const notionRetryAttachBtn = document.getElementById('notionRetryAttachBtn');
const afterRegister = document.getElementById('afterRegister');
const fillSendBtn = document.getElementById('fillSendBtn');
const fillScheduleBtn = document.getElementById('fillScheduleBtn');
let registeredApplicant = null; // 방금 노션에 등록한 지원자 (문자/일정 폼 채우기에 씀)
const valuesBox = document.getElementById('valuesBox');
const resumeValues = document.getElementById('resumeValues');

// 탈락(REJECT)은 사람이 직접 고르는 값이에요. AI 점수로는 자동으로 선택하지 않아요.
const NOTION_REC_MAP = { '적극 추천': 'PASS', '추천': 'PASS', '보류': 'BORDERLINE' };

function todayStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function optionsHtml(list, blankLabel) {
  const blank = blankLabel ? `<option value="">${escapeHtml(blankLabel)}</option>` : '';
  return blank + list.map(x => `<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
}
function jobFromPosition(name, brand) {
  const i = name.indexOf(' - ');
  const job = i >= 0 ? name.slice(i + 3).trim() : name;
  // 이름 끝의 " [브랜드]"는 서버가 공고 이름에 붙인 표시라서 노션 지원직무 칸에서는 뗌. 추측하지 않고 "이 공고의 브랜드와 정확히 같을 때만" 떼요.
  // (옛 공고처럼 포지션 이름 자체에 "[비바라비다]"가 들어 있는 경우는 이름의 일부이니 그대로 둬요)
  if (brand) { const tail = ` [${brand}]`; if (job.endsWith(tail)) return job.slice(0, -tail.length).trim() || job; }
  return job;
}

async function prepareNotionRegister(r) {
  // 이전 평가에서 입력하던 이름/연락처가 다음 지원자에게 섞이지 않도록 항상 비움
  notionNameEl.value = '';
  notionPhoneEl.value = '';
  notionRegisterStatus.textContent = '';
  notionRegisterStatus.className = 'status';
  notionAttachStatus.textContent = '';
  notionAttachStatus.className = 'status';
  notionRetryAttachBtn.hidden = true;
  afterRegister.hidden = true;
  notionExtractNote.hidden = true;
  registeredApplicant = null;
  notionRegisterBtn.disabled = false;
  const st = await ensureNotionStatus(!(notionStatus && notionStatus.configured));
  if (!st.configured) {
    notionRegisterNotice.hidden = false;
    notionRegisterNotice.textContent = '노션 연동이 아직 켜져 있지 않아요 — ' + (st.message || '');
    notionRegisterForm.hidden = true;
    return;
  }
  if (st.problems && st.problems.length) {
    notionRegisterNotice.hidden = false;
    notionRegisterNotice.textContent = '노션 DB 구조가 달라서 등록할 수 없어요: ' + st.problems.join(' / ');
    notionRegisterForm.hidden = true;
    return;
  }
  notionRegisterNotice.hidden = true;
  notionRegisterForm.hidden = false;
  const o = st.options;
  notionTeamEl.innerHTML = optionsHtml(o.teams, '(선택 안 함)');
  notionStatusSel.innerHTML = optionsHtml(o.statuses);
  notionRecEl.innerHTML = optionsHtml(o.recommendations, '(선택 안 함)');
  notionChannelsEl.innerHTML = o.channels.map(c =>
    `<label class="check-chip"><input type="checkbox" value="${escapeHtml(c)}" /> ${escapeHtml(c)}</label>`).join('');
  const pos = postingsAll.find(x => x.id === r.position.id);
  const notionTeam = pos && (o.teams.includes(pos.team) ? pos.team : (teamAliases[pos.team] && o.teams.includes(teamAliases[pos.team]) ? teamAliases[pos.team] : ''));
  if (notionTeam) notionTeamEl.value = notionTeam;
  notionStatusSel.value = o.statuses.includes('서류합격') ? '서류합격' : o.statuses[0];
  const rec = NOTION_REC_MAP[r.recommendation];
  if (rec && o.recommendations.includes(rec)) notionRecEl.value = rec;
  notionAppliedAtEl.value = todayStr();
  // 이력서에서 읽은 이름·연락처로 미리 채움 (틀릴 수 있으니 확인하라고 안내)
  const cand = r.candidate || {};
  if (cand.name || cand.phone) {
    notionNameEl.value = cand.name || '';
    notionPhoneEl.value = cand.phone || '';
    notionExtractNote.textContent = '이력서에서 읽은 이름·연락처예요. 틀린 곳이 없는지 꼭 확인하고 등록하세요.';
    notionExtractNote.hidden = false;
  }
}

function buildNotionSummary(r, total) {
  const scores = [...scoreBody.querySelectorAll('.score-input')].map(i => parseInt(i.value, 10) || 0);
  const parts = r.rubric.map((item, i) => `${item.area} ${scores[i]}/${item.max}`);
  const lines = [
    `[이력서 검토 · AI 1차 평가 + 사람 확인] 포지션: ${r.position.name}`,
    `총점 ${total}/100 (AI 평가 ${r.total}점)`,
    parts.join(' · '),
  ];
  if (r.summary) lines.push('총평: ' + r.summary);
  if (r.strengths.length) lines.push('강점: ' + r.strengths.join(', '));
  if (r.concerns.length) lines.push('우려: ' + r.concerns.join(', '));
  if (r.valuesEvidence && r.valuesEvidence.length) lines.push('인재상 근거: ' + r.valuesEvidence.map(v => v.item).join(', '));
  return lines.join('\n');
}

async function registerToNotion(force = false) {
  const name = notionNameEl.value.trim();
  if (!name) {
    notionRegisterStatus.textContent = '지원자 이름을 입력해주세요.';
    notionRegisterStatus.className = 'status err';
    return;
  }
  if (!lastScreening) return;
  const total = Number(resumeTotal.textContent);
  notionRegisterBtn.disabled = true;
  notionRegisterStatus.textContent = '노션에 등록 중...';
  notionRegisterStatus.className = 'status';
  try {
    const res = await fetch('/api/notion/register-applicant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        phone: notionPhoneEl.value.trim(),
        team: notionTeamEl.value,
        job: jobFromPosition(lastScreening.position.name, lastScreening.position.brand),
        channels: [...notionChannelsEl.querySelectorAll('input:checked')].map(i => i.value),
        appliedAt: notionAppliedAtEl.value,
        status: notionStatusSel.value,
        recommendation: notionRecEl.value,
        total,
        summary: buildNotionSummary(lastScreening, total),
        education: (lastScreening.candidate || {}).education || '',
        career: (lastScreening.candidate || {}).career || '',
        checklist: (lastScreening.checklist || []).map(x => ({ code: x.code, status: x.status, note: x.note })),   // 카드 본문에 서류 체크리스트를 기록해요
        force,
      }),
    });
    const data = await res.json();
    if (res.status === 409 && data.duplicate) {
      const list = (data.matches || []).map(m => `- ${m.name} (${m.status || '상태 없음'}${m.team ? ' · ' + m.team : ''})`).join('\n');
      if (confirm(`이미 노션에 있는 지원자일 수 있어요:\n${list}\n\n그래도 새로 등록할까요?`)) {
        notionRegisterBtn.disabled = false;
        return registerToNotion(true);
      }
      notionRegisterStatus.textContent = '중복일 수 있어서 등록하지 않았어요.';
      notionRegisterStatus.className = 'status';
      notionRegisterBtn.disabled = false;
      return;
    }
    if (!res.ok) throw new Error(data.error || '등록 실패');
    notionRegisterStatus.textContent = `노션에 등록했어요 (종합점수 ${total}점). `;
    notionRegisterStatus.className = 'status ok';
    const link = safeNotionUrl(data.url);
    if (link) {
      const a = document.createElement('a');
      a.href = link; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = '노션에서 열기';
      notionRegisterStatus.appendChild(a);
    }
    registeredApplicant = {
      id: data.id, name, phone: notionPhoneEl.value.trim(), team: notionTeamEl.value,
      job: jobFromPosition(lastScreening.position.name, lastScreening.position.brand), status: notionStatusSel.value,
      interview1: '', interview2: '', smsStatus: '',
    };
    afterRegister.hidden = false;
    if (lastScreening.source === 'pdf' && analyzedPdf) attachPdfToNotion();
  } catch (err) {
    notionRegisterStatus.textContent = err.message || '노션 등록 중 오류가 발생했어요.';
    notionRegisterStatus.className = 'status err';
    notionRegisterBtn.disabled = false;
  }
}
notionRegisterBtn.addEventListener('click', () => registerToNotion(false));

// 올려 둔 이력서 PDF를 방금 등록한 노션 카드에 붙임 (실패해도 카드는 이미 등록돼 있으니, 다시 시도할 수 있게 함)
async function attachPdfToNotion() {
  if (!registeredApplicant || !analyzedPdf) return;
  notionRetryAttachBtn.hidden = true;
  notionAttachStatus.textContent = '이력서 PDF를 노션에 붙이는 중...';
  notionAttachStatus.className = 'status';
  try {
    const fname = `${registeredApplicant.name}_이력서.pdf`;
    const res = await fetch(`/api/notion/attach-resume?pageId=${encodeURIComponent(registeredApplicant.id)}&filename=${encodeURIComponent(fname)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: analyzedPdf,
    });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error('서버가 응답하지 못했어요.');
    if (!res.ok) throw new Error(data.error || '첨부 실패');
    notionAttachStatus.textContent = '이력서 PDF도 노션 카드에 붙였어요.';
    notionAttachStatus.className = 'status ok';
  } catch (err) {
    notionAttachStatus.textContent = `카드는 등록됐지만 PDF는 붙이지 못했어요: ${err.message || ''}`;
    notionAttachStatus.className = 'status err';
    notionRetryAttachBtn.hidden = false;
  }
}
notionRetryAttachBtn.addEventListener('click', attachPdfToNotion);
fillSendBtn.addEventListener('click', () => { if (registeredApplicant) fillSendFormFromNotion(registeredApplicant); });
fillScheduleBtn.addEventListener('click', () => { if (registeredApplicant) fillScheduleFormFromNotion(registeredApplicant); });

// --- 노션 지원자 불러오기 (문자 보내기 / 일정 등록에 채우기) ---
const openNotionPickerBtn = document.getElementById('openNotionPickerBtn');
const notionModal = document.getElementById('notionModal');
const notionSearch = document.getElementById('notionSearch');
const notionStatusFilter = document.getElementById('notionStatusFilter');
const notionTeamFilter = document.getElementById('notionTeamFilter');
const notionModalTitle = document.getElementById('notionModalTitle');
let pickerPurpose = 'forms'; // 'forms' = 문자/일정 폼 채우기, 'review' = 이력서 평가할 지원자 고르기
const notionPickerMsg = document.getElementById('notionPickerMsg');
const notionApplicantList = document.getElementById('notionApplicantList');
const notionWriteBackRow = document.getElementById('notionWriteBackRow');
const notionWriteBack = document.getElementById('notionWriteBack');
const notionWriteBackLabel = document.getElementById('notionWriteBackLabel');

let notionCtx = null;      // 노션에서 불러온 지원자 { pageId, name }
let notionApplicants = []; // 마지막으로 불러온 목록
let notionListSeq = 0;
let notionSearchTimer = null;

function clearNotionCtx() {
  notionCtx = null;
  notionWriteBackRow.hidden = true;
}
nameInput.addEventListener('input', () => {
  // 노션에서 불러온 뒤 이름을 고치면 다른 사람이 되므로 연결을 끊음
  if (notionCtx && nameInput.value.trim() !== notionCtx.name) clearNotionCtx();
});

function fmtNotionDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso || '');
  if (!m) return '';
  return `${Number(m[2])}/${Number(m[3])}${m[4] ? ' ' + m[4] + ':' + m[5] : ''}`;
}

function renderNotionApplicants() {
  if (!notionApplicants.length) {
    notionApplicantList.innerHTML = '';
    notionPickerMsg.textContent = '조건에 맞는 지원자가 없어요.';
    return;
  }
  notionPickerMsg.textContent = `${notionApplicants.length}명 (최근 등록순)`;
  notionApplicantList.innerHTML = notionApplicants.map((a, i) => {
    const sub = [a.team, a.job, a.phone,
      a.interview1 ? '1차 ' + fmtNotionDate(a.interview1) : '',
      a.interview2 ? '2차 ' + fmtNotionDate(a.interview2) : '',
      a.smsStatus ? '문자: ' + a.smsStatus : ''].filter(Boolean).join(' · ');
    return `<div class="notion-item">
      <div class="notion-item-main">
        <strong>${escapeHtml(a.name || '(이름 없음)')}</strong>
        ${a.status ? `<span class="notion-tag">${escapeHtml(a.status)}</span>` : ''}
        ${typeof a.score === 'number' ? `<span class="notion-tag">점수 ${a.score}</span>` : ''}
        <div class="notion-sub">${escapeHtml(sub) || '-'}</div>
      </div>
      <div class="notion-item-actions">
        ${pickerPurpose === 'review'
          ? `<button type="button" data-i="${i}" data-act="review">이 지원자 평가</button>`
          : `${canEdit('send') ? `<button type="button" data-i="${i}" data-act="send">문자 보내기</button>` : ''}
        ${canEdit('schedule') ? `<button type="button" data-i="${i}" data-act="schedule">일정 등록</button>` : ''}`}
      </div>
    </div>`;
  }).join('');
}

async function loadNotionApplicants() {
  const seq = ++notionListSeq;
  notionPickerMsg.textContent = '불러오는 중...';
  try {
    const qs = new URLSearchParams({ q: notionSearch.value.trim(), status: notionStatusFilter.value || 'active', team: notionTeamFilter.value || '' });
    const res = await fetch('/api/notion/applicants?' + qs);
    const data = await res.json();
    if (seq !== notionListSeq) return;
    if (!res.ok) throw new Error(data.error || '불러오기 실패');
    notionApplicants = data.applicants || [];
    renderNotionApplicants();
    if (data.hasMore) notionPickerMsg.textContent += ' · 더 있어요. 이름으로 검색해보세요.';
  } catch (err) {
    if (seq !== notionListSeq) return;
    notionApplicants = [];
    notionApplicantList.innerHTML = '';
    notionPickerMsg.textContent = err.message || '불러오는 중 오류가 발생했어요.';
  }
}

async function openNotionPicker(purpose = 'forms') {
  pickerPurpose = purpose;
  notionModalTitle.textContent = purpose === 'review' ? '평가할 노션 지원자 고르기' : '노션 지원자 불러오기';
  notionModal.hidden = false;
  notionApplicantList.innerHTML = '';
  notionPickerMsg.textContent = '노션 연결을 확인하는 중...';
  const st = await ensureNotionStatus(!(notionStatus && notionStatus.configured));
  if (!st.configured) {
    notionPickerMsg.textContent = '노션 연동이 아직 켜져 있지 않아요 — ' + (st.message || '');
    return;
  }
  if (st.problems && st.problems.length) {
    notionPickerMsg.textContent = '노션 DB 구조가 달라요: ' + st.problems.join(' / ');
    return;
  }
  // 열 때마다 처음 상태(검색어 없음, 진행 중)에서 시작 — 이전 검색어 때문에 다른 지원자가 안 보이는 일 방지
  notionStatusFilter.innerHTML =
    '<option value="active">진행 중 (서류합격·과제·면접 예정)</option><option value="all">전체</option>' +
    st.options.statuses.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  notionTeamFilter.innerHTML = '<option value="">전체 팀</option>' + st.options.teams.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join('');
  // 이력서 평가용으로 열면 채용·탈락한 사람도 골라야 하므로 '전체'에서 시작
  notionStatusFilter.value = purpose === 'review' ? 'all' : 'active';
  notionTeamFilter.value = '';
  notionSearch.value = '';
  loadNotionApplicants();
}
function closeNotionModal() { notionModal.hidden = true; }

openNotionPickerBtn.addEventListener('click', () => openNotionPicker('forms'));
document.getElementById('notionModalClose').addEventListener('click', closeNotionModal);
notionModal.addEventListener('click', e => { if (e.target === notionModal) closeNotionModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNotionModal(); });
notionStatusFilter.addEventListener('change', loadNotionApplicants);
notionTeamFilter.addEventListener('change', loadNotionApplicants);
notionSearch.addEventListener('input', () => {
  clearTimeout(notionSearchTimer);
  notionSearchTimer = setTimeout(loadNotionApplicants, 350);
});

function fillSendFormFromNotion(a) {
  nameInput.value = a.name;
  phoneInput.value = a.phone;
  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
  notionCtx = { pageId: a.id, name: a.name };
  notionWriteBack.checked = true;
  notionWriteBackLabel.textContent = `문자를 보내면 노션(${a.name})에도 "문자 발송 완료"로 기록`;
  notionWriteBackRow.hidden = false;
  closeNotionModal();
  showTab('send');
  nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  templateSelect.focus();
}

const NOTION_TEAM_ALIAS = { '글로벌팀': '글로벌비즈니스팀', '와우팀': '와우서비스팀' };
const NOTION_ROUND_BY_STATUS = { '채용 과제': '채용과제', '1차 면접 예정자': '1차', '2차 면접 예정': '2차' };

function fillScheduleFormFromNotion(a) {
  // 이전에 채웠던 값이 남아 엉뚱한 일정이 등록되지 않도록 먼저 비움
  populateDateSelects(schYearInput, schMonthInput, schDayInput);
  schHourInput.value = '';
  schMinuteInput.value = '';
  schTeamInput.value = '';
  schRoundInput.value = '';
  schNameInput.value = a.name;
  schPhoneInput.value = a.phone;
  const team = [...schTeamInput.options].some(o => o.value === a.team) ? a.team : NOTION_TEAM_ALIAS[a.team];
  if (team && [...schTeamInput.options].some(o => o.value === team)) schTeamInput.value = team;
  const round = NOTION_ROUND_BY_STATUS[a.status];
  if (round && [...schRoundInput.options].some(o => o.value === round)) schRoundInput.value = round;
  const iso = a.status === '2차 면접 예정' ? (a.interview2 || a.interview1) : (a.interview1 || a.interview2);
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso || '');
  if (m && [...schYearInput.options].some(o => o.value === m[1])) {
    schYearInput.value = m[1];
    schMonthInput.value = m[2];
    schDayInput.value = m[3];
    if (m[4]) { schHourInput.value = String(Number(m[4])); schMinuteInput.value = String(Number(m[5])); }
  }
  closeNotionModal();
  openScheduleView();   // 일정 등록은 이제 면접 화면의 "일정 등록·목록"에 있어요
  schNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (schHourInput.value === '' ? schHourInput : schLocationInput).focus();
}

notionApplicantList.addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const a = notionApplicants[Number(btn.dataset.i)];
  if (!a) return;
  if (btn.dataset.act === 'send') fillSendFormFromNotion(a);
  else if (btn.dataset.act === 'review') setReviewTarget(a);
  else fillScheduleFormFromNotion(a);
});

// ---------- 이력서 검토: 노션 지원자 불러와 평가 · 점수 기록 · 점수 기준 ----------
const notionPickBox = document.getElementById('notionPickBox');
const notionReviewChosen = document.getElementById('notionReviewChosen');
const notionFileChoice = document.getElementById('notionFileChoice');
const benchmarkBox = document.getElementById('benchmarkBox');
const notionRecordBox = document.getElementById('notionRecordBox');
const notionRegisterBox = document.getElementById('notionRegisterBox');
const notionRecordTarget = document.getElementById('notionRecordTarget');
const notionRecordRec = document.getElementById('notionRecordRec');
const notionRecordBtn = document.getElementById('notionRecordBtn');
const notionRecordStatus = document.getElementById('notionRecordStatus');
let reviewTarget = null;        // 평가하려고 고른 노션 지원자 { id, name, status, team, score }
let notionReviewResult = null;  // 마지막 노션 지원자 평가 응답 (지원자 정보, 평가한 파일)
let chosenFileKey = '';         // 이력서 파일이 여러 개일 때 고른 파일
let lastBenchmark = null;

function setReviewTarget(a) {
  reviewTarget = { id: a.id, name: a.name, status: a.status, team: a.team, score: a.score };
  chosenFileKey = '';
  notionFileChoice.hidden = true;
  document.getElementById('notionReviewName').textContent = a.name || '(이름 없음)';
  document.getElementById('notionReviewMeta').textContent =
    [a.status, a.team, typeof a.score === 'number' ? `기록된 점수 ${a.score}점` : '아직 점수 기록 없음'].filter(Boolean).join(' · ');
  notionReviewChosen.hidden = false;
  resumeStatus.textContent = '';
  closeNotionModal();
}
function clearReviewTarget() {
  reviewTarget = null; chosenFileKey = '';
  notionReviewChosen.hidden = true; notionFileChoice.hidden = true;
}
document.getElementById('openNotionReviewPickerBtn').addEventListener('click', () => openNotionPicker('review'));
document.getElementById('notionReviewClearBtn').addEventListener('click', clearReviewTarget);

function showFileChoice(files) {
  chosenFileKey = files[0].key;
  notionFileChoice.innerHTML = '<div class="manage-hint" style="margin:0 0 6px">평가할 이력서 파일을 고르고 "평가하기"를 다시 눌러주세요.</div>' +
    files.map((f, i) => `<label><input type="radio" name="notionFile" value="${escapeHtml(f.key)}" ${i === 0 ? 'checked' : ''} /> ${escapeHtml(f.name)}</label>`).join('');
  notionFileChoice.hidden = false;
}
notionFileChoice.addEventListener('change', e => {
  if (e.target.name === 'notionFile') chosenFileKey = e.target.value;
});

// 평가 결과가 그려진 뒤: 새 이력서는 '노션에 등록', 노션에서 불러온 사람은 '점수 기록'을 보여줌 + 점수 기준 표시
function onScreeningRendered(r) {
  const fromNotion = r.source === 'notion' && !!notionReviewResult;
  notionRecordBox.hidden = !fromNotion;
  notionRegisterBox.hidden = fromNotion;
  if (fromNotion) prepareNotionRecord(r, notionReviewResult);
  else prepareNotionRegister(r);
  loadBenchmark(r.position.id);
}

async function prepareNotionRecord(r, resp) {
  notionRecordStatus.textContent = '';
  notionRecordStatus.className = 'status';
  notionRecordBtn.disabled = false;
  const st = await ensureNotionStatus(!(notionStatus && notionStatus.configured));
  if (!st.configured || (st.problems && st.problems.length)) { notionRecordBox.hidden = true; return; }
  const a = resp.applicant;
  notionRecordRec.innerHTML = optionsHtml(st.options.recommendations, '(기록 안 함)');
  const rec = NOTION_REC_MAP[r.recommendation];
  if (rec && st.options.recommendations.includes(rec)) notionRecordRec.value = rec;
  notionRecordTarget.textContent =
    `${a.name || '(이름 없음)'} · ${a.status || '상태 없음'} · ${a.team || '팀 없음'} · 평가한 파일: ${resp.file.name} · ` +
    (typeof a.existingScore === 'number' ? `지금 기록된 점수 ${a.existingScore}점 (기록하면 덮어쓸지 한 번 더 물어봐요)` : '아직 기록된 점수 없음');
}

async function recordScore(overwrite) {
  if (!lastScreening || lastScreening.source !== 'notion' || !notionReviewResult) return;
  const a = notionReviewResult.applicant;
  const total = Number(resumeTotal.textContent);
  notionRecordBtn.disabled = true;
  notionRecordStatus.textContent = '기록하는 중...';
  notionRecordStatus.className = 'status';
  try {
    const res = await fetch('/api/notion/record-score', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageId: a.id, total, recommendation: notionRecordRec.value, summary: buildNotionSummary(lastScreening, total), overwrite: !!overwrite }),
    });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error('서버가 응답하지 못했어요.');
    if (res.status === 409 && data.code === 'has_score') {
      notionRecordBtn.disabled = false;
      if (confirm(`이미 ${data.existingScore}점이 기록돼 있어요.\n${total}점으로 덮어쓸까요?`)) return recordScore(true);
      notionRecordStatus.textContent = '기록하지 않았어요.';
      return;
    }
    if (!res.ok) throw new Error(data.error || '기록 실패');
    a.existingScore = total;
    notionRecordStatus.textContent = `${a.name} 님의 노션 카드에 ${total}점을 기록했어요. `;
    notionRecordStatus.className = 'status ok';
    const link = safeNotionUrl(a.url);
    if (link) {
      const l = document.createElement('a');
      l.href = link; l.target = '_blank'; l.rel = 'noopener noreferrer'; l.textContent = '노션에서 열기';
      notionRecordStatus.appendChild(l);
    }
    loadBenchmark(lastScreening.position.id); // 방금 기록한 점수까지 반영해서 기준 다시 계산
  } catch (err) {
    notionRecordStatus.textContent = err.message || '기록 중 오류가 발생했어요.';
    notionRecordStatus.className = 'status err';
  } finally { notionRecordBtn.disabled = false; }
}
notionRecordBtn.addEventListener('click', () => recordScore(false));

// --- 점수 기준(채용/탈락 결과별 평균) ---
function benchCell(label, st, cls) {
  if (!st || !st.n) return `<div class="bench-cell ${cls || ''}"><b>${escapeHtml(label)}</b>기록 없음</div>`;
  return `<div class="bench-cell ${cls || ''}"><b>${escapeHtml(label)} · ${st.n}명</b>평균 ${st.avg}점 <span class="manage-hint" style="margin:0">(${st.min}~${st.max}점, 중앙값 ${st.median})</span></div>`;
}
function benchGrid(g) {
  return `<div class="bench-grid">${benchCell('채용·입사', g.hired, 'hired')}${benchCell('탈락 확정', g.rejected)}${benchCell('진행 중', g.inProgress)}${benchCell('면접 불참', g.noShow)}</div>`;
}
function renderBenchmark() {
  const b = lastBenchmark;
  if (!b) { benchmarkBox.hidden = true; return; }
  benchmarkBox.hidden = false;
  if (!b.totalScored) {
    benchmarkBox.innerHTML = '<h4>📊 노션에 기록된 점수 기준</h4><p class="manage-hint" style="margin:0">아직 노션에 점수가 기록된 사람이 없어요. 위에서 <b>"노션에서 불러오기"</b>로 채용된 사람·탈락한 사람의 이력서를 몇 명 채점해서 기록하면, 여기에 결과별 평균 점수 기준이 생겨요.</p>';
    return;
  }
  let html = `<h4>📊 노션에 기록된 점수 기준 (참고용 · 점수 기록 ${b.totalScored}명)</h4><p class="bench-me" id="benchMe"></p>`;
  html += benchGrid(b.overall);
  if (b.team && b.teamStats.all.n) html += `<div class="manage-hint" style="margin:6px 0 4px">${escapeHtml(b.team)}만 보면</div>${benchGrid(b.teamStats)}`;
  const hired = b.overall.hired.n;
  if (hired < 5) html += `<p class="bench-warn">⚠ 채용된 사람 표본이 ${hired}명뿐이라 평균이 크게 흔들려요. 더 채점해서 기록할수록 정확해져요.</p>`;
  const rej = new Map((b.rejectedAreas || []).map(x => [x.key, x]));
  const rows = (b.hiredAreas || []).map(h => ({ ...h, rej: rej.get(h.key) })).filter(x => x.rej)
    .map(x => ({ ...x, diff: Math.round((x.avg - x.rej.avg) * 10) / 10 })).sort((p, q) => q.diff - p.diff);
  if (rows.length) {
    html += `<div class="bench-areas">영역별로 채용된 사람과 탈락한 사람의 평균 차이 (JD에서 무엇을 강조할지 참고하세요)<ul>` +
      rows.map(x => `<li>${escapeHtml(x.area)}: 채용 ${x.avg} · 탈락 ${x.rej.avg} / ${x.max}점 → <b>${x.diff >= 0 ? '+' : ''}${x.diff}</b></li>`).join('') + '</ul></div>';
  }
  html += '<p class="bench-warn">이 점수는 합격선이 아니라 지금까지 기록된 사람들의 평균이에요. 과거 결과가 항상 옳다고 볼 수 없고, 점수는 평가표(직무 역량) 기준이에요. 최종 판단은 사람이 해주세요.</p>';
  benchmarkBox.innerHTML = html;
  updateBenchmarkCompare();
}
function updateBenchmarkCompare() {
  const el = document.getElementById('benchMe');
  if (!el || !lastBenchmark || !lastScreening) return;
  const total = Number(resumeTotal.textContent);
  const o = lastBenchmark.overall;
  const parts = [];
  if (o.hired.n) { const d = Math.round((total - o.hired.avg) * 10) / 10; parts.push(`채용된 사람 평균(${o.hired.avg}점)보다 ${d >= 0 ? '+' : ''}${d}점`); }
  if (o.rejected.n) { const d = Math.round((total - o.rejected.avg) * 10) / 10; parts.push(`탈락한 사람 평균(${o.rejected.avg}점)보다 ${d >= 0 ? '+' : ''}${d}점`); }
  el.textContent = `이 이력서 ${total}점` + (parts.length ? ' — ' + parts.join(' · ') : '');
}
async function loadBenchmark(positionId) {
  lastBenchmark = null;
  benchmarkBox.hidden = true;
  const st = await ensureNotionStatus(!(notionStatus && notionStatus.configured));
  if (!st.configured || (st.problems && st.problems.length)) return;
  try {
    const res = await fetch('/api/notion/benchmark?positionId=' + encodeURIComponent(positionId));
    const data = await readJsonOrNull(res);
    if (!res.ok || !data) return;
    lastBenchmark = data;
    renderBenchmark();
  } catch { /* 점수 기준은 참고용이라 불러오지 못해도 평가에는 영향 없음 */ }
}

// ---------- 로그인 정보 · 메뉴별 권한 · 왼쪽 하단 도크 ----------
const MENU_KEYS = ['send', 'history', 'schedule', 'resume', 'interviews', 'templates'];
const noAccessEl = document.getElementById('noAccess');
const userDock = document.getElementById('userDock');
const dockName = document.getElementById('dockName');
const dockRole = document.getElementById('dockRole');
const openAdminBtn = document.getElementById('openAdminBtn');
const dockLogoutBtn = document.getElementById('dockLogoutBtn');
const sendReadonlyNote = document.getElementById('sendReadonlyNote');

function renderLeadNote() {
  const el = document.getElementById('apLeadNote'); if (!el) return;
  const lead = ME.role === 'teamlead';
  el.hidden = !lead;
  if (lead) el.textContent = `${(ME.teams || []).join('·')} 면접 기록만 보여요(보기 전용). 다른 팀과 수정·문자 발송은 소유주에게 요청해주세요.`;
}
// 공고 만들기 화면을 보여줄지(서버 환경변수 SHOW_POSTING_CREATE=1 일 때만). 숨겨도 코드와 저장된 공고는 그대로예요
// 이력서 점수의 기준으로 고를 수 있는 공고: 공고 만들기가 숨겨진 상태(기본)에서는 "링크로 올린 공고"만이에요(예전에 만든 공고는 지우지 않고 안 보이게만 둬요). 공고 만들기가 켜져 있으면 확정된 공고 모두예요.
function scorablePostings() { return postingsAll.filter(p => p.status === 'confirmed' && (postingCreateOn() || p.source === 'link')); }
function postingCreateOn() { return !!(ME.features && ME.features.postingCreate); }
function applyPermissions() {
  document.body.classList.toggle('no-posting-create', !postingCreateOn());
  renderLeadNote();
  MENU_KEYS.forEach(m => {
    document.body.classList.toggle('no-view-' + m, !canView(m));
    document.body.classList.toggle('no-edit-' + m, !canEdit(m));
  });
  // 탭: 그 탭의 메뉴 중 하나라도 볼 수 있어야 보임
  let firstVisible = null;
  tabBtns.forEach(b => {
    const visible = b.dataset.menus.split(' ').some(canView);
    b.hidden = !visible;
    if (visible && !firstVisible) firstVisible = b.dataset.tab;
  });
  noAccessEl.hidden = !!firstVisible;
  // 문자 보내기는 '보기'만 있으면 입력칸을 잠가서 보기만 가능하게
  const sendLocked = canView('send') && !canEdit('send');
  sendReadonlyNote.hidden = !sendLocked;
  document.querySelectorAll('.form-panel input, .form-panel select, .form-panel textarea, #previewText')
    .forEach(el => { el.disabled = sendLocked; });
  // 이력서 검토 / 양식 관리: 보기만 있으면 글을 고칠 수 없게
  return firstVisible;
}


// ---------- 면접 제안 대기 알림 (서류 합격 확정이 되면 제나에게 와요) ----------
const offerAlertBtn = document.getElementById('offerAlertBtn'), offerAlertCount = document.getElementById('offerAlertCount'), oaModal = document.getElementById('offerAlertModal'), oaList = document.getElementById('oaList');
let offerAlerts = [];
const oaMsg = (m, cls) => { const el = document.getElementById('oaMsg'); el.textContent = m || ''; el.className = 'status' + (cls ? ' ' + cls : ''); };
function oaRender() {
  offerAlertBtn.hidden = !offerAlerts.length || offerAlertEnabled === false;
  offerAlertCount.textContent = offerAlerts.length ? String(offerAlerts.length) : '';
  oaList.innerHTML = offerAlerts.length ? offerAlerts.map(x => {
    const meta = [x.team, x.job, x.score === null || x.score === undefined ? '' : `점수 ${x.score}`].filter(Boolean).join(' · ');
    return `<div class="oa-item" data-id="${escapeHtml(x.id)}"><div><strong>${escapeHtml(x.name || '(이름 없음)')}</strong> <span class="ap-sub">${escapeHtml(meta)}</span><div class="ap-sub">${escapeHtml(x.byName || '담당자')}님이 ${escapeHtml(apdWhen(x.at))}에 서류 합격 확정 · ${x.phone ? escapeHtml(x.phone) : '연락처 없음'}</div></div><div class="oa-actions">${x.phone ? `<button type="button" class="add-btn oa-send" data-id="${escapeHtml(x.id)}">면접 제안 문자 보내기</button>` : ''}<button type="button" class="link-btn oa-done" data-id="${escapeHtml(x.id)}">처리됨</button></div></div>`;
  }).join('') : '<p class="ap-sub">면접 제안을 기다리는 사람이 없어요.</p>';
}
let offerAlertEnabled = null;
async function loadOfferAlerts() {
  try {
    const res = await fetch('/api/offer-alerts'); if (!res.ok) return; const j = await res.json();
    offerAlertEnabled = j.enabled !== false; offerAlerts = offerAlertEnabled ? (j.alerts || []) : []; oaRender();
  } catch { /* 알림을 못 불러와도 화면은 그대로 써요(다음 확인 때 다시 시도해요) */ }
}
function oaOpen() { oaMsg(''); oaRender(); oaModal.hidden = false; document.body.classList.add('apd-open'); document.getElementById('oaClose').focus(); }
function oaClose() { oaModal.hidden = true; document.body.classList.remove('apd-open'); }
offerAlertBtn.addEventListener('click', oaOpen);
oaModal.addEventListener('click', async e => {
  if (e.target.closest('#oaClose') || e.target.dataset.oaclose) { oaClose(); return; }
  const s = e.target.closest('.oa-send'); if (s) { const x = offerAlerts.find(v => v.id === s.dataset.id); if (x) { oaClose(); fillSendFormFromNotion({ id: x.applicantId, name: x.name, phone: x.phone }); } return; }
  const d = e.target.closest('.oa-done'); if (d) {
    d.disabled = true;
    try {
      const res = await fetch('/api/offer-alerts/' + encodeURIComponent(d.dataset.id), { method: 'DELETE' }); const j = await res.json().catch(() => ({}));
      if (res.ok) { offerAlerts = j.alerts || []; oaRender(); oaMsg('처리됨으로 표시했어요.', 'ok'); }
      else if (res.status === 404) { await loadOfferAlerts(); oaMsg('이미 처리된 알림이에요.', 'ok'); }
      else { d.disabled = false; oaMsg(j.error || '처리하지 못했어요.', 'err'); }
    } catch { d.disabled = false; oaMsg('서버에 연결하지 못했어요.', 'err'); }
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !oaModal.hidden) { e.preventDefault(); oaClose(); } });
setInterval(() => { if (!document.hidden && typeof ME !== 'undefined' && ME.mode !== 'none') loadOfferAlerts(); }, 60000);   // 1분마다 새 알림을 확인해요

function initDock() {
  if (ME.mode === 'none') { document.getElementById('authBanner').hidden = false; return; }
  document.getElementById('authBanner').hidden = true;
  userDock.hidden = false;
  document.body.classList.add('has-dock');
  dockName.textContent = ME.name || '로그인됨';
  dockRole.textContent = ME.role === 'owner' ? '소유주' : (ME.role === 'teamlead' ? `팀장 · ${(ME.teams || []).join('·')}` : '');
  openAdminBtn.hidden = !ME.canManage;
  loadOfferAlerts();   // 면접 제안을 기다리는 사람이 있으면 도크에 알려요
}
dockLogoutBtn.addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  location.href = '/login.html';
});

async function bootApp() {
  try {
    try {
      const res = await fetch('/api/me');
      const me = await res.json();
      if (me.mode !== 'none' && !me.authed) { location.href = '/login.html'; return; }
      if (me.authed) ME = me;
    } catch { /* 확인 실패 시에는 기본값으로 계속 (서버가 어차피 권한을 다시 확인함) */ }
    const first = applyPermissions();
    initDock();
    if (first) showTab(first);
    lnRefresh();   // 노션 → 앱 옮기기 상자(소유주·노션 모드일 때만)
    todayLoad(); setInterval(() => { if (!document.hidden) todayLoad(); }, 5 * 60 * 1000);   // 오늘 할 일
    if (canView('history')) loadHistory();
    if (canView('schedule')) { loadTeams(); loadInterviewers(); loadLocations(); loadRounds(); loadSchedules(); }
  } finally {
    document.body.classList.remove('booting'); // 어떤 경우에도 화면이 비어 있지 않게
  }
}

// ---------- 권한 관리 (소유주) ----------
const adminModal = document.getElementById('adminModal');
const adminUserList = document.getElementById('adminUserList');
const adminMsg = document.getElementById('adminMsg');
const adminAddStatus = document.getElementById('adminAddStatus');
const ADMIN_LEVELS = [['none', '없음'], ['view', '보기'], ['edit', '수정']];
let adminData = null;

function fmtLogin(iso) {
  if (!iso) return '아직 로그인 안 함';
  const d = new Date(iso);
  return isNaN(d) ? '' : `마지막 로그인 ${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function renderAdminUsers() {
  adminUserList.innerHTML = adminData.users.map(u => {
    const owner = u.role === 'owner';
    const perms = adminData.menus.map(m => `
      <label class="admin-perm">${escapeHtml(m.label)}
        <select class="lv-${u.perms[m.key]}" data-email="${escapeHtml(u.email)}" data-menu="${m.key}" ${owner ? 'disabled' : ''}>
          ${ADMIN_LEVELS.map(([v, l]) => `<option value="${v}" ${u.perms[m.key] === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
      </label>`).join('');
    return `<div class="admin-user" data-email="${escapeHtml(u.email)}">
      <div class="admin-user-head">
        <span class="admin-user-name">${escapeHtml(u.name)}</span>
        ${owner ? '<span class="dock-role">소유주</span>' : ''}
        <span class="admin-user-email">${escapeHtml(u.email)}</span>
        <span class="admin-user-last">${escapeHtml(fmtLogin(u.lastLoginAt))}</span>
      </div>
      <div class="admin-perms">${perms}</div>
      <div class="admin-user-foot">
        <span class="status"></span>
        ${owner ? '<span class="manage-hint" style="margin:0">소유주는 항상 모든 권한을 가져요</span>'
                : `<button type="button" class="admin-del-btn" data-email="${escapeHtml(u.email)}">삭제</button>`}
      </div>
    </div>`;
  }).join('');
}

async function loadAdminUsers() {
  adminMsg.textContent = '불러오는 중...';
  try {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '불러오기 실패');
    adminData = data;
    adminMsg.textContent = '';
    renderAdminUsers();
  } catch (err) {
    adminMsg.textContent = err.message || '권한 목록을 불러오지 못했어요.';
  }
}
function openAdmin() { adminModal.hidden = false; adminAddStatus.textContent = ''; loadAdminUsers(); }
function closeAdmin() { adminModal.hidden = true; }
openAdminBtn.addEventListener('click', openAdmin);
document.getElementById('adminModalClose').addEventListener('click', closeAdmin);
adminModal.addEventListener('click', e => { if (e.target === adminModal) closeAdmin(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAdmin(); });

adminUserList.addEventListener('change', async e => {
  const sel = e.target.closest('select[data-menu]');
  if (!sel) return;
  const card = sel.closest('.admin-user');
  const status = card.querySelector('.status');
  status.textContent = '저장 중...'; status.className = 'status';
  try {
    const res = await fetch('/api/admin/users/' + encodeURIComponent(sel.dataset.email), {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perms: { [sel.dataset.menu]: sel.value } }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');
    const u = adminData.users.find(x => x.email === sel.dataset.email);
    if (u) u.perms = data.user.perms;
    sel.className = 'lv-' + sel.value;
    status.textContent = '저장됨 ✓'; status.className = 'status ok';
  } catch (err) {
    status.textContent = err.message || '저장 중 오류가 발생했어요.'; status.className = 'status err';
    loadAdminUsers(); // 실패하면 서버의 실제 값으로 되돌려 보여줌
  }
});

adminUserList.addEventListener('click', async e => {
  const btn = e.target.closest('.admin-del-btn');
  if (!btn) return;
  const u = adminData.users.find(x => x.email === btn.dataset.email);
  if (!confirm(`${u ? u.name : ''} (${btn.dataset.email}) 님의 접근 권한을 삭제할까요?\n삭제하면 바로 로그인할 수 없게 돼요.`)) return;
  const res = await fetch('/api/admin/users/' + encodeURIComponent(btn.dataset.email), { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) { adminMsg.textContent = data.error || '삭제하지 못했어요.'; return; }
  loadAdminUsers();
});

document.getElementById('adminAddBtn').addEventListener('click', async () => {
  const email = document.getElementById('adminNewEmail').value.trim();
  const name = document.getElementById('adminNewName').value.trim();
  const preset = document.getElementById('adminNewPreset').value;
  if (!email) { adminAddStatus.textContent = '구글 이메일을 입력해주세요.'; adminAddStatus.className = 'status err'; return; }
  const perms = Object.fromEntries(MENU_KEYS.map(k => [k, preset]));
  try {
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, perms }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '추가 실패');
    adminAddStatus.textContent = `${data.user.name} 님을 추가했어요. 이제 메뉴별 권한을 조정하세요.`;
    adminAddStatus.className = 'status ok';
    document.getElementById('adminNewEmail').value = '';
    document.getElementById('adminNewName').value = '';
    loadAdminUsers();
  } catch (err) {
    adminAddStatus.textContent = err.message || '추가 중 오류가 발생했어요.'; adminAddStatus.className = 'status err';
  }
});

document.body.classList.add('booting');
// (bootApp() 호출은 이 파일의 맨 마지막으로 옮겼어요: 아래 지원자 관리·일괄 점수 같은 코드가 모두 선언된 뒤에 시작해야 안전해요)


// ---------- 지원자 관리 (노션 「진행중 채용」과 같은 데이터를 읽고 씀) ----------
const apBody = document.getElementById('apBody');
const apStatus = document.getElementById('apStatus');
const apTeam = document.getElementById('apTeam');
const apSearch = document.getElementById('apSearch');
const apMsg = document.getElementById('apMsg');
const apNotice = document.getElementById('apNotice');
const apMore = document.getElementById('apMore');
let apList = [];         // 지금 화면에 보이는 지원자들 (노션에서 읽은 값 그대로)
let apCursor = '';
let apOptions = null;    // 노션의 선택지(면접상태·문자 안내·팀)
let apLoadedAt = 0;
let apLoading = false;
let apScheduleChecked = false;   // 면접 일정과 비교한 결과를 받았는지(일정 보기 권한이 없으면 false)
const AP_ACTIVE = ['서류합격', '1차 면접 예정자', '채용 과제', '2차 면접 예정'];   // 면접 문자·일정을 이어서 할 단계
const canEdit_ = menu => (typeof canEdit === 'function') && canEdit(menu);
const AP_REC = { PASS: ['추천', 'pass'], BORDERLINE: ['보류', 'border'], REJECT: ['비추천', 'reject'] };

function setApMsg(msg, cls) { apMsg.textContent = msg || ''; apMsg.className = 'status' + (cls ? ' ' + cls : ''); }
// 노션 날짜 → 한국 시간 'YYYY-MM-DDTHH:mm' (날짜만 있으면 'YYYY-MM-DDT00:00')
function apToLocalInput(v) {
  if (!v) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v + 'T00:00';
  const d = new Date(v);
  if (isNaN(d)) return '';
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }).replace(' ', 'T').slice(0, 16);
}
function apFmtWhen(v) {
  if (!v) return '-';
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return `${+v.slice(5, 7)}/${+v.slice(8, 10)}`;
  // 시간대가 없는 값(입력칸의 'YYYY-MM-DDTHH:mm')은 이미 한국 시간이라 그대로 보여줌. 시간대가 있는 값(노션)만 한국 시간으로 바꿈
  const t = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v) ? v : apToLocalInput(v);
  return t ? `${+t.slice(5, 7)}/${+t.slice(8, 10)} ${t.slice(11, 16)}` : '-';
}
function apCanEdit() { return !document.body.classList.contains('no-edit-interviews'); }

// 문자 보내기의 면접 일정과 비교한 상태 배지 + 맞추기 버튼
const AP_SCH_LABEL = { match: ['✓ 일정과 일치', 'ok'], diff: ['⚠ 일정과 달라요', 'warn'], notion_only: ['일정에 없어요', 'muted'], schedule_only: ['노션에 없어요', 'warn'], date_only: ['날짜만 일치', 'muted'] };
// 연락처가 달라 짝짓지 못한 같은 이름의 일정(동명이인이거나 연락처가 바뀐 같은 사람일 수 있음)을 이름 칸 아래에 알려줌
function apAmbiguousNote(x) {
  const amb = (apScheduleChecked && x.scheduleCheck && x.scheduleCheck.ambiguous) || [];
  if (!amb.length) return '';
  const list = amb.map(s => `${s.team} ${s.round || ''} ${apFmtWhen(s.at)}`.replace(/\s+/g, ' ').trim()).join(', ');
  return `<span class="ap-sch ap-sch-warn" title="이름은 같은데 연락처가 달라서 같은 사람인지 알 수 없어요. 문자 보내기의 면접 일정에서 확인하세요.">연락처가 다른 일정 ${amb.length}건: ${escapeHtml(list)}</span>`;
}
function apSchedBadge(x, round) {
  if (!apScheduleChecked || !x.scheduleCheck) return '';
  const r = (x.scheduleCheck.rows || []).find(v => v.round === round);
  if (!r) return '';
  const [label, cls] = AP_SCH_LABEL[r.state] || ['', 'muted'];
  const detail = r.state === 'diff' ? ` · 일정 ${apFmtWhen(r.scheduleAt)}` : (r.state === 'schedule_only' || r.state === 'date_only' ? ` · 일정 ${apFmtWhen(r.scheduleAt)}` : '');
  const warnPhone = x.scheduleCheck.how === 'nameTeam' ? ' <span class="ap-sch-warn" title="연락처가 달라요. 같은 사람이 맞는지 확인하세요">(연락처 다름)</span>' : '';
  const fixes = [];
  if (r.state === 'diff' || r.state === 'date_only') {
    if (canEdit_('schedule') && r.scheduleId) fixes.push(`<button type="button" class="link-btn ap-sch-fix" data-dir="toSchedule" data-round="${round}">노션 → 일정</button>`);
    if (apCanEdit() && r.scheduleAt) fixes.push(`<button type="button" class="link-btn ap-sch-fix" data-dir="toNotion" data-round="${round}">일정 → 노션</button>`);
  } else if (r.state === 'schedule_only' && apCanEdit()) fixes.push(`<button type="button" class="link-btn ap-sch-fix" data-dir="toNotion" data-round="${round}">일정 → 노션</button>`);
  return `<span class="ap-sch ap-sch-${cls}" data-round="${round}">${label}${escapeHtml(detail)}${warnPhone}</span>${fixes.length ? `<span class="ap-sch-actions">${fixes.join(' ')}</span>` : ''}`;
}

// ---------- 지원자 페이지: 이름을 누르면 왼쪽에 정보, 오른쪽에 면접 기록(앱 안에 저장) ----------
const apd = { id: '', x: null, note: null, dirty: new Set(), loading: false };
const apdEl = document.getElementById('apDetail');
const APD_SECTIONS = [['r1', '1차 면접 내용', '질문과 답변, 지원자의 태도, 확인한 점을 적어주세요'], ['r2', '2차 면접 내용', '2차 면접에서 확인한 내용을 적어주세요'], ['opinion', '종합 의견', '채용 의견과 그 이유를 적어주세요']];
const apdWhen = iso => { const d = new Date(iso); if (isNaN(d)) return ''; return `${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const apdMsg = (m, cls) => { const el = document.getElementById('apdMsg'); el.textContent = m || ''; el.className = 'status' + (cls ? ' ' + cls : ''); };
function apdInfoHtml(x) {
  const rec = AP_REC[x.recommendation];
  const rows = [['팀 · 직무', [x.team, x.job].filter(Boolean).join(' · ')], ['면접상태', x.status], ['1차 면접', apFmtWhen(x.interview1)], ['2차 면접', apFmtWhen(x.interview2)], ['점수 · 추천', (x.score === null || x.score === undefined ? '' : String(x.score)) + (rec ? ` ${rec[0]}` : '')], ['연락처', x.phone], ['지원채널', (x.channels || []).join(', ')], ['지원일', x.appliedAt], ['면접 문자', x.smsStatus], ['입사일', x.hireDate], ['메모', x.memo]];
  return '<dl class="apd-dl">' + rows.filter(r => r[1]).map(r => `<dt>${escapeHtml(r[0])}</dt><dd>${escapeHtml(r[1])}</dd>`).join('') + '</dl>';
}
function apdRenderNotes() {
  const n = apd.note || {}; const canEdit = apCanEdit() || ME.role === 'teamlead';   // 팀장도 자기 팀 면접 대상자의 면접 내용을 써요(서버가 팀을 확인해요)
  document.getElementById('apdNotes').innerHTML = APD_SECTIONS.map(([k, label, ph]) => {
    const cur = n[k]; const who = cur ? `${escapeHtml(cur.name || '')}님이 ${escapeHtml(apdWhen(cur.at))}에 씀` : '아직 쓰지 않았어요';
    return `<div class="apd-section" data-sec="${k}"><label for="apd-${k}"><strong>${label}</strong></label><textarea id="apd-${k}" data-sec="${k}" rows="${k === 'opinion' ? 4 : 7}" maxlength="8000" placeholder="${escapeHtml(ph)}"${canEdit ? '' : ' readonly'}>${escapeHtml(cur ? cur.text : '')}</textarea><div class="apd-row"><span class="ap-sub apd-who">${who}</span>${canEdit ? `<button type="button" class="add-btn apd-save" data-sec="${k}">저장</button>` : ''}</div></div>`;
  }).join('');
  const cs = n.comments || [];
  const canComment = canEdit;   // 팀장도 자기 팀 지원자에 의견 댓글을 쓸 수 있어요(서버가 팀을 확인해요)
  document.getElementById('apdComments').innerHTML = cs.length ? cs.map(c => `<div class="apd-comment" data-cid="${escapeHtml(c.id)}"><div class="ap-sub">${escapeHtml(c.name || '')} · ${escapeHtml(apdWhen(c.at))}${canComment && (!ME.email || ME.email === c.by || ME.role === 'owner') ? ` <button type="button" class="link-btn apd-cdel" data-cid="${escapeHtml(c.id)}">삭제</button>` : ''}</div><div class="apd-ctext">${escapeHtml(c.text)}</div></div>`).join('') : '<p class="ap-sub">아직 댓글이 없어요.</p>';
  document.getElementById('apdCommentForm').hidden = !canComment;
  const hasAny = !!(n.r1 || n.r2 || n.opinion || (n.comments || []).length);
  const delBox = document.getElementById('apdDeleteBox'); const canDeleteAll = ME.role === 'owner' || ME.role === 'full';   // 서버도 소유주만 허용해요(비밀번호 로그인은 모두 전체 권한)
  delBox.hidden = !(canDeleteAll && hasAny);
  apd.dirty.clear();
}
async function apdFetchNote(id) {
  const res = await fetch('/api/interview-notes/' + encodeURIComponent(id)); const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || '면접 기록을 불러오지 못했어요.'); return j.note;
}
// 노션 → 앱 저장소 옮기기(소유주·전체 권한만, 노션 모드일 때만 보여요)
async function lnRefresh() {
  const box = document.getElementById('lnBox'); if (!box) return;
  if (!(ME.role === 'owner' || ME.role === 'full')) { box.hidden = true; return; }
  const done = document.getElementById('lnDone'); done.hidden = true;
  try {
    const r = await fetch('/api/data-source'); const d = await r.json();
    box.hidden = !(r.ok && d.mode !== 'local' && d.notionToken && !d.envForced); if (d.progress) document.getElementById('lnProg').textContent = `지난번에 ${d.progress.pages}명까지 옮겼어요. 누르면 이어서 옮겨요.`;
    document.getElementById('lnToApp').hidden = !(d.importedAt && d.mode !== 'local'); document.getElementById('lnStart').hidden = !!(d.importedAt && d.mode !== 'local');
    if (r.ok && d.mode === 'local' && d.importedAt && !d.envForced) {   // 옮긴 뒤: 결과와 되돌리기(노션 토큰이 남아 있을 때만)
      const c = d.counts || {}; done.hidden = false;
      document.getElementById('lnDoneText').textContent = `앱 저장소 사용 중 · ${String(d.importedAt).slice(0, 10)}에 ${c.pages || 0}명, 면접 문항 표 ${c.dbs || 0}개, 서류 PDF ${c.files || 0}개를 옮겼어요${c.fileErrors ? ` (PDF ${c.fileErrors}명분은 옮기지 못했어요)` : ''}${d.fileStore === 'none' ? ' · 파일 창고가 없어 PDF 원본은 저장되지 않았어요' : ''}.`;
      document.getElementById('lnToNotion').hidden = !d.notionToken;
    }
  } catch { box.hidden = true; }
}
document.getElementById('lnToNotion').addEventListener('click', async () => {
  if (!confirm('노션으로 되돌릴까요?\n\n앱 저장소로 옮긴 뒤 앱에서 바꾼 내용(상태·면접 기록 답변 등)은 노션에 없어요. 다시 앱 저장소로 바꾸면 그 내용이 돌아와요.')) return;
  const r = await fetch('/api/data-source/switch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: 'notion' }) }); const j = await r.json().catch(() => ({}));
  if (!r.ok) { alert(j.error || '되돌리지 못했어요.'); return; } notionStatus = null; location.reload();
});
document.getElementById('lnToApp').addEventListener('click', async () => {
  if (!confirm('옮겨 둔 앱 저장소로 다시 바꿀까요? 노션에서 그 사이 바뀐 내용은 들어오지 않아요.')) return;
  const r = await fetch('/api/data-source/switch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: 'app' }) }); const j = await r.json().catch(() => ({}));
  if (!r.ok) { alert(j.error || '바꾸지 못했어요.'); return; } notionStatus = null; location.reload();
});
document.getElementById('lnStart').addEventListener('click', async () => {
  const btn = document.getElementById('lnStart'), prog = document.getElementById('lnProg');
  btn.disabled = true; prog.textContent = '노션에서 옮길 인원을 세는 중...';
  let pv = null; try { const r0 = await fetch('/api/data-source/preview'); pv = await r0.json().catch(() => null); if (!r0.ok) { prog.textContent = (pv && pv.error) || '노션을 읽지 못했어요.'; btn.disabled = false; return; } } catch { prog.textContent = '서버에 연결하지 못했어요.'; btn.disabled = false; return; }
  const by = Object.entries(pv.byStatus || {}).map(([k, v]) => `${k} ${v}명`).join(', ');
  prog.textContent = '';
  if (!confirm(`노션의 지원자 ${pv.people}명을 앱으로 옮길까요?\n(${by || '없음'})\n\n먼저 노션 워크스페이스 전체 내보내기로 백업했는지 확인해주세요.\n옮긴 뒤에는 앱 저장소만 써요. 노션 내용은 지우지 않고, 문제가 있으면 "노션으로 되돌리기"로 돌아갈 수 있어요.`)) { btn.disabled = false; return; }
  try {
    for (let i = 0; i < 400; i++) {
      const r = await fetch('/api/data-source/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); const d = await r.json().catch(() => ({}));
      if (!r.ok) { prog.textContent = d.error || '옮기지 못했어요. 다시 누르면 이어서 옮겨요.'; return; }
      prog.textContent = `옮기는 중... ${d.counts ? d.counts.pages : 0}명`;
      if (d.done) { prog.textContent = `다 옮겼어요: ${d.counts.pages}명, 면접 문항 표 ${d.counts.dbs}개, 서류 PDF ${d.counts.files || 0}개. 이제 노션 없이 동작해요.`; notionStatus = null; setTimeout(() => location.reload(), 1500); return; }
    }
  } catch { prog.textContent = '서버에 연결하지 못했어요. 다시 누르면 이어서 옮겨요.'; } finally { btn.disabled = false; }
});
async function openApplicantDetail(id) {
  const x = apList.find(v => v.id === id) || (apKanbanList || []).find(v => v.id === id) || (apMonthData && apMonthData.applicants.find(v => v.id === id)); if (!x) return;
  Object.assign(apd, { id, x, note: null, loading: true }); apd.dirty.clear();
  document.getElementById('apdTitle').textContent = `${x.name || '(이름 없음)'}${x.team ? ' · ' + x.team : ''}`;
  document.getElementById('apdStatus').textContent = x.status || '';
  document.getElementById('apdInfo').innerHTML = apdInfoHtml(x); document.getElementById('apdCard').textContent = '불러오는 중...'; document.getElementById('apdNotes').innerHTML = ''; document.getElementById('apdComments').innerHTML = ''; apdMsg('');
  const lead = ME.role === 'teamlead'; const note = document.getElementById('apdLeadNote'); note.hidden = !(lead || !apCanEdit()); note.textContent = lead ? `${(ME.teams || []).join('·')} 면접 대상자만 보여요. 면접 내용과 의견 댓글을 쓸 수 있어요.` : '보기 전용이에요(수정 권한이 없어요).';
  apdEl.hidden = false; document.body.classList.add('apd-open'); document.getElementById('apdClose').focus();
  apdIvUnmount(); document.getElementById('apdDocMsg').textContent = ''; document.getElementById('apdDocUpLabel').hidden = !(apCanEdit() || ME.role === 'teamlead');
  apdShowPane('notes'); document.getElementById('apdTaskTabSub').textContent = '';
  apdRenderActions(); apdLoadDocs(id); apdLoadTask(id); apdLoadScore(id);
  try { apd.note = await apdFetchNote(id); apdRenderNotes(); } catch (err) { apdMsg(err.message, 'err'); }
  apd.loading = false;
  try {   // 이력서 평가 요약·학력·경력은 노션 카드에서 읽어와요(못 읽어도 위의 정보와 면접 기록은 그대로 써요)
    const res = await fetch('/api/interview/card?applicantId=' + encodeURIComponent(id)); const j = await res.json().catch(() => ({}));
    if (apd.id !== id) return;
    const card = document.getElementById('apdCard');
    if (!res.ok) { card.textContent = j.error || '이력서 평가를 불러오지 못했어요.'; return; }
    const ap = j.applicant || {};
    card.innerHTML = [ap.education ? `<div><strong>학력</strong> ${escapeHtml(ap.education)}</div>` : '', ap.career ? `<div><strong>주요 경력</strong> ${escapeHtml(ap.career)}</div>` : '', ap.summary ? `<div class="apd-summary"><strong>평가 요약</strong><div>${escapeHtml(ap.summary)}</div></div>` : ''].join('') || '이력서 평가 내용이 없어요.';
  } catch { if (apd.id === id) document.getElementById('apdCard').textContent = '이력서 평가를 불러오지 못했어요.'; }
}
// 지원자 페이지 왼쪽: 이력서·포트폴리오·자격증 등 서류(누르면 원본 PDF가 새 창으로 열려요)
async function apdLoadDocs(id) {
  const box = document.getElementById('apdDocs'); box.textContent = '불러오는 중...';
  try {
    const r = await fetch('/api/applicants/' + encodeURIComponent(id) + '/docs'); const j = await r.json().catch(() => ({}));
    if (apd.id !== id) return;
    if (!r.ok) { box.textContent = j.error || '서류를 불러오지 못했어요.'; return; }
    const docs = j.docs || [];
    box.innerHTML = (j.note ? `<div class="manage-hint">${escapeHtml(j.note)}</div>` : '') + (docs.length ? `<ul class="apd-docs">${docs.map(d => `<li><span class="batch-kind">${escapeHtml(d.kind || '기타')}</span> ${d.hasFile ? `<a href="/api/applicants/${encodeURIComponent(id)}/docs/${encodeURIComponent(d.hash)}/file" target="_blank" rel="noopener">${escapeHtml(d.name)}</a>` : `${escapeHtml(d.name)} <span class="ap-sub">(원본 없음, 글자만)</span>`}</li>`).join('')}</ul>` : '아직 올린 서류가 없어요.') + (j.fileStore === 'none' ? '<div class="manage-hint">파일 창고(Vercel Blob)가 연결되지 않아 원본 PDF는 저장되지 않아요.</div>' : '');
  } catch { if (apd.id === id) box.textContent = '서버에 연결하지 못했어요.'; }
}
document.getElementById('apdDocUp').addEventListener('change', async e => {
  const files = [...e.target.files]; e.target.value = ''; if (!files.length || !apd.id) return; const id = apd.id; const msg = document.getElementById('apdDocMsg'); const out = [];
  for (const f of files) {
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { out.push(`${f.name}: PDF가 아니에요`); continue; }
    if (f.size > 4 * 1024 * 1024) { out.push(`${f.name}: 4MB 이하로 줄여주세요`); continue; }
    msg.textContent = `${f.name} 올리는 중...`;
    try { const r = await fetch('/api/applicants/' + encodeURIComponent(id) + '/docs?filename=' + encodeURIComponent(f.name), { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: f }); const j = await r.json().catch(() => ({})); out.push(`${f.name}: ${j.message || j.error || (r.ok ? '올렸어요' : '올리지 못했어요')}`); } catch { out.push(`${f.name}: 서버에 연결하지 못했어요`); }
  }
  if (apd.id !== id) return; msg.textContent = out.join(' / '); apdLoadDocs(id);
});
// 지원자 페이지 오른쪽: 채용과제(과제 고르기 → 과제 문자 쓰기, 보낸 날·마감·제출·평가 메모)
let apdTaskCur = null;
const isoDay = d => d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
async function apdLoadTask(id) {
  const box = document.getElementById('apdTask'); box.textContent = '불러오는 중...';
  const [tr, list] = await Promise.all([fetch('/api/applicants/' + encodeURIComponent(id) + '/task').then(r => r.json().then(j => ({ ok: r.ok, j }))).catch(() => ({ ok: false, j: {} })), loadTasks()]);
  if (apd.id !== id) return; if (!tr.ok) { box.textContent = tr.j.error || '채용과제를 불러오지 못했어요.'; return; }
  apdTaskCur = tr.j.task || {}; const t = apdTaskCur;
  document.getElementById('apdTaskTabSub').textContent = t.title ? ` · ${t.result || (t.dueAt ? `마감 ${t.dueAt.slice(5).replace('-', '/')}` : '진행 중')}` : '';   /* 탭에 과제 진행을 짧게 보여줘요 */ const lead = ME.role === 'teamlead'; const full = apCanEdit() && !lead; const can = full || lead;
  const dis = full ? '' : ' disabled';
  box.innerHTML = `<div class="task-row"><div class="field"><label for="apdTaskSel">과제</label><select id="apdTaskSel"${dis}><option value="">과제를 고르세요</option>${list.map(x => `<option value="${escapeHtml(x.id)}"${x.id === t.taskId ? ' selected' : ''}>${escapeHtml(x.title)}${x.team ? ' · ' + escapeHtml(x.team) : ''}</option>`).join('')}</select></div></div>
    <div class="field"><label for="apdTaskBody">과제 내용(문자의 [입력] 칸)</label><textarea id="apdTaskBody" rows="4"${dis}>${escapeHtml(t.body || '')}</textarea></div>
    <div class="task-row"><div class="field"><label for="apdTaskSent">보낸 날</label><input type="date" id="apdTaskSent" value="${escapeHtml(t.sentAt || '')}"${dis} /></div><div class="field"><label for="apdTaskDue">마감일</label><input type="date" id="apdTaskDue" value="${escapeHtml(t.dueAt || '')}"${dis} /></div><div class="field"><label for="apdTaskSub">제출일</label><input type="date" id="apdTaskSub" value="${escapeHtml(t.submittedAt || '')}"${can ? '' : ' disabled'} /></div><div class="field"><label for="apdTaskRes">진행</label><select id="apdTaskRes"${can ? '' : ' disabled'}>${['', '제출함', '미제출', '검토 완료'].map(v => `<option value="${v}"${(t.result || '') === v ? ' selected' : ''}>${v || '-'}</option>`).join('')}</select></div></div>
    <div class="field"><label for="apdTaskMemo">평가 메모(과제 결과물에 대한 의견만)</label><textarea id="apdTaskMemo" rows="3" maxlength="3000"${can ? '' : ' disabled'}>${escapeHtml(t.memo || '')}</textarea></div>
    <div class="task-actions">${can ? '<button type="button" id="apdTaskSave" class="add-btn">채용과제 저장</button> ' : ''}${full && canEdit('send') ? '<button type="button" id="apdTaskSms" class="link-btn">📨 과제 문자 쓰기</button> ' : ''}<span id="apdTaskMsg" class="ap-sub">${t.updatedAt ? `${escapeHtml(t.updatedBy || '')} · ${escapeHtml(apdWhen(t.updatedAt))}` : ''}</span></div>`;
}
document.getElementById('apdTask').addEventListener('change', e => {
  if (e.target.id !== 'apdTaskSel') return; const t = taskList.find(x => x.id === e.target.value); if (!t) return;
  document.getElementById('apdTaskBody').value = t.body;
  const today = new Date(); const due = new Date(today.getTime() + t.days * 86400000);
  if (!document.getElementById('apdTaskSent').value) document.getElementById('apdTaskSent').value = isoDay(today);
  document.getElementById('apdTaskDue').value = isoDay(due);
});
document.getElementById('apdTask').addEventListener('click', async e => {
  const id = apd.id; if (!id) return; const msg = document.getElementById('apdTaskMsg');
  if (e.target.id === 'apdTaskSave') {
    const lead = ME.role === 'teamlead'; const v = k => document.getElementById(k).value;
    const body = lead ? { submittedAt: v('apdTaskSub'), result: v('apdTaskRes'), memo: v('apdTaskMemo') } : { taskId: v('apdTaskSel'), body: v('apdTaskBody'), sentAt: v('apdTaskSent'), dueAt: v('apdTaskDue'), submittedAt: v('apdTaskSub'), result: v('apdTaskRes'), memo: v('apdTaskMemo') };
    body.expectedAt = (apdTaskCur && apdTaskCur.updatedAt) || '';
    const r = await fetch('/api/applicants/' + encodeURIComponent(id) + '/task', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({}));
    if (!r.ok) { msg.textContent = j.error || '저장하지 못했어요.'; return; }
    apdTaskCur = j.task; msg.textContent = '저장했어요.'; const tt = apdTaskCur; document.getElementById('apdTaskTabSub').textContent = tt.title ? ` · ${tt.result || (tt.dueAt ? `마감 ${tt.dueAt.slice(5).replace('-', '/')}` : '진행 중')}` : '';
  }
  if (e.target.id === 'apdTaskSms') {   // 채용과제 문자(t5)를 골라 이름·연락처·마감일을 채우고 [입력] 칸에 과제 내용을 넣어요(문자는 직접 확인하고 보내요)
    const x = apd.x; const body = document.getElementById('apdTaskBody').value.trim(); const due = document.getElementById('apdTaskDue').value;
    if (!body) { msg.textContent = '과제 내용을 먼저 넣어주세요.'; return; }
    try { await loadTemplates(); } catch { /* 아래에서 안내 */ }   // 문자 양식을 최신으로 불러온 뒤 골라요
    const tpl = [...templateSelect.options].find(o => o.value === 't5') || [...templateSelect.options].find(o => o.textContent.includes('채용과제'));
    if (!tpl) { msg.textContent = '문자 양식에 "채용과제"가 없어요. 양식 관리에서 확인해주세요.'; return; }
    if (!apdClose()) return;
    fillSendFormFromNotion({ id: x.id, name: x.name, phone: x.phone, team: x.team, job: x.job, status: x.status, interview1: '', interview2: '', smsStatus: '' });
    try { await loadTemplates(); } catch { /* 위에서 이미 불러왔어요 */ }   // 탭을 바꾸며 다시 불러오는 양식이 끝난 뒤에 골라요
    templateSelect.value = tpl.value; previewEdited = false; previewResetBtn.hidden = true; updateDateFieldVisibility();
    if (due) { const d = new Date(due + 'T00:00:00+09:00'); dateInput.value = `${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})`; }
    validate(); await updatePreview();
    const put = () => { if (previewText.value.includes('[입력]')) { previewText.value = previewText.value.replace('[입력]', body); previewEdited = true; previewResetBtn.hidden = false; charCount.textContent = `${previewText.value.length}자`; validate(); } };
    put(); setTimeout(put, 700); setTimeout(put, 1600);   // 앞서 시작된 미리보기 갱신이 늦게 끝나 덮어써도 다시 넣어요
  }
});
// 지원자 페이지 오른쪽 탭: 면접 기록 / 질문·답변 / 채용과제
function apdShowPane(name) {
  apdEl.querySelectorAll('.apd-tab').forEach(b => { const on = b.dataset.pane === name; b.classList.toggle('active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
  apdEl.querySelectorAll('.apd-pane').forEach(p => { p.hidden = p.dataset.pane !== name; });
}
apdEl.querySelector('.apd-tabs').addEventListener('click', e => { const b = e.target.closest('.apd-tab'); if (b) apdShowPane(b.dataset.pane); });
// 지원자 페이지 머리: 면접상태 바꾸기 · 📨 문자 · 📅 일정(이 페이지에서 다음 단계로 바로 넘어가요)
function apdRenderActions() {
  const box = document.getElementById('apdActions'); const x = apd.x; if (!x) { box.innerHTML = ''; return; }
  if (!apCanEdit() || ME.role === 'teamlead') { box.innerHTML = ''; document.getElementById('apdStatus').textContent = x.status || ''; return; }
  document.getElementById('apdStatus').textContent = '';
  const sts = ((apOptions && apOptions.statuses) || AP_VISIBLE).slice(); if (x.status && !sts.includes(x.status)) sts.unshift(x.status);
  box.innerHTML = `<label class="apd-st-label">면접상태 <select id="apdStatusSel" aria-label="면접상태">${sts.map(s => `<option${s === x.status ? ' selected' : ''}>${escapeHtml(s)}</option>`).join('')}</select></label>${canEdit_('send') ? ' <button type="button" id="apdSmsBtn" class="add-btn">📨 문자</button>' : ''}${canEdit_('schedule') ? ' <button type="button" id="apdSchBtn" class="link-btn">📅 일정</button>' : ''}`;
}
document.getElementById('apdActions').addEventListener('change', async e => {
  if (e.target.id !== 'apdStatusSel' || !apd.x) return; const sel = e.target; const x = apd.x; const next = sel.value;
  if (next === '탈락 확정' && !confirm(`${x.name || '이 지원자'} 님을 "탈락 확정"으로 바꿀까요? (탈락은 사람이 정하는 거예요)\n탈락 확정이 되면 앱 목록에서는 보이지 않아요.`)) { sel.value = x.status; return; }
  sel.disabled = true;
  try { if (!apList.some(v => v.id === x.id)) apList.push(x); const nx = await apSave(x.id, { status: next }); apd.x = { ...x, ...nx }; apdMsg(`면접상태를 "${next}"로 바꿨어요.`, 'ok'); apReloadView(); }
  catch (err) { sel.value = x.status; apdMsg(err.message || '저장하지 못했어요.', 'err'); }
  finally { sel.disabled = false; apdRenderActions(); }
});
document.getElementById('apdActions').addEventListener('click', e => {
  const x = apd.x; if (!x) return;
  if (e.target.id === 'apdSmsBtn') { if (!apdClose()) return; fillSendFormFromNotion({ id: x.id, name: x.name, phone: x.phone, team: x.team, job: x.job, status: x.status, interview1: x.interview1 || '', interview2: x.interview2 || '', smsStatus: x.smsStatus || '' }); }
  if (e.target.id === 'apdSchBtn') { if (!apdClose()) return; fillScheduleFormFromNotion(x); }
});
// 지원자 페이지 오른쪽: 면접 평가표(내 평가 쓰기 + 면접관 모두의 평가·평균)
let apdScoreData = null;
async function apdLoadScore(id) {
  const box = document.getElementById('apdScore'); box.textContent = '불러오는 중...';
  let r, j; try { r = await fetch('/api/applicants/' + encodeURIComponent(id) + '/scorecards'); j = await r.json().catch(() => ({})); } catch { if (apd.id === id) box.textContent = '서버에 연결하지 못했어요.'; return; }
  if (apd.id !== id) return; if (!r.ok) { box.textContent = j.error || '면접 평가를 불러오지 못했어요.'; return; }
  apdScoreData = j; apdRenderScore();
}
function apdRenderScore() {
  const d = apdScoreData; if (!d) return; const box = document.getElementById('apdScore'); const can = apCanEdit() || ME.role === 'teamlead';
  const round = (document.getElementById('apdScoreRound') || {}).value || (apd.x && apd.x.status === '2차 면접 예정' ? '2차' : '1차');
  const mine = d.cards.find(c => c.mine && c.round === round);
  const radios = it => [1, 2, 3, 4, 5].map(n => `<label class="sc-pt"><input type="radio" name="sc-${it.key}" value="${n}"${mine && mine.scores[it.key] === n ? ' checked' : ''}${can ? '' : ' disabled'} /><span>${n}</span></label>`).join('');
  const sumHtml = Object.keys(d.summary).length ? d.rounds.filter(r => d.summary[r]).map(r => { const s = d.summary[r]; return `<div class="sc-sum"><strong>${r} 면접</strong> 평균 <b class="sc-avg">${s.overall ?? '-'}</b>/5 · 면접관 ${s.count}명 · ${Object.entries(s.verdicts).map(([k, v]) => `${escapeHtml(k)} ${v}`).join(' · ')}<div class="sc-bars">${d.items.map(it => `<span>${escapeHtml(it.label)} ${s.avg[it.key] ?? '-'}</span>`).join('')}</div></div>`; }).join('') : '<p class="ap-sub">아직 면접 평가가 없어요.</p>';
  const list = d.cards.length ? `<table class="history-table stack-table sc-table"><thead><tr><th>면접관</th><th>차수</th>${d.items.map(it => `<th>${escapeHtml(it.label)}</th>`).join('')}<th>추천</th><th>한 줄 평</th></tr></thead><tbody>${d.cards.map(c => `<tr><td data-label="면접관">${escapeHtml(c.name || '')}${c.mine ? ' <span class="ap-sub">(나)</span>' : ''}</td><td data-label="차수">${escapeHtml(c.round)}</td>${d.items.map(it => `<td data-label="${escapeHtml(it.label)}">${c.scores[it.key]}</td>`).join('')}<td data-label="추천">${escapeHtml(c.verdict)}</td><td data-label="한 줄 평">${escapeHtml(c.comment || '')}</td></tr>`).join('')}</tbody></table>` : '';
  box.innerHTML = `<div class="sc-summaries">${sumHtml}</div>${list}` + (can ? `<div class="sc-form"><h4>내 평가 ${mine ? '<span class="ap-sub">(저장된 평가를 고쳐요)</span>' : ''}</h4>
    <div class="field"><label for="apdScoreRound">면접 차수</label><select id="apdScoreRound">${d.rounds.map(r => `<option${r === round ? ' selected' : ''}>${r}</option>`).join('')}</select></div>
    ${d.items.map(it => `<div class="sc-row"><div class="sc-label"><strong>${escapeHtml(it.label)}</strong><span class="ap-sub">${escapeHtml(it.hint)}</span></div><div class="sc-pts" role="radiogroup" aria-label="${escapeHtml(it.label)}">${radios(it)}</div></div>`).join('')}
    <div class="field"><label for="apdScoreVerdict">추천 의견</label><select id="apdScoreVerdict"><option value="">고르세요</option>${d.verdicts.map(v => `<option${mine && mine.verdict === v ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
    <div class="field"><label for="apdScoreComment">한 줄 평(관찰한 행동과 근거)</label><textarea id="apdScoreComment" rows="2" maxlength="1000">${escapeHtml(mine ? mine.comment || '' : '')}</textarea></div>
    <div class="task-actions"><button type="button" id="apdScoreSave" class="add-btn">평가 저장</button>${mine ? ' <button type="button" id="apdScoreDel" class="link-btn">내 평가 지우기</button>' : ''} <span id="apdScoreMsg" class="ap-sub"></span></div>
    <p class="manage-hint">점수는 검토 참고용이에요. 합격·불합격은 사람이 정해요. 나이·가족·외모 같은 내용은 평가에 쓰지 않아요.</p></div>` : '');
}
document.getElementById('apdScore').addEventListener('change', e => { if (e.target.id === 'apdScoreRound') apdRenderScore(); });
document.getElementById('apdScore').addEventListener('click', async e => {
  const id = apd.id; if (!id) return; const msg = () => document.getElementById('apdScoreMsg');
  if (e.target.id === 'apdScoreSave') {
    const scores = {}; for (const it of apdScoreData.items) { const c = document.querySelector(`#apdScore input[name="sc-${it.key}"]:checked`); if (!c) { msg().textContent = `"${it.label}" 점수를 골라주세요.`; return; } scores[it.key] = Number(c.value); }
    const body = { round: document.getElementById('apdScoreRound').value, scores, verdict: document.getElementById('apdScoreVerdict').value, comment: document.getElementById('apdScoreComment').value };
    const r = await fetch('/api/applicants/' + encodeURIComponent(id) + '/scorecards', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({}));
    if (!r.ok) { msg().textContent = j.error || '저장하지 못했어요.'; return; }
    await apdLoadScore(id); const m = document.getElementById('apdScoreMsg'); if (m) m.textContent = '저장했어요.';
  }
  if (e.target.id === 'apdScoreDel') {
    if (!confirm('내 면접 평가를 지울까요?')) return; const round = document.getElementById('apdScoreRound').value;
    const r = await fetch('/api/applicants/' + encodeURIComponent(id) + '/scorecards/' + encodeURIComponent(round), { method: 'DELETE' });
    if (r.ok) apdLoadScore(id); else msg().textContent = '지우지 못했어요.';
  }
});
// 지원자 페이지 오른쪽: 면접 질문 추천·답변 적기(면접 관리의 질문·답변 화면을 이 페이지 안에 열어요)
let apdIv = null;
function apdIvUnmount() { if (apdIv && ivPanel === apdIv) ivPanel = null; apdIv = null; document.getElementById('apdIvHost').innerHTML = ''; document.getElementById('apdIvOpen').hidden = false; }
document.getElementById('apdIvOpen').addEventListener('click', () => {
  if (!apd.x) return; if (interviewDirty() && ivPanel !== apdIv && !confirm('면접 관리 화면에 보내지 않은 답변이 있어요. 여기서 새로 열면 그 답변이 사라져요.\n\n그래도 열까요?')) return;
  document.getElementById('apdIvOpen').hidden = true;
  apdIv = mountInterviewPanel(document.getElementById('apdIvHost'), { preset: apd.x, onClose: () => apdIvUnmount() }); ivPanel = apdIv;
});
function apdClose(force) {
  if (!force && apd.dirty.size && !confirm('저장하지 않은 내용이 있어요. 그래도 닫을까요?')) return false;
  if (!force && apdIv && apdIv.isDirty() && !confirm('보내지 않은 면접 답변이 있어요. 닫으면 사라져요. 그래도 닫을까요?')) return false;
  apdIvUnmount();
  apdEl.hidden = true; document.body.classList.remove('apd-open'); apd.id = ''; apd.dirty.clear(); return true;
}
async function apdSave(sec) {
  const ta = document.getElementById('apd-' + sec); if (!ta || !apd.id) return; const btn = apdEl.querySelector(`.apd-save[data-sec="${sec}"]`); btn.disabled = true; apdMsg('저장하는 중...');
  try {
    const cur = apd.note && apd.note[sec];
    const res = await fetch('/api/interview-notes/' + encodeURIComponent(apd.id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section: sec, text: ta.value, expectedAt: (cur && cur.at) || '' }) });
    const j = await res.json().catch(() => ({}));
    if (res.status === 409) { apdMsg(j.error || '다른 사람이 먼저 고쳤어요. 아무것도 덮어쓰지 않았어요.', 'err'); return; }
    if (!res.ok) { apdMsg(j.error || '저장하지 못했어요.', 'err'); return; }
    const keep = {}; apdEl.querySelectorAll('.apd-section textarea').forEach(t => { if (t.dataset.sec !== sec && apd.dirty.has(t.dataset.sec)) keep[t.dataset.sec] = t.value; });
    apd.note = j.note; apdRenderNotes();
    Object.entries(keep).forEach(([k, v]) => { const t = document.getElementById('apd-' + k); if (t) { t.value = v; apd.dirty.add(k); } });   // 저장하지 않은 다른 칸의 글은 지켜요
    apdMsg(ta.value.trim() ? '저장했어요.' : '내용을 비워서 이 칸을 지웠어요.', 'ok');
  } catch { apdMsg('서버에 연결하지 못했어요.', 'err'); } finally { btn.disabled = false; }
}
async function apdAddComment() {
  const ta = document.getElementById('apdCommentText'); const text = ta.value.trim(); if (!text || !apd.id) { apdMsg('댓글 내용을 입력해주세요.', 'err'); return; }
  const btn = document.getElementById('apdCommentBtn'); btn.disabled = true;
  try {
    const res = await fetch('/api/interview-notes/' + encodeURIComponent(apd.id) + '/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
    const j = await res.json().catch(() => ({})); if (!res.ok) { apdMsg(j.error || '댓글을 쓰지 못했어요.', 'err'); return; }
    const keep = {}; apdEl.querySelectorAll('.apd-section textarea').forEach(t => { if (apd.dirty.has(t.dataset.sec)) keep[t.dataset.sec] = t.value; });
    apd.note = j.note; apdRenderNotes(); ta.value = '';
    Object.entries(keep).forEach(([k, v]) => { const t = document.getElementById('apd-' + k); if (t) { t.value = v; apd.dirty.add(k); } });
    apdMsg('댓글을 남겼어요.', 'ok');
  } catch { apdMsg('서버에 연결하지 못했어요.', 'err'); } finally { btn.disabled = false; }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-open-detail]'); if (b) { e.stopPropagation(); openApplicantDetail(b.dataset.openDetail); } });
apdEl.addEventListener('click', async e => {
  if (e.target.closest('#apdClose') || e.target.dataset.close) { apdClose(); return; }
  const s = e.target.closest('.apd-save'); if (s) { apdSave(s.dataset.sec); return; }
  if (e.target.closest('#apdCommentBtn')) { apdAddComment(); return; }
  if (e.target.closest('#apdDeleteAll')) {
    if (!confirm('이 지원자의 면접 기록(1차·2차 면접 내용, 종합 의견, 의견 댓글)을 모두 지울까요?\n\n지우면 되돌릴 수 없어요.')) return;
    const res = await fetch('/api/interview-notes/' + encodeURIComponent(apd.id), { method: 'DELETE' }); const j = await res.json().catch(() => ({}));
    if (res.ok) { apd.note = { id: apd.id, team: '', r1: null, r2: null, opinion: null, comments: [] }; apdRenderNotes(); apdMsg('이 지원자의 면접 기록을 모두 지웠어요.', 'ok'); } else apdMsg(j.error || '지우지 못했어요.', 'err');
    return;
  }
  const d = e.target.closest('.apd-cdel'); if (d) {
    if (!confirm('이 댓글을 지울까요?')) return;
    const res = await fetch('/api/interview-notes/' + encodeURIComponent(apd.id) + '/comments/' + encodeURIComponent(d.dataset.cid), { method: 'DELETE' }); const j = await res.json().catch(() => ({}));
    if (res.ok) { apd.note = j.note; apdRenderNotes(); apdMsg('댓글을 지웠어요.', 'ok'); } else apdMsg(j.error || '지우지 못했어요.', 'err');
  }
});
apdEl.addEventListener('input', e => { const t = e.target.closest('.apd-section textarea'); if (t) apd.dirty.add(t.dataset.sec); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !apdEl.hidden) { e.preventDefault(); apdClose(); } });

function apRowHtml(x) {
  const rec = AP_REC[x.recommendation];
  const canEdit = apCanEdit();
  const statuses = (apOptions && apOptions.statuses) || [];
  const statusCell = canEdit
    ? `<select class="ap-status" data-id="${escapeHtml(x.id)}" aria-label="면접상태">${(statuses.includes(x.status) || !x.status ? '' : `<option value="${escapeHtml(x.status)}">${escapeHtml(x.status)}</option>`)}<option value=""${x.status ? '' : ' selected'}>(없음)</option>${statuses.map(s => `<option value="${escapeHtml(s)}"${s === x.status ? ' selected' : ''}>${escapeHtml(s)}</option>`).join('')}</select>`
    : escapeHtml(x.status || '-');
  return `<tr class="ap-row" data-id="${escapeHtml(x.id)}">
    <td data-label="이름"><button type="button" class="ap-name-link" data-open-detail="${escapeHtml(x.id)}" title="누르면 지원자 정보와 면접 기록이 열려요"><strong>${escapeHtml(x.name || '(이름 없음)')}</strong></button>${x.phone ? `<span class="ap-sub">${escapeHtml(x.phone)}</span>` : ''}${apAmbiguousNote(x)}</td>
    <td data-label="팀 · 직무">${escapeHtml(x.team || '-')}${x.job ? `<span class="ap-sub">${escapeHtml(x.job)}</span>` : ''}</td>
    <td data-label="면접상태">${statusCell}${x.smsStatus ? `<span class="ap-sub">문자: ${escapeHtml(x.smsStatus)}</span>` : ''}</td>
    <td data-label="1차 면접">${escapeHtml(apFmtWhen(x.interview1))}${apSchedBadge(x, '1차')}</td>
    <td data-label="2차 면접">${escapeHtml(apFmtWhen(x.interview2))}${apSchedBadge(x, '2차')}</td>
    <td data-label="점수 · 추천">${x.score === null || x.score === undefined ? '-' : escapeHtml(String(x.score))}${rec ? ` <span class="ap-rec ${rec[1]}">${rec[0]}</span>` : ''}</td>
    <td data-label="">${canEdit ? '<button type="button" class="link-btn ap-edit-btn">수정</button> ' : ''}${AP_ACTIVE.includes(x.status) && canEdit && canEdit_('send') ? '<button type="button" class="add-btn ap-sms-btn">📨 면접 문자</button> ' : ''}${AP_ACTIVE.includes(x.status) && canEdit && canEdit_('schedule') ? '<button type="button" class="link-btn ap-sch-btn">📅 일정</button> ' : ''}<button type="button" class="add-btn ap-iq-btn" title="맞춤 면접 질문을 만들고 답변·점수를 적어 노션에 전송해요">면접 질문·답변</button> <a class="link-btn" href="${escapeHtml(x.url || '#')}" target="_blank" rel="noopener">노션</a></td>
  </tr>`;
}
function apRender() {
  apBody.innerHTML = apList.length ? apList.map(apRowHtml).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--muted,#6b6558)">조건에 맞는 지원자가 없어요.</td></tr>';
  document.getElementById('apCount').textContent = apList.length ? `${apList.length}명을 보고 있어요${apCursor ? ' (아래 "더 보기"로 이어서 볼 수 있어요)' : ''}.` : '';
  apMore.hidden = !apCursor;
}
function apEditorHtml(x) {
  const sms = (apOptions && apOptions.smsStatuses) || [];
  return `<tr class="ap-edit" data-id="${escapeHtml(x.id)}"><td colspan="7">
    <p class="manage-hint" style="margin:0 0 6px">면접 일정을 확인하고 문자를 보내 지원자와 시간이 정해지면, 일시를 입력하고 <strong>"1차(2차) 면접 확정"</strong>을 눌러주세요. 면접상태와 문자 안내("면접 확정")가 노션에 함께 저장돼요.</p>
    <div class="ap-edit-grid">
      <div><label>1차 면접 일시</label><input type="datetime-local" class="ap-i1" value="${apToLocalInput(x.interview1)}" /></div>
      <div><label>2차 면접 일시</label><input type="datetime-local" class="ap-i2" value="${apToLocalInput(x.interview2)}" /></div>
      <div><label>면접 문자 안내</label><select class="ap-sms"><option value="">(없음)</option>${sms.map(s => `<option value="${escapeHtml(s)}"${s === x.smsStatus ? ' selected' : ''}>${escapeHtml(s)}</option>`).join('')}</select></div>
      <div><label>입사일</label><input type="date" class="ap-hire" value="${escapeHtml((x.hireDate || '').slice(0, 10))}" /></div>
      <div class="ap-edit-wide"><label>면접 안내 관련 메모 (노션의 같은 칸에 저장돼요)</label><textarea class="ap-memo" rows="3" maxlength="1900">${escapeHtml(x.memo || '')}</textarea></div>
    </div>
    <div class="ap-edit-actions"><button type="button" class="add-btn ap-save">노션에 저장</button><button type="button" class="add-btn ap-confirm1" title="1차 면접 일시를 입력한 뒤 눌러주세요">✅ 1차 면접 확정</button><button type="button" class="add-btn ap-confirm2" title="2차 면접 일시를 입력한 뒤 눌러주세요">✅ 2차 면접 확정</button><button type="button" class="link-btn ap-cancel">닫기</button><span class="status ap-edit-msg"></span></div>
  </td></tr>`;
}

async function apFetch(path, opts) {
  const res = await fetch(path, opts);
  const data = await readJsonOrNull(res);
  if (!data) throw new Error('서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
  if (!res.ok) { const e = new Error(data.error || '요청 실패'); e.status = res.status; e.data = data; throw e; }
  return data;
}
async function loadApplicants(reset) {
  if (apLoading) return;
  apLoading = true;
  try {
    const st = await ensureNotionStatus(!(notionStatus && notionStatus.configured));
    if (!st || !st.configured) {
      apNotice.hidden = false; apNotice.textContent = (st && st.message) || '노션 연결을 확인하지 못했어요.';
      apList = []; apCursor = ''; apRender(); return;
    }
    apNotice.hidden = true;
    if (!apOptions || reset && !apOptions.statuses) apOptions = st.options || {};
    if (!apStatus.options.length) {
      const sts = (st.options && st.options.statuses) || [];
      apStatus.innerHTML = `<option value="active">진행 중 (서류합격~2차 면접)</option><option value="all">전체</option>` + sts.filter(s => AP_VISIBLE.includes(s)).map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
      apFillTeamOptions();   // 팀 선택은 앱의 공식 11개 팀만(노션에 남은 옛 팀 선택지는 숨겨요)
      apOptions = st.options || {};
      const link = document.getElementById('apNotionLink');
      if (st.database && st.database.url) { link.href = st.database.url; link.hidden = false; }
    }
    const qs = new URLSearchParams({ status: apStatus.value || 'active', team: apTeam.value || '', q: apSearch.value.trim(), pageSize: '50' });
    if (!reset && apCursor) qs.set('cursor', apCursor);
    setApMsg('노션에서 불러오는 중...');
    qs.set('schedule', '1');   // 문자 보내기의 면접 일정과 짝지은 결과도 같이 받음
    const data = await apFetch('/api/notion/applicants?' + qs.toString());
    apScheduleChecked = data.scheduleChecked === true;
    apList = reset ? data.applicants : apList.concat(data.applicants);
    apCursor = data.nextCursor || '';
    apLoadedAt = Date.now();
    apRender();
    setApMsg('');
  } catch (err) {
    setApMsg(err.message || '불러오는 중 오류가 발생했어요.', 'err');
  } finally { apLoading = false; }
}
function apReplace(applicant) {
  const i = apList.findIndex(x => x.id === applicant.id);
  if (i >= 0) apList[i] = { ...applicant, scheduleCheck: applicant.scheduleCheck || apList[i].scheduleCheck };
}
// 노션을 저장한 뒤에는 그 사람의 일정 비교를 다시 계산해서 줄을 갱신
async function apRefreshSchedule(id) {
  if (!apScheduleChecked) return;
  const x = apList.find(v => v.id === id);
  if (!x) return;
  try {
    const qs = new URLSearchParams({ status: 'all', q: x.name || '', pageSize: '100', schedule: '1' });
    const data = await apFetch('/api/notion/applicants?' + qs.toString());
    const fresh = data.applicants.find(v => v.id === id);
    if (fresh) { const i = apList.findIndex(v => v.id === id); apList[i] = fresh; }
  } catch { /* 일정 비교를 못 새로 읽어도 저장은 이미 끝났으니 조용히 넘어감 */ }
}
async function apSave(id, body, msgEl) {
  const x = apList.find(v => v.id === id);
  try {
    const data = await apFetch('/api/notion/applicants/' + encodeURIComponent(id), {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, expectedEditedAt: x ? x.editedAt : '' }),
    });
    apReplace(data.applicant);
    await apRefreshSchedule(id);   // 노션 값이 바뀌었으니 문자 보내기의 면접 일정과 맞는지 다시 계산(상태 변경·면접 확정·맞추기 모두 여기를 지나요)
    return apList.find(v => v.id === id) || data.applicant;
  } catch (err) {
    if (err.status === 409 && err.data && err.data.applicant) { apReplace(err.data.applicant); await apRefreshSchedule(id); }
    throw err;
  }
}
function apFlashRow(id) {
  const tr = apBody.querySelector(`tr.ap-row[data-id="${id}"]`);
  if (tr) { tr.classList.add('ap-row-ok'); setTimeout(() => tr.classList.remove('ap-row-ok'), 1500); }
}

apBody.addEventListener('change', async e => {
  const sel = e.target.closest('select.ap-status');
  if (!sel) return;
  const id = sel.dataset.id;
  const x = apList.find(v => v.id === id);
  if (!x) return;
  const next = sel.value;
  if (!next) { sel.value = x.status; setApMsg('면접상태를 비울 수는 없어요. 노션에서 직접 지워주세요.', 'err'); return; }
  if (next === '탈락 확정' && !confirm(`${x.name || '이 지원자'} 님을 "탈락 확정"으로 바꿀까요?\n노션에도 바로 반영돼요. (탈락은 사람이 정하는 거예요)`)) { sel.value = x.status; return; }
  sel.disabled = true;
  try {
    await apSave(id, { status: next });
    apRender();
    apFlashRow(id);
    setApMsg(`${x.name || '지원자'} 님의 면접상태를 "${next}"로 바꿔 노션에 저장했어요.`, 'ok');
  } catch (err) {
    apRender();
    setApMsg(err.message || '저장하지 못했어요.', 'err');
  }
});
apBody.addEventListener('click', async e => {
  const tr = e.target.closest('tr');
  if (!tr) return;
  const id = tr.dataset.id;
  if (e.target.closest('.ap-edit-btn')) {
    const open = apBody.querySelector(`tr.ap-edit[data-id="${id}"]`);
    if (open) { open.remove(); return; }
    const x = apList.find(v => v.id === id);
    if (!x) return;
    tr.insertAdjacentHTML('afterend', apEditorHtml(x));
    return;
  }
  if (e.target.closest('.ap-cancel')) { tr.remove(); return; }
  if (e.target.closest('.ap-iq-btn')) {
    const x = apList.find(v => v.id === id); if (!x) return;
    if (interviewDirty() && !confirm('보내지 않은 답변이 있어요. 다른 지원자를 고르면 작성한 답변이 사라져요.\n\n그래도 바꿀까요?')) return;
    openInterviewFor(x); return;
  }
  if (e.target.closest('.ap-sms-btn') || e.target.closest('.ap-sch-btn')) {
    const x = apList.find(v => v.id === id);
    if (!x) return;
    if (e.target.closest('.ap-sms-btn')) fillSendFormFromNotion(x); else fillScheduleFormFromNotion(x);
    return;
  }
  const confirmRound = e.target.closest('.ap-confirm1') ? 1 : (e.target.closest('.ap-confirm2') ? 2 : 0);
  if (e.target.closest('.ap-save') || confirmRound) {
    const x = apList.find(v => v.id === id);
    const msg = tr.querySelector('.ap-edit-msg');
    const orig = { i1: apToLocalInput(x.interview1), i2: apToLocalInput(x.interview2), sms: x.smsStatus || '', hire: (x.hireDate || '').slice(0, 10), memo: x.memo || '' };
    const cur = { i1: tr.querySelector('.ap-i1').value, i2: tr.querySelector('.ap-i2').value, sms: tr.querySelector('.ap-sms').value, hire: tr.querySelector('.ap-hire').value, memo: tr.querySelector('.ap-memo').value.trim() };
    const body = {};
    if (cur.i1 !== orig.i1) body.interview1 = cur.i1;       // 바꾼 칸만 보냄: 건드리지 않은 날짜는 노션에서 그대로 유지
    if (cur.i2 !== orig.i2) body.interview2 = cur.i2;
    if (cur.sms !== orig.sms) body.smsStatus = cur.sms;
    if (cur.hire !== orig.hire) body.hireDate = cur.hire;
    if (cur.memo !== orig.memo.trim()) body.memo = cur.memo;
    if (confirmRound) {
      const when = confirmRound === 1 ? cur.i1 : cur.i2;
      if (!when) { msg.textContent = `${confirmRound}차 면접 일시를 먼저 입력해주세요.`; msg.className = 'status err ap-edit-msg'; return; }
      const label = confirmRound === 1 ? '1차 면접 예정자' : '2차 면접 예정';
      if (!confirm(`${x.name || '이 지원자'} 님의 ${confirmRound}차 면접을 ${apFmtWhen(when)}로 확정할까요?\n노션에 면접상태 "${label}", 면접 문자 안내 "면접 확정"으로 저장돼요.`)) return;
      body[confirmRound === 1 ? 'interview1' : 'interview2'] = when;
      body.status = label;
      body.smsStatus = '면접 확정';
    } else if (!Object.keys(body).length) { msg.textContent = '바꾼 내용이 없어요.'; msg.className = 'status ap-edit-msg'; return; }
    const btns = tr.querySelectorAll('.ap-save, .ap-confirm1, .ap-confirm2'); btns.forEach(b => { b.disabled = true; }); msg.textContent = '노션에 저장하는 중...'; msg.className = 'status ap-edit-msg';
    try {
      await apSave(id, body);
      apRender();
      apFlashRow(id);
      setApMsg(confirmRound ? `${x.name || '지원자'} 님의 ${confirmRound}차 면접을 확정해 노션에 저장했어요. (면접 일정 탭에도 등록하려면 줄의 "📅 일정"을 눌러주세요)` : `${x.name || '지원자'} 님의 정보를 노션에 저장했어요.`, 'ok');
    } catch (err) {
      btns.forEach(b => { b.disabled = false; });
      msg.textContent = err.message || '저장하지 못했어요.'; msg.className = 'status err ap-edit-msg';
      if (err.status === 409) { apRender(); setApMsg(err.message, 'err'); }
    }
  }
});
// 일정 ↔ 노션 맞추기: 어느 쪽으로 맞출지 사람이 고르고, 양쪽 값을 보여주는 확인창을 거침
apBody.addEventListener('click', async e => {
  const btn = e.target.closest('.ap-sch-fix');
  if (!btn) return;
  const tr = btn.closest('tr'); const id = tr.dataset.id;
  const x = apList.find(v => v.id === id);
  if (!x || !x.scheduleCheck) return;
  const round = btn.dataset.round; const dir = btn.dataset.dir;
  const r = (x.scheduleCheck.rows || []).find(v => v.round === round);
  if (!r) return;
  const who = x.name || '이 지원자';
  const warn = x.scheduleCheck.how === 'nameTeam' ? '\n(주의: 연락처가 달라서 이름과 팀만 보고 짝지은 일정이에요. 같은 사람이 맞는지 먼저 확인하세요.)' : '';
  btn.disabled = true;
  try {
    if (dir === 'toSchedule') {
      if (r.notionAt.length < 16) { setApMsg('노션에 시간이 없어서(날짜만 있어요) 일정의 시간을 바꿀 수 없어요. 노션에 시간을 먼저 입력하세요.', 'err'); return; }   // 바꿀 수 없으면 확인창을 띄우기 전에 알림
      if (!confirm(`${who} 님의 ${round} 면접 일정을 노션에 맞춰 바꿀까요?\n일정(문자 보내기) ${apFmtWhen(r.scheduleAt)} → ${apFmtWhen(r.notionAt)}\n일정의 변경 이력에 기록돼요.${warn}`)) return;
      const res = await fetch(`/api/schedules/${encodeURIComponent(r.scheduleId)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interviewAt: r.notionAt, reason: '면접 관리에서 노션 일시에 맞춤' }) });
      const d = await readJsonOrNull(res);
      if (!res.ok) throw new Error((d && d.error) || '일정을 바꾸지 못했어요.');
      await apRefreshSchedule(id); apRender(); apFlashRow(id);
      setApMsg(`${who} 님의 ${round} 면접 일정(문자 보내기)을 ${apFmtWhen(r.notionAt)}로 맞췄어요.`, 'ok');
    } else {
      const body = round === '1차' ? { interview1: r.scheduleAt } : { interview2: r.scheduleAt };
      if (!confirm(`${who} 님의 ${round} 면접일을 일정(문자 보내기)에 맞춰 노션에 바꿀까요?\n노션 ${r.notionAt ? apFmtWhen(r.notionAt) : '(없음)'} → ${apFmtWhen(r.scheduleAt)}${warn}`)) return;
      await apSave(id, body);
      apRender(); apFlashRow(id);
      setApMsg(`${who} 님의 ${round} 면접일을 일정(${apFmtWhen(r.scheduleAt)})에 맞춰 노션에 저장했어요.`, 'ok');
    }
  } catch (err) {
    if (err.status === 409) { apRender(); }
    setApMsg(err.message || '맞추지 못했어요.', 'err');
  } finally { btn.disabled = false; }
});
document.getElementById('apRefresh').addEventListener('click', apReloadView);   // 지금 보고 있는 보기를 다시 불러와요
// ---------- 면접 일정 보기 (월별 · 팀별) ----------
// 한 달에 있는 면접(1차·2차)을 날짜순으로 모아, 팀별로 묶어서 보여줘요. 점수·추천·전화번호는 이 보기에서 보여주지 않아요.
let apView = 'list'; let apMonthData = null;
const AP_OFFICIAL_TEAMS = ['경영지원팀', '그로잉업팀', '글로벌비즈니스팀', '마케팅팀', '브이팀', '온라인팀', '와우서비스팀', '제품디자인팀', '제품생산팀', 'FC팀', 'SCM팀'];
const apMonthEl = document.getElementById('apMonth'), apMonthBody = document.getElementById('apMonthBody'), apMonthBar = document.getElementById('apMonthBar');
const apTodayMonth = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }).slice(0, 7);
function apShiftMonth(ym, d) { const [y, m] = ym.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1 + d, 1)); return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}`; }
function apTeamLabel(t) { return AP_OFFICIAL_TEAMS.includes(t) ? t : '기타 (옛 팀·팀 없음)'; }
function apFillTeamOptions() {   // 팀 선택은 앱의 공식 11개 팀만 보여줘요(노션에 남은 옛 팀 선택지는 숨겨요)
  const keep = apTeam.value; apTeam.innerHTML = '<option value="">전체 팀</option>' + AP_OFFICIAL_TEAMS.map(t => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join(''); if (AP_OFFICIAL_TEAMS.includes(keep)) apTeam.value = keep;
}
function apSetView(v) {
  apView = v; const month = v === 'month', kanban = v === 'kanban', list = v === 'list', sched = v === 'sched';
  for (const [id, on] of [['apViewList', list], ['apViewMonth', month], ['apViewKanban', kanban], ['apViewSched', sched]]) { const b = document.getElementById(id); b.classList.toggle('active', on); b.setAttribute('aria-selected', String(on)); }
  document.getElementById('apSchedWrap').hidden = !sched; document.querySelector('#interviewView .ap-filters') && (document.querySelector('#interviewView .ap-filters').hidden = sched);   // 일정 등록·목록(예전 문자 보내기 아래에 있던 화면)
  if (sched) { apMonthBar.hidden = true; apMonthBody.hidden = true; document.getElementById('apKanban').hidden = true; document.getElementById('apTable').hidden = true; document.getElementById('apCount').hidden = true; apMore.hidden = true; setApMsg(''); return; }
  apMonthBar.hidden = !month; apMonthBody.hidden = !month; document.getElementById('apKanban').hidden = !kanban;
  document.getElementById('apTable').hidden = !list; document.getElementById('apCount').hidden = !list; apMore.hidden = !list || !apCursor;
  apStatus.hidden = !list;   // 면접 일정·칸반 보기는 모든 상태를 보여줘서 상태 선택이 필요 없어요
  if (month) { if (!apMonthEl.value) apMonthEl.value = apTodayMonth(); loadMonth(); } else if (kanban) loadKanban(); else loadApplicants(true);
}
// 지금 보고 있는 보기를 다시 불러와요(팀·검색·새로고침이 같이 써요)
function apReloadView() { if (apView === 'month') loadMonth(); else if (apView === 'kanban') loadKanban(); else loadApplicants(true); }
async function loadMonth() {
  const month = apMonthEl.value; if (!/^\d{4}-\d{2}$/.test(month)) { apMonthBody.innerHTML = '<p class="manage-hint">달을 골라주세요.</p>'; return; }
  try {
    const st = await ensureNotionStatus(!(notionStatus && notionStatus.configured));
    if (!st || !st.configured) { apNotice.hidden = false; apNotice.textContent = (st && st.message) || '노션 연결을 확인하지 못했어요.'; apMonthBody.innerHTML = ''; return; }
    apNotice.hidden = true; if (!apOptions) apOptions = st.options || {};
    const qs = new URLSearchParams({ month, status: 'all', team: apTeam.value || '', q: apSearch.value.trim(), schedule: '1' });
    setApMsg('노션에서 불러오는 중...');
    const data = await apFetch('/api/notion/applicants?' + qs.toString());
    apScheduleChecked = data.scheduleChecked === true;
    data.applicants.forEach(x => { const i = apList.findIndex(v => v.id === x.id); if (i >= 0) apList[i] = x; else apList.push(x); });   // 문자·질문 버튼이 같은 지원자 정보를 찾을 수 있게 합쳐 둬요
    apMonthData = data; apRenderMonth(); setApMsg(data.truncated ? '이 달 면접이 많아서 일부만 보여요(최대 100명). 팀을 골라 나눠 보세요.' : '', data.truncated ? 'err' : '');
  } catch (err) { setApMsg(err.message || '불러오는 중 오류가 발생했어요.', 'err'); }
}
function apRenderMonth() {
  const d = apMonthData; if (!d) return; const month = d.month;
  // 일정 단위로 펼치기: 그 달에 있는 1차·2차를 각각 한 줄로
  const items = []; d.applicants.forEach(x => [['1차', x.interview1], ['2차', x.interview2]].forEach(([round, when]) => { if (!when) return; const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(String(when)); const k = apToLocalInput(String(when)); if (k && k.slice(0, 7) === month) items.push({ x, round, when: k, dateOnly }); }));   // 값은 한국 시간(YYYY-MM-DDTHH:mm)으로 바꿔서 달 판정·정렬·표시를 모두 같은 기준으로 해요
  items.sort((p, q) => p.when.localeCompare(q.when) || String(p.x.name).localeCompare(String(q.x.name), 'ko'));
  const groups = new Map(); items.forEach(it => { const k = apTeamLabel(it.x.team); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(it); });
  const order = [...AP_OFFICIAL_TEAMS.filter(t => groups.has(t)), ...[...groups.keys()].filter(k => !AP_OFFICIAL_TEAMS.includes(k))];
  const [yy, mm] = month.split('-');
  const summary = items.length ? `${yy}년 ${Number(mm)}월 면접 <strong>${items.length}건</strong> · ${order.map(k => `${escapeHtml(k)} ${groups.get(k).length}`).join(' · ')}` : `${yy}년 ${Number(mm)}월에는 ${apTeam.value ? escapeHtml(apTeam.value) + '의 ' : ''}면접이 없어요.`;
  const wd = ['일', '월', '화', '수', '목', '금', '토'];
  const fmt = (w, dateOnly) => { const y = +w.slice(0, 4), m = +w.slice(5, 7), d = +w.slice(8, 10); const p = n => String(n).padStart(2, '0'); const dow = wd[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]; return `${p(m)}/${p(d)}(${dow})${dateOnly ? '' : ' ' + w.slice(11, 16)}`; };   // 시간대와 상관없이 같은 값으로 그려요(요일도 날짜 문자열에서 계산)
  const row = it => { const x = it.x; const canEdit = apCanEdit(); return `<tr class="ap-mrow" data-id="${escapeHtml(x.id)}"><td data-label="일시"><strong>${escapeHtml(fmt(it.when, it.dateOnly))}</strong> <span class="ap-round">${it.round}</span>${apSchedBadge(x, it.round)}</td><td data-label="이름"><button type="button" class="ap-name-link" data-open-detail="${escapeHtml(x.id)}" title="누르면 지원자 정보와 면접 기록이 열려요"><strong>${escapeHtml(x.name || '(이름 없음)')}</strong></button>${x.job ? `<span class="ap-sub">${escapeHtml(x.job)}</span>` : ''}</td><td data-label="면접상태">${escapeHtml(x.status || '-')}${x.smsStatus ? `<span class="ap-sub">문자: ${escapeHtml(x.smsStatus)}</span>` : ''}</td><td data-label="">${AP_ACTIVE.includes(x.status) && canEdit && canEdit_('send') ? '<button type="button" class="add-btn ap-sms-btn">📨 면접 문자</button> ' : ''}${AP_ACTIVE.includes(x.status) && canEdit && canEdit_('schedule') ? '<button type="button" class="link-btn ap-sch-btn">📅 일정</button> ' : ''}<button type="button" class="add-btn ap-iq-btn">면접 질문·답변</button> <a class="link-btn" href="${escapeHtml(x.url || '#')}" target="_blank" rel="noopener">노션</a></td></tr>`; };
  apMonthBody.innerHTML = `<p class="ap-monthsummary">${summary}</p>` + order.map(k => `<section class="ap-teamgroup"><h3>${escapeHtml(k)} <span class="ap-teamcount">${groups.get(k).length}건</span></h3><table class="history-table stack-table ap-mtable"><thead><tr><th>일시</th><th>이름 · 직무</th><th>면접상태</th><th></th></tr></thead><tbody>${groups.get(k).map(row).join('')}</tbody></table></section>`).join('');
}
document.getElementById('apViewList').addEventListener('click', () => { if (apView !== 'list') apSetView('list'); });
document.getElementById('apViewMonth').addEventListener('click', () => { if (apView !== 'month') apSetView('month'); });
document.getElementById('apViewKanban').addEventListener('click', () => { if (apView !== 'kanban') apSetView('kanban'); });
document.getElementById('apViewSched').addEventListener('click', () => { if (apView !== 'sched') apSetView('sched'); });
// 다른 화면(문자·지원자 목록의 📅 일정 버튼 등)에서 일정 등록·목록을 열 때 써요
function openScheduleView() { showTab('interview'); apSetView('sched'); }
apMonthEl.addEventListener('change', () => loadMonth());
document.getElementById('apPrevMonth').addEventListener('click', () => { apMonthEl.value = apShiftMonth(apMonthEl.value || apTodayMonth(), -1); loadMonth(); });
document.getElementById('apNextMonth').addEventListener('click', () => { apMonthEl.value = apShiftMonth(apMonthEl.value || apTodayMonth(), 1); loadMonth(); });
document.getElementById('apThisMonth').addEventListener('click', () => { apMonthEl.value = apTodayMonth(); loadMonth(); });
// ---------- 칸반 보드 (면접상태별로 지원자 카드를 한눈에, 끌어서 상태 바꾸기) ----------
// 열은 노션 "면접상태" 선택지 순서 그대로예요(이 회사의 실제 상태 이름 — 앱이 이름을 만들어 넣지 않아요).
// 카드를 옮기면 기존 상태 변경과 같은 길(apSave → 노션 PATCH, expectedEditedAt로 동시 수정 충돌 방지)로 저장해요.
let apKanbanList = []; let apKanbanTruncated = false; let apKanbanLoading = false; let apKanbanDragId = '';
// 칸반의 접힌 열: 진행 중이 아닌 상태(탈락 확정 845명처럼 많은 열)는 펼칠 때만 그 상태만 불러와요
const AP_KB_BOARD = ['서류합격', '1차 면접 예정자', '채용 과제', '2차 면접 예정', '탈락 후보'];   // 서버의 status=board 와 같아요
const AP_VISIBLE = [...AP_KB_BOARD, '채용'];   // 앱에서 보는 상태(서버의 NOTION_VISIBLE_STATUSES와 같아요). 탈락 확정·불참·퇴사는 노션에만 있어요
const AP_KB_COLUMN_MAX = 100;
const apKbOpen = new Set(); let apKbExtra = {};   // 펼친 열 / 열별로 따로 불러온 지원자
async function loadKanbanColumn(status, quiet) {
  try {
    const qs = new URLSearchParams({ status, team: apTeam.value || '', q: apSearch.value.trim(), pageSize: '100' });
    const data = await apFetch('/api/notion/applicants?' + qs.toString());
    const list = (data.applicants || []).slice(0, AP_KB_COLUMN_MAX);
    apKbExtra[status] = { list, more: !!data.hasMore || (data.applicants || []).length > AP_KB_COLUMN_MAX };
    list.forEach(x => { const i = apList.findIndex(v => v.id === x.id); if (i >= 0) apList[i] = x; else apList.push(x); });
  } catch (err) { apKbExtra[status] = { list: [], more: false, error: err.message || '불러오지 못했어요.' }; if (!quiet) setApMsg(err.message || '불러오지 못했어요.', 'err'); }
}
async function loadKanban() {
  if (apKanbanLoading) return; apKanbanLoading = true;
  const board = document.getElementById('apKanbanBoard');
  try {
    const st = await ensureNotionStatus(!(notionStatus && notionStatus.configured));
    if (!st || !st.configured) { apNotice.hidden = false; apNotice.textContent = (st && st.message) || '노션 연결을 확인하지 못했어요.'; board.innerHTML = ''; document.getElementById('apKanbanSummary').textContent = ''; return; }
    apNotice.hidden = true; if (!apOptions) apOptions = st.options || {};
    setApMsg('노션에서 불러오는 중...');
    const all = []; let cursor = '', pages = 0, more = false;
    do {
      const qs = new URLSearchParams({ status: 'board', team: apTeam.value || '', q: apSearch.value.trim() }); if (cursor) qs.set('cursor', cursor);   // 처음에는 진행 중 열만(서류합격~탈락 후보). 탈락 확정·불참·퇴사·채용은 열을 펼칠 때 따로 불러와요
      const data = await apFetch('/api/notion/applicants?' + qs.toString());
      all.push(...data.applicants); cursor = data.nextCursor || ''; more = !!data.hasMore; pages++;
    } while (cursor && pages < 10);
    apKanbanList = all.slice(0, 300); apKanbanTruncated = more || all.length > 300;
    apKanbanList.forEach(x => { const i = apList.findIndex(v => v.id === x.id); if (i >= 0) apList[i] = x; else apList.push(x); });   // 문자 버튼과 apSave가 같은 지원자 정보를 찾게 합쳐 둬요
    for (const s of [...apKbOpen]) await loadKanbanColumn(s, true);   // 펼쳐 둔 열은 새로 불러올 때 같이 갱신해요
    apRenderKanban(); setApMsg(apKanbanTruncated ? '지원자가 많아서 최근 300명까지만 보여요. 팀을 골라 나눠 보세요.' : '', apKanbanTruncated ? 'err' : '');
  } catch (err) { setApMsg(err.message || '불러오는 중 오류가 발생했어요.', 'err'); }
  finally { apKanbanLoading = false; }
}
function apKanbanColumns() {   // 노션 선택지 순서 + 선택지에 없는데 지원자가 쓰고 있는 상태(옛 값)는 맨 뒤에
  const base = ((apOptions && apOptions.statuses) || []).slice(); const extra = [...new Set(apKanbanList.map(x => x.status).filter(s => s && !base.includes(s)))];
  return [...base, ...extra, ...(apKanbanList.some(x => !x.status) ? ['(상태 없음)'] : [])];
}
function apKanbanCardHtml(x, cols, canMove) {
  const sch = [x.interview1 ? `1차 ${escapeHtml(apFmtWhen(x.interview1))}` : '', x.interview2 ? `2차 ${escapeHtml(apFmtWhen(x.interview2))}` : ''].filter(Boolean).join(' · ');
  const rec = x.recommendation && AP_REC[x.recommendation] ? `<span class="ap-rec ${AP_REC[x.recommendation][1]}">${AP_REC[x.recommendation][0]}</span>` : '';
  const moveSel = canMove ? `<select class="ap-kb-move" data-id="${escapeHtml(x.id)}" aria-label="${escapeHtml(x.name || '지원자')} 상태 이동"><option value="">이동…</option>${cols.filter(c => c !== '(상태 없음)' && c !== (x.status || '(상태 없음)')).map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}</select>` : '';
  const sms = canMove && AP_ACTIVE.includes(x.status) && canEdit_('send') ? `<button type="button" class="link-btn ap-kb-sms" data-id="${escapeHtml(x.id)}">📨 면접 문자</button>` : '';
  return `<div class="ap-kb-card" role="listitem" data-id="${escapeHtml(x.id)}" ${canMove ? 'draggable="true"' : ''}><div class="ap-kb-name"><button type="button" class="ap-name-link" data-open-detail="${escapeHtml(x.id)}" title="누르면 지원자 정보와 면접 기록이 열려요" draggable="false"><strong>${escapeHtml(x.name || '(이름 없음)')}</strong></button>${rec}</div><div class="ap-sub">${escapeHtml([x.team, x.job].filter(Boolean).join(' · '))}</div>${sch ? `<div class="ap-kb-sch">${sch}</div>` : ''}${x.score ? `<div class="ap-sub">점수 ${escapeHtml(String(x.score))}</div>` : ''}<div class="ap-kb-actions">${moveSel}${sms}${x.url ? `<a class="link-btn" href="${escapeHtml(x.url)}" target="_blank" rel="noopener">노션</a>` : ''}</div></div>`;
}
function apRenderKanban() {
  const cols = apKanbanColumns(); const canMove = apCanEdit(); const by = new Map(cols.map(c => [c, []]));
  apKanbanList.forEach(x => by.get(x.status || '(상태 없음)').push(x));
  by.forEach(list => list.sort((p, q) => String(p.name).localeCompare(String(q.name), 'ko')));
  document.getElementById('apKanbanSummary').innerHTML = apKanbanList.length ? `전체 <strong>${apKanbanList.length}명</strong> · ${cols.filter(c => AP_KB_BOARD.includes(c) || c === '(상태 없음)').map(c => `${escapeHtml(c)} ${by.get(c).length}`).join(' · ')} · 채용 열은 펼칠 때 불러와요. 탈락 확정·불참·퇴사는 앱에 보이지 않아요(노션에는 그대로)` : '표시할 지원자가 없어요.';
  const collapsible = c => !AP_KB_BOARD.includes(c) && c !== '(상태 없음)';   // 진행 중이 아닌 상태는 접어 둬요
  document.getElementById('apKanbanBoard').innerHTML = cols.filter(c => AP_VISIBLE.includes(c) || c === '(상태 없음)').map(c => {   // 옮기기 선택지(cols)는 그대로 두고 열만 보이는 상태로
    if (collapsible(c)) {
      const open = apKbOpen.has(c); const ex = apKbExtra[c];
      const cards = open && ex ? ex.list.slice().sort((p, q) => String(p.name).localeCompare(String(q.name), 'ko')).map(x => apKanbanCardHtml(x, cols, canMove)).join('') : '';
      const body = !open ? '<p class="ap-sub ap-kb-empty">접혀 있어요. "펼치기"를 누르면 이 상태의 지원자를 불러와요(최근 100명까지).</p>'
        : !ex ? '<p class="ap-sub ap-kb-empty">불러오는 중...</p>'
        : ex.error ? `<p class="ap-sub ap-kb-empty">${escapeHtml(ex.error)}</p>`
        : (cards || '<p class="ap-sub ap-kb-empty">비어 있어요</p>') + (ex.more ? `<p class="ap-sub ap-kb-empty">최근 ${AP_KB_COLUMN_MAX}명까지만 보여요. 팀이나 이름으로 좁혀 보세요.</p>` : '');
      return `<section class="ap-kb-col ap-kb-collapsed${open ? ' open' : ''}" role="group" aria-label="${escapeHtml(c)}" data-status="${escapeHtml(c)}"><h3>${escapeHtml(c)} <button type="button" class="link-btn ap-kb-toggle" data-status="${escapeHtml(c)}">${open ? '접기' : '펼치기'}</button></h3><div class="ap-kb-drop">${body}</div></section>`;
    }
    return `<section class="ap-kb-col" role="group" aria-label="${escapeHtml(c)}" data-status="${escapeHtml(c)}"><h3>${escapeHtml(c)} <span class="ap-teamcount">${by.get(c).length}명</span></h3><div class="ap-kb-drop">${by.get(c).map(x => apKanbanCardHtml(x, cols, canMove)).join('') || '<p class="ap-sub ap-kb-empty">비어 있어요</p>'}</div></section>`;
  }).join('');
}
// 카드를 다른 상태로 옮겨요(끌어놓기·이동 선택칸이 같이 써요). 실패하면 원래 자리로 돌아가요.
async function apKanbanMove(id, next) {
  const x = apList.find(v => v.id === id); if (!x || !next || next === '(상태 없음)') return;
  if (!apCanEdit()) { setApMsg('상태를 바꿀 권한이 없어요.', 'err'); apRenderKanban(); return; }
  if ((x.status || '(상태 없음)') === next) return;
  if (next === '탈락 확정' && !confirm(`${x.name || '이 지원자'} 님을 "탈락 확정"으로 바꿀까요?\n노션에도 바로 반영돼요. (탈락은 사람이 정하는 거예요)`)) { apRenderKanban(); return; }
  const card = document.querySelector(`#apKanbanBoard .ap-kb-card[data-id="${CSS.escape(id)}"]`); if (card) card.classList.add('ap-kb-saving');
  try {
    const saved = await apSave(id, { status: next });
    const i = apKanbanList.findIndex(v => v.id === id); const fresh = apList.find(v => v.id === id) || saved; if (i >= 0 && fresh) apKanbanList[i] = fresh;
    apRenderKanban();
    const msg = `${x.name || '지원자'} 님을 "${next}"로 옮겨 노션에 저장했어요.`;
    setApMsg(AP_ACTIVE.includes(next) && next !== '서류합격' ? msg + ' 면접 문자는 자동으로 보내지 않아요 — 카드의 "📨 면접 문자"로 보내세요.' : msg, 'ok');
  } catch (err) {
    apRenderKanban();   // 원래 자리로 되돌려요
    if (err.status === 409) {   // 다른 사람이 노션에서 먼저 바꿨어요: 덮어쓰지 않았고, 최신 값을 다시 불러온 "뒤에" 이유를 알려줘요(불러오는 동안 상태줄이 바뀌어서 먼저 쓰면 지워져요)
      await loadKanban();
      setApMsg(`${x.name || '이 지원자'} 님은 노션에서 방금 다른 사람이 바꿨어요. 아무것도 덮어쓰지 않았고 최신 내용으로 다시 불러왔어요. 확인한 뒤 다시 옮겨주세요.`, 'err');
    } else setApMsg(err.message || '저장하지 못했어요.', 'err');
  }
}
{
  const board = document.getElementById('apKanbanBoard');
  board.addEventListener('dragstart', e => { const c = e.target.closest('.ap-kb-card'); if (!c) return; apKanbanDragId = c.dataset.id; e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', apKanbanDragId); } catch {} c.classList.add('ap-kb-dragging'); });
  board.addEventListener('dragend', () => { apKanbanDragId = ''; board.querySelectorAll('.ap-kb-dragging,.ap-kb-over').forEach(el => el.classList.remove('ap-kb-dragging', 'ap-kb-over')); });
  board.addEventListener('dragover', e => { const col = e.target.closest('.ap-kb-col'); if (!col || !apKanbanDragId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; board.querySelectorAll('.ap-kb-over').forEach(el => { if (el !== col) el.classList.remove('ap-kb-over'); }); col.classList.add('ap-kb-over'); });
  board.addEventListener('drop', e => { const col = e.target.closest('.ap-kb-col'); if (!col || !apKanbanDragId) return; e.preventDefault(); const id = apKanbanDragId; apKanbanDragId = ''; col.classList.remove('ap-kb-over'); apKanbanMove(id, col.dataset.status); });
  board.addEventListener('change', e => { const sel = e.target.closest('select.ap-kb-move'); if (!sel || !sel.value) return; const v = sel.value; sel.value = ''; apKanbanMove(sel.dataset.id, v); });
  board.addEventListener('click', async e => {
    const t = e.target.closest('.ap-kb-toggle');
    if (t) { const s = t.dataset.status; if (apKbOpen.has(s)) { apKbOpen.delete(s); } else { apKbOpen.add(s); apKbExtra[s] = undefined; apRenderKanban(); await loadKanbanColumn(s); } apRenderKanban(); }
  });
  board.addEventListener('click', e => { const b = e.target.closest('.ap-kb-sms'); if (!b) return; const x = apList.find(v => v.id === b.dataset.id); if (x) fillSendFormFromNotion(x); });
}

apMonthBody.addEventListener('click', e => {
  const tr = e.target.closest('tr.ap-mrow'); if (!tr) return; const x = apList.find(v => v.id === tr.dataset.id); if (!x) return;
  if (e.target.closest('.ap-iq-btn')) { if (interviewDirty() && !confirm('보내지 않은 답변이 있어요. 다른 지원자를 고르면 작성한 답변이 사라져요.\n\n그래도 바꿀까요?')) return; openInterviewFor(x); return; }
  if (e.target.closest('.ap-sms-btn')) { fillSendFormFromNotion(x); return; }
  if (e.target.closest('.ap-sch-btn')) { fillScheduleFormFromNotion(x); }
});

apStatus.addEventListener('change', () => loadApplicants(true));
apTeam.addEventListener('change', apReloadView);
let apSearchTimer = null;
apSearch.addEventListener('input', () => { clearTimeout(apSearchTimer); apSearchTimer = setTimeout(apReloadView, 400); });
apMore.addEventListener('click', () => loadApplicants(false));
// 노션 화면에서 고치고 돌아왔을 때 바로 최신으로 보이게 (탭이 열려 있고 30초 넘게 지났으면 다시 읽음)
window.addEventListener('focus', () => { if (!interviewView.hidden && Date.now() - apLoadedAt > 30000) loadApplicants(true); });


// ---------- 여러 이력서 한꺼번에 점수 보기 (점수만 보여주고, 노션 등록은 줄마다 직접 누르는 버튼으로만) ----------
const BATCH_MAX_FILES = 20;
const batchFilesEl = document.getElementById('batchFiles');
const batchFileInfo = document.getElementById('batchFileInfo');
const batchStatus = document.getElementById('batchStatus');
const batchTable = document.getElementById('batchTable');
const batchBody = document.getElementById('batchBody');
const batchRunBtn = document.getElementById('batchRunBtn');
let batchRows = [];       // { id, file, state: 'wait'|'run'|'ok'|'err', result, error, positionId, open, reg }
let batchSeq = 0;
let batchRunning = false;

// ---------- 이력서에 적힌 지원분야 읽기 · 공고 분류 (읽어서 보여주기만 하고, 어느 공고인지는 사람이 골라요) ----------
const batchAppliedKey = s => String(s || '').replace(/[^0-9A-Za-z가-힣]/g, '').toLowerCase();
const batchKindOf = {};   // 파일 이름 → 서류 종류(이력서·포트폴리오·경력기술서·자기소개서·자격증·증명서·기타)
async function batchReadApplied(row) {
  const f = batchFilesOf(row)[0];
  if (!f) { row.appliedState = 'done'; return; }
  try {
    const res = await fetch('/api/resume/read-applied?filename=' + encodeURIComponent(f.name), { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: f });
    const j = await res.json().catch(() => null);
    row.appliedFor = res.ok && j && typeof j.appliedFor === 'string' ? j.appliedFor : '';
    if (res.ok && j) { if (j.name && !row.personName) row.personName = String(j.name).slice(0, 20); if (j.kind) batchKindOf[batchFileKey(f.name)] = String(j.kind); }   // 첫 쪽의 "성명"·파일 이름에서 읽은 이름(같은 사람끼리 묶을 때 써요)
  } catch { row.appliedFor = ''; }
  row.appliedState = 'done';
}
let batchReading = false;
async function batchReadAppliedAll() {
  if (batchReading) return; batchReading = true;
  try {
    for (;;) {
      const todo = batchRows.filter(r => r.appliedState === 'reading' && !r.appliedBusy);
      if (!todo.length) break;
      const queue = todo.slice(); queue.forEach(r => { r.appliedBusy = true; });
      const worker = async () => { while (queue.length) { const row = queue.shift(); await batchReadApplied(row); row.appliedBusy = false; batchRender(); } };
      await Promise.all([worker(), worker()]);   // 한 번에 2개씩
    }
  } finally { batchReading = false; }
  batchAutoGroup();   // 다 읽으면 같은 사람의 서류(이력서·포트폴리오·자격증 등)를 자동으로 한 줄로 묶어요
}
// 확정된 공고 중 지원분야와 비슷한 순서(단어가 겹치는 정도). 동점이면 모두 "비슷해요"로 표시하고, 고르는 건 사람이에요.
function batchPostingChoices(applied) {
  const confirmed = scorablePostings();
  const toks = s => new Set(String(s || '').split(/[^0-9A-Za-z가-힣]+/).filter(t => t.length >= 2));
  const A = toks(applied);
  const scored = confirmed.map(p => { const P = toks(`${p.team} ${p.position} ${p.brand || ''}`); let n = 0; A.forEach(t => { if (P.has(t) || [...P].some(x => x.includes(t) || t.includes(x))) n++; }); return { p, n }; });
  const best = Math.max(0, ...scored.map(x => x.n));
  scored.sort((x, y) => y.n - x.n || String(x.p.team).localeCompare(String(y.p.team), 'ko') || String(x.p.position).localeCompare(String(y.p.position), 'ko'));
  return scored.map(x => ({ ...x, similar: !!applied && best > 0 && x.n === best }));
}
function batchPostingSelectHtml(row, cls) {
  const choices = batchPostingChoices(row.appliedFor);
  const label = p => `${p.team} · ${p.position}${p.brand ? ` [${p.brand}]` : ''}`;
  return `<select class="${cls}" aria-label="이 이력서가 낸 공고"><option value="">(위 \"평가할 공고\"로 평가)</option>${choices.map(x => `<option value="${escapeHtml(x.p.id)}"${(row.preId || '') === x.p.id ? ' selected' : ''}>${x.similar ? '★ 비슷해요 · ' : ''}${escapeHtml(label(x.p))}</option>`).join('')}</select>`;
}
function batchAppliedGroups() {   // 평가 전 줄을 지원분야(읽은 글)별로 묶어요. 못 읽은 줄은 한 묶음이에요.
  const map = new Map();
  for (const r of batchRows.filter(r => (r.state === 'wait' || r.state === 'err') && !r.saved)) {
    if (r.appliedState === 'reading') continue;
    const k = batchAppliedKey(r.appliedFor) || '__none'; if (!map.has(k)) map.set(k, { key: k, label: r.appliedFor || '', rows: [] }); map.get(k).rows.push(r);
  }
  return [...map.values()].sort((x, y) => (x.key === '__none') - (y.key === '__none') || y.rows.length - x.rows.length);
}
function batchRenderAppliedBox() {
  const box = document.getElementById('batchAppliedBox'); if (!box) return;
  const reading = batchRows.filter(r => r.appliedState === 'reading').length;
  const groups = batchAppliedGroups();
  if (!groups.length && !reading) { box.hidden = true; box.innerHTML = ''; return; }
  if (!scorablePostings().length) { box.hidden = true; box.innerHTML = ''; return; }
  box.hidden = false;
  box.innerHTML = `<div class="manage-hint" style="margin:0 0 6px"><strong>지원분야별 분류</strong> — 이력서에 적힌 "지원분야"를 읽어 같은 것끼리 묶었어요. 묶음마다 어느 공고인지 <strong>직접 골라주세요</strong>(자동으로 정하지 않아요). 고르지 않은 이력서는 위 "평가할 공고"로 평가해요.${reading ? ` <span class="batch-reading">(읽는 중… ${reading}개)</span>` : ''}</div>`
    + groups.map(g => { const sel = new Set(g.rows.map(r => r.preId || '')); const common = sel.size === 1 ? [...sel][0] : '';
      return `<div class="batch-applied-row" data-key="${escapeHtml(g.key)}"><span class="batch-applied-name">${g.key === '__none' ? '지원분야를 못 읽은 이력서' : escapeHtml(g.label)} <strong>${g.rows.length}개</strong></span>${batchPostingSelectHtml({ appliedFor: g.label, preId: common }, 'batch-applied-sel')}${sel.size > 1 ? '<span class="manage-hint" style="margin:0">(줄마다 다르게 골라져 있어요)</span>' : ''}</div>`; }).join('');
}
document.getElementById('batchAppliedBox').addEventListener('change', e => {
  const s = e.target.closest('.batch-applied-sel'); if (!s) return;
  const key = s.closest('.batch-applied-row').dataset.key; const g = batchAppliedGroups().find(x => x.key === key); if (!g) return;
  g.rows.forEach(r => { r.preId = s.value; }); batchRender();
});
batchBody.addEventListener('change', e => {
  const s = e.target.closest('.batch-row-sel'); if (!s) return;
  const row = batchRows.find(r => r.id === Number(s.closest('tr').dataset.id)); if (!row) return;
  row.preId = s.value; batchRender();
});


function setBatchStatus(msg, cls) { batchStatus.textContent = msg || ''; batchStatus.className = 'status' + (cls ? ' ' + cls : ''); }
function batchSizeText(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB'; }
function batchInfoRefresh() {
  const mb = document.getElementById('batchMergeBar'); if (mb) mb.hidden = batchRows.filter(r => (r.state === 'wait' || r.state === 'err') && r.file && !(r.reg && r.reg.id)).length < 2;
  const waiting = batchRows.filter(r => r.state === 'wait').length;
  batchFileInfo.textContent = batchRows.length ? `올린 이력서 ${batchRows.length}개 (아직 점수 안 본 것 ${waiting}개)` : '';
  batchTable.hidden = !batchRows.length;
}
// 같은 이름의 파일을 또 올리면 "마지막 파일"로 바꿔요(같은 사람이 두 줄로 쌓이지 않게). 이름은 대소문자·앞뒤 공백만 무시하고 그대로 비교해요.
const batchFileKey = name => String(name || '').trim().toLowerCase();
// 같은 이름의 줄이 있으면 그 줄을 찾아 돌려줘요. 점수를 보는 중이거나 이미 노션에 기록한 줄은 바꾸지 않아요(진행 중 요청·기록 표시가 어긋나지 않게).
function batchFindSameFile(name) { const k = batchFileKey(name); return batchRows.find(r => (r.files || (r.file ? [r.file] : [])).some(x => batchFileKey(x.name) === k)); }
const batchFilesOf = row => row.files || (row.file ? [row.file] : []);
batchFilesEl.addEventListener('change', () => {
  const skipped = []; let replaced = 0;
  for (const f of [...batchFilesEl.files]) {
    if (!/\.pdf$/i.test(f.name) && f.type !== 'application/pdf') { skipped.push(`${f.name} (PDF가 아니에요)`); continue; }
    if (f.size === 0) { skipped.push(`${f.name} (빈 파일이에요)`); continue; }
    if (f.size > PDF_MAX_BYTES) { skipped.push(`${f.name} (${batchSizeText(f.size)}: 4MB 이하로 줄여주세요)`); continue; }
    const same = batchFindSameFile(f.name);
    if (same) {
      if (same.state === 'run') { skipped.push(`${f.name} (같은 이름의 파일이 점수를 보는 중이에요. 끝난 뒤 다시 올려주세요)`); continue; }
      if (same.reg && same.reg.id) { skipped.push(`${f.name} (같은 이름의 파일이 이미 노션에 서류 합격으로 기록됐어요. 바꾸지 않았어요)`); continue; }
      if (batchFilesOf(same).length > 1) {   // 여러 서류를 묶은 줄 안의 같은 이름 파일: 그 파일만 바꾸고 묶음은 유지해요(점수는 지워져요)
        const k = batchFileKey(f.name); const rest = batchFilesOf(same).filter(x => batchFileKey(x.name) !== k);
        if (rest.reduce((n, x) => n + x.size, 0) + f.size > PDF_MAX_BYTES) { skipped.push(`${f.name} (묶음 합계가 ${Math.round(PDF_MAX_BYTES / 1048576)}MB를 넘어서 바꾸지 못했어요)`); continue; }
        same.files = [...rest, f]; same.file = same.files[0]; same.state = 'wait'; same.result = null; same.error = ''; same.picked = false; replaced++; continue;
      }
      batchRows = batchRows.filter(r => r !== same); replaced++;   // 마지막으로 올린 파일로 교체(맨 뒤에 새로 추가돼요)
    } else if (batchRows.length >= BATCH_MAX_FILES) { skipped.push(`${f.name} (최대 ${BATCH_MAX_FILES}개까지예요)`); continue; }
    batchRows.push({ id: ++batchSeq, file: f, files: [f], state: 'wait', result: null, error: '', positionId: '', open: false, reg: null, appliedFor: '', appliedState: 'reading', preId: '' });
  }
  batchFilesEl.value = '';
  batchRender(); batchInfoRefresh();
  batchReadAppliedAll();   // 올린 이력서에서 "지원분야"를 읽어 보여줘요(자동으로 분류하지는 않아요)
  const msgs = [];
  if (replaced) msgs.push(`같은 이름의 파일 ${replaced}개를 마지막으로 올린 파일로 바꿨어요(이전 점수는 지워졌어요, 다시 "점수 보기"를 눌러주세요)`);
  if (skipped.length) msgs.push(`올리지 않은 파일: ${skipped.join(' / ')}`);
  setBatchStatus(msgs.join(' · '), skipped.length ? 'err' : (replaced ? 'ok' : ''));
});
document.getElementById('batchClearBtn').addEventListener('click', () => {
  if (batchRunning) { setBatchStatus('점수를 보는 중에는 비울 수 없어요.', 'err'); return; }
  if (batchRows.length && batchRows.some(r => r.state === 'ok' && !r.reg) && !confirm('화면의 점수 표를 비워요. 점수를 본 결과는 공고별로 저장돼 있어서, 공고를 다시 고르면 돌아와요(저장까지 지우려면 줄의 "삭제"나 "이 공고의 저장된 결과 모두 삭제"를 쓰세요). 비울까요?')) return;
  batchRows = []; batchPostingFilter = ''; batchRender(); batchInfoRefresh(); setBatchStatus('');
});
document.getElementById('batchSort').addEventListener('change', batchRender);

function batchCounts(r) {
  const reqs = (r.requirements || []).filter(q => q.kind !== '우대');   // "필수 요건 충족 수"라서 우대(P)는 빼요. kind가 없는 옛 결과는 전부 필수로 봐요
  const ok = reqs.filter(q => q.status === '충족').length;
  const low = Object.values(r.confidence || {}).filter(v => v === '낮음').length;
  return { reqText: reqs.length ? `${ok}/${reqs.length}` : '-', low };
}
// ---- 공고별로 지원자 따로 보기 ----
// 줄의 공고는 "점수 보기"를 누른 순간 고른 공고(row.positionId)예요. 아직 점수를 안 본 줄은 공고가 없어요('').
let batchPostingFilter = '';   // '' = 전체, '__none' = 아직 평가 전, 그 밖에는 공고 id
function batchPostingName(id) {
  const p = postingsAll.find(x => x.id === id);
  if (p) return p.position + (p.brand ? ` [${p.brand}]` : '');
  const r = batchRows.find(x => x.positionId === id && x.result && x.result.position);
  return r ? r.result.position.name : '(없어진 공고)';
}
function batchPostingGroups() {
  const map = new Map(); let none = 0;
  batchRows.forEach(r => { if (r.positionId) map.set(r.positionId, (map.get(r.positionId) || 0) + 1); else none++; });
  return { groups: [...map.entries()].map(([id, n]) => ({ id, n, name: batchPostingName(id) })), none };
}
function batchRenderChips() {
  const box = document.getElementById('batchPostingChips'); if (!box) return;
  const { groups, none } = batchPostingGroups();
  if (batchPostingFilter && batchPostingFilter !== '__none' && !groups.some(g => g.id === batchPostingFilter)) batchPostingFilter = '';
  if (batchPostingFilter === '__none' && !none) batchPostingFilter = '';
  // 공고가 하나뿐이고 평가 전 줄이 없으면 나눠 볼 필요가 없어서 숨겨요
  if (groups.length + (none ? 1 : 0) < 2) { box.hidden = true; box.innerHTML = ''; return; }
  const chip = (key, label, n) => `<button type="button" class="batch-chip ${batchPostingFilter === key ? 'on' : ''}" data-key="${escapeHtml(key)}">${escapeHtml(label)} <strong>${n}</strong></button>`;
  box.hidden = false;
  box.innerHTML = '<span class="manage-hint" style="margin:0 6px 0 0">공고별 보기</span>' + chip('', '전체', batchRows.length) + groups.map(g => chip(g.id, g.name, g.n)).join('') + (none ? chip('__none', '아직 평가 전', none) : '');
}
document.getElementById('batchPostingChips').addEventListener('click', e => { const b = e.target.closest('.batch-chip'); if (!b) return; batchPostingFilter = b.dataset.key; batchRender(); });
function batchSorted() {
  batchRenderChips();
  const rows = batchRows.filter(r => !batchPostingFilter || (batchPostingFilter === '__none' ? !r.positionId : (r.positionId === batchPostingFilter || !r.positionId)));   // 아직 평가 전인 줄은 어느 공고를 보고 있어도 보여요(방금 올린 파일이 사라지지 않게)
  // 방금 올리거나 평가한 줄을 서버에서 불러온 저장 줄보다 항상 위에 둬요(불러오는 시각에 따라 순서가 뒤바뀌지 않게). 그 안에서는 정렬 선택을 따라요.
  const savedLast = (x, y) => (x.saved ? 1 : 0) - (y.saved ? 1 : 0);
  if (document.getElementById('batchSort').value === 'score') {
    rows.sort((x, y) => savedLast(x, y) || (y.result ? y.result.total : -1) - (x.result ? x.result.total : -1) || x.id - y.id);
  } else {
    rows.sort((x, y) => savedLast(x, y) || x.id - y.id);   // 올린 순서: 새 줄(만든 순) → 저장된 줄(불러온 순)
  }
  return rows;
}
function batchRender() {
  // 점수를 보는 중에 다른 줄이 끝나서 표를 다시 그려도, 열어 둔 "노션에 등록" 입력칸에 쓰던 내용은 지켜줌
  const snap = {};
  batchBody.querySelectorAll('tr.batch-detail').forEach(d => {
    const q = s => d.querySelector(s);
    if (q('.br-name')) snap[d.dataset.id] = { name: q('.br-name').value, phone: q('.br-phone').value, channel: q('.br-channel').value, status: q('.br-status').value, msg: q('.br-msg').textContent, cls: q('.br-msg').className, disabled: q('.br-submit').disabled };
  });
  batchBody.innerHTML = batchSorted().map((row, idx) => {
    const r = row.result;
    const cand = (r && r.candidate) || {};
    const name = r ? (cand.name || row.personName || '(이름을 못 읽었어요)') : (row.file ? (row.personName ? row.personName : (batchFilesOf(row).length > 1 ? `서류 ${batchFilesOf(row).length}개 묶음` : row.file.name)) : '(가져온 결과)');
    let cells;
    if (row.state === 'ok' && !r) { row.state = 'err'; row.error = '평가 결과를 불러오지 못했어요. "다시 평가"를 눌러주세요.'; }   // 한 줄이 어긋나도 표 전체가 깨지지 않게
    if (row.state === 'ok') {
      const c = batchCounts(r);
      cells = `<td data-label="총점"><strong>${r.total}</strong></td><td data-label="검토 우선순위">${escapeHtml(r.recommendation)}</td><td data-label="필수 요건">${escapeHtml(c.reqText)}</td><td data-label="확인 필요">${c.low ? c.low + '개 영역' : '-'}</td>`;
    } else if (row.state === 'run') cells = '<td colspan="4" class="batch-state">AI가 평가하는 중... (최대 1분)</td>';
    else if (row.state === 'err') cells = `<td colspan="4" class="batch-err">${escapeHtml(row.error)}${row.appliedFor ? `<div class="manage-hint batch-applied-line">이력서의 지원분야: <strong>${escapeHtml(row.appliedFor)}</strong></div>` : ''}</td>`;
    else cells = `<td colspan="4" class="batch-state">대기 중 (아직 점수를 안 봤어요)${row.appliedState === 'reading' ? '<div class="manage-hint batch-applied-line">지원분야를 읽는 중…</div>' : `<div class="manage-hint batch-applied-line">이력서의 지원분야: ${row.appliedFor ? '<strong>' + escapeHtml(row.appliedFor) + '</strong>' : '못 읽었어요'}</div>`}${row.file && !(row.reg && row.reg.id) && scorablePostings().length ? batchPostingSelectHtml(row, 'batch-row-sel') : ''}</td>`;
    const reg = row.reg && row.reg.id ? `<span class="batch-badge">${row.reg.status && row.reg.status !== '서류합격' ? `${escapeHtml(row.reg.status)}로 넘김` : '서류 합격 확정됨'}</span>` : '';
    const pick = row.state === 'ok' && !(row.reg && row.reg.id) ? `<label class="check-chip batch-pick-chip"><input type="checkbox" class="batch-pick"${row.picked ? ' checked' : ''}${row.recording ? ' disabled' : ''} /> 선정</label> ` + (canEdit('resume') && !row.recording ? '<button type="button" class="add-btn batch-pass1-btn">1차 면접</button> <button type="button" class="link-btn batch-reject-btn">서류탈락</button> ' : '') : '';   // 전형 넘기기: 1차 면접(지원자로 등록 → 문자) / 서류탈락(바로 삭제)
    const btns = row.state === 'ok'
      ? pick + `<button type="button" class="link-btn batch-detail-btn">${row.open ? '접기' : '점수표'}</button> ` + (row.reg && row.reg.id ? ((canEdit('send') ? '<button type="button" class="add-btn batch-sms-btn">📨 면접 문자</button> ' : '') + (canEdit('schedule') ? '<button type="button" class="link-btn batch-sch-btn">📅 일정 등록</button> ' : '') + (row.reg.url ? `<a class="link-btn" href="${escapeHtml(row.reg.url)}" target="_blank" rel="noopener noreferrer">노션에서 열기</a>` : '')) : '<button type="button" class="add-btn batch-reg-btn">서류 합격 확정</button>') + (row.rid && row.positionId ? (row.hired ? ' <button type="button" class="link-btn batch-unhire-btn" title="인사서류 보관을 풀고 일반 결과처럼 정한 기간 뒤에 삭제해요">합격 해제</button>' : ' <button type="button" class="link-btn batch-hire-btn" title="입사가 확정된 사람만 눌러요. 인사서류로 보고 합격 확정일부터 정한 연수만큼 보관해요">최종 합격</button>') : '') + (row.rid && row.positionId ? ' <button type="button" class="link-btn batch-delsaved-btn" title="서버에 저장된 이 사람의 점수 결과(이름·연락처·인적사항 포함)를 지워요">삭제</button>' : '')
      : (row.state === 'err' ? '<button type="button" class="link-btn batch-retry-btn">다시 평가</button>' : '') + (row.state === 'wait' || row.state === 'err' ? ' <button type="button" class="link-btn batch-remove-btn">빼기</button>' : '');
    const canMerge = (row.state === 'wait' || row.state === 'err') && row.file && !(row.reg && row.reg.id);
    const mergeChk = canMerge ? `<label class="check-chip batch-merge-chk-chip"><input type="checkbox" class="batch-merge-chk"${row.merge ? ' checked' : ''} /> 묶기</label>` : '';
    const ungroup = canMerge && batchFilesOf(row).length > 1 ? ' <button type="button" class="link-btn batch-ungroup-btn">묶음 풀기</button>' : '';
    const main = `<tr class="batch-row${row.reg && row.reg.id ? ' done' : ''}" data-id="${row.id}"><td data-label="#">${idx + 1}</td><td data-label="지원자 · 파일">${mergeChk}<strong>${escapeHtml(name)}</strong>${reg}${row.saved ? '<span class="batch-saved-tag" title="공고별로 서버에 저장된 결과예요">저장된 결과</span>' : ''}${row.hired ? '<span class="batch-hired-tag" title="최종 합격(입사 확정)으로 표시해 인사서류로 보관 중이에요. 채용서류 반환 청구 기간이 적용되지 않아요">합격자 · 인사서류</span>' : ''}${row.expiresAt ? `<span class="batch-expire${batchExpireSoon(row.expiresAt) ? ' soon' : ''}" title="이 날 서버에서 자동으로 삭제돼요">삭제 예정 ${escapeHtml(row.expiresAt)}</span>` : ''}${ungroup}${row.state === 'ok' && r ? personalHtml(r, 'chips') : ''}<span class="ap-sub">${row.file ? (batchFilesOf(row).length > 1 ? `<details class="batch-files"><summary>📎 서류 ${batchFilesOf(row).length}개 · ${batchSizeText(batchFilesOf(row).reduce((n, x) => n + x.size, 0))} (눌러서 보기)</summary><ul>${batchFilesOf(row).map(x => `<li>${batchKindOf[batchFileKey(x.name)] ? `<span class="batch-kind">${escapeHtml(batchKindOf[batchFileKey(x.name)])}</span> ` : ''}${escapeHtml(x.name)} · ${batchSizeText(x.size)}</li>`).join('')}</ul>${row.leftOut && row.leftOut.length ? `<div class="manage-hint">4MB를 넘어 점수에 쓰지 않은 서류: ${escapeHtml(row.leftOut.join(', '))}</div>` : ''}</details>` : `${batchKindOf[batchFileKey(row.file.name)] ? `<span class="batch-kind">${escapeHtml(batchKindOf[batchFileKey(row.file.name)])}</span> ` : ''}${escapeHtml(row.file.name)} · ${batchSizeText(row.file.size)}`) : '가져온 채점 결과 (이력서 PDF 없음)'}</span>${row.recMsg ? `<span class="ap-sub batch-recmsg ${row.recErr ? 'err' : ''}">${escapeHtml(row.recMsg)}</span>` : ''}</td>${cells}<td data-label="">${btns}</td></tr>`;
    return main + (row.open && row.state === 'ok' ? batchDetailHtml(row) : '');
  }).join('');
  batchBody.querySelectorAll('tr.batch-detail').forEach(async d => {
    const row = batchRows.find(r => r.id === Number(d.dataset.id));
    if (!row) return;
    await batchPrepareRegister(d, row);
    const s = snap[d.dataset.id]; if (!s) return;
    const set = (sel, v) => { const el = d.querySelector(sel); if (el && (el.tagName !== 'SELECT' || [...el.options].some(o => o.value === v))) el.value = v; };
    set('.br-name', s.name); set('.br-phone', s.phone); set('.br-channel', s.channel); set('.br-status', s.status);
    if (s.msg) { d.querySelector('.br-msg').textContent = s.msg; d.querySelector('.br-msg').className = s.cls; }
    if (s.disabled) d.querySelector('.br-submit').disabled = true;
  });
  if (typeof batchPickRefresh === 'function') batchPickRefresh();
  batchRenderAppliedBox();
}
function batchDetailHtml(row) {
  const r = row.result;
  const scoreRows = r.rubric.map(item => `<tr><td class="ds-area" data-label="평가 영역"><strong>${escapeHtml(item.area)}</strong></td><td class="ds-max" data-label="배점">${item.max}점</td><td class="ds-score" data-label="점수">${r.scores[item.key]}</td><td class="ds-why" data-label="AI 평가 근거">${commentText(r, item.key)}${confTag((r.confidence || {})[item.key])}</td></tr>`).join('');
  const reqs = (r.requirements || []).map(q => `<li><span class="req-tag ${REQ_CLASS[q.status] || 'req-unk'}">${escapeHtml(q.status)}</span><strong>${escapeHtml(q.item)}</strong>${q.evidence ? ' — ' + escapeHtml(q.evidence) : ''}</li>`).join('');
  const checks = (r.interviewChecks || []).map(q => `<li><strong>${escapeHtml(q.label)}</strong> — ${q.value ? escapeHtml(q.value) : escapeHtml(q.note)}</li>`).join('');
  return `<tr class="batch-detail" data-id="${row.id}"><td colspan="7">
    ${personalHtml(r, 'full')}
    <p><strong>${escapeHtml(r.position.name)}</strong> (${escapeHtml(r.profileLabel || '경력직')} 평가표) · 총점 ${r.total}/100 · 검토 우선순위 ${escapeHtml(r.recommendation)} <span class="manage-hint">(학력을 뺀 점수 ${r.reviewBase}점 기준 · 합격·탈락은 사람이 정해요)</span></p>
    <div class="detail-score-wrap"><table class="detail-score-table"><thead><tr><th class="ds-area">평가 영역</th><th class="ds-max">배점</th><th class="ds-score">점수</th><th class="ds-why">AI 평가 근거</th></tr></thead><tbody>${scoreRows}</tbody></table></div>
    ${r.summary ? `<p><strong>서류 총평:</strong> ${escapeHtml(r.summary)}</p>` : ''}
    ${reqs ? `<strong>필수 요건 체크 (참고)</strong><ul class="req-list">${reqs}</ul>` : ''}
    <strong>전공 · 이전 서류 합격자와 비교 (참고)</strong><ul class="req-list">${peerLinesHtml(r)}</ul>
    <strong>면접에서 확인할 것 (점수 아님)</strong><ul class="req-list">${checks}</ul>
    <div class="batch-reg">
      <strong>서류 합격 확정 (직접 누를 때만 노션에 만들어져요)</strong>
      <div class="ap-edit-grid">
        <div><label>이름 *</label><input type="text" class="br-name" maxlength="50" value="${escapeHtml((r.candidate || {}).name || '')}" /></div>
        <div><label>연락처</label><input type="text" class="br-phone" maxlength="30" value="${escapeHtml((r.candidate || {}).phone || '')}" /></div>
        <div><label>지원 채널</label><select class="br-channel"></select></div>
        <div><label>면접상태</label><select class="br-status"></select></div>
      </div>
      <div class="ap-edit-actions"><button type="button" class="add-btn br-submit">서류 합격 확정하기</button><span class="status br-msg"></span></div>
      <p class="manage-hint">이름·점수·요약·학력·경력이 노션 카드에 들어가고 이력서 PDF도 붙여요. 확정한 뒤에는 "📨 면접 문자"로 면접 문자를 보내고, 면접 확정과 일정 변경은 "면접 관리"에서 해요.</p>
    </div>
  </td></tr>`;
}

// ---------- 한 사람의 서류 여러 개를 한 명으로 묶기 ----------
// 묶음 본문(서버 형식): [파일 수 4바이트] 파일마다 [이름 길이 4바이트][이름 UTF-8][내용 크기 4바이트][PDF 내용] (big-endian)
async function batchBundleBody(files) {
  const u32 = n => { const b = new ArrayBuffer(4); new DataView(b).setUint32(0, n, false); return b; };
  const enc = new TextEncoder(); const parts = [u32(files.length)];
  for (const f of files) { const nb = enc.encode(f.name); parts.push(u32(nb.length), nb, u32(f.size), await f.arrayBuffer()); }
  return new Blob(parts, { type: 'application/octet-stream' });
}
const BATCH_GROUP_MAX_FILES = 8;   // 서버와 같아요
// 흔한 서류 이름·직무 말(사람 이름이 아니에요). 파일 이름에서 "같은 사람" 후보를 찾을 때 걸러요.
const BATCH_NAME_STOP = new Set(['이력서', '파일이력서', '포트폴리오', '자기소개서', '자소서', '경력기술서', '경력', '지원서', '이력', '서류', '첨부', '제출', '원본', '최종', '수정', '영문', '국문', '사본', '정규직', '신입', '채용', '공고', '온라인', '오프라인', '백화점', '아울렛', '영업', '기획', '패션', '디자인', '마케팅', '운영', '관리', '그로잉업팀', '그로잉업', '리포트', '발표', '보고서', '위원회', '재고', '사업', '프로젝트', '리뷰', '투자', '승인서', '계획', '실적', '현황', '자료']);
['자격증', '증명서', '졸업증명서', '성적증명서', '경력증명서', '재직증명서', '자격', '토익', '어학', '성적', '졸업', '수료증', '포폴', '입사지원서', '기술서', '소개서', '사람인', '잡코리아', '원티드', '인크루트'].forEach(w => BATCH_NAME_STOP.add(w));
// 한 줄(파일 하나)의 사람 이름: 파일 첫 쪽의 "성명"을 먼저 쓰고, 없으면 파일 이름에 사람 이름으로 보이는 말이 하나뿐일 때 그걸 써요
function batchPersonOf(row) { if (row.personName) return row.personName; const t = batchNameTokens((batchFilesOf(row)[0] || {}).name); return t.length === 1 ? t[0] : ''; }
// 올린 서류를 같은 사람끼리 자동으로 묶어요(점수 보기 전 줄만). 틀린 묶음은 "묶음 풀기"로 되돌려요
function batchAutoGroup() {
  if (batchRunning) return;
  const cand = batchRows.filter(r => (r.state === 'wait' || r.state === 'err') && r.file && !(r.reg && r.reg.id) && r.appliedState !== 'reading' && !r.noAutoGroup);
  const byName = new Map(); cand.forEach(r => { const n = batchPersonOf(r); if (!n) return; if (!byName.has(n)) byName.set(n, []); byName.get(n).push(r); });
  const done = [], tooMany = [];
  byName.forEach((rows, n) => {
    if (rows.length < 2) { if (rows[0] && !rows[0].personName) rows[0].personName = n; return; }
    const r = batchMergeRows(rows); if (r.ok) { r.first.personName = n; done.push(`${n}(${r.count}개)`); } else tooMany.push(`${n}: ${r.msg}`);
  });
  if (done.length || tooMany.length) { batchRender(); batchInfoRefresh(); setBatchStatus([done.length ? `같은 사람의 서류를 자동으로 묶었어요: ${done.join(', ')}. 다른 사람이 섞였으면 "묶음 풀기"를 눌러주세요.` : '', tooMany.length ? `묶지 못한 사람: ${tooMany.join(' / ')}` : ''].filter(Boolean).join(' · '), tooMany.length ? 'err' : 'ok'); }
}
function batchNameTokens(fname) {
  return [...new Set(String(fname || '').replace(/\.[A-Za-z0-9]+$/, '').split(/[_\s\-.()\[\]]+/).filter(t => /^[가-힣]{2,4}$/.test(t) && !BATCH_NAME_STOP.has(t)))];
}
// 선택한 줄들을 한 줄로 합쳐요. 합칠 수 없는 줄이 있으면 이유를 알려주고 아무것도 바꾸지 않아요.
function batchMergeRows(rows) {
  if (rows.length < 2) return { ok: false, msg: '묶을 줄을 2개 이상 골라주세요.' };
  if (rows.some(r => r.state === 'run' || (r.reg && r.reg.id) || !r.file)) return { ok: false, msg: '점수를 보는 중이거나 이미 노션에 기록한 줄, 가져온 결과는 묶을 수 없어요.' };
  const files = rows.flatMap(batchFilesOf);
  const seen = new Set(); for (const f of files) { const k = batchFileKey(f.name); if (seen.has(k)) return { ok: false, msg: `같은 이름의 파일(${f.name})이 있어서 묶지 않았어요.` }; seen.add(k); }
  if (files.length > BATCH_GROUP_MAX_FILES) return { ok: false, msg: `한 사람의 서류는 최대 ${BATCH_GROUP_MAX_FILES}개까지 묶을 수 있어요(지금 ${files.length}개).` };
  const first = rows[0]; first.files = files; first.file = files[0]; first.state = 'wait'; first.result = null; first.error = ''; first.picked = false; first.merge = false; first.positionId = '';
  batchRows = batchRows.filter(r => r === first || !rows.includes(r));
  return { ok: true, first, count: files.length };
}
document.getElementById('batchMergeBtn').addEventListener('click', () => {
  if (batchRunning) { setBatchStatus('점수를 보는 중에는 묶을 수 없어요.', 'err'); return; }
  const rows = batchRows.filter(r => r.merge); const r = batchMergeRows(rows);
  if (!r.ok) { setBatchStatus(r.msg, 'err'); return; }
  batchRender(); batchInfoRefresh(); setBatchStatus(`서류 ${r.count}개를 한 명으로 묶었어요. "점수 보기"를 누르면 모두 함께 읽고 통합해서 점수를 한 번만 매겨요.`, 'ok');
});
document.getElementById('batchMergeSuggestBtn').addEventListener('click', () => {
  if (batchRunning) { setBatchStatus('점수를 보는 중에는 묶을 수 없어요.', 'err'); return; }
  const cand = batchRows.filter(r => (r.state === 'wait' || r.state === 'err') && r.file && !(r.reg && r.reg.id));
  const byTok = new Map(); cand.forEach(r => batchFilesOf(r).forEach(f => batchNameTokens(f.name).forEach(t => { if (!byTok.has(t)) byTok.set(t, new Set()); byTok.get(t).add(r); })));
  const groups = []; const used = new Set();
  [...byTok.entries()].filter(([, s]) => s.size >= 2).sort((x, y) => y[1].size - x[1].size).forEach(([tok, s]) => {
    const rows = [...s].filter(r => !used.has(r)); if (rows.length < 2) return;
    if (rows.flatMap(batchFilesOf).length > BATCH_GROUP_MAX_FILES) return;   // 안 맞는 묶음은 제안하지 않아요(직접 묶어주세요)
    rows.forEach(r => used.add(r)); groups.push({ tok, rows });
  });
  if (!groups.length) { setBatchStatus('같은 이름으로 묶을 만한 파일을 찾지 못했어요(파일 이름에 같은 사람 이름이 2개 이상 들어 있어야 해요). 직접 "묶기"를 체크해 묶어주세요.', 'err'); return; }
  const list = groups.map(g => `- ${g.tok}: ${g.rows.flatMap(batchFilesOf).map(f => f.name).join(', ')}`).join('\n');
  if (!confirm(`아래처럼 같은 사람의 서류로 보고 묶을까요? (${groups.length}명)\n${list}\n\n이름이 같아 보여도 다른 사람일 수 있어요. 틀린 묶음은 "묶음 풀기"로 되돌릴 수 있어요.`)) return;
  let done = 0; groups.forEach(g => { if (batchMergeRows(g.rows).ok) done++; });
  batchRender(); batchInfoRefresh(); setBatchStatus(`${done}명의 서류를 묶었어요. "점수 보기"를 누르면 묶음마다 통합해서 점수를 한 번만 매겨요.`, 'ok');
});
batchBody.addEventListener('change', e => { const c = e.target.closest('.batch-merge-chk'); if (!c) return; const tr = c.closest('tr[data-id]'); const row = batchRows.find(r => r.id === Number(tr.dataset.id)); if (row) row.merge = c.checked; });
batchBody.addEventListener('click', e => {
  const b = e.target.closest('.batch-ungroup-btn'); if (!b) return;
  const tr = b.closest('tr[data-id]'); const row = batchRows.find(r => r.id === Number(tr.dataset.id)); if (!row || batchRunning) return;
  const fl = batchFilesOf(row); const idx = batchRows.indexOf(row);
  const rows = fl.map((f, i) => i === 0 ? row : { id: ++batchSeq, file: f, files: [f], state: 'wait', result: null, error: '', positionId: '', open: false, reg: null, appliedState: 'done', noAutoGroup: true });   // 직접 푼 줄은 다시 자동으로 묶지 않아요
  row.files = [fl[0]]; row.file = fl[0]; row.state = 'wait'; row.result = null; row.error = ''; row.merge = false; row.noAutoGroup = true; row.personName = '';
  batchRows.splice(idx, 1, ...rows); batchRender(); batchInfoRefresh(); setBatchStatus(`묶음을 풀어서 서류 ${fl.length}개가 따로 줄이 됐어요.`, 'ok');
});

// ---------- 공고별로 저장된 점수 결과 (화면을 다시 열거나 다른 공고에 갔다 와도 그 공고의 결과가 뜨게) ----------
// 저장된 줄은 PDF 원본이 없어서 "서류 합격 확정"은 되지만 PDF는 붙지 않아요. 삭제하면 서버에서도 지워져요.
let batchSavedCounts = {};
async function batchRefreshExpiry(pid) {   // 서버에서 삭제 예정일만 다시 받아 줄에 채워요
  try { const res = await fetch('/api/resume/results?positionId=' + encodeURIComponent(pid)); const d = await readJsonOrNull(res); if (!res.ok || !d || !d.results) return; d.results.forEach(x => { const r = batchRows.find(y => y.rid === x.rid); if (r) r.expiresAt = x.expiresAt || ''; }); batchRender(); } catch {}
}
function batchExpireSoon(iso) { const t = new Date(iso + 'T00:00:00'); return (t - Date.now()) / 86400000 <= 7; }   // 7일 안이면 눈에 띄게
function batchRowFromSaved(x, positionId) {
  return { id: ++batchSeq, file: null, files: [], state: 'ok', result: x.result, error: '', positionId, open: false, rid: x.rid, saved: true, savedAt: x.savedAt, expiresAt: x.expiresAt || '', hired: x.hired || null, savedFiles: x.files || [], reg: x.reg && x.reg.id ? { id: x.reg.id, url: x.reg.url || '', name: (x.result.candidate && x.result.candidate.name) || '', phone: (x.result.candidate && x.result.candidate.phone) || '', team: '', job: '', status: '서류합격', interview1: '', interview2: '', smsStatus: '' } : null };
}
function batchDropSavedTwin(row) {   // 방금 평가·가져온 줄과 같은 rid의 "저장만 된 줄"은 지워요(같은 사람이 두 줄로 보이지 않게)
  if (!row.rid) return;
  batchRows = batchRows.filter(r => r === row || !(r.saved && !r.file && r.rid === row.rid));
}
async function batchLoadSaved(positionId, opts) {
  if (!positionId) return;
  try {
    const res = await fetch('/api/resume/results?positionId=' + encodeURIComponent(positionId)); const data = await readJsonOrNull(res);
    if (!res.ok || !data || !data.results) return;
    let added = 0;
    const serverRids = new Set(data.results.map(x => x.rid));
    if (opts && opts.prune) batchRows = batchRows.filter(r => !(r.rid && r.positionId === positionId && r.state !== 'run' && !serverRids.has(r.rid)));   // 서버에서 지워진(기한 만료 등) 결과는 화면에서도 지워요
    data.results.forEach(x => {
      const have = batchRows.find(r => r.rid && r.rid === x.rid);
      if (have) { have.expiresAt = x.expiresAt || have.expiresAt; have.hired = x.hired || null; if (have.saved && !have.file) { have.result = x.result; have.reg = batchRowFromSaved(x, positionId).reg; } return; }   // 이미 표에 있으면(방금 평가한 줄 등) 결과는 건드리지 않고 삭제 예정일만 갱신해요
      batchRows.push(batchRowFromSaved(x, positionId)); added++;
    });
    batchSavedCounts[positionId] = data.results.length;
    if (opts && opts.focus) batchPostingFilter = positionId;
    batchRender(); batchInfoRefresh();
    if (added && opts && opts.notify) setBatchStatus(`이 공고에 저장된 점수 결과 ${added}명을 불러왔어요. PDF 원본은 저장하지 않아서 "서류 합격 확정"을 해도 PDF는 붙지 않아요.`, 'ok');
  } catch { /* 저장된 결과를 못 불러와도 화면은 그대로 써요 */ }
}
async function batchRefreshCounts() {
  try { const res = await fetch('/api/resume/results-counts'); const d = await readJsonOrNull(res); if (res.ok && d && d.counts) { batchSavedCounts = d.counts; batchDecorateSelect(); } } catch {}
}
function batchDecorateSelect() {   // 평가할 공고 목록에 "(저장된 결과 N명)"을 붙여요
  [...evalPositionSelect.options].forEach(o => { if (!o.value) return; o.textContent = o.textContent.replace(/\s*· 저장된 결과 \d+명$/, ''); const n = batchSavedCounts[o.value]; if (n) o.textContent += ` · 저장된 결과 ${n}명`; });
}
async function batchDeleteSaved(row) {
  if (!row.rid || !row.positionId) return true;
  try { const res = await fetch('/api/resume/results/' + encodeURIComponent(row.rid) + '?positionId=' + encodeURIComponent(row.positionId), { method: 'DELETE' }); if (!res.ok && res.status !== 404) return false; } catch { return false; }
  if (batchSavedCounts[row.positionId]) batchSavedCounts[row.positionId] = Math.max(0, batchSavedCounts[row.positionId] - 1);
  return true;
}
async function batchSaveReg(row) {   // 노션에 기록한 사실도 저장해서, 화면을 다시 열어도 "서류 합격 확정됨"이 남게 해요
  if (!row.rid || !row.positionId || !row.reg || !row.reg.id) return;
  try { await fetch('/api/resume/results/' + encodeURIComponent(row.rid), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ positionId: row.positionId, reg: { id: row.reg.id, url: row.reg.url || '' } }) }); } catch {}
}

async function batchSetHired(row, hired) {   // 최종 합격 표시를 서버에 저장하고, 서버 기준(삭제 예정일 포함)으로 화면을 맞춰요
  try {
    const res = await fetch('/api/resume/results/' + encodeURIComponent(row.rid), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ positionId: row.positionId, hired }) }); const d = await readJsonOrNull(res);
    if (!res.ok) throw new Error((d && d.error) || '저장하지 못했어요.');
    await batchLoadSaved(row.positionId, { prune: true });
    setBatchStatus(hired ? '최종 합격으로 표시했어요. 인사서류로 보관돼요.' : '최종 합격 표시를 풀었어요.', 'ok');
  } catch (err) { setBatchStatus(err.message || '저장하지 못했어요.', 'err'); }
}

// 점수 볼 때 보낼 서류: 서버가 한 번에 4MB까지 받아서, 넘치면 이력서 → 경력기술서 → 자기소개서 → 포트폴리오 → 기타 → 자격증·증명서 순으로 담고 나머지는 알려줘요
const BATCH_KIND_ORDER = ['이력서', '경력기술서', '자기소개서', '포트폴리오', '기타', '자격증·증명서'];
function batchPickForScoring(row) {
  const all = batchFilesOf(row); row.leftOut = [];
  if (all.reduce((n, f) => n + f.size, 0) <= PDF_MAX_BYTES) return all;
  const rank = f => { const k = BATCH_KIND_ORDER.indexOf(batchKindOf[batchFileKey(f.name)] || '기타'); return k < 0 ? 4 : k; };
  const sorted = all.slice().sort((a, b) => rank(a) - rank(b)); const pick = []; let sum = 0;
  for (const f of sorted) { if (sum + f.size <= PDF_MAX_BYTES) { pick.push(f); sum += f.size; } else row.leftOut.push(f.name); }
  return pick.length ? pick : [sorted[0]];
}
async function batchEvaluate(row, positionId) {
  row.state = 'run'; row.error = ''; row.positionId = positionId; batchRender();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90000);
  try {
    const fl = batchPickForScoring(row); const multi = fl.length > 1;   // 한 사람의 서류가 여러 개면 한꺼번에 보내 통합해서 평가해요(4MB 안에서 중요한 서류부터)
    const res = await fetch((multi ? '/api/resume/analyze-multi' : '/api/resume/analyze') + '?positionId=' + encodeURIComponent(positionId) + (document.getElementById('batchUsePeers').checked ? '&peers=1' : '') + '&save=1' + (multi ? '' : '&filename=' + encodeURIComponent(fl[0].name)), { method: 'POST', headers: { 'Content-Type': multi ? 'application/octet-stream' : 'application/pdf' }, body: multi ? await batchBundleBody(fl) : row.file, signal: controller.signal });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error(res.status === 413 ? '파일이 너무 커서 서버가 받지 못했어요.' : '서버가 응답하지 못했어요.');
    if (!res.ok || !data.success) throw new Error(data.error || '평가 실패');
    row.result = data.result; row.state = 'ok'; row.rid = data.result.rid || ''; row.saveState = data.saved || '';
    batchDropSavedTwin(row);   // 같은 사람의 저장된 줄(PDF 없음)이 이미 표에 있으면 새로 평가한 줄로 바꿔요
    if (row.rid) batchRefreshExpiry(positionId);   // 삭제 예정일은 서버 값으로 채워요(채용 확정일이 있으면 계산이 달라서 화면에서 추측하지 않아요)
  } catch (err) {
    row.state = 'err';
    row.error = err.name === 'AbortError' ? 'AI 평가가 너무 오래 걸려 중단했어요.' : (err.message || '평가 중 오류가 발생했어요.');
  } finally { clearTimeout(timer); batchRender(); batchInfoRefresh(); }
}
async function batchRun(rows) {
  if (batchRunning) return;
  if (!rows.length) { setBatchStatus('점수를 볼 이력서가 없어요. PDF를 먼저 올려주세요.', 'err'); return; }
  const noPosting = rows.filter(r => !(r.preId || evalPositionSelect.value));   // 줄에서 고른 공고도, 위 "평가할 공고"도 없는 이력서
  if (noPosting.length) { setBatchStatus(`${noPosting.length}개 이력서는 어느 공고인지 정해지지 않았어요. 위 \"평가할 공고\"를 고르거나, 줄·분류 칸에서 공고를 골라주세요.`, 'err'); return; }
  if (!confirm(`이력서 ${rows.length}개를 평가해요.${new Set(rows.map(r => r.preId || evalPositionSelect.value)).size > 1 ? `\n(공고 ${new Set(rows.map(r => r.preId || evalPositionSelect.value)).size}개로 나눠서 평가해요)` : ''}\nAI를 ${rows.length}번 부르고, 그만큼 사용 비용이 들어요. 진행할까요?\n(노션 페이지는 만들지 않아요)`)) return;
  batchRunning = true; batchRunBtn.disabled = true;
  const queue = rows.slice(); let done = 0;
  const worker = async () => {
    while (queue.length) {
      const row = queue.shift();
      await batchEvaluate(row, row.preId || evalPositionSelect.value);   // 줄에서 고른 공고가 있으면 그 공고로, 없으면 위 "평가할 공고"로
      done++; setBatchStatus(`점수를 보는 중... ${done}/${rows.length}`);
    }
  };
  await Promise.all([worker(), worker()]);   // 한 번에 2개씩
  batchRunning = false; batchRunBtn.disabled = false;
  const fails = rows.filter(r => r.state === 'err').length;
  setBatchStatus(`${rows.length - fails}개의 점수를 봤어요${fails ? ` (${fails}개는 실패했어요. 줄의 "다시 평가"를 눌러보세요)` : ''}. 노션에 만들 사람은 줄 끝의 "노션에 등록"을 눌러주세요.`, fails ? 'err' : 'ok');
}
batchRunBtn.addEventListener('click', () => batchRun(batchRows.filter(r => r.state === 'wait')));

async function batchPrepareRegister(tr, row) {
  const st = await ensureNotionStatus(!(notionStatus && notionStatus.configured));
  const msg = tr.querySelector('.br-msg'); const submit = tr.querySelector('.br-submit');
  if (!st || !st.configured) { submit.disabled = true; msg.textContent = (st && st.message) || '노션 연결을 확인하지 못했어요.'; msg.className = 'status err br-msg'; return; }
  const o = st.options || {};
  const ch = tr.querySelector('.br-channel'); ch.innerHTML = optionsHtml(o.channels || [], '(선택 안 함)'); ch.value = (o.channels || []).includes('이메일') ? '이메일' : '';
  const stt = tr.querySelector('.br-status'); stt.innerHTML = optionsHtml(o.statuses || []); stt.value = (o.statuses || []).includes('서류합격') ? '서류합격' : (o.statuses || [''])[0];
}
// ---------- 파일로 공고·채점 결과 가져오기 ----------
async function readJsonFile(input, maxBytes) {
  const f = input.files && input.files[0]; input.value = '';
  if (!f) return { error: '' };
  if (f.size > maxBytes) return { error: `파일이 너무 커요(${Math.round(maxBytes / 1024)}KB 이하).` };
  if (!/\.json$/i.test(f.name) && f.type !== 'application/json') return { error: 'JSON 파일(.json)만 가져올 수 있어요.' };
  try { return { data: JSON.parse((await f.text()).replace(/^\uFEFF/, '')), name: f.name }; } catch { return { error: '파일을 읽지 못했어요. 이 앱에서 쓰는 JSON 파일이 맞는지 확인해주세요.' }; }
}
document.getElementById('postImportFile').addEventListener('change', async e => {
  const out = document.getElementById('postImportResult');
  const r = await readJsonFile(e.target, 1024 * 1024); if (!r.data && !r.error) return;
  out.hidden = false; out.innerHTML = '';
  const say = (t, cls) => { out.innerHTML = `<li class="${cls || ''}">${escapeHtml(t)}</li>`; };
  if (r.error) { say(r.error, 'err'); return; }
  const postings = Array.isArray(r.data) ? r.data : (r.data && r.data.postings);
  if (!Array.isArray(postings)) { say('공고 목록(postings)이 없어요. 이 앱에서 쓰는 공고 파일인지 확인해주세요.', 'err'); return; }
  if (!confirm(`파일의 공고 ${postings.length}개를 저장할까요?\n같은 팀·포지션이 이미 있으면 건너뛰어요.`)) { out.hidden = true; return; }
  say('가져오는 중...');
  try {
    const res = await fetch('/api/postings/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postings }) });
    const j = await readJsonOrNull(res);
    if (!j) throw new Error('서버가 응답하지 못했어요.');
    if (!res.ok) throw new Error(j.error || '가져오지 못했어요.');
    out.innerHTML = `<li class="ok"><strong>${j.created}개 저장, ${j.skipped}개 건너뜀, ${j.failed}개 실패</strong></li>` + (j.results.some(x => x.result === 'created' && x.status !== 'confirmed') ? '<li class="manage-hint">작성 중인 공고는 <strong>확정해야 이력서 평가의 "평가할 공고"에 나와요.</strong> 아래 "지금 확정"을 누르거나, 공고 조회 목록에서 공고를 열어 확정하세요.</li>' : '') + j.results.map(x => `<li class="${x.result === 'created' ? 'ok' : (x.result === 'skipped' ? '' : 'err')}" data-pid="${escapeHtml(x.id || '')}">${escapeHtml(x.label)} — ${x.result === 'created' ? `저장했어요 (${x.status === 'confirmed' ? '확정' : '작성 중'}${x.check && (x.check.error || x.check.warn) ? ` · 공고 점검: 수정 필요 ${x.check.error || 0}건, 확인 필요 ${x.check.warn || 0}건` : ''})${x.status !== 'confirmed' ? ` <button type="button" class="link-btn post-import-confirm" data-pid="${escapeHtml(x.id)}" data-errs="${(x.check && x.check.error) || 0}" data-warns="${(x.check && x.check.warn) || 0}">지금 확정</button>` : ''}` : escapeHtml(x.error || '')}</li>`).join('');
    await loadPostings();
  } catch (err) { say(err.message || '가져오는 중 오류가 발생했어요.', 'err'); }
});
// 작성 중 공고를 바로 확정해요(공고 가져오기 결과와 공고 조회 목록에서 같이 써요). 확정하면 이력서 평가의 "평가할 공고"에 나와요.
// 공고 점검의 수정 필요·확인 필요 건수가 있으면 확인창으로 알려주고(담당자가 판단해요), 서버가 거절하면(공고문이 너무 짧음 등) 그 이유를 보여줘요.
async function confirmPostingNow(id, errs, warns) {
  const note = (errs || warns) ? `공고 점검에서 수정 필요 ${errs}건, 확인 필요 ${warns}건이 있어요. 보통 공통 안내의 [입력] 빈칸(반환·보관 안내 등)이에요.\n이 빈칸은 이력서 평가에는 영향이 없지만, 사람인·잡코리아에 올리기 전에는 채워야 해요.\n\n` : '';
  if (!confirm(`${note}이 공고를 확정할까요? 확정하면 이력서 평가의 "평가할 공고"에 나와요.`)) return false;
  const res = await fetch('/api/postings/' + encodeURIComponent(id), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'confirmed' }) });
  const j = await readJsonOrNull(res); if (!j) throw new Error('서버가 응답하지 못했어요.'); if (!res.ok) throw new Error(j.error || '확정하지 못했어요.');
  await loadPostings();
  return true;
}
document.getElementById('postImportResult').addEventListener('click', async e => {
  const b = e.target.closest('.post-import-confirm'); if (!b) return;
  b.disabled = true;
  try {
    const ok = await confirmPostingNow(b.dataset.pid, Number(b.dataset.errs) || 0, Number(b.dataset.warns) || 0);
    if (ok) b.replaceWith(Object.assign(document.createElement('span'), { className: 'manage-hint', textContent: '✅ 확정했어요 — 이력서 평가 목록에 나와요' })); else b.disabled = false;
  } catch (err) { b.disabled = false; alert(err.message || '확정하는 중 오류가 발생했어요.'); }
});
document.getElementById('resultImportFile').addEventListener('change', async e => {
  const r = await readJsonFile(e.target, 3 * 1024 * 1024); if (!r.data && !r.error) return;
  if (r.error) { setBatchStatus(r.error, 'err'); return; }
  if (!evalPositionSelect.value) { setBatchStatus('평가할 공고를 먼저 선택해주세요. (위 "평가할 공고"에서 고르세요)', 'err'); return; }
  const candidates = Array.isArray(r.data) ? r.data : (r.data && r.data.candidates);
  if (!Array.isArray(candidates)) { setBatchStatus('채점 결과 목록(candidates)이 없어요. 이 앱에서 쓰는 채점 결과 파일인지 확인해주세요.', 'err'); return; }
  if (batchRows.length + candidates.length > 160) { setBatchStatus('점수 표가 너무 길어져요. "목록 비우기" 후 다시 가져와주세요.', 'err'); return; }
  setBatchStatus('채점 결과를 가져오는 중...');
  try {
    const res = await fetch('/api/resume/import-results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ positionId: evalPositionSelect.value, profile: r.data.profile || '', candidates }) });
    const j = await readJsonOrNull(res);
    if (!j) throw new Error('서버가 응답하지 못했어요.');
    if (!res.ok) throw new Error(j.error || '가져오지 못했어요.');
    const failed = [];
    // 같은 공고에 같은 이름이 이미 있으면 마지막 파일의 결과로 바꿔요(같은 파일을 두 번 가져와도 줄이 두 배가 되지 않게). 이미 노션에 기록한 줄은 바꾸지 않아요.
    let replaced = 0; const kept = [];
    j.results.forEach(x => {
      if (!x.ok) { failed.push(`${x.name || '(이름 없음)'}: ${x.error}`); return; }
      const nm = String((x.result.candidate && x.result.candidate.name) || '').trim();
      const same = nm && batchRows.find(r => r.imported && r.positionId === evalPositionSelect.value && String((r.result && r.result.candidate && r.result.candidate.name) || '').trim() === nm);
      if (same && same.reg && same.reg.id) { kept.push(nm); return; }
      if (same) { batchRows = batchRows.filter(r => r !== same); replaced++; }
      const nr = { id: ++batchSeq, file: null, state: 'ok', result: x.result, error: '', positionId: evalPositionSelect.value, imported: true, open: false, rid: x.result.rid || '', saveState: x.saved || '' };
      batchRows.push(nr); batchDropSavedTwin(nr); if (nr.rid) batchRefreshExpiry(nr.positionId);
    });
    batchRender(); batchInfoRefresh(); batchTable.hidden = !batchRows.length;
    const added = j.imported - kept.length;
    setBatchStatus(`채점 결과 ${added}명을 점수 표에 가져왔어요${replaced ? ` (그중 ${replaced}명은 같은 이름이 있어 마지막 결과로 바꿨어요)` : ''}${kept.length ? `, ${kept.length}명(${kept.slice(0, 3).join(', ')})은 이미 노션에 기록돼 있어 바꾸지 않았어요` : ''}${j.failed ? `, ${j.failed}명은 가져오지 못했어요 (${failed.slice(0, 3).join(' / ')}${failed.length > 3 ? ' 외' : ''})` : ''}. 합격시킬 사람을 "선정"해서 노션에 기록하세요.`, (j.failed || kept.length) ? 'err' : 'ok');
  } catch (err) { setBatchStatus(err.message || '가져오는 중 오류가 발생했어요.', 'err'); }
});

// ---------- 서류 합격 선정 → 한 번에 기록 ----------
// 점수를 보고 "선정"에 체크한 사람만 모아 노션에 서류 합격으로 기록해요. 이름·연락처는 이력서에서 읽은 값을 쓰고,
// 같은 사람이 노션에 있으면 건너뛰어요(강제 등록은 줄별 "서류 합격 확정"에서만 할 수 있어요). 한 명이 실패해도 나머지는 계속해요.
const batchPickBar = document.getElementById('batchPickBar'), batchPickInfo = document.getElementById('batchPickInfo'), batchRecordBtn = document.getElementById('batchRecordBtn');
let batchRecording = false;
function batchPickedRows() { return batchRows.filter(r => r.picked && r.state === 'ok' && !(r.reg && r.reg.id)); }
function batchPickRefresh() {
  const okRows = batchRows.filter(r => r.state === 'ok' && !(r.reg && r.reg.id));
  batchPickBar.hidden = !batchRows.some(r => r.state === 'ok');
  const picked = batchPickedRows();
  batchPickInfo.textContent = picked.length ? `${picked.length}명 선정: ${picked.map(r => `${(r.result.candidate && r.result.candidate.name) || '(이름 미확인)'} ${r.result.total}점`).join(', ')}` : (okRows.length ? '아직 선정한 사람이 없어요.' : '선정할 수 있는 줄이 없어요(이미 확정했거나 점수가 없어요).');
  batchRecordBtn.disabled = batchRecording || !picked.length;
  batchRecordBtn.textContent = picked.length ? `선정한 ${picked.length}명 노션에 기록하기` : '선정한 사람 노션에 기록하기';
}
batchBody.addEventListener('change', e => {
  const cb = e.target.closest('.batch-pick'); if (!cb) return;
  const tr = cb.closest('tr.batch-row'); const row = tr && batchRows.find(r => r.id === Number(tr.dataset.id)); if (!row) return;
  row.picked = cb.checked; batchPickRefresh();
});
document.getElementById('batchPickClearBtn').addEventListener('click', () => { if (batchRecording) return; batchRows.forEach(r => { r.picked = false; }); batchRender(); });
async function batchRecordOne(row, status = '서류합격') {
  const r = row.result, cand = r.candidate || {};
  const name = String(cand.name || '').trim();
  if (!name) return { ok: false, skip: true, msg: '이력서에서 이름을 읽지 못해 기록하지 않았어요. 줄의 "서류 합격 확정"에서 이름을 직접 입력해주세요.' };
  const st = notionStatus; const opts = (st && st.options) || {};
  if (!st || !st.configured) return { ok: false, msg: (st && st.message) || '노션 연결을 확인하지 못했어요.' };
  if (!(opts.statuses || []).includes(status)) return { ok: false, msg: `면접상태에 "${status}" 선택지가 없어서 기록하지 않았어요.` };
  const posTeam = r.position.name.includes(' - ') ? r.position.name.split(' - ')[0].trim() : '';
  const teams = opts.teams || [];
  const team = teams.includes(posTeam) ? posTeam : (teamAliases[posTeam] && teams.includes(teamAliases[posTeam]) ? teamAliases[posTeam] : '');
  const channel = (opts.channels || []).includes('이메일') ? '이메일' : '';
  const phone = String(cand.phone || '').trim();
  const job = jobFromPosition(r.position.name, r.position.brand);
  const res = await fetch('/api/notion/register-applicant', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name, phone, team, job, channels: channel ? [channel] : [], appliedAt: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }),
      status, recommendation: NOTION_REC_MAP[r.recommendation] || '', total: r.total, summary: batchSummary(r), education: cand.education || '', career: cand.career || '', force: false,
      checklist: (r.checklist || []).map(x => ({ code: x.code, status: x.status, note: x.note })),
    }),
  });
  const data = await readJsonOrNull(res);
  if (!data) return { ok: false, msg: '서버가 응답하지 못했어요.' };
  if (res.status === 409 && data.duplicate) {
    const who = (data.matches || []).map(m => `${m.name}${m.status ? '(' + m.status + ')' : ''}`).join(', ');
    return { ok: false, skip: true, msg: `노션에 같은 사람이 있어서 건너뛰었어요${who ? ': ' + who : ''}. 새로 등록하려면 줄의 "서류 합격 확정"을 쓰세요.` };
  }
  if (!res.ok) return { ok: false, msg: data.error || '등록하지 못했어요.' };
  row.reg = { id: data.id, url: safeNotionUrl(data.url) || '', name, phone, team, job, status, interview1: '', interview2: '', smsStatus: '' };
  batchSaveReg(row);
  let pdfMsg = '';
  if (!row.file) return { ok: true, msg: '노션에 서류 합격으로 기록했어요 (가져온 결과라 이력서 PDF는 붙이지 않았어요).' };
  try {   // 이력서 PDF도 붙여요(실패해도 카드는 이미 만들어졌어요)
    const fl = batchFilesOf(row); const failedFiles = [];
    for (let i = 0; i < fl.length; i++) {   // 묶음이면 서류마다 한 번씩 붙여요(이름은 원래 파일 이름)
      const ar = await fetch(`/api/notion/attach-resume?pageId=${encodeURIComponent(data.id)}&filename=${encodeURIComponent(fl.length > 1 ? `${name}_${fl[i].name}` : name + '_이력서.pdf')}`, { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: fl[i] });
      const ad = await readJsonOrNull(ar); if (!ar.ok) failedFiles.push(`${fl[i].name}: ${(ad && ad.error) || '첨부 실패'}`);
    }
    if (failedFiles.length) throw new Error(failedFiles.join(' / '));
  } catch (err) { pdfMsg = ` (이력서 PDF는 붙이지 못했어요: ${err.message || ''})`; }
  return { ok: true, msg: `${status === '서류합격' ? '서류 합격으로' : `"${status}"로`}기록했어요${pdfMsg}.`, pdfFail: !!pdfMsg };
}
batchRecordBtn.addEventListener('click', async () => {
  if (batchRecording) return;
  const picked = batchPickedRows(); if (!picked.length) return;
  const lines = picked.map(r => `- ${(r.result.candidate && r.result.candidate.name) || '(이름 미확인)'} · ${r.result.total}점 · ${r.result.recommendation}`).join('\n');
  if (!confirm(`아래 ${picked.length}명을 노션에 "서류합격"으로 기록할까요?\n${lines}\n\n노션에 같은 사람이 있으면 건너뛰어요. 합격·탈락은 사람이 정한 결정이에요.`)) return;
  batchRecording = true; batchRows.forEach(r => { if (r.picked) { r.recording = true; r.recMsg = '기록 중...'; r.recErr = false; } }); batchRender(); batchPickRefresh();
  setBatchStatus(`선정한 ${picked.length}명을 노션에 기록하는 중...`, '');
  let done = 0, skipped = 0, failed = 0;
  try { await ensureNotionStatus(true); } catch { /* 아래에서 안내해요 */ }
  for (const row of picked) {   // 노션 요청이 몰리지 않게 한 명씩 차례로
    let out;
    try { out = await batchRecordOne(row); } catch (err) { out = { ok: false, msg: (err && err.message) || '기록 중 오류가 발생했어요.' }; }
    row.recording = false; row.recMsg = out.msg; row.recErr = !out.ok && !out.skip;
    if (out.ok) { done++; row.picked = false; } else if (out.skip) { skipped++; } else { failed++; }
    batchRender(); batchPickRefresh();
  }
  batchRecording = false; batchRender(); batchPickRefresh();
  setBatchStatus(`기록 결과: ${done}명 기록${skipped ? `, ${skipped}명 건너뜀(중복이거나 이름 없음)` : ''}${failed ? `, ${failed}명 실패` : ''}. 각 줄 아래에 사유를 적었어요.${done ? ' 기록한 줄에서 "📨 면접 문자"로 이어갈 수 있어요.' : ''}`, failed ? 'err' : 'ok');
});

async function batchRegister(row, tr, force) {
  const r = row.result; const cand = r.candidate || {};
  const name = tr.querySelector('.br-name').value.trim();
  const msg = tr.querySelector('.br-msg'); const submit = tr.querySelector('.br-submit');
  if (!name) { msg.textContent = '지원자 이름을 입력해주세요.'; msg.className = 'status err br-msg'; return; }
  const st = notionStatus;
  const posTeam = r.position.name.includes(' - ') ? r.position.name.split(' - ')[0].trim() : '';
  const teams = (st && st.options && st.options.teams) || [];
  const team = teams.includes(posTeam) ? posTeam : (teamAliases[posTeam] && teams.includes(teamAliases[posTeam]) ? teamAliases[posTeam] : '');
  const channel = tr.querySelector('.br-channel').value;
  submit.disabled = true; msg.textContent = '노션에 등록 중...'; msg.className = 'status br-msg';
  try {
    const res = await fetch('/api/notion/register-applicant', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, phone: tr.querySelector('.br-phone').value.trim(), team, job: jobFromPosition(r.position.name, r.position.brand),
        channels: channel ? [channel] : [], appliedAt: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }),
        status: tr.querySelector('.br-status').value, recommendation: NOTION_REC_MAP[r.recommendation] || '',
        total: r.total, summary: batchSummary(r), education: cand.education || '', career: cand.career || '', force,
        checklist: (r.checklist || []).map(x => ({ code: x.code, status: x.status, note: x.note })),   // 카드 본문에 서류 체크리스트를 기록해요
      }),
    });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error('서버가 응답하지 못했어요.');
    if (res.status === 409 && data.duplicate) {
      const list = (data.matches || []).map(m => `- ${m.name} (${m.status || '상태 없음'}${m.team ? ' · ' + m.team : ''})`).join('\n');
      if (confirm(`이미 노션에 있는 지원자일 수 있어요:\n${list}\n\n그래도 새로 등록할까요?`)) { submit.disabled = false; return batchRegister(row, tr, true); }
      msg.textContent = '중복일 수 있어서 등록하지 않았어요.'; msg.className = 'status br-msg'; submit.disabled = false; return;
    }
    if (!res.ok) throw new Error(data.error || '등록 실패');
    row.reg = { id: data.id, url: safeNotionUrl(data.url) || '', name, phone: tr.querySelector('.br-phone').value.trim(), team, job: jobFromPosition(r.position.name, r.position.brand), status: tr.querySelector('.br-status').value, interview1: '', interview2: '', smsStatus: '' };
    batchSaveReg(row);
    batchRender();
    if (!row.file) { setBatchStatus(`${name} 님을 서류 합격으로 확정해 노션에 등록했어요 (가져온 결과라 이력서 PDF는 붙이지 않았어요). 이어서 줄의 "📨 면접 문자"로 면접 문자를 보내세요.`, 'ok'); return; }
    // 이력서 PDF도 붙임 (실패해도 카드는 이미 만들어졌으니 안내만)
    try {
      const fl = batchFilesOf(row); const failedFiles = [];
      for (let i = 0; i < fl.length; i++) {
        const ar = await fetch(`/api/notion/attach-resume?pageId=${encodeURIComponent(data.id)}&filename=${encodeURIComponent(fl.length > 1 ? `${name}_${fl[i].name}` : name + '_이력서.pdf')}`, { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: fl[i] });
        const ad = await readJsonOrNull(ar);
        if (!ar.ok) failedFiles.push(`${fl[i].name}: ${(ad && ad.error) || '첨부 실패'}`);
      }
      if (failedFiles.length) throw new Error(failedFiles.join(' / '));
      setBatchStatus(`${name} 님을 서류 합격으로 확정해 노션에 등록하고 ${fl.length > 1 ? `서류 ${fl.length}개를` : '이력서 PDF도'} 붙였어요. 이어서 줄의 "📨 면접 문자"로 면접 문자를 보내세요.`, 'ok');
    } catch (err) {
      setBatchStatus(`${name} 님은 서류 합격으로 확정돼 노션에 등록됐지만 PDF는 붙이지 못했어요: ${err.message || ''} (노션에서 직접 붙이거나, 위 "이력서 평가"에서 같은 PDF로 다시 시도해주세요)`, 'err');
    }
  } catch (err) {
    msg.textContent = err.message || '노션 등록 중 오류가 발생했어요.'; msg.className = 'status err br-msg'; submit.disabled = false;
  }
}
// 노션에 적는 요약 (일괄 화면은 AI 점수 그대로)
function batchSummary(r) {
  const lines = [`[이력서 검토 · AI 1차 평가] 포지션: ${r.position.name}`, `총점 ${r.total}/100`, r.rubric.map(item => `${item.area} ${r.scores[item.key]}/${item.max}`).join(' · ')];
  if (r.summary) lines.push('총평: ' + r.summary);
  if (r.strengths.length) lines.push('강점: ' + r.strengths.join(', '));
  if (r.concerns.length) lines.push('우려: ' + r.concerns.join(', '));
  if (r.valuesEvidence && r.valuesEvidence.length) lines.push('인재상 근거: ' + r.valuesEvidence.map(v => v.item).join(', '));
  return lines.join('\n');
}
batchBody.addEventListener('click', async e => {
  const tr = e.target.closest('tr');
  if (!tr) return;
  const row = batchRows.find(r => r.id === Number(tr.dataset.id));
  if (!row) return;
  if (e.target.closest('.batch-detail-btn')) { row.open = !row.open; batchRender(); return; }
  if (e.target.closest('.batch-pass1-btn')) {   // 1차 면접 전형으로 넘겨요: 지원자로 등록(상태 1차 면접 예정자)하고 문자 보내기에 이름·연락처를 채워요
    const nm = (row.result && row.result.candidate && row.result.candidate.name) || row.personName || '이 지원자';
    if (!confirm(`${nm} 님을 1차 면접 전형으로 넘길까요?\n\n지원자 목록에 "1차 면접 예정자"로 등록되고, 문자 보내기 화면에 이름·연락처가 채워져요(문자는 직접 보내요).`)) return;
    row.recording = true; row.recMsg = '1차 면접으로 넘기는 중...'; row.recErr = false; batchRender();
    let out; try { await ensureNotionStatus(true); out = await batchRecordOne(row, '1차 면접 예정자'); } catch (err) { out = { ok: false, msg: (err && err.message) || '넘기지 못했어요.' }; }
    row.recording = false; row.recMsg = out.msg; row.recErr = !out.ok && !out.skip; batchRender();
    if (out.ok && row.reg) {
      let saved = 0; for (const f of batchFilesOf(row)) { try { const r2 = await fetch('/api/applicants/' + encodeURIComponent(row.reg.id) + '/docs?filename=' + encodeURIComponent(f.name), { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: f }); if (r2.ok) saved++; } catch { /* 서류 저장 실패는 아래 안내 */ } }   // 지원자 페이지에서 PDF를 열 수 있게 서류도 저장해요
      row.recMsg = `${out.msg} 서류 ${saved}/${batchFilesOf(row).length}개를 지원자 페이지에 저장했어요.`; batchRender();
      setBatchStatus(`${nm} 님을 1차 면접 전형으로 넘겼어요. 문자 보내기 화면에서 면접 안내를 보내주세요.`, 'ok'); if (canEdit('send')) fillSendFormFromNotion({ id: row.reg.id, name: row.reg.name, phone: row.reg.phone, team: row.reg.team, job: row.reg.job, status: row.reg.status, interview1: '', interview2: '', smsStatus: '' }); }
    else setBatchStatus(out.msg, out.ok ? 'ok' : 'err');
    return;
  }
  if (e.target.closest('.batch-reject-btn')) {   // 서류탈락: 점수·요약 결과와 보관함의 서류 글을 바로 지워요(되돌릴 수 없어요)
    const cand = (row.result && row.result.candidate) || {}; const nm = cand.name || row.personName || '이 지원자';
    if (!confirm(`${nm} 님을 서류탈락으로 처리할까요?\n\n점수·요약 내용과 저장된 서류 글이 바로 지워지고 되돌릴 수 없어요. (불합격 안내 문자는 따로 보내주세요)`)) return;
    const ok = await batchDeleteSaved(row);
    if (!ok) { setBatchStatus('서버에서 지우지 못했어요. 잠시 후 다시 눌러주세요.', 'err'); return; }
    if (cand.name) { try { await fetch('/api/resume-locker/by-person?' + new URLSearchParams({ name: cand.name, phone: cand.phone || '' }), { method: 'DELETE' }); } catch { /* 보관함에 없으면 그대로 */ } }
    batchRows = batchRows.filter(r => r !== row); batchRender(); batchInfoRefresh(); batchDecorateSelect();
    setBatchStatus(`${nm} 님을 서류탈락으로 처리하고 내용을 지웠어요.`, 'ok');
    return;
  }
  if (e.target.closest('.batch-reg-btn')) {
    row.open = true; batchRender();
    const d = batchBody.querySelector(`tr.batch-detail[data-id="${row.id}"]`);
    if (d) { const nm = d.querySelector('.br-name'); if (nm) nm.focus(); d.scrollIntoView({ block: 'nearest' }); }
    return;
  }
  if (e.target.closest('.br-submit')) { batchRegister(row, tr, false); return; }
  if (e.target.closest('.batch-sms-btn')) { if (row.reg) fillSendFormFromNotion({ id: row.reg.id, name: row.reg.name, phone: row.reg.phone, team: row.reg.team, job: row.reg.job, status: row.reg.status, interview1: '', interview2: '', smsStatus: '' }); return; }
  if (e.target.closest('.batch-sch-btn')) { if (row.reg) fillScheduleFormFromNotion({ id: row.reg.id, name: row.reg.name, phone: row.reg.phone, team: row.reg.team, job: row.reg.job, status: row.reg.status, interview1: '', interview2: '', smsStatus: '' }); return; }
  if (e.target.closest('.batch-retry-btn')) { batchRun([row]); return; }
  if (e.target.closest('.batch-remove-btn')) { batchRows = batchRows.filter(r => r.id !== row.id); batchRender(); batchInfoRefresh(); return; }
  if (e.target.closest('.batch-hire-btn')) {
    const nm = (row.result && row.result.candidate && row.result.candidate.name) || '이 사람';
    const yrs = retState.hiredYears || 5;
    const today = new Date().toLocaleDateString('sv-SE');
    const d = prompt(`${nm} 님을 최종 합격(입사 확정)으로 표시해요.\n인사서류로 보고 합격 확정일부터 ${yrs}년 보관해요(채용서류 반환 청구 대상이 아니에요).\n※ 입사하지 않은 합격자는 누르지 마세요(채용서류로 일반 기한이 적용돼요).\n\n합격 확정일을 YYYY-MM-DD로 적어주세요.`, today);
    if (d === null) return;
    batchSetHired(row, { date: String(d).trim() });
    return;
  }
  if (e.target.closest('.batch-unhire-btn')) {
    const nm = (row.result && row.result.candidate && row.result.candidate.name) || '이 사람';
    if (!confirm(`${nm} 님의 최종 합격 표시를 풀까요?\n인사서류 보관이 풀리고 일반 결과처럼 저장일부터 ${retState.days}일 뒤 삭제돼요(이미 그 기간이 지났다면 바로 삭제돼요).`)) return;
    batchSetHired(row, null);
    return;
  }
  if (e.target.closest('.batch-delsaved-btn')) {
    const nm = (row.result && row.result.candidate && row.result.candidate.name) || '이 사람';
    const hiredWarn = row.hired ? `※ ${nm} 님은 최종 합격으로 표시돼 인사서류로 보관 중인 사람이에요. 지우면 보관 기간(${row.expiresAt || ''}까지) 전에 없어져요.\n` : '';
    if (!confirm(`${hiredWarn}${nm} 님의 점수 결과를 삭제할까요?\n서버에 저장된 이름·연락처·나이·학교 등 인적사항과 점수가 지워지고 되돌릴 수 없어요. (노션에 이미 기록한 카드는 그대로예요)`)) return;
    batchDeleteSaved(row).then(ok => { if (!ok) { setBatchStatus('삭제하지 못했어요. 잠시 후 다시 시도해주세요.', 'err'); return; } batchRows = batchRows.filter(r => r.id !== row.id); batchRender(); batchInfoRefresh(); batchDecorateSelect(); setBatchStatus(`${nm} 님의 점수 결과를 삭제했어요.`, 'ok'); });
    return;
  }
});

// ---------- 보관 기간·자동 삭제 설정 상자 ----------
let retState = { days: 180, hiredYears: 5, confirmed: {}, log: [] };
const retStatus = document.getElementById('retStatus');
function retSetStatus(msg, cls) { retStatus.textContent = msg || ''; retStatus.className = 'status' + (cls ? ' ' + cls : ''); }
function retRender() {
  const pid = evalPositionSelect.value;
  document.getElementById('retDays').value = retState.days; document.getElementById('retHiredYears').value = retState.hiredYears;
  document.getElementById('retConfirm').value = (pid && retState.confirmed[pid]) || '';
  document.getElementById('retConfirm').disabled = !pid; document.getElementById('retConfirmBtn').disabled = !pid; document.getElementById('retConfirmClear').disabled = !pid;
  document.getElementById('retSummary').textContent = `· 저장 후 ${retState.days}일 뒤 자동 삭제${pid && retState.confirmed[pid] ? ` (이 공고는 확정일 ${retState.confirmed[pid]} 기준)` : ''}`;
  document.getElementById('retLog').innerHTML = retState.log.length ? retState.log.map(x => `<li>${escapeHtml(String(x.at).slice(0, 16).replace('T', ' '))} · ${escapeHtml(x.positionName || '')} · ${Number(x.deleted) || 0}명 삭제 · ${escapeHtml(x.reason || '')}</li>`).join('') : '<li class="manage-hint">아직 삭제 기록이 없어요.</li>';
}
async function retLoad() {
  try { const res = await fetch('/api/resume/retention'); const d = await readJsonOrNull(res); if (res.ok && d) { retState = { days: d.days, hiredYears: d.hiredYears || 5, confirmed: d.confirmed || {}, log: d.log || [] }; retRender(); } } catch {}
}
async function retSave(body, okMsg) {
  try {
    const res = await fetch('/api/resume/retention', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const d = await readJsonOrNull(res);
    if (!res.ok) throw new Error((d && d.error) || '저장하지 못했어요.');
    retSetStatus(okMsg + (d.purged ? ` 기한이 지난 결과 ${d.purged}명을 바로 삭제했어요.` : ''), 'ok');
    await retLoad();
    if (evalPositionSelect.value) await batchLoadSaved(evalPositionSelect.value, { focus: true, prune: true });   // 서버에서 지워진 줄은 화면에서도 지워요
    batchRefreshCounts();
  } catch (err) { retSetStatus(err.message || '저장하지 못했어요.', 'err'); }
}
document.getElementById('retDaysBtn').addEventListener('click', () => {
  const n = Number(document.getElementById('retDays').value);
  if (!Number.isInteger(n) || n < 14 || n > 180) { retSetStatus('보관 기간은 14~180일 사이의 정수로 적어주세요.', 'err'); return; }
  if (n < retState.days && !confirm(`보관 기간을 ${n}일로 줄이면 저장일로부터 ${n}일이 지난 결과는 지금 바로 삭제돼요(되돌릴 수 없어요). 진행할까요?`)) return;
  retSave({ days: n }, `보관 기간을 ${n}일로 정했어요.`);
});
document.getElementById('retHiredBtn').addEventListener('click', () => {
  const n = Number(document.getElementById('retHiredYears').value);
  if (!Number.isInteger(n) || n < 3 || n > 10) { retSetStatus('합격자(인사서류) 보관 기간은 3~10년 사이의 정수로 적어주세요.', 'err'); return; }
  if (n < retState.hiredYears && !confirm(`합격자 보관 기간을 ${n}년으로 줄이면 합격 확정일로부터 ${n}년이 지난 합격자 결과는 지금 바로 삭제돼요(되돌릴 수 없어요). 진행할까요?`)) return;
  retSave({ hiredYears: n }, `합격자(인사서류) 보관 기간을 ${n}년으로 정했어요.`);
});
document.getElementById('retConfirmBtn').addEventListener('click', () => {
  const pid = evalPositionSelect.value; const v = document.getElementById('retConfirm').value;
  if (!pid) { retSetStatus('공고를 먼저 선택해주세요.', 'err'); return; } if (!v) { retSetStatus('확정일을 골라주세요.', 'err'); return; }
  retSave({ positionId: pid, confirmedDate: v }, `이 공고의 채용 여부 확정일을 ${v}로 정했어요.`);
});
document.getElementById('retConfirmClear').addEventListener('click', () => { const pid = evalPositionSelect.value; if (pid) retSave({ positionId: pid, confirmedDate: '' }, '확정일을 지웠어요. 저장일부터 세요.'); });
evalPositionSelect.addEventListener('change', retRender);
retLoad();

document.getElementById('batchDeleteAllSavedBtn').addEventListener('click', async () => {
  const pid = evalPositionSelect.value; if (!pid) { setBatchStatus('삭제할 공고를 먼저 선택해주세요.', 'err'); return; }
  const n = batchRows.filter(r => r.positionId === pid && r.rid).length || batchSavedCounts[pid] || 0;
  if (!confirm(`이 공고에 저장된 점수 결과를 모두 삭제할까요?${n ? ` (화면 기준 ${n}명)` : ''}\n서버에 저장된 이름·연락처·나이·학교 등 인적사항과 점수가 지워지고 되돌릴 수 없어요. (노션에 이미 기록한 카드는 그대로예요)`)) return;
  try {
    const res = await fetch('/api/resume/results?positionId=' + encodeURIComponent(pid), { method: 'DELETE' }); const d = await readJsonOrNull(res);
    if (!res.ok) throw new Error((d && d.error) || '삭제하지 못했어요.');
    batchRows = batchRows.filter(r => !(r.positionId === pid && r.rid && !r.hired)); batchSavedCounts[pid] = d.keptHired || 0;
    batchRender(); batchInfoRefresh(); batchDecorateSelect(); setBatchStatus(`이 공고의 저장된 점수 결과 ${d.deleted}명을 삭제했어요.${d.keptHired ? ` 최종 합격으로 표시한 ${d.keptHired}명은 인사서류로 보관 중이라 남겼어요(지우려면 줄의 "합격 해제" 또는 "삭제").` : ''}`, 'ok');
  } catch (err) { setBatchStatus(err.message || '삭제하지 못했어요.', 'err'); }
});
// 화면을 열 때: 공고별 저장 인원을 표시하고, 이미 고른 공고가 있으면 그 공고의 저장된 결과를 불러와요
batchRefreshCounts().then(() => { if (evalPositionSelect.value) batchLoadSaved(evalPositionSelect.value, { focus: true }); });

// ---------- 끝까지 실행됐다는 표시 (이 줄에 도달했다면 위쪽 코드가 중간에 멈추지 않았다는 뜻이에요) ----------
window.__appScriptCompleted = true;


// ---------- 오늘 할 일(첫 화면 위): 오늘 면접 · 면접 제안 대기 · 과제 마감 임박 · 단계별 인원 ----------
// 누르면 해당 화면으로 바로 가요. 볼 권한이 없는 칸은 나오지 않아요.
async function todayLoad() {
  const board = document.getElementById('todayBoard'); if (!board) return;
  let d = null, oa = null;
  try { const r = await fetch('/api/dashboard'); d = r.ok ? await r.json() : null; } catch { d = null; }
  try { const r = await fetch('/api/offer-alerts'); oa = r.ok ? await r.json() : null; } catch { oa = null; }
  if (!d) { board.hidden = true; return; }
  const cards = []; const wd = '일월화수목금토';
  const [yy, mo, dd] = d.today.split('-').map(Number); const dow = new Date(Date.UTC(yy, mo - 1, dd)).getUTCDay(); document.getElementById('todayDate').textContent = `${mo}월 ${dd}일 (${wd[dow]})`;   // 한국 날짜 그대로(브라우저 시간대와 상관없이)
  if (d.todayInterviews) cards.push(`<div class="today-card"><h4>📅 오늘 면접</h4><div class="today-num">${d.todayInterviews.length}건</div>${d.todayInterviews.length ? `<ul>${d.todayInterviews.slice(0, 6).map(x => `<li>${escapeHtml(x.time)} ${escapeHtml(x.name)} <span class="ap-sub">${escapeHtml([x.team, x.round].filter(Boolean).join(' · '))}</span></li>`).join('')}</ul>` : ''}<button type="button" class="link-btn" data-go="sched">일정 등록·목록 열기</button></div>`);
  if (oa && oa.enabled) cards.push(`<div class="today-card"><h4>📨 면접 제안 대기</h4><div class="today-num">${(oa.alerts || []).length}명</div>${(oa.alerts || []).length ? `<ul>${oa.alerts.slice(0, 5).map(x => `<li>${escapeHtml(x.name || '')} <span class="ap-sub">${escapeHtml(x.team || '')}</span></li>`).join('')}</ul><button type="button" class="link-btn" data-go="offers">제안 목록 열기</button>` : ''}</div>`);
  if (d.tasksDue) cards.push(`<div class="today-card"><h4>⏰ 과제 마감 임박 (3일 안)</h4><div class="today-num">${d.tasksDue.length}명</div>${d.tasksDue.length ? `<ul>${d.tasksDue.slice(0, 6).map(x => `<li><button type="button" class="link-btn" data-go="person" data-name="${escapeHtml(x.name)}">${escapeHtml(x.name)}</button> <span class="${x.overdue ? 'today-late' : 'ap-sub'}">${x.overdue ? '마감 지남 ' : ''}${escapeHtml(x.dueAt.slice(5).replace('-', '/'))}</span></li>`).join('')}</ul>` : ''}</div>`);
  if (d.statusCounts) { const total = d.statusCounts.reduce((n, x) => n + x.count, 0); cards.push(`<div class="today-card"><h4>👥 단계별 인원 (총 ${total}명)</h4><div class="today-steps">${d.statusCounts.map(x => `<button type="button" class="today-step" data-go="status" data-status="${escapeHtml(x.status)}">${escapeHtml(x.status)}<b>${x.count}</b></button>`).join('')}</div></div>`); }
  document.getElementById('todayBody').innerHTML = cards.join('');
  board.hidden = !cards.length;
  try { if (localStorage.getItem('todayFolded') === '1') { board.classList.add('folded'); document.getElementById('todayToggle').textContent = '펼치기'; } } catch { /* 저장 안 돼도 괜찮아요 */ }
}
document.getElementById('todayToggle').addEventListener('click', () => {
  const b = document.getElementById('todayBoard'); const f = b.classList.toggle('folded'); document.getElementById('todayToggle').textContent = f ? '펼치기' : '접기';
  try { localStorage.setItem('todayFolded', f ? '1' : '0'); } catch { /* 괜찮아요 */ }
});
document.getElementById('todayBody').addEventListener('click', async e => {
  const b = e.target.closest('[data-go]'); if (!b) return; const go = b.dataset.go;
  if (go === 'sched') openScheduleView();
  else if (go === 'offers') oaOpen();
  else if (go === 'status' || go === 'person') {
    showTab('interview'); if (apView !== 'list') apSetView('list');
    if (apStatus.options.length <= 1) { try { await loadApplicants(true); } catch { /* 아래에서 다시 불러와요 */ } }   // 상태 선택지를 먼저 채워요
    if (go === 'status') { apSearch.value = ''; if ([...apStatus.options].some(o => o.value === b.dataset.status)) apStatus.value = b.dataset.status; }
    else { apStatus.value = 'all'; apSearch.value = b.dataset.name || ''; }
    loadApplicants(true);
  }
});
