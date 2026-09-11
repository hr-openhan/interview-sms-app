require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// 어디서도 못 잡은 예외/네트워크 오류로 서버 전체가 죽는 것을 막는 마지막 안전망.
// (Render/로컬처럼 계속 켜져있는 환경에서 특히 중요 - 이게 없으면 오류 하나로 전체 서버가 재시작될 때까지 멈춥니다)
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException] 예기치 못한 오류(서버는 계속 실행됨):', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection] 처리되지 않은 Promise 오류(서버는 계속 실행됨):', err?.message || err);
});

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- 저장소 계층 ----------
// Vercel의 Redis 연동(Upstash, Marketplace에서 설치)이 연결되어 있으면 그걸 쓰고,
// 없으면(로컬 실행, Render 등) 지금까지처럼 로컬 파일(JSON)에 저장합니다.
// 연동 방식에 따라 KV_REST_API_URL/TOKEN 또는 UPSTASH_REDIS_REST_URL/TOKEN 둘 중 하나로 값이 들어오므로 둘 다 확인합니다.
let kv = null;
const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
if (REDIS_URL && REDIS_TOKEN) {
  try {
    const { Redis } = require('@upstash/redis');
    kv = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  } catch {
    kv = null;
  }
}

// DATA_DIR을 지정하면 그 위치(예: Render의 영구 디스크 마운트 경로)에 파일을 저장합니다.
// 지정하지 않으면 이 앱 폴더 안에 저장됩니다. (Redis를 쓰는 경우엔 이 값은 쓰이지 않습니다.)
const DATA_DIR = process.env.DATA_DIR || __dirname;
if (!kv && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Redis(또는 다른 비동기 작업)가 응답 없이 무한정 멈추는 것을 방지하는 타임아웃 래퍼
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} 응답 시간 초과 (${ms}ms)`)), ms)),
  ]);
}

async function storeGet(key, filePath, defaultValue) {
  if (kv) {
    try {
      const val = await withTimeout(kv.get(key), 8000, `Redis 조회(${key})`);
      // 배열인데 비어있으면(예: 실수/오류로 전부 지워진 경우) 기본값으로 되돌립니다.
      if (Array.isArray(val) && val.length === 0 && Array.isArray(defaultValue) && defaultValue.length > 0) {
        return defaultValue;
      }
      return val ?? defaultValue;
    } catch (err) {
      console.error(`[storeGet:${key}] Redis 조회 실패, 기본값으로 대체:`, err.message);
      return defaultValue;
    }
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

async function storeSet(key, filePath, value) {
  if (kv) {
    try {
      await withTimeout(kv.set(key, value), 8000, `Redis 저장(${key})`);
    } catch (err) {
      console.error(`[storeSet:${key}] Redis 저장 실패:`, err.message);
      throw err;
    }
    return;
  }
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
}

// 라우트 핸들러 안에서 예상치 못한 오류(Redis 타임아웃 등)가 나도
// 응답이 무한정 멈추지 않고 항상 깔끔한 오류로 끝나도록 감싸는 공통 래퍼
function ah(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error(`[route error] ${req.method} ${req.path}:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: err.message || '서버 오류가 발생했습니다.' });
      }
    }
  };
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 문자코리아 연결 진단 (.env에 저장된 값이 실제로 어떻게 읽히는지, 토큰 발급이 되는지 확인)
// 저장소(Redis 또는 로컬 파일) 상태 진단 - 브라우저 주소창에 /api/storage-check 입력하면 바로 확인 가능
app.get('/api/storage-check', async (req, res) => {
  const result = {
    storageMode: kv ? 'upstash-redis' : 'local-file',
    redisEnvDetected: !!(REDIS_URL && REDIS_TOKEN),
  };

  if (kv) {
    try {
      await kv.set('__healthcheck__', { ok: true, ts: Date.now() });
      const readBack = await kv.get('__healthcheck__');
      result.redisRoundTrip = { ok: true, readBack };
    } catch (err) {
      result.redisRoundTrip = { ok: false, error: err.message };
    }
  }

  try {
    const templates = await loadTemplates();
    result.templatesCount = Array.isArray(templates) ? templates.length : `배열 아님: ${typeof templates}`;
  } catch (err) {
    result.templatesError = err.message;
  }

  res.json(result);
});

