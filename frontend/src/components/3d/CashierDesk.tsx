import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import StatusTag from './StatusTag';
import { CashierData } from '../../store/controlPanelStore';
import { MarbleMaterial, WoodMaterial } from './materials/TextureUtils';

interface CashierDeskProps {
  cashier: CashierData;
  position: [number, number, number];
}

export default function CashierDesk({ cashier, position }: CashierDeskProps) {
  const groupRef = useRef<Group>(null);
  const screenRef = useRef<Group>(null);
  
  // Screen glow animation
  useFrame((state) => {
    if (screenRef.current) {
      const intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      screenRef.current.scale.setScalar(intensity);
    }
  });
  
  const getCashierText = () => {
    return `Cashier Desk\nQueue: ${cashier.queueLength}\nRevenue: $${cashier.dailyRevenue.toLocaleString()}\nTransactions: ${cashier.transactionsToday}`;
  };
  
  const getQueueColor = () => {
    if (cashier.queueLength > 5) return '#fca5a5'; // soft red
    if (cashier.queueLength > 2) return '#fde68a'; // soft amber
    return '#a7f3d0'; // soft emerald
  };
  
  return (
    <group ref={groupRef} position={position}>
      {/* Desk Base with marble texture */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[2.5, 0.8, 1.2]} />
        <MarbleMaterial baseColor="#f1f5f9" />
      </mesh>
      
      {/* Cash Register */}
      <mesh position={[-0.6, 0.85, 0]}>
        <boxGeometry args={[0.4, 0.3, 0.3]} />
        <meshLambertMaterial color="#e2e8f0" />
      </mesh>
      
      {/* Cash Register Screen */}
      <mesh position={[-0.6, 1.05, -0.05]} ref={screenRef}>
        <planeGeometry args={[0.25, 0.15]} />
        <meshBasicMaterial color="#a5f3fc" />
      </mesh>
      
      {/* Payment Terminal */}
      <mesh position={[0.2, 0.85, 0.3]}>
        <boxGeometry args={[0.15, 0.1, 0.25]} />
        <meshLambertMaterial color="#cbd5e1" />
      </mesh>
      
      {/* Receipt Printer */}
      <mesh position={[0.6, 0.85, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.2]} />
        <meshLambertMaterial color="#d1d5db" />
      </mesh>
      
      {/* Receipt Paper */}
      <mesh position={[0.6, 0.95, -0.1]}>
        <planeGeometry args={[0.08, 0.4]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      
      {/* Money Drawer */}
      <mesh position={[-0.6, 0.55, 0.2]}>
        <boxGeometry args={[0.5, 0.1, 0.3]} />
        <meshLambertMaterial color="#d1d5db" />
      </mesh>
      
      {/* Counter Top Items */}
      <mesh position={[0.8, 0.85, -0.3]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshLambertMaterial color="#fbbf24" />
      </mesh>
      
      {/* Queue Line Markers */}
      {Array.from({ length: Math.min(cashier.queueLength, 6) }).map((_, i) => (
        <group key={i} position={[0, 0.05, 2 + i * 0.8]}>
          {/* Floor Marker */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.02, 8]} />
            <meshLambertMaterial color="#fbbf24" />
          </mesh>
          
          {/* Customer Placeholder */}
          <mesh position={[0, 0.8, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 1.6, 8]} />
            <meshLambertMaterial color="#a78bfa" />
          </mesh>
          
          {/* Customer Head */}
          <mesh position={[0, 1.7, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshLambertMaterial color="#fde68a" />
          </mesh>
        </group>
      ))}
      
      {/* POS Monitor */}
      <mesh position={[0, 1.2, -0.4]}>
        <boxGeometry args={[0.4, 0.3, 0.05]} />
        <meshLambertMaterial color="#1f2937" />
      </mesh>
      
      {/* Monitor Screen */}
      <mesh position={[0, 1.2, -0.35]}>
        <planeGeometry args={[0.35, 0.25]} />
        <meshBasicMaterial color="#065f46" />
      </mesh>
      
      {/* Monitor Stand */}
      <mesh position={[0, 0.85, -0.4]}>
        <cylinderGeometry args={[0.08, 0.08, 0.3, 8]} />
        <meshLambertMaterial color="#6b7280" />
      </mesh>
      
      {/* Status Tags */}
      <StatusTag
        text={getCashierText()}
        position={[0, 2.2, 0]}
        color="#ffffff"
        backgroundColor={getQueueColor()}
        fontSize={0.22}
      />
      
      <StatusTag
        text={`Avg Wait: ${cashier.averageWaitTime}min`}
        position={[0, 1.8, 0]}
        color="#374151"
        backgroundColor="#f3f4f6"
        fontSize={0.18}
      />
      
      {/* Queue Alert */}
      {cashier.queueLength > 3 && (
        <StatusTag
          text="⚠️ Long Queue!"
          position={[0, 1.4, 2]}
          color="#ffffff"
          backgroundColor="#dc2626"
          fontSize={0.2}
        />
      )}
    </group>
  );
}