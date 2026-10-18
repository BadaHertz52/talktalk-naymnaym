import type { Location } from 'react-router-dom';

// 최초 엔트리 판별용. location.key는 최초 엔트리로 뒤로가기 복귀 시에도 'default'라 key로는 구분할 수 없고,
// location 객체 동일성은 StrictMode 이중 실행에도 유지된다.
let initialLocation: Location | null = null;

export function rememberInitialLocation(location: Location): void {
  initialLocation ??= location;
}

export function isInitialLocation(location: Location): boolean {
  return location === initialLocation;
}

export function resetInitialLocationForTest(): void {
  initialLocation = null;
}
