import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, GradientTexture } from '@react-three/drei';
import { useRef } from 'react';
import * as THREE from 'three';

const AnimatedSphere = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]}>
        <MeshDistortMaterial
          color="#3b82f6"
          speed={3}
          distort={0.4}
          radius={1}
        >
          <GradientTexture
            stops={[0, 1]}
            colors={['#3b82f6', '#818cf8']}
          />
        </MeshDistortMaterial>
      </Sphere>
    </Float>
  );
};

export const ThreeAvatar = () => {
  return (
    <div className="w-24 h-24 rounded-full overflow-hidden bg-[var(--surface)] shadow-2xl border-4 border-[var(--surface)]">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <spotLight position={[-10, -10, -10]} intensity={0.5} />
        <AnimatedSphere />
      </Canvas>
    </div>
  );
};
