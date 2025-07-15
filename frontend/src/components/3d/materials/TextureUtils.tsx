import * as THREE from 'three';
import { useMemo } from 'react';

// Create a canvas-based texture generator
export function useProceduralTexture(
  pattern: 'dots' | 'stripes' | 'checkerboard' | 'noise',
  color1: string,
  color2: string,
  size: number = 256
) {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Helper to convert hex to rgba
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 255, g: 255, b: 255 };
    };
    
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;
    
    for (let x = 0; x < size; x++) {
      for (let y = 0; y < size; y++) {
        const i = (y * size + x) * 4;
        let useColor1 = false;
        
        switch (pattern) {
          case 'dots':
            const dotSize = size / 16;
            const centerX = (x % dotSize) - dotSize / 2;
            const centerY = (y % dotSize) - dotSize / 2;
            const distance = Math.sqrt(centerX * centerX + centerY * centerY);
            useColor1 = distance < dotSize / 4;
            break;
            
          case 'stripes':
            useColor1 = Math.floor(x / (size / 16)) % 2 === 0;
            break;
            
          case 'checkerboard':
            const blockSize = size / 8;
            const blockX = Math.floor(x / blockSize);
            const blockY = Math.floor(y / blockSize);
            useColor1 = (blockX + blockY) % 2 === 0;
            break;
            
          case 'noise':
            // Simple noise pattern
            const noise = Math.random();
            useColor1 = noise > 0.5;
            break;
        }
        
        const color = useColor1 ? rgb1 : rgb2;
        data[i] = color.r;     // R
        data[i + 1] = color.g; // G
        data[i + 2] = color.b; // B
        data[i + 3] = 255;     // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    return texture;
  }, [pattern, color1, color2, size]);
}

// Material components using procedural textures
interface TexturedMaterialProps {
  color1: string;
  color2: string;
  pattern?: 'dots' | 'stripes' | 'checkerboard' | 'noise';
  metalness?: number;
  roughness?: number;
}

export function TexturedMaterial({ 
  color1, 
  color2, 
  pattern = 'dots',
  metalness = 0.1,
  roughness = 0.8
}: TexturedMaterialProps) {
  const texture = useProceduralTexture(pattern, color1, color2);
  
  return (
    <meshStandardMaterial
      map={texture}
      metalness={metalness}
      roughness={roughness}
    />
  );
}

// Wood-like material
export function WoodMaterial({ baseColor = '#8b5a3c' }: { baseColor?: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create wood grain pattern
    const gradient = ctx.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0, baseColor);
    gradient.addColorStop(0.3, '#a0662f');
    gradient.addColorStop(0.7, baseColor);
    gradient.addColorStop(1, '#654321');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    
    // Add wood grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 256; i += 8 + Math.random() * 16) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + Math.random() * 32 - 16, 256);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    
    return texture;
  }, [baseColor]);
  
  return (
    <meshStandardMaterial
      map={texture}
      roughness={0.7}
      metalness={0.1}
    />
  );
}

// Marble-like material
export function MarbleMaterial({ baseColor = '#f8f9fa' }: { baseColor?: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Base color
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);
    
    // Add marble veins
    ctx.strokeStyle = 'rgba(128,128,128,0.3)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 256, Math.random() * 256);
      
      // Create curved vein
      for (let j = 0; j < 5; j++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const cp1x = Math.random() * 256;
        const cp1y = Math.random() * 256;
        const cp2x = Math.random() * 256;
        const cp2y = Math.random() * 256;
        
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
      }
      
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
  }, [baseColor]);
  
  return (
    <meshStandardMaterial
      map={texture}
      roughness={0.2}
      metalness={0.8}
    />
  );
}