app.get('/api/smsko-check', async (req, res) => {
  const { SMSKO_USER_ID, SMSKO_API_KEY, SMSKO_SENDER } = process.env;

  const mask = (v) => {
    if (!v) return null;
    if (v.length <= 10) return v[0] + '***' + v[v.length - 1];
    return v.slice(0, 6) + '...(' + v.length + '자)...' + v.slice(-4);
  };

  const result = {
    storageMode: kv ? 'upstash-redis' : 'local-file',
    envLoaded: {
      SMSKO_USER_ID: SMSKO_USER_ID || null,
      SMSKO_USER_ID_length: SMSKO_USER_ID ? SMSKO_USER_ID.length : 0,
      SMSKO_USER_ID_hasWhitespace: SMSKO_USER_ID ? /\s/.test(SMSKO_USER_ID) : false,
      SMSKO_API_KEY_preview: mask(SMSKO_API_KEY),
      SMSKO_API_KEY_hasWhitespace: SMSKO_API_KEY ? /\s/.test(SMSKO_API_KEY) : false,
      SMSKO_SENDER: SMSKO_SENDER || null,
    },
  };

  if (!SMSKO_USER_ID || !SMSKO_API_KEY) {
    result.tokenTest = { ok: false, error: '.env에 SMSKO_USER_ID 또는 SMSKO_API_KEY가 비어있습니다.' };
    return res.json(result);
  }

  try {
    const tokenRes = await axios.post('https://api.smsko.co.kr/api/v1/token', {
      userId: SMSKO_USER_ID,
      sec_apiKey: SMSKO_API_KEY,
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });

    result.tokenTest = {
      ok: !!tokenRes.data?.result?.accessToken,
      response: tokenRes.data,
    };
  } catch (err) {
    result.tokenTest = {
      ok: false,
      error: err?.response?.data || err.message,
    };
  }

  res.json(result);
});

// ---------- 양식(템플릿) ----------
const SEED_TEMPLATES_PATH = path.join(__dirname, 'templates.json'); // 저장소에 포함된 기본 17종 양식
const SEED_TEMPLATES = JSON.parse(fs.readFileSync(SEED_TEMPLATES_PATH, 'utf-8'));
const TEMPLATES_PATH = path.join(DATA_DIR, 'templates.json');
if (!kv && !fs.existsSync(TEMPLATES_PATH)) {
  fs.copyFileSync(SEED_TEMPLATES_PATH, TEMPLATES_PATH);
}

async function loadTemplates() {
  return storeGet('templates', TEMPLATES_PATH, SEED_TEMPLATES);
}

async function saveTemplates(list) {
  return storeSet('templates', TEMPLATES_PATH, list);
}

function withComputedHasDate(t) {
  return { ...t, hasDate: t.body.includes('{{date}}') };
}

function nextTemplateId(list) {
  const nums = list
    .map(t => parseInt(String(t.id).replace('t', ''), 10))
    .filter(n => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `t${max + 1}`;
}

// ---------- 발송 이력 ----------
const HISTORY_PATH = path.join(DATA_DIR, 'history.json');

async function loadHistory() {
  return storeGet('history', HISTORY_PATH, []);
}

async function saveHistoryEntry(entry) {
  const history = await loadHistory();
  const nums = history
    .map(h => parseInt(String(h.id).replace('h', ''), 10))
    .filter(n => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  history.unshift({ id: `h${max + 1}`, attendance: '미응답', ...entry }); // 최신순
  await storeSet('history', HISTORY_PATH, history);
}

async function saveHistoryList(list) {
  return storeSet('history', HISTORY_PATH, list);
}

// 템플릿 목록 제공 (발송 화면용 - 요약 정보만)
app.get('/api/templates', ah(async (req, res) => {
  const templates = (await loadTemplates()).map(withComputedHasDate);
  res.json(templates.map(({ id, label, hasDate, dateExample }) => ({ id, label, hasDate, dateExample })));
}));

// 템플릿 전체 정보 제공 (양식 관리 화면용)
app.get('/api/templates/full', ah(async (req, res) => {
  res.json((await loadTemplates()).map(withComputedHasDate));
}));

// 새 양식 추가
app.post('/api/templates', ah(async (req, res) => {
  const { label, body, dateExample } = req.body;
  if (!label || !body) return res.status(400).json({ error: '양식 이름과 본문은 필수입니다.' });

  const list = await loadTemplates();
  const newTpl = { id: nextTemplateId(list), label, body, dateExample: dateExample || '' };
  list.push(newTpl);
  await saveTemplates(list);
  res.json(withComputedHasDate(newTpl));
}));

// 양식 수정
app.put('/api/templates/:id', ah(async (req, res) => {
  const { label, body, dateExample } = req.body;
  if (!label || !body) return res.status(400).json({ error: '양식 이름과 본문은 필수입니다.' });

  const list = await loadTemplates();
  const idx = list.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '양식을 찾을 수 없습니다.' });

  list[idx] = { ...list[idx], label, body, dateExample: dateExample || '' };
  await saveTemplates(list);
  res.json(withComputedHasDate(list[idx]));
}));

