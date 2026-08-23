import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { overlay } from 'overlay-kit';
import Button from '@components/Button';
import Modal from '@components/Modal';

interface ConfirmOptions {
  title: ReactNode;
  message?: ReactNode;
  confirmText?: string;
  cancelText?: string;
}

export function useConfirm() {
  return useCallback(
    ({ title, message, confirmText = '확인', cancelText = '취소' }: ConfirmOptions) =>
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
      }),
    [],
  );
}
