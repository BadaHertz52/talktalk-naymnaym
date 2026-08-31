import { createContext, useContext, useEffect, useId, useRef } from 'react';
import type { MouseEvent, PropsWithChildren } from 'react';
import clsx from 'clsx';
import CloseIcon from '@components/icons/CloseIcon';
import styles from './index.module.css';

interface ModalContextValue {
  titleId: string;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) throw new Error('Modal 합성 컴포넌트는 <Modal> 안에서만 사용할 수 있습니다.');

  return context;
}

interface ModalProps extends PropsWithChildren {
  /** 닫힘 요청 시 호출 — ESC, backdrop 클릭, X 버튼 모두 이 콜백으로 통일된다 */
  onClose: () => void;
  className?: string;
}

export default function Modal({ onClose, className, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  const triggerRef = useRef<HTMLElement | null>(null);
  if (triggerRef.current === null) {
    triggerRef.current = document.activeElement as HTMLElement;
  }

  useEffect(() => {
    dialogRef.current?.showModal();

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';

      const trigger = triggerRef.current;
      if (trigger && document.contains(trigger)) trigger.focus();
    };
  }, []);

  const handleBackdropClick = (e: MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
    >
      <ModalContext.Provider value={{ titleId, onClose }}>
        <div className={clsx(styles.inner, className)}>{children}</div>
      </ModalContext.Provider>
    </dialog>
  );
}

interface HeaderProps extends PropsWithChildren {
  /** X 닫기 버튼 표시 여부 */
  showCloseButton?: boolean;
}

function Header({ showCloseButton = false, children }: HeaderProps) {
  const { titleId, onClose } = useModalContext();

  return (
    <div className={styles.header}>
      <h2 id={titleId} className={styles.title}>
        {children}
      </h2>
      {showCloseButton && (
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="닫기">
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

function Body({ children }: PropsWithChildren) {
  return <div className={styles.body}>{children}</div>;
}

function Footer({ children }: PropsWithChildren) {
  return <div className={styles.footer}>{children}</div>;
}

Modal.Header = Header;
Modal.Body = Body;
Modal.Footer = Footer;
