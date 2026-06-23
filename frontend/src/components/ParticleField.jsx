import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* ── Animated Particles inside the Canvas ── */
const Particles = ({ count = 800 }) => {
  const mesh = useRef()

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    const pink  = new THREE.Color('#ff2a6d')
    const purple = new THREE.Color('#8b5cf6')
    const cyan  = new THREE.Color('#06b6d4')
    const palette = [pink, purple, cyan]

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      pos[i3]     = (Math.random() - 0.5) * 20
      pos[i3 + 1] = (Math.random() - 0.5) * 20
      pos[i3 + 2] = (Math.random() - 0.5) * 20

      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i3]     = c.r
      col[i3 + 1] = c.g
      col[i3 + 2] = c.b
    }

    return [pos, col]
  }, [count])

  useFrame((state) => {
    if (!mesh.current) return
    mesh.current.rotation.y = state.clock.elapsedTime * 0.02
    mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1
  })

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ── Floating Geometric Ring ── */
const FloatingRing = ({ position, color, speed = 1 }) => {
  const ref = useRef()

  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.x = state.clock.elapsedTime * 0.3 * speed
    ref.current.rotation.z = state.clock.elapsedTime * 0.2 * speed
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5 * speed) * 0.3
  })

  return (
    <mesh ref={ref} position={position}>
      <torusGeometry args={[1, 0.02, 16, 80]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} />
    </mesh>
  )
}

/* ── Main ParticleField Component ── */
const ParticleField = ({ className = '', style = {} }) => {
  return (
    <div
      className={`particle-field ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        ...style
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Particles count={600} />
        <FloatingRing position={[-3, 1, -2]} color="#8b5cf6" speed={0.8} />
        <FloatingRing position={[3, -1, -3]} color="#ff2a6d" speed={0.6} />
        <FloatingRing position={[0, 2, -4]} color="#06b6d4" speed={1} />
      </Canvas>
    </div>
  )
}

export default ParticleField
