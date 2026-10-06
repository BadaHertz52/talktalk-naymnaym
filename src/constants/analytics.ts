export const GA_EVENTS = {
  inputComplete: 'step_input_complete',
  measureComplete: 'step_measure_complete',
  gameComplete: 'step_game_complete',
  resultComplete: 'step_result_complete',
  endReached: 'step_end_reached',
  gameModePromptView: 'game_mode_prompt_view',
  gameModeSelect: 'game_mode_select',
  gameModeDismiss: 'game_mode_dismiss',
  gameAbandon: 'game_abandon',
} as const;

export const GA_PARAMS = {
  intensityBefore: 'intensity_before',
  intensityAfter: 'intensity_after',
  intensityChange: 'intensity_change',
  gameMode: 'game_mode',
  gameCleared: 'game_cleared',
  gameReplayCount: 'game_replay_count',
  gameDurationMs: 'game_duration_ms',
  pullTaps: 'pull_taps',
  pullInputMethod: 'pull_input_method',
  scratchRatio: 'scratch_ratio',
  progressRatio: 'progress_ratio',
  decisionMs: 'decision_ms',
  bufferSkipped: 'buffer_skipped',
  bufferDwellMs: 'buffer_dwell_ms',
} as const;
