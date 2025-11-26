export enum AppState {
  HOME = 'HOME',
  DRAWING = 'DRAWING',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  markdownText: string;
}

export interface CanvasRef {
  getImageData: () => string | null;
  clear: () => void;
}
