import { useRef } from 'react';

export function useFireOnce() {
  const firedRef = useRef(false);

  return (action: () => void) => {
    if (firedRef.current) return;
    firedRef.current = true;

    action();
  };
}
