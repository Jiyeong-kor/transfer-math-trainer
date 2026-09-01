import fs from "node:fs";
import vm from "node:vm";

const memory = new Map();
global.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};
global.window = {};

const files = [
  "content/curriculum.js",
  "content/concepts.js",
  "content/lessons.js",
  "content/lessons-foundation-engineering.js",
  "content/lessons-differential.js",
  "content/lessons-integral-calculus2.js",
  "content/lessons-linear.js",
  "content/problems.js",
  "content/problems-foundation-engineering.js",
  "content/problems-differential.js",
  "content/problems-integral-calculus2.js",
  "content/problems-linear.js",
  "content/learner-seed.js",
  "core/storage.js",
  "core/mastery.js",
  "core/scheduler.js",
  "core/session.js",
];
for (const file of files) vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const concepts = window.TRANSFER_MATH_CONCEPTS;
const problems = window.TRANSFER_MATH_PROBLEMS;
assert(concepts.length >= 60, `전체 커리큘럼 개념이 부족합니다: ${concepts.length}`);
assert(problems.length >= concepts.length, `개념당 최소 1문제 구성이 아닙니다: 개념 ${concepts.length}, 문제 ${problems.length}`);

const state = window.TransferMathStorage.freshState();
assert(state.mastery["MATH-DIFF-LIMIT-004"].status === "relearn", "ε-δ 상한 만들기 초기 약점이 보존되지 않았습니다.");
assert(state.mastery["MATH-DIFF-LIMIT-002"].status === "understood", "이미 이해한 인수분해 상태가 보존되지 않았습니다.");

const plan = window.TransferMathScheduler.getDailyPlan(state);
assert(plan.blocks.length === 3, `오늘의 3블록이 아닙니다: ${plan.blocks.length}`);
assert(plan.blocks[0].label === "약점 복구", "첫 블록이 약점 복구가 아닙니다.");
assert(new Set(plan.blocks.map((block) => block.conceptId)).size === plan.blocks.length, "오늘의 블록에 같은 개념이 중복되었습니다.");

const started = window.TransferMathSession.startDaily(state, plan);
assert(started?.items.length === 3, "오늘의 세션이 3문제로 시작되지 않았습니다.");
window.TransferMathSession.quit(state);

const learnedState = window.TransferMathStorage.freshState();
const id = "MATH-DIFF-LIMIT-002";
window.TransferMathMastery.update(learnedState, id, { problemId: "test-1", correct: true, gaveUp: false, selfGrade: "understood", errorType: null });
window.TransferMathMastery.update(learnedState, id, { problemId: "test-2", correct: true, gaveUp: false, selfGrade: "understood", errorType: null });
window.TransferMathMastery.update(learnedState, id, { problemId: "test-3", correct: true, gaveUp: false, selfGrade: "understood", errorType: null });
assert(learnedState.mastery[id].status === "stable", "연속 정답 뒤 안정 상태로 승급하지 않았습니다.");

window.TransferMathMastery.update(learnedState, id, { problemId: "test-4", correct: false, gaveUp: false, selfGrade: "understood", errorType: "careless" });
assert(learnedState.mastery[id].status === "stable", "단순 실수 한 번으로 안정 개념이 강등되었습니다.");

window.TransferMathMastery.update(learnedState, id, { problemId: "test-5", correct: false, gaveUp: true, selfGrade: "again", errorType: "concept" });
assert(learnedState.mastery[id].status === "relearn", "모르겠음 응답이 재학습 상태로 내려가지 않았습니다.");

console.log(`학습 엔진 테스트 성공: 개념 ${concepts.length}개, 문제 ${problems.length}개, 오늘 블록 ${plan.blocks.length}개`);
