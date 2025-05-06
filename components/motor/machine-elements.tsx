"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Cylinder, Box } from "@react-three/drei"
import type * as THREE from "three" // Alterado de 'import type * as THREE' para importar o objeto THREE
import { calculateAirResistance, defaultProperties } from "@/lib/physics-engine"

// Gearbox Component
export function GearboxElement({ rpm, visible, load = 0.5 }: { rpm: number; visible: boolean; load?: number }) {
  const gearRef = useRef<THREE.Mesh>(null)
  const outputShaftRef = useRef<THREE.Mesh>(null)
  const gearboxRef = useRef<THREE.Group>(null)

  // Estado para rastrear a velocidade angular atual (com inércia)
  const [currentInputVelocity, setCurrentInputVelocity] = useState(0)
  const [currentOutputVelocity, setCurrentOutputVelocity] = useState(0)

  // Parâmetros da caixa de engrenagens
  const gearRatio = 4 // relação de redução
  const efficiency = 0.96 // eficiência da transmissão
  const backlash = 0.02 // folga entre engrenagens (rad)

  // Vibração da caixa de engrenagens
  const [vibration, setVibration] = useState({ x: 0, y: 0, angle: 0 })

  useFrame((state, delta) => {
    // Calcular a velocidade angular alvo em radianos por segundo
    const targetInputVelocity = (rpm / 60) * 2 * Math.PI
    const targetOutputVelocity = targetInputVelocity / gearRatio

    // Aplicar inércia para suavizar as mudanças de velocidade
    const inputInertiaFactor = rpm > 0 ? 0.08 : 0.15
    const outputInertiaFactor = rpm > 0 ? 0.05 : 0.1 // saída tem mais inércia

    setCurrentInputVelocity((prev) => prev + (targetInputVelocity - prev) * inputInertiaFactor)

    setCurrentOutputVelocity((prev) => prev + (targetOutputVelocity - prev) * outputInertiaFactor)

    // Calcular o incremento de ângulo para este frame
    const inputRotationAmount = currentInputVelocity * delta
    const outputRotationAmount = currentOutputVelocity * delta

    if (gearRef.current && outputShaftRef.current && rpm > 0) {
      // Apply rotation ONLY around the z-axis (the shaft's own axis)
      gearRef.current.rotation.z -= inputRotationAmount

      // Simular backlash (folga) na transmissão
      const backlashDelay = Math.sin(state.clock.elapsedTime * 5) * backlash
      outputShaftRef.current.rotation.z -= outputRotationAmount + backlashDelay

      // Ensure no rotation on other axes
      gearRef.current.rotation.x = 0
      gearRef.current.rotation.y = 0
      outputShaftRef.current.rotation.x = 0
      outputShaftRef.current.rotation.y = 0
    }

    // Simular vibração baseada na carga e RPM
    if (gearboxRef.current && rpm > 0) {
      const time = state.clock.elapsedTime
      const loadFactor = load * 0.5
      const rpmFactor = (rpm / 3000) * 0.5

      // Vibração aumenta com carga e RPM
      const vibrationAmplitude = 0.001 * loadFactor * rpmFactor

      // Frequências diferentes para criar um padrão de vibração realista
      const vibX = Math.sin(time * 30) * vibrationAmplitude
      const vibY = Math.sin(time * 25) * vibrationAmplitude * 0.7
      const vibAngle = Math.sin(time * 15) * vibrationAmplitude * 0.1

      setVibration({ x: vibX, y: vibY, angle: vibAngle })

      // Aplicar vibração
      gearboxRef.current.position.x = vibX
      gearboxRef.current.position.y = vibY
      gearboxRef.current.rotation.z = vibAngle
    } else if (gearboxRef.current) {
      // Resetar quando parado
      gearboxRef.current.position.x = 0
      gearboxRef.current.position.y = 0
      gearboxRef.current.rotation.z = 0
    }
  })

  if (!visible) return null

  return (
    <group ref={gearboxRef} position={[0, 0, 3]}>
      {/* Gearbox Housing */}
      <Box args={[1.5, 1.5, 1.2]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
      </Box>

      {/* Input Gear */}
      <Cylinder ref={gearRef} args={[0.4, 0.4, 0.3, 32]} position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Output Gear (larger) */}
      <Cylinder args={[0.8, 0.8, 0.3, 32]} position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#aaaaaa" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Output Shaft */}
      <Cylinder ref={outputShaftRef} args={[0.15, 0.15, 2, 16]} position={[0, 0, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
      </Cylinder>

      {/* Mounting Brackets */}
      <Box args={[1.6, 0.2, 0.2]} position={[0, 0.85, 0]}>
        <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
      </Box>
      <Box args={[1.6, 0.2, 0.2]} position={[0, -0.85, 0]}>
        <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
      </Box>

      {/* Lubrication Oil Drips - visíveis apenas quando em movimento */}
      {rpm > 0 && (
        <>
          <Box
            args={[0.03, 0.08, 0.03]}
            position={[0.2 + Math.sin(Date.now() * 0.001) * 0.1, -0.2 + Math.sin(Date.now() * 0.002) * 0.1, 0.1]}
          >
            <meshStandardMaterial color="#aa8800" metalness={0.5} roughness={0.3} transparent opacity={0.7} />
          </Box>
          <Box
            args={[0.02, 0.05, 0.02]}
            position={[-0.15 + Math.sin(Date.now() * 0.0015) * 0.1, -0.3 + Math.sin(Date.now() * 0.0025) * 0.1, 0.2]}
          >
            <meshStandardMaterial color="#aa8800" metalness={0.5} roughness={0.3} transparent opacity={0.7} />
          </Box>
        </>
      )}
    </group>
  )
}

// Flexible Coupling Component
export function FlexibleCouplingElement({
  rpm,
  visible,
  load = 0.5,
}: { rpm: number; visible: boolean; load?: number }) {
  const inputHalfRef = useRef<THREE.Mesh>(null)
  const outputHalfRef = useRef<THREE.Mesh>(null)
  const elastomerRef = useRef<THREE.Mesh>(null)
  const couplingRef = useRef<THREE.Group>(null)

  // Estado para rastrear a velocidade angular atual (com inércia)
  const [currentVelocity, setCurrentVelocity] = useState(0)

  // Estado para rastrear a deformação do elastômero
  const [elastomerDeformation, setElastomerDeformation] = useState(0)

  // Estado para rastrear o desalinhamento
  const [misalignment, setMisalignment] = useState({ x: 0, y: 0, angle: 0 })

  useFrame((state, delta) => {
    // Calcular a velocidade angular alvo em radianos por segundo
    const targetVelocity = (rpm / 60) * 2 * Math.PI

    // Aplicar inércia para suavizar as mudanças de velocidade
    const inertiaFactor = rpm > 0 ? 0.1 : 0.2
    setCurrentVelocity((prev) => prev + (targetVelocity - prev) * inertiaFactor)

    // Calcular o incremento de ângulo para este frame
    const rotationAmount = currentVelocity * delta

    // Simular deformação do elastômero baseada na carga
    const targetDeformation = load * 0.05 // máximo de 5% de deformação
    setElastomerDeformation((prev) => prev + (targetDeformation - prev) * 0.1)

    // Simular desalinhamento dinâmico
    const time = state.clock.elapsedTime
    const newMisalignment = {
      x: Math.sin(time * 0.5) * 0.01,
      y: Math.cos(time * 0.7) * 0.01,
      angle: Math.sin(time * 0.3) * 0.02,
    }
    setMisalignment(newMisalignment)

    if (inputHalfRef.current && outputHalfRef.current && elastomerRef.current && rpm > 0) {
      // Apply rotation ONLY around the z-axis
      inputHalfRef.current.rotation.z -= rotationAmount

      // O elastômero se deforma, criando um pequeno atraso na transmissão
      const elastomerDelay = elastomerDeformation * Math.sin(state.clock.elapsedTime * 10) * 0.1
      elastomerRef.current.rotation.z -= rotationAmount - elastomerDelay

      // A saída segue com um pequeno atraso
      outputHalfRef.current.rotation.z -= rotationAmount - elastomerDelay * 2

      // Ensure no rotation on other axes
      inputHalfRef.current.rotation.x = 0
      inputHalfRef.current.rotation.y = 0
      elastomerRef.current.rotation.x = 0
      elastomerRef.current.rotation.y = 0
      outputHalfRef.current.rotation.x = 0
      outputHalfRef.current.rotation.y = 0
    }

    // Aplicar desalinhamento ao acoplamento de saída
    if (outputHalfRef.current) {
      outputHalfRef.current.position.x = misalignment.x
      outputHalfRef.current.position.y = misalignment.y
      outputHalfRef.current.rotation.x = misalignment.angle
    }

    // Deformar o elastômero para compensar o desalinhamento
    if (elastomerRef.current) {
      // Escala não uniforme para simular compressão/tensão
      elastomerRef.current.scale.set(1 + elastomerDeformation, 1 - elastomerDeformation * 0.5, 1 + elastomerDeformation)
    }
  })

  if (!visible) return null

  return (
    <group ref={couplingRef} position={[0, 0, 3]}>
      {/* Input Half */}
      <Cylinder ref={inputHalfRef} args={[0.3, 0.3, 0.3, 32]} position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Elastomeric Element */}
      <Cylinder ref={elastomerRef} args={[0.35, 0.35, 0.2, 32]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#444444" metalness={0.2} roughness={0.8} />
      </Cylinder>

      {/* Output Half */}
      <Cylinder ref={outputHalfRef} args={[0.3, 0.3, 0.3, 32]} position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Output Shaft */}
      <Cylinder args={[0.15, 0.15, 1.5, 16]} position={[0, 0, 1]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#aaaaaa" metalness={0.9} roughness={0.1} />
      </Cylinder>
    </group>
  )
}

// Cooling Fan Component
export function CoolingFanElement({
  rpm,
  visible,
  temperature = 45,
}: { rpm: number; visible: boolean; temperature?: number }) {
  const fanRef = useRef<THREE.Group>(null)
  const fanBladeRefs = useRef<THREE.Mesh[]>([])
  const fanHousingRef = useRef<THREE.Mesh>(null)

  // Estado para rastrear a velocidade angular atual (com inércia)
  const [currentVelocity, setCurrentVelocity] = useState(0)

  // Estado para rastrear a deformação das pás do ventilador devido à força centrífuga
  const [bladeDeformation, setBladeDeformation] = useState(0)

  // Estado para rastrear o fluxo de ar
  const [airflow, setAirflow] = useState(0)

  // Efeito para calcular o fluxo de ar baseado no RPM
  useEffect(() => {
    if (rpm > 0) {
      // Fluxo de ar aumenta com o RPM, mas não linearmente
      const baseAirflow = rpm * 0.05 // CFM

      // Ajuste pela temperatura (ar quente é menos denso)
      const temperatureFactor = 1 - (temperature - 25) / 100

      setAirflow(baseAirflow * temperatureFactor)
    } else {
      setAirflow(0)
    }
  }, [rpm, temperature])

  useFrame((state, delta) => {
    // Calcular a velocidade angular alvo em radianos por segundo
    const targetVelocity = (rpm / 60) * 2 * Math.PI

    // Aplicar inércia para suavizar as mudanças de velocidade
    const inertiaFactor = rpm > 0 ? 0.05 : 0.1
    setCurrentVelocity((prev) => prev + (targetVelocity - prev) * inertiaFactor)

    // Calcular o incremento de ângulo para este frame
    const rotationAmount = currentVelocity * delta

    // Calcular a deformação das pás baseada na velocidade
    const targetDeformation = Math.pow(currentVelocity / ((3000 / 60) * 2 * Math.PI), 2) * 0.05
    setBladeDeformation((prev) => prev + (targetDeformation - prev) * 0.1)

    if (fanRef.current && rpm > 0) {
      // For fan, we're rotating around x-axis since it's oriented differently
      // Apply rotation ONLY around the x-axis (the fan's own axis)
      fanRef.current.rotation.x += rotationAmount

      // Ensure no rotation on other axes
      fanRef.current.rotation.y = 0
      fanRef.current.rotation.z = 0

      // Aplicar resistência do ar
      const airResistance = calculateAirResistance(
        currentVelocity,
        0.6, // raio das pás
        0.8, // coeficiente de arrasto
      )

      // A resistência do ar reduz ligeiramente a velocidade
      if (currentVelocity > 0) {
        setCurrentVelocity((prev) => Math.max(0, prev - airResistance * delta * 0.01))
      }
    }

    // Aplicar deformação às pás do ventilador
    fanBladeRefs.current.forEach((blade, i) => {
      if (blade) {
        // Deformação aumenta com a distância da ponta
        const angle = (i * Math.PI) / 3.5
        const bendFactor = bladeDeformation * (0.8 + Math.sin(state.clock.elapsedTime * 10 + angle) * 0.2)

        // Aplicar curvatura às pás
        blade.rotation.y = bendFactor

        // Alongar ligeiramente as pás
        blade.scale.y = 1 + bladeDeformation * 0.1
      }
    })

    // Simular vibração no housing baseada no RPM
    if (fanHousingRef.current && rpm > 0) {
      const time = state.clock.elapsedTime
      const vibrationAmplitude = Math.pow(rpm / 3000, 2) * 0.002

      fanHousingRef.current.position.x = Math.sin(time * 30) * vibrationAmplitude
      fanHousingRef.current.position.y = Math.sin(time * 25) * vibrationAmplitude
    } else if (fanHousingRef.current) {
      fanHousingRef.current.position.x = 0
      fanHousingRef.current.position.y = 0
    }
  })

  if (!visible) return null

  return (
    <group position={[0, 0, -2]}>
      {/* Fan Housing */}
      <Cylinder ref={fanHousingRef} args={[1.2, 1.2, 0.3, 32]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
      </Cylinder>

      {/* Fan Blades */}
      <group ref={fanRef} position={[0, 0, 0.2]}>
        {Array.from({ length: 7 }).map((_, i) => (
          <Box
            key={i}
            ref={(el) => {
              if (el) fanBladeRefs.current[i] = el
            }}
            args={[0.1, 0.8, 0.05]}
            position={[Math.sin((i * Math.PI) / 3.5) * 0.6, Math.cos((i * Math.PI) / 3.5) * 0.6, 0]}
            rotation={[0, 0, (i * Math.PI) / 3.5 + Math.PI / 4]}
          >
            <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.4} />
          </Box>
        ))}
        <Cylinder args={[0.2, 0.2, 0.1, 16]} position={[0, 0, 0]} rotation={[0, 0, 0]}>
          <meshStandardMaterial color="#555555" metalness={0.7} roughness={0.3} />
        </Cylinder>
      </group>

      {/* Mounting Bracket */}
      <Box args={[0.1, 2.5, 0.1]} position={[0, 0, -0.5]}>
        <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.4} />
      </Box>

      {/* Visualização do fluxo de ar (visível apenas quando em movimento) */}
      {rpm > 0 && airflow > 0 && (
        <group position={[0, 0, 0.5]}>
          {Array.from({ length: 15 }).map((_, i) => {
            const angle = Math.random() * Math.PI * 2
            const radius = Math.random() * 1.1
            const speed = 0.2 + Math.random() * 0.3
            const offset = Math.random() * 10

            return (
              <Box
                key={i}
                args={[0.03, 0.03, 0.03]}
                position={[
                  Math.sin(angle) * radius,
                  Math.cos(angle) * radius,
                  0.3 + ((Date.now() * speed * 0.001 + offset) % 1) * 0.5,
                ]}
              >
                <meshBasicMaterial color="#aaddff" transparent opacity={0.3} />
              </Box>
            )
          })}
        </group>
      )}
    </group>
  )
}

// Flywheel Component
export function FlywheelElement({ rpm, visible, load = 0.5 }: { rpm: number; visible: boolean; load?: number }) {
  const flywheelRef = useRef<THREE.Mesh>(null)
  const flywheelGroupRef = useRef<THREE.Group>(null)

  // Estado para rastrear a velocidade angular atual (com inércia)
  const [currentVelocity, setCurrentVelocity] = useState(0)

  // Propriedades físicas do volante
  const momentOfInertia = defaultProperties.flywheel.momentOfInertia

  // Estado para rastrear a energia cinética armazenada
  const [kineticEnergy, setKineticEnergy] = useState(0)

  // Estado para rastrear a vibração
  const [vibration, setVibration] = useState({ x: 0, y: 0 })

  useFrame((state, delta) => {
    // Calcular a velocidade angular alvo em radianos por segundo
    const targetVelocity = (rpm / 60) * 2 * Math.PI

    // O volante tem alta inércia, então as mudanças de velocidade são mais lentas
    const inertiaFactor = rpm > 0 ? 0.02 : 0.03
    setCurrentVelocity((prev) => prev + (targetVelocity - prev) * inertiaFactor)

    // Calcular o incremento de ângulo para este frame
    const rotationAmount = currentVelocity * delta

    // Calcular a energia cinética armazenada
    const energy = 0.5 * momentOfInertia * Math.pow(currentVelocity, 2)
    setKineticEnergy(energy)

    // Calcular vibração baseada no balanceamento
    const balance = 0.95 // 95% balanceado
    const imbalance = 1 - balance

    // A vibração aumenta com o quadrado da velocidade
    const vibrationAmplitude = imbalance * Math.pow(currentVelocity / ((3000 / 60) * 2 * Math.PI), 2) * 0.003

    // Frequências diferentes para criar um padrão de vibração realista
    const time = state.clock.elapsedTime
    const vibX = Math.sin(time * 30) * vibrationAmplitude
    const vibY = Math.sin(time * 25) * vibrationAmplitude * 0.7

    setVibration({ x: vibX, y: vibY })

    if (flywheelRef.current && rpm > 0) {
      // Calculate rotation amount
      flywheelRef.current.rotation.z -= rotationAmount

      // Ensure no rotation on other axes
      flywheelRef.current.rotation.x = 0
      flywheelRef.current.rotation.y = 0
    }

    // Aplicar vibração ao grupo do volante
    if (flywheelGroupRef.current) {
      flywheelGroupRef.current.position.x = vibration.x
      flywheelGroupRef.current.position.y = vibration.y
    }
  })

  if (!visible) return null

  return (
    <group ref={flywheelGroupRef} position={[0, 0, 3.5]}>
      {/* Flywheel */}
      <Cylinder ref={flywheelRef} args={[1.2, 1.2, 0.4, 32]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </Cylinder>

      {/* Hub */}
      <Cylinder args={[0.3, 0.3, 0.5, 16]} position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
      </Cylinder>

      {/* Spokes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <Box
          key={i}
          args={[0.15, 0.9, 0.1]}
          position={[Math.sin((i * Math.PI) / 3) * 0.6, Math.cos((i * Math.PI) / 3) * 0.6, 0]}
          rotation={[0, 0, (i * Math.PI) / 3]}
        >
          <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
        </Box>
      ))}

      {/* Balanceamento (contrapesos) */}
      <Cylinder args={[0.1, 0.1, 0.2, 8]} position={[0.9, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </Cylinder>

      <Cylinder args={[0.08, 0.08, 0.15, 8]} position={[-0.85, 0.3, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </Cylinder>
    </group>
  )
}
