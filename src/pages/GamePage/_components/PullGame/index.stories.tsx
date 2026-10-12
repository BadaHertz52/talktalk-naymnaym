import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { fireEvent, fn, within } from 'storybook/test';
import { PULL_GAME_TEST_IDS } from '../../_constants/pullGameTestIds';
import PullGame from '.';

// 게임은 앱 카드(검정 프레임) 안에 들어가는 화면이라, 카드 치수를 재현해야 실제 비율로 보인다
function CardFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 'var(--main-width)',
        maxWidth: 'var(--main-max-width)',
        aspectRatio: 'var(--main-aspect-ratio)',
        margin: '0 auto',
        padding: '26px 22px 30px',
        background: 'var(--color-black)',
        border: '3px solid var(--color-white)',
        borderRadius: 26,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </div>
  );
}

function tapTimes(canvasElement: HTMLElement, times: number) {
  const button = within(canvasElement).getByTestId(PULL_GAME_TEST_IDS.pullAction);

  for (let index = 0; index < times; index++) {
    fireEvent.pointerUp(button);
  }
}

const meta = {
  title: 'GamePage/PullGame',
  component: PullGame,
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    onNext: fn(),
    onQuit: fn(),
  },
  decorators: [
    (Story) => (
      <CardFrame>
        <Story />
      </CardFrame>
    ),
  ],
} satisfies Meta<typeof PullGame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const 초기: Story = {};

export const 진행50: Story = {
  play: ({ canvasElement }) => tapTimes(canvasElement, 20),
};

export const 진행90이상: Story = {
  play: ({ canvasElement }) => tapTimes(canvasElement, 37),
};

/** 100% — 완료 이미지 + CLEAR!! 1회 팝 + 주 버튼 자리에 "다음 ▸". */
export const 완료: Story = {
  play: ({ canvasElement }) => tapTimes(canvasElement, 40),
};
