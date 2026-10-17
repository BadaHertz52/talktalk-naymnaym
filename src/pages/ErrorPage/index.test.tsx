// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import ErrorPage from '.';

function Boom(): never {
  throw new Error('boom');
}

afterEach(() => {
  cleanup();
  document.title = '';
  vi.restoreAllMocks();
});

describe('ErrorPage', () => {
  it('안내 문구가 유일한 h1이고 같은 문구가 title에 쓰인다', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const router = createMemoryRouter(
      [{ path: '/', element: <Boom />, errorElement: <ErrorPage /> }],
      { initialEntries: ['/'] },
    );

    render(<RouterProvider router={router} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toBe(`${heading.textContent} — 톡톡냠냠`);
  });
});
