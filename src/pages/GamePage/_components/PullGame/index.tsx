import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { clsx } from 'clsx';
import Button from '@components/Button';
import { ASSETS } from '@game/assets';
import { createPullPower, getTotalTaps } from '@game/pullPower';
import styles from './index.module.css';

const BURIED_PX = 110;
const PULL_KEYS = new Set([' ', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const IDLE_RELAX_MS = 3000;
const IDLE_SLOW_MS = 8000;
const IDLE_REST_MS = 20_000;
const COMPLETE_ANNOUNCEMENT = '당근 다 뽑았어요!';

type IdleLevel = 'none' | 'relax' | 'slow' | 'rest';

interface Props {
  onNext: () => void;
  onQuit: () => void;
}

function getHint(progress: number): string {
  if (progress >= 90) {
    return '조금만 더!';
  }

  if (progress >= 60) {
    return '거의 올라왔어요';
  }

  return '흙이 조금씩 움직여요';
}

export default function PullGame({ onNext, onQuit }: Props) {
  const [isCoarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const [power] = useState(() =>
    createPullPower({ totalTaps: getTotalTaps(isCoarse), onComplete: () => {} }),
  );
  const [progress, setProgress] = useState(0);
  const [hitCount, setHitCount] = useState(0);
  const [inputCount, setInputCount] = useState(0);
  const [holding, setHolding] = useState(false);
  const [idleLevel, setIdleLevel] = useState<IdleLevel>('none');
  const holdFrameRef = useRef<number | null>(null);
  const suppressKeyClickRef = useRef(false);
  const nextArmedRef = useRef(false);
  const restShownRef = useRef(false);
  const gaugeLabelId = useId();
  const completed = progress === 100;
  const t = progress / 100;

  const tap = (pull: () => void) => {
    if (power.isComplete()) {
      return;
    }

    pull();
    setProgress(power.getProgress());
    setHitCount((count) => count + 1);
    setInputCount((count) => count + 1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (!PULL_KEYS.has(e.key)) {
      return;
    }

    e.preventDefault();
    // 버튼 위 Enter/Space는 브라우저가 click을 따로 합성할 수 있어, 그 click이 2타가 되지 않게 표시해 둔다
    suppressKeyClickRef.current = true;

    if (e.repeat) {
      return;
    }

    tap(() => power.keyDown({ repeat: e.repeat }));
  };

  const handlePrimaryKeyUp = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (PULL_KEYS.has(e.key)) {
      e.preventDefault();
    }
  };

  // 포인터 입력은 pointerup에서 이미 셌으므로 click은 보조기기 활성화(detail 0)만 1타로 센다
  const handlePrimaryClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail !== 0) {
      return;
    }

    if (suppressKeyClickRef.current) {
      suppressKeyClickRef.current = false;

      return;
    }

    tap(power.tap);
  };

  const stopHold = () => {
    if (holdFrameRef.current === null) {
      return;
    }

    cancelAnimationFrame(holdFrameRef.current);
    holdFrameRef.current = null;
    setHolding(false);
    setInputCount((count) => count + 1);
  };

  const startHold = (e: PointerEvent<HTMLButtonElement>) => {
    if (power.isComplete() || holdFrameRef.current !== null) {
      return;
    }

    e.currentTarget.setPointerCapture?.(e.pointerId);
    let last = performance.now();
    const frame = () => {
      const now = performance.now();
      power.hold(now - last);
      last = now;
      setProgress(power.getProgress());

      if (power.isComplete()) {
        holdFrameRef.current = null;
        setHolding(false);

        return;
      }

      holdFrameRef.current = requestAnimationFrame(frame);
    };
    holdFrameRef.current = requestAnimationFrame(frame);
    setHolding(true);
  };

  // 마지막 타의 pointerup 직후 같은 자리에 나타난 "다음 ▸"이 뒤따르는 click을 받지 않도록,
  // 이 버튼 위에서 새로 시작한 포인터 입력이나 키보드 활성화(detail 0)만 받는다
  const handleNextClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (e.detail !== 0 && !nextArmedRef.current) {
      return;
    }

    onNext();
  };

  useEffect(() => {
    return () => {
      if (holdFrameRef.current !== null) {
        cancelAnimationFrame(holdFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setIdleLevel('none');

    if (completed || holding) {
      return;
    }

    const timeoutIds = [
      setTimeout(() => setIdleLevel('relax'), IDLE_RELAX_MS),
      setTimeout(() => setIdleLevel('slow'), IDLE_SLOW_MS),
      setTimeout(() => {
        if (!restShownRef.current) {
          restShownRef.current = true;
          setIdleLevel('rest');
        }
      }, IDLE_REST_MS),
    ];

    return () => {
      timeoutIds.forEach(clearTimeout);
    };
  }, [inputCount, holding, completed]);

  return (
    <section className={clsx(styles.pullGame, idleLevel !== 'none' && styles.idle)}>
      <h1 className={styles.heading}>냠냠… 뽑는 중</h1>
      <p className={styles.sub}>
        {isCoarse
          ? '버튼을 연타해주세요. 꾹 눌러도 돼요. 속도는 상관없어요.'
          : '스페이스바를 연타하거나 버튼을 눌러주세요. 꾹 눌러도 돼요. 속도는 상관없어요.'}
      </p>
      <button
        type="button"
        className={clsx(styles.textButton, styles.holdButton, holding && styles.holding)}
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onLostPointerCapture={stopHold}
        onContextMenu={(e) => e.preventDefault()}
      >
        꾹 눌러서 뽑기
      </button>

      <div
        role="group"
        aria-label="당근 뽑기 무대 — Space, Enter, 화살표 키로 뽑아요"
        tabIndex={0}
        className={styles.field}
        onKeyDown={handleKeyDown}
      >
        {!completed && (
          <p className={styles.hint}>
            {idleLevel === 'rest' ? '쉬어도 괜찮아요. 준비되면 이어서 해요.' : getHint(progress)}
          </p>
        )}
        <div className={styles.bunnyArea}>
          {completed ? (
            <img
              src={ASSETS.pull.success}
              alt="당근을 뽑아 든 토끼"
              className={clsx(styles.bunnyImage, styles.success)}
            />
          ) : (
            <div
              className={styles.bunnyLayer}
              style={{ transform: `translateY(${(1 - t) * BURIED_PX}px)` }}
            >
              <img
                key={hitCount}
                src={ASSETS.pull.bunny}
                alt="당근을 뽑는 토끼"
                className={clsx(styles.bunnyImage, hitCount > 0 && styles.shake)}
              />
            </div>
          )}
        </div>
        <div className={styles.dirt} aria-hidden="true">
          <img src={ASSETS.pull.dirt} alt="" />
          <img src={ASSETS.pull.dirt} alt="" />
        </div>
        {completed && (
          <p className={styles.clear} aria-hidden="true">
            CLEAR!!
          </p>
        )}
      </div>

      <div className={styles.gauge}>
        <div className={styles.gaugeLabel}>
          <span id={gaugeLabelId}>파워 게이지</span>
          <span aria-hidden="true">{Math.floor(progress)}%</span>
        </div>
        <div
          role="progressbar"
          aria-labelledby={gaugeLabelId}
          aria-valuenow={Math.floor(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className={styles.track}
        >
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
        {!isCoarse && (
          <p className={styles.keycapRow} aria-hidden="true">
            <span className={styles.keycap}>␣ Space</span>
          </p>
        )}
      </div>

      {completed ? (
        <Button
          className={styles.mainButton}
          onPointerDown={() => {
            nextArmedRef.current = true;
          }}
          onClick={handleNextClick}
        >
          다음 ▸
        </Button>
      ) : (
        <Button
          variant="outline"
          className={styles.mainButton}
          onPointerDown={() => {
            suppressKeyClickRef.current = false;
          }}
          onPointerUp={() => tap(power.tap)}
          onKeyDown={handleKeyDown}
          onKeyUp={handlePrimaryKeyUp}
          onClick={handlePrimaryClick}
        >
          {idleLevel === 'slow' || idleLevel === 'rest' ? '천천히 해도 괜찮아요' : '영차! 뽑기'}
        </Button>
      )}
      <button
        type="button"
        className={clsx(
          styles.textButton,
          styles.quitButton,
          (idleLevel === 'slow' || idleLevel === 'rest') && styles.quitEmphasis,
        )}
        onClick={onQuit}
      >
        여기까지 할래요 ▸
      </button>

      <p className={styles.srOnly} aria-live="polite">
        {completed ? COMPLETE_ANNOUNCEMENT : ''}
      </p>
    </section>
  );
}
