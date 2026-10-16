// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor, within } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { OverlayProvider } from 'overlay-kit';
import { useSessionStore } from '@stores/sessionStore';
import { PATHS } from '@constants/paths';
import type { GameMode } from '@/types/session';

vi.mock('@utils/analytics', () => ({ trackEvent: vi.fn() }));
const { trackEvent } = await import('@utils/analytics');
const { GA_EVENTS, GA_PARAMS } = await import('@constants/analytics');

// 테스트마다 노출 모드를 바꾸기 위해 배열을 직접 조작한다
const enabledModes = vi.hoisted<GameMode[]>(() => ['scratch', 'pull']);
vi.mock('@constants/gameMode', () => ({ ENABLED_GAME_MODES: enabledModes }));

// jsdom은 <dialog>의 showModal/close를 구현하지 않는다
HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
  this.open = true;
};
HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
  this.open = false;
};

const { default: MeasurePage } = await import('.');

const EMOTION_TEXT = '비밀-감정-원문';

function setEnabledModes(modes: GameMode[]) {
  enabledModes.splice(0, enabledModes.length, ...modes);
}

function prepareMeasuredIntensity() {
  useSessionStore.getState().reset();
  useSessionStore.getState().completeInput({ text: EMOTION_TEXT, secretMode: false });
  useSessionStore.setState((s) => ({
    steps: {
      ...s.steps,
      measure: { completed: false, data: { intensityBefore: 5, gameMode: null } },
    },
  }));
}

function renderMeasurePage() {
  const router = createMemoryRouter(
    [
      { path: PATHS.measure, element: <MeasurePage /> },
      { path: PATHS.game, element: <div data-testid="game-page" /> },
    ],
    { initialEntries: [PATHS.measure] },
  );
  render(
    <OverlayProvider>
      <RouterProvider router={router} />
    </OverlayProvider>,
  );

  return router;
}

function trackedCalls(eventName: string) {
  return vi.mocked(trackEvent).mock.calls.filter(([name]) => name === eventName);
}

function clickNext() {
  const nextButton = screen.getByRole('button', { name: '없애러 가기 ▸' });
  nextButton.focus();
  fireEvent.click(nextButton);

  return nextButton;
}