// 양식 삭제
app.delete('/api/templates/:id', ah(async (req, res) => {
  const list = await loadTemplates();
  const next = list.filter(t => t.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ error: '양식을 찾을 수 없습니다.' });
  await saveTemplates(next);
  res.json({ success: true });
}));

// 미리보기(치환된 문자 내용 확인)
app.post('/api/preview', ah(async (req, res) => {
  const { templateId, name, date } = req.body;
  const tpl = (await loadTemplates()).map(withComputedHasDate).find(t => t.id === templateId);
  if (!tpl) return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });

  let msg = tpl.body.replaceAll('{{name}}', name || '');
  if (tpl.hasDate) msg = msg.replaceAll('{{date}}', date || '');
  res.json({ message: msg });
}));

// 발송 이력 조회 (최신순, 내부 기록용 - 메모/담당팀 포함, 문자 내용에는 영향 없음)
app.get('/api/history', ah(async (req, res) => {
  res.json(await loadHistory());
}));

// 실패한 발송 이력만 일괄 삭제
app.delete('/api/history/failed', ah(async (req, res) => {
  const list = await loadHistory();
  const next = list.filter(h => h.success !== false);
  const removedCount = list.length - next.length;
  await saveHistoryList(next);
  res.json({ success: true, removedCount });
}));

// 발송 이력 참석여부(응답/미응답/불참) 수정
app.put('/api/history/:id', ah(async (req, res) => {
  const { attendance } = req.body;
  const list = await loadHistory();
  const idx = list.findIndex(h => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '이력을 찾을 수 없습니다.' });

  list[idx] = { ...list[idx], ...(attendance !== undefined && { attendance }) };
  await saveHistoryList(list);
  res.json(list[idx]);
}));

// 발송 이력 개별 삭제
app.delete('/api/history/:id', ah(async (req, res) => {
  const list = await loadHistory();
  const next = list.filter(h => h.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ error: '이력을 찾을 수 없습니다.' });
  await saveHistoryList(next);
  res.json({ success: true });
}));

// 실제 문자 발송 (문자코리아 API)
app.post('/api/send', ah(async (req, res) => {
  const { templateId, name, phone, date, memo, message: customMessage } = req.body;

  if (!name || !phone || !templateId) {
    return res.status(400).json({ error: '이름, 연락처, 템플릿은 필수입니다.' });
  }

  const tpl = (await loadTemplates()).map(withComputedHasDate).find(t => t.id === templateId);
  if (!tpl) return res.status(404).json({ error: '템플릿을 찾을 수 없습니다.' });

  // 미리보기 화면에서 직접 수정한 내용이 있으면 그걸 그대로 발송하고,
  // 없으면(빈 값) 기존처럼 양식+이름/일정으로 자동 생성합니다.
  let message;
  if (typeof customMessage === 'string' && customMessage.trim() !== '') {
    message = customMessage;
  } else {
    message = tpl.body.replaceAll('{{name}}', name);
    if (tpl.hasDate) message = message.replaceAll('{{date}}', date || '');
  }

  const { SMSKO_USER_ID, SMSKO_API_KEY, SMSKO_SENDER } = process.env;
  if (!SMSKO_USER_ID || !SMSKO_API_KEY || !SMSKO_SENDER) {
    return res.status(500).json({ error: '서버에 문자코리아 API 정보(환경변수)가 설정되지 않았습니다.' });
  }

  const SMSKO_BASE = 'https://api.smsko.co.kr';

  try {
    // 1단계: 토큰 발급
    const tokenRes = await axios.post(`${SMSKO_BASE}/api/v1/token`, {
      userId: SMSKO_USER_ID,
      sec_apiKey: SMSKO_API_KEY,
    }, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });

    const accessToken = tokenRes.data?.result?.accessToken;
    if (!accessToken) {
      throw new Error('토큰 발급에 실패했습니다.');
    }

    // 90byte(한글 45자) 초과 시 LMS로 자동 전환
    const byteLength = Buffer.byteLength(message, 'utf8');
    const messageType = byteLength > 90 ? 'lms' : 'sms';

    // 2단계: 메시지 전송
    const sendRes = await axios.post(`${SMSKO_BASE}/api/v1/message`, {
      userId: SMSKO_USER_ID,
      sender: SMSKO_SENDER.replace(/-/g, ''),
      receiver: [phone.replace(/-/g, '')],
      name: [name],
      title: tpl.label,
      message,
      messageType,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      timeout: 10000,
    });

    const data = sendRes.data;
    try {
      await saveHistoryEntry({
        sentAt: new Date().toISOString(),
        name, phone, memo: memo || '',
        proposedDate: date || '',
        templateLabel: tpl.label,
        success: true,
      });
    } catch (historyErr) {
      console.error('발송 성공 후 이력 저장 실패(무시하고 응답 계속):', historyErr.message);
    }
    return res.json({ success: true, data });
  } catch (err) {
    const errData = err?.response?.data;
    console.error(errData || err.message);
    try {
      await saveHistoryEntry({
        sentAt: new Date().toISOString(),
        name, phone, memo: memo || '',
        proposedDate: date || '',
        templateLabel: tpl.label,
        success: false,
        error: (errData && (errData.message || JSON.stringify(errData))) || '문자코리아 API 호출 중 오류가 발생했습니다.',
      });
    } catch (historyErr) {
      console.error('발송 실패 후 이력 저장도 실패(무시하고 응답 계속):', historyErr.message);
    }
    return res.status(500).json({
      success: false,
      error: (errData && (errData.message || JSON.stringify(errData))) || '문자코리아 API 호출 중 오류가 발생했습니다.',
    });
  }
}));

