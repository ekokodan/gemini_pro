
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useMemo, useRef } from 'react';
import { Text, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NoteData, COLORS } from '../types';
import { LANE_X_POSITIONS, LAYER_Y_POSITIONS, NOTE_SIZE } from '../constants';

interface NoteProps {
  data: NoteData;
  zPos: number;
  currentTime: number;
}

const Debris: React.FC<{ data: NoteData, timeSinceHit: number, color: string }> = ({ data, timeSinceHit, color }) => {
    const groupRef = useRef<THREE.Group>(null);
    
    useFrame(() => {
        if (groupRef.current) {
             groupRef.current.scale.setScalar(Math.max(0.01, 1 - timeSinceHit * 2));
             groupRef.current.position.y += 0.05; // float up
        }
    });

    return (
        <group ref={groupRef}>
             {/* Text flying off */}
            <Text 
                position={[0, 0.5, 0]} 
                fontSize={0.5} 
                color={data.isCorrect ? "#4ade80" : "#ef4444"} // Green text if correct hit, Red if wrong hit
                anchorX="center" 
                anchorY="middle"
            >
                {data.isCorrect ? "CORRECT!" : "WRONG!"}
            </Text>
            {/* Particles */}
            {Array.from({ length: 8 }).map((_, i) => (
                <mesh key={i} position={[Math.random()-0.5, Math.random()-0.5, Math.random()-0.5]}>
                    <boxGeometry args={[0.1, 0.1, 0.1]} />
                    <meshBasicMaterial color={color} transparent opacity={0.8} />
                </mesh>
            ))}
        </group>
    );
};

const Note: React.FC<NoteProps> = ({ data, zPos, currentTime }) => {
  // Visual color depends on hand type requirement
  const baseColor = data.type === 'left' ? COLORS.left : COLORS.right;
  
  const position: [number, number, number] = useMemo(() => {
     return [
         LANE_X_POSITIONS[data.lineIndex],
         LAYER_Y_POSITIONS[data.lineLayer],
         zPos
     ];
  }, [data.lineIndex, data.lineLayer, zPos]);

  if (data.missed) return null;

  if (data.hit && data.hitTime) {
      return (
          <group position={position}>
              <Debris data={data} timeSinceHit={currentTime - data.hitTime} color={baseColor} />
          </group>
      );
  }

  return (
    <group position={position}>
      <group rotation={[0, 0, 0]}> 
        <RoundedBox args={[1.1, 0.8, 0.5]} radius={0.1} smoothness={4}>
            <meshStandardMaterial 
                color="#1f2937" // Dark background for text readability
                emissive={baseColor}
                emissiveIntensity={0.2}
                roughness={0.2}
                metalness={0.8}
            />
        </RoundedBox>
        
        {/* Border/Glow to indicate Hand Type */}
        <mesh position={[0, 0, 0]}>
             <boxGeometry args={[1.2, 0.9, 0.4]} />
             <meshBasicMaterial color={baseColor} wireframe />
        </mesh>

        {/* THE WORD */}
        <Text
            position={[0, 0, 0.26]} // Slightly in front of box
            fontSize={0.35} // Slightly smaller to fit longer words
            maxWidth={1.0} // Wrap text if too long
            lineHeight={1.1}
            color="white"
            anchorX="center"
            anchorY="middle"
            fontWeight="bold"
            outlineWidth={0.02}
            outlineColor="black"
            textAlign="center"
        >
            {data.text}
        </Text>
      </group>
    </group>
  );
};

export default React.memo(Note, (prev, next) => {
    if (next.data.hit) return false;
    return prev.zPos === next.zPos && prev.data.hit === next.data.hit && prev.data.missed === next.data.missed;
});
