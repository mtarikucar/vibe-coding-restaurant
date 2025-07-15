import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import StatusTag from './StatusTag';
import { StockData } from '../../store/controlPanelStore';

interface StockRoomProps {
  stock: StockData;
  position: [number, number, number];
}

export default function StockRoom({ stock, position }: StockRoomProps) {
  const groupRef = useRef<Group>(null);
  const alertRef = useRef<Group>(null);
  
  // Pulse animation for critical items
  useFrame((state) => {
    if (alertRef.current && stock.criticalItems > 0) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      alertRef.current.scale.setScalar(scale);
    }
  });
  
  const getStockText = () => {
    return `Stock Room\nTotal: ${stock.totalItems}\nLow: ${stock.lowStockItems}\nCritical: ${stock.criticalItems}`;
  };
  
  const getStatusColor = () => {
    if (stock.criticalItems > 0) return '#fca5a5'; // soft red
    if (stock.lowStockItems > 5) return '#fde68a'; // soft amber
    return '#a7f3d0'; // soft emerald
  };
  
  const getStockLevel = () => {
    const totalShelves = 12;
    const itemsPerShelf = Math.floor(stock.totalItems / totalShelves);
    const variation = Math.random() * 0.5 + 0.5; // 0.5 to 1.0
    return Math.max(0.1, (itemsPerShelf / 10) * variation);
  };
  
  return (
    <group ref={groupRef} position={position}>
      {/* Storage Room Base */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[4, 0.1, 3]} />
        <meshLambertMaterial color="#e5e7eb" />
      </mesh>
      
      {/* Left Shelving Unit */}
      <group position={[-1.8, 0, 0]}>
        {/* Shelf Frame */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.1, 2, 2.8]} />
          <meshLambertMaterial color="#6b7280" />
        </mesh>
        
        {/* Shelves */}
        {Array.from({ length: 4 }).map((_, i) => {
          const y = 0.4 + i * 0.4;
          return (
            <group key={i}>
              {/* Shelf */}
              <mesh position={[0.2, y, 0]}>
                <boxGeometry args={[0.3, 0.05, 2.6]} />
                <meshLambertMaterial color="#9ca3af" />
              </mesh>
              
              {/* Items on shelf */}
              {Array.from({ length: 3 }).map((_, j) => {
                const z = (j - 1) * 0.8;
                const stockLevel = getStockLevel();
                const isLow = (i * 3 + j) < stock.lowStockItems;
                const isCritical = (i * 3 + j) < stock.criticalItems;
                
                return (
                  <mesh key={j} position={[0.35, y + 0.1, z]}>
                    <boxGeometry args={[0.2, stockLevel * 0.3, 0.6]} />
                    <meshLambertMaterial 
                      color={isCritical ? '#fca5a5' : isLow ? '#fde68a' : '#a7f3d0'} 
                    />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      </group>
      
      {/* Right Shelving Unit */}
      <group position={[1.8, 0, 0]}>
        {/* Shelf Frame */}
        <mesh position={[0, 1, 0]}>
          <boxGeometry args={[0.1, 2, 2.8]} />
          <meshLambertMaterial color="#6b7280" />
        </mesh>
        
        {/* Shelves */}
        {Array.from({ length: 4 }).map((_, i) => {
          const y = 0.4 + i * 0.4;
          return (
            <group key={i}>
              {/* Shelf */}
              <mesh position={[-0.2, y, 0]}>
                <boxGeometry args={[0.3, 0.05, 2.6]} />
                <meshLambertMaterial color="#9ca3af" />
              </mesh>
              
              {/* Items on shelf */}
              {Array.from({ length: 3 }).map((_, j) => {
                const z = (j - 1) * 0.8;
                const stockLevel = getStockLevel();
                const isLow = (12 + i * 3 + j) < stock.lowStockItems;
                const isCritical = (12 + i * 3 + j) < stock.criticalItems;
                
                return (
                  <mesh key={j} position={[-0.35, y + 0.1, z]}>
                    <boxGeometry args={[0.2, stockLevel * 0.3, 0.6]} />
                    <meshLambertMaterial 
                      color={isCritical ? '#fca5a5' : isLow ? '#fde68a' : '#a7f3d0'} 
                    />
                  </mesh>
                );
              })}
            </group>
          );
        })}
      </group>
      
      {/* Center Storage Boxes */}
      <group position={[0, 0.3, 0.8]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const x = (i % 3 - 1) * 0.8;
          const z = Math.floor(i / 3) * 0.6;
          const isCritical = i < stock.criticalItems;
          
          return (
            <mesh key={i} position={[x, 0.2, z]} ref={isCritical ? alertRef : undefined}>
              <boxGeometry args={[0.6, 0.4, 0.4]} />
              <meshLambertMaterial color={isCritical ? '#fed7d7' : '#d1fae5'} />
            </mesh>
          );
        })}
      </group>
      
      {/* Critical Alert Indicator */}
      {stock.criticalItems > 0 && (
        <mesh position={[0, 2.5, -1]} ref={alertRef}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="#fca5a5" />
        </mesh>
      )}
      
      {/* Status Tags */}
      <StatusTag
        text={getStockText()}
        position={[0, 2.8, 0]}
        color="#ffffff"
        backgroundColor={getStatusColor()}
        fontSize={0.25}
      />
      
      <StatusTag
        text={`Last Updated: ${stock.lastUpdated.toLocaleTimeString()}`}
        position={[0, 2.4, 0]}
        color="#374151"
        backgroundColor="#f3f4f6"
        fontSize={0.16}
      />
    </group>
  );
}