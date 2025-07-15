import { useMemo } from 'react';
import { useRestaurantDesignStore } from '../../../store/restaurantDesignStore';

export default function GridHelper() {
  const { showGrid, gridSize, isEditMode } = useRestaurantDesignStore();
  
  const gridLines = useMemo(() => {
    if (!showGrid || !isEditMode) return null;
    
    const size = 20;
    const divisions = Math.floor(size / gridSize);
    const halfSize = size / 2;
    
    const positions: number[] = [];
    
    // Vertical lines
    for (let i = 0; i <= divisions; i++) {
      const x = (i * gridSize) - halfSize;
      positions.push(x, 0, -halfSize, x, 0, halfSize);
    }
    
    // Horizontal lines
    for (let i = 0; i <= divisions; i++) {
      const z = (i * gridSize) - halfSize;
      positions.push(-halfSize, 0, z, halfSize, 0, z);
    }
    
    return new Float32Array(positions);
  }, [showGrid, gridSize, isEditMode]);
  
  if (!gridLines || !isEditMode) return null;
  
  return (
    <group>
      {/* Grid lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={gridLines}
            count={gridLines.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#e5e7eb" opacity={0.5} transparent />
      </lineSegments>
      
      {/* Center markers */}
      <mesh position={[0, 0.01, 0]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="#3b82f6" opacity={0.7} transparent />
      </mesh>
      
      {/* Axis indicators */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={new Float32Array([
              0, 0, 0, 2, 0, 0, // X axis (red)
              0, 0, 0, 0, 0, 2, // Z axis (blue)
            ])}
            count={4}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors />
      </lineSegments>
    </group>
  );
}