import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../../stores/sessionStore';
import { PATHS } from '../../constants/paths';
import styles from './index.module.css';

const MAX = 200;

export default function InputPage() {
  const [text, setText] = useState('');
  const [secretMode, setSecretMode] = useState(false);
  const navigate = useNavigate();
  const completeInput = useSessionStore((s) => s.completeInput);

  const handleNext = () => {
    completeInput(text.trim());
    navigate(PATHS.measure);
  };

  return (
    <>
      <h1 className={styles.heading}>
        무엇이
        <br />
        신경 쓰이나요?
      </h1>
      <p className={styles.sub}>
        머릿속에 맴도는 걸 그대로 적어요.
        <br />
        여기 적은 건, 이따 사라집니다.
      </p>
      <p className={styles.note}>비밀로 하고 싶으면, 시크릿 모드를 켜보세요.</p>

      <div className={styles.textareaWrapper}>
        {secretMode && (
          <div className={styles.secretOverlay} aria-hidden="true">
            {text.split('').map((c, i) =>
              c === ' ' ? (
                <span key={i}>{' '}</span>
              ) : (
                <span key={i} className={styles.secretChar}>
                  {c}
                </span>
              ),
            )}
          </div>
        )}
        <textarea
          className={`${styles.textarea}${secretMode ? ` ${styles.textareaSecret}` : ''}`}
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          placeholder="머릿속에 맴도는 걸 그대로 적어요"
          rows={6}
          aria-label="스트레스 내용 입력"
        />
        <div className={styles.textareaFooter}>
          <span className={styles.charCount}>
            {text.length} / {MAX}
          </span>
          <button
            type="button"
            className={`${styles.secretToggle}${secretMode ? ` ${styles.secretToggleOn}` : ''}`}
            onClick={() => setSecretMode((v) => !v)}
            aria-pressed={secretMode}
            aria-label="시크릿 모드"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="9" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            <span className={styles.togglePill}>
              <span className={styles.toggleKnob} />
            </span>
          </button>
        </div>
      </div>

      <button className={styles.button} onClick={handleNext} disabled={text.trim().length === 0}>
        다음 ▸
      </button>
    </>
  );
}
