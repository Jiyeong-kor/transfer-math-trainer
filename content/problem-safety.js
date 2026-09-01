(() => {
  const problems = window.TRANSFER_MATH_PROBLEMS;
  if (!Array.isArray(problems)) return;

  const normalize = (value) => String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/[\[{]/g, "(")
    .replace(/[\]}]/g, ")")
    .replace(/\s+/g, "");

  const hasExplicitAnswerMarker = (value) => /(정답|답은|answer)/i.test(String(value ?? ""));

  const isAnswerLeak = (value, answer, field = "math") => {
    const visible = normalize(value);
    const expected = normalize(answer);
    if (!visible || !expected) return false;

    if (visible === expected) return true;
    if (hasExplicitAnswerMarker(value) && visible.includes(expected)) return true;

    if (field !== "prompt") {
      const eqIndex = visible.indexOf("=");
      if (eqIndex > 0 && eqIndex <= 24 && visible.slice(eqIndex + 1) === expected) return true;
    }

    return false;
  };

  const mathOverrides = new Map([
    ["P-DIFF-LIMIT-006-EX3", "|x²-4|=|x-2||x+2|<5|x-2|"],
    ["P-DIFF-LIMIT-007-EX4", "|√(x-1)-2|≤|x-5|/2"],
    ["P-DIFF-CONT-001-EX3", "lim x→a f(x), f(a)"],
  ]);

  for (let index = problems.length - 1; index >= 0; index -= 1) {
    const problem = problems[index];
    if (!problem || typeof problem !== "object") continue;

    const override = mathOverrides.get(problem.id);
    if (override) problem.math = override;

    if (isAnswerLeak(problem.prompt, problem.answer, "prompt")) {
      problems.splice(index, 1);
      continue;
    }

    for (const field of ["math", "title", "hint"]) {
      if (isAnswerLeak(problem[field], problem.answer, field)) problem[field] = "";
    }
  }

  window.TRANSFER_MATH_ANSWER_SAFETY = {
    normalize,
    isAnswerLeak,
  };
})();
