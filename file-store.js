// 이력서 PDF 원본 저장소. Vercel Blob(비공개)을 쓰고, 토큰이 없으면 서버 폴더(DATA_DIR/files)에 저장해요.
// Vercel에서는 서버 폴더가 남지 않아서, Vercel인데 Blob 토큰이 없으면 저장하지 않아요(kind 'none').
'use strict';
const fs = require('fs');
const path = require('path');

function createFileStore({ dataDir }) {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const kind = token ? 'blob' : (process.env.VERCEL ? 'none' : 'local');
  const safe = key => String(key).replace(/[^0-9A-Za-z_./-]/g, '_').replace(/\.\.+/g, '_');
  const localPath = key => path.join(dataDir, 'files', safe(key));
  let blob = null;
  const sdk = () => { if (!blob) blob = require('@vercel/blob'); return blob; };
  async function put(key, buf, contentType = 'application/pdf') {
    if (kind === 'blob') { await sdk().put(`resumes/${safe(key)}`, buf, { access: 'private', contentType, addRandomSuffix: false, allowOverwrite: true, token }); return true; }
    if (kind === 'local') { const p = localPath(key); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, buf); return true; }
    return false;
  }
  async function get(key) {
    if (kind === 'blob') {
      const r = await sdk().get(`resumes/${safe(key)}`, { access: 'private', token, useCache: false }); if (!r || !r.stream) return null;
      const chunks = []; const reader = r.stream.getReader ? r.stream.getReader() : null;
      if (reader) { for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(Buffer.from(value)); } }
      else for await (const c of r.stream) chunks.push(Buffer.from(c));
      return Buffer.concat(chunks);
    }
    if (kind === 'local') { try { return fs.readFileSync(localPath(key)); } catch { return null; } }
    return null;
  }
  async function del(key) {
    if (kind === 'blob') { try { await sdk().del(`resumes/${safe(key)}`, { token }); } catch { /* 없으면 그대로 */ } return; }
    if (kind === 'local') { try { fs.unlinkSync(localPath(key)); } catch { /* 없으면 그대로 */ } }
  }
  return { kind, put, get, del };
}
module.exports = { createFileStore };
