(() => {
  const MODE = 'adaptive';
  const LABEL = { 1: '기초 확인', 2: '표준', 3: '편입 실전', 4: '고난도 실전', 5: '최상위 실전' };
  const concepts = () => window.TRANSFER_MATH_CONCEPTS || [];
  const problems = () => window.TRANSFER_MATH_PROBLEMS || [];
  const conceptById = (id) => concepts().find((item) => item.id === id) || null;
  const poolFor = (id) => problems().filter((problem) => (problem.conceptIds || []).includes(id));

  function targetDifficulty(currentState, conceptId) {
    const record = window.TransferMathMastery.recordFor(currentState, conceptId);
    let target = record.status === 'relearn' ? 1
      : ['partial', 'unseen', 'unassessed'].includes(record.status) ? 2
        : record.status === 'understood' ? 3 : 4;
    if ((record.correctStreak || 0) >= 4) target = Math.max(target, 4);
    else if ((record.correctStreak || 0) >= 2 && window.TransferMathMastery.isLearnedStatus(record.status)) target = Math.max(target, 3);
    const recent = (currentState.answerHistory || []).filter((entry) => entry.conceptId === conceptId).slice(-5);
    if (recent.length >= 3) {
      const accuracy = recent.filter((entry) => entry.correct && !entry.gaveUp).length / recent.length;
      if (accuracy >= 0.85) target += 1;
      else if (accuracy < 0.5) target -= 1;
    }
    if ((record.wrongStreak || 0) >= 1) target -= 1;
    return Math.max(1, Math.min(5, target));
  }

  function firstWeak(currentState) {
    const ranked = concepts().filter((c) => poolFor(c.id).length)
      .filter((c) => ['relearn', 'partial'].includes(window.TransferMathMastery.recordFor(currentState, c.id).status))
      .sort((a, b) => {
        const ar = window.TransferMathMastery.recordFor(currentState, a.id);
        const br = window.TransferMathMastery.recordFor(currentState, b.id);
        return ((br.status === 'relearn' ? 1000 : 700) + (br.wrongStreak || 0) * 100 - b.curriculumOrder / 1000)
          - ((ar.status === 'relearn' ? 1000 : 700) + (ar.wrongStreak || 0) * 100 - a.curriculumOrder / 1000);
      });
    const candidate = ranked[0];
    return candidate ? (window.TransferMathScheduler.firstHardBlocker(currentState, candidate) || candidate) : null;
  }

  function nextProgress(currentState) {
    const ordered = concepts().filter((c) => c.stage !== 'foundation' && poolFor(c.id).length)
      .sort((a, b) => a.curriculumOrder - b.curriculumOrder);
    for (const concept of ordered) {
      if (window.TransferMathMastery.isLearnedStatus(window.TransferMathMastery.recordFor(currentState, concept.id).status)) continue;
      const blocker = window.TransferMathScheduler.firstHardBlocker(currentState, concept);
      return blocker && poolFor(blocker.id).length ? blocker : concept;
    }
    return null;
  }

  function review(currentState) {
    const learned = concepts().filter((c) => poolFor(c.id).length)
      .filter((c) => window.TransferMathMastery.isLearnedStatus(window.TransferMathMastery.recordFor(currentState, c.id).status));
    return learned.sort((a, b) => {
      const ar = window.TransferMathMastery.recordFor(currentState, a.id);
      const br = window.TransferMathMastery.recordFor(currentState, b.id);
      const ad = window.TransferMathMastery.dueNow(currentState, a.id) ? -1 : 0;
      const bd = window.TransferMathMastery.dueNow(currentState, b.id) ? -1 : 0;
      if (ad !== bd) return ad - bd;
      return (ar.lastCheckedAt ? new Date(ar.lastCheckedAt).getTime() : 0) - (br.lastCheckedAt ? new Date(br.lastCheckedAt).getTime() : 0);
    })[0] || null;
  }

  function repeatedCount(session, conceptId) {
    let count = 0;
    for (let i = session.items.length - 1; i >= 0 && session.items[i].conceptId === conceptId; i -= 1) count += 1;
    return count;
  }

  function chooseConcept(currentState, previousConceptId, session) {
    const weak = firstWeak(currentState);
    if (weak) return weak;
    if (previousConceptId && session && repeatedCount(session, previousConceptId) < 2) {
      const record = window.TransferMathMastery.recordFor(currentState, previousConceptId);
      const used = new Set(session.items.map((item) => item.problemId));
      const target = targetDifficulty(currentState, previousConceptId);
      if (window.TransferMathMastery.isLearnedStatus(record.status)
        && poolFor(previousConceptId).some((problem) => !used.has(problem.id) && Number(problem.difficulty || 1) >= target)) {
        return conceptById(previousConceptId);
      }
    }
    return nextProgress(currentState) || review(currentState);
  }

  function chooseProblem(currentState, conceptId, session) {
    const target = targetDifficulty(currentState, conceptId);
    const used = new Set((session?.items || []).map((item) => item.problemId));
    const recent = new Set((currentState.answerHistory || []).slice(-12).map((entry) => entry.problemId));
    let candidates = poolFor(conceptId).filter((problem) => !used.has(problem.id));
    if (!candidates.length) candidates = poolFor(conceptId).filter((problem) => !recent.has(problem.id));
    if (!candidates.length) candidates = poolFor(conceptId).slice();
    return candidates.sort((a, b) => {
      const ad = Number(a.difficulty || 1), bd = Number(b.difficulty || 1);
      const distance = Math.abs(ad - target) - Math.abs(bd - target);
      return distance || (bd - ad) || ((recent.has(a.id) ? 1 : 0) - (recent.has(b.id) ? 1 : 0));
    })[0] || null;
  }

  function makeAdaptiveItem(currentState, previousConceptId = null, session = null) {
    const concept = chooseConcept(currentState, previousConceptId, session);
    if (!concept) return null;
    const problem = chooseProblem(currentState, concept.id, session);
    if (!problem) return null;
    const difficulty = Number(problem.difficulty || 1);
    return { conceptId: concept.id, problemId: problem.id, blockKey: `D${difficulty}`, blockLabel: LABEL[difficulty] || `난도 ${difficulty}` };
  }

  function startAdaptive() {
    if (state.activeSession) { view = freshView('study'); render(); return; }
    const item = makeAdaptiveItem(state);
    if (!item || !window.TransferMathSession.start(state, [item], '편입수학 적응형 연속 학습', MODE)) {
      showToast('현재 상태에 맞는 문제를 만들지 못했습니다.');
      return;
    }
    view = freshView('study'); render();
  }

  function finishAdaptiveSession(currentState) {
    const session = currentState.activeSession;
    if (!session || session.mode !== MODE) return { completed: true, summary: null };
    const total = Math.max(0, Math.min(session.index, session.items.length));
    if (!total) { currentState.activeSession = null; window.TransferMathStorage.save(currentState); return { completed: true, summary: null }; }
    const summary = { id: session.id, label: session.label, mode: session.mode, total, counts: { ...session.counts }, completedAt: new Date().toISOString() };
    currentState.completedSessions.push(summary);
    currentState.completedSessions = currentState.completedSessions.slice(-60);
    currentState.activeSession = null;
    window.TransferMathStorage.save(currentState);
    return { completed: true, summary };
  }

  const originalSubmit = window.TransferMathSession.submitResult;
  window.TransferMathSession.submitResult = function submitAdaptive(currentState, result) {
    const current = window.TransferMathSession.current(currentState);
    if (!current || current.session.mode !== MODE) return originalSubmit(currentState, result);
    const { session, item, problem } = current;
    window.TransferMathMastery.update(currentState, item.conceptId, { ...result, problemId: problem.id });
    if (result.gaveUp) session.counts.gaveUp += 1;
    if (result.correct) session.counts.correct += 1; else session.counts.wrong += 1;
    currentState.answerHistory.push({ sessionId: session.id, conceptId: item.conceptId, problemId: problem.id, blockKey: item.blockKey,
      selectedAnswer: result.selectedAnswer || null, correct: Boolean(result.correct), gaveUp: Boolean(result.gaveUp),
      errorType: result.errorType || null, selfGrade: result.selfGrade, answeredAt: new Date().toISOString() });
    currentState.answerHistory = currentState.answerHistory.slice(-300);
    session.index += 1;
    const next = makeAdaptiveItem(currentState, item.conceptId, session);
    if (next) { session.items.push(next); window.TransferMathStorage.save(currentState); return { completed: false, summary: null }; }
    return finishAdaptiveSession(currentState);
  };

  function finishFromUi() {
    if (!state.activeSession || state.activeSession.mode !== MODE) return;
    if (state.activeSession.pendingResult) {
      const pending = state.activeSession.pendingResult;
      delete state.activeSession.pendingResult;
      window.TransferMathSession.submitResult(state, pending);
    }
    const result = finishAdaptiveSession(state);
    if (result.summary) { view = freshView('summary'); view.summary = result.summary; render(); window.scrollTo({ top: 0, behavior: 'auto' }); }
    else goHome();
  }

  const baseRenderHome = renderHome;
  renderHome = function renderAdaptiveHome() {
    baseRenderHome();
    const primary = app.querySelector('.hero-actions .button');
    if (primary && !state.activeSession) { primary.dataset.action = 'adaptive-start'; primary.textContent = '원하는 만큼 문제 풀기'; }
    const title = app.querySelector('.hero h1');
    if (title && !state.activeSession) title.textContent = '내 이해도에 맞춰 편입수학 실전까지 올리기';
    const text = app.querySelector('.hero p');
    if (text) text.textContent = '세 문제에서 끝나지 않습니다. 사용자가 종료할 때까지 계속 출제하고, 정답률과 개념 숙련도에 따라 난도를 자동으로 조절합니다.';
    for (const h2 of app.querySelectorAll('.section-head h2')) if (h2.textContent.trim() === '오늘의 3블록') h2.textContent = '오늘의 시작 추천';
    const exportButton = app.querySelector('[data-action="export"]');
    if (exportButton) exportButton.textContent = '내보내기';
  };

  const baseRenderStudy = renderStudy;
  renderStudy = function renderAdaptiveStudy() {
    baseRenderStudy();
    const current = window.TransferMathSession.current(state);
    if (!current || current.session.mode !== MODE) return;
    const progress = app.querySelector('.progress-label');
    if (progress) progress.textContent = `적응형 연속 학습 · ${current.session.index + 1}문제째`;
    const next = app.querySelector('[data-math-next]');
    if (next) next.textContent = '다음 문제';
    const row = app.querySelector('.badge-row');
    if (row && !row.querySelector('[data-adaptive-difficulty]')) {
      const difficulty = Number(current.problem.difficulty || 1);
      const badge = document.createElement('span');
      badge.className = difficulty >= 4 ? 'badge warn' : 'badge';
      badge.dataset.adaptiveDifficulty = 'true';
      badge.textContent = `난도 ${difficulty} · ${LABEL[difficulty] || '실전'}`;
      row.appendChild(badge);
    }
    const head = app.querySelector('.study-head');
    if (head && !head.querySelector('[data-adaptive-finish]')) {
      const button = document.createElement('button'); button.className = 'icon-button'; button.dataset.adaptiveFinish = 'true'; button.textContent = '학습 종료'; head.appendChild(button);
    }
  };

  app.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="adaptive-start"]')) { event.preventDefault(); event.stopImmediatePropagation(); startAdaptive(); return; }
    if (event.target.closest('[data-adaptive-finish]')) { event.preventDefault(); event.stopImmediatePropagation(); finishFromUi(); }
  }, true);

  render();
  window.TRANSFER_MATH_ADAPTIVE = Object.freeze({ version: 1, targetDifficulty, makeAdaptiveItem, startAdaptive, finishAdaptiveSession });
})();