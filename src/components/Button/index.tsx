import type { ComponentPropsWithoutRef } from 'react';
import styles from './index.module.css';

interface Props extends ComponentPropsWithoutRef<'button'> {
  variant?: 'solid' | 'outline';
}

export default function Button({ className, variant = 'solid', ...props }: Props) {
  const variantClass = variant === 'outline' ? styles.outline : '';
  const combinedClassName = [styles.button, variantClass, className].filter(Boolean).join(' ');

  return <button className={combinedClassName} {...props} />;
}
