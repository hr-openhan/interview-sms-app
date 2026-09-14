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
const deleteFailedBtn = document.getElementById('deleteFailedBtn');
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
const manualHistorySubmitBtn = document.getElementById('manualHistorySubmitBtn');
const manualHistoryStatus = document.getElementById('manualHistoryStatus');

let historySortMode = 'date';
let historyRaw = [];
let selectedHistoryIds = new Set();

const tabBtns = document.querySelectorAll('.tab-btn');
const sendView = document.getElementById('sendView');
const manageView = document.getElementById('manageView');
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
const scheduleNameSearch = document.getElementById('scheduleNameSearch');
const scheduleFilterResetBtn = document.getElementById('scheduleFilterResetBtn');
const schedulePeriodFilter = document.getElementById('schedulePeriodFilter');
const scheduleListBody = document.getElementById('scheduleListBody');

let templates = [];
let schedules = [];

async function loadTemplates() {
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
const PREVIEW_PLACEHOLDER = '왼쪽에서 이름과 양식을 선택하면 실제 발송될 문자 내용이 여기에 표시됩니다.';

async function updatePreview() {
  if (!templateSelect.value) {
    previewText.value = PREVIEW_PLACEHOLDER;
    charCount.textContent = '0자';
    previewEdited = false;
    previewResetBtn.hidden = true;
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
}

previewText.addEventListener('input', () => {
  previewEdited = true;
  previewResetBtn.hidden = false;
  charCount.textContent = `${previewText.value.length}자`;
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
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();

    if (res.ok && data.success) {
      statusEl.textContent = '문자가 발송되었습니다.';
      statusEl.className = 'status ok';
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
    historyBody.innerHTML = '<tr><td colspan="11" class="empty-row">조건에 맞는 발송 이력이 없습니다.</td></tr>';
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
      <td><input type="checkbox" class="history-row-check" data-id="${item.id}" ${selectedHistoryIds.has(item.id) ? 'checked' : ''} /></td>
      <td>${formatDateTime(item.sentAt)}</td>
      <td><button class="history-name-btn" data-id="${item.id}">${item.name}</button></td>
      <td>${item.phone}</td>
      <td>${item.templateLabel}</td>
      <td>${item.proposedDate || '-'}</td>
      <td>${item.memo || '-'}</td>
      <td class="${item.success ? 'result-ok' : 'result-err'}">${item.success ? '성공' : '실패'}</td>
      <td>
        <select class="attendance-select" data-id="${item.id}">
          <option value="미응답" ${item.attendance === '미응답' || !item.attendance ? 'selected' : ''}>미응답</option>
          <option value="참석" ${item.attendance === '참석' ? 'selected' : ''}>참석</option>
          <option value="불참석" ${item.attendance === '불참석' ? 'selected' : ''}>불참석</option>
        </select>
      </td>
      <td><button class="history-schedule-btn" data-id="${item.id}">일정 등록</button></td>
      <td><button class="history-delete-btn" data-id="${item.id}">삭제</button></td>
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

  historyBody.querySelectorAll('.history-schedule-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = historyRaw.find(h => h.id === btn.dataset.id);
      if (item) fillScheduleFormFrom(item);
    });
  });

  historyBody.querySelectorAll('.history-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('이 이력을 삭제할까요?')) return;
      await fetch(`/api/history/${btn.dataset.id}`, { method: 'DELETE' });
      selectedHistoryIds.delete(btn.dataset.id);
      loadHistory();
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
  deleteSelectedBtn.textContent = `선택 삭제 (${selectedHistoryIds.size})`;
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

deleteFailedBtn.addEventListener('click', async () => {
  if (!confirm('실패한 발송 이력을 모두 삭제할까요?')) return;
  const res = await fetch('/api/history/failed', { method: 'DELETE' });
  const data = await res.json();
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
  manageView.hidden = tab !== 'manage';
  if (tab === 'manage') refreshTemplateManageSelect();
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
    .filter(s => dateKey(s.interviewAt) === todayKey)
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
            <td>${formatFullKorean(s.interviewAt)}</td>
            <td>${s.name}</td>
            <td>${s.location || '-'}</td>
            <td>${s.team || '-'}</td>
            <td>${s.interviewer || '-'}</td>
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

  scheduleListBody.innerHTML = filtered.map(s => `
    <tr>
      <td>${formatSchedule(s.interviewAt)}</td>
      <td>${s.name}</td>
      <td>${s.phone || '-'}</td>
      <td>${s.round || '-'}</td>
      <td>${s.team || '-'}</td>
      <td><button class="schedule-view-btn" data-id="${s.id}">상세</button></td>
    </tr>
  `).join('');

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
schedulePeriodFilter.addEventListener('change', renderScheduleList);
scheduleNameSearch.addEventListener('input', renderScheduleList);

scheduleFilterResetBtn.addEventListener('click', () => {
  scheduleTeamFilter.value = '';
  scheduleRoundFilter.value = '';
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

loadTemplates();
loadHistory();
loadTeams();
loadInterviewers();
loadLocations();
loadRounds();
loadSchedules();
