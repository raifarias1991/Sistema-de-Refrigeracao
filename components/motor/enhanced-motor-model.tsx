"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Cylinder, Box, Torus, Sphere, Text } from "@react-three/drei"
import type * as THREE from "three" // Alterado de 'import type * as THREE' para importar o objeto THREE
import {
  calculatePistonPosition,
  calculateVibration,
  calculateThermalExpansion,
  defaultProperties,
} from "@/lib/physics-engine"

type EnhancedMotorModelProps = {
  viewMode: "normal" | "exploded" | "transparent"
  rpm: number
  temperature: number
  load?: number // 0-1 representing motor load
}

export function EnhancedMotorModel({ viewMode, rpm, temperature, load = 0.5 }: EnhancedMotorModelProps) {
  const motorRef = useRef<THREE.Group>(null)
  const internalRef = useRef<THREE.Group>(null)
  const rotorRef = useRef<THREE.Mesh>(null)
  const pistonRef = useRef<THREE.Group>(null)
  const crankshaftRef = useRef<THREE.Mesh>(null)
  const crankOffsetRef = useRef<THREE.Mesh>(null)
  const connectingRodRef = useRef<THREE.Mesh>(null)

  // Physical constants for the simulation
  const crankRadius = 0.15
  const connectingRodLength = 0.3
  const compressionRatio = 8.5

  // State for tracking rotation and physics
  const [crankAngle, setCrankAngle] = useState(0)
  const [rotorInertia, setRotorInertia] = useState(0)
  const [currentRpm, setCurrentRpm] = useState(0)
  const [thermalExpansion, setThermalExpansion] = useState(0)

  // Update thermal expansion based on temperature
  useEffect(() => {
    const expansion = calculateThermalExpansion(
      1.0, // base size
      temperature,
      60, // reference temperature
      defaultProperties.piston.thermalExpansion,
    )
    setThermalExpansion(expansion - 1.0) // Get just the expansion amount
  }, [temperature])

  // Simulate inertia when RPM changes
  useEffect(() => {
    // Gradually change RPM to simulate inertia
    const inertiaInterval = setInterval(() => {
      setCurrentRpm((prev) => {
        if (Math.abs(prev - rpm) < 5) return rpm
        return prev + (rpm - prev) * 0.05
      })
    }, 50)

    return () => clearInterval(inertiaInterval)
  }, [rpm])

  // Enhanced physics-based animation
  useFrame((state, delta) => {
    // Only animate if we have RPM
    if (currentRpm <= 0) return

    // Convert RPM to radians per second
    const radiansPerSecond = (currentRpm / 60) * 2 * Math.PI

    // Update crank angle
    const angleIncrement = radiansPerSecond * delta
    setCrankAngle((angle) => (angle + angleIncrement) % (2 * Math.PI))

    // Apply rotation to rotating components
    if (rotorRef.current && crankshaftRef.current && crankOffsetRef.current) {
      // Apply rotation ONLY around the z-axis (the shaft's own axis)
      rotorRef.current.rotation.z -= angleIncrement
      crankshaftRef.current.rotation.z -= angleIncrement
      crankOffsetRef.current.rotation.z -= angleIncrement

      // Ensure no accidental rotation on other axes
      rotorRef.current.rotation.x = 0
      rotorRef.current.rotation.y = 0
      crankshaftRef.current.rotation.x = 0
      crankshaftRef.current.rotation.y = 0
      crankOffsetRef.current.rotation.x = 0
      crankOffsetRef.current.rotation.y = 0
    }

    // Calculate piston position using physics equations
    if (pistonRef.current && connectingRodRef.current) {
      // Calculate piston position using crank-slider mechanism equations
      const pistonPosition = calculatePistonPosition(crankAngle, crankRadius, connectingRodLength)
      pistonRef.current.position.y = pistonPosition

      // Calculate connecting rod angle
      const rodAngle = Math.asin((crankRadius * Math.sin(crankAngle)) / connectingRodLength)

      // Position and rotate connecting rod
      if (connectingRodRef.current) {
        connectingRodRef.current.position.y = pistonPosition / 2
        connectingRodRef.current.rotation.z = -rodAngle
      }

      // Ensure piston doesn't rotate
      pistonRef.current.rotation.x = 0
      pistonRef.current.rotation.y = 0
      pistonRef.current.rotation.z = 0
    }

    // Calculate vibration based on RPM, balance, and load
    if (motorRef.current) {
      const balance = 0.9 // 90% balanced (0-1, higher is better balanced)
      const { amplitude, frequency } = calculateVibration(currentRpm, balance, load)

      // Apply vibration to motor housing
      motorRef.current.position.x = Math.sin(state.clock.elapsedTime * frequency * 2) * amplitude * 0.05
      motorRef.current.position.y = Math.sin(state.clock.elapsedTime * frequency * 1.7) * amplitude * 0.04

      // Add slight rotation vibration for realism
      motorRef.current.rotation.x = Math.sin(state.clock.elapsedTime * frequency * 1.3) * amplitude * 0.002
      motorRef.current.rotation.z = Math.sin(state.clock.elapsedTime * frequency * 1.5) * amplitude * 0.001
    }
  })

  // Calculate material properties based on temperature
  const getTemperatureColor = () => {
    if (temperature > 80) return "#ff4d4d" // Red for hot
    if (temperature > 60) return "#ffaa00" // Orange for warm
    return "#66ccff" // Blue for cool
  }

  // Calculate opacity based on view mode
  const getOpacity = (part: string) => {
    if (viewMode === "transparent") {
      if (part === "casing") return 0.3
      if (part === "stator") return 0.7
      return 0.9
    }
    return 1
  }

  // Calculate position offsets for exploded view
  const getExplodedOffset = (part: string) => {
    if (viewMode !== "exploded") return 0

    switch (part) {
      case "top":
        return 1.5
      case "bottom":
        return -1.5
      case "internal":
        return 0.5
      default:
        return 0
    }
  }

  // Calculate thermal expansion scale factor
  const getThermalScale = (part: string) => {
    if (part === "piston") {
      return 1 + thermalExpansion
    }
    return 1
  }

  return (
    <group ref={motorRef}>
      {/* Compressor Base */}
      <Cylinder args={[0.3, 0.8, 0.2, 32]} position={[0, -1.3, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Main Compressor Body - Cylindrical Shell */}
      <Cylinder args={[0.8, 0.8, 2.4, 32]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial
          color="#444444"
          metalness={0.8}
          roughness={0.2}
          opacity={getOpacity("casing")}
          transparent={viewMode === "transparent"}
        />
      </Cylinder>

      {/* Top Dome */}
      <Sphere
        args={[0.8, 32, 16, 0, Math.PI]}
        position={[0, getExplodedOffset("top") + 1.2, 0]}
        rotation={[Math.PI, 0, 32, 16, 0, Math.PI]}
        position={[0, getExplodedOffset("top") + 1.2, 0]}
        rotation={[Math.PI, 0, 0]}
      >
        <meshStandardMaterial color="#444444" metalness={0.8} roughness={0.2} />
      </Sphere>

      {/* Bottom Plate */}
      <Cylinder args={[0.8, 0.8, 0.1, 32]} position={[0, getExplodedOffset("bottom") - 1.25, 0]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
      </Cylinder>

      {/* Mounting Feet */}
      {[-0.6, 0.6].map((x, i) => (
        <Box key={i} args={[0.3, 0.1, 0.6]} position={[x, -1.35, 0]} rotation={[0, 0, 0]}>
          <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
        </Box>
      ))}

      {/* Suction Line (Inlet) */}
      <group position={[0.7, -0.8, 0]} rotation={[0, 0, Math.PI / 2]}>
        <Cylinder args={[0.15, 0.15, 0.4, 16]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>

        {/* Service Valve */}
        <Box args={[0.25, 0.25, 0.25]} position={[0.3, 0, 0]}>
          <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
        </Box>

        <Text
          position={[0, 0.25, 0]}
          rotation={[0, 0, Math.PI / 2]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Sucção
        </Text>
      </group>

      {/* Discharge Line (Outlet) */}
      <group position={[-0.7, 0.8, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <Cylinder args={[0.12, 0.12, 0.4, 16]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>

        {/* Service Valve */}
        <Box args={[0.2, 0.2, 0.2]} position={[0.3, 0, 0]}>
          <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
        </Box>

        <Text
          position={[0, 0.25, 0]}
          rotation={[0, 0, Math.PI / 2]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Descarga
        </Text>
      </group>

      {/* Internal Components (visible in transparent/exploded mode) */}
      <group ref={internalRef} position={[0, getExplodedOffset("internal"), 0]} visible={viewMode !== "normal"}>
        {/* Motor Stator */}
        <Cylinder args={[0.65, 0.65, 1.2, 32]} position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
          <meshStandardMaterial
            color="#555555"
            metalness={0.6}
            roughness={0.4}
            opacity={getOpacity("stator")}
            transparent={viewMode === "transparent"}
          />
        </Cylinder>

        {/* Motor Rotor */}
        <Cylinder ref={rotorRef} args={[0.45, 0.45, 1.3, 32]} position={[0, -0.3, 0]} rotation={[0, 0, 0]}>
          <meshStandardMaterial
            color={getTemperatureColor()}
            emissive={getTemperatureColor()}
            emissiveIntensity={0.2}
            metalness={0.7}
            roughness={0.3}
            opacity={getOpacity("rotor")}
            transparent={viewMode === "transparent"}
          />
        </Cylinder>

        {/* Crankshaft */}
        <Cylinder ref={crankshaftRef} args={[0.1, 0.1, 1.8, 16]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
        </Cylinder>

        {/* Crankshaft Offset */}
        <Cylinder
          ref={crankOffsetRef}
          args={[0.08, 0.08, 0.1, 16]}
          position={[crankRadius, 0.6, 0]}
          rotation={[0, 0, 0]}
        >
          <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
        </Cylinder>

        {/* Compression Mechanism */}
        <group position={[0, 0.6, 0]}>
          {/* Connecting Rod */}
          <Box ref={connectingRodRef} args={[0.08, connectingRodLength, 0.08]} position={[crankRadius / 2, 0.15, 0]}>
            <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
          </Box>

          {/* Piston Group */}
          <group ref={pistonRef} position={[0, 0.3, 0]}>
            {/* Piston */}
            <Cylinder
              args={[0.25 * getThermalScale("piston"), 0.25 * getThermalScale("piston"), 0.15, 16]}
              position={[0, 0, 0]}
              rotation={[0, 0, 0]}
            >
              <meshStandardMaterial
                color="#999999"
                metalness={0.6}
                roughness={0.4}
                emissive={temperature > 70 ? "#ff4000" : "#000000"}
                emissiveIntensity={temperature > 70 ? (temperature - 70) / 30 : 0}
              />
            </Cylinder>

            {/* Piston Rings */}
            {[0.05, -0.05].map((y, i) => (
              <Torus
                key={i}
                args={[0.25 * getThermalScale("piston"), 0.02, 16, 32]}
                position={[0, y, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
              </Torus>
            ))}
          </group>

          {/* Cylinder */}
          <Cylinder args={[0.27, 0.27, 0.6, 16]} position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial
              color="#777777"
              metalness={0.7}
              roughness={0.3}
              opacity={getOpacity("cylinder")}
              transparent={viewMode === "transparent"}
            />
          </Cylinder>

          {/* Cylinder Head */}
          <Cylinder args={[0.3, 0.3, 0.1, 16]} position={[0, 0.95, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
          </Cylinder>

          {/* Valve Plate */}
          <Cylinder args={[0.28, 0.28, 0.05, 16]} position={[0, 0.88, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
          </Cylinder>
        </group>

        {/* Oil Sump */}
        <Cylinder args={[0.7, 0.7, 0.3, 32]} position={[0, -1.1, 0]} rotation={[0, 0, 0]}>
          <meshStandardMaterial
            color="#663300"
            metalness={0.4}
            roughness={0.6}
            opacity={getOpacity("oil")}
            transparent={viewMode === "transparent"}
          />
        </Cylinder>
      </group>

      {/* Oil Sight Glass */}
      <Cylinder args={[0.1, 0.1, 0.05, 16]} position={[0.6, -1, 0.5]} rotation={[Math.PI / 6, 0, 0]}>
        <meshStandardMaterial color="#aaddff" metalness={0.9} roughness={0.1} transparent opacity={0.7} />
      </Cylinder>

      {/* Cooling Fins (simplified) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <Box
          key={i}
          args={[0.1, 0.8, 0.05]}
          position={[Math.sin((i * Math.PI) / 4) * 0.85, -0.5, Math.cos((i * Math.PI) / 4) * 0.85]}
          rotation={[0, (i * Math.PI) / 4, 0]}
        >
          <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
        </Box>
      ))}

      {/* RPM and Temperature Display (for debugging) */}
      {viewMode !== "normal" && (
        <Text
          position={[0, -1.8, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {`${Math.round(currentRpm)} RPM | ${temperature.toFixed(1)}°C`}
        </Text>
      )}
    </group>
  )
}
