import type { ComponentPropsWithRef } from 'react';
import clsx from 'clsx';
import styles from './index.module.css';

interface Props extends ComponentPropsWithRef<'button'> {
  variant?: 'solid' | 'outline';
}

export default function Button({ className, variant = 'solid', ...props }: Props) {
  return (
    <button
      className={clsx(styles.button, variant === 'outline' && styles.outline, className)}
      {...props}
    />
  );
}
