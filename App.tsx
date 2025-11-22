
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, useProgress } from '@react-three/drei';
import { GameStatus, NoteData } from './types';
import { DEMO_CHART, generateDemoChart, MUSIC_TRACKS } from './constants';
import { useMediaPipe } from './hooks/useMediaPipe';
import GameScene from './components/GameScene';
import WebcamPreview from './components/WebcamPreview';
import { Play, RefreshCw, VideoOff, Hand, BookOpen, GraduationCap, Volume2, Ear, Music, Settings } from 'lucide-react';

type GameMode = 'VISUAL' | 'LISTENING';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [health, setHealth] = useState(100);
  const [instruction, setInstruction] = useState<string>("Get Ready...");
  
  // Menu State
  const [gameMode, setGameMode] = useState<GameMode>('VISUAL');
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const [chart, setChart] = useState<NoteData[]>(DEMO_CHART);

  const audioRef = useRef<HTMLAudioElement>(new Audio(MUSIC_TRACKS[0].url));
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { isCameraReady, handPositionsRef, lastResultsRef, error: cameraError } = useMediaPipe(videoRef);
  
  // Update Audio Track when selection changes
  useEffect(() => {
      audioRef.current.src = MUSIC_TRACKS[selectedTrackIndex].url;
      audioRef.current.volume = 0.4; // Lower music volume so speech is clearer
      audioRef.current.load();
  }, [selectedTrackIndex]);

  // Speech Synthesis for Listening Challenges
  const speakInstruction = useCallback((text: string) => {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for clarity
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      
      // Try to select a decent voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices[0];
      if (preferredVoice) utterance.voice = preferredVoice;

      window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
      if (gameStatus === GameStatus.PLAYING && instruction) {
          // In Listening Mode, we MUST speak it.
          // In Visual Mode, we speak it as reinforcement.
          
          // Replace underscores with "blank" for speech
          const speakText = instruction.replace(/___/g, "blank");
          speakInstruction(speakText);
      }
  }, [instruction, gameStatus, speakInstruction]);

  // Game Logic Handlers
  const handleNoteHit = useCallback((note: NoteData, goodCut: boolean) => {
     if (navigator.vibrate) {
         navigator.vibrate(goodCut ? [50, 50, 50] : 200); // Stronger vibration for tactile feel
     }

     if (goodCut && note.isCorrect) {
         // Correct Answer Hit!
         setCombo(c => {
           const newCombo = c + 1;
           if (newCombo > 10) setMultiplier(4);
           else if (newCombo > 5) setMultiplier(2);
           else setMultiplier(1);
           return newCombo;
         });
         setScore(s => s + (100 * multiplier));
         setHealth(h => Math.min(100, h + 5));
         
         // Positive reinforcement speech occasionally
         if (Math.random() > 0.7) {
            const praise = ["Correct!", "Nice!", "Good job!", "Awesome!"];
            const word = praise[Math.floor(Math.random() * praise.length)];
            const u = new SpeechSynthesisUtterance(word);
            u.rate = 1.5; 
            u.volume = 0.6;
            window.speechSynthesis.speak(u);
         }

     } else {
         // Wrong Answer Hit!
         setCombo(0);
         setMultiplier(1);
         setHealth(h => {
             const newHealth = h - 10;
             if (newHealth <= 0) {
                 setTimeout(() => endGame(false), 0);
                 return 0;
             }
             return newHealth;
         });
     }
  }, [multiplier]);

  const handleNoteMiss = useCallback((note: NoteData) => {
      // If we missed a note...
      if (note.isCorrect) {
          // ...and it was the CORRECT answer, we are penalized.
          setCombo(0);
          setMultiplier(1);
          setHealth(h => {
              const newHealth = h - 15;
              if (newHealth <= 0) {
                 setTimeout(() => endGame(false), 0);
                 return 0;
              }
              return newHealth;
          });
      }
  }, []);

  const startGame = async () => {
    if (!isCameraReady) return;
    
    // Regenerate chart to be fresh
    setChart(generateDemoChart());
    setScore(0);
    setCombo(0);
    setMultiplier(1);
    setHealth(100);
    setInstruction("Get Ready...");

    try {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 0.3; // Keep music low
          await audioRef.current.play();
          setGameStatus(GameStatus.PLAYING);
          
          // Warm up speech synthesis
          window.speechSynthesis.cancel();
          window.speechSynthesis.resume();
      }
    } catch (e) {
        console.error("Audio play failed", e);
        alert("Could not start audio. Please interact with the page first.");
    }
  };

  const endGame = (victory: boolean) => {
      setGameStatus(victory ? GameStatus.VICTORY : GameStatus.GAME_OVER);
      if (audioRef.current) {
          audioRef.current.pause();
      }
      window.speechSynthesis.cancel();
  };

  useEffect(() => {
      if (gameStatus === GameStatus.LOADING && isCameraReady) {
          setGameStatus(GameStatus.IDLE);
      }
  }, [isCameraReady, gameStatus]);

  // Determine what text to show in the HUD box
  const getDisplayedInstruction = () => {
      if (gameStatus !== GameStatus.PLAYING) return "";
      if (instruction === "Get Ready...") return instruction;
      
      if (gameMode === 'LISTENING') {
          return "??? (Listen!)";
      }
      return instruction;
  };

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans select-none">
      {/* Hidden Video for Processing */}
      <video 
        ref={videoRef} 
        className="absolute opacity-0 pointer-events-none"
        playsInline
        muted
        autoPlay
        style={{ width: '640px', height: '480px' }}
      />

      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]}>
          {gameStatus !== GameStatus.LOADING && (
             <GameScene 
                gameStatus={gameStatus}
                audioRef={audioRef}
                handPositionsRef={handPositionsRef}
                chart={chart}
                onNoteHit={handleNoteHit}
                onNoteMiss={handleNoteMiss}
                onSongEnd={() => endGame(true)}
                setInstruction={setInstruction}
             />
          )}
      </Canvas>

      {/* Webcam Mini-Map Preview */}
      <WebcamPreview 
          videoRef={videoRef} 
          resultsRef={lastResultsRef} 
          isCameraReady={isCameraReady} 
      />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
          
          {/* HUD (Top) */}
          <div className="flex justify-between items-start text-white w-full">
             {/* Health Bar */}
             <div className="w-1/3 max-w-xs">
                 <div className="h-4 bg-gray-800 rounded-full overflow-hidden border-2 border-gray-700">
                     <div 
                        className={`h-full transition-all duration-300 ease-out ${health > 50 ? 'bg-green-500' : health > 20 ? 'bg-yellow-500' : 'bg-red-600'}`}
                        style={{ width: `${health}%` }}
                     />
                 </div>
                 <p className="text-xs mt-1 opacity-70 font-bold">STUDENT HEALTH</p>
             </div>

             {/* ACTIVE INSTRUCTION */}
             {gameStatus === GameStatus.PLAYING && (
                 <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center w-full max-w-2xl">
                      <div className={`border-2 px-8 py-6 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all duration-500 ${gameMode === 'LISTENING' ? 'bg-purple-900/80 border-purple-400' : 'bg-blue-900/80 border-blue-400'}`}>
                          <div className="flex items-center justify-center gap-2 mb-2">
                               {gameMode === 'LISTENING' ? <Ear className="w-5 h-5 text-purple-300 animate-bounce" /> : <BookOpen className="w-5 h-5 text-blue-300" />}
                               <p className={`${gameMode === 'LISTENING' ? 'text-purple-200' : 'text-blue-200'} text-sm font-bold tracking-widest uppercase`}>
                                   {gameMode === 'LISTENING' ? "Listening Challenge" : "Complete the Sentence"}
                               </p>
                          </div>
                          <h2 className={`text-3xl md:text-4xl font-black text-white drop-shadow-lg transition-opacity duration-300 ${instruction !== "Get Ready..." && gameMode === 'LISTENING' ? "opacity-50 blur-sm" : "opacity-100"}`}>
                              {getDisplayedInstruction()}
                          </h2>
                      </div>
                 </div>
             )}

             {/* Score & Combo */}
             <div className="text-center w-1/3">
                 <h1 className="text-5xl font-bold tracking-wider drop-shadow-lg">
                     {score.toLocaleString()}
                 </h1>
                 <div className="mt-2 flex flex-col items-center">
                     <p className={`text-2xl font-bold ${combo > 5 ? 'text-yellow-400 scale-110' : 'text-gray-300'} transition-all`}>
                         {combo}x COMBO
                     </p>
                 </div>
             </div>
          </div>

          {/* Menus (Centered) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              
              {gameStatus === GameStatus.LOADING && (
                  <div className="bg-slate-900/90 p-10 rounded-2xl flex flex-col items-center border border-blue-900/50 backdrop-blur-md shadow-2xl">
                      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-6"></div>
                      <h2 className="text-2xl text-white font-bold mb-2">Loading Classroom</h2>
                      <p className="text-blue-300">{!isCameraReady ? "Initializing Camera..." : "Preparing Lesson..."}</p>
                  </div>
              )}

              {gameStatus === GameStatus.IDLE && (
                  <div className="bg-slate-900/95 p-8 md:p-12 rounded-3xl text-center border-2 border-blue-500/30 backdrop-blur-xl max-w-4xl w-full shadow-2xl overflow-y-auto max-h-screen">
                      <div className="mb-4 flex justify-center">
                         <GraduationCap className="w-20 h-20 text-blue-400" />
                      </div>
                      <h1 className="text-5xl md:text-6xl font-black text-white mb-2 tracking-tighter">
                          CONJUGATION <span className="text-blue-500">DOJO</span>
                      </h1>
                      <p className="text-xl text-blue-200 mb-8 italic">"Master the language with your bare hands!"</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left bg-white/5 p-6 rounded-xl mb-8 border border-white/10">
                          <div className="space-y-4">
                              <h3 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2"><Settings className="w-4 h-4"/> Lesson Settings</h3>
                              
                              {/* Mode Selection */}
                              <div>
                                  <label className="text-gray-400 text-xs uppercase font-bold mb-2 block">Learning Mode</label>
                                  <div className="flex gap-2">
                                      <button 
                                        onClick={() => setGameMode('VISUAL')}
                                        className={`flex-1 py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 ${gameMode === 'VISUAL' ? 'bg-blue-600 border-blue-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700'}`}
                                      >
                                          <BookOpen size={18} /> Reading
                                      </button>
                                      <button 
                                        onClick={() => setGameMode('LISTENING')}
                                        className={`flex-1 py-3 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 ${gameMode === 'LISTENING' ? 'bg-purple-600 border-purple-400 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700'}`}
                                      >
                                          <Ear size={18} /> Listening
                                      </button>
                                  </div>
                              </div>

                              {/* Music Selection */}
                              <div>
                                  <label className="text-gray-400 text-xs uppercase font-bold mb-2 block">Background Music</label>
                                  <div className="space-y-2">
                                      {MUSIC_TRACKS.map((track, idx) => (
                                          <button
                                              key={track.name}
                                              onClick={() => setSelectedTrackIndex(idx)}
                                              className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between border transition-all ${selectedTrackIndex === idx ? 'bg-slate-700 border-blue-400 text-white' : 'bg-slate-800/50 border-transparent text-gray-400 hover:bg-slate-700'}`}
                                          >
                                              <span className="flex items-center gap-2"><Music size={16} /> {track.name}</span>
                                              {selectedTrackIndex === idx && <div className="w-2 h-2 bg-green-400 rounded-full"></div>}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-4 border-l border-white/10 pl-0 md:pl-6">
                              <h3 className="text-white font-bold border-b border-white/10 pb-2 flex items-center gap-2"><Hand className="w-4 h-4"/> How to Play</h3>
                              <ul className="space-y-2 text-sm text-gray-300">
                                  <li className="flex items-start gap-2">
                                      <span className="bg-yellow-500/20 text-yellow-300 font-bold px-2 rounded">1</span>
                                      {gameMode === 'VISUAL' ? "Read the sentence with the blank." : "LISTEN carefully to the sentence."}
                                  </li>
                                  <li className="flex items-start gap-2">
                                      <span className="bg-blue-500/20 text-blue-300 font-bold px-2 rounded">2</span>
                                      Wait for answer blocks to fly at you.
                                  </li>
                                  <li className="flex items-start gap-2">
                                      <span className="bg-green-500/20 text-green-300 font-bold px-2 rounded">3</span>
                                      Slash the <span className="text-green-400 font-bold">CORRECT</span> word.
                                  </li>
                                  <li className="flex items-start gap-2">
                                      <span className="bg-red-500/20 text-red-300 font-bold px-2 rounded">4</span>
                                      Avoid the wrong ones!
                                  </li>
                              </ul>
                          </div>
                      </div>

                      {!isCameraReady ? (
                           <div className="flex items-center justify-center text-red-400 gap-2 bg-red-900/20 p-4 rounded-lg">
                               <VideoOff /> Camera permissions needed.
                           </div>
                      ) : (
                          <button 
                              onClick={startGame}
                              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-2xl font-bold py-4 px-16 rounded-full transition-all transform hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.6)] flex items-center justify-center mx-auto gap-3"
                          >
                              <Play fill="currentColor" /> BEGIN LESSON
                          </button>
                      )}
                  </div>
              )}

              {(gameStatus === GameStatus.GAME_OVER || gameStatus === GameStatus.VICTORY) && (
                  <div className="bg-slate-900/95 p-12 rounded-3xl text-center border-2 border-white/10 backdrop-blur-xl shadow-2xl">
                      <h2 className={`text-6xl font-bold mb-4 ${gameStatus === GameStatus.VICTORY ? 'text-green-400' : 'text-red-500'}`}>
                          {gameStatus === GameStatus.VICTORY ? "LESSON COMPLETE" : "YOU FAILED!"}
                      </h2>
                      <p className="text-white text-3xl mb-2">Score: {score.toLocaleString()}</p>
                      <p className="text-gray-400 mb-8 text-lg">
                          {gameStatus === GameStatus.VICTORY ? "Excellent grammar skills!" : "Study your verbs and try again."}
                      </p>
                      <button 
                          onClick={() => setGameStatus(GameStatus.IDLE)}
                          className="bg-white/10 hover:bg-white/20 text-white text-xl py-3 px-8 rounded-full flex items-center justify-center mx-auto gap-2 transition-colors border border-white/20"
                      >
                          <RefreshCw /> Return to Menu
                      </button>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default App;
