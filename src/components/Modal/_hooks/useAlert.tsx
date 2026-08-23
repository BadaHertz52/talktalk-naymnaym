import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { overlay } from 'overlay-kit';
import Button from '@components/Button';
import Modal from '@components/Modal';

interface AlertOptions {
  title: ReactNode;
  message?: ReactNode;
  confirmText?: string;
}

export function useAlert() {
  return useCallback(
    ({ title, message, confirmText = '확인' }: AlertOptions) =>
      overlay.openAsync<void>(({ isOpen, close, unmount }) => {
        const done = () => {
          close();
          unmount();
        };

        return (
          isOpen && (
            <Modal onClose={done}>
              <Modal.Header showCloseButton>{title}</Modal.Header>
              {message && <Modal.Body>{message}</Modal.Body>}
              <Modal.Footer>
                <Button onClick={done}>{confirmText}</Button>
              </Modal.Footer>
            </Modal>
          )
        );
      }),
    [],
  );
}
