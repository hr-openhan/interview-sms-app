// 이력서 PDF 원본 저장소. Vercel Blob(비공개)을 쓰고, 토큰이 없으면 서버 폴더(DATA_DIR/files)에 저장해요.
// Vercel에서는 서버 폴더가 남지 않아서, Vercel인데 Blob 토큰이 없으면 저장하지 않아요(kind 'none').
'use strict';
const fs = require('fs');
const path = require('path');

function createFileStore({ dataDir }) {
  // Vercel Blob 연결 방식 두 가지: 예전 방식(BLOB_READ_WRITE_TOKEN)과 새 방식(BLOB_STORE_ID + Vercel이 자동으로 주는 OIDC 토큰)
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const storeId = process.env.BLOB_STORE_ID || '';
  const kind = (token || storeId) ? 'blob' : (process.env.VERCEL ? 'none' : 'local');
  const auth = token ? { token } : {};   // 새 방식이면 토큰을 넘기지 않아요(SDK가 OIDC로 알아서 인증해요)
  const safe = key => String(key).replace(/[^0-9A-Za-z_./-]/g, '_').replace(/\.\.+/g, '_');
  const localPath = key => path.join(dataDir, 'files', safe(key));
  let blob = null;
  const sdk = () => { if (!blob) blob = require('@vercel/blob'); return blob; };
  async function put(key, buf, contentType = 'application/pdf') {
    if (kind === 'blob') { await sdk().put(`resumes/${safe(key)}`, buf, { access: 'private', contentType, addRandomSuffix: false, allowOverwrite: true, ...auth }); return true; }
    if (kind === 'local') { const p = localPath(key); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); return true; }
    return false;
  }
  async function get(key) {
    if (kind === 'blob') {
      const r = await sdk().get(`resumes/${safe(key)}`, { access: 'private', useCache: false, ...auth }); if (!r || !r.stream) return null;
      const chunks = []; const reader = r.stream.getReader ? r.stream.getReader() : null;
      if (reader) { for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(Buffer.from(value)); } }
      else for await (const c of r.stream) chunks.push(Buffer.from(c));
      return Buffer.concat(chunks);
    }
    if (kind === 'local') { try { return fs.readFileSync(localPath(key)); } catch { return null; } }
    return null;
  }
  async function del(key) {
    if (kind === 'blob') { try { await sdk().del(`resumes/${safe(key)}`, { ...auth }); } catch { /* 없으면 그대로 */ } return; }
    if (kind === 'local') { try { fs.unlinkSync(localPath(key)); } catch { /* 없으면 그대로 */ } }
  }
  return { kind, put, get, del };
}
module.exports = { createFileStore };
