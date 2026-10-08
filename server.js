require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const Anthropic = require('@anthropic-ai/sdk');

// Fixie(고정 IP 프록시)가 연결되어 있으면 문자코리아 API 호출을 이 프록시를 거쳐서 보냅니다.
// 이렇게 하면 배포 환경(Vercel/Render 등)의 유동 IP 대신, Fixie의 고정 IP로만 요청이 나갑니다.
const FIXIE_URL = process.env.FIXIE_URL;
const proxyAgent = FIXIE_URL ? new HttpsProxyAgent(FIXIE_URL) : null;
function withProxy(axiosConfig = {}) {
  if (!proxyAgent) return axiosConfig;
  return { ...axiosConfig, httpAgent: proxyAgent, httpsAgent: proxyAgent, proxy: false };
}

// ---------- 문자에 쓸 수 없는 글자 처리 ----------
// 국내 문자 발송은 EUC-KR 계열 글자만 보낼 수 있어서, 복사/붙여넣기로 딸려온
// "눈에 안 보이는 특수 공백(NBSP, U+00A0)" 등이 있으면 발송불가문자(errCode 2039)로 거부됩니다.
// → 안전하게 바꿀 수 있는 글자는 자동으로 바꾸고, 바꿀 수 없는 글자(이모지 등)는 미리 알려줍니다.
const SMS_FIXES = [
  { re: /[\u00A0\u1680\u2000-\u200A\u202F\u205F]/g, to: ' ',  desc: '눈에 안 보이는 특수 공백 → 일반 공백' },
  { re: /[\u200B-\u200D\u2060\uFEFF\u00AD]/g,        to: '',   desc: '폭 없는 숨은 글자 → 삭제' },
  { re: /[\u2028\u2029]/g,                            to: '\n', desc: '특수 줄바꿈 → 줄바꿈' },
  { re: /[\u2013\u2014\u2212]/g,                      to: '-',  desc: '긴 줄표(—, –) → 하이픈(-)' },
  { re: /\u2022/g,                                    to: '·',  desc: '글머리 기호(•) → 가운뎃점(·)' },
  { re: /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, to: '', desc: '제어 문자 → 삭제' },
];

// 실제로 보낼 수 있는 글자 목록 (EUC-KR/CP949로 표현 가능한 글자) — 서버 시작 시 한 번 만듭니다.
const SMS_ALLOWED = (() => {
  const set = new Set();
  for (let c = 0x20; c < 0x7f; c++) set.add(String.fromCharCode(c));
  set.add('\n'); set.add('\r'); set.add('\t');
  // 한글 음절 11,172자는 전부 허용: 드문 글자가 들어간 이름을 잘못 막지 않기 위해서입니다.
  // (업체가 거부하면 오류 문구에 정확한 글자가 나옵니다)
  for (let c = 0xAC00; c <= 0xD7A3; c++) set.add(String.fromCharCode(c));
  try {
    const dec = new TextDecoder('euc-kr');
    for (let a = 0x81; a <= 0xfe; a++) {
      for (let b = 0x41; b <= 0xfe; b++) {
        const ch = dec.decode(new Uint8Array([a, b]));
        if (ch.length === 1 && ch !== '\uFFFD') set.add(ch);
      }
    }
  } catch (e) {
    console.error('EUC-KR 글자표를 만들지 못했습니다. 글자 검사는 건너뜁니다:', e.message);
    return null;
  }
  return set;
})();

function sanitizeSms(input) {
  let text = String(input ?? '');
  const fixes = [];
  for (const f of SMS_FIXES) {
    const found = text.match(f.re);
    if (found && found.length) {
      fixes.push({ desc: f.desc, count: found.length });
      text = text.replace(f.re, f.to);
    }
  }
  // 자동으로 바꿀 수 없는데 보낼 수도 없는 글자(이모지 등) 찾기
  const invalid = [];
  if (SMS_ALLOWED) {
    const seen = new Map();
    for (const ch of text) {
      if (SMS_ALLOWED.has(ch)) continue;
      const cp = 'U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
      if (seen.has(ch)) seen.get(ch).count++;
      else { const item = { char: ch, codePoint: cp, count: 1 }; seen.set(ch, item); invalid.push(item); }
    }
  }
  return { text, fixes, invalid };
}

