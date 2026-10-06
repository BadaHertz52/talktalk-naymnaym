import type { GameMode } from '@/types/session';
import Modal from '@components/Modal';
import { ASSETS } from '@game/assets';
import { ENABLED_GAME_MODES } from '@constants/gameMode';
import styles from './index.module.css';

// 와이어프레임 02M 문구 기준. 3곳만 교정했다 — "없앴까요"(오타), "털어버리는"(§5-1 회피 어휘
// 금지), "스페이스바를 연타해"(모바일엔 스페이스바가 없어 기기 중립 표현으로 대체)
const CARD_COPY: Record<GameMode, { name: string; description: [string, string] }> = {
  scratch: {
    name: '당근으로 지우기',
    description: ['당근을 드래그해서 글자를 지워요.', '천천히, 손끝으로 문질러 없애는 방식.'],
  },
  pull: {
    name: '당근 뽑기',
    description: ['연타해서 힘을 모아요.', '한 번에 뽑아내며 몸으로 쏟아내는 방식.'],
  },
};

interface Props {
  onSelect: (mode: GameMode) => void;
  onClose: () => void;
}

// 두 카드는 같은 클래스·같은 마크업을 쓴다 — 위계 차이가 생기면 모드 비교 데이터가 기본값 편향으로 오염된다
export default function GameModeModal({ onSelect, onClose }: Props) {
  return (
    <Modal onClose={onClose}>
      <Modal.Header showCloseButton>다음 단계를 선택해주세요.</Modal.Header>
      {/* Modal.Body(13px·흰색) 대신 전용 <p> — 와이어프레임 02M의 보조 문구는 12px·회색이다 */}
      <p className={styles.sub}>어떤 방법으로 고민을 없앨까요?</p>
      <div className={styles.cards}>
        {ENABLED_GAME_MODES.map((mode) => (
          <button key={mode} type="button" className={styles.card} onClick={() => onSelect(mode)}>
            <img src={ASSETS.modeThumb[mode]} alt="" aria-hidden="true" className={styles.thumbnail} />
            <span className={styles.text}>
              <span className={styles.name}>{CARD_COPY[mode].name}</span>
              <span className={styles.description}>
                {CARD_COPY[mode].description[0]}
                <br />
                {CARD_COPY[mode].description[1]}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
