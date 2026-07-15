# 테스트 코드 작성 규칙 (Vitest)

## 구조: describe/it 계층으로 스펙 서술

```ts
describe('{대상}', () => {
  describe('{상황/조건}', () => {
    it('{기대 결과}', () => { ... });
  });
});
```

- `it` 이름은 "~하면 ~된다" 형태의 한국어 사실 서술로 짓는다 (`should ...` 금지)
- 이름만 읽어도 무엇을 보장하는 테스트인지 알 수 있어야 한다

## 본문: Arrange-Act-Assert 3블록 + 빈 줄 구분

```ts
it('emotionText가 바뀌면 measure·game·result 단계가 초기화된다', () => {
  completeAllSteps();

  useSessionStore.getState().completeInput({ text: 'bye', secretMode: false });

  const { steps } = useSessionStore.getState();
  expect(steps.input.data.emotionText).toBe('bye');
});
```

- 준비(Arrange) / 실행(Act) / 검증(Assert)을 빈 줄로만 구분한다
- `// Arrange` `// Act` `// Assert` 같은 주석은 달지 않는다 — 코드가 설명하는 WHAT 주석 금지 규칙과 동일하게 적용

## 반복되는 Arrange는 헬퍼 함수로 추출

같은 준비 로직이 2개 이상 테스트에서 반복되면 헬퍼 함수로 뽑는다.

```ts
function completeAllSteps() {
  useSessionStore.getState().completeInput({ text: 'hi', secretMode: false });
  useSessionStore.getState().completeMeasure(5);
  useSessionStore.getState().completeGame();
  useSessionStore.getState().completeResult({ intensityAfter: 2, afterEmotionText: 'done' });
}
```

- `beforeEach` 자동 실행보다 각 `it` 첫 줄에서 헬퍼를 명시적으로 호출한다 — 이 테스트가 무엇을 전제로 하는지 한눈에 보이게 하기 위함
- `beforeEach`는 헬퍼 호출로도 중복이 해소되지 않을 만큼(예: 10개 이상 테스트) 반복이 누적됐을 때만 고려한다

## 검증은 테스트가 실제로 증명하려는 것만

- 테스트 이름과 `expect` 목록이 1:1로 대응하는지 확인한다
- 이름이 "A와 B가 초기화된다"면 A, B 둘 다 검증한다 — 이름에 언급된 것 중 검증 누락이 없는지 스스로 체크한다