function describeInvalid(invalid) {
  return invalid.map(i => `${i.char} (${i.codePoint})${i.count > 1 ? ' ×' + i.count : ''}`).join(', ');
}

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

  result.usingProxy = !!proxyAgent;
  result.fixieUrlDetected = !!process.env.FIXIE_URL;

  try {
    const tokenRes = await axios.post('https://api.smsko.co.kr/api/v1/token', {
      userId: SMSKO_USER_ID,
      sec_apiKey: SMSKO_API_KEY,
    }, withProxy({ headers: { 'Content-Type': 'application/json' }, timeout: 10000 }));

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

// 발송 이력 수동 등록 (다른 경로로 이미 보낸 문자를 기록만 남기고 싶을 때)
app.post('/api/history', ah(async (req, res) => {
  const { name, phone, templateLabel, memo, proposedDate, success, sentAt, message } = req.body;
  if (!name || !phone) return res.status(400).json({ error: '이름과 연락처는 필수입니다.' });

  await saveHistoryEntry({
    sentAt: sentAt ? new Date(sentAt).toISOString() : new Date().toISOString(),
    name,
    phone,
    memo: memo || '',
    proposedDate: proposedDate || '',
    templateLabel: templateLabel || '수기입력',
    message: message || '',
    success: success !== false,
    manual: true,
  });
  res.json({ success: true });
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

// 문자 내용에 보낼 수 없는 글자가 있는지 미리 검사 (미리보기 화면의 경고용)
app.post('/api/check-text', ah(async (req, res) => {
  const { text } = req.body;
  const r = sanitizeSms(text);
  res.json({ fixes: r.fixes, invalid: r.invalid });
}));

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

  // 보낼 수 없는 글자 정리: 바꿀 수 있는 건 자동 변환, 바꿀 수 없는 건(이모지 등) 보내기 전에 막고 알려줌
  const cleaned = sanitizeSms(message);
  if (cleaned.invalid.length) {
    return res.status(400).json({
      success: false,
      error: `문자에 보낼 수 없는 글자가 있어요: ${describeInvalid(cleaned.invalid)}. 해당 글자를 지우고 다시 보내주세요.`,
      invalidChars: cleaned.invalid,
    });
  }
  message = cleaned.text;
  const sendFixes = cleaned.fixes;
  const safeName = sanitizeSms(name).text.trim();
  const safeTitle = sanitizeSms(tpl.label).text;
  const safePhone = String(phone).replace(/\D/g, '');

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
    }, withProxy({ headers: { 'Content-Type': 'application/json' }, timeout: 10000 }));

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
      receiver: [safePhone],
      name: [safeName],
      title: safeTitle,
      message,
      messageType,
    }, withProxy({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      timeout: 10000,
    }));

    const data = sendRes.data;
    try {
      await saveHistoryEntry({
        sentAt: new Date().toISOString(),
        name, phone, memo: memo || '',
        proposedDate: date || '',
        templateLabel: tpl.label,
        message,
        success: true,
      });
    } catch (historyErr) {
      console.error('발송 성공 후 이력 저장 실패(무시하고 응답 계속):', historyErr.message);
    }
    return res.json({ success: true, data, fixes: sendFixes });
  } catch (err) {
    const errData = err?.response?.data;
    console.error(errData || err.message);
    try {
      await saveHistoryEntry({
        sentAt: new Date().toISOString(),
        name, phone, memo: memo || '',
        proposedDate: date || '',
        templateLabel: tpl.label,
        message,
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
    status: status || '예정',
    changeLog: [],
    createdAt: new Date().toISOString(),
  };
  list.push(entry);
  await saveSchedules(list);
  res.json(entry);
}));

