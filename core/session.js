"use strict";

(() => {
  function problemMap() {
    return new Map((window.TRANSFER_MATH_PROBLEMS || []).map((problem) => [problem.id, problem]));
  }

  function conceptMap() {
    return new Map((window.TRANSFER_MATH_CONCEPTS || []).map((concept) => [concept.id, concept]));
  }

  function start(state, items, label, mode) {
    const problems = problemMap();
    const concepts = conceptMap();
    const validItems = items.filter((item) => problems.has(item.problemId) && concepts.has(item.conceptId));
    if (!validItems.length) return null;

    state.activeSession = {
      id: `session-${Date.now()}`,
      label,
      mode,
      items: validItems,
      index: 0,
      counts: { correct: 0, wrong: 0, gaveUp: 0 },
      startedAt: new Date().toISOString(),
    };
    window.TransferMathStorage.save(state);
    return state.activeSession;
  }

  function startDaily(state, plan) {
    return start(
      state,
      plan.blocks.map((block) => ({
        conceptId: block.conceptId,
        problemId: block.problemId,
        blockKey: block.key,
        blockLabel: block.label,
      })),
      "오늘의 3블록",
      "daily"
    );
  }

  function startConcept(state, conceptId) {
    const problems = window.TransferMathScheduler.conceptProblems(conceptId);
    const items = problems.map((problem) => ({ conceptId, problemId: problem.id, blockKey: "C", blockLabel: "개념 집중" }));
    return start(state, items, "개념 집중 학습", "concept");
  }

  function current(state) {
    const session = state.activeSession;
    if (!session) return null;
    const item = session.items[session.index];
    if (!item) return null;
    return {
      session,
      item,
      problem: problemMap().get(item.problemId),
      concept: conceptMap().get(item.conceptId),
    };
  }

  function submitResult(state, result) {
    const currentItem = current(state);
    if (!currentItem) return { completed: true, summary: null };

    const { session, item, problem } = currentItem;
    const masteryResult = {
      ...result,
      problemId: problem.id,
    };
    window.TransferMathMastery.update(state, item.conceptId, masteryResult);

    if (result.gaveUp) session.counts.gaveUp += 1;
    if (result.correct) session.counts.correct += 1;
    else session.counts.wrong += 1;

    state.answerHistory.push({
      sessionId: session.id,
      conceptId: item.conceptId,
      problemId: problem.id,
      blockKey: item.blockKey,
      selectedAnswer: result.selectedAnswer || null,
      correct: Boolean(result.correct),
      gaveUp: Boolean(result.gaveUp),
      errorType: result.errorType || null,
      selfGrade: result.selfGrade,
      answeredAt: new Date().toISOString(),
    });
    state.answerHistory = state.answerHistory.slice(-300);

    session.index += 1;
    if (session.index >= session.items.length) {
      const summary = {
        id: session.id,
        label: session.label,
        mode: session.mode,
        total: session.items.length,
        counts: { ...session.counts },
        completedAt: new Date().toISOString(),
      };
      state.completedSessions.push(summary);
      state.completedSessions = state.completedSessions.slice(-60);
      state.activeSession = null;
      window.TransferMathStorage.save(state);
      return { completed: true, summary };
    }

    window.TransferMathStorage.save(state);
    return { completed: false, summary: null };
  }

  function quit(state) {
    state.activeSession = null;
    window.TransferMathStorage.save(state);
  }

  window.TransferMathSession = {
    start,
    startDaily,
    startConcept,
    current,
    submitResult,
    quit,
  };
})();
