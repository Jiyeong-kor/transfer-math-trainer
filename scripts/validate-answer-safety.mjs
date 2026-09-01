import fs from "node:fs";
import vm from "node:vm";

global.window = {};

const problemFiles = [
  "content/problems.js",
  ...fs.readdirSync("content")
    .filter((name) => /^problems-.+\.js$/.test(name))
    .sort()
    .map((name) => `content/${name}`),
];

for (const file of problemFiles) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

const beforeProblems = new Map(
  (window.TRANSFER_MATH_PROBLEMS || []).map((problem) => [problem.id, {
    prompt: problem.prompt,
    math: problem.math,
    title: problem.title,
    hint: problem.hint,
  }]),
);

vm.runInThisContext(fs.readFileSync("content/problem-safety.js", "utf8"), { filename: "content/problem-safety.js" });

const problems = window.TRANSFER_MATH_PROBLEMS;
const safety = window.TRANSFER_MATH_ANSWER_SAFETY;
const errors = [];

if (!Array.isArray(problems) || problems.length === 0) errors.push("문제 데이터가 비어 있습니다.");
if (!safety?.isAnswerLeak) errors.push("정답 노출 검사 함수를 불러오지 못했습니다.");

if (safety?.isAnswerLeak) {
  if (!safety.isAnswerLeak("δ=min(1, ε/5)", "min(1, ε/5)", "math")) {
    errors.push("회귀 실패: 수식 카드의 정답 대입 노출을 감지하지 못합니다.");
  }
  if (safety.isAnswerLeak("|x²-4|=|x-2||x+2|<5|x-2|", "min(1, ε/5)", "math")) {
    errors.push("회귀 실패: 안전한 풀이 수식을 정답 노출로 잘못 판단합니다.");
  }
}

const afterIds = new Set((problems || []).map((problem) => problem.id));
for (const id of beforeProblems.keys()) {
  if (!afterIds.has(id)) errors.push(`${id}: 문제 본문에 정답이 노출되어 런타임에서 제거되었습니다. 원본 문제를 수정해야 합니다.`);
}

for (const problem of problems || []) {
  if (safety?.isAnswerLeak(problem.prompt, problem.answer, "prompt")) {
    errors.push(`${problem.id}: 문제 본문에 정답이 노출됩니다.`);
  }

  for (const field of ["math", "title", "hint"]) {
    if (safety?.isAnswerLeak(problem[field], problem.answer, field)) {
      errors.push(`${problem.id}: ${field}에 정답이 노출됩니다.`);
    }

    const before = beforeProblems.get(problem.id)?.[field];
    if (before && !problem[field]) {
      errors.push(`${problem.id}: ${field}의 정답 노출을 안전 가드가 숨겼습니다. 원본 데이터에 안전한 내용을 넣어야 합니다.`);
    }
  }
}

const expectedMath = new Map([
  ["P-DIFF-LIMIT-006-EX3", "|x²-4|=|x-2||x+2|<5|x-2|"],
  ["P-DIFF-LIMIT-007-EX4", "|√(x-1)-2|≤|x-5|/2"],
  ["P-DIFF-CONT-001-EX3", "lim x→a f(x), f(a)"],
]);
for (const [id, math] of expectedMath) {
  const problem = (problems || []).find((item) => item.id === id);
  if (!problem) errors.push(`${id}: 회귀 대상 문제를 찾을 수 없습니다.`);
  else if (problem.math !== math) errors.push(`${id}: 정답 대신 보여 줄 풀이 수식이 유지되지 않았습니다.`);
}

const indexHtml = fs.readFileSync("index.html", "utf8");
const safetyIndex = indexHtml.indexOf("./content/problem-safety.js");
const appIndex = indexHtml.indexOf("./app.js");
if (safetyIndex < 0) errors.push("index.html에 problem-safety.js가 포함되지 않았습니다.");
if (safetyIndex >= 0 && appIndex >= 0 && safetyIndex > appIndex) errors.push("problem-safety.js는 app.js보다 먼저 로드되어야 합니다.");

const serviceWorker = fs.readFileSync("sw.js", "utf8");
if (!serviceWorker.includes("./content/problem-safety.js")) errors.push("sw.js 오프라인 캐시에 problem-safety.js가 없습니다.");

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`정답 노출 검증 성공: ${problems.length}문제`);
