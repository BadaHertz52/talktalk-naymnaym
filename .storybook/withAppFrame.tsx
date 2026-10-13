import type { Decorator } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router-dom';
import PageLayout from '../src/components/PageLayout';
import { PATHS } from '../src/constants/paths';
import styles from './withAppFrame.module.css';

export const withAppFrame: Decorator = (Story) => (
  <div className={styles.frame}>
    <MemoryRouter initialEntries={[PATHS.measure, PATHS.game]} initialIndex={1}>
      <PageLayout showHeader>
        <Story />
      </PageLayout>
    </MemoryRouter>
  </div>
);
