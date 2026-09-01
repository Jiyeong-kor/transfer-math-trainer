"use strict";

const CURRICULUM = Array.isArray(window.TRANSFER_MATH_CURRICULUM) ? window.TRANSFER_MATH_CURRICULUM : [];
const CONCEPTS = Array.isArray(window.TRANSFER_MATH_CONCEPTS) ? window.TRANSFER_MATH_CONCEPTS : [];
const LESSONS = Array.isArray(window.TRANSFER_MATH_LESSONS) ? window.TRANSFER_MATH_LESSONS : [];
const PROBLEMS = Array.isArray(window.TRANSFER_MATH_PROBLEMS) ? window.TRANSFER_MATH_PROBLEMS : [];
const CONCEPT_MAP = new Map(CONCEPTS.map((item) => [item.id, item]));
const LESSON_MAP = new Map(LESSONS.map((item) => [item.conceptId, item]));
const app = document.getElementById("app");
const toast = document.getElementById("toast");
const importInput = document.getElementById("backup-import");

let state = window.TransferMathStorage.load();
let toastTimer = null;
let view = freshView();

function freshView(name = "home") {
  return { name, filter: "all", selectedAnswer: null, reveal: false, gaveUp: false, correct: false, errorType: null, summary: null };
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1900);
}

function statusLabel(status) {
  return window.TransferMathMastery.STATUS_LABELS[status] || status;
}

function stageTitle(stageId) {
  return CURRICULUM.find((stage) => stage.id === stageId)?.title || stageId;
}

function todayKey() {
  return window.TransferMathStorage.seoulDateKey();
}

function answeredToday(problemId) {
  return state.answerHistory.some((entry) => entry.problemId === problemId && window.TransferMathStorage.seoulDateKey(new Date(entry.answeredAt)) === todayKey());
}

function planDone(plan) {
  return Boolean(plan.blocks.length && plan.blocks.every((block) => answeredToday(block.problemId)));
}

function stageStats(stageId) {
  const concepts = CONCEPTS.filter((concept) => concept.stage === stageId);
  const learned = concepts.filter((concept) => window.TransferMathMastery.isLearnedStatus(window.TransferMathMastery.recordFor(state, concept.id).status)).length;
  const weak = concepts.filter((concept) => ["relearn", "partial"].includes(window.TransferMathMastery.recordFor(state, concept.id).status)).length;
  return { total: concepts.length, learned, weak, pct: concepts.length ? Math.round((learned / concepts.length) * 100) : 0 };
}

function renderTopbar(subtitle = "Notion 학습 소스 기반") {
  return `<header class="topbar"><div class="brand"><strong>편입수학 트레이너</strong><span>${esc(subtitle)}</span></div><button class="icon-button" data-action="browse">개념 현황</button></header>`;
}

function renderStageCards() {
  return CURRICULUM.filter((stage) => stage.id !== "school-practice").map((stage) => {
    const stats = stageStats(stage.id);
    return `<button class="stage-card" data-action="filter-stage" data-value="${esc(stage.id)}">
      <div class="stage-card-head"><strong>${esc(stage.title)}</strong><span>${stats.learned}/${stats.total}</span></div>
      <div class="mini-progress"><div style="width:${stats.pct}%"></div></div>
      <small>${stats.weak ? `약점 ${stats.weak}개` : stats.learned === stats.total && stats.total ? "현재 범위 안정" : "진단·학습 대기"}</small>
    </button>`;
  }).join("");
}

