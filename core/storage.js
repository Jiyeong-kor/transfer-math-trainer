"use strict";

(() => {
  const STORAGE_KEY = "transfer-math-trainer-v1";
  const STATE_VERSION = 1;

  function seoulDateKey(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const get = (type) => parts.find((part) => part.type === type)?.value;
    return `${get("year")}-${get("month")}-${get("day")}`;
  }

  function addDaysIso(days) {
    const now = new Date();
    now.setHours(12, 0, 0, 0);
    now.setDate(now.getDate() + days);
    return now.toISOString();
  }

  function createMasterySeed() {
    const seed = window.TRANSFER_MATH_LEARNER_SEED || {};
    const concepts = window.TRANSFER_MATH_CONCEPTS || [];
    return Object.fromEntries(concepts.map((concept) => {
      const initial = seed[concept.id] || {};
      return [concept.id, {
        status: initial.status || concept.initialStatus || "unseen",
        evidence: initial.evidence || "",
        errorType: initial.errorType || null,
        correctStreak: 0,
        wrongStreak: 0,
        seenCount: 0,
        dueAt: null,
        lastCheckedAt: initial.lastCheckedAt || null,
        history: [],
      }];
    }));
  }

  function freshState() {
    const now = new Date().toISOString();
    return {
      version: STATE_VERSION,
      createdAt: now,
      updatedAt: now,
      mastery: createMasterySeed(),
      dailyPlans: {},
      activeSession: null,
      completedSessions: [],
      answerHistory: [],
    };
  }

  function normalizeState(parsed) {
    const fresh = freshState();
    const mastery = { ...fresh.mastery };
    for (const [conceptId, value] of Object.entries(parsed?.mastery || {})) {
      if (!mastery[conceptId]) continue;
      mastery[conceptId] = { ...mastery[conceptId], ...value };
    }
    return {
      ...fresh,
      ...parsed,
      version: STATE_VERSION,
      mastery,
      dailyPlans: parsed?.dailyPlans || {},
      completedSessions: parsed?.completedSessions || [],
      answerHistory: parsed?.answerHistory || [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return freshState();
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== STATE_VERSION) return freshState();
      return normalizeState(parsed);
    } catch (error) {
      console.error("학습 상태를 불러오지 못했습니다.", error);
      return freshState();
    }
  }

  function save(state) {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function exportJson(state) {
    return JSON.stringify(state, null, 2);
  }

  function importJson(text) {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.version !== STATE_VERSION || typeof parsed.mastery !== "object") {
      throw new Error("지원하지 않는 백업 형식입니다.");
    }
    return normalizeState(parsed);
  }

  function reset() {
    localStorage.removeItem(STORAGE_KEY);
    return freshState();
  }

  window.TransferMathStorage = {
    STORAGE_KEY,
    STATE_VERSION,
    seoulDateKey,
    addDaysIso,
    freshState,
    load,
    save,
    exportJson,
    importJson,
    reset,
  };
})();
