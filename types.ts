export enum AppState {
  FILE_UPLOAD = 'FILE_UPLOAD',
  GOAL_INPUT = 'GOAL_INPUT',
  PROCESSING = 'PROCESSING',
  MODEL_SELECTION = 'MODEL_SELECTION',
  RESULTS_DASHBOARD = 'RESULTS_DASHBOARD',
}

export enum TaskType {
  CLASSIFICATION = 'CLASSIFICATION',
  REGRESSION = 'REGRESSION',
  OTHER = 'OTHER',
}

export interface FileData {
  name: string;
  type: 'csv' | 'image';
  content: string; // base64 for images, raw text for csv
  headers?: string[];
}

export interface ModelSuggestion {
  recommended: string;
  options: string[];
  more_models: string[];
}

export interface Metrics {
  metrics: Record<string, number | string>;
  confusion_matrix?: number[][];
}