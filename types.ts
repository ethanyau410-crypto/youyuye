export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum ViewType {
  SHEET = 'SHEET',
  FRONT = 'FRONT',
  SIDE = 'SIDE',
  BACK = 'BACK',
  TOP = 'TOP'
}

export enum BackgroundType {
  WHITE = 'WHITE',
  TRANSPARENT = 'TRANSPARENT',
  CUSTOM_COLOR = 'CUSTOM_COLOR'
}

export type ImageResolution = '1K' | '2K' | '4K';

export interface BackgroundConfig {
  type: BackgroundType;
  color: string; // Hex code
}

export interface PoseConfig {
  armAngle: number; // 0 to 90 degrees
  legSpread: number; // 0 to 45 degrees
}

export interface StyleAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
}

export interface GeneratedImage {
  url: string;
  timestamp: number;
}