import { memo } from 'react';
import styles from '../index.module.css';

const PullInstructions = memo(function PullInstructions() {
  return (
    <>
      <h1 className={styles.heading}>냠냠… 뽑는 중</h1>
      <div className={styles.instructions}>
        <div className={styles.instructionRow}>
          <span className={styles.instructionLabel}>한 번 뽑기 -</span>
          <span>스페이스바, 엔터, ⬆️ 또는 뽑기 버튼 누르기</span>
        </div>
        <div className={styles.instructionRow}>
          <span className={styles.instructionLabel}>쭈욱 뽑기 -</span>
          <span>스페이스바 + ⬆️ 꾹 누르기</span>
        </div>
      </div>
    </>
  );
});

export default PullInstructions;
