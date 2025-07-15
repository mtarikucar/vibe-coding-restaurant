import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import StatusTag from './StatusTag';
import { KitchenData } from '../../store/controlPanelStore';
import { GradientMaterial, StripedMaterial, DottedMaterial } from './materials/CustomMaterials';

interface KitchenProps {
  kitchen: KitchenData;
  position: [number, number, number];
}

export default function Kitchen({ kitchen, position }: KitchenProps) {
  const groupRef = useRef<Group>(null);
  const steamRef = useRef<Group>(null);
  
  // Animate steam effect
  useFrame((state) => {
    if (steamRef.current) {
      steamRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
      steamRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });
  
  const getOrdersText = () => {
    return `Kitchen\nPending: ${kitchen.pendingOrders}\nCooking: ${kitchen.cookingOrders}\nReady: ${kitchen.readyOrders}`;
  };
  
  const getStatusColor = () => {
    const totalOrders = kitchen.pendingOrders + kitchen.cookingOrders;
    if (totalOrders > 8) return '#fca5a5'; // soft red
    if (totalOrders > 5) return '#fbbf24'; // soft amber
    return '#a7f3d0'; // soft emerald
  };
  
  return (
    <group ref={groupRef} position={position}>
      {/* Kitchen Counter with marble-like gradient */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[3, 0.8, 1.5]} />
        <GradientMaterial color1="#f1f5f9" color2="#e2e8f0" intensity={0.8} />
      </mesh>
      
      {/* Stove with subtle striped pattern */}
      <mesh position={[-0.8, 0.82, 0]}>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <StripedMaterial color1="#e2e8f0" color2="#cbd5e1" scale={8} angle={0} />
      </mesh>
      
      {/* Burners */}
      {Array.from({ length: 4 }).map((_, i) => {
        const x = (i % 2) * 0.3 - 0.15;
        const z = Math.floor(i / 2) * 0.3 - 0.15;
        const isActive = i < kitchen.cookingOrders;
        
        return (
          <mesh key={i} position={[-0.8 + x, 0.85, z]}>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
            <meshLambertMaterial color={isActive ? '#fca5a5' : '#d1d5db'} />
          </mesh>
        );
      })}
      
      {/* Steam effect for active burners */}
      {kitchen.cookingOrders > 0 && (
        <group ref={steamRef} position={[-0.8, 0.9, 0]}>
          {Array.from({ length: Math.min(kitchen.cookingOrders, 4) }).map((_, i) => {
            const x = (i % 2) * 0.3 - 0.15;
            const z = Math.floor(i / 2) * 0.3 - 0.15;
            
            return (
              <mesh key={i} position={[x, 0.2, z]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshBasicMaterial 
                  color="#f8fafc" 
                  opacity={0.7} 
                  transparent={true} 
                />
              </mesh>
            );
          })}
        </group>
      )}
      
      {/* Prep Area with dotted pattern */}
      <mesh position={[0.8, 0.82, 0]}>
        <boxGeometry args={[0.8, 0.04, 0.8]} />
        <DottedMaterial color1="#fde68a" color2="#fef3c7" scale={6} />
      </mesh>
      
      {/* Order Tickets */}
      {Array.from({ length: Math.min(kitchen.pendingOrders, 6) }).map((_, i) => (
        <mesh key={i} position={[0.8 + (i % 3) * 0.15 - 0.15, 0.86, (Math.floor(i / 3)) * 0.1 - 0.05]}>
          <planeGeometry args={[0.08, 0.12]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
      ))}
      
      {/* Ready Orders Area with gradient */}
      <mesh position={[0, 0.82, 0.6]}>
        <boxGeometry args={[1.5, 0.04, 0.3]} />
        <GradientMaterial color1="#a7f3d0" color2="#bbf7d0" intensity={1.0} />
      </mesh>
      
      {/* Ready Order Plates */}
      {Array.from({ length: kitchen.readyOrders }).map((_, i) => (
        <mesh key={i} position={[i * 0.3 - 0.45, 0.86, 0.6]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 8]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
      ))}
      
      {/* Kitchen Hood */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[3.2, 0.4, 1.7]} />
        <meshLambertMaterial color="#e5e7eb" />
      </mesh>
      
      {/* Status Tags */}
      <StatusTag
        text={getOrdersText()}
        position={[0, 2.2, 0]}
        color="#ffffff"
        backgroundColor={getStatusColor()}
        fontSize={0.25}
      />
      
      <StatusTag
        text={`Avg Cook Time: ${kitchen.averageCookTime}min`}
        position={[0, 1.8, 0]}
        color="#7c3aed"
        backgroundColor="#fde68a"
        fontSize={0.18}
      />
    </group>
  );
}