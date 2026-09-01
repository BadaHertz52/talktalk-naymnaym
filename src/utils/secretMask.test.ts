import { describe, it, expect } from 'vitest';
import { getMaskSegments } from './secretMask';

describe('getMaskSegments', () => {
  describe('secretMode가 false면', () => {
    it('전체 텍스트를 masked: false 세그먼트 하나로 반환한다', () => {
      const segments = getMaskSegments('오늘 힘들었다', false);

      expect(segments).toEqual([{ text: '오늘 힘들었다', masked: false }]);
    });
  });

  describe('secretMode가 true면', () => {
    it('공백 기준으로 나누고 비공백 구간만 masked: true로 표시한다', () => {
      const segments = getMaskSegments('오늘 힘들었다', true);

      expect(segments).toEqual([
        { text: '오늘', masked: true },
        { text: ' ', masked: false },
        { text: '힘들었다', masked: true },
      ]);
    });

    it('연속된 공백도 하나의 masked: false 세그먼트로 유지한다', () => {
      const segments = getMaskSegments('오늘  힘들었다', true);

      expect(segments).toEqual([
        { text: '오늘', masked: true },
        { text: '  ', masked: false },
        { text: '힘들었다', masked: true },
      ]);
    });

    it('빈 문자열이면 빈 배열을 반환한다', () => {
      const segments = getMaskSegments('', true);

      expect(segments).toEqual([]);
    });

    it('공백 없는 문자열은 masked: true 세그먼트 하나로 반환한다', () => {
      const segments = getMaskSegments('힘들었다', true);

      expect(segments).toEqual([{ text: '힘들었다', masked: true }]);
    });
  });
});