// 면접 일정 수정 (일시/팀/면접진행자/면접장소/구분/비고/상태 변경)
// - 면접 일시가 바뀌면 변경 이력(changeLog)에 자동 기록
// - 상태를 '취소'로 바꾸면 취소 일시/사유를 기록, 다시 '예정'으로 돌리면 취소 정보 제거
app.put('/api/schedules/:id', ah(async (req, res) => {
  const list = await loadSchedules();
  const idx = list.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

  const prev = list[idx];
  const { name, phone, interviewAt, team, interviewer, location, round, note, status, reason } = req.body;
  const next = {
    ...prev,
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
    ...(interviewAt !== undefined && { interviewAt }),
    ...(team !== undefined && { team }),
    ...(interviewer !== undefined && { interviewer }),
    ...(location !== undefined && { location }),
    ...(round !== undefined && { round }),
    ...(note !== undefined && { note }),
  };

  const changeLog = Array.isArray(prev.changeLog) ? [...prev.changeLog] : [];

  // 일시 변경 기록
  if (interviewAt !== undefined && interviewAt !== prev.interviewAt) {
    changeLog.push({
      at: new Date().toISOString(),
      from: prev.interviewAt,
      to: interviewAt,
      reason: reason || '',
    });
  }
  next.changeLog = changeLog;

  // 취소/복구 처리
  if (status !== undefined) {
    const normalized = status === '취소' ? '취소' : '예정';
    next.status = normalized;
    if (normalized === '취소' && prev.status !== '취소') {
      next.cancelledAt = new Date().toISOString();
      next.cancelReason = reason || '';
    } else if (normalized === '취소') {
      if (reason) next.cancelReason = reason;
    } else {
      delete next.cancelledAt;
      delete next.cancelReason;
    }
  }

  list[idx] = next;
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

// ---------- 이력서 검토 ----------
const CRITERIA_PATH = path.join(DATA_DIR, 'criteria.json');
const DEFAULT_CRITERIA = { idealProfile: '', requirements: '' };

async function loadCriteria() {
  return storeGet('criteria', CRITERIA_PATH, DEFAULT_CRITERIA);
}

async function saveCriteria(value) {
  return storeSet('criteria', CRITERIA_PATH, value);
}

// 인재상/채용요건 조회
app.get('/api/criteria', ah(async (req, res) => {
  res.json(await loadCriteria());
}));

// 인재상/채용요건 저장
app.put('/api/criteria', ah(async (req, res) => {
  const { idealProfile, requirements } = req.body;
  const value = { idealProfile: idealProfile || '', requirements: requirements || '' };
  await saveCriteria(value);
  res.json(value);
}));

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

// 이력서 한 건을 인재상/채용요건 기준으로 AI가 평가
app.post('/api/screen-resume', ah(async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText || !resumeText.trim()) {
    return res.status(400).json({ error: '이력서 내용을 입력해주세요.' });
  }
  if (!anthropic) {
    return res.status(500).json({ error: '서버에 ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.' });
  }

  const criteria = await loadCriteria();
  if (!criteria.idealProfile && !criteria.requirements) {
    return res.status(400).json({ error: '먼저 인재상/채용요건을 입력하고 저장해주세요.' });
  }

  const systemPrompt = `당신은 채용 담당자를 돕는 이력서 검토 보조자입니다. 회사의 인재상과 채용요건을 기준으로 이력서를 객관적으로 검토하고, 반드시 아래 JSON 형식으로만 답하세요. 다른 설명 문장 없이 JSON만 출력하세요.

{
  "score": (1~10 사이 정수, 적합도 점수),
  "summary": "지원자에 대한 2~3문장 요약",
  "strengths": ["강점1", "강점2", ...],
  "concerns": ["우려사항1", "우려사항2", ...],
  "recommendation": "적극 추천" | "추천" | "보류" | "비추천" 중 하나
}`;

  const userMessage = `[회사 인재상]\n${criteria.idealProfile || '(입력 없음)'}\n\n[채용요건]\n${criteria.requirements || '(입력 없음)'}\n\n[지원자 이력서]\n${resumeText}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    let parsed;
    try {
      const cleaned = (textBlock?.text || '').replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({ error: 'AI 응답을 해석하지 못했습니다.', raw: textBlock?.text });
    }

    res.json({ success: true, result: parsed });
  } catch (err) {
    console.error('[screen-resume] 오류:', err.message);
    res.status(500).json({ error: 'AI 평가 중 오류가 발생했습니다: ' + err.message });
  }
}));

// 로컬(node server.js)이나 Render처럼 직접 실행할 때만 포트를 엽니다.
// Vercel은 이 파일을 require해서 서버리스 함수로 쓰므로 app.listen을 호출하지 않습니다.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`면접 문자 발송 앱이 http://localhost:${PORT} 에서 실행 중입니다. (저장 방식: ${kv ? 'Upstash Redis' : '로컬 파일'})`);
  });
}

module.exports = app;
