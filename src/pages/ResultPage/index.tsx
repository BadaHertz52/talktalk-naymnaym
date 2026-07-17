import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EmotionExpressionStep, EmotionIntensity } from '../../types/session';
import { useSessionStore } from '../../stores/sessionStore';
import { ASSETS } from '../../game/assets';
import { toExpressionStep } from '../../utils/intensity';
import { PATHS } from '../../constants/paths';
import IntensitySlider from '../../components/IntensitySlider';
import Button from '../../components/Button';
import ArrowIcon from './_components/ArrowIcon';
import styles from './index.module.css';

const PROMPTS = [
  '내일의 나는 이 일을 어떻게 기억할까요?',
  '오늘 나에게 해주고 싶은 말',
  '그냥, 오늘은 이랬다. 오늘의 마음을 여기 두고 가보세요.',
  '아직 다 못다한 이야기가 있다면, 여기 두고 가보세요.',
];

const STRIP_GROW = [52, 52, 52, 56, 66] as const;

export default function ResultPage() {
  const navigate = useNavigate();

  const intensityBefore = useSessionStore((s) => s.steps.measure.data.intensityBefore);
  const { intensityAfter, afterEmotionText } = useSessionStore((s) => s.steps.result.data);
  const completeResult = useSessionStore((s) => s.completeResult);

  const [intensity, setIntensity] = useState<EmotionIntensity | null>(intensityAfter);
  const [memo, setMemo] = useState(afterEmotionText);
  const prompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], []);

  const expressionStep = intensity ? toExpressionStep(intensity) : null;
  const decreased = intensity !== null && intensityBefore !== null && intensity < intensityBefore;

  const handleDone = () => {
    if (!intensity) return;
    completeResult({ intensityAfter: intensity, afterEmotionText: memo.trim() });
    navigate(PATHS.end);
  };

  return (
    <>
      <div className={`${styles.resultCard} ${decreased ? styles.resultCardWarm : ''}`}>
        {expressionStep === null ? (
          <div className={styles.moodEmpty}>
            <img
              src={ASSETS.bunny.expression[5]}
              alt=""
              aria-hidden="true"
              className={styles.moodSingle}
            />
            <p className={styles.resultTitle}>
              지금 남아있는
              <br />
              감정의 무게를 선택해보세요
            </p>
          </div>
        ) : decreased ? (
          <div className={styles.decreasedMood}>
            <p className={styles.resultTitle} style={{ color: 'var(--color-primary)' }}>
              한결 가벼워졌어요
            </p>
            <div className={styles.moodStrip}>
              {([1, 2, 3, 4, 5] as EmotionExpressionStep[]).map((lvl, i) => (
                <img
                  key={lvl}
                  src={ASSETS.bunny.expression[lvl]}
                  alt=""
                  aria-hidden="true"
                  style={{
                    flexGrow: STRIP_GROW[i],
                    opacity: lvl === expressionStep ? 1 : 0.3,
                  }}
                  className={styles.moodImg}
                />
              ))}
            </div>
            <div className={styles.scoreRow}>
              <span className={styles.scoreBefore}>{intensityBefore}</span>
              <ArrowIcon color="var(--color-primary)" />
              <span className={styles.scoreAfter}>{intensity}</span>
            </div>
          </div>
        ) : (
          <div className={styles.moodNotDecreased}>
            <img
              src={ASSETS.bunny.expression[expressionStep]}
              alt=""
              aria-hidden="true"
              className={styles.moodSingle}
            />
            <p className={styles.resultTitle}>
              오늘은
              <br />
              여기까지도 충분해요
            </p>
            <div className={styles.scoreRow}>
              <span className={styles.scoreBefore}>{intensityBefore}</span>
              <ArrowIcon color="var(--color-gray-mid)" />
              <span className={styles.scoreBefore}>{intensity}</span>
            </div>
            <p className={styles.resultNote}>
              덜어지지 않는 날도 있어요.
              <br />
              속상한 마음은 여기에 적은것만으로도 충분해요.
            </p>
          </div>
        )}
      </div>

      <p className={styles.sliderLabel}>남아있는 감정의 무게는 얼마인가요?</p>
      <div className={styles.sliderWrap}>
        <IntensitySlider value={intensity} onChange={setIntensity} />
      </div>

      <div className={styles.memoBox}>
        <p className={styles.memoLabel}>지금 이 순간에게 (선택)</p>
        <textarea
          className={styles.memoTextarea}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder={prompt}
          maxLength={1000}
          aria-label="지금 이 순간에게 메모"
        />
      </div>

      <Button className={styles.button} disabled={!intensity} onClick={handleDone}>
        마무리하기 ▸
      </Button>
    </>
  );
}
