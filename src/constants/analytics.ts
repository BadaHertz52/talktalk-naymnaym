export const GA_EVENTS = {
  inputComplete: 'step_input_complete',
  measureComplete: 'step_measure_complete',
  gameComplete: 'step_game_complete',
  resultComplete: 'step_result_complete',
  endReached: 'step_end_reached',
} as const;

export const GA_PARAMS = {
  intensityBefore: 'intensity_before',
  intensityAfter: 'intensity_after',
  intensityChange: 'intensity_change',
} as const;
