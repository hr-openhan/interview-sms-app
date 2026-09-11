// Vercel은 /api 폴더 안의 파일을 자동으로 서버리스 함수로 인식합니다.
// [...path].js 는 /api/로 시작하는 모든 요청을 이 파일 하나가 전부 받도록 하는 규칙입니다.
// 실제 처리는 기존 Express 앱(server.js)이 그대로 담당합니다.
module.exports = require('../server.js');
