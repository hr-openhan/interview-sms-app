// 노션 지원자 DB 전체 백업 — 지원자 속성, 본문(평가·답변 기록), "채용 문항" 표(면접 질문·답변·점수), 첨부 파일(이력서 PDF)을 내 컴퓨터에 저장해요.
//
// 노션을 더 쓰지 않게 될 때를 위한 백업이에요. 노션의 내용은 지우지도 바꾸지도 않아요(읽기만 해요).
//
// 사용법 (이 앱 폴더에서)
//   NOTION_TOKEN=secret_xxx node scripts/notion-backup.mjs 노션백업_2026-11-06
//   NOTION_TOKEN은 Vercel에 설정한 값과 같아요. 다른 DB를 백업하려면 NOTION_DATABASE_ID=… 도 함께 주세요.
//
// 만들어지는 것 (폴더 안)
//   README.txt            무엇이 들어 있는지
//   manifest.json         지원자 수·상태별 인원·파일 수·실패한 항목·검증 결과 (백업이 빠짐없는지 확인할 때 보세요)
//   applicants.json       지원자마다 속성 전체 + 정리한 값 + 구분(group) + 본문 글 + 질문·답변 표 + 파일 목록
//   applicants.csv        엑셀에서 바로 열려요(한 줄 = 한 명)
//   진행중.csv · 입사(합격자).csv · 퇴사(계약종료).csv · 탈락·불참.csv · 기타(확인 필요).csv · 참고자료.csv   구분별로 나눈 표(참고자료는 지원자가 아닌 면접 질문지·인재상 같은 페이지)
//   files/<이름>_<번호>/  첨부 파일(이력서 PDF 등)
//
// ⚠ 이 폴더에는 이름·전화번호·면접 평가 같은 개인정보가 들어 있어요. GitHub에 올리지 말고 안전한 곳에 보관하세요.
import fs from 'node:fs';
import path from 'node:path';

const NOTION_VERSION = '2022-06-28';   // 앱(server.js)이 쓰는 값과 같아요
const BASE = (process.env.NOTION_API_BASE || 'https://api.notion.com').replace(/\/$/, '');
const TOKEN = process.env.NOTION_TOKEN;
const DB_ID = String(process.env.NOTION_DATABASE_ID || '3a6e1184cb9340a0ada97e3dbdc4547a').replace(/-/g, '');
const outDir = process.argv[2];
const die = m => { console.error('✗ ' + m); process.exit(1); };
if (!outDir) die('사용법: NOTION_TOKEN=… node scripts/notion-backup.mjs 백업폴더이름');
if (!TOKEN) die('NOTION_TOKEN이 없어요(Vercel에 설정한 노션 토큰과 같은 값).');
if (fs.existsSync(outDir)) die(`${outDir} 폴더가 이미 있어요. 덮어쓰지 않아요. 다른 이름을 쓰거나 지우고 다시 하세요.`);

