import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect } from 'react';
import { useControlPanelStore } from '../../store/controlPanelStore';
import { useRestaurantDesignStore } from '../../store/restaurantDesignStore';
import { CheckerboardMaterial, GradientMaterial, DottedMaterial } from './materials/CustomMaterials';
import { TexturedMaterial, WoodMaterial } from './materials/TextureUtils';
import EditableObject from './editable/EditableObject';
import EditingToolbar from './editable/EditingToolbar';
import GridHelper from './editable/GridHelper';

function BasicTable({ position, color }: { position: [number, number, number], color: string }) {
  return (
    <group position={position}>
      {/* Table Top with gradient material */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.08, 8]} />
        <GradientMaterial color1={color} color2="#ffffff" intensity={0.5} />
      </mesh>
      
      {/* Table Base with dotted pattern */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} />
        <DottedMaterial color1="#f3e8ff" color2="#ddd6fe" scale={4} />
      </mesh>
    </group>
  );
}

function Scene() {
  const { tables } = useControlPanelStore();
  const { currentLayout, isEditMode } = useRestaurantDesignStore();
  
  // Cute pastel color palette for default tables
  const statusColors = {
    available: '#c7f7c7', // soft mint green
    occupied: '#ffd3a5',  // soft peach
    cleaning: '#e8e2ff', // soft lavender
    reserved: '#a5d8ff', // soft sky blue
  };
  
  const tablePositions: [number, number, number][] = [
    [-3, 0, 3], [-1, 0, 3], [1, 0, 3], [3, 0, 3],
    [-3, 0, 1], [-1, 0, 1], [1, 0, 1], [3, 0, 1],
  ];
  
  return (
    <>
      {/* Soft 2.5D Lighting */}
      <ambientLight intensity={0.7} color="#fdf2f8" />
      <directionalLight position={[10, 15, 8]} intensity={0.5} color="#fef3c7" />
      <pointLight position={[0, 8, 0]} intensity={0.3} color="#e0e7ff" />
      
      {/* Grid Helper for Edit Mode */}
      <GridHelper />
      
      {/* Floor with checkerboard pattern */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <boxGeometry args={[currentLayout.floorSize[0], 0.2, currentLayout.floorSize[1]]} />
        <CheckerboardMaterial color1="#fff7ed" color2="#fef3c7" scale={15} />
      </mesh>
      
      {/* Editable Objects */}
      {currentLayout.objects.map((object) => (
        <EditableObject key={object.id} object={object} />
      ))}
      
      {/* Default tables if not in edit mode */}
      {!isEditMode && tables.slice(0, 8).map((table, index) => (
        <BasicTable
          key={table.id}
          position={tablePositions[index]}
          color={statusColors[table.status]}
        />
      ))}
      
      {/* Default decorative elements if not in edit mode and no objects */}
      {!isEditMode && currentLayout.objects.length === 0 && (
        <>
          {/* Reception desk with gradient */}
          <mesh position={[0, 0.4, 5]}>
            <boxGeometry args={[2, 0.8, 0.8]} />
            <GradientMaterial color1="#f3e8ff" color2="#e0e7ff" intensity={0.7} />
          </mesh>
          
          {/* Potted plants with textures */}
          <group position={[-4, 0, 5]}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.6, 8]} />
              <TexturedMaterial color1="#fed7d7" color2="#fecaca" pattern="stripes" />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <sphereGeometry args={[0.3, 8, 8]} />
              <TexturedMaterial color1="#bbf7d0" color2="#a7f3d0" pattern="dots" />
            </mesh>
          </group>
          
          <group position={[4, 0, 5]}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.6, 8]} />
              <TexturedMaterial color1="#fed7d7" color2="#fecaca" pattern="stripes" />
            </mesh>
            <mesh position={[0, 0.8, 0]}>
              <sphereGeometry args={[0.3, 8, 8]} />
              <TexturedMaterial color1="#bbf7d0" color2="#a7f3d0" pattern="dots" />
            </mesh>
          </group>
        </>
      )}
    </>
  );
}

export default function RestaurantScene() {
  const { simulateRealTimeUpdates } = useControlPanelStore();
  const { isEditMode } = useRestaurantDesignStore();
  
  useEffect(() => {
    // Start real-time simulation
    simulateRealTimeUpdates();
  }, [simulateRealTimeUpdates]);
  
  return (
    <div className="w-full h-full relative">
      {/* Editing Toolbar */}
      <EditingToolbar />
      
      <Canvas
        orthographic
        camera={{
          position: [15, 15, 15],
          zoom: 40,
          up: [0, 1, 0],
          far: 1000,
        }}
        className="bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50"
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={!isEditMode} // Disable rotation in edit mode for easier object manipulation
          minZoom={20}
          maxZoom={80}
          target={[0, 0, 0]}
        />
        <Scene />
      </Canvas>
    </div>
  );
}