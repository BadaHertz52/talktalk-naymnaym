import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { fireEvent, fn, within } from 'storybook/test';
import PullGame from '.';

// 게임은 앱 카드(검정 프레임) 안에 들어가는 화면이라, 카드 치수를 재현해야 실제 비율로 보인다
function CardFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: 'var(--main-width)',
        maxWidth: 'var(--main-max-width)',
        height: 'var(--main-height)',
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
  const button = within(canvasElement).getByRole('button', { name: '영차! 뽑기' });

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

/** 포인터 판정은 마운트 시 1회라, 렌더 전에 matchMedia를 coarse로 바꿔 둔다. */
export const 모바일coarse: Story = {
  beforeEach: () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) =>
      query === '(pointer: coarse)' ? ({ matches: true } as MediaQueryList) : original(query);

    return () => {
      window.matchMedia = original;
    };
  },
};
