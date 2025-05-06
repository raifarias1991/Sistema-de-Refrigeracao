"use client"

import { useRef, useEffect, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Cylinder, Box, Torus, Sphere, Text } from "@react-three/drei"
import * as THREE from "three" // Alterado de 'import type * as THREE' para importar o objeto THREE
import {
  calculatePistonPosition,
  calculateVibration,
  calculateThermalExpansion,
  defaultProperties,
} from "@/lib/physics-engine"

type CustomMotorModelProps = {
  viewMode: "normal" | "exploded" | "transparent"
  rpm: number
  temperature: number
  load?: number
}

export function CustomMotorModel({ viewMode, rpm, temperature, load = 0.5 }: CustomMotorModelProps) {
  const motorRef = useRef<THREE.Group>(null)
  const internalRef = useRef<THREE.Group>(null)
  const rotorRef = useRef<THREE.Mesh>(null)
  const pistonRef = useRef<THREE.Group>(null)
  const crankshaftRef = useRef<THREE.Mesh>(null)
  const crankOffsetRef = useRef<THREE.Mesh>(null)
  const cylinderRef = useRef<THREE.Mesh>(null)

  // Estado para rastrear a posição angular do virabrequim
  const [crankAngle, setCrankAngle] = useState(0)

  // Estado para rastrear a velocidade angular atual (com inércia)
  const [currentAngularVelocity, setCurrentAngularVelocity] = useState(0)

  // Estado para expansão térmica dos componentes
  const [thermalExpansion, setThermalExpansion] = useState({
    cylinder: 1,
    piston: 1,
    rotor: 1,
  })

  // Parâmetros físicos do mecanismo biela-manivela
  const crankRadius = 0.15
  const connectingRodLength = 0.3
  const compressionRatio = 8.5

  // Atualizar a expansão térmica com base na temperatura
  useEffect(() => {
    const referenceTemp = 25 // temperatura de referência em °C

    setThermalExpansion({
      cylinder: calculateThermalExpansion(
        1,
        temperature,
        referenceTemp,
        defaultProperties.piston.thermalExpansion * 0.8,
      ),
      piston: calculateThermalExpansion(1, temperature, referenceTemp, defaultProperties.piston.thermalExpansion),
      rotor: calculateThermalExpansion(1, temperature, referenceTemp, defaultProperties.rotor.thermalExpansion),
    })
  }, [temperature])

  // Rotate the internal components based on RPM with realistic inertia
  useFrame((state, delta) => {
    // Calcular a velocidade angular alvo em radianos por segundo
    const targetAngularVelocity = (rpm / 60) * 2 * Math.PI

    // Aplicar inércia para suavizar as mudanças de velocidade
    const inertiaFactor = rpm > 0 ? 0.05 : 0.1 // desacelera mais rápido do que acelera
    setCurrentAngularVelocity((prev) => prev + (targetAngularVelocity - prev) * inertiaFactor)

    // Calcular o incremento de ângulo para este frame
    const rotationAmount = currentAngularVelocity * delta

    // Atualizar o ângulo do virabrequim
    setCrankAngle((angle) => (angle + rotationAmount) % (2 * Math.PI))

    if (rotorRef.current && crankshaftRef.current && crankOffsetRef.current && rpm > 0) {
      // Apply rotation ONLY around the z-axis (the shaft's own axis)
      rotorRef.current.rotation.z -= rotationAmount
      crankshaftRef.current.rotation.z -= rotationAmount
      crankOffsetRef.current.rotation.z -= rotationAmount

      // Ensure no accidental rotation on other axes
      rotorRef.current.rotation.x = 0
      rotorRef.current.rotation.y = 0
      crankshaftRef.current.rotation.x = 0
      crankshaftRef.current.rotation.y = 0
      crankOffsetRef.current.rotation.x = 0
      crankOffsetRef.current.rotation.y = 0
    }

    // Animate piston movement based on crank angle using realistic physics
    if (pistonRef.current) {
      // Calcular a posição do pistão usando a equação do mecanismo biela-manivela
      const pistonOffset = calculatePistonPosition(crankAngle, crankRadius, connectingRodLength)
      pistonRef.current.position.y = pistonOffset

      // Ensure piston doesn't rotate
      pistonRef.current.rotation.x = 0
      pistonRef.current.rotation.y = 0
      pistonRef.current.rotation.z = 0
    }

    // Vibrate the entire compressor based on RPM and load
    if (motorRef.current && rpm > 0) {
      // Calcular vibração realista baseada no RPM e carga
      const balance = 0.85 // 85% balanceado (0-1, onde 1 é perfeitamente balanceado)
      const vibration = calculateVibration(rpm, balance, load)

      // Aplicar vibração com frequência e amplitude realistas
      const time = state.clock.elapsedTime
      motorRef.current.position.x = Math.sin(time * vibration.frequency * 2) * vibration.amplitude
      motorRef.current.position.y = Math.sin(time * vibration.frequency * 1.5) * vibration.amplitude * 0.7

      // Vibração rotacional sutil
      motorRef.current.rotation.x = Math.sin(time * vibration.frequency) * vibration.amplitude * 0.01
      motorRef.current.rotation.z = Math.sin(time * vibration.frequency * 1.2) * vibration.amplitude * 0.01
    } else if (motorRef.current) {
      // Resetar posição e rotação quando parado
      motorRef.current.position.x = 0
      motorRef.current.position.y = 0
      motorRef.current.rotation.x = 0
      motorRef.current.rotation.z = 0
    }

    // Aplicar expansão térmica aos componentes
    if (cylinderRef.current && pistonRef.current && rotorRef.current) {
      // Ajustar escala do cilindro com base na temperatura
      cylinderRef.current.scale.set(thermalExpansion.cylinder, 1, thermalExpansion.cylinder)

      // Ajustar escala do pistão (ligeiramente diferente do cilindro para simular folga)
      const pistonChildren = pistonRef.current.children
      if (pistonChildren.length > 0 && pistonChildren[1] instanceof THREE.Mesh) {
        pistonChildren[1].scale.set(
          thermalExpansion.piston * 0.98, // Ligeiramente menor que o cilindro
          1,
          thermalExpansion.piston * 0.98,
        )
      }

      // Ajustar escala do rotor
      rotorRef.current.scale.set(thermalExpansion.rotor, 1, thermalExpansion.rotor)
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

  // Calcular a intensidade do brilho baseada na temperatura
  const getEmissiveIntensity = () => {
    return Math.max(0, (temperature - 40) / 60)
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

      {/* Electrical Terminal Box */}
      <Box args={[0.5, 0.3, 0.4]} position={[0, 0.9, 0.7]} rotation={[Math.PI / 6, 0, 0]}>
        <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.4} />
      </Box>

      {/* Terminal Pins */}
      {[-0.15, 0, 0.15].map((x, i) => (
        <Cylinder key={i} args={[0.03, 0.03, 0.2, 8]} position={[x, 0.9, 0.9]} rotation={[Math.PI / 6, 0, 0]}>
          <meshStandardMaterial color="#dddddd" metalness={0.9} roughness={0.1} />
        </Cylinder>
      ))}

      {/* Model Label */}
      <Box args={[0.6, 0.3, 0.01]} position={[0, 0, 0.81]} rotation={[0, 0, 0]}>
        <meshStandardMaterial color="#cccccc" metalness={0.5} roughness={0.5} />
      </Box>

      <Text
        position={[0, 0.1, 0.82]}
        rotation={[0, 0, 0]}
        fontSize={0.08}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        COMPRESSOR HERMÉTICO
      </Text>

      <Text
        position={[0, 0, 0.82]}
        rotation={[0, 0, 0]}
        fontSize={0.06}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        Modelo HC-2000
      </Text>

      <Text
        position={[0, -0.1, 0.82]}
        rotation={[0, 0, 0]}
        fontSize={0.05}
        color="#000000"
        anchorX="center"
        anchorY="middle"
      >
        220V 60Hz 1HP R-134a
      </Text>

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
            emissiveIntensity={getEmissiveIntensity()}
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
        <Cylinder ref={crankOffsetRef} args={[0.08, 0.08, 0.1, 16]} position={[0.15, 0.6, 0]} rotation={[0, 0, 0]}>
          <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
        </Cylinder>

        {/* Compression Mechanism */}
        <group position={[0, 0.6, 0]}>
          {/* Connecting Rod */}
          <group ref={pistonRef}>
            {/* Connecting Rod */}
            <Box args={[0.08, 0.3, 0.08]} position={[0.15, 0.15, 0]} rotation={[0, 0, 0]}>
              <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
            </Box>

            {/* Piston */}
            <Cylinder args={[0.25, 0.25, 0.15, 16]} position={[0, 0.3, 0]} rotation={[0, 0, 0]}>
              <meshStandardMaterial
                color="#999999"
                metalness={0.6}
                roughness={0.4}
                emissive={getTemperatureColor()}
                emissiveIntensity={getEmissiveIntensity() * 0.7}
              />
            </Cylinder>

            {/* Piston Rings */}
            {[0.05, -0.05].map((y, i) => (
              <Torus key={i} args={[0.25, 0.02, 16, 32]} position={[0, 0.3 + y, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
              </Torus>
            ))}
          </group>

          {/* Cylinder */}
          <Cylinder ref={cylinderRef} args={[0.27, 0.27, 0.6, 16]} position={[0, 0.6, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial
              color="#777777"
              metalness={0.7}
              roughness={0.3}
              opacity={getOpacity("cylinder")}
              transparent={viewMode === "transparent"}
              emissive={getTemperatureColor()}
              emissiveIntensity={getEmissiveIntensity() * 0.5}
            />
          </Cylinder>

          {/* Cylinder Head */}
          <Cylinder args={[0.3, 0.3, 0.1, 16]} position={[0, 0.95, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial
              color="#666666"
              metalness={0.8}
              roughness={0.2}
              emissive={getTemperatureColor()}
              emissiveIntensity={getEmissiveIntensity() * 0.4}
            />
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
    </group>
  )
}
