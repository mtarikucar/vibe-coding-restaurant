import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import StatusTag from './StatusTag';
import { TableStatus } from '../../store/controlPanelStore';
import { GradientMaterial, StripedMaterial } from './materials/CustomMaterials';

interface TableProps {
  table: TableStatus;
  position: [number, number, number];
}

// Cute pastel color palette for 2.5D isometric look
const statusColors = {
  available: '#c7f7c7', // soft mint green
  occupied: '#ffd3a5',  // soft peach
  cleaning: '#e8e2ff', // soft lavender
  reserved: '#a5d8ff', // soft sky blue
};

export default function Table({ table, position }: TableProps) {
  const groupRef = useRef<Group>(null);
  const tableRef = useRef<Mesh>(null);
  
  // Gentle floating animation for occupied tables
  useFrame((state) => {
    if (tableRef.current && table.status === 'occupied') {
      tableRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.02;
    }
  });
  
  const getStatusText = () => {
    switch (table.status) {
      case 'occupied':
        return `Table ${table.id}\n${table.customers} guests\n${table.orderCount} orders`;
      case 'cleaning':
        return `Table ${table.id}\nCleaning`;
      case 'reserved':
        return `Table ${table.id}\nReserved`;
      default:
        return `Table ${table.id}\nAvailable`;
    }
  };
  
  const getTagColor = () => {
    switch (table.status) {
      case 'occupied': return '#8b5a3c'; // warm brown
      case 'cleaning': return '#6366f1'; // soft indigo
      case 'reserved': return '#3b82f6'; // soft blue
      default: return '#059669'; // soft emerald
    }
  };
  
  return (
    <group ref={groupRef} position={position}>
      {/* Table Top with gradient based on status */}
      <mesh ref={tableRef} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.08, 8]} />
        <GradientMaterial 
          color1={statusColors[table.status]} 
          color2="#ffffff" 
          intensity={table.status === 'occupied' ? 1.2 : 0.8} 
        />
      </mesh>
      
      {/* Table Base with striped pattern */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.4, 8]} />
        <StripedMaterial 
          color1="#f3e8ff" 
          color2="#e0e7ff" 
          scale={3} 
          angle={Math.PI / 4} 
        />
      </mesh>
      
      {/* Chairs around the table */}
      {Array.from({ length: 4 }).map((_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const chairX = Math.cos(angle) * 1.2;
        const chairZ = Math.sin(angle) * 1.2;
        
        return (
          <group key={i} position={[chairX, 0, chairZ]}>
            {/* Chair Seat with gradient */}
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[0.3, 0.05, 0.3]} />
              <GradientMaterial color1="#ffe4e6" color2="#fdf2f8" intensity={0.6} />
            </mesh>
            
            {/* Chair Back with gradient */}
            <mesh position={[0, 0.45, -0.1]}>
              <boxGeometry args={[0.3, 0.4, 0.05]} />
              <GradientMaterial color1="#ffe4e6" color2="#fdf2f8" intensity={0.6} />
            </mesh>
            
            {/* Chair Legs */}
            {Array.from({ length: 4 }).map((_, j) => {
              const legX = (j % 2) * 0.2 - 0.1;
              const legZ = Math.floor(j / 2) * 0.2 - 0.1;
              return (
                <mesh key={j} position={[legX, 0.125, legZ]}>
                  <boxGeometry args={[0.03, 0.25, 0.03]} />
                  <meshLambertMaterial color="#d8b4fe" />
                </mesh>
              );
            })}
          </group>
        );
      })}
      
      {/* Status Tag */}
      <StatusTag
        text={getStatusText()}
        position={[0, 1.2, 0]}
        color={getTagColor()}
        backgroundColor={statusColors[table.status]}
        fontSize={0.2}
      />
    </group>
  );
}