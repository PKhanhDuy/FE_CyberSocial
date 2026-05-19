import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, Line } from '@react-three/drei'
import * as THREE from 'three'

function Nodes({ count = 50, isSuspicious = false }) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const color = isSuspicious ? new THREE.Color('#2dd4bf') : new THREE.Color('#38bdf8')

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const positions = useMemo(() => {
    const pos = []
    for (let i = 0; i < count; i++) {
      pos.push([
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ])
    }
    return pos
  }, [count])

  useFrame(() => {
    if (mesh.current) {
      positions.forEach((pos, i) => {
        dummy.position.set(pos[0], pos[1], pos[2])
        dummy.rotation.x += 0.01
        dummy.rotation.y += 0.01
        dummy.updateMatrix()
        mesh.current!.setMatrixAt(i, dummy.matrix)
      })
      mesh.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </instancedMesh>
  )
}

function Edges({ count = 50, isSuspicious = false }) {
  const color = isSuspicious ? '#2dd4bf' : '#38bdf8'
  const lines = useMemo(() => {
    const l = []
    for (let i = 0; i < count; i++) {
      const p1 = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10)
      const p2 = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10)
      l.push([p1, p2])
    }
    return l
  }, [count])

  return (
    <group>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={color} opacity={0.3} transparent lineWidth={1} />
      ))}
    </group>
  )
}

interface PropagationGraphSceneProps {
  isSuspicious: boolean
}

export function PropagationGraphScene({ isSuspicious }: PropagationGraphSceneProps) {
  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color={isSuspicious ? '#2dd4bf' : '#38bdf8'} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        <group rotation={[0, 0, 0]} /* Can add rotation animation later */>
          <Nodes count={100} isSuspicious={isSuspicious} />
          <Edges count={80} isSuspicious={isSuspicious} />
        </group>
        <OrbitControls enableZoom={true} enablePan={true} autoRotate autoRotateSpeed={isSuspicious ? 2.0 : 0.5} />
      </Canvas>
    </div>
  )
}
