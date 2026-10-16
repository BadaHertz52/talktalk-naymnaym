import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const topMessageRef = useRef<HTMLHeadingElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const moveFocusToFooterRef = useRef(false);

  const handleSkip = () => {
    // Safari/iOS는 클릭해도 버튼에 포커스가 가지 않으므로 클릭은 포커스 여부와 무관하게 이동한다
    moveFocusToFooterRef.current = true;
    setShowBottomMessage(true);
    setSkipped(true);
  };

  useLayoutEffect(() => {
    topMessageRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    // 포커스를 가진 건너뛰기 버튼이 제거되면 activeElement가 body가 된다
    const focusLost = !document.activeElement || document.activeElement === document.body;

    if (showFooter && (moveFocusToFooterRef.current || focusLost)) {
      footerRef.current?.focus();
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
      <h2
        ref={topMessageRef}
        tabIndex={-1}
        className={styles.topMessage}
        data-testid={BUFFER_TEST_IDS.topMessage}
      >
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
            className={styles.skipButton}
            onClick={handleSkip}
            data-testid={BUFFER_TEST_IDS.skipAction}
          >
            건너뛰기
          </button>
        )}
      </div>
      <div className={styles.bottomMessage} aria-live="polite">
        {showBottomMessage && <p data-testid={BUFFER_TEST_IDS.bottomMessage}>{BOTTOM_MESSAGE}</p>}
      </div>
      <div
        ref={footerRef}
        tabIndex={-1}
        role="group"
        aria-label="다음 행동"
        className={clsx(styles.footer, showFooter && styles.footerVisible)}
        data-testid={BUFFER_TEST_IDS.footer}
      >
        {showFooter && footer({ getDwellMs, skipped })}
      </div>
    </section>
  );
}
