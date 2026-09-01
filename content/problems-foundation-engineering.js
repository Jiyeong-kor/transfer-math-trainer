(() => {
  const q = (id, conceptId, prompt, choices, answer, steps, difficulty = 1, math = "") => ({ id, conceptIds: [conceptId], type: "concept-choice", prompt, math, choices, answer, solutionSteps: steps, difficulty, sourceType: "curriculum-original" });
  window.TRANSFER_MATH_PROBLEMS.push(
    q("P-FND-ALG-002", "FND-ALG-002", "x²+3x+2를 인수분해한 것은 무엇인가요?", ["(x+1)(x+2)", "(x-1)(x-2)", "x(x+3)", "(x+2)²"], "(x+1)(x+2)", ["곱이 2이고 합이 3인 두 수는 1과 2입니다."], 1, "x²+3x+2"),
    q("P-FND-EQ-001", "FND-EQ-001", "(r-3)(r+1)=0의 해는 무엇인가요?", ["r=3 또는 r=-1", "r=-3 또는 r=1", "r=3만", "r=-1만"], "r=3 또는 r=-1", ["곱이 0이면 각 인자 중 하나가 0입니다."], 1),
    q("P-FND-FUNC-001", "FND-FUNC-001", "f(x)=2x+1, g(x)=x²일 때 (g∘f)(x)는 무엇인가요?", ["(2x+1)²", "2x²+1", "2x²+2", "x²+1"], "(2x+1)²", ["g의 입력 x 자리에 f(x)=2x+1을 넣습니다."], 1),
    q("P-FND-LOG-001", "FND-LOG-001", "ln(ab)를 올바르게 변형한 것은 무엇인가요?", ["ln a + ln b", "ln a · ln b", "ln a - ln b", "a ln b"], "ln a + ln b", ["로그에서 곱은 로그의 합으로 바뀝니다."], 1),
    q("P-FND-TRIG-001", "FND-TRIG-001", "sin²x+cos²x의 값은 무엇인가요?", ["1", "0", "sin x", "cos x"], "1", ["피타고라스 삼각함수 항등식입니다."], 1),
    q("P-ENG-ODE-002", "MATH-ENG-ODE-002", "y'=xy를 변수분리형으로 정리한 것은 무엇인가요?", ["dy/y = x dx", "y dy = x dx", "dy = y/x dx", "dx/x = y dy"], "dy/y = x dx", ["dy/dx=xy에서 y로 나누고 dx를 곱합니다."], 2),
    q("P-ENG-ODE-003", "MATH-ENG-ODE-003", "y'+2y=x의 적분인자는 무엇인가요?", ["e^(2x)", "e^x", "2e^x", "x²"], "e^(2x)", ["P(x)=2이므로 μ=e^{∫2dx}=e^(2x)입니다."], 2),
    q("P-ENG-ODE-004", "MATH-ENG-ODE-004", "y''-3y'+2y=0의 특성방정식은 무엇인가요?", ["r²-3r+2=0", "r²+3r+2=0", "2r²-3r+1=0", "r-3=0"], "r²-3r+2=0", ["y'', y', y의 계수를 그대로 r², r, 1에 대응합니다."], 2),
    q("P-ENG-ODE-005", "MATH-ENG-ODE-005", "비동차 선형 미분방정식의 일반해 구조는 무엇인가요?", ["동차해 + 특수해", "특수해만", "동차해 × 특수해", "동차해 - 초기값"], "동차해 + 특수해", ["일반해는 상보해와 하나의 특수해의 합입니다."], 1),
    q("P-ENG-ODE-006", "MATH-ENG-ODE-006", "2계 미분방정식의 일반해에 상수 C1,C2가 있을 때 두 상수를 정하려면 일반적으로 몇 개의 독립 초기조건이 필요한가요?", ["2개", "1개", "3개", "필요 없다"], "2개", ["독립인 임의상수의 개수만큼 독립 조건이 필요합니다."], 1),
    q("P-ENG-LAPLACE-002", "MATH-ENG-LAPLACE-002", "L{1}은 무엇인가요?", ["1/s", "s", "1", "1/s²"], "1/s", ["기본 라플라스 변환 공식 L{1}=1/s를 사용합니다."], 1),
    q("P-ENG-LAPLACE-003", "MATH-ENG-LAPLACE-003", "L{y'}의 올바른 식은 무엇인가요?", ["sY(s)-y(0)", "sY(s)+y(0)", "Y(s)/s", "s²Y(s)-y(0)"], "sY(s)-y(0)", ["도함수의 라플라스 변환에는 초기값 항이 포함됩니다."], 2),
    q("P-ENG-LAPLACE-004", "MATH-ENG-LAPLACE-004", "1/[s(s+1)]의 부분분수 분해는 무엇인가요?", ["1/s - 1/(s+1)", "1/s + 1/(s+1)", "s + (s+1)", "1/(2s+1)"], "1/s - 1/(s+1)", ["A/s+B/(s+1)로 두면 A=1, B=-1입니다."], 2)
  );
})();
