import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { useSessionStore } from '@stores/sessionStore';
import { SCRATCH_GAME_TEST_IDS } from '../../_constants/gameTestIds';
import ScratchGame from '.';
import styles from './index.stories.module.css';

// 게임 화면은 앱 카드(.main) 안에 들어가므로 카드 치수·flex 컬럼을 재현해야 실제 비율로 보인다
function CardFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.cardFrame}>
      {children}
    </div>
  );
}

const meta = {
  title: 'GamePage/ScratchGame',
  component: ScratchGame,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onNext: () => console.log('onNext'),
    onQuit: () => console.log('onQuit'),
  },
  decorators: [
    (Story) => {
      useSessionStore.getState().completeInput({
        text: '오늘 발표 완전 망친 것 같아서 계속 신경 쓰인다.',
        secretMode: false,
      });

      return (
        <CardFrame>
          <Story />
        </CardFrame>
      );
    },
  ],
} satisfies Meta<typeof ScratchGame>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 진행 중 — "다음 ▸" 비활성, "여기까지 할래요 ▸"는 상시 노출 (와이어프레임 03b + 중도 이탈) */
export const 진행중: Story = {};

// ResizeObserver 첫 콜백이 덮개를 다시 그리기 전에 문지르면 지운 자국이 사라지고,
// 진행률 계산은 80ms 스로틀이라 마지막 입력 전에 그보다 길게 쉬어야 완료 판정이 돈다
const WAIT_MS = 120;

const wait = () => new Promise((resolve) => setTimeout(resolve, WAIT_MS));

function pointer(canvas: HTMLCanvasElement, type: string, x: number, y: number) {
  const rect = canvas.getBoundingClientRect();
  canvas.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      clientX: rect.left + x,
      clientY: rect.top + y,
      buttons: 1,
      bubbles: true,
    }),
  );
}

/** 70% 도달 직후 하드 종료 상태 — 게이지 100% + "다음 ▸" 활성, 더 이상 지워지지 않는다 */
export const 하드종료: Story = {
  play: async ({ canvasElement }) => {
    const canvas = canvasElement.querySelector('canvas')!;
    const { width, height } = canvas.getBoundingClientRect();

    await wait();
    pointer(canvas, 'pointerdown', 0, 0);
    for (let y = 0; y <= height; y += 20) {
      for (let x = 0; x <= width; x += 20) {
        pointer(canvas, 'pointermove', y % 40 === 0 ? x : width - x, y);
      }
    }
    await wait();
    pointer(canvas, 'pointermove', width / 2, height / 2);
    pointer(canvas, 'pointerup', width / 2, height / 2);

    const ui = within(canvasElement);
    await waitFor(() => expect(ui.getByTestId(SCRATCH_GAME_TEST_IDS.nextAction)).toBeEnabled());
  },
};
