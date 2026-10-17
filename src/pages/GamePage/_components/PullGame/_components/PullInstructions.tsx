import { memo } from 'react';
import { PULL_GAME_TEST_IDS } from '../../../_constants/pullGameTestIds';
import styles from '../index.module.css';

const PullInstructions = memo(function PullInstructions() {
  return (
    <>
      <h1 className={styles.heading}>냠냠… 뽑는 중</h1>
      <div className={styles.instructions} data-testid={PULL_GAME_TEST_IDS.instructions}>
        <div
          className={styles.instructionRow}
          data-testid={PULL_GAME_TEST_IDS.singlePullInstruction}
        >
          <span className={styles.instructionLabel}>한 번 뽑기</span>
          <span>- 스페이스바, 엔터, ⬆️ 또는 뽑기 버튼</span>
        </div>
        <div
          className={styles.instructionRow}
          data-testid={PULL_GAME_TEST_IDS.continuousPullInstruction}
        >
          <span className={styles.instructionLabel}>쭈욱 뽑기</span>
          <span>- 스페이스바 + ⬆️</span>
        </div>
      </div>
    </>
  );
});

export default PullInstructions;
