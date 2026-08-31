import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { OverlayProvider } from 'overlay-kit';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import Button from '@components/Button';
import Modal from '@components/Modal';
import { useAlert } from './_hooks/useAlert';
import { useConfirm } from './_hooks/useConfirm';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Modal>;

export default meta;

// 스토리가 훅 사용 예시를 render로 직접 그리므로 args 없이 정의한다
type Story = StoryObj;

function UseConfirmExample() {
  const confirm = useConfirm();
  const [result, setResult] = useState<string>('아직 안 열림');

  return (
    <div style={{ padding: 16 }}>
      <Button
        onClick={async () => {
          const ok = await confirm({
            title: '시크릿 모드를 해제할까요?',
            message: '해제하면 작성한 내용이 화면에 보여요.',
            confirmText: '해제',
          });
          setResult(ok ? 'true (해제)' : 'false (유지)');
        }}
      >
        confirm 열기
      </Button>
      <p style={{ color: 'var(--color-white)' }} data-testid="confirm-result">
        결과: {result}
      </p>
    </div>
  );
}

export const UseConfirmHook: Story = {
  render: () => (
    <OverlayProvider>
      <UseConfirmExample />
    </OverlayProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'confirm 열기' }));
    const dialog = await body.findByRole('dialog');
    await expect(within(dialog).getByText('시크릿 모드를 해제할까요?')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: '해제' }));
    await waitFor(() => expect(canvas.getByTestId('confirm-result')).toHaveTextContent('true'));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

function UseAlertExample() {
  const alert = useAlert();

  return (
    <div style={{ padding: 16 }}>
      <Button
        onClick={() => alert({ title: '저장할 수 없어요', message: '잠시 후 다시 시도해주세요.' })}
      >
        alert 열기
      </Button>
    </div>
  );
}

export const UseAlertHook: Story = {
  render: () => (
    <OverlayProvider>
      <UseAlertExample />
    </OverlayProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole('button', { name: 'alert 열기' }));
    const dialog = await body.findByRole('dialog');

    await userEvent.click(within(dialog).getByRole('button', { name: '닫기' }));
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};
