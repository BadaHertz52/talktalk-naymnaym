import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ASSETS } from '@game/assets';
import { useArousalBuffer } from '../../_hooks/useArousalBuffer';
import styles from './index.module.css';

const BOTTOM_MESSAGE_DELAY_MS = 1200;
const BOTTOM_MESSAGE = '쉿, 토끼가 자요. 옆에서 쉬어도 돼요.';

interface Props {
  topMessage: string;
  footer: ReactNode;
  onSkip: (dwellMs: number) => void;
}

export default function ArousalBuffer({ topMessage, footer, onSkip }: Props) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [showBottomMessage, setShowBottomMessage] = useState(reducedMotion);
  const { showCta, getDwellMs } = useArousalBuffer({ reducedMotion });

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowBottomMessage(true);
    }, BOTTOM_MESSAGE_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [reducedMotion]);

  return (
    <section className={styles.buffer}>
      <h2 className={styles.topMessage}>{topMessage}</h2>
      <div className={styles.scene}>
        <img
          src={reducedMotion ? ASSETS.buffer.sceneStill : ASSETS.buffer.scene}
          alt=""
          aria-hidden="true"
          className={styles.sceneImage}
        />
        <button type="button" className={styles.skipButton} onClick={() => onSkip(getDwellMs())}>
          건너뛰기
        </button>
      </div>
      <div className={styles.bottomMessage}>{showBottomMessage && <p>{BOTTOM_MESSAGE}</p>}</div>
      <div className={clsx(styles.footer, showCta && styles.footerVisible)}>
        {showCta && footer}
      </div>
    </section>
  );
}