// ---------- 면접 일정 ----------
const SCHEDULES_PATH = path.join(DATA_DIR, 'schedules.json');

// 면접진행자 목록 (가나다순)
const INTERVIEWER_LIST = ['니콜', '로이', '마리네뜨', '안나', '카라', '케빈', '한스', '헨리'];

app.get('/api/interviewers', (req, res) => {
  res.json(INTERVIEWER_LIST);
});

// 면접장소 목록
const LOCATION_LIST = ['오즈센터', '오픈한웍스'];

app.get('/api/locations', (req, res) => {
  res.json(LOCATION_LIST);
});

// 면접 구분 목록
const ROUND_LIST = ['1차', '2차', '채용과제'];

app.get('/api/rounds', (req, res) => {
  res.json(ROUND_LIST);
});

// 팀 목록 (가나다순)
const TEAM_LIST = [
  '경영지원팀', '그로잉업팀', '글로벌비즈니스팀', '마케팅팀', '브이팀',
  '온라인팀', '와우서비스팀', '제품디자인팀', 'FC팀', 'SCM팀',
];

app.get('/api/teams', (req, res) => {
  res.json(TEAM_LIST);
});

async function loadSchedules() {
  return storeGet('schedules', SCHEDULES_PATH, []);
}

async function saveSchedules(list) {
  return storeSet('schedules', SCHEDULES_PATH, list);
}

function nextScheduleId(list) {
  const nums = list
    .map(s => parseInt(String(s.id).replace('s', ''), 10))
    .filter(n => !Number.isNaN(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `s${max + 1}`;
}

// 면접 일정 목록 (면접일시 오름차순)
app.get('/api/schedules', ah(async (req, res) => {
  const list = (await loadSchedules()).sort((a, b) => (a.interviewAt || '').localeCompare(b.interviewAt || ''));
  res.json(list);
}));

// 면접 일정 등록
app.post('/api/schedules', ah(async (req, res) => {
  const { name, phone, interviewAt, team, interviewer, location, round, note, status } = req.body;
  if (!name || !phone || !interviewAt || !team) {
    return res.status(400).json({ error: '이름, 연락처, 면접 일시, 팀은 필수입니다.' });
  }

  const list = await loadSchedules();
  const entry = {
    id: nextScheduleId(list),
    name, phone, interviewAt, team,
    interviewer: interviewer || '',
    location: location || '',
    round: round || '',
    note: note || '',
    status: status || '미응답',
    createdAt: new Date().toISOString(),
  };
  list.push(entry);
  await saveSchedules(list);
  res.json(entry);
}));

// 면접 일정 수정 (일시/팀/면접진행자/면접장소/구분/비고/상태 변경)
app.put('/api/schedules/:id', ah(async (req, res) => {
  const list = await loadSchedules();
  const idx = list.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

  const { name, phone, interviewAt, team, interviewer, location, round, note, status } = req.body;
  list[idx] = {
    ...list[idx],
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
    ...(interviewAt !== undefined && { interviewAt }),
    ...(team !== undefined && { team }),
    ...(interviewer !== undefined && { interviewer }),
    ...(location !== undefined && { location }),
    ...(round !== undefined && { round }),
    ...(note !== undefined && { note }),
    ...(status !== undefined && { status }),
  };
  await saveSchedules(list);
  res.json(list[idx]);
}));

// 면접 일정 삭제
app.delete('/api/schedules/:id', ah(async (req, res) => {
  const list = await loadSchedules();
  const next = list.filter(s => s.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
  await saveSchedules(next);
  res.json({ success: true });
}));

// 로컬(node server.js)이나 Render처럼 직접 실행할 때만 포트를 엽니다.
// Vercel은 이 파일을 require해서 서버리스 함수로 쓰므로 app.listen을 호출하지 않습니다.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`면접 문자 발송 앱이 http://localhost:${PORT} 에서 실행 중입니다. (저장 방식: ${kv ? 'Upstash Redis' : '로컬 파일'})`);
  });
}

module.exports = app;
