"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Box, Cylinder, Text, Sphere } from "@react-three/drei"
import { useMotorStore } from "@/lib/store"
import * as THREE from "three"

type IntegratedMotorRefrigerationProps = {
  visible: boolean
}

export function IntegratedMotorRefrigeration({ visible }: IntegratedMotorRefrigerationProps) {
  const { rpm, temperature, isRunning, systemTemperature, targetTemperature } = useMotorStore()

  const compressorRef = useRef<THREE.Group>(null)
  const rotorRef = useRef<THREE.Mesh>(null)
  const pistonRef = useRef<THREE.Group>(null)
  const fanRef = useRef<THREE.Group>(null)
  const refrigerantFlowRef = useRef<THREE.Group>(null)

  // Unified rotation direction - strictly around own axis
  useFrame((state, delta) => {
    if (rotorRef.current && rpm > 0 && isRunning) {
      // Convert RPM to radians per second
      const radiansPerSecond = (rpm / 60) * 2 * Math.PI
      // Apply rotation ONLY around the z-axis
      rotorRef.current.rotation.z -= radiansPerSecond * delta
      // Ensure no rotation on other axes
      rotorRef.current.rotation.x = 0
      rotorRef.current.rotation.y = 0
    }

    if (compressorRef.current && isRunning && rpm > 0) {
      // Compressor vibrates slightly when running - position only, no rotation
      compressorRef.current.position.x = Math.sin(state.clock.elapsedTime * 30) * 0.002
      compressorRef.current.position.y = Math.sin(state.clock.elapsedTime * 25) * 0.002
      // Ensure no rotation
      compressorRef.current.rotation.x = 0
      compressorRef.current.rotation.y = 0
      compressorRef.current.rotation.z = 0
    }

    if (pistonRef.current && rpm > 0 && isRunning) {
      // Simulate piston movement up and down - position only, no rotation
      const pistonOffset = Math.sin(state.clock.elapsedTime * (rpm / 60) * Math.PI) * 0.15
      pistonRef.current.position.y = pistonOffset
      // Ensure no rotation
      pistonRef.current.rotation.x = 0
      pistonRef.current.rotation.y = 0
      pistonRef.current.rotation.z = 0
    }

    if (fanRef.current && isRunning && rpm > 0) {
      // Fan rotates based on motor speed - ONLY around z-axis
      fanRef.current.rotation.z -= (rpm / 60) * 2 * Math.PI * delta * 0.5
      // Ensure no rotation on other axes
      fanRef.current.rotation.x = 0
      fanRef.current.rotation.y = 0
    }

    // Simplificado para evitar iteração em muitos elementos
    if (refrigerantFlowRef.current && isRunning && rpm > 0) {
      // Animar apenas o primeiro elemento de cada tipo para economizar recursos
      for (let i = 0; i < Math.min(refrigerantFlowRef.current.children.length, 3); i++) {
        const child = refrigerantFlowRef.current.children[i]
        if (child instanceof THREE.Mesh) {
          const speed = i === 0 ? 1 : i === 1 ? 0.7 : 1.2
          // Ensure consistent flow direction - position only, no rotation
          child.position.x = ((child.position.x + delta * speed) % 1) - 0.5
          // Ensure no rotation
          child.rotation.x = 0
          child.rotation.y = 0
          child.rotation.z = 0
        }
      }
    }
  })

  if (!visible) return null

  // Calculate refrigerant color based on temperature
  const getRefrigerantColor = (section: string) => {
    if (section === "hot") return "#ff6666" // Hot refrigerant (after compression)
    if (section === "warm") return "#ffaa66" // Warm refrigerant (after condenser)
    if (section === "cool") return "#66ccff" // Cool refrigerant (after expansion)
    return "#66ffcc" // Cold refrigerant (after evaporator)
  }

  // Calculate intensity of operation based on temperature difference
  const operationIntensity = Math.min(1, Math.max(0.2, (temperature - targetTemperature) / 20))

  // Calculate material properties based on temperature
  const getTemperatureColor = () => {
    if (temperature > 80) return "#ff4d4d" // Red for hot
    if (temperature > 60) return "#ffaa00" // Orange for warm
    return "#66ccff" // Blue for cool
  }

  // Reduzir a complexidade da cena para melhorar o desempenho
  return (
    <group>
      {/* Hermetic Compressor Section - Simplified */}
      <group ref={compressorRef} position={[-4, 0, 0]}>
        <Text
          position={[0, 2, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Compressor Hermético
        </Text>

        {/* Main Compressor Body - Simplified */}
        <Cylinder args={[0.8, 0.8, 2.4, 16]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
        </Cylinder>

        {/* Top Dome */}
        <Sphere args={[0.8, 16, 8, 0, Math.PI]} position={[0, 1.2, 0]} rotation={[Math.PI, 0, 0]}>
          <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
        </Sphere>

        {/* Simplified internal components */}
        <group position={[0, 0, 0.2]} scale={[0.8, 0.8, 0.8]}>
          {/* Motor Rotor */}
          <Cylinder ref={rotorRef} args={[0.45, 0.45, 1.3, 16]} position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial
              color={getTemperatureColor()}
              emissive={getTemperatureColor()}
              emissiveIntensity={0.2}
              metalness={0.7}
              roughness={0.3}
            />
          </Cylinder>

          {/* Compression Mechanism - Simplified */}
          <group position={[0, 0.6, 0]}>
            {/* Connecting Rod */}
            <group ref={pistonRef}>
              <Box args={[0.08, 0.3, 0.08]} position={[0.15, 0.15, 0]} rotation={[0, 0, 0]}>
                <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
              </Box>

              {/* Piston */}
              <Cylinder args={[0.25, 0.25, 0.15, 8]} position={[0, 0.3, 0]} rotation={[0, 0, 0]}>
                <meshStandardMaterial color="#999999" metalness={0.6} roughness={0.4} />
              </Cylinder>
            </group>
          </group>
        </group>
      </group>

      {/* Refrigeration System - Simplified */}
      <group position={[4, 0, 0]}>
        <Text
          position={[0, 2, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Sistema de Refrigeração
        </Text>

        {/* System Base */}
        <Box args={[6, 0.2, 3]} position={[0, -1.5, 0]}>
          <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
        </Box>

        {/* Condenser (with fan) - Simplified */}
        <group position={[0, 0, 0]}>
          <Box args={[1.5, 0.8, 0.2]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial color="#aaaaaa" metalness={0.6} roughness={0.4} />
          </Box>

          {/* Cooling Fan - Simplified */}
          <group ref={fanRef} position={[0, 0, 0.5]}>
            {Array.from({ length: 3 }).map((i) => (
              <Box
                key={i}
                args={[0.1, 0.6, 0.05]}
                position={[Math.sin((i * Math.PI) / 1.5) * 0.4, Math.cos((i * Math.PI) / 1.5) * 0.4, 0]}
                rotation={[0, 0, (i * Math.PI) / 1.5]}
              >
                <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
              </Box>
            ))}
            <Cylinder args={[0.1, 0.1, 0.1, 8]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
              <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
            </Cylinder>
          </group>
        </group>

        {/* Evaporator - Simplified */}
        <group position={[0, 0, -1.5]}>
          <Box args={[4, 0.8, 0.2]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial color="#aaaaaa" metalness={0.6} roughness={0.4} />
          </Box>

          {/* Evaporator Fins - Reduced quantity */}
          {Array.from({ length: 4 }).map((i) => (
            <Box key={i} args={[3.8, 0.05, 0.6]} position={[0, -0.35 + i * 0.2, 0]} rotation={[0, 0, 0]}>
              <meshStandardMaterial
                color="#cccccc"
                metalness={0.7}
                roughness={0.3}
                emissive="#66ffff"
                emissiveIntensity={operationIntensity * 0.2}
              />
            </Box>
          ))}
        </group>
      </group>

      {/* Connection Pipes - Simplified */}
      {/* Hot gas line (compressor to condenser) */}
      <Cylinder args={[0.15, 0.15, 4, 8]} position={[-2, 1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#ff6666" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Suction line (evaporator to compressor) */}
      <Cylinder args={[0.15, 0.15, 4, 8]} position={[-2, -1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <meshStandardMaterial color="#66ccff" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Refrigerant Flow Indicators - Reduced quantity */}
      <group ref={refrigerantFlowRef}>
        {/* Hot gas flow */}
        <Box args={[0.1, 0.05, 0.05]} position={[-2, 1, 0]}>
          <meshStandardMaterial color="#ff6666" emissive="#ff6666" emissiveIntensity={0.5} />
        </Box>

        {/* Liquid flow */}
        <Box args={[0.08, 0.04, 0.04]} position={[2, 0, 0]}>
          <meshStandardMaterial color="#ffaa66" emissive="#ffaa66" emissiveIntensity={0.3} />
        </Box>

        {/* Suction flow */}
        <Box args={[0.1, 0.05, 0.05]} position={[-2, -1, 0]}>
          <meshStandardMaterial color="#66ccff" emissive="#66ccff" emissiveIntensity={0.3} />
        </Box>
      </group>

      {/* Temperature Display */}
      <group position={[0, 2, 0]}>
        <Box args={[1.5, 0.8, 0.1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.5} />
        </Box>
        <Text
          position={[0, 0, 0.06]}
          rotation={[0, 0, 0]}
          fontSize={0.4}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
        >
          {systemTemperature.toFixed(1)}°C
        </Text>
      </group>

      {/* System Status */}
      <Text
        position={[0, -2, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.25}
        color={isRunning ? "#00ff00" : "#ff0000"}
        anchorX="center"
        anchorY="middle"
      >
        Status do Sistema: {isRunning ? "FUNCIONANDO" : "PARADO"}
      </Text>
    </group>
  )
}
