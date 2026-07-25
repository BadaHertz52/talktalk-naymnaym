import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EmotionIntensity } from '@/types/session';
import type { IntensityChange } from '@/types/analytics';
import { useSessionStore } from '@stores/sessionStore';
import { toExpressionStep } from '@utils/intensity';
import { trackEvent } from '@utils/analytics';
import { PATHS } from '@constants/paths';
import { GA_EVENTS, GA_PARAMS } from '@constants/analytics';
import { useFireOnce } from '@hooks/useFireOnce';
import IntensitySlider from '@components/IntensitySlider';
import Button from '@components/Button';
import MoodEmpty from './_components/MoodEmpty';
import MoodDecreased from './_components/MoodDecreased';
import MoodNotDecreased from './_components/MoodNotDecreased';
import styles from './index.module.css';

const PROMPTS = [
  '내일의 나는 이 일을 어떻게 기억할까요?',
  '오늘 나에게 해주고 싶은 말',
  '그냥, 오늘은 이랬다. 오늘의 마음을 여기 두고 가보세요.',
  '아직 다 못다한 이야기가 있다면, 여기 두고 가보세요.',
];

export default function ResultPage() {
  const navigate = useNavigate();
  const fireOnce = useFireOnce();

  const intensityBefore = useSessionStore((s) => s.steps.measure.data.intensityBefore);
  const { intensityAfter, afterEmotionText } = useSessionStore((s) => s.steps.result.data);
  const completeResult = useSessionStore((s) => s.completeResult);

  const [intensity, setIntensity] = useState<EmotionIntensity | null>(intensityAfter);
  const [memo, setMemo] = useState(afterEmotionText);
  const prompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], []);

  const expressionStep = intensity ? toExpressionStep(intensity) : null;
  const intensityChange: IntensityChange =
    intensity === null || intensityBefore === null || intensity === intensityBefore
      ? 'same'
      : intensity < intensityBefore
        ? 'decreased'
        : 'increased';
  const decreased = intensityChange === 'decreased';

  const handleDone = () => {
    if (!intensity) return;

    fireOnce(() => {
      completeResult({ intensityAfter: intensity, afterEmotionText: memo.trim() });

      trackEvent(GA_EVENTS.resultComplete, {
        [GA_PARAMS.intensityBefore]: intensityBefore,
        [GA_PARAMS.intensityAfter]: intensity,
        [GA_PARAMS.intensityChange]: intensityChange,
      });

      navigate(PATHS.end);
    });
  };

  return (
    <>
      <div className={`${styles.resultCard} ${decreased ? styles.resultCardWarm : ''}`}>
        {expressionStep === null ? (
          <MoodEmpty />
        ) : decreased ? (
          <MoodDecreased
            expressionStep={expressionStep}
            intensity={intensity}
            intensityBefore={intensityBefore}
          />
        ) : (
          <MoodNotDecreased
            expressionStep={expressionStep}
            intensity={intensity}
            intensityBefore={intensityBefore}
          />
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
