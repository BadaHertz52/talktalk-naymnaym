import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { FINE_POINTER_TOTAL_TAPS } from '../src/game/pullPower/constants.ts';
import {
  BUFFER_TEST_IDS,
  SCRATCH_GAME_TEST_IDS,
} from '../src/pages/GamePage/_constants/gameTestIds.ts';
import { PULL_GAME_TEST_IDS } from '../src/pages/GamePage/_constants/pullGameTestIds.ts';

// 버퍼 CTA는 3.0초 뒤 노출된다 — assertion timeout으로 기다린다
const BUFFER_CTA_TIMEOUT_MS = 8_000;
const SCRATCH_ROW_GAP_PX = 10;
// 포인터 캡처 + 캔버스 클램프 덕에 가장자리 너머로 그어도 테두리까지 지워진다
const EDGE_OVERSHOOT_PX = 20;

async function startToGameModal(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /시작하기/ }).click();

  await page.getByLabel('스트레스 내용 입력').fill('테스트용 더미 문장입니다');
  await page.getByRole('button', { name: /다음/ }).click();
  await expect(page).toHaveURL(/\/measure$/);

  await page.getByRole('slider', { name: '감정 강도' }).focus();
  await page.keyboard.press('End');
  await page.getByRole('button', { name: /없애러 가기/ }).click();
}

async function selectMode(page: Page, name: string) {
  await page.getByRole('dialog').getByRole('button', { name }).click();
  await expect(page).toHaveURL(/\/game$/);
}

async function finishFromBufferToEnd(page: Page) {
  await expect(page.getByTestId(BUFFER_TEST_IDS.topMessage)).toBeVisible();
  const next = page.getByTestId(BUFFER_TEST_IDS.nextAction);
  await expect(next).toBeVisible({ timeout: BUFFER_CTA_TIMEOUT_MS });
  await next.click();

  await expect(page).toHaveURL(/\/result$/);
  await page.getByRole('slider', { name: '감정 강도' }).focus();
  await page.keyboard.press('Home');
  await page.getByRole('button', { name: /마무리하기/ }).click();
  await expect(page).toHaveURL(/\/end$/);
}

test('스크래치 모드로 코어 플로우를 완주한다', async ({ page }) => {
  await startToGameModal(page);
  await selectMode(page, '당근으로 지우기');

  const canvas = page.getByLabel('글자 지우기 스크래치 영역');
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
  }).toPass();

  await page.getByTestId(SCRATCH_GAME_TEST_IDS.nextAction).click();

  await finishFromBufferToEnd(page);
});

test('뽑기 모드로 코어 플로우를 완주한다', async ({ page }) => {
  await startToGameModal(page);
  await selectMode(page, '당근 뽑기');

  const pull = page.getByTestId(PULL_GAME_TEST_IDS.pullAction);
  for (let i = 0; i < FINE_POINTER_TOTAL_TAPS; i++) {
    await pull.click();
  }

  // 완료 직후 600ms는 연타 오클릭 방지로 "다음 ▸" 클릭이 무시된다 — 버퍼로 넘어갈 때까지 재시도
  await expect(async () => {
    await page.getByTestId(PULL_GAME_TEST_IDS.nextAction).click({ timeout: 1_000 });
    await expect(page.getByTestId(BUFFER_TEST_IDS.topMessage)).toBeVisible({ timeout: 1_000 });
  }).toPass();

  await finishFromBufferToEnd(page);
});
