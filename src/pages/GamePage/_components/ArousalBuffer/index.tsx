import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { ASSETS } from '@game/assets';
import { useArousalBuffer } from '../../_hooks/useArousalBuffer';
import { BUFFER_TEST_IDS } from '../../_constants/gameTestIds';
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
  const [showBottomMessage, setShowBottomMessage] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const { showCta, getDwellMs } = useArousalBuffer();
  const showFooter = showCta || skipped;
  const footerRef = useRef<HTMLDivElement>(null);
  const skipHadFocusRef = useRef(false);

  const handleSkip = () => {
    setShowBottomMessage(true);
    setSkipped(true);
  };

  useEffect(() => {
    if (showFooter && skipHadFocusRef.current) {
      footerRef.current?.querySelector('button')?.focus();
    }
  }, [showFooter]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setShowBottomMessage(true);
    }, BOTTOM_MESSAGE_DELAY_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section className={styles.buffer}>
      <h2 className={styles.topMessage} data-testid={BUFFER_TEST_IDS.topMessage}>
        {topMessage}
      </h2>
      <div className={styles.scene}>
        <img
          src={reducedMotion ? ASSETS.buffer.sceneStill : ASSETS.buffer.scene}
          alt=""
          aria-hidden="true"
          className={styles.sceneImage}
        />
        {!showFooter && (
          <button
            type="button"
            ref={(node) => () => {
              // 언마운트 직전(DOM 제거 전)에만 포커스 여부를 알 수 있다
              skipHadFocusRef.current = document.activeElement === node;
            }}
            className={styles.skipButton}
            onClick={handleSkip}
            data-testid={BUFFER_TEST_IDS.skipAction}
          >
            건너뛰기
          </button>
        )}
      </div>
      <div className={styles.bottomMessage}>
        {showBottomMessage && <p data-testid={BUFFER_TEST_IDS.bottomMessage}>{BOTTOM_MESSAGE}</p>}
      </div>
      <div ref={footerRef} className={clsx(styles.footer, showFooter && styles.footerVisible)}>
        {showFooter && footer({ getDwellMs, skipped })}
      </div>
    </section>
  );
}
