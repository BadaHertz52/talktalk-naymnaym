import clsx from 'clsx';
import type { GameMode } from '@/types/session';
import Modal from '@components/Modal';
import { ASSETS } from '@game/assets';
import { ENABLED_GAME_MODES } from '@constants/gameMode';
import styles from './index.module.css';

const CARD_COPY: Record<GameMode, { name: string; description: [string, string] }> = {
  scratch: {
    name: '당근으로 지우기',
    description: ['당근으로 글자 위를 문질러요.', '천천히, 손끝 감각에 맡기는 방식.'],
  },
  pull: {
    name: '당근 뽑기',
    description: ['연타로 힘을 모아요.', '한 번에 뽑아내며 몸으로 쏟아내는 방식.'],
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
      <Modal.Header showCloseButton>어떤 방식이 지금 손에 맞아요?</Modal.Header>
      <Modal.Body>손으로 문질러 볼까요, 힘껏 뽑아 볼까요?</Modal.Body>
      <div className={styles.cards}>
        {ENABLED_GAME_MODES.map((mode) => (
          <button key={mode} type="button" className={styles.card} onClick={() => onSelect(mode)}>
            <span className={clsx(styles.thumbnail, styles[mode])} aria-hidden="true">
              <img src={ASSETS.carrot.full} alt="" className={styles.carrot} />
            </span>
            <span className={styles.name}>{CARD_COPY[mode].name}</span>
            <span className={styles.description}>
              {CARD_COPY[mode].description[0]}
              <br />
              {CARD_COPY[mode].description[1]}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
