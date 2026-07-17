import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@stores/sessionStore';
import { PATHS } from '@constants/paths';
import Button from '@components/Button';
import styles from './index.module.css';

const MAX = 1000;

export default function InputPage() {
  const { emotionText, secretMode: storedSecretMode } = useSessionStore((s) => s.steps.input.data);
  const completeInput = useSessionStore((s) => s.completeInput);

  const [text, setText] = useState(emotionText);
  const [secretMode, setSecretMode] = useState(storedSecretMode);
  const [caretIndex, setCaretIndex] = useState(emotionText.length);

  const navigate = useNavigate();

  const syncCaret = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    setCaretIndex(e.currentTarget.selectionStart);
  };

  const handleNext = () => {
    completeInput({ text: text.trim(), secretMode });
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
        <div className={styles.textareaBox}>
          <textarea
            className={`${styles.textarea}${secretMode ? ` ${styles.textareaMasked}` : ''}`}
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX));
              syncCaret(e);
            }}
            onSelect={syncCaret}
            onClick={syncCaret}
            onKeyUp={syncCaret}
            placeholder="머릿속에 맴도는 걸 그대로 적어요"
            aria-label="스트레스 내용 입력"
            aria-describedby="secret-mode-status"
          />
          {secretMode && (
            <div className={styles.maskOverlay} aria-hidden="true">
              {text.slice(0, caretIndex).replace(/[^\s]/g, '■')}
              <span className={styles.caret} />
              {text.slice(caretIndex).replace(/[^\s]/g, '■')}
            </div>
          )}
        </div>
        <span id="secret-mode-status" className={styles.srOnly}>
          {secretMode ? `시크릿 모드 켜짐. 입력 내용은 화면에 가려집니다. ` : ''}현재 {text.length}
          자 입력됨.
        </span>
        <div className={styles.textareaFooter}>
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

      <Button className={styles.button} onClick={handleNext} disabled={text.trim().length === 0}>
        다음 ▸
      </Button>
    </>
  );
}
