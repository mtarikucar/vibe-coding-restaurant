import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import StatusTag from './StatusTag';
import { StaffMember } from '../../store/controlPanelStore';
import { TexturedMaterial } from './materials/TextureUtils';

interface StaffProps {
  staff: StaffMember;
}

// Cute pastel colors for staff uniforms
const roleColors = {
  waiter: '#ddd6fe', // soft purple
  chef: '#fecaca', // soft red  
  cashier: '#a7f3d0', // soft emerald
  cleaner: '#bfdbfe', // soft blue
};

const statusColors = {
  active: '#86efac', // soft green
  break: '#fde68a', // soft amber
  offline: '#d1d5db', // soft gray
};

export default function Staff({ staff }: StaffProps) {
  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  
  // Gentle walking animation for active staff
  useFrame((state) => {
    if (bodyRef.current && staff.status === 'active') {
      bodyRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
      bodyRef.current.position.y = Math.sin(state.clock.elapsedTime * 4) * 0.02;
    }
  });
  
  const getStaffText = () => {
    return `${staff.name}\n${staff.role.charAt(0).toUpperCase() + staff.role.slice(1)}\n${staff.status.charAt(0).toUpperCase() + staff.status.slice(1)}`;
  };
  
  const getUniformColor = () => {
    return roleColors[staff.role];
  };
  
  const getStatusIndicatorColor = () => {
    return statusColors[staff.status];
  };
  
  return (
    <group ref={groupRef} position={staff.position}>
      <group ref={bodyRef}>
        {/* Body with textured uniform */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 0.8, 8]} />
          <TexturedMaterial 
            color1={getUniformColor()} 
            color2="#ffffff" 
            pattern="dots"
            roughness={0.6}
          />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, 1.15, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshLambertMaterial color="#fde68a" />
        </mesh>
        
        {/* Arms */}
        <mesh position={[-0.2, 0.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshLambertMaterial color="#fed7aa" />
        </mesh>
        <mesh position={[0.2, 0.8, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshLambertMaterial color="#fed7aa" />
        </mesh>
        
        {/* Legs */}
        <mesh position={[-0.08, 0.15, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
          <meshLambertMaterial color="#cbd5e1" />
        </mesh>
        <mesh position={[0.08, 0.15, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
          <meshLambertMaterial color="#cbd5e1" />
        </mesh>
        
        {/* Role-specific accessories */}
        {staff.role === 'waiter' && (
          <>
            {/* Notepad */}
            <mesh position={[-0.25, 0.7, 0]}>
              <boxGeometry args={[0.06, 0.08, 0.01]} />
              <meshLambertMaterial color="#ffffff" />
            </mesh>
            {/* Pen */}
            <mesh position={[-0.3, 0.9, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.12, 8]} />
              <meshLambertMaterial color="#8b5cf6" />
            </mesh>
          </>
        )}
        
        {staff.role === 'chef' && (
          <>
            {/* Chef Hat */}
            <mesh position={[0, 1.35, 0]}>
              <cylinderGeometry args={[0.1, 0.14, 0.25, 8]} />
              <meshLambertMaterial color="#ffffff" />
            </mesh>
            {/* Apron */}
            <mesh position={[0, 0.6, 0.18]}>
              <boxGeometry args={[0.25, 0.6, 0.02]} />
              <meshLambertMaterial color="#ffffff" />
            </mesh>
          </>
        )}
        
        {staff.role === 'cashier' && (
          <>
            {/* Headset */}
            <mesh position={[0.1, 1.15, 0]}>
              <torusGeometry args={[0.08, 0.01, 8, 16]} />
              <meshLambertMaterial color="#7c3aed" />
            </mesh>
            {/* Badge */}
            <mesh position={[0, 0.9, 0.18]}>
              <boxGeometry args={[0.08, 0.05, 0.01]} />
              <meshLambertMaterial color="#fde68a" />
            </mesh>
          </>
        )}
        
        {staff.role === 'cleaner' && (
          <>
            {/* Cleaning Cart Handle */}
            <mesh position={[0.3, 0.8, 0]}>
              <cylinderGeometry args={[0.01, 0.01, 0.4, 8]} />
              <meshLambertMaterial color="#d1d5db" />
            </mesh>
            {/* Spray Bottle */}
            <mesh position={[-0.25, 0.7, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.08, 8]} />
              <meshLambertMaterial color="#a5f3fc" />
            </mesh>
          </>
        )}
        
        {/* Status Indicator */}
        <mesh position={[0, 1.4, 0]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color={getStatusIndicatorColor()} />
        </mesh>
        
        {/* Break indicator */}
        {staff.status === 'break' && (
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.4, 0.15, 0.05]} />
            <meshLambertMaterial color="#ffffff" />
          </mesh>
        )}
        
        {/* Offline indicator */}
        {staff.status === 'offline' && (
          <group>
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.15, 0.2, 0.8, 8]} />
              <meshLambertMaterial color="#9ca3af" opacity={0.5} transparent={true} />
            </mesh>
          </group>
        )}
      </group>
      
      {/* Name Tag */}
      <StatusTag
        text={getStaffText()}
        position={[0, 1.8, 0]}
        color="#ffffff"
        backgroundColor={getStatusIndicatorColor()}
        fontSize={0.16}
      />
    </group>
  );
}