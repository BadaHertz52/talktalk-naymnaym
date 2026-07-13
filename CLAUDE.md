# 톡톡냠냠 — Claude Code 가이드

## 기술 스택

- **UI**: React 19 + TypeScript (strict)
- **번들러**: Vite
- **라우팅**: react-router-dom v6 (`createBrowserRouter`)
- **상태**: Zustand + persist(sessionStorage)
- **스타일**: CSS Modules + CSS Variables (전역 클래스 최소화)
- **테스트**: Vitest
- **린트**: oxlint

---

## 디렉터리 구조

colocation 기반 feature-oriented 구조. **관련 파일은 같은 디렉터리에 응집**하고, 계층(pages → components)으로 공유 범위를 표현한다.

```
src/
├── pages/            # 라우트 1:1 대응. 페이지 디렉터리 안에 전용 컴포넌트 포함
├── components/       # 2개 이상의 페이지가 공유하는 컴포넌트
├── hooks/            # 커스텀 훅
├── stores/           # Zustand 스토어
├── routes/           # 라우터 설정 + StepGuard
├── types/            # 공유 TypeScript 타입
├── constants/        # 상수 (INTENSITY_WEATHER 등)
├── game/             # Canvas 게임 로직 (React import 없는 순수 TS)
└── styles/           # 전역 CSS (tokens, global, reset)
```

---

## pages/ 컨벤션

라우트와 1:1 대응. 페이지마다 **전용 디렉터리**를 만들고, 그 페이지에서만 쓰는 컴포넌트·스타일을 안에 둔다.

```
src/pages/
├── HomePage/
│   ├── HomePage.tsx
│   ├── HomePage.module.css
│   └── components/           ← 이 페이지 전용 컴포넌트
│       └── SomeWidget/
│           ├── SomeWidget.tsx
│           └── SomeWidget.module.css
├── MeasurePage/
│   ├── MeasurePage.tsx
│   └── MeasurePage.module.css
│   # IntensitySlider는 ResultPage도 쓰므로 → src/components/ 에 위치
...
```

**배치 판단 기준**

| 컴포넌트 사용 범위 | 위치 |
|---|---|
| 이 페이지에서만 사용 | `pages/{PageName}/components/{ComponentName}/` |
| 2개 이상 페이지가 공유 | `src/components/{ComponentName}/` |

**규칙**
- 페이지 컴포넌트 파일명: `{Name}Page.tsx` (디렉터리명과 동일)
- default export, 함수명은 파일명과 동일 (`export default function HomePage()`)
- 라우트 등록은 `src/routes/router.tsx`만 담당
- 페이지 디렉터리끼리 직접 import 금지

---

## components/ 컨벤션

**2개 이상 페이지가 공유**하는 컴포넌트만 여기에 둔다. 컴포넌트마다 전용 디렉터리로 응집.

```
src/components/
└── IntensitySlider/          ← MeasurePage + ResultPage 공유
    ├── IntensitySlider.tsx
    └── IntensitySlider.module.css
```

**규칙**
- 디렉터리명 = 컴포넌트명 (PascalCase)
- 관련 파일(`.tsx`, `.module.css`, `.test.tsx` 등)은 같은 디렉터리에 colocate
- Props 인터페이스는 같은 파일 내 `interface Props { ... }` 로 정의
- default export
- 한 페이지에서만 쓰다가 다른 페이지에서도 필요해지면 `pages/.../components/` → `src/components/` 로 승격

---

## 스타일 규칙

```css
/* ✅ CSS Variables만 사용 */
color: var(--color-primary);
font-family: var(--font-pixel);

/* ❌ 하드코딩 금지 */
color: #e08a3e;
```

**토큰 위치**: `src/styles/tokens.css`

| 변수 | 용도 |
|---|---|
| `--color-primary` | CTA, 강조 (#e08a3e) |
| `--color-surface` | 카드 배경 (#1a1a1a) |
| `--color-black` | 앱 배경 (#000) |
| `--color-white` | 기본 텍스트 |
| `--color-gray-light/mid/dark` | 보조 텍스트, 비활성 |
| `--intensity-1` ~ `--intensity-5` | 감정 강도별 색상 |
| `--font-pixel` | Galmuri14, 픽셀 아트 폰트 |

**전역 클래스** (`src/styles/global.css`): `.pixel-btn` — CTA 버튼 공통 스타일. 새 버튼 스타일 추가 전에 이 클래스로 커버 가능한지 먼저 확인.

**픽셀 아트 이미지**: 반드시 `image-rendering: pixelated` 적용.

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

| 액션 | 효과 |
|---|---|
| `completeInput(text)` | emotionText 저장 + completed.input = true |
| `completeMeasure(v)` | intensityBefore 저장 + completed.measure = true |
| `completeGame()` | completed.game = true |
| `completeResult(v)` | intensityAfter 저장 + completed.result = true |
| `reset()` | 전체 상태 + sessionStorage 초기화 |

**스토어 파일 수정 금지** — 타입/스토어/라우터(`src/types/`, `src/stores/`, `src/routes/`)는 읽기 전용. 변경이 필요하면 사용자에게 먼저 확인.

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

---

## game/ 규칙

`src/game/` 내 파일은 **React import 없는 순수 TypeScript**만 허용. `src/pages/`, `src/components/` import 금지.

---

## 코딩 스타일

- 주석은 WHY가 비자명할 때만. 코드가 설명하는 WHAT 주석 작성 금지
- 인터페이스 1구현, 팩토리 1제품 → 추상화 금지
- 에러 핸들링은 시스템 경계(외부 API, 사용자 입력)에만
- `pnpm lint && pnpm type-check` 항상 통과 상태 유지
