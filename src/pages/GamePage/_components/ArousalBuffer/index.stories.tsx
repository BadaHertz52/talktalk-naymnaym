import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import Button from '@components/Button';
import ArousalBuffer from '.';

// 버퍼는 앱 카드(검정 프레임) 안에 들어가는 화면이라, 카드 치수를 재현해야 실제 비율로 보인다
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

const meta = {
  title: 'GamePage/ArousalBuffer',
  component: ArousalBuffer,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <CardFrame>
        <Story />
      </CardFrame>
    ),
  ],
  args: {
    onSkip: (dwellMs: number) => console.log('onSkip', dwellMs),
  },
} satisfies Meta<typeof ArousalBuffer>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 뽑기 1~2판 완료 (와이어프레임 05a~05c).
 * 0.0s 상단 문구 + GIF + 건너뛰기 → 1.2s 하단 문구 → 3.0s footer 순으로 나타난다.
 */
export const 뽑기: Story = {
  args: {
    topMessage: '당근 다 뽑았어요!',
    footer: (
      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <Button variant="outline">한 번 더 뽑기</Button>
        <Button>다음 ▸</Button>
      </div>
    ),
  },
};

/** 뽑기 3판 완료 — "한 번 더"가 사라지고 유도 문구가 붙는다 (와이어프레임 05d). */
export const 뽑기3판완료: Story = {
  args: {
    topMessage: '당근 다 뽑았어요!',
    footer: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%' }}>
        <p
          style={{
            margin: 0,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--color-gray-mid)',
          }}
        >
          충분히 했어요. 이제 결과를 볼까요?
        </p>
        <Button>다음 ▸</Button>
      </div>
    ),
  },
};

/** 스크래치 — 상단 문구만 다르고 "한 번 더"가 없다 (와이어프레임 05e). */
export const 스크래치: Story = {
  args: {
    topMessage: '글자 다 지웠어요!',
    footer: <Button>다음 ▸</Button>,
  },
};
