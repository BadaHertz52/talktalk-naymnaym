# 톡톡냠냠 — Claude Code 가이드

## 기술 스택

- **UI**: React 19 + TypeScript (strict)
- **번들러**: Vite
- **라우팅**: react-router-dom v6 (`createBrowserRouter`)
- **상태**: Zustand + persist(sessionStorage)
- **스타일**: CSS Modules + CSS Variables (전역 클래스 최소화)
- **테스트**: Vitest — 작성 규칙은 [.claude/rules/testing.md](.claude/rules/testing.md) 참고
- **린트**: oxlint

---

## 디렉터리 구조

colocation 기반 feature-oriented 구조. **관련 파일은 같은 디렉터리에 응집**하고, 계층(pages → components)으로 공유 범위를 표현한다.

```
src/
├── pages/            # 라우트 1:1 대응. 페이지 디렉터리 안에 전용 컴포넌트 포함
├── components/       # 2개 이상의 페이지가 공유하는 컴포넌트
├── hooks/            # 2개 이상의 페이지가 공유하는 커스텀 훅
├── utils/            # 2개 이상의 페이지가 공유하는 유틸 함수
├── stores/           # Zustand 스토어
├── routes/           # 라우터 설정 + StepGuard
├── types/            # 공유 TypeScript 타입
├── constants/        # 상수 (INTENSITY_WEATHER 등)
├── game/             # Canvas 게임 로직 (React import 없는 순수 TS)
└── styles/           # 전역 CSS (tokens, global, reset)
```

---

## 코드 컨벤션

`pages/`·`components/` 배치 기준, 스타일 규칙, `game/` 규칙, 코딩 스타일(주석/추상화/import 등)은 [.claude/rules/conventions.md](.claude/rules/conventions.md) 참고.

---

## 상태 관리

`src/stores/sessionStore.ts` — 단일 Zustand 스토어.

```ts
// 읽기
const emotionText = useSessionStore((s) => s.emotionText);

// 액션 호출
const completeInput = useSessionStore((s) => s.completeInput);
completeInput(text);
```

| 액션                  | 효과                                            |
| --------------------- | ----------------------------------------------- |
| `completeInput(text)` | emotionText 저장 + completed.input = true       |
| `completeMeasure(v)`  | intensityBefore 저장 + completed.measure = true |
| `completeGame()`      | completed.game = true                           |
| `completeResult(v)`   | intensityAfter 저장 + completed.result = true   |
| `reset()`             | 전체 상태 + sessionStorage 초기화               |

**변경 통제** — 타입/스토어/라우터(`src/types/`, `src/stores/`, `src/routes/`)는 플로우(코어 루프) 자체를 정의하는 파일이므로 사용자 승인 없이 수정 금지. 승인받아 변경할 때는 (1) 변경 사유가 기획안의 어느 항목에 해당하는지 명시하고, (2) 다른 작업에 얹지 말고 전용 커밋/PR로 분리한다.

---

## 라우팅

```
/           HomePage    (가드 없음)
/input      InputPage   (가드 없음)
/measure    MeasurePage (completed.input 필요)
/game       GamePage    (completed.measure 필요)
/result     ResultPage  (completed.game 필요)
/end        EndPage     (completed.result 필요)
```

조건 미충족 접근 시 `StepGuard`가 `/`로 리다이렉트.

---

## 에셋

경로 상수는 `src/game/assets.ts`의 `ASSETS` 사용. 경로 문자열 직접 작성 금지.

```ts
import { ASSETS } from '../game/assets';

<img src={ASSETS.bunny.idle} alt="..." />
<img src={ASSETS.weather[INTENSITY_WEATHER[level]]} alt="" aria-hidden="true" />
```

감정 강도 → 날씨 아이콘 매핑: `src/constants/intensity.ts`의 `INTENSITY_WEATHER`.