function renderHome() {
  const stats = window.TransferMathMastery.stats(state, CONCEPTS);
  const plan = window.TransferMathScheduler.getDailyPlan(state);
  const completed = planDone(plan);
  const studiedToday = state.answerHistory.filter((entry) => window.TransferMathStorage.seoulDateKey(new Date(entry.answeredAt)) === todayKey()).length;
  const primaryAction = state.activeSession ? "resume" : completed ? "refresh-daily" : "daily";
  const primaryLabel = state.activeSession ? "이어서 공부" : completed ? "추가 3블록 만들기" : "오늘의 3블록 시작";

  const planHtml = plan.blocks.map((block) => {
    const concept = CONCEPT_MAP.get(block.conceptId);
    const record = window.TransferMathMastery.recordFor(state, block.conceptId);
    const done = answeredToday(block.problemId);
    return `<div class="plan-item ${done ? "done" : ""}">
      <div class="plan-key">${done ? "✓" : esc(block.key)}</div>
      <div><strong>${esc(block.label)} · ${esc(concept?.title)}</strong><span>${esc(concept?.subject)} · ${esc(block.reason)}</span></div>
      <span class="status-pill ${esc(record.status)}">${esc(statusLabel(record.status))}</span>
    </div>`;
  }).join("");

  app.innerHTML = `<main class="shell">
    ${renderTopbar()}
    <section class="hero"><small>${completed ? "오늘의 기본 학습 완료" : "오늘의 우선순위"}</small><h1>${completed ? "현재 상태로 다음 3블록을 계산할 수 있습니다" : "막힌 단계부터 다시 연결하기"}</h1><p>정오답, 오답 원인, 자기 평가를 함께 기록합니다. 선행 개념이 부분 이해 상태라면 다음 개념으로 넘어가기 전에 먼저 복구합니다.</p><div class="hero-actions"><button class="button primary" data-action="${primaryAction}">${primaryLabel}</button></div></section>
    <section class="stats" aria-label="학습 현황"><div class="stat"><strong>${stats.learned}</strong><span>이해 확인 이상</span></div><div class="stat"><strong>${stats.weak}</strong><span>약점 개념</span></div><div class="stat"><strong>${studiedToday}</strong><span>오늘 풀이</span></div></section>
    <section class="section"><div class="section-head"><h2>오늘의 3블록</h2><span>${esc(plan.dayKey)}${plan.revision ? ` · 추가 ${plan.revision}회` : ""}</span></div><div class="plan-list">${planHtml || '<div class="empty">오늘 구성할 학습 항목이 없습니다.</div>'}</div></section>
    <section class="section"><div class="section-head"><h2>과목별 진행률</h2><span>개념 숙련 기준</span></div><div class="stage-grid">${renderStageCards()}</div></section>
    <section class="section"><div class="section-head"><h2>빠른 학습</h2></div><div class="grid">
      <button class="action-card" data-action="focus-epsilon"><strong>ε-δ 집중 복구</strong><span>현재 확인된 핵심 병목인 상한 만들기와 min 조건 결합을 다시 확인합니다.</span><em>집중 학습</em></button>
      <button class="action-card" data-action="browse-weak"><strong>약점 개념 보기</strong><span>재학습 필요와 부분 이해 상태를 모아서 확인합니다.</span><em>${stats.weak}개</em></button>
    </div></section>
    <section class="section"><div class="section-head"><h2>데이터 관리</h2></div><div class="footer-tools"><button class="button ghost" data-action="export">JSON 백업</button><button class="button ghost" data-action="import">복원</button><button class="button danger" data-action="reset">초기화</button></div>${state.activeSession ? '<button class="button danger full-button" data-action="quit-session">진행 중 세션 종료</button>' : ""}</section>
  </main>`;
}

function renderStudy() {
  const current = window.TransferMathSession.current(state);
  if (!current) { goHome(); return; }
  const { session, item, problem, concept } = current;
  const lesson = LESSON_MAP.get(concept.id);
  const record = window.TransferMathMastery.recordFor(state, concept.id);
  const choices = (problem.choices || []).map((choice) => {
    let className = "choice";
    if (view.selectedAnswer === choice) className += " selected";
    if (view.reveal && choice === problem.answer) className += " correct";
    if (view.reveal && view.selectedAnswer === choice && choice !== problem.answer) className += " wrong";
    return `<button class="${className}" data-action="choose" data-value="${esc(choice)}" ${view.reveal ? "disabled" : ""}>${esc(choice)}</button>`;
  }).join("");
  const errorTypes = Object.entries(window.TransferMathMastery.ERROR_LABELS).map(([key, label]) => `<button class="error-type ${view.errorType === key ? "active" : ""}" data-action="error-type" data-value="${key}">${esc(label)}</button>`).join("");
  const answerPanel = view.reveal ? `<section class="answer-panel"><h3>${view.correct ? "정답입니다" : view.gaveUp ? "해설을 확인합니다" : "오답입니다"}</h3><div class="answer-main">${esc(problem.answer)}</div><ol class="steps">${(problem.solutionSteps || []).map((step) => `<li>${esc(step)}</li>`).join("")}</ol>${lesson ? `<div class="explain-card"><strong>이 단계의 핵심</strong><br>${esc(lesson.whyItMatters)}<br><br>${esc(lesson.workedExample)}</div>` : ""}${!view.correct ? `<div class="detail"><strong>어디에서 막혔나요?</strong></div><div class="error-types">${errorTypes}</div>` : ""}<div class="detail"><strong>지금 이해 상태를 직접 평가해 주세요.</strong></div><div class="grades"><button class="grade again" data-action="grade" data-value="again">모르겠음</button><button class="grade hard" data-action="grade" data-value="partial">부분 이해</button><button class="grade good" data-action="grade" data-value="understood">이해함</button></div></section>` : "";

  app.innerHTML = `<main class="shell"><div class="study-head"><button class="icon-button" data-action="home">홈</button><div class="progress-label">${esc(session.label)} · ${session.index + 1}/${session.items.length}</div><span class="status-pill ${esc(record.status)}">${esc(statusLabel(record.status))}</span></div><section class="study-card"><div class="badge-row"><span class="badge">${esc(item.blockLabel || "학습")}</span><span class="badge">${esc(concept.subject)}</span><span class="badge warn">${esc(concept.unit)}</span></div><div class="prompt"><div class="term">${esc(concept.title)}</div><div class="question">${esc(problem.prompt)}</div>${problem.math ? `<div class="math-box">${esc(problem.math)}</div>` : ""}</div><div class="choices">${choices}</div>${!view.reveal ? `<div class="study-actions"><button class="button ghost" data-action="give-up">모르겠음</button><button class="button brand" data-action="check" ${view.selectedAnswer ? "" : "disabled"}>정답 확인</button></div>` : ""}${answerPanel}</section></main>`;
}

