import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ASSETS } from '@game/assets';
import { useArousalBuffer } from '../../_hooks/useArousalBuffer';
import styles from './index.module.css';

const BOTTOM_MESSAGE_DELAY_MS = 1200;
const BOTTOM_MESSAGE = '쉿, 토끼가 자요. 옆에서 쉬어도 돼요.';

interface FooterContext {
  getDwellMs: () => number;
  skipped: boolean;
}

interface Props {
  topMessage: string;
  footer: (ctx: FooterContext) => ReactNode;
}

export default function ArousalBuffer({ topMessage, footer }: Props) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [showBottomMessage, setShowBottomMessage] = useState(reducedMotion);
  const [skipped, setSkipped] = useState(false);
  const { showCta, getDwellMs } = useArousalBuffer({ reducedMotion });
  const showFooter = showCta || skipped;

  const handleSkip = () => {
    setShowBottomMessage(true);
    setSkipped(true);
  };

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
        {!skipped && (
          <button type="button" className={styles.skipButton} onClick={handleSkip}>
            건너뛰기
          </button>
        )}
      </div>
      <div className={styles.bottomMessage}>{showBottomMessage && <p>{BOTTOM_MESSAGE}</p>}</div>
      <div className={clsx(styles.footer, showFooter && styles.footerVisible)}>
        {showFooter && footer({ getDwellMs, skipped })}
      </div>
    </section>
  );
}
