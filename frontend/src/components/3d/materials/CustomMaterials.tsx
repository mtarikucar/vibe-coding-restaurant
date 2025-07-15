import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

// Cute gradient shader for 2.5D look
export const gradientVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const gradientFragmentShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float time;
  uniform float intensity;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    // Create subtle gradient with soft transition
    float gradient = vUv.y + sin(vUv.x * 3.14159 + time * 0.5) * 0.1 * intensity;
    vec3 color = mix(color1, color2, gradient);
    
    // Add subtle highlight
    float highlight = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 2.0) * 0.1;
    color += highlight;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Checkerboard pattern shader for floors
export const checkerboardFragmentShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float scale;
  uniform float time;
  
  varying vec2 vUv;
  
  void main() {
    vec2 grid = floor(vUv * scale);
    float checker = mod(grid.x + grid.y, 2.0);
    
    // Soft transition between colors
    vec3 baseColor = mix(color1, color2, checker);
    
    // Add subtle breathing effect
    float pulse = sin(time * 2.0) * 0.02 + 0.98;
    baseColor *= pulse;
    
    // Add soft border effect
    vec2 border = abs(fract(vUv * scale) - 0.5);
    float borderFactor = 1.0 - smoothstep(0.45, 0.5, max(border.x, border.y));
    baseColor += borderFactor * 0.05;
    
    gl_FragColor = vec4(baseColor, 1.0);
  }
`;

// Dotted pattern shader
export const dottedFragmentShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float scale;
  uniform float time;
  
  varying vec2 vUv;
  
  void main() {
    vec2 center = fract(vUv * scale) - 0.5;
    float dist = length(center);
    
    float dot = smoothstep(0.2, 0.15, dist);
    float pulse = sin(time * 3.0 + dist * 10.0) * 0.1 + 0.9;
    
    vec3 color = mix(color1, color2, dot * pulse);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Striped pattern shader
export const stripedFragmentShader = `
  uniform vec3 color1;
  uniform vec3 color2;
  uniform float scale;
  uniform float time;
  uniform float angle;
  
  varying vec2 vUv;
  
  void main() {
    float rotatedU = vUv.x * cos(angle) - vUv.y * sin(angle);
    float stripe = sin(rotatedU * scale * 3.14159 * 2.0) * 0.5 + 0.5;
    
    // Smooth stripes with soft edges
    stripe = smoothstep(0.3, 0.7, stripe);
    
    // Add subtle animation
    float wave = sin(time * 2.0 + rotatedU * 5.0) * 0.05;
    stripe += wave;
    
    vec3 color = mix(color1, color2, stripe);
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

// Custom material components
interface CustomMaterialProps {
  color1: string;
  color2: string;
  intensity?: number;
  scale?: number;
  angle?: number;
}

export function GradientMaterial({ color1, color2, intensity = 1.0 }: CustomMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });
  
  const uniforms = {
    color1: { value: new THREE.Color(color1) },
    color2: { value: new THREE.Color(color2) },
    time: { value: 0 },
    intensity: { value: intensity },
  };
  
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={gradientVertexShader}
      fragmentShader={gradientFragmentShader}
    />
  );
}

export function CheckerboardMaterial({ color1, color2, scale = 10 }: CustomMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });
  
  const uniforms = {
    color1: { value: new THREE.Color(color1) },
    color2: { value: new THREE.Color(color2) },
    scale: { value: scale },
    time: { value: 0 },
  };
  
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={gradientVertexShader}
      fragmentShader={checkerboardFragmentShader}
    />
  );
}

export function DottedMaterial({ color1, color2, scale = 8 }: CustomMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });
  
  const uniforms = {
    color1: { value: new THREE.Color(color1) },
    color2: { value: new THREE.Color(color2) },
    scale: { value: scale },
    time: { value: 0 },
  };
  
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={gradientVertexShader}
      fragmentShader={dottedFragmentShader}
    />
  );
}

export function StripedMaterial({ color1, color2, scale = 5, angle = 0 }: CustomMaterialProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });
  
  const uniforms = {
    color1: { value: new THREE.Color(color1) },
    color2: { value: new THREE.Color(color2) },
    scale: { value: scale },
    angle: { value: angle },
    time: { value: 0 },
  };
  
  return (
    <shaderMaterial
      ref={materialRef}
      uniforms={uniforms}
      vertexShader={gradientVertexShader}
      fragmentShader={stripedFragmentShader}
    />
  );
}