function filteredConcepts() {
  if (view.filter === "weak") return CONCEPTS.filter((concept) => ["relearn", "partial"].includes(window.TransferMathMastery.recordFor(state, concept.id).status));
  if (CURRICULUM.some((stage) => stage.id === view.filter)) return CONCEPTS.filter((concept) => concept.stage === view.filter);
  return CONCEPTS;
}

function renderBrowse() {
  const filters = [["all", "전체"], ["weak", "약점"], ...CURRICULUM.filter((stage) => stage.id !== "school-practice").map((stage) => [stage.id, stage.title])];
  const list = filteredConcepts().sort((a, b) => a.curriculumOrder - b.curriculumOrder);
  app.innerHTML = `<main class="shell">${renderTopbar("개념별 이해도")}<section class="section"><div class="section-head"><h2>개념 현황</h2><span>${list.length}개</span></div><div class="filters">${filters.map(([key, label]) => `<button class="filter ${view.filter === key ? "active" : ""}" data-action="filter" data-value="${esc(key)}">${esc(label)}</button>`).join("")}</div></section><section class="section"><div class="list">${list.map((concept) => {
    const record = window.TransferMathMastery.recordFor(state, concept.id);
    const blockers = (concept.prerequisites || []).filter((id) => !window.TransferMathMastery.isPrerequisiteSatisfied(state, id)).length;
    return `<button class="list-item" data-action="concept" data-value="${esc(concept.id)}"><strong>${esc(concept.title)} · ${esc(statusLabel(record.status))}</strong><span>${esc(stageTitle(concept.stage))} · ${esc(concept.unit)}${blockers ? ` · 선행 확인 ${blockers}개` : ""}${record.evidence ? ` · ${esc(record.evidence)}` : ""}</span></button>`;
  }).join("") || '<div class="empty">해당 조건의 개념이 없습니다.</div>'}</div></section><div class="footer-tools"><button class="button ghost" data-action="home">홈으로</button></div></main>`;
}

function renderSummary() {
  const summary = view.summary;
  if (!summary) { goHome(); return; }
  app.innerHTML = `<main class="shell"><section class="summary"><small>학습 완료</small><h1>${esc(summary.label)}</h1><p>정오답과 자기 평가를 개념별 숙련도에 반영했습니다. 단순 실수 한 번으로 이미 안정된 개념을 자동 강등하지 않습니다.</p><div class="summary-grid"><div><strong>${summary.counts.correct}</strong><span>정답</span></div><div><strong>${summary.counts.wrong}</strong><span>오답</span></div><div><strong>${summary.counts.gaveUp}</strong><span>모르겠음</span></div></div><button class="button brand" data-action="home">학습 현황 보기</button></section></main>`;
}

function resetStudyView() { view.selectedAnswer = null; view.reveal = false; view.gaveUp = false; view.correct = false; view.errorType = null; }

function startDaily() {
  const plan = window.TransferMathScheduler.getDailyPlan(state);
  if (!window.TransferMathSession.startDaily(state, plan)) { showToast("오늘 학습할 문제를 만들지 못했습니다."); return; }
  view = freshView("study"); render();
}

function refreshDaily() {
  if (state.activeSession) { showToast("진행 중인 학습을 먼저 마쳐 주세요."); return; }
  const plan = window.TransferMathScheduler.refreshDailyPlan(state);
  if (!window.TransferMathSession.startDaily(state, plan)) { showToast("추가 학습을 만들지 못했습니다."); return; }
  view = freshView("study"); render();
}

