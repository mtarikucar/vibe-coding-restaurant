import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useControlPanelStore } from '../../store/controlPanelStore';

function BasicTable({ position, color }: { position: [number, number, number], color: string }) {
  return (
    <group position={position}>
      {/* Table Top */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.08, 8]} />
        <meshLambertMaterial color={color} />
      </mesh>
      
      {/* Table Base */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} />
        <meshLambertMaterial color="#8b5cf6" />
      </mesh>
    </group>
  );
}

function BasicKitchen({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Kitchen Counter */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[3, 0.8, 1.5]} />
        <meshLambertMaterial color="#f3f4f6" />
      </mesh>
      
      {/* Stove */}
      <mesh position={[-0.8, 0.82, 0]}>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <meshLambertMaterial color="#374151" />
      </mesh>
    </group>
  );
}

function Scene() {
  const { tables } = useControlPanelStore();
  
  const statusColors = {
    available: '#a7f3d0',
    occupied: '#fbbf24', 
    cleaning: '#e5e7eb',
    reserved: '#bfdbfe',
  };
  
  const tablePositions: [number, number, number][] = [
    [-3, 0, 3], [-1, 0, 3], [1, 0, 3], [3, 0, 3],
    [-3, 0, 1], [-1, 0, 1], [1, 0, 1], [3, 0, 1],
  ];
  
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      
      {/* Floor */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[20, 0.2, 16]} />
        <meshLambertMaterial color="#f8fafc" />
      </mesh>
      
      {/* Tables */}
      {tables.slice(0, 8).map((table, index) => (
        <BasicTable
          key={table.id}
          position={tablePositions[index]}
          color={statusColors[table.status]}
        />
      ))}
      
      {/* Kitchen */}
      <BasicKitchen position={[-6, 0, -5]} />
      
      {/* Test Box */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial color="#ef4444" />
      </mesh>
    </>
  );
}

export default function MinimalRestaurant() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [12, 8, 12], fov: 50 }}
        className="bg-gradient-to-b from-blue-100 to-blue-50"
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={8}
          maxDistance={25}
        />
        <Scene />
      </Canvas>
    </div>
  );
}