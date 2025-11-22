
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { CutDirection, NoteData } from "./types";
import * as THREE from 'three';

// Game World Config
export const TRACK_LENGTH = 50;
export const SPAWN_Z = -35; // Further back to give reading time
export const PLAYER_Z = 0;
export const MISS_Z = 5;
export const NOTE_SPEED = 8; // Slower speed to allow reading text

export const LANE_WIDTH = 1.2; // Wider lanes for text visibility
export const LAYER_HEIGHT = 0.8;
export const NOTE_SIZE = 0.6;

// Positions for the 4 lanes (centered around 0)
export const LANE_X_POSITIONS = [-1.5 * LANE_WIDTH, -0.5 * LANE_WIDTH, 0.5 * LANE_WIDTH, 1.5 * LANE_WIDTH];
export const LAYER_Y_POSITIONS = [1.0, 1.8, 2.6]; // Low, Mid, High

// Audio Options
export const MUSIC_TRACKS = [
  { name: "Neon Racer", url: "https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race2.ogg", bpm: 140 },
  { name: "Chill Step", url: "https://commondatastorage.googleapis.com/codeskulptor-demos/pyman_assets/ateapill.ogg", bpm: 110 },
  { name: "Electro Pop", url: "https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg", bpm: 130 }
];

export const SONG_BPM = 140; // Default fallback
const BEAT_TIME = 60 / SONG_BPM;

interface QuestionSet {
  instruction: string;
  correct: string;
  distractors: string[];
}

// Expanded Curriculum with Phrases
const PHRASE_CURRICULUM: QuestionSet[] = [
  { instruction: "Yesterday, I ___ to the store.", correct: "WENT", distractors: ["GO", "GONE", "GOING"] },
  { instruction: "She ___ a beautiful song.", correct: "SANG", distractors: ["SING", "SUNG", "SINGED"] },
  { instruction: "We have ___ the game!", correct: "WON", distractors: ["WIN", "WINNED", "WAN"] },
  { instruction: "The sun ___ in the East.", correct: "RISES", distractors: ["ROSE", "RISE", "RISING"] },
  { instruction: "I am ___ a book right now.", correct: "READING", distractors: ["READ", "READS", "RED"] },
  { instruction: "They ___ pizza last night.", correct: "ATE", distractors: ["EAT", "EATED", "EATING"] },
  { instruction: "He ___ his keys yesterday.", correct: "LOST", distractors: ["LOSE", "LOSES", "LOSED"] },
  { instruction: "My dog ___ very fast.", correct: "RUNS", distractors: ["RUN", "RAN", "RUNNING"] },
  { instruction: "We ___ happy to see you.", correct: "ARE", distractors: ["IS", "AM", "BE"] },
  { instruction: "She ___ English well.", correct: "SPEAKS", distractors: ["SPEAK", "SPOKE", "SPOKEN"] },
  { instruction: "I ___ my homework already.", correct: "DID", distractors: ["DO", "DONE", "DOES"] },
  { instruction: "It ___ heavily last winter.", correct: "SNOWED", distractors: ["SNOW", "SNOWS", "SNOWING"] },
  { instruction: "Opposite of: HAPPY", correct: "SAD", distractors: ["GLAD", "JOY", "FUN"] },
  { instruction: "Plural of: CHILD", correct: "CHILDREN", distractors: ["CHILDS", "KIDS", "BABY"] },
  { instruction: "Past of: BUY", correct: "BOUGHT", distractors: ["BUYED", "BUYS", "BUYING"] }
];

// Generate a learning chart
export const generateDemoChart = (difficultyMultiplier: number = 1): NoteData[] => {
  const notes: NoteData[] = [];
  let idCount = 0;
  
  // Start at beat 8 to give time to get ready
  let currentBeat = 8; 

  PHRASE_CURRICULUM.forEach((q) => {
    const time = currentBeat * BEAT_TIME;
    
    // Shuffle positions
    const lanes = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    
    // 1. The Correct Answer
    notes.push({
      id: `note-${idCount++}`,
      time: time,
      lineIndex: lanes[0],
      lineLayer: 0,
      type: lanes[0] < 2 ? 'left' : 'right', 
      cutDirection: CutDirection.ANY,
      text: q.correct,
      isCorrect: true,
      instruction: q.instruction
    });

    // 2. Distractors
    const numDistractors = Math.min(3, 1 + Math.floor(difficultyMultiplier)); // 1 to 3 distractors
    
    for (let i = 0; i < numDistractors; i++) {
        if (i >= q.distractors.length) break;
        notes.push({
            id: `note-${idCount++}`,
            time: time, // Same time
            lineIndex: lanes[i + 1],
            lineLayer: i % 2 === 0 ? 1 : 0, // Vary height
            type: lanes[i + 1] < 2 ? 'left' : 'right',
            cutDirection: CutDirection.ANY,
            text: q.distractors[i],
            isCorrect: false,
            instruction: q.instruction
        });
    }

    // Gap before next question (gives time to read feedback)
    currentBeat += 10; 
  });

  return notes.sort((a, b) => a.time - b.time);
};

export const DEMO_CHART = generateDemoChart();

// Vectors for direction checking
export const DIRECTION_VECTORS: Record<CutDirection, THREE.Vector3> = {
  [CutDirection.UP]: new THREE.Vector3(0, 1, 0),
  [CutDirection.DOWN]: new THREE.Vector3(0, -1, 0),
  [CutDirection.LEFT]: new THREE.Vector3(-1, 0, 0),
  [CutDirection.RIGHT]: new THREE.Vector3(1, 0, 0),
  [CutDirection.ANY]: new THREE.Vector3(0, 0, 0) // Magnitude check only
};