describe('MeasurePage 모드 선택', () => {
  afterEach(() => {
    vi.mocked(trackEvent).mockClear();
    cleanup();
    setEnabledModes(['scratch', 'pull']);
  });

  describe('두 모드가 활성일 때', () => {
    it('없애러 가기를 누르면 스크래치 → 뽑기 순서로 두 카드가 있는 모달이 열린다', async () => {
      prepareMeasuredIntensity();
      renderMeasurePage();

      clickNext();

      const dialog = await screen.findByRole('dialog', { name: '다음 단계를 선택해주세요.' });
      const cards = within(dialog).getAllByRole('button', { name: /^당근/ });
      expect(cards).toHaveLength(2);
      expect(cards[0]?.textContent).toContain('당근으로 지우기');
      expect(cards[1]?.textContent).toContain('당근 뽑기');
    });

    it('모달은 showModal로 열려 포커스가 모달 안으로 가고 바깥으로 빠지지 않는다', async () => {
      const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal');
      prepareMeasuredIntensity();
      renderMeasurePage();

      clickNext();

      await screen.findByRole('dialog');
      expect(showModal).toHaveBeenCalledTimes(1);
      showModal.mockRestore();
    });

    it('뽑기 카드를 고르면 gameMode가 measure 데이터에 저장되고 /game으로 이동한다', async () => {
      prepareMeasuredIntensity();
      const router = renderMeasurePage();
      clickNext();

      fireEvent.click(await screen.findByRole('button', { name: /당근 뽑기/ }));

      expect(await screen.findByTestId('game-page')).toBeTruthy();
      expect(router.state.location.pathname).toBe(PATHS.game);
      expect(useSessionStore.getState().steps.measure).toEqual({
        completed: true,
        data: { intensityBefore: 5, gameMode: 'pull' },
      });
    });
  });

  describe('모달을 닫으면', () => {
    const closeActions = {
      ESC: (dialog: HTMLElement) => fireEvent(dialog, new Event('cancel', { cancelable: true })),
      배경: (dialog: HTMLElement) => fireEvent.click(dialog),
      X: (_dialog: HTMLElement) => fireEvent.click(screen.getByRole('button', { name: '닫기' })),
    };

    it.each(Object.entries(closeActions))(
      '%s로 닫으면 모달이 사라지고 /measure에 머물며 measure·game 단계가 완료되지 않는다',
      async (_, close) => {
        prepareMeasuredIntensity();
        const router = renderMeasurePage();
        clickNext();

        close(await screen.findByRole('dialog'));

        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
        expect(router.state.location.pathname).toBe(PATHS.measure);
        const { steps } = useSessionStore.getState();
        expect(steps.measure.completed).toBe(false);
        expect(steps.measure.data.gameMode).toBeNull();
        expect(steps.game.completed).toBe(false);
      },
    );

    it('키보드 포커스가 없애러 가기 버튼으로 돌아온다', async () => {
      prepareMeasuredIntensity();
      renderMeasurePage();
      const nextButton = clickNext();

      closeActions.ESC(await screen.findByRole('dialog'));

      await waitFor(() => expect(document.activeElement).toBe(nextButton));
    });

    it('다시 없애러 가기를 누르면 모달이 다시 열린다', async () => {
      prepareMeasuredIntensity();
      renderMeasurePage();
      clickNext();
      closeActions.X(await screen.findByRole('dialog'));
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

      clickNext();

      expect(await screen.findByRole('dialog')).toBeTruthy();
    });
  });

  describe("ENABLED_GAME_MODES가 ['scratch']일 때", () => {
    it('없애러 가기를 누르면 모달 없이 scratch 모드로 저장되고 /game으로 이동한다', async () => {
      setEnabledModes(['scratch']);
      prepareMeasuredIntensity();
      renderMeasurePage();

      clickNext();

      expect(await screen.findByTestId('game-page')).toBeTruthy();
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(useSessionStore.getState().steps.measure.data.gameMode).toBe('scratch');
    });
  });

  describe('모드 선택 GA 이벤트', () => {
    it('모달이 열리면 game_mode_prompt_view가 intensity_before와 함께 1회 전송된다', async () => {
      prepareMeasuredIntensity();
      renderMeasurePage();

      clickNext();

      await screen.findByRole('dialog');
      expect(trackedCalls(GA_EVENTS.gameModePromptView)).toEqual([
        [GA_EVENTS.gameModePromptView, { [GA_PARAMS.intensityBefore]: 5 }],
      ]);
    });

    it('모드를 고르면 game_mode_select가 선택 모드와 숫자 decision_ms로 전송된다', async () => {
      prepareMeasuredIntensity();
      renderMeasurePage();
      clickNext();

      fireEvent.click(await screen.findByRole('button', { name: /당근 뽑기/ }));

      await screen.findByTestId('game-page');
      const [[, params]] = trackedCalls(GA_EVENTS.gameModeSelect);
      expect(params).toMatchObject({
        [GA_PARAMS.gameMode]: 'pull',
        [GA_PARAMS.intensityBefore]: 5,
      });
      expect(Number.isInteger((params as Record<string, number>)[GA_PARAMS.decisionMs])).toBe(true);
      expect(trackedCalls(GA_EVENTS.gameModeDismiss)).toHaveLength(0);
    });

    it('선택 없이 닫으면 game_mode_dismiss만 전송된다', async () => {
      prepareMeasuredIntensity();
      renderMeasurePage();
      clickNext();

      fireEvent.click(await screen.findByRole('button', { name: '닫기' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      const [[, params]] = trackedCalls(GA_EVENTS.gameModeDismiss);
      expect(params).toMatchObject({ [GA_PARAMS.intensityBefore]: 5 });
      expect(Number.isInteger((params as Record<string, number>)[GA_PARAMS.decisionMs])).toBe(true);
      expect(trackedCalls(GA_EVENTS.gameModeSelect)).toHaveLength(0);
    });

    it('모드가 1개라 모달이 없으면 모드 선택 이벤트를 보내지 않는다', async () => {
      setEnabledModes(['scratch']);
      prepareMeasuredIntensity();
      renderMeasurePage();

      clickNext();

      await screen.findByTestId('game-page');
      expect(trackedCalls(GA_EVENTS.gameModePromptView)).toHaveLength(0);
      expect(trackedCalls(GA_EVENTS.gameModeSelect)).toHaveLength(0);
      expect(trackedCalls(GA_EVENTS.measureComplete)).toHaveLength(1);
    });

    it('어떤 이벤트 인자에도 감정 원문이 포함되지 않는다', async () => {
      prepareMeasuredIntensity();
      renderMeasurePage();
      clickNext();

      fireEvent.click(await screen.findByRole('button', { name: /당근 뽑기/ }));

      await screen.findByTestId('game-page');
      expect(JSON.stringify(vi.mocked(trackEvent).mock.calls)).not.toContain(EMOTION_TEXT);
    });
  });
});
