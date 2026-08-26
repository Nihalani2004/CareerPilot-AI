import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTheme } from '../theme.context'

/* ── Animated Particles inside the Canvas ── */
const Particles = ({ count = 800, theme }) => {
  const mesh = useRef()

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)

    const palette = theme === 'light'
      ? [new THREE.Color('#6366f1'), new THREE.Color('#0ea5e9'), new THREE.Color('#14b8a6')]
      : [new THREE.Color('#ff2a6d'), new THREE.Color('#8b5cf6'), new THREE.Color('#06b6d4')]

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
  }, [count, theme])

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
        opacity={theme === 'light' ? 0.38 : 0.7}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/* ── Floating Geometric Ring ── */
const FloatingRing = ({ position, color, speed = 1, opacity = 0.2 }) => {
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
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

/* ── Main ParticleField Component ── */
const ParticleField = ({ className = '', style = {} }) => {
  const { theme } = useTheme()
  const isLightMode = theme === 'light'
  const ringOpacity = isLightMode ? 0.12 : 0.2

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
        <Particles count={600} theme={theme} />
        <FloatingRing position={[-3, 1, -2]} color={isLightMode ? "#6366f1" : "#8b5cf6"} speed={0.8} opacity={ringOpacity} />
        <FloatingRing position={[3, -1, -3]} color={isLightMode ? "#0ea5e9" : "#ff2a6d"} speed={0.6} opacity={ringOpacity} />
        <FloatingRing position={[0, 2, -4]} color={isLightMode ? "#14b8a6" : "#06b6d4"} speed={1} opacity={ringOpacity} />
      </Canvas>
    </div>
  )
}

export default ParticleField
