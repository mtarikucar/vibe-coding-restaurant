import { useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { useRestaurantDesignStore, RestaurantObject, ObjectType } from '../../../store/restaurantDesignStore';
import { GradientMaterial, DottedMaterial } from '../materials/CustomMaterials';
import { TexturedMaterial, WoodMaterial, MarbleMaterial } from '../materials/TextureUtils';

interface EditableObjectProps {
  object: RestaurantObject;
}

function ObjectGeometry({ type, scale, color }: { type: ObjectType; scale: [number, number, number]; color?: string }) {
  const defaultColor = color || '#f3f4f6';
  
  switch (type) {
    case 'table-2':
    case 'table-4':
    case 'table-6':
    case 'table-8':
      return (
        <group>
          {/* Table Top */}
          <mesh position={[0, 0.4, 0]}>
            <cylinderGeometry args={[0.8 * scale[0], 0.8 * scale[2], 0.08, 8]} />
            <GradientMaterial color1={defaultColor} color2="#ffffff" intensity={0.8} />
          </mesh>
          {/* Table Base */}
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} />
            <DottedMaterial color1="#f3e8ff" color2="#ddd6fe" scale={4} />
          </mesh>
        </group>
      );
      
    case 'chair':
      return (
        <group>
          {/* Seat */}
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[0.3 * scale[0], 0.05, 0.3 * scale[2]]} />
            <GradientMaterial color1={defaultColor} color2="#fdf2f8" intensity={0.6} />
          </mesh>
          {/* Back */}
          <mesh position={[0, 0.45, -0.1 * scale[2]]}>
            <boxGeometry args={[0.3 * scale[0], 0.4, 0.05]} />
            <GradientMaterial color1={defaultColor} color2="#fdf2f8" intensity={0.6} />
          </mesh>
        </group>
      );
      
    case 'booth':
      return (
        <group>
          {/* Seat */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[2 * scale[0], 0.6, 0.8 * scale[2]]} />
            <TexturedMaterial color1={defaultColor} color2="#ffffff" pattern="stripes" />
          </mesh>
          {/* Back */}
          <mesh position={[0, 0.8, -0.3 * scale[2]]}>
            <boxGeometry args={[2 * scale[0], 1, 0.1]} />
            <TexturedMaterial color1={defaultColor} color2="#ffffff" pattern="stripes" />
          </mesh>
        </group>
      );
      
    case 'kitchen-counter':
      return (
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[3 * scale[0], 0.8, 1.5 * scale[2]]} />
          <MarbleMaterial baseColor={defaultColor} />
        </mesh>
      );
      
    case 'stove':
      return (
        <group>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[1 * scale[0], 0.8, 1 * scale[2]]} />
            <meshLambertMaterial color={defaultColor} />
          </mesh>
          {/* Burners */}
          {Array.from({ length: 4 }).map((_, i) => {
            const x = ((i % 2) - 0.5) * 0.3 * scale[0];
            const z = (Math.floor(i / 2) - 0.5) * 0.3 * scale[2];
            return (
              <mesh key={i} position={[x, 0.82, z]}>
                <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
                <meshLambertMaterial color="#374151" />
              </mesh>
            );
          })}
        </group>
      );
      
    case 'refrigerator':
      return (
        <group>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1 * scale[0], 2 * scale[1], 1 * scale[2]]} />
            <GradientMaterial color1={defaultColor} color2="#e2e8f0" intensity={0.5} />
          </mesh>
          {/* Handle */}
          <mesh position={[0.4 * scale[0], 1.2, 0]}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshLambertMaterial color="#6b7280" />
          </mesh>
        </group>
      );
      
    case 'cashier-desk':
      return (
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[2.5 * scale[0], 0.8, 1.2 * scale[2]]} />
          <MarbleMaterial baseColor={defaultColor} />
        </mesh>
      );
      
    case 'storage-shelf':
      return (
        <group>
          {/* Frame */}
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[0.05, 2 * scale[1], 0.4 * scale[2]]} />
            <WoodMaterial baseColor="#8b5a3c" />
          </mesh>
          {/* Shelves */}
          {Array.from({ length: 4 }).map((_, i) => (
            <mesh key={i} position={[0, 0.3 + i * 0.4, 0]}>
              <boxGeometry args={[1 * scale[0], 0.05, 0.4 * scale[2]]} />
              <WoodMaterial baseColor="#a0662f" />
            </mesh>
          ))}
        </group>
      );
      
    case 'plant':
      return (
        <group>
          {/* Pot */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.2 * scale[0], 0.15 * scale[0], 0.3, 8]} />
            <TexturedMaterial color1="#fed7d7" color2="#fecaca" pattern="stripes" />
          </mesh>
          {/* Plant */}
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.3 * scale[0], 8, 8]} />
            <TexturedMaterial color1="#bbf7d0" color2="#a7f3d0" pattern="dots" />
          </mesh>
        </group>
      );
      
    case 'wall':
      return (
        <mesh position={[0, 1.5, 0]}>
          <boxGeometry args={[4 * scale[0], 3 * scale[1], 0.2]} />
          <GradientMaterial color1={defaultColor} color2="#f8fafc" intensity={0.3} />
        </mesh>
      );
      
    case 'door':
      return (
        <group>
          <mesh position={[0, 1, 0]}>
            <boxGeometry args={[1 * scale[0], 2 * scale[1], 0.1]} />
            <WoodMaterial baseColor={defaultColor} />
          </mesh>
          {/* Handle */}
          <mesh position={[0.3 * scale[0], 1, 0.05]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshLambertMaterial color="#fbbf24" />
          </mesh>
        </group>
      );
      
    case 'bar':
      return (
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[4 * scale[0], 1.2 * scale[1], 0.8 * scale[2]]} />
          <WoodMaterial baseColor={defaultColor} />
        </mesh>
      );
      
    case 'bar-stool':
      return (
        <group>
          {/* Seat */}
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.25 * scale[0], 0.25 * scale[0], 0.05, 8]} />
            <GradientMaterial color1={defaultColor} color2="#ffffff" intensity={0.7} />
          </mesh>
          {/* Leg */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
            <meshLambertMaterial color="#6b7280" />
          </mesh>
        </group>
      );
      
    default:
      return (
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={scale} />
          <meshLambertMaterial color={defaultColor} />
        </mesh>
      );
  }
}

