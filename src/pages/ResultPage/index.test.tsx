// @vitest-environment jsdom
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { trackEvent } from '@utils/analytics';
import { GA_EVENTS } from '@constants/analytics';
import { PATHS } from '@constants/paths';
import ResultPage from '.';
import { MOOD_DECREASED_TITLE, MOOD_NOT_DECREASED_TITLE } from './constants';

vi.mock('@utils/analytics', () => ({ trackEvent: vi.fn() }));

const QUIT_MESSAGE = '시작한 것만으로도 오늘 몫은 했어요.';
const EMOTION_TEXT = '회의에서 무시당해서 속상했음 7f3a';
const MEMO_TEXT = '내일은 조금 나아질지도 9c1d';

type GameResult = { cleared: true; bufferSkipped: boolean } | { cleared: false };

function completeUntilGame(game: GameResult) {
  useSessionStore.getState().reset();
  useSessionStore.getState().completeInput({ text: EMOTION_TEXT, secretMode: false });
  useSessionStore.getState().completeMeasure({ intensity: 4, gameMode: 'scratch' });
  useSessionStore.getState().completeGame(game);
}

function renderResultPage() {
  const router = createMemoryRouter([{ path: PATHS.result, element: <ResultPage /> }], {
    initialEntries: [PATHS.result],
  });
  render(<RouterProvider router={router} />);
}

function resultCompleteParams() {
  return vi.mocked(trackEvent).mock.calls.find(([name]) => name === GA_EVENTS.resultComplete)?.[1];
}

function finishResultPage({ game, memo = '' }: { game: GameResult; memo?: string }) {
  completeUntilGame(game);
  useSessionStore.getState().completeResult({ intensityAfter: 3, afterEmotionText: memo });

  renderResultPage();

  fireEvent.click(screen.getByRole('button', { name: '마무리하기 ▸' }));
}

describe('ResultPage 종결 문구', () => {
  afterEach(() => {
    cleanup();
  });

  it('중도 이탈(cleared:false)로 들어오면 종결 문구가 보인다', () => {
    completeUntilGame({ cleared: false });

    renderResultPage();

    expect(screen.getByText(QUIT_MESSAGE)).toBeTruthy();
  });

  it('게임을 완료(cleared:true)하고 들어오면 종결 문구가 없다', () => {
    completeUntilGame({ cleared: true, bufferSkipped: false });

    renderResultPage();

    expect(screen.queryByText(QUIT_MESSAGE)).toBeNull();
  });
});

describe('ResultPage GA 결과 이벤트', () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  afterEach(() => {
    cleanup();
  });

  describe('게임을 완료한 세션', () => {
    it('버퍼를 건너뛰었으면 buffer_skipped가 true로 실린다', () => {
      finishResultPage({ game: { cleared: true, bufferSkipped: true } });

      expect(resultCompleteParams()).toMatchObject({
        game_mode: 'scratch',
        game_cleared: true,
        buffer_skipped: true,
      });
    });

    it('버퍼를 거쳤으면 buffer_skipped가 false로 실린다', () => {
      finishResultPage({ game: { cleared: true, bufferSkipped: false } });

      expect(resultCompleteParams()).toMatchObject({
        game_mode: 'scratch',
        game_cleared: true,
        buffer_skipped: false,
      });
    });
  });

  describe('중도 이탈 세션', () => {
    it('game_cleared는 false, buffer_skipped는 true로 실린다', () => {
      finishResultPage({ game: { cleared: false } });

      expect(resultCompleteParams()).toMatchObject({
        game_mode: 'scratch',
        game_cleared: false,
        buffer_skipped: true,
      });
    });
  });

  describe('감정 원문과 메모가 있는 세션', () => {
    it('감정 원문과 메모 텍스트는 trackEvent 인자에 포함되지 않는다', () => {
      finishResultPage({ game: { cleared: true, bufferSkipped: false }, memo: MEMO_TEXT });

      expect(JSON.stringify(vi.mocked(trackEvent).mock.calls)).not.toContain(EMOTION_TEXT);
      expect(JSON.stringify(vi.mocked(trackEvent).mock.calls)).not.toContain(MEMO_TEXT);
    });
  });
});

describe('ResultPage 슬라이더 음성 안내', () => {
  afterEach(() => {
    cleanup();
  });

  it('강도가 줄면 이전→현재 점수와 감소 제목이 aria-valuetext에 담긴다', () => {
    completeUntilGame({ cleared: true, bufferSkipped: false });
    useSessionStore.getState().completeResult({ intensityAfter: 2, afterEmotionText: '' });

    renderResultPage();

    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe(
      `4에서 2 — ${MOOD_DECREASED_TITLE}`,
    );
  });

  it('강도가 줄지 않으면 줄바꿈 없는 유지 제목이 aria-valuetext에 담긴다', () => {
    completeUntilGame({ cleared: true, bufferSkipped: false });
    useSessionStore.getState().completeResult({ intensityAfter: 4, afterEmotionText: '' });

    renderResultPage();

    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe(
      `4에서 4 — ${MOOD_NOT_DECREASED_TITLE.replaceAll('\n', ' ')}`,
    );
  });

  it('값을 고르기 전에는 aria-valuetext가 선택 안 됨이다', () => {
    completeUntilGame({ cleared: true, bufferSkipped: false });

    renderResultPage();

    expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('선택 안 됨');
  });
});
