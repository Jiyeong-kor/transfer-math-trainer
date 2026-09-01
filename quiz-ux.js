(() => {
  function currentBundle() {
    return window.TransferMathSession.current(state);
  }

  function defaultSelfGrade(correct, gaveUp) {
    if (gaveUp) return 'again';
    return correct ? 'understood' : 'partial';
  }

  function positionQuestionAtReadingStart() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const card = app.querySelector('.study-card');
        if (!card) return;
        const head = app.querySelector('.study-head');
        const headBottom = head?.getBoundingClientRect().bottom || 0;
        const cardTop = card.getBoundingClientRect().top;
        const targetTop = window.scrollY + cardTop - headBottom - 8;
        window.scrollTo({ top: Math.max(0, Math.round(targetTop)), behavior: 'auto' });
      });
    });
  }

  function positionNextActionForTap() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const nextButton = app.querySelector('[data-math-next]');
        if (!nextButton) return;

        const head = app.querySelector('.study-head');
        const viewportTop = (head?.getBoundingClientRect().bottom || 0) + 10;
        const viewportBottom = window.innerHeight - 12;
        const buttonRect = nextButton.getBoundingClientRect();

        if (buttonRect.top >= viewportTop && buttonRect.bottom <= viewportBottom) return;

        const delta = buttonRect.bottom > viewportBottom
          ? buttonRect.bottom - viewportBottom
          : buttonRect.top - viewportTop;
        window.scrollBy({ top: Math.round(delta), behavior: 'auto' });
      });
    });
  }

  function savePendingResult(pending) {
    const current = currentBundle();
    if (!current) return;
    current.session.pendingResult = pending;
    window.TransferMathStorage.save(state);
  }

  function chooseImmediately(value) {
    const current = currentBundle();
    if (!current || current.session.pendingResult) return;
    const correct = value === current.problem.answer;
    savePendingResult({
      selectedAnswer: value,
      correct,
      gaveUp: false,
      errorType: correct ? null : 'reasoning',
      selfGrade: defaultSelfGrade(correct, false),
    });
    render();
    positionNextActionForTap();
  }

  function giveUpImmediately() {
    const current = currentBundle();
    if (!current || current.session.pendingResult) return;
    savePendingResult({
      selectedAnswer: null,
      correct: false,
      gaveUp: true,
      errorType: 'concept',
      selfGrade: 'again',
    });
    render();
    positionNextActionForTap();
  }

  function updatePending(field, value) {
    const current = currentBundle();
    const pending = current?.session.pendingResult;
    if (!pending) return;
    pending[field] = value;
    window.TransferMathStorage.save(state);
    render();
    positionNextActionForTap();
  }

  function advanceFromPending() {
    const current = currentBundle();
    const pending = current?.session.pendingResult;
    if (!current || !pending) return;

    delete current.session.pendingResult;
    const result = window.TransferMathSession.submitResult(state, pending);

    if (result.completed) {
      view = freshView('summary');
      view.summary = result.summary;
      render();
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    view = freshView('study');
    render();
    positionQuestionAtReadingStart();
  }

  function saveAndGoHome() {
    if (state.activeSession) window.TransferMathStorage.save(state);
    goHome();
    showToast('진행 위치를 저장했습니다.');
  }

  const originalRenderHome = renderHome;
  renderHome = function renderHomeWithFastQuizCopy() {
    originalRenderHome();
    const heroText = app.querySelector('.hero p');
    if (heroText) {
      heroText.textContent = '선지를 누르는 즉시 채점합니다. 모르면 모르겠음으로 기록하고, 오답과 선행 개념을 우선해서 다시 학습합니다.';
    }
  };

  renderStudy = function renderStudyWithInstantGrading() {
    const current = currentBundle();
    if (!current) {
      goHome();
      return;
    }

    const { session, item, problem, concept } = current;
    const lesson = LESSON_MAP.get(concept.id);
    const record = window.TransferMathMastery.recordFor(state, concept.id);
    const pending = session.pendingResult || null;
    const selectedAnswer = pending?.selectedAnswer ?? null;

    const choices = (problem.choices || []).map((choice) => {
      let className = 'choice';
      if (selectedAnswer === choice) className += ' selected';
      if (pending && choice === problem.answer) className += ' correct';
      if (pending && selectedAnswer === choice && choice !== problem.answer) className += ' wrong';
      return `<button class="${className}" data-math-choice="${esc(choice)}" ${pending ? 'disabled' : ''}>${esc(choice)}</button>`;
    }).join('');

    let resultPanel = '';
    if (pending) {
      const errorTypes = Object.entries(window.TransferMathMastery.ERROR_LABELS)
        .map(([key, label]) => `<button class="error-type ${pending.errorType === key ? 'active' : ''}" data-math-error="${esc(key)}">${esc(label)}</button>`)
        .join('');
      const selfGradeLabel = pending.selfGrade === 'again' ? '모르겠음' : pending.selfGrade === 'partial' ? '부분 이해' : '이해함';

      resultPanel = `
        <section class="answer-panel math-result-panel">
          <h3>${pending.gaveUp ? '모르겠음으로 기록합니다' : pending.correct ? '정답입니다' : '오답입니다'}</h3>
          <div class="answer-main">${esc(problem.answer)}</div>
          <ol class="steps">${(problem.solutionSteps || []).map((step) => `<li>${esc(step)}</li>`).join('')}</ol>
          ${lesson ? `<div class="explain-card"><strong>이 단계의 핵심</strong><br>${esc(lesson.whyItMatters)}<br><br>${esc(lesson.workedExample)}</div>` : ''}
          ${!pending.correct ? `<div class="optional-review"><strong>오답 원인 선택 사항</strong><div class="error-types">${errorTypes}</div></div>` : ''}
          <div class="optional-review">
            <strong>이해 상태 선택 사항</strong>
            <span>현재 기본값: ${esc(selfGradeLabel)}</span>
            <div class="grades">
              <button class="grade again ${pending.selfGrade === 'again' ? 'active-grade' : ''}" data-math-grade="again">모르겠음</button>
              <button class="grade hard ${pending.selfGrade === 'partial' ? 'active-grade' : ''}" data-math-grade="partial">부분 이해</button>
              <button class="grade good ${pending.selfGrade === 'understood' ? 'active-grade' : ''}" data-math-grade="understood">이해함</button>
            </div>
          </div>
          <button class="button brand full-button math-next-button" data-math-next>${session.index + 1 >= session.items.length ? '결과 보기' : '다음 문제'}</button>
        </section>`;
    }

    app.innerHTML = `
      <main class="shell">
        <div class="study-head">
          <button class="icon-button" data-math-save-home>저장하고 나가기</button>
          <div class="progress-label">${esc(session.label)} · ${session.index + 1}/${session.items.length}</div>
          <span class="status-pill ${esc(record.status)}">${esc(statusLabel(record.status))}</span>
        </div>
        <section class="study-card">
          <div class="badge-row">
            <span class="badge">${esc(item.blockLabel || '학습')}</span>
            <span class="badge">${esc(concept.subject)}</span>
            <span class="badge warn">${esc(concept.unit)}</span>
          </div>
          <div class="prompt">
            <div class="term">${esc(concept.title)}</div>
            <div class="question">${esc(problem.prompt)}</div>
            ${problem.math ? `<div class="math-box">${esc(problem.math)}</div>` : ''}
          </div>
          <div class="choices">${choices}</div>
          ${pending ? '' : `<button class="button ghost full-button math-unknown-button" data-math-unknown>모르겠음</button>`}
          ${resultPanel}
        </section>
      </main>`;
  };

  const wrapStart = (fn) => function startAndPosition(...args) {
    const result = fn(...args);
    if (view.name === 'study' && state.activeSession) positionQuestionAtReadingStart();
    return result;
  };

  startDaily = wrapStart(startDaily);
  refreshDaily = wrapStart(refreshDaily);
  startConcept = wrapStart(startConcept);
  startEpsilonFocus = wrapStart(startEpsilonFocus);

  app.addEventListener('click', (event) => {
    const choice = event.target.closest('[data-math-choice]');
    if (choice && !choice.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
      chooseImmediately(choice.dataset.mathChoice);
      return;
    }

    if (event.target.closest('[data-math-unknown]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      giveUpImmediately();
      return;
    }

    if (event.target.closest('[data-math-next]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      advanceFromPending();
      return;
    }

    const error = event.target.closest('[data-math-error]');
    if (error) {
      event.preventDefault();
      event.stopImmediatePropagation();
      updatePending('errorType', error.dataset.mathError);
      return;
    }

    const grade = event.target.closest('[data-math-grade]');
    if (grade) {
      event.preventDefault();
      event.stopImmediatePropagation();
      updatePending('selfGrade', grade.dataset.mathGrade);
      return;
    }

    if (event.target.closest('[data-math-save-home]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      saveAndGoHome();
      return;
    }

    const resume = event.target.closest('[data-action="resume"]');
    if (resume) {
      event.preventDefault();
      event.stopImmediatePropagation();
      view = freshView('study');
      render();
      positionQuestionAtReadingStart();
    }
  }, true);

  render();

  window.TRANSFER_MATH_QUIZ_UX = Object.freeze({
    version: 1,
    positionQuestionAtReadingStart,
    positionNextActionForTap,
  });
})();