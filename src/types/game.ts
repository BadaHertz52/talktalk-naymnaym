export interface Position {
  x: number
  y: number
}

// 굴러가는 당근 상태
export interface CarrotState { 
  position: Position; rotation: number; targetChunkId: string | null 
}

export interface EmotionChunk {
  id: string
  text: string
  position: Position
  eaten: boolean
}

export type OnGameComplete = () => void
