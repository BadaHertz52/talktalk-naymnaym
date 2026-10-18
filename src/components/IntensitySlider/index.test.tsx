// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import IntensitySlider from '.';

afterEach(cleanup);

describe('IntensitySlider 접근성', () => {
  describe('값이 있을 때', () => {
    it('valueText가 있으면 aria-valuetext에 담긴다', () => {
      render(<IntensitySlider value={3} onChange={vi.fn()} valueText="3, 흐림 — 꽤 무겁네요" />);

      const slider = screen.getByRole('slider');

      expect(slider.getAttribute('aria-valuetext')).toBe('3, 흐림 — 꽤 무겁네요');
      expect((slider as HTMLInputElement).value).toBe('3');
    });

    it('valueText가 없으면 숫자가 aria-valuetext가 된다', () => {
      render(<IntensitySlider value={4} onChange={vi.fn()} />);

      expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('4');
    });

    it('range 값이 바뀌면 onChange가 숫자로 호출된다', () => {
      const onChange = vi.fn();
      render(<IntensitySlider value={3} onChange={onChange} />);

      fireEvent.change(screen.getByRole('slider'), { target: { value: '7' } });

      expect(onChange).toHaveBeenCalledWith(7);
    });
  });

  describe('값이 없을 때', () => {
    it('aria-valuetext가 선택 안 됨이고 valueText는 무시된다', () => {
      render(<IntensitySlider value={null} onChange={vi.fn()} valueText="무시됨" />);

      expect(screen.getByRole('slider').getAttribute('aria-valuetext')).toBe('선택 안 됨');
    });

    it('값이 없으면 range 내부값은 중간값 5다', () => {
      render(<IntensitySlider value={null} onChange={vi.fn()} />);

      expect((screen.getByRole('slider') as HTMLInputElement).value).toBe('5');
    });

    it.each([6, 4, 1])('조절 결과가 %i면 그 값이 선택된다', (next) => {
      const onChange = vi.fn();
      render(<IntensitySlider value={null} onChange={onChange} />);

      fireEvent.change(screen.getByRole('slider'), { target: { value: String(next) } });

      expect(onChange).toHaveBeenCalledWith(next);
    });

    it('내부값과 같은 5 위치에서 포인터를 떼면 5가 선택된다', () => {
      const onChange = vi.fn();
      render(<IntensitySlider value={null} onChange={onChange} />);

      fireEvent.pointerUp(screen.getByRole('slider'));

      expect(onChange).toHaveBeenCalledWith(5);
    });
  });

  describe('값이 있는 상태에서 포인터를 떼면', () => {
    it('중복으로 onChange가 호출되지 않는다', () => {
      const onChange = vi.fn();
      render(<IntensitySlider value={5} onChange={onChange} />);

      fireEvent.pointerUp(screen.getByRole('slider'));

      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
