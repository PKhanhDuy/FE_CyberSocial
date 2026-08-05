import { useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { Html, Line, OrbitControls, Stars, Text } from "@react-three/drei"
import type { PropagationTimelineEvent } from "@/mocks/types"
import {
  buildPropagationGraphFromTimeline,
  edgeColor,
  getGraphStats,
  type PropagationGraphLayout,
  type PropagationGraphNode,
} from "@/lib/propagationGraphLayout"
import * as THREE from "three"

interface PropagationGraphSceneProps {
  timeline: PropagationTimelineEvent[]
  isSuspicious: boolean
  fallbackAuthor?: string
}

function GraphNode({
  node,
  isSuspicious,
  accent,
}: {
  node: PropagationGraphNode
  isSuspicious: boolean
  accent: string
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current || node.isRoot) return
    meshRef.current.position.z = Math.sin(clock.elapsedTime * 1.5 + node.position[0]) * 0.06
  })

  const nodeColor = node.isRoot
    ? accent
    : node.isInfluential
      ? (isSuspicious ? "#2dd4bf" : "#38bdf8")
      : node.isShareBranch
        ? (isSuspicious ? "#fda4af" : "#fdba74")
        : "#94a3b8"

  return (
    <group position={node.position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[node.radius, 24, 24]} />
        <meshStandardMaterial
          color={nodeColor}
          emissive={node.isInfluential ? nodeColor : "#000000"}
          emissiveIntensity={node.isInfluential ? 0.65 : 0}
          metalness={0.35}
          roughness={0.25}
        />
      </mesh>

      {(node.isRoot || (node.isShareBranch && node.isInfluential)) && (
        <Text
          position={[0, node.radius + 0.28, 0]}
          fontSize={node.isRoot ? 0.22 : 0.16}
          color="#e2e8f0"
          anchorX="center"
          anchorY="middle"
          maxWidth={3}
        >
          {node.label}
        </Text>
      )}

      {node.isInfluential && node.maxTige != null && (
        <Html center distanceFactor={12} style={{ pointerEvents: "none" }}>
          <div className="rounded border border-white/20 bg-black/70 px-1.5 py-0.5 text-[9px] font-mono text-white whitespace-nowrap">
            TIGE {node.maxTige >= 0 ? "+" : ""}{node.maxTige.toFixed(2)}
          </div>
        </Html>
      )}
    </group>
  )
}

function GraphEdges({
  layout,
  isSuspicious,
}: {
  layout: PropagationGraphLayout
  isSuspicious: boolean
}) {
  const nodeById = useMemo(
    () => new Map(layout.nodes.map((node) => [node.id, node])),
    [layout.nodes],
  )

  return (
    <group>
      {layout.edges.map((edge) => {
        const from = nodeById.get(edge.from)
        const to = nodeById.get(edge.to)
        if (!from || !to) return null

        const start = new THREE.Vector3(...from.position)
        const end = new THREE.Vector3(...to.position)
        const color = edgeColor(edge.eventType, isSuspicious)

        return (
          <Line
            key={edge.id}
            points={[start, end]}
            color={color}
            opacity={edge.isInfluential ? 0.9 : edge.isBranchEdge ? 0.55 : 0.25}
            transparent
            lineWidth={edge.isInfluential ? 2.5 : edge.isBranchEdge ? 1.8 : 1}
          />
        )
      })}
    </group>
  )
}

function PropagationGraph({
  layout,
  isSuspicious,
}: {
  layout: PropagationGraphLayout
  isSuspicious: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const accent = isSuspicious ? "#2dd4bf" : "#38bdf8"

  useFrame((_, delta) => {
    if (!groupRef.current || layout.mode !== "star") return
    groupRef.current.rotation.z += delta * (isSuspicious ? 0.18 : 0.08)
  })

  if (layout.nodes.length === 0) {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
        </mesh>
        <Html center distanceFactor={10}>
          <div className="mt-16 rounded-lg border border-border bg-black/70 px-3 py-2 text-xs text-muted whitespace-nowrap">
            Chưa có dữ liệu lan truyền
          </div>
        </Html>
      </group>
    )
  }

  return (
    <group ref={groupRef}>
      <GraphEdges layout={layout} isSuspicious={isSuspicious} />
      {layout.nodes.map((node) => (
        <GraphNode key={node.id} node={node} isSuspicious={isSuspicious} accent={accent} />
      ))}
    </group>
  )
}

export function PropagationGraphScene({
  timeline,
  isSuspicious,
  fallbackAuthor,
}: PropagationGraphSceneProps) {
  const layout = useMemo(() => {
    if (timeline.length > 0) {
      return buildPropagationGraphFromTimeline(timeline)
    }
    if (!fallbackAuthor) {
      return buildPropagationGraphFromTimeline([])
    }
    return buildPropagationGraphFromTimeline([
      {
        eventIndex: 0,
        eventId: "root",
        relativeTime: "t=0",
        eventType: "tweet",
        eventTypeLabel: "Đăng bài",
        actorLabel: fallbackAuthor,
        depth: 0,
        isInfluential: false,
      },
    ])
  }, [timeline, fallbackAuthor])

  const cameraDistance = Math.max(12, 10 + layout.maxDepth * 2.5 + layout.nodes.length * 0.15)

  return (
    <div className="w-full h-full absolute inset-0">
      <Canvas camera={{ position: [0, 0, cameraDistance], fov: 55 }}>
        <color attach="background" args={["#050508"]} />
        <ambientLight intensity={0.45} />
        <pointLight position={[8, 8, 10]} intensity={1.2} color={isSuspicious ? "#2dd4bf" : "#38bdf8"} />
        <pointLight position={[-8, -6, 6]} intensity={0.35} color="#ffffff" />
        <Stars radius={80} depth={40} count={2500} factor={3} saturation={0} fade speed={0.6} />
        <PropagationGraph layout={layout} isSuspicious={isSuspicious} />
        <OrbitControls
          target={[0, 0, 0]}
          enableZoom
          enablePan
          autoRotate={layout.mode === "star" && layout.nodes.length > 1}
          autoRotateSpeed={isSuspicious ? 0.8 : 0.35}
        />
      </Canvas>
    </div>
  )
}

export { getGraphStats, getGraphStats as getStarGraphStats }
