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
let ME = { mode: 'none', authed: true, role: 'full', perms: { send: 'edit', history: 'edit', schedule: 'edit', resume: 'edit', templates: 'edit' } };
function canView(menu) { return (PERM_LEVEL[ME.perms[menu]] || 0) >= 1; }
function canEdit(menu) { return (PERM_LEVEL[ME.perms[menu]] || 0) >= 2; }

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
const companyIntroInput = document.getElementById('companyIntroInput');
const idealProfileInput = document.getElementById('idealProfileInput');
const positionSelect = document.getElementById('positionSelect');
const requirementsInput = document.getElementById('requirementsInput');
const saveCriteriaBtn = document.getElementById('saveCriteriaBtn');
const resetCriteriaBtn = document.getElementById('resetCriteriaBtn');
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

async function loadTemplates() {
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

async function handleSend() {
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
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();

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

function monthKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function updateMonthFilterOptions() {
  const months = [...new Set(historyRaw.map(h => monthKey(h.sentAt)))].sort().reverse();
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

  let filtered = historyRaw.filter(item => {
    const matchesKeyword = !keyword
      || item.name.toLowerCase().includes(keyword)
      || (item.phone || '').replace(/-/g, '').includes(keyword.replace(/-/g, ''));
    const matchesMonth = !monthValue || monthKey(item.sentAt) === monthValue;
    return matchesKeyword && matchesMonth;
  });

  if (!filtered.length) {
    historyBody.innerHTML = '<tr><td colspan="10" class="empty-row">조건에 맞는 발송 이력이 없습니다.</td></tr>';
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
      <td data-label="양식"><button class="history-msg-btn" data-id="${item.id}" title="${escapeHtml(item.templateLabel)} — 눌러서 보낸 문자 확인">${item.templateLabel}</button></td>
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
      <td><button class="history-schedule-btn" data-edit="schedule" data-id="${item.id}">일정 등록</button></td>
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
sendBtn.addEventListener('click', handleSend);

// ---------- 탭 전환 ----------
function showTab(tab) {
  tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  sendView.hidden = tab !== 'send';
  resumeView.hidden = tab !== 'resume';
  manageView.hidden = tab !== 'manage';
  if (tab === 'manage') refreshTemplateManageSelect();
  if (tab === 'resume' && !criteriaDirty) loadCriteria();
  if (tab === 'send') loadTemplates(); // 양식 변경사항 반영
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

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
  const statusMsg = node.querySelector('.sch-status-msg');

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
let criteriaState = null;      // { idealProfile, positions: [{id, name, requirements}], rubric: [...] }
let editingPositionId = null;  // 지금 채용요건 칸에 펼쳐진 포지션
let criteriaDirty = false;     // 저장하지 않은 수정이 있는지
let lastScreening = null;      // 마지막 AI 평가 결과 (총점 재계산에 사용)

function commitEditorToState() {
  if (!criteriaState) return;
  criteriaState.companyIntro = companyIntroInput.value;
  criteriaState.idealProfile = idealProfileInput.value;
  const p = criteriaState.positions.find(x => x.id === editingPositionId);
  if (p) p.requirements = requirementsInput.value;
}

function fillPositionSelects() {
  const keepEdit = editingPositionId;
  const keepEval = evalPositionSelect.value;
  const opts = criteriaState.positions
    .map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join('');
  positionSelect.innerHTML = opts;
  evalPositionSelect.innerHTML = opts;
  const has = id => criteriaState.positions.some(p => p.id === id);
  if (has(keepEdit)) positionSelect.value = keepEdit;
  if (has(keepEval)) evalPositionSelect.value = keepEval;
}

function renderRubricTable() {
  rubricBody.innerHTML = (criteriaState.rubric || []).map(r => `
    <tr>
      <td data-label="평가 영역"><strong>${escapeHtml(r.area)}</strong></td>
      <td data-label="세부 항목">${escapeHtml(r.item)}</td>
      <td data-label="배점">${r.max}점</td>
      <td data-label="평가 기준">${escapeHtml(r.criteria)}</td>
    </tr>`).join('');
}

function renderCriteria() {
  fillPositionSelects();
  companyIntroInput.value = criteriaState.companyIntro || '';
  idealProfileInput.value = criteriaState.idealProfile;
  editingPositionId = positionSelect.value || (criteriaState.positions[0] && criteriaState.positions[0].id);
  const p = criteriaState.positions.find(x => x.id === editingPositionId);
  requirementsInput.value = p ? p.requirements : '';
  renderRubricTable();
}

async function loadCriteria() {
  try {
    const res = await fetch('/api/criteria');
    const data = await res.json();
    if (!res.ok || !Array.isArray(data.positions)) throw new Error(data.error || '불러오기 실패');
    criteriaState = data;
    renderCriteria();
    criteriaDirty = false;
  } catch (err) {
    criteriaStatus.textContent = '인재상/채용요건을 불러오지 못했습니다: ' + (err.message || '');
    criteriaStatus.className = 'status err';
  }
}

[companyIntroInput, idealProfileInput, requirementsInput].forEach(el => el.addEventListener('input', () => {
  criteriaDirty = true;
  criteriaStatus.textContent = '';
}));

positionSelect.addEventListener('change', () => {
  commitEditorToState();               // 이전 포지션에서 고친 내용을 먼저 보관 (editingPositionId는 아직 이전 값)
  editingPositionId = positionSelect.value;
  const p = criteriaState.positions.find(x => x.id === editingPositionId);
  requirementsInput.value = p ? p.requirements : '';
});

saveCriteriaBtn.addEventListener('click', async () => {
  if (!criteriaState) return;
  commitEditorToState();
  saveCriteriaBtn.disabled = true;
  try {
    const res = await fetch('/api/criteria', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyIntro: criteriaState.companyIntro,
        idealProfile: criteriaState.idealProfile,
        positions: criteriaState.positions.map(({ id, name, requirements }) => ({ id, name, requirements })),
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '저장 실패');
    criteriaState = data;
    criteriaDirty = false;
    criteriaStatus.textContent = '저장되었습니다. (회사 소개·인재상·모든 포지션이 함께 저장돼요)';
    criteriaStatus.className = 'status ok';
  } catch (err) {
    criteriaStatus.textContent = err.message || '저장 중 오류가 발생했습니다.';
    criteriaStatus.className = 'status err';
  } finally {
    saveCriteriaBtn.disabled = false;
  }
});

resetCriteriaBtn.addEventListener('click', async () => {
  if (!confirm('회사 소개·인재상과 모든 포지션의 채용요건이 기본값으로 바뀌어요.\n직접 수정한 내용은 사라집니다. 계속할까요?')) return;
  try {
    const res = await fetch('/api/criteria/reset', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '실패');
    criteriaState = data;
    renderCriteria();
    criteriaDirty = false;
    criteriaStatus.textContent = '문서 기본값으로 되돌렸어요.';
    criteriaStatus.className = 'status ok';
  } catch (err) {
    criteriaStatus.textContent = err.message || '되돌리는 중 오류가 발생했습니다.';
    criteriaStatus.className = 'status err';
  }
});

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
  resumeAiTotal.textContent = total !== lastScreening.total
    ? `(AI 평가 ${lastScreening.total}점 → ${changed}곳 직접 수정)`
    : '';
}

function listHtml(arr) {
  return (arr || []).map(x => `<li>${escapeHtml(x)}</li>`).join('') || '<li>-</li>';
}

function renderScreening(r) {
  lastScreening = r;
  resultPosition.textContent = '평가 포지션: ' + r.position.name;
  scoreBody.innerHTML = r.rubric.map(item => `
    <tr>
      <td data-label="평가 영역"><strong>${escapeHtml(item.area)}</strong><div class="score-item">${escapeHtml(item.item)}</div></td>
      <td data-label="배점">${item.max}점</td>
      <td data-label="점수 (수정 가능)">
        <input type="number" class="score-input" min="0" max="${item.max}" step="1"
               value="${r.scores[item.key]}" data-ai="${r.scores[item.key]}" aria-label="${escapeHtml(item.area)} 점수" />
      </td>
      <td data-label="AI 평가 근거">${escapeHtml(r.comments[item.key] || '-')}</td>
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
  resumeSummary.textContent = r.summary || '-';
  resumeRecommendation.textContent = r.recommendation;
  resumeStrengths.innerHTML = listHtml(r.strengths);
  resumeConcerns.innerHTML = listHtml(r.concerns);
  missingDocsBox.hidden = !(r.missingDocs && r.missingDocs.length);
  resumeMissingDocs.innerHTML = listHtml(r.missingDocs);
  const ev = r.valuesEvidence || [];
  valuesBox.hidden = !ev.length;
  resumeValues.innerHTML = ev.map(v => `<li><strong>${escapeHtml(v.item)}</strong> — ${escapeHtml(v.evidence)}</li>`).join('');
  recomputeTotal();
  resumeResult.hidden = false;
  prepareNotionRegister(r);
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
  const pdf = resumeMode() === 'pdf';
  pdfBox.hidden = !pdf;
  textBox.hidden = pdf;
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

screenResumeBtn.addEventListener('click', async () => {
  const usePdf = resumeMode() === 'pdf';
  const resumeText = resumeTextInput.value.trim();
  if (usePdf && !currentPdf) {
    resumeStatus.textContent = '평가할 이력서 PDF를 먼저 올려주세요.';
    resumeStatus.className = 'status err';
    return;
  }
  if (!usePdf && !resumeText) {
    resumeStatus.textContent = '이력서 내용을 입력해주세요.';
    resumeStatus.className = 'status err';
    return;
  }
  if (criteriaDirty && !confirm('저장하지 않은 인재상/채용요건 수정이 있어요.\n저장된 기준(수정 전)으로 평가할까요?\n\n[취소]를 누르고 먼저 "기준 저장"을 하셔도 돼요.')) return;

  screenResumeBtn.disabled = true;
  screenResumeBtn.textContent = '평가 중... (최대 1분)';
  resumeStatus.textContent = '';
  resumeResult.hidden = true;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);
  try {
    const res = usePdf
      ? await fetch('/api/resume/analyze?positionId=' + encodeURIComponent(evalPositionSelect.value), {
          method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: currentPdf, signal: controller.signal,
        })
      : await fetch('/api/screen-resume', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText, positionId: evalPositionSelect.value }), signal: controller.signal,
        });
    const data = await readJsonOrNull(res);
    if (!data) throw new Error(res.status === 413 ? '파일이 너무 커서 서버가 받지 못했어요. 4MB 이하로 줄여주세요.' : '서버가 응답하지 못했어요. 잠시 후 다시 시도해주세요.');
    if (!res.ok || !data.success) throw new Error(data.error || '평가 실패');
    analyzedPdf = usePdf ? currentPdf : null;
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


// ---------- 공고문 만들기 ----------
const makePostingBtn = document.getElementById('makePostingBtn');
const postingArea = document.getElementById('postingArea');
const postingText = document.getElementById('postingText');
const copyPostingBtn = document.getElementById('copyPostingBtn');
const postingTodo = document.getElementById('postingTodo');

const POSTING_PLACEHOLDER = '[입력]';

function buildJobPosting() {
  commitEditorToState();
  const p = criteriaState && criteriaState.positions.find(x => x.id === editingPositionId);
  if (!p) return '';
  const out = [];
  out.push(`[오픈한] ${p.name} 채용`);
  out.push('');
  if ((criteriaState.companyIntro || '').trim()) {
    out.push('■ 오픈한 소개');
    out.push(criteriaState.companyIntro.trim());
    out.push('');
  }
  // 채용요건의 [담당 업무 (JD)] 같은 소제목을 공고문용 ■ 소제목으로 바꿈
  const reqLines = (p.requirements || '').split('\n').map(line => {
    const m = /^\[(.+?)\]\s*$/.exec(line.trim());
    return m ? '■ ' + m[1].replace(/\s*\(JD\)/i, '').trim() : line;
  });
  out.push(reqLines.join('\n').trim());
  out.push('');
  const titles = [];
  (criteriaState.idealProfile || '').split('\n').forEach(line => {
    const m = /^\s*\d+\.\s+(.+)$/.exec(line);
    if (m) titles.push(m[1].replace(/\s*\([A-Za-z0-9 &'.-]+\)\s*$/, '').trim());
  });
  if (titles.length) {
    out.push('■ 이런 분과 함께하고 싶어요');
    titles.forEach(t => out.push('- ' + t));
    out.push('');
  }
  out.push('■ 근무 조건 및 전형 안내');
  ['근무지', '고용 형태', '급여 / 복리후생', '전형 절차', '지원 방법 및 마감일']
    .forEach(label => out.push(`- ${label}: ${POSTING_PLACEHOLDER}`));
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
}

function updatePostingTodo() {
  const n = (postingText.value.match(/\[입력\]/g) || []).length;
  postingTodo.textContent = n
    ? `아직 ${POSTING_PLACEHOLDER} 표시가 ${n}곳 남아 있어요. 채운 뒤 복사하세요.`
    : '복사할 준비가 됐어요.';
}

makePostingBtn.addEventListener('click', () => {
  if (!criteriaState) return;
  postingText.value = buildJobPosting();
  postingArea.hidden = false;
  updatePostingTodo();
  postingText.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
postingText.addEventListener('input', updatePostingTodo);

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
  const ok = await copyToClipboard(postingText.value);
  const todo = (postingText.value.match(/\[입력\]/g) || []).length;
  postingTodo.textContent = ok
    ? (todo ? `복사했어요. 다만 ${POSTING_PLACEHOLDER}가 ${todo}곳 남아 있어요.` : '복사했어요. 사람인·잡코리아에 붙여넣으세요.')
    : '복사하지 못했어요. 글을 직접 선택해서 복사해주세요.';
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

const NOTION_REC_MAP = { '적극 추천': 'PASS', '추천': 'PASS', '보류': 'BORDERLINE', '비추천': 'REJECT' };

function todayStr() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function optionsHtml(list, blankLabel) {
  const blank = blankLabel ? `<option value="">${escapeHtml(blankLabel)}</option>` : '';
  return blank + list.map(x => `<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('');
}
function jobFromPosition(name) {
  const i = name.indexOf(' - ');
  return i >= 0 ? name.slice(i + 3).trim() : name;
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
  const pos = criteriaState && criteriaState.positions.find(x => x.id === r.position.id);
  if (pos && pos.team && o.teams.includes(pos.team)) notionTeamEl.value = pos.team;
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
        job: jobFromPosition(lastScreening.position.name),
        channels: [...notionChannelsEl.querySelectorAll('input:checked')].map(i => i.value),
        appliedAt: notionAppliedAtEl.value,
        status: notionStatusSel.value,
        recommendation: notionRecEl.value,
        total,
        summary: buildNotionSummary(lastScreening, total),
        education: (lastScreening.candidate || {}).education || '',
        career: (lastScreening.candidate || {}).career || '',
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
      job: jobFromPosition(lastScreening.position.name), status: notionStatusSel.value,
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
        <div class="notion-sub">${escapeHtml(sub) || '-'}</div>
      </div>
      <div class="notion-item-actions">
        ${canEdit('send') ? `<button type="button" data-i="${i}" data-act="send">문자 보내기</button>` : ''}
        ${canEdit('schedule') ? `<button type="button" data-i="${i}" data-act="schedule">일정 등록</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

async function loadNotionApplicants() {
  const seq = ++notionListSeq;
  notionPickerMsg.textContent = '불러오는 중...';
  try {
    const qs = new URLSearchParams({ q: notionSearch.value.trim(), status: notionStatusFilter.value || 'active' });
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

async function openNotionPicker() {
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
  notionStatusFilter.value = 'active';
  notionSearch.value = '';
  loadNotionApplicants();
}
function closeNotionModal() { notionModal.hidden = true; }

openNotionPickerBtn.addEventListener('click', openNotionPicker);
document.getElementById('notionModalClose').addEventListener('click', closeNotionModal);
notionModal.addEventListener('click', e => { if (e.target === notionModal) closeNotionModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNotionModal(); });
notionStatusFilter.addEventListener('change', loadNotionApplicants);
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
  showTab('send');
  schNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  (schHourInput.value === '' ? schHourInput : schLocationInput).focus();
}

notionApplicantList.addEventListener('click', e => {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const a = notionApplicants[Number(btn.dataset.i)];
  if (!a) return;
  if (btn.dataset.act === 'send') fillSendFormFromNotion(a);
  else fillScheduleFormFromNotion(a);
});

// ---------- 로그인 정보 · 메뉴별 권한 · 왼쪽 하단 도크 ----------
const MENU_KEYS = ['send', 'history', 'schedule', 'resume', 'templates'];
const noAccessEl = document.getElementById('noAccess');
const userDock = document.getElementById('userDock');
const dockName = document.getElementById('dockName');
const dockRole = document.getElementById('dockRole');
const openAdminBtn = document.getElementById('openAdminBtn');
const dockLogoutBtn = document.getElementById('dockLogoutBtn');
const sendReadonlyNote = document.getElementById('sendReadonlyNote');

function applyPermissions() {
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
  const resumeLocked = canView('resume') && !canEdit('resume');
  [companyIntroInput, idealProfileInput, requirementsInput, postingText].forEach(el => { el.readOnly = resumeLocked; });
  return firstVisible;
}

function initDock() {
  if (ME.mode === 'none') { document.getElementById('authBanner').hidden = false; return; }
  document.getElementById('authBanner').hidden = true;
  userDock.hidden = false;
  document.body.classList.add('has-dock');
  dockName.textContent = ME.name || '로그인됨';
  dockRole.textContent = ME.role === 'owner' ? '소유주' : '';
  openAdminBtn.hidden = !ME.canManage;
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
    if (first) showTab([...tabBtns].some(b => b.dataset.tab === 'send' && !b.hidden) ? 'send' : first);
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
bootApp();
