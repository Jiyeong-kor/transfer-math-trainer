(() => {
  const q = (id, conceptId, prompt, choices, answer, steps, difficulty = 1, math = "") => ({ id, conceptIds: [conceptId], type: "concept-choice", prompt, math, choices, answer, solutionSteps: steps, difficulty, sourceType: "curriculum-original" });
  window.TRANSFER_MATH_PROBLEMS.push(
    q("P-INT-DEF-001", "MATH-INT-DEF-001", "∫_0^1 2x dx의 값은 무엇인가요?", ["1", "2", "1/2", "0"], "1", ["원시함수는 x²입니다.", "[x²]_0^1=1입니다."], 1),
    q("P-INT-SUB-001", "MATH-INT-SUB-001", "∫2x cos(x²)dx에서 가장 자연스러운 치환은 무엇인가요?", ["u=x²", "u=2x", "u=cos x", "u=x+2"], "u=x²", ["안쪽 함수 x²의 미분 2x가 함께 있으므로 u=x²가 자연스럽습니다."], 1),
    q("P-INT-PARTS-001", "MATH-INT-PARTS-001", "∫x e^x dx에 부분적분을 적용할 때 u로 가장 적절한 것은 무엇인가요?", ["x", "e^x", "dx", "1"], "x", ["x는 미분하면 1이 되어 단순해지므로 u=x로 둡니다."], 1),
    q("P-INT-RATIONAL-001", "MATH-INT-RATIONAL-001", "1/[x(x+1)]의 올바른 부분분수 분해는 무엇인가요?", ["1/x - 1/(x+1)", "1/x + 1/(x+1)", "x/(x+1)", "1/(2x+1)"], "1/x - 1/(x+1)", ["A/x+B/(x+1)로 두고 계수를 비교하면 A=1, B=-1입니다."], 2),
    q("P-INT-TRIG-001", "MATH-INT-TRIG-001", "∫sin x cos x dx에서 u=sin x로 두면 du는 무엇인가요?", ["cos x dx", "sin x dx", "-sin x dx", "dx/cos x"], "cos x dx", ["sin x를 미분하면 cos x입니다."], 1),
    q("P-INT-IMPROPER-001", "MATH-INT-IMPROPER-001", "∫_1^∞ 1/x^p dx가 수렴하는 조건은 무엇인가요?", ["p>1", "p≥0", "p<1", "모든 p"], "p>1", ["무한구간 p형 적분은 p>1일 때만 수렴합니다."], 2),
    q("P-INT-AREA-001", "MATH-INT-AREA-001", "0≤x≤1에서 y=x가 y=x²보다 위에 있을 때 두 곡선 사이 넓이 적분식은 무엇인가요?", ["∫_0^1 (x-x²)dx", "∫_0^1 (x²-x)dx", "∫_0^1 x³dx", "∫_0^1 (x+x²)dx"], "∫_0^1 (x-x²)dx", ["넓이는 위 함수-아래 함수를 적분합니다."], 1),
    q("P-INT-VOLUME-001", "MATH-INT-VOLUME-001", "y=f(x)≥0을 x축 둘레로 회전할 때 원판법의 기본 부피식은 무엇인가요?", ["π∫[f(x)]²dx", "2π∫f(x)dx", "∫f'(x)dx", "π∫f(x)dx"], "π∫[f(x)]²dx", ["원판의 단면적은 πr²이고 r=f(x)입니다."], 1),
    q("P-CALC2-SEQ-001", "MATH-CALC2-SEQ-001", "수열 a_n=1/n의 극한은 무엇인가요?", ["0", "1", "∞", "존재하지 않는다"], "0", ["n이 커질수록 1/n은 0에 가까워집니다."], 1),
    q("P-CALC2-SERIES-001", "MATH-CALC2-SERIES-001", "급수 Σ(1/2)^n의 수렴 여부는 무엇인가요?", ["수렴", "발산", "항상 0", "판정 불가"], "수렴", ["등비비 |r|=1/2<1이므로 수렴합니다."], 1),
    q("P-CALC2-SERIES-002", "MATH-CALC2-SERIES-002", "비율판정에서 L=1/3이면 급수는 어떻게 되나요?", ["절대수렴", "발산", "항상 조건수렴", "판정 불가"], "절대수렴", ["비율판정에서 L<1이면 절대수렴합니다."], 1),
    q("P-CALC2-SERIES-003", "MATH-CALC2-SERIES-003", "멱급수의 수렴반경이 R=2이면 중심 a에서 절대수렴이 보장되는 범위는 무엇인가요?", ["|x-a|<2", "|x-a|>2", "x=a만", "모든 실수"], "|x-a|<2", ["수렴반경 안쪽에서는 절대수렴합니다. 끝점은 별도 검사합니다."], 1),
    q("P-CALC2-SERIES-004", "MATH-CALC2-SERIES-004", "e^x의 Maclaurin 급수에서 x²의 계수는 무엇인가요?", ["1/2!", "1", "2", "1/3!"], "1/2!", ["e^x=Σx^n/n!이므로 x² 항의 계수는 1/2!입니다."], 1),
    q("P-CALC2-MULTI-001", "MATH-CALC2-MULTI-001", "f(x,y)=x²+y²의 등위곡선 f=1은 무엇인가요?", ["단위원", "직선 y=x", "포물선", "쌍곡선"], "단위원", ["x²+y²=1은 원점 중심 반지름 1인 원입니다."], 1),
    q("P-CALC2-PARTIAL-001", "MATH-CALC2-PARTIAL-001", "f(x,y)=x²y일 때 f_x는 무엇인가요?", ["2xy", "x²", "2x", "xy²"], "2xy", ["y를 상수로 두고 x²를 미분하면 2xy입니다."], 1),
    q("P-CALC2-GRAD-001", "MATH-CALC2-GRAD-001", "f(x,y)=x²+y²의 그래디언트는 무엇인가요?", ["(2x,2y)", "(x,y)", "(2,2)", "x²+y²"], "(2x,2y)", ["각 변수의 편도함수를 성분으로 둡니다."], 1),
    q("P-CALC2-DOUBLE-001", "MATH-CALC2-DOUBLE-001", "직사각형 [0,1]×[0,2]에서 ∫∫1 dA의 값은 무엇인가요?", ["2", "1", "3", "1/2"], "2", ["상수 1의 이중적분은 영역의 넓이와 같고 넓이는 1×2=2입니다."], 1),
    q("P-CALC2-COORD-001", "MATH-CALC2-COORD-001", "극좌표에서 면적요소 dA는 무엇으로 바뀌나요?", ["r dr dθ", "dr dθ", "r² dr dθ", "sinθ dr dθ"], "r dr dθ", ["극좌표 변환의 Jacobian이 r이므로 dA=r dr dθ입니다."], 1)
  );
})();
