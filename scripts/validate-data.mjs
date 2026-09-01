import fs from "node:fs";
import vm from "node:vm";

global.window = {};

const contentFiles = [
  "content/curriculum.js",
  "content/concepts.js",
  "content/lessons.js",
  "content/problems.js",
  "content/learner-seed.js",
];

for (const file of contentFiles) {
  vm.runInThisContext(fs.readFileSync(file, "utf8"), { filename: file });
}

const curriculum = window.TRANSFER_MATH_CURRICULUM;
const concepts = window.TRANSFER_MATH_CONCEPTS;
const lessons = window.TRANSFER_MATH_LESSONS;
const problems = window.TRANSFER_MATH_PROBLEMS;
const learnerSeed = window.TRANSFER_MATH_LEARNER_SEED;
const errors = [];

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
const conceptMap = new Map();
const allowedStatuses = new Set(["unseen", "unassessed", "relearn", "partial", "understood", "stable"]);

for (const concept of concepts || []) {
  for (const key of ["id", "subject", "unit", "title", "stage", "source", "initialStatus"]) {
    if (!concept[key]) errors.push(`${concept.id || "(id 없음)"}: ${key} 누락`);
  }
  if (!Array.isArray(concept.prerequisites)) errors.push(`${concept.id}: prerequisites가 배열이 아닙니다.`);
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
for (const lesson of lessons || []) {
  if (!lesson.conceptId) errors.push("lesson: conceptId 누락");
  if (!conceptIds.has(lesson.conceptId)) errors.push(`lesson: 존재하지 않는 conceptId ${lesson.conceptId}`);
  if (lessonIds.has(lesson.conceptId)) errors.push(`중복 lesson conceptId: ${lesson.conceptId}`);
  lessonIds.add(lesson.conceptId);
  for (const key of ["definition", "whyItMatters", "workedExample"]) {
    if (!lesson[key]) errors.push(`${lesson.conceptId}: lesson ${key} 누락`);
  }
  if (!Array.isArray(lesson.steps) || lesson.steps.length === 0) errors.push(`${lesson.conceptId}: lesson steps 누락`);
}
for (const id of conceptIds) {
  if (!lessonIds.has(id)) errors.push(`${id}: lesson이 없습니다.`);
}

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
  if (!problem.choices?.includes(problem.answer)) errors.push(`${problem.id}: answer가 choices 안에 없습니다.`);
  if (!Array.isArray(problem.solutionSteps) || problem.solutionSteps.length === 0) errors.push(`${problem.id}: solutionSteps 누락`);
  for (const conceptId of problem.conceptIds || []) {
    if (!conceptIds.has(conceptId)) errors.push(`${problem.id}: 존재하지 않는 conceptId ${conceptId}`);
    else problemCountByConcept.set(conceptId, problemCountByConcept.get(conceptId) + 1);
  }
}
for (const [conceptId, count] of problemCountByConcept) {
  if (count === 0) errors.push(`${conceptId}: 연결된 문제가 없습니다.`);
}

for (const [conceptId, seed] of Object.entries(learnerSeed || {})) {
  if (!conceptIds.has(conceptId)) errors.push(`learnerSeed: 존재하지 않는 conceptId ${conceptId}`);
  if (!allowedStatuses.has(seed.status)) errors.push(`${conceptId}: learnerSeed status 오류 ${seed.status}`);
  if (!seed.evidence) errors.push(`${conceptId}: learnerSeed evidence 누락`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`검증 성공: 커리큘럼 ${curriculum.length}단계, 개념 ${concepts.length}개, 문제 ${problems.length}개, 초기 학습 근거 ${Object.keys(learnerSeed).length}개`);
