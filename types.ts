/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import * as THREE from 'three';
import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      mesh: any;
      group: any;
      boxGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      capsuleGeometry: any;
      ringGeometry: any;
      torusGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      color: any;
      fog: any;
    }
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {
      ambientLight: any;
      pointLight: any;
      spotLight: any;
      mesh: any;
      group: any;
      boxGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      capsuleGeometry: any;
      ringGeometry: any;
      torusGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      color: any;
      fog: any;
    }
  }
}

export enum GameStatus {
  LOADING = 'LOADING',
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export type HandType = 'left' | 'right';

// 0: Up, 1: Down, 2: Left, 3: Right, 4: Any (Dot)
export enum CutDirection {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3,
  ANY = 4
}

export interface NoteData {
  id: string;
  time: number;     // Time in seconds when it should reach the player
  lineIndex: number; // 0-3 (horizontal position)
  lineLayer: number; // 0-2 (vertical position)
  type: HandType;    // which hand should cut it
  cutDirection: CutDirection;
  
  // Language Learning Props
  text: string;       // The word displayed on the block
  isCorrect: boolean; // Is this the correct answer?
  instruction: string; // The question (e.g., "Past tense of: RUN")

  hit?: boolean;
  missed?: boolean;
  hitTime?: number; // Time when hit occurred
}

export interface HandPositions {
  left: THREE.Vector3 | null;
  right: THREE.Vector3 | null;
  leftVelocity: THREE.Vector3;
  rightVelocity: THREE.Vector3;
}

export const COLORS = {
  left: '#ef4444',  // Red-ish
  right: '#3b82f6', // Blue-ish
  track: '#111111',
  correct: '#22c55e',
  wrong: '#ef4444'
};
