"use strict";

(() => {
  const STATUS_LABELS = {
    unseen: "미학습",
    unassessed: "미평가",
    relearn: "재학습 필요",
    partial: "부분 이해",
    understood: "이해 확인",
    stable: "안정",
  };

  const ERROR_LABELS = {
    concept: "개념을 모름",
    reasoning: "논리 연결",
    formula: "공식·조건 기억",
    calculation: "계산 오류",
    interpretation: "조건 해석",
    careless: "단순 실수",
  };

  function recordFor(state, conceptId) {
    return state.mastery[conceptId] || {
      status: "unseen",
      evidence: "",
      errorType: null,
      correctStreak: 0,
      wrongStreak: 0,
      seenCount: 0,
      dueAt: null,
      lastCheckedAt: null,
      history: [],
    };
  }

  function isLearnedStatus(status) {
    return status === "understood" || status === "stable";
  }

  function isPrerequisiteSatisfied(state, conceptId) {
    return isLearnedStatus(recordFor(state, conceptId).status);
  }

  function dueNow(state, conceptId) {
    const dueAt = recordFor(state, conceptId).dueAt;
    return Boolean(dueAt && new Date(dueAt).getTime() <= Date.now());
  }

  function intervalFor(status, correctStreak) {
    if (status === "relearn") return 1;
    if (status === "partial") return 2;
    if (status === "understood") return Math.min(10, 3 + Math.max(0, correctStreak - 1) * 2);
    if (status === "stable") return Math.min(30, 10 + Math.max(0, correctStreak - 3) * 5);
    return 1;
  }

  function evaluateStatus(previous, result) {
    const severeError = ["concept", "reasoning", "formula", "interpretation"].includes(result.errorType);
    const minorError = ["calculation", "careless"].includes(result.errorType);

    if (result.gaveUp || result.selfGrade === "again") return "relearn";

    if (!result.correct) {
      if (minorError && result.selfGrade === "understood" && isLearnedStatus(previous.status)) {
        return previous.status;
      }
      if (severeError && (previous.status === "partial" || previous.status === "relearn" || previous.wrongStreak >= 1)) {
        return "relearn";
      }
      return "partial";
    }

    if (result.selfGrade === "partial") return "partial";
    if (result.selfGrade === "understood") {
      const nextStreak = (previous.correctStreak || 0) + 1;
      return nextStreak >= 3 ? "stable" : "understood";
    }
    return previous.status === "unseen" ? "unassessed" : previous.status;
  }

  function update(state, conceptId, result) {
    const previous = recordFor(state, conceptId);
    const now = new Date().toISOString();
    const status = evaluateStatus(previous, result);
    const correctStreak = result.correct ? (previous.correctStreak || 0) + 1 : 0;
    const wrongStreak = result.correct ? 0 : (previous.wrongStreak || 0) + 1;
    const intervalDays = intervalFor(status, correctStreak);
    const historyEntry = {
      checkedAt: now,
      problemId: result.problemId,
      correct: Boolean(result.correct),
      gaveUp: Boolean(result.gaveUp),
      selfGrade: result.selfGrade,
      errorType: result.errorType || null,
      statusAfter: status,
    };

    state.mastery[conceptId] = {
      ...previous,
      status,
      errorType: result.errorType || null,
      correctStreak,
      wrongStreak,
      seenCount: (previous.seenCount || 0) + 1,
      dueAt: window.TransferMathStorage.addDaysIso(intervalDays),
      lastCheckedAt: now,
      history: [...(previous.history || []).slice(-29), historyEntry],
    };

    return state.mastery[conceptId];
  }

  function stats(state, concepts) {
    const records = concepts.map((concept) => recordFor(state, concept.id));
    return {
      learned: records.filter((record) => isLearnedStatus(record.status)).length,
      weak: records.filter((record) => record.status === "relearn" || record.status === "partial").length,
      due: concepts.filter((concept) => dueNow(state, concept.id)).length,
    };
  }

  window.TransferMathMastery = {
    STATUS_LABELS,
    ERROR_LABELS,
    recordFor,
    isLearnedStatus,
    isPrerequisiteSatisfied,
    dueNow,
    update,
    stats,
  };
})();
