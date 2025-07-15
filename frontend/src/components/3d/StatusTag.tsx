import { Text, Billboard } from '@react-three/drei';
import { useMemo } from 'react';

interface StatusTagProps {
  text: string;
  position: [number, number, number];
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
}

export default function StatusTag({ 
  text, 
  position, 
  color = '#2d3748', 
  backgroundColor = '#ffffff',
  fontSize = 0.3 
}: StatusTagProps) {
  const bgColor = useMemo(() => backgroundColor, [backgroundColor]);
  
  return (
    <Billboard position={position} follow={true} lockX={false} lockY={false} lockZ={false}>
      <group>
        {/* Background */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[text.length * fontSize * 0.6 + 0.4, fontSize + 0.2]} />
          <meshBasicMaterial 
            color={bgColor} 
            opacity={0.9} 
            transparent={true}
          />
        </mesh>
        
        {/* Text */}
        <Text
          color={color}
          fontSize={fontSize}
          maxWidth={200}
          lineHeight={1}
          letterSpacing={0.02}
          textAlign="center"
          font={undefined}
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </group>
    </Billboard>
  );
}