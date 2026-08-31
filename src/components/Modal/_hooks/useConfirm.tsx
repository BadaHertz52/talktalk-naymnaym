import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { overlay } from 'overlay-kit';
import Button from '@components/Button';
import Modal from '@components/Modal';

type OpenAsyncOptions = Parameters<typeof overlay.openAsync>[1];

interface ConfirmOptions {
  title: ReactNode;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** overlay.openAsync에 그대로 전달되는 옵션 (overlayId 등) */
  overlayOptions?: OpenAsyncOptions;
}

export function useConfirm() {
  return useCallback(
    ({
      title,
      message,
      confirmText = '확인',
      cancelText = '취소',
      overlayOptions,
    }: ConfirmOptions) =>
      overlay.openAsync<boolean>(({ isOpen, close, unmount }) => {
        const done = (result: boolean) => {
          close(result);
          unmount();
        };

        return (
          isOpen && (
            <Modal onClose={() => done(false)}>
              <Modal.Header>{title}</Modal.Header>
              {message && <Modal.Body>{message}</Modal.Body>}
              <Modal.Footer>
                <Button variant="outline" onClick={() => done(false)}>
                  {cancelText}
                </Button>
                <Button onClick={() => done(true)}>{confirmText}</Button>
              </Modal.Footer>
            </Modal>
          )
        );
      }, overlayOptions),
    [],
  );
}