function startConcept(conceptId) {
  if (state.activeSession) { showToast("진행 중인 학습을 먼저 이어서 하거나 종료해 주세요."); return; }
  if (!window.TransferMathSession.startConcept(state, conceptId)) { showToast("이 개념에 연결된 문제가 없습니다."); return; }
  view = freshView("study"); render();
}

function startEpsilonFocus() {
  if (state.activeSession) { showToast("진행 중인 학습을 먼저 이어서 하거나 종료해 주세요."); return; }
  const ids = ["MATH-DIFF-LIMIT-004", "MATH-DIFF-LIMIT-005", "MATH-DIFF-LIMIT-006"];
  const items = ids.flatMap((conceptId) => {
    const problem = window.TransferMathScheduler.conceptProblems(conceptId)[0];
    return problem ? [{ conceptId, problemId: problem.id, blockKey: "E", blockLabel: "ε-δ 집중" }] : [];
  });
  if (!window.TransferMathSession.start(state, items, "ε-δ 집중 복구", "epsilon")) return;
  view = freshView("study"); render();
}

function checkAnswer() {
  const current = window.TransferMathSession.current(state);
  if (!current || !view.selectedAnswer) return;
  view.correct = view.selectedAnswer === current.problem.answer; view.reveal = true; view.gaveUp = false; render();
}

function giveUp() { view.gaveUp = true; view.correct = false; view.reveal = true; view.errorType = "concept"; render(); }

function gradeCurrent(selfGrade) {
  const current = window.TransferMathSession.current(state);
  if (!current || !view.reveal) return;
  const result = window.TransferMathSession.submitResult(state, { selectedAnswer: view.selectedAnswer, correct: view.correct, gaveUp: view.gaveUp, errorType: view.correct ? null : (view.errorType || (view.gaveUp ? "concept" : "reasoning")), selfGrade });
  if (result.completed) { view = freshView("summary"); view.summary = result.summary; } else resetStudyView();
  render(); window.scrollTo({ top: 0, behavior: "auto" });
}

function goHome() { view = freshView("home"); render(); window.scrollTo({ top: 0, behavior: "auto" }); }
function openBrowse(filter = "all") { view = freshView("browse"); view.filter = filter; render(); }

function exportBackup() {
  const blob = new Blob([window.TransferMathStorage.exportJson(state)], { type: "application/json" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `transfer-math-trainer-${todayKey()}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => { try { state = window.TransferMathStorage.importJson(String(reader.result)); window.TransferMathStorage.save(state); showToast("학습 기록을 복원했습니다."); goHome(); } catch (error) { console.error(error); showToast("백업 파일을 읽지 못했습니다."); } finally { importInput.value = ""; } };
  reader.readAsText(file);
}

function resetData() {
  if (!window.confirm("앱에서 기록한 학습 상태를 초기화할까요? Notion 기반 초기 이해도로 돌아갑니다.")) return;
  state = window.TransferMathStorage.reset(); showToast("학습 기록을 초기화했습니다."); goHome();
}

function quitSession() {
  if (!state.activeSession) return;
  if (!window.confirm("진행 중인 학습 세션을 종료할까요? 이미 제출한 답안과 숙련도는 유지됩니다.")) return;
  window.TransferMathSession.quit(state); showToast("진행 중인 세션을 종료했습니다."); goHome();
}

function render() {
  if (view.name === "study") return renderStudy();
  if (view.name === "browse") return renderBrowse();
  if (view.name === "summary") return renderSummary();
  return renderHome();
}

app.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]"); if (!target) return;
  const action = target.dataset.action; const value = target.dataset.value;
  if (action === "daily") return startDaily();
  if (action === "refresh-daily") return refreshDaily();
  if (action === "resume") { view = freshView("study"); return render(); }
  if (action === "home") return goHome();
  if (action === "quit-session") return quitSession();
  if (action === "browse") return openBrowse("all");
  if (action === "browse-weak") return openBrowse("weak");
  if (action === "filter-stage") return openBrowse(value);
  if (action === "filter") { view.filter = value; return render(); }
  if (action === "concept") return startConcept(value);
  if (action === "focus-epsilon") return startEpsilonFocus();
  if (action === "choose" && !view.reveal) { view.selectedAnswer = value; return render(); }
  if (action === "check") return checkAnswer();
  if (action === "give-up") return giveUp();
  if (action === "error-type") { view.errorType = value; return render(); }
  if (action === "grade") return gradeCurrent(value);
  if (action === "export") return exportBackup();
  if (action === "import") return importInput.click();
  if (action === "reset") return resetData();
});

importInput.addEventListener("change", () => { const [file] = importInput.files || []; if (file) importBackup(file); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(console.error));
render();