// ---- 노션 요청: 초당 3건 제한을 지키고, 429·일시 오류는 기다렸다가 다시 시도해요 ----
const GAP_MS = process.env.NOTION_BACKUP_GAP_MS !== undefined ? Math.max(0, Number(process.env.NOTION_BACKUP_GAP_MS) || 0) : 350;   // 노션은 초당 약 3건까지만 받아요. 시험에서만 줄여요.
let lastAt = 0;
async function notion(method, url, body) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const wait = GAP_MS - (Date.now() - lastAt); if (wait > 0) await new Promise(r => setTimeout(r, wait)); lastAt = Date.now();
    let res;
    try { res = await fetch(BASE + url, { method, headers: { Authorization: `Bearer ${TOKEN}`, 'Notion-Version': NOTION_VERSION, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { if (attempt === 5) throw new Error('노션에 연결하지 못했어요: ' + e.message); await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
    if (res.status === 429 || res.status >= 500) { const ra = Number(res.headers.get('retry-after')) || 2 * (attempt + 1); await new Promise(r => setTimeout(r, ra * 1000)); continue; }
    const j = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(`노션 오류 ${res.status}: ${j.message || ''}`); e.status = res.status; throw e; }
    return j;
  }
  throw new Error('노션이 계속 바쁘다고 답해요. 잠시 뒤 다시 실행하세요.');
}
async function allPages(method, url, body) {   // 쪽(100개)마다 이어서 끝까지 읽어요
  const out = []; let cursor = '', pages = 0; out.truncated = false;
  do {
    const u = method === 'GET' ? `${url}${url.includes('?') ? '&' : '?'}page_size=100${cursor ? '&start_cursor=' + encodeURIComponent(cursor) : ''}` : url;
    const j = await notion(method, u, method === 'POST' ? { ...(body || {}), page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) } : undefined);
    out.push(...(j.results || [])); cursor = j.has_more ? (j.next_cursor || '') : ''; pages++;
    if (j.has_more && !j.next_cursor) out.truncated = true;   // 더 있다고 하면서 이어 읽을 표시를 안 주면 중간에 끊긴 거예요
    if (pages > 500) throw new Error('쪽 수가 너무 많아요(500쪽 초과). 중단했어요.');
  } while (cursor);
  return out;
}

// ---- 값 읽기 ----
const rich = a => (a || []).map(t => t.plain_text ?? t.text?.content ?? '').join('');
function propValue(p) {   // 속성 하나를 사람이 읽는 값으로(모든 종류를 빠짐없이 — 모르는 종류는 원본 그대로)
  if (!p) return null;
  switch (p.type) {
    case 'title': case 'rich_text': return rich(p[p.type]);
    case 'select': return p.select?.name ?? ''; case 'status': return p.status?.name ?? '';
    case 'multi_select': return (p.multi_select || []).map(o => o.name);
    case 'date': return p.date ? (p.date.end ? `${p.date.start} ~ ${p.date.end}` : p.date.start) : '';
    case 'number': return p.number; case 'checkbox': return !!p.checkbox;
    case 'phone_number': return p.phone_number ?? ''; case 'email': return p.email ?? ''; case 'url': return p.url ?? '';
    case 'people': return (p.people || []).map(x => x.name || x.id);
    case 'files': return (p.files || []).map(f => f.name);
    case 'created_time': return p.created_time; case 'last_edited_time': return p.last_edited_time;
    case 'formula': { const f = p.formula || {}; return f[f.type] ?? null; }
    case 'relation': return (p.relation || []).map(r => r.id);
    case 'rollup': return p.rollup ?? null;
    default: return p[p.type] ?? null;
  }
}
// ---- 본문 블록을 글로(자식 블록까지). 자식 데이터베이스는 따로 읽어요 ----
function blockText(b) { const t = b.type; const v = b[t] || {}; return rich(v.rich_text) || (t === 'child_database' ? `[표: ${v.title || ''}]` : t === 'child_page' ? `[하위 페이지: ${v.title || ''}]` : ''); }
async function readBlocks(blockId, depth, state) {
  const blocks = await allPages('GET', `/v1/blocks/${blockId}/children`);
  const lines = [], dbs = [], files = [];
  for (const b of blocks) {
    const pad = '  '.repeat(depth);
    if (b.type === 'child_database') { dbs.push({ id: b.id, title: b.child_database?.title || '' }); lines.push(pad + blockText(b)); continue; }
    if (['file', 'pdf', 'image', 'video', 'audio'].includes(b.type)) { const f = b[b.type] || {}; const url = f.file?.url || f.external?.url || ''; files.push({ name: f.name || rich(f.caption) || b.type, url, external: !!f.external, blockId: b.id }); lines.push(`${pad}[파일: ${f.name || b.type}]`); continue; }
    const txt = blockText(b); if (txt) lines.push(pad + (b.type === 'bulleted_list_item' || b.type === 'numbered_list_item' ? '- ' : b.type === 'to_do' ? (b.to_do?.checked ? '[x] ' : '[ ] ') : '') + txt);
    if (b.has_children && depth < 4 && b.type !== 'child_page') { const sub = await readBlocks(b.id, depth + 1, state); lines.push(...sub.lines); dbs.push(...sub.dbs); files.push(...sub.files); }
  }
  return { lines, dbs, files };
}
async function readTable(dbId) {   // "채용 문항" 같은 인라인 표: 행마다 속성 전체
  const rows = await allPages('POST', `/v1/databases/${dbId}/query`, {});
  return rows.map(r => Object.fromEntries(Object.entries(r.properties || {}).map(([k, v]) => [k, propValue(v)])));
}
const safe = s => String(s || '').replace(/[\u0000-\u001f\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 40) || '이름없음';
// 실제 노션 「진행중 채용」의 면접상태 9개: 채용 과제·1차 면접 예정자·서류합격·2차 면접 예정·탈락 후보·불참·탈락 확정·계약종료&퇴사·채용
const ACTIVE = ['서류합격', '1차 면접 예정자', '채용 과제', '2차 면접 예정', '탈락 후보'], OUT = ['탈락 확정', '불참'];
// 이 DB에는 지원자가 아닌 참고 페이지(면접 질문지·오픈한 인재상·대학 순위·채용과제 리스트)도 들어 있어요: 팀명이 "면접정보"이거나, 상태·전화번호·팀이 모두 빈 페이지
const isReference = a => a.team === '면접정보' || (!a.status && !a.phone && !a.team);
const groupOf = a => isReference(a) ? '참고 자료(지원자 아님)' : (a.status === '채용' || a.hireDate) ? '입사(합격자)' : a.status === '계약종료&퇴사' ? '퇴사(계약종료)' : ACTIVE.includes(a.status) ? '진행 중' : OUT.includes(a.status) ? '탈락·불참' : '기타(확인 필요)';
const csvCell = v => { const s = Array.isArray(v) ? v.join(' / ') : v == null ? '' : String(v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

// ---- 실행 ----
console.log('노션에서 지원자 목록을 읽는 중…');
const schema = await notion('GET', `/v1/databases/${DB_ID}`);
const propNames = Object.keys(schema.properties || {});
const pages = await allPages('POST', `/v1/databases/${DB_ID}/query`, {});
const listTruncated = !!pages.truncated;   // 노션이 "더 있어요"라고 했는데 이어 읽을 수 없었으면 true
const etaMin = Math.ceil(pages.length * 6 * (GAP_MS / 1000) / 60);   // 지원자 한 명당 요청 약 6건(본문·하위 블록·질문 표·파일)
console.log(`페이지 ${pages.length}개를 찾았어요(지원자와 면접 참고 자료가 함께 있어요). 본문·표·파일을 읽어요. 노션의 속도 제한(초당 약 3건) 때문에 약 ${etaMin}분 걸려요. 중간에 끄지 마세요(끄면 처음부터 다시 해야 해요).`);
fs.mkdirSync(path.join(outDir, 'files'), { recursive: true, mode: 0o700 });
const applicants = [], errors = []; let fileCount = 0, fileBytes = 0;
let n = 0;
for (const pg of pages) {
  n++; const P = pg.properties || {}; const props = Object.fromEntries(Object.entries(P).map(([k, v]) => [k, propValue(v)]));
  const nameProp = Object.entries(P).find(([, v]) => v.type === 'title'); const name = nameProp ? rich(nameProp[1].title) : '';
  const a = { id: pg.id, url: pg.url, name, status: props['면접상태'] || '', team: props['팀명'] || '', phone: props['전화번호'] || '', hireDate: props['입사일'] || '', createdAt: pg.created_time, editedAt: pg.last_edited_time, archived: !!pg.archived, properties: props, body: '', tables: [], files: [], errors: [] };
  a.group = groupOf(a);
  try {
    const body = await readBlocks(pg.id, 0, {}); a.body = body.lines.join('\n');
    for (const d of body.dbs) { try { a.tables.push({ title: d.title, rows: await readTable(d.id) }); } catch (e) { a.errors.push(`표 "${d.title}" 읽기 실패: ${e.message}`); } }
    // 파일: 파일 속성 + 본문 파일 블록. 노션의 파일 주소는 1시간 뒤 만료되니 받자마자 저장해요
    const fileProps = Object.entries(P).filter(([, v]) => v.type === 'files').flatMap(([k, v]) => (v.files || []).map(f => ({ name: f.name, url: f.file?.url || f.external?.url || '', external: !!f.external, from: k })));
    const all = [...fileProps, ...body.files.map(f => ({ ...f, from: '본문' }))];
    const dir = path.join(outDir, 'files', `${safe(name)}_${pg.id.replace(/-/g, '').slice(0, 8)}`); let k = 0;
    for (const f of all) {
      if (!f.url) { a.errors.push(`파일 "${f.name}" 주소가 없어요`); continue; }
      try {
        const res = await fetch(f.url); if (!res.ok) throw new Error('HTTP ' + res.status);
        const buf = Buffer.from(await res.arrayBuffer()); fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
        let fn = safe(f.name).replace(/\.+$/, '') || '파일'; if (!/\.[A-Za-z0-9]{2,5}$/.test(fn)) fn += (buf.slice(0, 5).toString() === '%PDF-' ? '.pdf' : '');
        const fp = path.join(dir, `${++k}_${fn}`); fs.writeFileSync(fp, buf, { mode: 0o600 });
        a.files.push({ name: f.name, from: f.from, saved: path.relative(outDir, fp), bytes: buf.length, pdf: buf.slice(0, 5).toString() === '%PDF-' }); fileCount++; fileBytes += buf.length;
      } catch (e) { a.errors.push(`파일 "${f.name}" 내려받기 실패: ${e.message}`); }
    }
  } catch (e) { a.errors.push('본문 읽기 실패: ' + e.message); }
  if (a.errors.length) errors.push({ name, id: pg.id, errors: a.errors });
  applicants.push(a);
  if (n % 10 === 0 || n === pages.length) console.log(`  ${n}/${pages.length}`);
}

// ---- 저장 ----
const cols = ['구분', '이름', '면접상태', '입사일', ...propNames.filter(k => !['이름', '면접상태', '입사일'].includes(k)), '노션 주소', '본문 글자수', '첨부 파일 수', '질문·답변 표 행 수', '읽기 오류'];
const toRow = a => [a.group, a.name, a.status, a.hireDate, ...propNames.filter(k => !['이름', '면접상태', '입사일'].includes(k)).map(k => a.properties[k]), a.url, a.body.length, a.files.length, a.tables.reduce((s, t) => s + t.rows.length, 0), a.errors.join(' | ')];
const csv = list => '\ufeff' + [cols, ...list.map(toRow)].map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
const GROUPS = ['진행 중', '입사(합격자)', '퇴사(계약종료)', '탈락·불참', '기타(확인 필요)', '참고 자료(지원자 아님)'];
const GROUP_FILE = { '진행 중': '진행중', '입사(합격자)': '입사(합격자)', '퇴사(계약종료)': '퇴사(계약종료)', '탈락·불참': '탈락·불참', '기타(확인 필요)': '기타(확인 필요)', '참고 자료(지원자 아님)': '참고자료' };
fs.writeFileSync(path.join(outDir, 'applicants.json'), JSON.stringify(applicants, null, 1), { mode: 0o600 });
fs.writeFileSync(path.join(outDir, 'applicants.csv'), csv(applicants.filter(a => !isReference(a))), { mode: 0o600 });   // 지원자만(참고 자료는 참고자료.csv 와 applicants.json 에 있어요)
for (const g of GROUPS) fs.writeFileSync(path.join(outDir, GROUP_FILE[g] + '.csv'), csv(applicants.filter(a => a.group === g)), { mode: 0o600 });
const byStatus = {}; for (const a of applicants) byStatus[a.status || '(상태 없음)'] = (byStatus[a.status || '(상태 없음)'] || 0) + 1;
const byGroup = Object.fromEntries(GROUPS.map(g => [g, applicants.filter(a => a.group === g).length]));
const manifest = { createdAt: new Date().toISOString(), source: 'notion', databaseId: DB_ID, applicantCount: applicants.length, expectedCount: pages.length, complete: applicants.length === pages.length && !listTruncated, listTruncated, byStatus, byGroup, groupRule: '팀명이 "면접정보"이거나 상태·전화번호·팀이 모두 비어 있으면 → 참고 자료(지원자 아님) / 면접상태 "채용" 또는 입사일 있음 → 입사(합격자) / 계약종료&퇴사 → 퇴사(계약종료) / 서류합격·1차 면접 예정자·채용 과제·2차 면접 예정·탈락 후보 → 진행 중 / 탈락 확정·불참 → 탈락·불참 / 그 밖 → 기타(확인 필요)', referenceCount: applicants.filter(isReference).length, personCount: applicants.filter(a => !isReference(a)).length, files: fileCount, fileBytes, withBody: applicants.filter(a => a.body).length, withTables: applicants.filter(a => a.tables.length).length, archivedCount: applicants.filter(a => a.archived).length, errorCount: errors.length, errors, properties: propNames };
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1), { mode: 0o600 });
fs.writeFileSync(path.join(outDir, 'README.txt'), `노션 지원자 DB 백업 (${manifest.createdAt})
지원자 ${manifest.personCount}명 · 참고 자료 ${manifest.referenceCount}개 · 첨부 파일 ${fileCount}개 · 읽기 오류 ${errors.length}건

■ 파일
 manifest.json     지원자 수, 상태별·구분별 인원, 읽기 오류 목록 — 백업이 빠짐없는지 여기서 확인하세요.
 applicants.json   모든 정보(속성 전체·본문 글·"채용 문항" 표·파일 목록).
 applicants.csv    엑셀로 바로 열려요. 진행중.csv·입사(합격자).csv·퇴사(계약종료).csv·탈락·불참.csv·기타(확인 필요).csv 는 구분별로 나눈 표예요. applicants.csv 는 지원자만이고, 면접 질문지·오픈한 인재상 같은 지원자가 아닌 페이지는 참고자료.csv 와 applicants.json 에 따로 있어요.
 files/            이력서 PDF 등 첨부 파일.

■ 구분(group) 규칙 — 제가 정한 규칙이에요. 맞지 않으면 applicants.json 의 status·hireDate 로 직접 나누세요.
 ${manifest.groupRule}

■ 주의
 - 노션의 내용은 바꾸지 않았어요(읽기만 했어요).
 - 개인정보(이름·전화번호·면접 평가)가 들어 있어요. GitHub에 올리지 말고 안전하게 보관하고, 필요 없어지면 지우세요.
 - 읽기 오류가 있으면 manifest.json 의 errors 를 보고 그 사람만 노션에서 직접 확인하세요.
`, { mode: 0o600 });
console.log(`\n✓ 백업 완료 → ${outDir}/`);
console.log(`  지원자 ${manifest.personCount}명 + 참고 자료 ${manifest.referenceCount}개 (${GROUPS.map(g => `${g} ${byGroup[g]}`).join(' · ')})`);
console.log(`  첨부 파일 ${fileCount}개 (${(fileBytes / 1048576).toFixed(1)}MB) · 질문·답변 표가 있는 지원자 ${manifest.withTables}명`);
console.log(`  읽기 오류 ${errors.length}건${errors.length ? ' — manifest.json 의 errors 를 확인하세요' : ''}`);
console.log('  ⚠ 개인정보가 들어 있어요. GitHub에 올리지 마세요.');
if (!manifest.complete) { console.error(listTruncated ? '✗ 노션이 지원자가 더 있다고 알려줬는데 이어서 읽지 못했어요. 백업이 불완전해요. 다시 실행해 주세요.' : '✗ 지원자 수가 맞지 않아요. 백업이 불완전할 수 있어요.'); process.exit(2); }
