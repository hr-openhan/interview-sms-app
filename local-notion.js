// 앱 저장소(Redis 또는 파일)에 노션과 같은 모양으로 지원자·카드 본문·문항 표를 저장하고, 서버가 쓰던 노션 요청에 그대로 대답해요.
// 노션을 끊은 뒤에도 server.js의 지원자·면접 기능이 그대로 동작하게 하려는 것이에요. 서버가 실제로 쓰는 요청만 흉내 내요:
//   GET/PATCH /v1/pages/:id, POST /v1/pages, GET /v1/databases/:id, POST /v1/databases/:id/query,
//   GET/PATCH /v1/blocks/:id/children
// 저장 키: ln:db:<id>(표 구조), ln:rows:<id>(표의 페이지 번호 목록, 최신순), ln:page:<id>, ln:blocks:<id>
'use strict';
const crypto = require('crypto');

function makeErr(status, message) { const e = new Error(message); e.status = status; return e; }
const nid = v => String(v || '').replace(/-/g, '').toLowerCase();
const dashed = h => `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
const newId = () => { const h = crypto.randomBytes(16).toString('hex'); return dashed(h.slice(0, 12) + '4' + h.slice(13, 16) + '8' + h.slice(17)); };
const plain = arr => (Array.isArray(arr) ? arr : []).map(t => (t && (t.plain_text ?? (t.text && t.text.content))) || '').join('');
const richRead = arr => (Array.isArray(arr) ? arr : []).map(t => { const c = (t && (t.plain_text ?? (t.text && t.text.content))) || ''; return { type: 'text', text: { content: c, link: null }, plain_text: c, annotations: t && t.annotations || undefined }; });

function createLocalNotion({ get, set, remove }) {
  // get(key, def) / set(key, value) / remove(key) — 서버의 저장소 함수를 감싼 것
  const K = { db: id => `ln:db:${nid(id)}`, rows: id => `ln:rows:${nid(id)}`, page: id => `ln:page:${nid(id)}`, blocks: id => `ln:blocks:${nid(id)}` };
  const loadDb = async id => get(K.db(id), null);
  const loadRows = async id => { const v = await get(K.rows(id), []); return Array.isArray(v) ? v : []; };
  const loadPage = async id => get(K.page(id), null);
  const loadBlocks = async id => { const v = await get(K.blocks(id), []); return Array.isArray(v) ? v : []; };

  // 쓰기 형식의 속성 값을 읽기 형식(노션이 돌려주는 모양)으로 바꿔요. 형식은 표 구조에서 찾아요.
  function emptyProp(type) {
    const empty = { title: [], rich_text: [], multi_select: [], files: [], checkbox: false };
    const out = { type }; out[type] = Object.prototype.hasOwnProperty.call(empty, type) ? empty[type] : null; return out;
  }
  function toRead(type, v) {
    if (v === undefined) return undefined;
    if (v === null) return emptyProp(type);
    switch (type) {
      case 'title': return { type, title: richRead(v.title !== undefined ? v.title : v) };
      case 'rich_text': return { type, rich_text: richRead(v.rich_text !== undefined ? v.rich_text : v) };
      case 'select': { const s = v.select !== undefined ? v.select : v; return { type, select: s && s.name ? { name: String(s.name) } : null }; }
      case 'status': { const s = v.status !== undefined ? v.status : v; return { type, status: s && s.name ? { name: String(s.name) } : null }; }
      case 'multi_select': { const m = v.multi_select !== undefined ? v.multi_select : v; return { type, multi_select: (Array.isArray(m) ? m : []).filter(o => o && o.name).map(o => ({ name: String(o.name) })) }; }
      case 'date': { const d = v.date !== undefined ? v.date : v; return { type, date: d && d.start ? { start: String(d.start), end: d.end || null, time_zone: d.time_zone || null } : null }; }
      case 'number': { const n = v.number !== undefined ? v.number : v; return { type, number: typeof n === 'number' && isFinite(n) ? n : null }; }
      case 'phone_number': return { type, phone_number: (v.phone_number !== undefined ? v.phone_number : v) || null };
      case 'email': return { type, email: (v.email !== undefined ? v.email : v) || null };
      case 'url': return { type, url: (v.url !== undefined ? v.url : v) || null };
      case 'checkbox': return { type, checkbox: !!(v.checkbox !== undefined ? v.checkbox : v) };
      case 'files': return { type, files: Array.isArray(v.files) ? v.files : [] };
      default: { const out = { type }; out[type] = v[type] !== undefined ? v[type] : v; return out; }
    }
  }
  function guessType(v) { for (const t of ['title', 'rich_text', 'select', 'status', 'multi_select', 'date', 'number', 'phone_number', 'email', 'url', 'checkbox', 'files']) if (v && Object.prototype.hasOwnProperty.call(v, t)) return t; return 'rich_text'; }
  // 새 선택지(상태 등)가 쓰이면 표 구조의 선택지에도 넣어요(노션도 그렇게 해요)
  async function applyProps(db, props, write) {
    let schemaChanged = false; const out = { ...props };
    for (const [name, v] of Object.entries(write || {})) {
      const sp = db && db.properties && db.properties[name]; const type = (sp && sp.type) || guessType(v);
      const r = toRead(type, v); if (!r) continue; if (sp && sp.id) r.id = sp.id; out[name] = r;
      if (db && (type === 'select' || type === 'multi_select' || type === 'status')) {
        if (!db.properties[name]) { db.properties[name] = { type, [type]: { options: [] } }; schemaChanged = true; }
        const opts = ((db.properties[name][type] || {}).options) || []; const names = type === 'multi_select' ? (r.multi_select || []).map(o => o.name) : (r[type] ? [r[type].name] : []);
        for (const n of names) if (!opts.some(o => o.name === n)) { opts.push({ name: n }); schemaChanged = true; }
        db.properties[name][type] = { ...(db.properties[name][type] || {}), options: opts };
      }
    }
    return { props: out, schemaChanged };
  }

  // ----- 필터·정렬 -----
  const propText = p => !p ? '' : p.type === 'title' ? plain(p.title) : p.type === 'rich_text' ? plain(p.rich_text) : p.type === 'select' ? ((p.select && p.select.name) || '') : p.type === 'status' ? ((p.status && p.status.name) || '') : p.type === 'phone_number' ? (p.phone_number || '') : p.type === 'email' ? (p.email || '') : p.type === 'url' ? (p.url || '') : '';
  function matchCond(page, f) {
    if (!f) return true;
    if (Array.isArray(f.or)) return f.or.some(x => matchCond(page, x));
    if (Array.isArray(f.and)) return f.and.every(x => matchCond(page, x));
    if (f.timestamp) { const t = page[f.timestamp] || ''; const c = f[f.timestamp] || {}; return cmpDate(t, c); }
    const p = (page.properties || {})[f.property];
    for (const t of ['select', 'status']) if (f[t]) { const v = p && p[t] && p[t].name || ''; const c = f[t]; if ('equals' in c) return v === c.equals; if ('does_not_equal' in c) return v !== c.does_not_equal; if (c.is_empty) return !v; if (c.is_not_empty) return !!v; return true; }
    for (const t of ['title', 'rich_text', 'phone_number', 'email', 'url']) if (f[t]) { const v = propText(p); const c = f[t]; if ('equals' in c) return v === c.equals; if ('contains' in c) return v.includes(c.contains); if ('does_not_contain' in c) return !v.includes(c.does_not_contain); if ('starts_with' in c) return v.startsWith(c.starts_with); if ('ends_with' in c) return v.endsWith(c.ends_with); if (c.is_empty) return !v; if (c.is_not_empty) return !!v; return true; }
    if (f.multi_select) { const v = ((p && p.multi_select) || []).map(o => o.name); const c = f.multi_select; if ('contains' in c) return v.includes(c.contains); if ('does_not_contain' in c) return !v.includes(c.does_not_contain); if (c.is_empty) return !v.length; if (c.is_not_empty) return !!v.length; return true; }
    if (f.number) { const v = p && typeof p.number === 'number' ? p.number : null; const c = f.number; if (c.is_empty) return v === null; if (c.is_not_empty) return v !== null; if (v === null) return false; if ('equals' in c) return v === c.equals; if ('greater_than' in c) return v > c.greater_than; if ('less_than' in c) return v < c.less_than; if ('greater_than_or_equal_to' in c) return v >= c.greater_than_or_equal_to; if ('less_than_or_equal_to' in c) return v <= c.less_than_or_equal_to; return true; }
    if (f.date) { const v = p && p.date && p.date.start || ''; return cmpDate(v, f.date); }
    if (f.checkbox) { const v = !!(p && p.checkbox); return 'equals' in f.checkbox ? v === f.checkbox.equals : true; }
    return true;
  }
  function cmpDate(v, c) {
    if (c.is_empty) return !v; if (c.is_not_empty) return !!v; if (!v) return false;
    const d = String(v).slice(0, 10);
    if ('on_or_after' in c) return d >= String(c.on_or_after).slice(0, 10);
    if ('on_or_before' in c) return d <= String(c.on_or_before).slice(0, 10);
    if ('after' in c) return d > String(c.after).slice(0, 10);
    if ('before' in c) return d < String(c.before).slice(0, 10);
    if ('equals' in c) return d === String(c.equals).slice(0, 10);
    return true;
  }
  function sortVal(page, s) {
    if (s.timestamp) return page[s.timestamp] || '';
    const p = (page.properties || {})[s.property]; if (!p) return '';
    if (p.type === 'number') return typeof p.number === 'number' ? p.number : -Infinity;
    if (p.type === 'date') return (p.date && p.date.start) || '';
    return propText(p);
  }

  async function loadMany(ids) { return (await Promise.all(ids.map(id => loadPage(id)))).filter(Boolean); }

  // ----- 요청 처리 -----
  const out = p => p && p.object === 'page' ? { ...p, url: '' } : p;   // 노션 주소는 이제 쓰지 않아서 비워요(화면의 "노션에서 열기"가 사라져요)
  async function request(method, urlPath, body) { const r = await request0(method, urlPath, body); return r && Array.isArray(r.results) ? { ...r, results: r.results.map(out) } : out(r); }
  async function request0(method, urlPath, body) {
    const u = new URL(urlPath, 'http://local'); const seg = u.pathname.split('/').filter(Boolean);   // ['v1','pages',':id']
    if (seg[0] !== 'v1') throw makeErr(404, '지원하지 않는 요청이에요.');
    const kind = seg[1], id = seg[2], sub = seg[3];
    if (kind === 'pages' && !id && method === 'POST') {
      const dbId = body && body.parent && (body.parent.database_id || body.parent.data_source_id); if (!dbId) throw makeErr(400, '어느 표에 만들지 알 수 없어요.');
      const db = await loadDb(dbId); if (!db) throw makeErr(404, '표를 찾을 수 없어요.');
      const now = new Date().toISOString(); const pid = newId();
      const { props, schemaChanged } = await applyProps(db, {}, body.properties || {});
      // 표 구조에 있는데 값이 없는 속성도 빈 값으로 채워 둬요(노션도 모든 속성을 돌려줘요)
      for (const [name, sp] of Object.entries(db.properties || {})) if (!props[name]) props[name] = { ...emptyProp(sp.type), ...(sp.id ? { id: sp.id } : {}) };
      const page = { object: 'page', id: pid, url: `local://pages/${nid(pid)}`, parent: { type: 'database_id', database_id: dashed(nid(dbId)) }, created_time: now, last_edited_time: now, archived: false, properties: props };
      await set(K.page(pid), page);
      const rows = await loadRows(dbId); await set(K.rows(dbId), [pid, ...rows]);
      if (schemaChanged) await set(K.db(dbId), db);
      if (Array.isArray(body.children) && body.children.length) await set(K.blocks(pid), body.children.map(normBlock));
      return page;
    }
    if (kind === 'pages' && id && !sub) {
      const page = await loadPage(id); if (!page || page.archived) throw makeErr(404, '페이지를 찾을 수 없어요.');
      if (method === 'GET') return page;
      if (method === 'PATCH') {
        const dbId = page.parent && page.parent.database_id; const db = dbId ? await loadDb(dbId) : null;
        const { props, schemaChanged } = await applyProps(db, page.properties || {}, (body && body.properties) || {});
        page.properties = props; page.last_edited_time = new Date().toISOString();
        if (body && body.archived === true) { page.archived = true; await remove(K.page(id)); if (dbId) await set(K.rows(dbId), (await loadRows(dbId)).filter(x => nid(x) !== nid(id))); await remove(K.blocks(id)); return page; }
        await set(K.page(id), page); if (schemaChanged && db) await set(K.db(dbId), db);
        return page;
      }
    }
    if (kind === 'databases' && id && !sub && method === 'GET') { const db = await loadDb(id); if (!db) throw makeErr(404, '표를 찾을 수 없어요.'); return db; }
    if (kind === 'databases' && id && sub === 'query' && method === 'POST') {
      const db = await loadDb(id); if (!db) throw makeErr(404, '표를 찾을 수 없어요.');
      let pages = await loadMany(await loadRows(id));
      const f = body && body.filter; if (f) pages = pages.filter(p => matchCond(p, f));
      const sorts = (body && body.sorts) || [{ timestamp: 'created_time', direction: 'descending' }];
      pages.sort((a, b) => { for (const s of sorts) { const x = sortVal(a, s), y = sortVal(b, s); if (x < y) return s.direction === 'ascending' ? -1 : 1; if (x > y) return s.direction === 'ascending' ? 1 : -1; } return 0; });
      const size = Math.max(1, Math.min(Number(body && body.page_size) || 100, 100)); const start = Math.max(0, parseInt(body && body.start_cursor, 10) || 0);
      const results = pages.slice(start, start + size); const more = start + size < pages.length;
      return { object: 'list', results, has_more: more, next_cursor: more ? String(start + size) : null };
    }
    if (kind === 'blocks' && id && sub === 'children') {
      const list = await loadBlocks(id);
      if (method === 'GET') { const size = Math.max(1, Math.min(Number(u.searchParams.get('page_size')) || 100, 100)); const start = Math.max(0, parseInt(u.searchParams.get('start_cursor'), 10) || 0); const results = list.slice(start, start + size); const more = start + size < list.length; return { object: 'list', results, has_more: more, next_cursor: more ? String(start + size) : null }; }
      if (method === 'PATCH') { const add = ((body && body.children) || []).map(normBlock); await set(K.blocks(id), [...list, ...add]); return { object: 'list', results: add, has_more: false, next_cursor: null }; }
    }
    if (kind === 'file_uploads') throw makeErr(400, 'PDF 첨부는 파일 저장소를 연결한 뒤에 쓸 수 있어요.');
    throw makeErr(404, '지원하지 않는 요청이에요.');
  }
  function normBlock(b) { const x = { object: 'block', id: b.id || newId(), has_children: !!b.has_children, ...b }; if (!x.type) x.type = Object.keys(b).find(k => !['object', 'id', 'has_children'].includes(k)) || 'paragraph'; return x; }

  // ----- 가져오기용: 노션에서 받은 것을 그대로 저장 -----
  async function putDb(db) { const copy = JSON.parse(JSON.stringify(db)); await set(K.db(db.id), copy); }
  async function putPage(page, dbId) {
    await set(K.page(page.id), page);
    const rows = await loadRows(dbId); if (!rows.some(x => nid(x) === nid(page.id))) { rows.push(page.id); await set(K.rows(dbId), rows); }
  }
  async function putRowsOrder(dbId, ids) { await set(K.rows(dbId), ids); }
  async function putBlocks(id, blocks) { await set(K.blocks(id), blocks); }
  async function hasDb(id) { return !!(await loadDb(id)); }
  return { request, putDb, putPage, putBlocks, putRowsOrder, hasDb, loadRows, _matchCond: matchCond };
}
module.exports = { createLocalNotion };
