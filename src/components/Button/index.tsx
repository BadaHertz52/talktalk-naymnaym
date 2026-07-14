import type { ComponentPropsWithoutRef } from 'react';
import styles from './index.module.css';

type Props = ComponentPropsWithoutRef<'button'>;

export default function Button({ className, ...props }: Props) {
  return <button className={`${styles.button}${className ? ` ${className}` : ''}`} {...props} />;
}
