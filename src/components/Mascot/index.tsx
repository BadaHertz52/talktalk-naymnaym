import styles from './index.module.css';

interface Props {
  src: string;
  alt: string;
}

export default function Mascot({ src, alt }: Props) {
  return <img src={src} alt={alt} className={styles.mascot} />;
}
