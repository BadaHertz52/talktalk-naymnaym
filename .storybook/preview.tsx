import type { Preview } from '@storybook/react-vite';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    viewport: {
      options: {
        iphoneSe: {
          name: 'iPhone SE',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        iphone14: {
          name: 'iPhone 14',
          styles: { width: '390px', height: '844px' },
          type: 'mobile',
        },
        hd: {
          name: 'HD',
          styles: { width: '1280px', height: '720px' },
          type: 'desktop',
        },
        macbook14: {
          name: 'MacBook 14',
          styles: { width: '1512px', height: '860px' },
          type: 'desktop',
        },
      },
    },
  },
  initialGlobals: {
    viewport: 'iphone14',
  },
};

export default preview;
