"use strict";

(() => {
  function hash(text) {
    let value = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      value ^= text.charCodeAt(i);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function conceptMap() {
    return new Map((window.TRANSFER_MATH_CONCEPTS || []).map((concept) => [concept.id, concept]));
  }

  function problemsByConcept() {
    const map = new Map();
    for (const problem of window.TRANSFER_MATH_PROBLEMS || []) {
      for (const conceptId of problem.conceptIds || []) {
        if (!map.has(conceptId)) map.set(conceptId, []);
        map.get(conceptId).push(problem);
      }
    }
    return map;
  }

  function isHardBlocker(state, conceptId) {
    const status = window.TransferMathMastery.recordFor(state, conceptId).status;
    return status === "unseen" || status === "unassessed" || status === "relearn";
  }

  function firstHardBlocker(state, concept) {
    const concepts = conceptMap();
    for (const prerequisiteId of concept.prerequisites || []) {
      const prerequisite = concepts.get(prerequisiteId);
      if (!prerequisite) continue;
      const nested = firstHardBlocker(state, prerequisite);
      if (nested) return nested;
      if (isHardBlocker(state, prerequisiteId)) return prerequisite;
    }
    return null;
  }

  function weakRank(state, concept) {
    const record = window.TransferMathMastery.recordFor(state, concept.id);
    let score = 0;
    if (record.status === "relearn") score += 1000;
    if (record.status === "partial") score += 650;
    score += Math.min(200, (record.wrongStreak || 0) * 80);
    score -= concept.curriculumOrder / 1000;
    return score;
  }

  function pickWeakConcept(state) {
    const concepts = (window.TRANSFER_MATH_CONCEPTS || [])
      .filter((concept) => {
        const status = window.TransferMathMastery.recordFor(state, concept.id).status;
        return status === "relearn" || status === "partial";
      })
      .sort((a, b) => weakRank(state, b) - weakRank(state, a));

    const candidate = concepts[0] || null;
    if (!candidate) return null;
    return firstHardBlocker(state, candidate) || candidate;
  }

  function pickProgressConcept(state, excluded = new Set()) {
    const concepts = (window.TRANSFER_MATH_CONCEPTS || [])
      .filter((concept) => concept.stage !== "foundation")
      .sort((a, b) => a.curriculumOrder - b.curriculumOrder);

    for (const concept of concepts) {
      if (excluded.has(concept.id)) continue;
      const record = window.TransferMathMastery.recordFor(state, concept.id);
      if (record.status === "stable" || record.status === "understood") continue;
      const blocker = firstHardBlocker(state, concept);
      if (blocker && !excluded.has(blocker.id)) return blocker;
      if (!blocker) return concept;
    }
    return null;
  }

  function pickReviewConcept(state, excluded = new Set()) {
    const learned = (window.TRANSFER_MATH_CONCEPTS || [])
      .filter((concept) => !excluded.has(concept.id))
      .filter((concept) => window.TransferMathMastery.isLearnedStatus(window.TransferMathMastery.recordFor(state, concept.id).status));

    const due = learned
      .filter((concept) => window.TransferMathMastery.dueNow(state, concept.id))
      .sort((a, b) => new Date(window.TransferMathMastery.recordFor(state, a.id).dueAt).getTime() - new Date(window.TransferMathMastery.recordFor(state, b.id).dueAt).getTime());
    if (due.length) return due[0];

    return learned.sort((a, b) => {
      const aTime = window.TransferMathMastery.recordFor(state, a.id).lastCheckedAt ? new Date(window.TransferMathMastery.recordFor(state, a.id).lastCheckedAt).getTime() : 0;
      const bTime = window.TransferMathMastery.recordFor(state, b.id).lastCheckedAt ? new Date(window.TransferMathMastery.recordFor(state, b.id).lastCheckedAt).getTime() : 0;
      return aTime - bTime;
    })[0] || null;
  }

  function chooseProblem(conceptId, dayKey, blockKey) {
    const map = problemsByConcept();
    const problems = map.get(conceptId) || [];
    if (!problems.length) return null;
    const index = hash(`${dayKey}:${blockKey}:${conceptId}`) % problems.length;
    return problems[index];
  }

  function makeBlock(key, label, concept, problem, reason) {
    if (!concept || !problem) return null;
    return {
      key,
      label,
      conceptId: concept.id,
      problemId: problem.id,
      reason,
    };
  }

  function planIsValid(plan) {
    if (!plan?.blocks?.length) return false;
    const concepts = conceptMap();
    const problems = new Set((window.TRANSFER_MATH_PROBLEMS || []).map((problem) => problem.id));
    return plan.blocks.every((block) => concepts.has(block.conceptId) && problems.has(block.problemId));
  }

  function getDailyPlan(state) {
    const dayKey = window.TransferMathStorage.seoulDateKey();
    const saved = state.dailyPlans[dayKey];
    if (planIsValid(saved)) return saved;

    const blocks = [];
    const used = new Set();

    const weak = pickWeakConcept(state);
    if (weak) {
      const problem = chooseProblem(weak.id, dayKey, "A");
      const block = makeBlock("A", "약점 복구", weak, problem, "재학습 필요 또는 부분 이해 개념을 우선합니다.");
      if (block) { blocks.push(block); used.add(weak.id); }
    }

    const progress = pickProgressConcept(state, used);
    if (progress) {
      const problem = chooseProblem(progress.id, dayKey, "B");
      const block = makeBlock("B", "새 진도", progress, problem, "현재 커리큘럼에서 선행 조건을 고려한 다음 학습입니다.");
      if (block) { blocks.push(block); used.add(progress.id); }
    }

    const review = pickReviewConcept(state, used);
    if (review) {
      const problem = chooseProblem(review.id, dayKey, "C");
      const block = makeBlock("C", "간격 복습", review, problem, "이전에 이해한 개념을 독립 문제로 다시 확인합니다.");
      if (block) { blocks.push(block); used.add(review.id); }
    }

    if (blocks.length < 3) {
      const fallback = (window.TRANSFER_MATH_CONCEPTS || [])
        .filter((concept) => !used.has(concept.id))
        .sort((a, b) => a.curriculumOrder - b.curriculumOrder);
      for (const concept of fallback) {
        if (blocks.length >= 3) break;
        const problem = chooseProblem(concept.id, dayKey, `F${blocks.length}`);
        if (!problem) continue;
        blocks.push(makeBlock(String.fromCharCode(65 + blocks.length), "진단", concept, problem, "아직 충분한 학습 근거가 없어 진단합니다."));
        used.add(concept.id);
      }
    }

    const plan = { dayKey, blocks: blocks.filter(Boolean), createdAt: new Date().toISOString() };
    state.dailyPlans[dayKey] = plan;
    window.TransferMathStorage.save(state);
    return plan;
  }

  function conceptProblems(conceptId) {
    return problemsByConcept().get(conceptId) || [];
  }

  window.TransferMathScheduler = {
    getDailyPlan,
    conceptProblems,
    firstHardBlocker,
  };
})();
