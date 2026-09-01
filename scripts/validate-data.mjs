import fs from "node:fs";
import vm from "node:vm";

global.window = {};

const contentFiles = [
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
];

const errors = [];
for (const file of contentFiles) {
  if (!fs.existsSync(file)) {
    errors.push(`필수 콘텐츠 파일 누락: ${file}`);
    continue;
  }
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

const curriculum = window.TRANSFER_MATH_CURRICULUM;
const concepts = window.TRANSFER_MATH_CONCEPTS;
const lessons = window.TRANSFER_MATH_LESSONS;
const problems = window.TRANSFER_MATH_PROBLEMS;
const learnerSeed = window.TRANSFER_MATH_LEARNER_SEED;

for (const [name, value] of Object.entries({ curriculum, concepts, lessons, problems })) {
  if (!Array.isArray(value) || value.length === 0) errors.push(`${name}: 비어 있거나 배열이 아닙니다.`);
}
if (!learnerSeed || typeof learnerSeed !== "object") errors.push("learnerSeed: 객체가 아닙니다.");

const stageIds = new Set();
for (const stage of curriculum || []) {
  if (!stage.id || !stage.title || !Number.isFinite(stage.order)) errors.push(`커리큘럼 필드 누락: ${JSON.stringify(stage)}`);
  if (stageIds.has(stage.id)) errors.push(`중복 커리큘럼 id: ${stage.id}`);
  stageIds.add(stage.id);
}

const conceptIds = new Set();
const conceptOrders = new Set();
const conceptMap = new Map();
const allowedStatuses = new Set(["unseen", "unassessed", "relearn", "partial", "understood", "stable"]);

for (const concept of concepts || []) {
  for (const key of ["id", "subject", "unit", "title", "stage", "source", "initialStatus"]) {
    if (!concept[key]) errors.push(`${concept.id || "(id 없음)"}: ${key} 누락`);
  }
  if (!Number.isFinite(concept.curriculumOrder)) errors.push(`${concept.id}: curriculumOrder 누락`);
  if (conceptOrders.has(concept.curriculumOrder)) errors.push(`${concept.id}: 중복 curriculumOrder ${concept.curriculumOrder}`);
  conceptOrders.add(concept.curriculumOrder);
  if (!Array.isArray(concept.prerequisites)) errors.push(`${concept.id}: prerequisites가 배열이 아닙니다.`);
  if (!Array.isArray(concept.targetSchools) || concept.targetSchools.length === 0) errors.push(`${concept.id}: targetSchools 누락`);
  if (!stageIds.has(concept.stage)) errors.push(`${concept.id}: 존재하지 않는 stage ${concept.stage}`);
  if (!allowedStatuses.has(concept.initialStatus)) errors.push(`${concept.id}: 잘못된 initialStatus ${concept.initialStatus}`);
  if (conceptIds.has(concept.id)) errors.push(`중복 concept id: ${concept.id}`);
  conceptIds.add(concept.id);
  conceptMap.set(concept.id, concept);
}

for (const concept of concepts || []) {
  for (const prerequisiteId of concept.prerequisites || []) {
    if (!conceptIds.has(prerequisiteId)) errors.push(`${concept.id}: 존재하지 않는 prerequisite ${prerequisiteId}`);
    if (prerequisiteId === concept.id) errors.push(`${concept.id}: 자기 자신을 prerequisite로 가질 수 없습니다.`);
  }
}

const visiting = new Set();
const visited = new Set();
function visitConcept(id) {
  if (visiting.has(id)) {
    errors.push(`선행 관계 순환 감지: ${id}`);
    return;
  }
  if (visited.has(id)) return;
  visiting.add(id);
  for (const next of conceptMap.get(id)?.prerequisites || []) visitConcept(next);
  visiting.delete(id);
  visited.add(id);
}
for (const id of conceptIds) visitConcept(id);

const lessonIds = new Set();
for (const item of lessons || []) {
  if (!item.conceptId) errors.push("lesson: conceptId 누락");
  if (!conceptIds.has(item.conceptId)) errors.push(`lesson: 존재하지 않는 conceptId ${item.conceptId}`);
  if (lessonIds.has(item.conceptId)) errors.push(`중복 lesson conceptId: ${item.conceptId}`);
  lessonIds.add(item.conceptId);
  for (const key of ["definition", "whyItMatters", "workedExample"]) {
    if (!item[key]) errors.push(`${item.conceptId}: lesson ${key} 누락`);
  }
  if (!Array.isArray(item.steps) || item.steps.length === 0) errors.push(`${item.conceptId}: lesson steps 누락`);
}
for (const id of conceptIds) if (!lessonIds.has(id)) errors.push(`${id}: lesson이 없습니다.`);

const problemIds = new Set();
const problemCountByConcept = new Map([...conceptIds].map((id) => [id, 0]));
for (const problem of problems || []) {
  for (const key of ["id", "type", "prompt", "answer", "sourceType"]) {
    if (!problem[key]) errors.push(`${problem.id || "(id 없음)"}: problem ${key} 누락`);
  }
  if (problemIds.has(problem.id)) errors.push(`중복 problem id: ${problem.id}`);
  problemIds.add(problem.id);
  if (!Array.isArray(problem.conceptIds) || problem.conceptIds.length === 0) errors.push(`${problem.id}: conceptIds 누락`);
  if (!Array.isArray(problem.choices) || problem.choices.length < 2) errors.push(`${problem.id}: choices가 부족합니다.`);
  if (new Set(problem.choices || []).size !== (problem.choices || []).length) errors.push(`${problem.id}: 중복 선택지가 있습니다.`);
  if (!problem.choices?.includes(problem.answer)) errors.push(`${problem.id}: answer가 choices 안에 없습니다.`);
  if (!Array.isArray(problem.solutionSteps) || problem.solutionSteps.length === 0) errors.push(`${problem.id}: solutionSteps 누락`);
  if (!Number.isFinite(problem.difficulty) || problem.difficulty < 1 || problem.difficulty > 5) errors.push(`${problem.id}: difficulty는 1~5여야 합니다.`);
  for (const conceptId of problem.conceptIds || []) {
    if (!conceptIds.has(conceptId)) errors.push(`${problem.id}: 존재하지 않는 conceptId ${conceptId}`);
    else problemCountByConcept.set(conceptId, problemCountByConcept.get(conceptId) + 1);
  }
}
for (const [conceptId, count] of problemCountByConcept) if (count === 0) errors.push(`${conceptId}: 연결된 문제가 없습니다.`);

for (const [conceptId, seed] of Object.entries(learnerSeed || {})) {
  if (!conceptIds.has(conceptId)) errors.push(`learnerSeed: 존재하지 않는 conceptId ${conceptId}`);
  if (!allowedStatuses.has(seed.status)) errors.push(`${conceptId}: learnerSeed status 오류 ${seed.status}`);
  if (!seed.evidence) errors.push(`${conceptId}: learnerSeed evidence 누락`);
}

const indexHtml = fs.readFileSync("index.html", "utf8");
const serviceWorker = fs.readFileSync("sw.js", "utf8");
for (const file of contentFiles) {
  if (!indexHtml.includes(`./${file}`)) errors.push(`index.html에서 콘텐츠 파일 누락: ${file}`);
  if (!serviceWorker.includes(`./${file}`)) errors.push(`sw.js 오프라인 캐시에서 콘텐츠 파일 누락: ${file}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`검증 성공: 커리큘럼 ${curriculum.length}단계, 개념 ${concepts.length}개, 설명 ${lessons.length}개, 문제 ${problems.length}개, 초기 학습 근거 ${Object.keys(learnerSeed).length}개`);
