import { clsx } from 'clsx';
import styles from './index.module.css';

interface Props {
  onClick: () => void;
  className?: string;
  'data-testid': string;
}

export default function QuitButton({ onClick, className, 'data-testid': testId }: Props) {
  return (
    <button
      type="button"
      className={clsx(styles.quitButton, className)}
      onClick={onClick}
      data-testid={testId}
    >
      여기까지 할래요 ▸
    </button>
  );
}