export default function EditableObject({ object }: EditableObjectProps) {
  const groupRef = useRef<Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Vector3>(new Vector3());
  
  const { camera, raycaster, pointer } = useThree();
  const {
    isEditMode,
    selectedObjectId,
    snapToGrid,
    gridSize,
    selectObject,
    updateObject,
    setDraggedObject,
  } = useRestaurantDesignStore();
  
  const isSelected = selectedObjectId === object.id;
  
  useFrame(() => {
    if (groupRef.current && isEditMode) {
      // Highlight selected/hovered objects
      const scale = isSelected ? 1.05 : isHovered ? 1.02 : 1;
      groupRef.current.scale.setScalar(scale);
      
      // Add glow effect for selected objects
      if (isSelected) {
        groupRef.current.rotation.y = Math.sin(Date.now() * 0.002) * 0.02;
      } else {
        groupRef.current.rotation.y = 0;
      }
    }
  });
  
  const handlePointerDown = (event: any) => {
    if (!isEditMode) return;
    
    event.stopPropagation();
    selectObject(object.id);
    setIsDragging(true);
    setDraggedObject(object.id);
    setDragStart(new Vector3().fromArray(object.position));
  };
  
  const handlePointerMove = (event: any) => {
    if (!isDragging || !isEditMode) return;
    
    event.stopPropagation();
    
    // Calculate new position based on pointer movement
    raycaster.setFromCamera(pointer, camera);
    const floorPlane = new Vector3(0, 1, 0);
    const intersect = new Vector3();
    
    // Simple ground plane intersection
    const t = -raycaster.ray.origin.y / raycaster.ray.direction.y;
    intersect.copy(raycaster.ray.origin).add(raycaster.ray.direction.multiplyScalar(t));
    
    let newPosition: [number, number, number] = [
      intersect.x,
      object.position[1],
      intersect.z,
    ];
    
    // Snap to grid if enabled
    if (snapToGrid) {
      newPosition[0] = Math.round(newPosition[0] / gridSize) * gridSize;
      newPosition[2] = Math.round(newPosition[2] / gridSize) * gridSize;
    }
    
    updateObject(object.id, { position: newPosition });
  };
  
  const handlePointerUp = () => {
    setIsDragging(false);
    setDraggedObject(null);
  };
  
  const handleDoubleClick = (event: any) => {
    if (!isEditMode) return;
    event.stopPropagation();
    
    // Rotate object on double click
    const newRotation: [number, number, number] = [
      object.rotation[0],
      object.rotation[1] + Math.PI / 2,
      object.rotation[2],
    ];
    updateObject(object.id, { rotation: newRotation });
  };
  
  return (
    <group
      ref={groupRef}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      onPointerEnter={() => isEditMode && setIsHovered(true)}
      onPointerLeave={() => isEditMode && setIsHovered(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      <ObjectGeometry type={object.type} scale={object.scale} color={object.color} />
      
      {/* Selection outline */}
      {isEditMode && isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[
            Math.max(...object.scale) + 0.2,
            Math.max(...object.scale) + 0.2,
            Math.max(...object.scale) + 0.2,
          ]} />
          <meshBasicMaterial 
            color="#3b82f6" 
            wireframe={true} 
            transparent={true} 
            opacity={0.5} 
          />
        </mesh>
      )}
      
      {/* Hover outline */}
      {isEditMode && isHovered && !isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[
            Math.max(...object.scale) + 0.1,
            Math.max(...object.scale) + 0.1,
            Math.max(...object.scale) + 0.1,
          ]} />
          <meshBasicMaterial 
            color="#10b981" 
            wireframe={true} 
            transparent={true} 
            opacity={0.3} 
          />
        </mesh>
      )}
    </group>
  );
}