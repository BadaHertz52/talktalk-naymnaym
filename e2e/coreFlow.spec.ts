import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { FINE_POINTER_TOTAL_TAPS } from '../src/game/pullPower/constants.ts';
import {
  BUFFER_TEST_IDS,
  SCRATCH_GAME_TEST_IDS,
} from '../src/pages/GamePage/_constants/gameTestIds.ts';
import { PULL_GAME_TEST_IDS } from '../src/pages/GamePage/_constants/pullGameTestIds.ts';
import { HOME_TEST_IDS } from '../src/pages/HomePage/testIds.ts';
import { INPUT_TEST_IDS } from '../src/pages/InputPage/testIds.ts';
import { GAME_MODE_TEST_IDS } from '../src/pages/MeasurePage/_components/GameModeModal/testIds.ts';
import { MEASURE_TEST_IDS } from '../src/pages/MeasurePage/testIds.ts';
import { RESULT_TEST_IDS } from '../src/pages/ResultPage/testIds.ts';

// 버퍼 CTA는 일정 시간 뒤 노출된다 — assertion timeout으로 기다린다
const BUFFER_CTA_TIMEOUT_MS = 8_000;
const SCRATCH_ROW_GAP_PX = 10;
// 포인터 캡처 + 캔버스 클램프 덕에 가장자리 너머로 그어도 테두리까지 지워진다
const EDGE_OVERSHOOT_PX = 20;
const SCRATCH_TIMEOUT_MS = 15_000;

// index.html의 gtag가 프로덕션 GA 속성이라, 테스트 트래픽이 모드 비교 데이터를 오염시키지 않게 막는다
test.beforeEach(async ({ page }) => {
  await page.route(/(googletagmanager|google-analytics)\.com/, (route) => route.abort());
});

async function startToGameModal(page: Page) {
  await page.goto('/');
  await page.getByTestId(HOME_TEST_IDS.startAction).click();

  await page.getByTestId(INPUT_TEST_IDS.textarea).fill('테스트용 더미 문장입니다');
  await page.getByTestId(INPUT_TEST_IDS.nextAction).click();
  await expect(page).toHaveURL(/\/measure$/);

  await page.getByRole('slider').focus();
  await page.keyboard.press('End');
  await page.getByTestId(MEASURE_TEST_IDS.nextAction).click();
}

async function selectMode(page: Page, mode: keyof typeof GAME_MODE_TEST_IDS) {
  await page.getByRole('dialog').getByTestId(GAME_MODE_TEST_IDS[mode]).click();
  await expect(page).toHaveURL(/\/game$/);
}

async function finishFromBufferToEnd(page: Page) {
  await expect(page.getByTestId(BUFFER_TEST_IDS.topMessage)).toBeVisible();
  const next = page.getByTestId(BUFFER_TEST_IDS.nextAction);
  await expect(next).toBeVisible({ timeout: BUFFER_CTA_TIMEOUT_MS });
  await next.click();

  await expect(page).toHaveURL(/\/result$/);
  await page.getByRole('slider').focus();
  await page.keyboard.press('Home');
  await page.getByTestId(RESULT_TEST_IDS.doneAction).click();
  await expect(page).toHaveURL(/\/end$/);
}

test('스크래치 모드로 코어 플로우를 완주한다', async ({ page }) => {
  await startToGameModal(page);
  await selectMode(page, 'scratch');

  const canvas = page.getByTestId(SCRATCH_GAME_TEST_IDS.canvas);
  const progress = page.getByTestId(SCRATCH_GAME_TEST_IDS.progress);
  // 진행률은 스트로크 종료 시점에 갱신되고 알파 0인 픽셀만 지운 것으로 센다 —
  // 한 번 훑어 모자라면 어긋난 행으로 한 번 더 훑는다
  let pass = 0;
  await expect(async () => {
    // 이미지 로드로 레이아웃이 움직일 수 있어 매 패스마다 다시 잰다
    const box = await canvas.boundingBox();
    if (!box) throw new Error('스크래치 캔버스를 찾지 못했다');
    const offset = (pass++ * SCRATCH_ROW_GAP_PX) / 3;
    await page.mouse.move(box.x, box.y + offset);
    await page.mouse.down();
    for (let y = box.y + offset; y < box.y + box.height; y += SCRATCH_ROW_GAP_PX) {
      await page.mouse.move(box.x + box.width + EDGE_OVERSHOOT_PX, y);
      await page.mouse.move(box.x - EDGE_OVERSHOOT_PX, y + SCRATCH_ROW_GAP_PX / 2);
    }
    await page.mouse.up();
    await expect(progress).toHaveAttribute('data-percent', '100', { timeout: 1_000 });
  }).toPass({ timeout: SCRATCH_TIMEOUT_MS });

  await page.getByTestId(SCRATCH_GAME_TEST_IDS.nextAction).click();

  await finishFromBufferToEnd(page);
});

test('뽑기 모드로 코어 플로우를 완주한다', async ({ page }) => {
  await startToGameModal(page);
  await selectMode(page, 'pull');

  const pull = page.getByTestId(PULL_GAME_TEST_IDS.pullAction);
  for (let i = 0; i < FINE_POINTER_TOTAL_TAPS; i++) {
    await pull.click();
  }

  // 완료 직후 잠시는 연타 오클릭 방지로 "다음 ▸" 클릭이 무시된다 — 버퍼로 넘어갈 때까지 재시도
  await expect(async () => {
    await page.getByTestId(PULL_GAME_TEST_IDS.nextAction).click({ timeout: 1_000 });
    await expect(page.getByTestId(BUFFER_TEST_IDS.topMessage)).toBeVisible({ timeout: 1_000 });
  }).toPass();

  await finishFromBufferToEnd(page);
});
