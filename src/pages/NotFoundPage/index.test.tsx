// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { PATHS } from '@constants/paths';
import { PAGE_NAMES } from '@constants/pageNames';
import NotFoundPage from '.';

afterEach(() => {
  cleanup();
  document.title = '';
});

describe('NotFoundPage', () => {
  it('설명 문구가 유일한 h1이고 title이 페이지 이름으로 설정된다', () => {
    const router = createMemoryRouter([{ path: PATHS.notFound, element: <NotFoundPage /> }], {
      initialEntries: [PATHS.notFound],
    });

    render(<RouterProvider router={router} />);

    const name = PAGE_NAMES[PATHS.notFound];
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: `${name}.` })).toBeTruthy();
    expect(document.title).toBe(`${name} — 톡톡냠냠`);
  });
});
