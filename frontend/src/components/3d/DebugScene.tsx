import { Canvas } from '@react-three/fiber';
import { useEffect } from 'react';

function TestBox() {
  useEffect(() => {
    console.log('TestBox component mounted');
  }, []);

  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
}

export default function DebugScene() {
  useEffect(() => {
    console.log('DebugScene component mounted');
  }, []);

  return (
    <div className="w-full h-full bg-gray-200">
      <div className="p-4 text-center">
        <p>Debug Scene Container</p>
      </div>
      <div className="h-96">
        <Canvas camera={{ position: [2, 2, 2] }}>
          <ambientLight />
          <TestBox />
        </Canvas>
      </div>
    </div>
  );
}