window.TRANSFER_MATH_LESSONS = [
  {
    conceptId: "FND-ABS-001",
    definition: "|x-a| < r은 x와 a 사이의 거리가 r보다 작다는 뜻입니다.",
    whyItMatters: "ε-δ 풀이에서는 이 조건을 x의 범위로 바꿔 다른 식의 크기를 제한합니다.",
    steps: ["|x-a| < r을 -r < x-a < r로 바꿉니다.", "세 항에 a를 더해 a-r < x < a+r을 얻습니다."],
    commonMistakes: ["절댓값 부등식을 한쪽 방향의 부등식으로만 바꾸는 것"],
    workedExample: "|x-2| < 1이면 -1 < x-2 < 1이고, 따라서 1 < x < 3입니다."
  },
  {
    conceptId: "FND-ALG-001",
    definition: "a²-b²은 (a-b)(a+b)로 인수분해됩니다.",
    whyItMatters: "극한에서 |f(x)-L| 안에 |x-a|를 만들어 δ 조건과 연결할 때 자주 사용합니다.",
    steps: ["두 제곱의 차인지 확인합니다.", "a²-b²=(a-b)(a+b)를 적용합니다."],
    commonMistakes: ["(a-b)²로 잘못 바꾸는 것"],
    workedExample: "x²-4=(x-2)(x+2)입니다."
  },
  {
    conceptId: "MATH-DIFF-LIMIT-001",
    definition: "δ는 x가 극한점 a에 얼마나 가까워야 하는지를 제한하는 입력 쪽 거리입니다.",
    whyItMatters: "목표는 |x-a| < δ라는 입력 조건만으로 |f(x)-L| < ε를 보장하는 것입니다.",
    steps: ["먼저 목표식 |f(x)-L|을 봅니다.", "그 식 안에서 |x-a|와 연결되는 부분을 찾습니다.", "δ는 그 |x-a|의 허용 범위를 정합니다."],
    commonMistakes: ["δ를 출력 오차 자체로 생각하는 것", "ε와 δ를 같은 값이어야 한다고 생각하는 것"],
    workedExample: "x→2에서 δ는 |x-2|가 얼마나 작아야 하는지를 정합니다. ε는 함수값의 오차 허용치입니다."
  },
  {
    conceptId: "MATH-DIFF-LIMIT-002",
    definition: "목표식에 |x-a| 인자가 나타나도록 대수적으로 변형합니다.",
    whyItMatters: "δ가 직접 제한하는 것은 |x-a|이므로, 목표식을 그 인자와 연결해야 합니다.",
    steps: ["f(x)-L을 정리합니다.", "차의 제곱 등 인수분해 공식을 확인합니다.", "|x-a|가 인자로 나타나는지 확인합니다."],
    commonMistakes: ["절댓값을 씌운 뒤 인수분해가 불가능하다고 생각하는 것"],
    workedExample: "|x²-4|=|(x-2)(x+2)|=|x-2||x+2|입니다."
  },
  {
    conceptId: "MATH-DIFF-LIMIT-003",
    definition: "인수분해 뒤에도 δ로 바로 제한되지 않는 인자를 따로 찾습니다.",
    whyItMatters: "|x-2|만 작게 해도 |x+2|가 무제한이면 곱 전체를 ε보다 작게 만들 수 없습니다.",
    steps: ["δ와 직접 연결되는 |x-a|를 표시합니다.", "남은 인자를 표시합니다.", "남은 인자에 상한이 필요한지 판단합니다."],
    commonMistakes: ["|x-a|만 작아지면 곱 전체가 자동으로 충분히 작아진다고 생각하는 것"],
    workedExample: "|x²-4|=|x-2||x+2|에서 |x+2|가 통제되지 않는 인자입니다."
  },
  {
    conceptId: "MATH-DIFF-LIMIT-004",
    definition: "x를 a 주변의 좁은 구간에 먼저 넣으면 통제되지 않는 인자를 일정한 상수보다 작게 만들 수 있습니다.",
    whyItMatters: "변하는 인자를 상수 상한으로 바꾸면 남은 계산을 |x-a| 하나로 정리할 수 있습니다.",
    steps: ["예를 들어 |x-2|<1을 임시 조건으로 둡니다.", "그러면 1<x<3입니다.", "따라서 3<x+2<5이고 |x+2|<5입니다.", "이제 |x²-4|<5|x-2|로 단순화됩니다."],
    commonMistakes: ["1을 원래 문제에서 주어진 값이라고 생각하는 것", "1을 ε에 대입한다고 생각하는 것", "상한을 만들기 위해 임의의 편리한 양수를 선택할 수 있다는 점을 놓치는 것"],
    workedExample: "|x-2|<1은 |x+2|<5를 만들기 위한 보조 조건입니다. 1은 목표식에 직접 대입하는 값이 아닙니다."
  },
  {
    conceptId: "MATH-DIFF-LIMIT-005",
    definition: "목표식이 C|x-a|보다 작아졌다면 C|x-a|<ε가 되도록 |x-a|<ε/C를 요구합니다.",
    whyItMatters: "상한을 만든 뒤 ε를 만족시키는 실제 δ 후보를 계산하는 단계입니다.",
    steps: ["|f(x)-L|<C|x-a| 형태를 만듭니다.", "C|x-a|<ε를 원합니다.", "따라서 |x-a|<ε/C이면 충분합니다."],
    commonMistakes: ["C를 곱해야 하는지 나눠야 하는지 혼동하는 것"],
    workedExample: "|x²-4|<5|x-2|이므로 |x-2|<ε/5이면 목표를 만족합니다."
  },
  {
    conceptId: "MATH-DIFF-LIMIT-006",
    definition: "보조 조건과 ε 조건을 동시에 만족해야 하므로 δ는 두 후보 중 더 작은 값으로 잡습니다.",
    whyItMatters: "δ가 한 조건만 만족하면 앞에서 만든 상한 또는 최종 ε 조건 중 하나가 깨질 수 있습니다.",
    steps: ["상한을 만들기 위한 조건 δ≤1을 확인합니다.", "ε를 만족하기 위한 조건 δ≤ε/5를 확인합니다.", "둘 다 만족시키기 위해 δ=min{1, ε/5}로 둡니다."],
    commonMistakes: ["두 후보 중 큰 값을 고르는 것", "min을 외워서 쓰지만 두 조건의 역할을 구분하지 못하는 것"],
    workedExample: "δ=min{1, ε/5}이면 자동으로 δ≤1이고 δ≤ε/5입니다."
  },
  {
    conceptId: "MATH-DIFF-LIMIT-007",
    definition: "무리함수 극한에서는 유리화를 통해 |x-a|를 만드는 경우가 많습니다.",
    whyItMatters: "분자에 제곱근 차이가 있으면 그대로는 δ와 연결하기 어렵기 때문입니다.",
    steps: ["켤레식을 곱합니다.", "분자를 차의 제곱 형태로 정리합니다.", "|x-a| 인자를 만든 뒤 분모를 제한합니다."],
    commonMistakes: ["유리화 뒤 분모의 상한 또는 하한 조건을 확인하지 않는 것"],
    workedExample: "lim x→5 √(x-1)=2 유형에서는 √(x-1)-2를 유리화해 x-5를 만듭니다."
  },
  {
    conceptId: "MATH-DIFF-CONT-001",
    definition: "x=a에서 연속이려면 f(a)가 정의되고, lim x→a f(x)가 존재하며, 두 값이 같아야 합니다.",
    whyItMatters: "극한 다음 단원에서 미분 가능성까지 연결되는 기본 조건입니다.",
    steps: ["f(a) 정의 여부 확인", "좌우 극한이 같은지 확인", "극한값과 f(a)가 같은지 확인"],
    commonMistakes: ["극한이 존재하기만 하면 연속이라고 판단하는 것"],
    workedExample: "극한값이 3이어도 f(a)=2이면 x=a에서 연속이 아닙니다."
  },
  {
    conceptId: "MATH-INT-BASE-001",
    definition: "부정적분은 미분하면 원래 함수가 되는 원시함수들의 모음입니다.",
    whyItMatters: "적분 공식 암기보다 미분의 역연산이라는 구조를 먼저 이해해야 합니다.",
    steps: ["적분 결과 후보를 미분합니다.", "원래 함수가 나오면 원시함수입니다.", "모든 상수 차이를 포함하기 위해 +C를 붙입니다."],
    commonMistakes: ["적분상수 C를 빼먹는 것"],
    workedExample: "∫2x dx = x² + C입니다."
  },
  {
    conceptId: "MATH-CALC2-BASE-001",
    definition: "이 항목은 미적분학Ⅱ 현재 시작점의 이해도를 확인하는 진단 노드입니다.",
    whyItMatters: "페이지 진도만으로 숙련도를 추정하지 않기 위해 실제 문제 반응으로 시작점을 정합니다.",
    steps: ["문제의 개념을 식별합니다.", "알고 있는 정의와 연결합니다.", "풀 수 없으면 미학습으로 되돌립니다."],
    commonMistakes: ["책을 본 적 있다는 이유만으로 이해했다고 평가하는 것"],
    workedExample: "진단 결과에 따라 수열·급수 또는 다변수 함수의 선행 개념으로 이동합니다."
  },
  {
    conceptId: "MATH-LA-MATRIX-001",
    definition: "행렬 곱 AB는 A의 행과 B의 열을 대응해 계산하며 일반적으로 AB와 BA가 같지 않습니다.",
    whyItMatters: "선형대수의 후속 개념인 역행렬, 선형변환, 고유값 계산의 기초입니다.",
    steps: ["곱셈 가능한 차원인지 확인합니다.", "A의 각 행과 B의 각 열을 내적합니다.", "곱의 순서를 유지합니다."],
    commonMistakes: ["행렬 곱을 원소별 곱으로 계산하는 것", "AB=BA라고 가정하는 것"],
    workedExample: "A가 2×3이고 B가 3×4이면 AB는 2×4입니다."
  },
  {
    conceptId: "MATH-LA-VECTOR-001",
    definition: "벡터는 크기와 방향을 가지며 성분으로 표현할 수 있습니다.",
    whyItMatters: "벡터공간, 기저, 선형독립을 이해하는 출발점입니다.",
    steps: ["벡터의 성분을 확인합니다.", "덧셈과 스칼라배를 적용합니다.", "기하적 의미와 성분 계산을 연결합니다."],
    commonMistakes: ["점과 벡터를 같은 대상으로 취급하는 것"],
    workedExample: "(1,2)+(3,-1)=(4,1)입니다."
  },
  {
    conceptId: "MATH-ENG-ODE-001",
    definition: "미분방정식은 미지의 함수와 그 도함수 사이의 관계를 나타내는 방정식입니다.",
    whyItMatters: "공업수학에서 1계, 2계 미분방정식과 라플라스 변환으로 이어집니다.",
    steps: ["미지수가 숫자인지 함수인지 확인합니다.", "도함수가 포함되는지 확인합니다.", "후보 함수를 미분해 식을 만족하는지 검증합니다."],
    commonMistakes: ["일반 대수방정식과 같은 방식으로만 해석하는 것"],
    workedExample: "y'=2y에서 y=e^(2x)는 y'=2e^(2x)=2y이므로 해입니다."
  },
  {
    conceptId: "MATH-ENG-LAPLACE-001",
    definition: "라플라스 변환은 시간 영역의 미분방정식을 s 영역의 대수식으로 바꾸는 도구입니다.",
    whyItMatters: "초기값이 있는 선형 미분방정식을 체계적으로 풀 때 유용합니다.",
    steps: ["함수에 라플라스 변환을 적용합니다.", "미분 항을 s에 대한 대수식으로 바꿉니다.", "대수식을 푼 뒤 역라플라스 변환합니다."],
    commonMistakes: ["변환 자체가 최종 해라고 생각하는 것"],
    workedExample: "L{y'}=sY(s)-y(0)처럼 초기값이 식에 함께 들어갑니다."
  }
];
