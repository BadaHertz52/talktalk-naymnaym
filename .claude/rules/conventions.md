# 코드 컨벤션

## pages/ 컨벤션

라우트와 1:1 대응. 페이지마다 **전용 디렉터리**를 만들고, 그 페이지에서만 쓰는 컴포넌트·스타일을 안에 둔다.

```
src/pages/
├── HomePage/
│   ├── index.tsx
│   ├── index.module.css
│   ├── _hooks/  ← 이 페이지 전용 훅
│   └── _components/           ← 이 페이지 전용 컴포넌트
│       └── SomeWidget/
│           ├── index.tsx
│           └── index.module.css
├── MeasurePage/
│   ├── index.tsx
│   └── index.module.css
│   # IntensitySlider는 ResultPage도 쓰므로 → src/components/ 에 위치
...
```

**배치 판단 기준**

| 컴포넌트 사용 범위     | 위치                                            |
| ---------------------- | ----------------------------------------------- |
| 이 페이지에서만 사용   | `pages/{PageName}/_components/{ComponentName}/` |
| 2개 이상 페이지가 공유 | `src/components/{ComponentName}/`               |

**규칙**

- 페이지 컴포넌트 파일명: `index.tsx`
- default export, 함수명은 파일명과 동일 (`export default function HomePage()`)
- 라우트 등록은 `src/routes/router.tsx`만 담당
- 페이지 디렉터리끼리 직접 import 금지

---

## components/ 컨벤션

**2개 이상 페이지가 공유**하는 컴포넌트만 여기에 둔다. 컴포넌트마다 전용 디렉터리로 응집.

```
src/components/
└── IntensitySlider/          ← MeasurePage + ResultPage 공유
    ├── index.tsx
    └── index.module.css
```

**규칙**

- 디렉터리명 = 컴포넌트명 (PascalCase)
- 관련 파일(`.tsx`, `.module.css`, `.test.tsx` 등)은 같은 디렉터리에 colocate
- Props 인터페이스는 같은 파일 내 `interface Props { ... }` 로 정의
- default export
- 한 페이지에서만 쓰다가 다른 페이지에서도 필요해지면 `pages/.../components/` → `src/components/` 로 승격

---

## 유틸/훅/상수 스코프 규칙

`_components`와 동일한 원리: **이 페이지·컴포넌트에서만 쓰면 스코프 폴더에, 2개 이상이 공유하면 최상위로 승격**한다.

| 종류      | 전용 (스코프 폴더)                                                   | 공유 (최상위)     |
| --------- | -------------------------------------------------------------------- | ----------------- |
| 컴포넌트  | `pages/{Page}/_components/`                                          | `src/components/` |
| 훅        | `pages/{Page}/_hooks/` 또는 `components/{Component}/_hooks/`         | `src/hooks/`      |
| 유틸 함수 | `pages/{Page}/_utils/` 또는 `components/{Component}/_utils/`         | `src/utils/`      |
| 상수      | `pages/{Page}/_constants/` 또는 `components/{Component}/_constants/` | `src/constants/`  |

**폴더로 묶는 기준**

- 같은 종류(훅/유틸/상수) 파일이 **2개 이상** 모였을 때만 `_hooks`/`_utils`/`_constants` 폴더로 묶는다
- 파일이 1개뿐이면 폴더를 만들지 말고 페이지·컴포넌트 디렉터리에 바로 둔다 (예: `IntensitySlider/posToSegments.ts`)
- 다른 페이지·컴포넌트에서도 필요해지면 스코프 폴더 → 최상위 폴더로 승격한다

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

| 변수                              | 용도                      |
| --------------------------------- | ------------------------- |
| `--color-primary`                 | CTA, 강조 (#e08a3e)       |
| `--color-surface`                 | 카드 배경 (#1a1a1a)       |
| `--color-black`                   | 앱 배경 (#000)            |
| `--color-white`                   | 기본 텍스트               |
| `--color-gray-light/mid/dark`     | 보조 텍스트, 비활성       |
| `--intensity-1` ~ `--intensity-5` | 감정 강도별 색상          |
| `--font-pixel`                    | Galmuri14, 픽셀 아트 폰트 |

**CTA 버튼**: `src/components/Button` — CTA 버튼 공통 스타일. 새 버튼 스타일 추가 전에 이 컴포넌트로 커버 가능한지 먼저 확인.

**픽셀 아트 이미지**: 반드시 `image-rendering: pixelated` 적용.

---

## game/ 규칙

`src/game/` 내 파일은 **React import 없는 순수 TypeScript**만 허용. `src/pages/`, `src/components/` import 금지.

---

## 코딩 스타일

- 주석은 WHY가 비자명할 때만. 코드가 설명하는 WHAT 주석 작성 금지
- 인터페이스 1구현, 팩토리 1제품 → 추상화 금지
- 에러 핸들링은 시스템 경계(외부 API, 사용자 입력)에만
- 함수 파라미터가 3개 이상이면 객체 형태(`{ a, b, c }`)로 받는다 — 호출부에서 인자 순서를 외울 필요 없고, 선택적 인자를 이름으로 구분할 수 있음
- `return`문 앞에 다른 코드가 있다면 `return`문 앞에 빈 줄을 하나 띄운다
- `pnpm lint && pnpm type-check` 항상 통과 상태 유지

### Import 규칙 (트리쉐이킹)

```ts
// ✅ named import — 번들러가 미사용 코드 제거 가능
import { useState, useCallback } from 'react';
import type { PointerEvent } from 'react';

// ❌ namespace import 금지
import * as React from 'react';
```

- 라이브러리에서 필요한 심볼만 named import로 가져온다
- 타입은 반드시 `import type`으로 분리 — 런타임 번들에서 완전히 제거됨
