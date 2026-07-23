import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { EmotionExpressionStep, EmotionIntensity } from '@/types/session';
import { useSessionStore } from '@stores/sessionStore';
import { ASSETS, GAME_PAGE_PRELOAD } from '@game/assets';
import { EXPRESSION_WEATHER } from '@constants/intensity';
import { toExpressionStep } from '@utils/intensity';
import { PATHS } from '@constants/paths';
import IntensitySlider from '@components/IntensitySlider';
import Button from '@components/Button';
import styles from './index.module.css';

const WEATHER_LABEL: Record<EmotionExpressionStep, string> = {
  1: '맑음 — 가볍고 환해요',
  2: '구름 조금 — 살짝 신경 쓰여요',
  3: '흐림 — 꽤 무겁네요',
  4: '잔뜩 흐림 — 많이 무거워요',
  5: '천둥번개 — 굉장히 신경 쓰여요',
};

export default function MeasurePage() {
  const intensityBefore = useSessionStore((s) => s.steps.measure.data.intensityBefore);
  const completeMeasure = useSessionStore((s) => s.completeMeasure);
  const navigate = useNavigate();

  const [intensity, setIntensity] = useState<EmotionIntensity | null>(intensityBefore);
  const expressionStep = intensity ? toExpressionStep(intensity) : null;

  useEffect(() => {
    GAME_PAGE_PRELOAD.forEach((src) => {
      new Image().src = src;
    });
  }, []);

  const handleNext = () => {
    if (!intensity) return;
    completeMeasure(intensity);
    navigate(PATHS.game);
  };

  return (
    <>
      <h1 className={styles.heading}>
        얼마나
        <br />
        신경 쓰여요?
      </h1>
      <p className={styles.sub}>감정의 무게만큼 골라보세요.</p>

      <div className={styles.previewCard}>
        <div className={styles.previewImageWrap}>
          {expressionStep && (
            <img
              src={ASSETS.weather[EXPRESSION_WEATHER[expressionStep]]}
              alt=""
              className={styles.weatherIcon}
              aria-hidden="true"
            />
          )}
          <img src={ASSETS.bunny.idle} alt="토끼 마스코트" className={styles.bunnyPreview} />
        </div>
        <p className={styles.previewCaption}>
          {expressionStep ? WEATHER_LABEL[expressionStep] : '슬라이더를 움직여 보세요'}
        </p>
      </div>

      <div className={styles.sliderWrap}>
        <IntensitySlider value={intensity} onChange={setIntensity} />
      </div>

      <Button className={styles.button} disabled={!intensity} onClick={handleNext}>
        없애러 가기 ▸
      </Button>
    </>
  );
}
