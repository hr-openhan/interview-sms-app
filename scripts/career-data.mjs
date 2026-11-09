// 승진·경력 관리 데이터(직원 목록·승진 기준) 내보내기 / 삭제 도구
//
// "채용" 앱에서 승진·경력 관리 메뉴를 없앴어요. 직원 데이터는 이 앱의 저장소(Upstash Redis)에 그대로 남아 있어요(앱이 지우지 않았어요).
// 다른 대시보드(contract)로 옮길 때 이 도구로 데이터를 꺼내고, 옮긴 것을 확인한 뒤 지우세요.
//
// 사용법 (이 앱 폴더에서, Redis 접속 정보가 환경변수로 있는 상태로 — Vercel의 값과 같아요)
//   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/career-data.mjs export 직원데이터.json
//   UPSTASH_REDIS_REST_URL=... UPSTASH_REDIS_REST_TOKEN=... node scripts/career-data.mjs purge  직원데이터.json
//   (KV_REST_API_URL / KV_REST_API_TOKEN 이름도 돼요)
//
// ⚠ 내보낸 파일에는 직원 이름·생년월일·입사일·경력이 들어 있어요(개인정보). GitHub에 올리지 말고, 옮긴 뒤 안전하게 지우세요.
// purge는 "방금 내보낸 파일과 지금 저장소의 내용이 같을 때만" 지워요(옮기기 전에 지워버리는 사고를 막아요).
import fs from 'node:fs';
import crypto from 'node:crypto';

const KEYS = { employees: 'employees', rules: 'career-rules' };
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const [cmd, file] = process.argv.slice(2);
const die = m => { console.error('✗ ' + m); process.exit(1); };
if (!['export', 'purge'].includes(cmd) || !file) die('사용법: node scripts/career-data.mjs export|purge 파일이름.json');
if (!url || !token) die('Redis 접속 정보가 없어요(UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).');

// Upstash REST: 명령을 JSON 배열로 POST해요(@upstash/redis 없이도 돌아가게 직접 호출해요)
async function redis(...args) {
  const res = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.error) throw new Error('Redis 오류: ' + (j.error || res.status));
  return j.result;
}
const parse = v => { if (v === null || v === undefined) return null; try { return typeof v === 'string' ? JSON.parse(v) : v; } catch { return v; } };
const digest = o => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
async function readAll() {
  const employees = parse(await redis('GET', KEYS.employees)); const rules = parse(await redis('GET', KEYS.rules));
  return { employees: Array.isArray(employees) ? employees : [], rules: rules && typeof rules === 'object' && !Array.isArray(rules) ? rules : null };
}

if (cmd === 'export') {
  if (fs.existsSync(file)) die(`${file} 이(가) 이미 있어요. 덮어쓰지 않아요. 다른 이름을 쓰거나 지우고 다시 하세요.`);
  const { employees, rules } = await readAll();
  const out = { exportedAt: new Date().toISOString(), source: 'interview-sms-app', employees, rules, count: employees.length, digest: digest({ employees, rules }) };
  fs.writeFileSync(file, JSON.stringify(out, null, 1), { mode: 0o600 });   // 나만 읽을 수 있게
  console.log(`✓ 직원 ${employees.length}명, 승진 기준 ${rules ? '있음' : '없음(기본값 사용 중)'} → ${file}`);
  console.log('  ⚠ 개인정보가 들어 있는 파일이에요. GitHub에 올리지 말고, 옮긴 뒤 지우세요.');
} else {
  if (!fs.existsSync(file)) die(`${file} 이(가) 없어요. 먼저 export로 내보내세요.`);
  let backup; try { backup = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { die('백업 파일을 읽지 못했어요.'); }
  const cur = await readAll();
  if (backup.source !== 'interview-sms-app' || digest({ employees: backup.employees, rules: backup.rules }) !== backup.digest) die('백업 파일이 손상됐거나 이 도구로 만든 파일이 아니에요. 지우지 않았어요.');
  if (digest({ employees: cur.employees, rules: cur.rules }) !== backup.digest) die('저장소의 내용이 백업과 달라요(그 사이에 바뀌었어요). 지우지 않았어요. 다시 export하세요.');
  const del = await redis('DEL', KEYS.employees, KEYS.rules);
  console.log(`✓ 저장소에서 지웠어요(직원 ${cur.employees.length}명, 키 ${del}개). 백업 파일(${file})은 옮긴 뒤 직접 지우세요.`);
}
