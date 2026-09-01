import fs from 'node:fs';

const index = fs.readFileSync('index.html', 'utf8');
const quiz = fs.readFileSync('quiz-ux.js', 'utf8');
const update = fs.readFileSync('app-update.js', 'utf8');
const css = fs.readFileSync('quiz-ux.css', 'utf8');
const sw = fs.readFileSync('sw.js', 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`편입수학 문제풀이 UX 검증 실패: ${message}`);
    process.exitCode = 1;
  }
}

assert(
  quiz.includes('data-math-choice') &&
    quiz.includes('chooseImmediately') &&
    quiz.includes('positionNextActionForTap();'),
  '선택 즉시 채점 후 다음 버튼 위치 이동이 없습니다.'
);

assert(
  quiz.includes('data-math-unknown') && quiz.includes('giveUpImmediately'),
  '모르겠음 버튼 또는 기록 흐름이 없습니다.'
);

assert(
  quiz.includes('data-math-next') && quiz.includes('advanceFromPending') && quiz.includes('positionQuestionAtReadingStart();'),
  '다음 문제 버튼 또는 다음 문항 시작 위치 정렬이 없습니다.'
);

assert(
  quiz.includes('pendingResult') && quiz.includes('TransferMathStorage.save(state)'),
  '채점 결과를 다음 문제 전까지 저장하는 처리가 없습니다.'
);

assert(
  quiz.includes('data-math-save-home') && quiz.includes('saveAndGoHome'),
  '진행 위치 저장 후 나가기 기능이 없습니다.'
);

assert(
  !quiz.includes('data-action="check"') && !quiz.includes('정답 확인'),
  '최종 문제 화면에 별도 정답 확인 버튼이 남아 있습니다.'
);

assert(
  update.includes("const APP_VERSION = 'v4';") &&
    update.includes('data-action="app-update"') &&
    update.includes('registration.update()') &&
    update.includes('SKIP_WAITING') &&
    update.includes('window.location.reload()'),
  '앱 내부 업데이트 기능이 없습니다.'
);

assert(
  css.includes('border-left: 0 !important'),
  '카드 왼쪽 강조선 제거 규칙이 없습니다.'
);

assert(
  index.includes('./quiz-ux.css') &&
    index.includes('./quiz-ux.js') &&
    index.includes('./app-update.js') &&
    index.indexOf('./app.js') < index.indexOf('./quiz-ux.js') &&
    index.indexOf('./quiz-ux.js') < index.indexOf('./app-update.js'),
  '최종 문제풀이와 업데이트 파일의 로딩 순서가 올바르지 않습니다.'
);

assert(
  sw.includes('transfer-math-trainer-v4') &&
    sw.includes('./quiz-ux.css') &&
    sw.includes('./quiz-ux.js') &&
    sw.includes('./app-update.js') &&
    sw.includes('event.data?.type === "SKIP_WAITING"'),
  '서비스 워커 캐시와 업데이트 메시지 처리가 최신 상태가 아닙니다.'
);

if (!process.exitCode) {
  console.log('즉시 채점, 모르겠음, 다음 버튼 이동, 다음 문항 위치 정렬, 저장 후 나가기, 앱 업데이트, 카드 강조선 제거 검증 통과');
}