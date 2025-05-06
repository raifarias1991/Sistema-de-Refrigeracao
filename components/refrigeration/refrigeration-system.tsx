"use client"

import type React from "react"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Cylinder, Box, Text, Sphere, Tube } from "@react-three/drei"
import * as THREE from "three"

type RefrigerationSystemProps = {
  compressorRpm: number
  isRunning: boolean
  systemTemperature: number
  targetTemperature: number
  compressorPressure: number
  condenserPressure: number
  evaporatorPressure: number
  refrigerantFlow: number
  viewMode: "normal" | "exploded" | "transparent"
  focusComponent: string
}

export function RefrigerationSystem({
  compressorRpm,
  isRunning,
  systemTemperature,
  targetTemperature,
  compressorPressure,
  condenserPressure,
  evaporatorPressure,
  refrigerantFlow,
  viewMode,
  focusComponent,
}: RefrigerationSystemProps) {
  // Refs para os componentes animados
  const compressorRef = useRef<THREE.Group>(null)
  const compressorPistonRef = useRef<THREE.Group>(null)
  const compressorRotorRef = useRef<THREE.Mesh>(null)
  const fanRef = useRef<THREE.Group>(null)
  const refrigerantParticlesRef = useRef<THREE.Group>(null)
  const expansionValveRef = useRef<THREE.Mesh>(null)
  const evaporatorFanRef = useRef<THREE.Group>(null)

  // Refs para os tubos de refrigerante
  const highPressureGasTubeRef = useRef<THREE.Mesh>(null)
  const highPressureLiquidTubeRef = useRef<THREE.Mesh>(null)
  const lowPressureLiquidTubeRef = useRef<THREE.Mesh>(null)
  const lowPressureGasTubeRef = useRef<THREE.Mesh>(null)

  // Refs para efeitos visuais
  const condenserHeatRef = useRef<THREE.Group>(null)
  const evaporatorColdRef = useRef<THREE.Group>(null)
  const frostRef = useRef<THREE.Mesh>(null)

  // Calcular a opacidade com base no modo de visualização
  const getOpacity = (part: string) => {
    if (viewMode === "transparent") {
      if (part === "casing") return 0.3
      if (part === "internal") return 0.7
      return 0.9
    }
    return 1
  }

  // Calcular o deslocamento para a visualização explodida
  const getExplodedOffset = (part: string) => {
    if (viewMode !== "exploded") return 0

    switch (part) {
      case "compressor":
        return -4
      case "condenser":
        return 2
      case "expansion":
        return 0
      case "evaporator":
        return 4
      default:
        return 0
    }
  }

  // Calcular a cor do refrigerante com base na temperatura e pressão
  const getRefrigerantColor = (section: string) => {
    if (section === "highPressureGas") return "#ff3333" // Vermelho intenso para gás de alta pressão/temperatura
    if (section === "highPressureLiquid") return "#ff9966" // Laranja para líquido de alta pressão
    if (section === "lowPressureLiquid") return "#99ccff" // Azul claro para líquido de baixa pressão
    if (section === "lowPressureGas") return "#66ccff" // Azul para gás de baixa pressão/temperatura
    return "#66ffcc" // Verde para retorno ao compressor
  }

  // Calcular a intensidade de operação com base na diferença de temperatura
  const getOperationIntensity = () => {
    return Math.min(1, Math.max(0.2, Math.abs(systemTemperature - targetTemperature) / 20))
  }

  // Calcular a visibilidade dos componentes com base no foco
  const isVisible = (component: string) => {
    if (focusComponent === "full") return true
    return focusComponent === component
  }

  // Criar curvas para os tubos de refrigerante
  const tubePathsData = useMemo(() => {
    // Pontos de controle para os tubos
    const compressorOutlet = new THREE.Vector3(-2.5, -0.2, 0)
    const condenserInlet = new THREE.Vector3(0, 1.0, 0)
    const condenserOutlet = new THREE.Vector3(0, 0.5, 0)
    const expansionInlet = new THREE.Vector3(1.5, 0.2, 0)
    const expansionOutlet = new THREE.Vector3(1.5, -0.2, 0)
    const evaporatorInlet = new THREE.Vector3(0, -1.0, 0)
    const evaporatorOutlet = new THREE.Vector3(0, -0.5, 0)
    const compressorInlet = new THREE.Vector3(-2.5, 0.2, 0)

    // Curva: Compressor para Condensador (gás de alta pressão)
    const highPressureGasPath = new THREE.CatmullRomCurve3([
      compressorOutlet,
      new THREE.Vector3(-1.5, 0.5, 0),
      condenserInlet,
    ])

    // Curva: Condensador para Válvula de Expansão (líquido de alta pressão)
    const highPressureLiquidPath = new THREE.CatmullRomCurve3([
      condenserOutlet,
      new THREE.Vector3(0.75, 0.5, 0),
      expansionInlet,
    ])

    // Curva: Válvula de Expansão para Evaporador (líquido de baixa pressão)
    const lowPressureLiquidPath = new THREE.CatmullRomCurve3([
      expansionOutlet,
      new THREE.Vector3(0.75, -0.5, 0),
      evaporatorInlet,
    ])

    // Curva: Evaporador para Compressor (gás de baixa pressão)
    const lowPressureGasPath = new THREE.CatmullRomCurve3([
      evaporatorOutlet,
      new THREE.Vector3(-1.5, -0.5, 0),
      compressorInlet,
    ])

    return {
      highPressureGasPath,
      highPressureLiquidPath,
      lowPressureLiquidPath,
      lowPressureGasPath,
    }
  }, [])

  // Animar os componentes do sistema
  useFrame((state, delta) => {
    // Animar o compressor
    if (compressorRef.current && isRunning) {
      // Vibração do compressor baseada no RPM
      const vibrationIntensity = (compressorRpm / 3000) * 0.002
      compressorRef.current.position.x = Math.sin(state.clock.elapsedTime * 30) * vibrationIntensity
      compressorRef.current.position.y = Math.sin(state.clock.elapsedTime * 25) * vibrationIntensity
    }

    // Animar o rotor do compressor
    if (compressorRotorRef.current && isRunning && compressorRpm > 0) {
      // Rotação do rotor baseada no RPM
      const rotationSpeed = (compressorRpm / 60) * 2 * Math.PI * delta
      compressorRotorRef.current.rotation.z -= rotationSpeed
    }

    // Animar o pistão do compressor
    if (compressorPistonRef.current && isRunning && compressorRpm > 0) {
      // Movimento do pistão baseado no RPM
      const pistonSpeed = (compressorRpm / 60) * Math.PI
      const pistonOffset = Math.sin(state.clock.elapsedTime * pistonSpeed) * 0.15
      compressorPistonRef.current.position.y = pistonOffset
    }

    // Animar o ventilador do condensador
    if (fanRef.current && isRunning && compressorRpm > 0) {
      // Rotação do ventilador baseada no RPM
      const fanSpeed = (compressorRpm / 60) * 2 * Math.PI * delta * 0.5
      fanRef.current.rotation.z -= fanSpeed
    }

    // Animar o ventilador do evaporador
    if (evaporatorFanRef.current && isRunning && compressorRpm > 0) {
      // Rotação do ventilador baseada no RPM
      const fanSpeed = (compressorRpm / 60) * 2 * Math.PI * delta * 0.3
      evaporatorFanRef.current.rotation.z -= fanSpeed
    }

    // Animar as partículas de refrigerante
    if (refrigerantParticlesRef.current && isRunning && compressorRpm > 0) {
      // Velocidade do fluxo baseada no RPM
      const flowSpeed = (compressorRpm / 3000) * delta * 2

      // Animar cada partícula
      refrigerantParticlesRef.current.children.forEach((particle, index) => {
        if (particle instanceof THREE.Mesh) {
          // Diferentes velocidades para diferentes seções do circuito
          let speed = flowSpeed
          let path
          const t = 0

          // Determinar a seção do circuito com base no índice da partícula
          if (index < 5) {
            // Compressor para condensador (gás de alta pressão)
            path = tubePathsData.highPressureGasPath
            speed *= 1.2 // Gás se move mais rápido
          } else if (index < 10) {
            // Condensador para válvula de expansão (líquido de alta pressão)
            path = tubePathsData.highPressureLiquidPath
            speed *= 0.8 // Líquido se move mais lento
          } else if (index < 15) {
            // Válvula de expansão para evaporador (líquido de baixa pressão)
            path = tubePathsData.lowPressureLiquidPath
            speed *= 0.6 // Líquido de baixa pressão se move ainda mais lento
          } else {
            // Evaporador para compressor (gás de baixa pressão)
            path = tubePathsData.lowPressureGasPath
            speed *= 1.0 // Gás de baixa pressão
          }

          // Obter a posição atual da partícula no caminho
          const currentPosition = new THREE.Vector3()
          const currentT = particle.userData.t !== undefined ? particle.userData.t : Math.random()

          // Atualizar a posição no caminho
          const newT = (currentT + speed) % 1
          particle.userData.t = newT

          // Obter a nova posição no caminho
          path.getPoint(newT, currentPosition)
          particle.position.copy(currentPosition)
        }
      })
    }

    // Animar a válvula de expansão
    if (expansionValveRef.current && isRunning) {
      // Pulsar a válvula de expansão para simular o controle de fluxo
      const pulsationIntensity = (compressorRpm / 3000) * 0.05
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * pulsationIntensity
      expansionValveRef.current.scale.set(scale, scale, scale)
    }

    // Animar efeitos de calor no condensador
    if (condenserHeatRef.current && isRunning) {
      condenserHeatRef.current.children.forEach((heatWave, index) => {
        if (heatWave instanceof THREE.Mesh) {
          // Movimento ascendente das ondas de calor
          heatWave.position.y += delta * 0.2 * (condenserPressure / 15)

          // Resetar posição quando atinge certo limite
          if (heatWave.position.y > 1.5) {
            heatWave.position.y = 0.2
          }

          // Opacidade baseada na altura
          if (heatWave.material instanceof THREE.Material) {
            const material = heatWave.material as THREE.MeshStandardMaterial
            material.opacity = 0.7 - (heatWave.position.y / 1.5) * 0.7
          }
        }
      })
    }

    // Animar efeitos de frio no evaporador
    if (evaporatorColdRef.current && isRunning) {
      evaporatorColdRef.current.children.forEach((coldEffect, index) => {
        if (coldEffect instanceof THREE.Mesh) {
          // Movimento descendente dos efeitos de frio
          coldEffect.position.y -= delta * 0.1 * (1 - evaporatorPressure / 10)

          // Resetar posição quando atinge certo limite
          if (coldEffect.position.y < -1.5) {
            coldEffect.position.y = -0.2
          }

          // Opacidade baseada na altura
          if (coldEffect.material instanceof THREE.Material) {
            const material = coldEffect.material as THREE.MeshStandardMaterial
            material.opacity = 0.5 - (Math.abs(coldEffect.position.y) / 1.5) * 0.5
          }
        }
      })
    }

    // Animar formação de gelo no evaporador
    if (frostRef.current && systemTemperature < 0) {
      // Aumentar a opacidade do gelo conforme a temperatura diminui
      if (frostRef.current.material instanceof THREE.Material) {
        const material = frostRef.current.material as THREE.MeshStandardMaterial
        const targetOpacity = Math.min(0.8, Math.abs(systemTemperature) / 10)
        material.opacity += (targetOpacity - material.opacity) * 0.01
      }
    } else if (frostRef.current && systemTemperature >= 0) {
      // Diminuir a opacidade do gelo conforme a temperatura aumenta
      if (frostRef.current.material instanceof THREE.Material) {
        const material = frostRef.current.material as THREE.MeshStandardMaterial
        material.opacity *= 0.98
      }
    }

    // Atualizar cores dos tubos com base nas pressões e fluxo
    const updateTubeMaterial = (tubeRef: React.RefObject<THREE.Mesh>, color: string, emissiveIntensity: number) => {
      if (tubeRef.current && tubeRef.current.material instanceof THREE.MeshStandardMaterial) {
        const material = tubeRef.current.material
        material.emissiveIntensity = isRunning ? emissiveIntensity : 0
      }
    }

    // Atualizar materiais dos tubos
    const flowIntensity = refrigerantFlow / 100
    updateTubeMaterial(highPressureGasTubeRef, getRefrigerantColor("highPressureGas"), flowIntensity * 0.7)
    updateTubeMaterial(highPressureLiquidTubeRef, getRefrigerantColor("highPressureLiquid"), flowIntensity * 0.5)
    updateTubeMaterial(lowPressureLiquidTubeRef, getRefrigerantColor("lowPressureLiquid"), flowIntensity * 0.3)
    updateTubeMaterial(lowPressureGasTubeRef, getRefrigerantColor("lowPressureGas"), flowIntensity * 0.4)
  })

  // Posições dos componentes no layout real
  const compressorPosition = [-2.5, 0, 0]
  const condenserPosition = [0, 1.5, 0]
  const expansionPosition = [1.5, 0, 0]
  const evaporatorPosition = [0, -1.5, 0]

  return (
    <group>
      {/* Compressor */}
      <group
        ref={compressorRef}
        position={[
          compressorPosition[0] + getExplodedOffset("compressor"),
          compressorPosition[1],
          compressorPosition[2],
        ]}
        visible={isVisible("compressor")}
      >
        <Text
          position={[0, 1.2, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Compressor
        </Text>

        {/* Corpo do compressor - mais realista */}
        <Cylinder args={[0.8, 0.8, 1.6, 32]} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#444444"
            metalness={0.8}
            roughness={0.2}
            opacity={getOpacity("casing")}
            transparent={viewMode === "transparent"}
          />
        </Cylinder>

        {/* Topo do compressor */}
        <Sphere args={[0.8, 32, 16, 0, Math.PI]} position={[0, 0.8, 0]} rotation={[Math.PI, 0, 0]}>
          <meshStandardMaterial
            color="#444444"
            metalness={0.8}
            roughness={0.2}
            opacity={getOpacity("casing")}
            transparent={viewMode === "transparent"}
          />
        </Sphere>

        {/* Base do compressor */}
        <Cylinder args={[0.9, 0.9, 0.2, 32]} position={[0, -0.9, 0]}>
          <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
        </Cylinder>

        {/* Pés de montagem */}
        {[-0.7, 0.7].map((x, i) => (
          <Box key={i} args={[0.3, 0.1, 0.6]} position={[x, -1.0, 0]}>
            <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
          </Box>
        ))}

        {/* Mecanismo interno do compressor (visível em modo transparente/explodido) */}
        <group visible={viewMode !== "normal"}>
          {/* Motor */}
          <Cylinder ref={compressorRotorRef} args={[0.6, 0.6, 0.8, 32]} position={[0, -0.2, 0]}>
            <meshStandardMaterial
              color="#555555"
              metalness={0.7}
              roughness={0.3}
              opacity={getOpacity("internal")}
              transparent={viewMode === "transparent"}
              emissive="#ff4000"
              emissiveIntensity={isRunning ? 0.2 : 0}
            />
          </Cylinder>

          {/* Pistão */}
          <group ref={compressorPistonRef} position={[0, 0.4, 0]}>
            <Cylinder args={[0.25, 0.25, 0.15, 16]} position={[0, 0, 0]}>
              <meshStandardMaterial
                color="#999999"
                metalness={0.6}
                roughness={0.4}
                emissive={systemTemperature > 30 ? "#ff4000" : "#000000"}
                emissiveIntensity={systemTemperature > 30 ? (systemTemperature - 30) / 50 : 0}
              />
            </Cylinder>

            {/* Biela */}
            <Box args={[0.08, 0.3, 0.08]} position={[0, -0.2, 0]}>
              <meshStandardMaterial color="#aaaaaa" metalness={0.7} roughness={0.3} />
            </Box>
          </group>

          {/* Cilindro */}
          <Cylinder args={[0.27, 0.27, 0.4, 16]} position={[0, 0.6, 0]}>
            <meshStandardMaterial
              color="#777777"
              metalness={0.7}
              roughness={0.3}
              opacity={getOpacity("internal")}
              transparent={viewMode === "transparent"}
            />
          </Cylinder>

          {/* Válvulas de sucção e descarga */}
          <Box args={[0.3, 0.05, 0.3]} position={[0, 0.8, 0]}>
            <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
          </Box>
        </group>

        {/* Conexões de entrada e saída */}
        <Cylinder args={[0.15, 0.15, 0.4, 16]} position={[0.6, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>

        <Cylinder args={[0.12, 0.12, 0.4, 16]} position={[-0.6, 0.4, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>

        {/* Terminal elétrico */}
        <Box args={[0.4, 0.2, 0.3]} position={[0, -0.5, 0.7]}>
          <meshStandardMaterial color="#222222" metalness={0.6} roughness={0.4} />
        </Box>

        {/* Indicador de temperatura */}
        <Sphere args={[0.1, 16, 16]} position={[0.6, -0.5, 0.4]}>
          <meshStandardMaterial
            color={systemTemperature > 60 ? "#ff3333" : "#aaaaaa"}
            emissive={systemTemperature > 60 ? "#ff0000" : "#000000"}
            emissiveIntensity={systemTemperature > 60 ? (systemTemperature - 60) / 40 : 0}
          />
        </Sphere>
      </group>

      {/* Condensador */}
      <group
        position={[condenserPosition[0] + getExplodedOffset("condenser"), condenserPosition[1], condenserPosition[2]]}
        visible={isVisible("condenser")}
      >
        <Text
          position={[0, 1.2, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Condensador
        </Text>

        {/* Corpo do condensador - mais realista */}
        <Box args={[2.2, 1.2, 0.3]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#aaaaaa" metalness={0.6} roughness={0.4} />
        </Box>

        {/* Tubos do condensador */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Cylinder
            key={`tube-${i}`}
            args={[0.06, 0.06, 2.0, 16]}
            position={[0, -0.5 + i * 0.2, 0.1]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <meshStandardMaterial
              color="#cc9966"
              metalness={0.9}
              roughness={0.1}
              emissive="#ff6666"
              emissiveIntensity={isRunning ? 0.2 * (condenserPressure / 20) * (1 - i / 6) : 0}
            />
          </Cylinder>
        ))}

        {/* Aletas do condensador */}
        {Array.from({ length: 12 }).map((_, i) => (
          <Box key={`fin-${i}`} args={[1.8, 0.05, 0.8]} position={[0, -0.55 + i * 0.1, 0]}>
            <meshStandardMaterial
              color="#cccccc"
              metalness={0.7}
              roughness={0.3}
              emissive="#ff6666"
              emissiveIntensity={isRunning ? 0.2 * (condenserPressure / 20) * (1 - i / 12) : 0}
            />
          </Box>
        ))}

        {/* Ventilador do condensador */}
        <group ref={fanRef} position={[0, 0, 0.6]}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box
              key={i}
              args={[0.1, 0.6, 0.05]}
              position={[Math.sin((i * Math.PI * 2) / 5) * 0.5, Math.cos((i * Math.PI * 2) / 5) * 0.5, 0]}
              rotation={[0, 0, (i * Math.PI * 2) / 5]}
            >
              <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
            </Box>
          ))}
          <Cylinder args={[0.1, 0.1, 0.1, 16]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
          </Cylinder>
        </group>

        {/* Carcaça do ventilador */}
        <Cylinder args={[0.6, 0.6, 0.1, 32]} position={[0, 0, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
        </Cylinder>

        {/* Efeito de calor saindo do condensador */}
        <group ref={condenserHeatRef} visible={isRunning && compressorRpm > 0}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Sphere key={`heat-${i}`} args={[0.2, 8, 8]} position={[-0.8 + i * 0.4, 0.2 + Math.random() * 0.3, 0.4]}>
              <meshStandardMaterial
                color="#ff6666"
                transparent={true}
                opacity={0.3}
                emissive="#ff3333"
                emissiveIntensity={0.5}
              />
            </Sphere>
          ))}
        </group>

        {/* Conexões de entrada e saída */}
        <Cylinder args={[0.12, 0.12, 0.3, 16]} position={[-1.0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>

        <Cylinder args={[0.1, 0.1, 0.3, 16]} position={[1.0, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>
      </group>

      {/* Válvula de Expansão */}
      <group
        position={[expansionPosition[0] + getExplodedOffset("expansion"), expansionPosition[1], expansionPosition[2]]}
        visible={isVisible("expansion")}
      >
        <Text
          position={[0, 0.7, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Válvula de Expansão
        </Text>

        {/* Corpo da válvula - mais realista */}
        <Box ref={expansionValveRef} args={[0.4, 0.3, 0.3]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#666666" metalness={0.7} roughness={0.3} />
        </Box>

        {/* Bulbo sensor */}
        <Cylinder args={[0.08, 0.08, 0.5, 16]} position={[0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.4} />
        </Cylinder>

        {/* Tubo capilar */}
        <Cylinder args={[0.05, 0.05, 0.3, 16]} position={[0, -0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#888888" metalness={0.6} roughness={0.4} />
        </Cylinder>

        {/* Conexões de entrada e saída */}
        <Cylinder args={[0.1, 0.1, 0.3, 16]} position={[-0.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>

        <Cylinder args={[0.08, 0.08, 0.3, 16]} position={[0, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>

        {/* Indicador de pressão */}
        <Cylinder args={[0.1, 0.1, 0.05, 16]} position={[0, 0.2, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial
            color="#aaddff"
            transparent={true}
            opacity={0.7}
            emissive="#66ccff"
            emissiveIntensity={isRunning ? 0.3 : 0}
          />
        </Cylinder>

        {/* Parafuso de ajuste */}
        <Cylinder args={[0.05, 0.05, 0.1, 16]} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#333333" metalness={0.9} roughness={0.1} />
        </Cylinder>
      </group>

      {/* Evaporador */}
      <group
        position={[
          evaporatorPosition[0] + getExplodedOffset("evaporator"),
          evaporatorPosition[1],
          evaporatorPosition[2],
        ]}
        visible={isVisible("evaporator")}
      >
        <Text
          position={[0, 1.2, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.3}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Evaporador
        </Text>

        {/* Corpo do evaporador - mais realista */}
        <Box args={[2.2, 1.2, 0.3]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#aaaaaa" metalness={0.6} roughness={0.4} />
        </Box>

        {/* Tubos do evaporador */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Cylinder
            key={`tube-${i}`}
            args={[0.06, 0.06, 2.0, 16]}
            position={[0, -0.5 + i * 0.2, 0.1]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <meshStandardMaterial
              color="#cc9966"
              metalness={0.9}
              roughness={0.1}
              emissive="#66ccff"
              emissiveIntensity={isRunning ? 0.2 * (1 - evaporatorPressure / 10) * (i / 6) : 0}
            />
          </Cylinder>
        ))}

        {/* Aletas do evaporador */}
        {Array.from({ length: 12 }).map((_, i) => (
          <Box key={`fin-${i}`} args={[1.8, 0.05, 0.8]} position={[0, -0.55 + i * 0.1, 0]}>
            <meshStandardMaterial
              color="#cccccc"
              metalness={0.7}
              roughness={0.3}
              emissive="#66ccff"
              emissiveIntensity={isRunning ? 0.2 * (1 - evaporatorPressure / 10) * (i / 12) : 0}
            />
          </Box>
        ))}

        {/* Ventilador do evaporador */}
        <group ref={evaporatorFanRef} position={[0, 0, -0.6]}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box
              key={i}
              args={[0.1, 0.6, 0.05]}
              position={[Math.sin((i * Math.PI * 2) / 5) * 0.5, Math.cos((i * Math.PI * 2) / 5) * 0.5, 0]}
              rotation={[0, 0, (i * Math.PI * 2) / 5]}
            >
              <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
            </Box>
          ))}
          <Cylinder args={[0.1, 0.1, 0.1, 16]} position={[0, 0, 0]}>
            <meshStandardMaterial color="#333333" metalness={0.7} roughness={0.3} />
          </Cylinder>
        </group>

        {/* Carcaça do ventilador */}
        <Cylinder args={[0.6, 0.6, 0.1, 32]} position={[0, 0, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#444444" metalness={0.6} roughness={0.4} />
        </Cylinder>

        {/* Formação de gelo (visível apenas quando a temperatura é baixa) */}
        <Box ref={frostRef} args={[1.9, 0.9, 0.4]} position={[0, 0, 0.2]}>
          <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.9} transparent={true} opacity={0} />
        </Box>

        {/* Efeito de ar frio saindo do evaporador */}
        <group ref={evaporatorColdRef} visible={isRunning && compressorRpm > 0}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Sphere key={`cold-${i}`} args={[0.15, 8, 8]} position={[-0.8 + i * 0.4, -0.2 - Math.random() * 0.3, -0.4]}>
              <meshStandardMaterial
                color="#aaddff"
                transparent={true}
                opacity={0.2}
                emissive="#66ccff"
                emissiveIntensity={0.3}
              />
            </Sphere>
          ))}
        </group>

        {/* Conexões de entrada e saída */}
        <Cylinder args={[0.08, 0.08, 0.3, 16]} position={[-1.0, -0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>

        <Cylinder args={[0.1, 0.1, 0.3, 16]} position={[1.0, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
        </Cylinder>

        {/* Bandeja de drenagem */}
        <Box args={[2.0, 0.1, 0.5]} position={[0, -0.7, 0]}>
          <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.4} />
        </Box>
      </group>

      {/* Tubulação de refrigerante - Usando Tube para curvas suaves */}
      <group>
        {/* Tubo: Compressor para Condensador (gás de alta pressão) */}
        <Tube
          ref={highPressureGasTubeRef}
          args={[tubePathsData.highPressureGasPath, 64, 0.08, 8, false]}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial
            color={getRefrigerantColor("highPressureGas")}
            emissive={getRefrigerantColor("highPressureGas")}
            emissiveIntensity={0}
            metalness={0.8}
            roughness={0.2}
          />
        </Tube>

        {/* Tubo: Condensador para Válvula de Expansão (líquido de alta pressão) */}
        <Tube
          ref={highPressureLiquidTubeRef}
          args={[tubePathsData.highPressureLiquidPath, 64, 0.06, 8, false]}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial
            color={getRefrigerantColor("highPressureLiquid")}
            emissive={getRefrigerantColor("highPressureLiquid")}
            emissiveIntensity={0}
            metalness={0.8}
            roughness={0.2}
          />
        </Tube>

        {/* Tubo: Válvula de Expansão para Evaporador (líquido de baixa pressão) */}
        <Tube
          ref={lowPressureLiquidTubeRef}
          args={[tubePathsData.lowPressureLiquidPath, 64, 0.05, 8, false]}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial
            color={getRefrigerantColor("lowPressureLiquid")}
            emissive={getRefrigerantColor("lowPressureLiquid")}
            emissiveIntensity={0}
            metalness={0.8}
            roughness={0.2}
          />
        </Tube>

        {/* Tubo: Evaporador para Compressor (gás de baixa pressão) */}
        <Tube
          ref={lowPressureGasTubeRef}
          args={[tubePathsData.lowPressureGasPath, 64, 0.07, 8, false]}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial
            color={getRefrigerantColor("lowPressureGas")}
            emissive={getRefrigerantColor("lowPressureGas")}
            emissiveIntensity={0}
            metalness={0.8}
            roughness={0.2}
          />
        </Tube>
      </group>

      {/* Partículas de refrigerante (visíveis apenas quando o sistema está funcionando) */}
      {isRunning && (
        <group ref={refrigerantParticlesRef}>
          {/* Partículas: Compressor para Condensador (gás de alta pressão) */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Sphere key={`high-gas-${i}`} args={[0.04, 8, 8]} position={[0, 0, 0.15]}>
              <meshStandardMaterial
                color={getRefrigerantColor("highPressureGas")}
                emissive={getRefrigerantColor("highPressureGas")}
                emissiveIntensity={0.5}
              />
            </Sphere>
          ))}

          {/* Partículas: Condensador para Válvula de Expansão (líquido de alta pressão) */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Sphere key={`high-liquid-${i}`} args={[0.03, 8, 8]} position={[0, 0, 0.15]}>
              <meshStandardMaterial
                color={getRefrigerantColor("highPressureLiquid")}
                emissive={getRefrigerantColor("highPressureLiquid")}
                emissiveIntensity={0.4}
              />
            </Sphere>
          ))}

          {/* Partículas: Válvula de Expansão para Evaporador (líquido de baixa pressão) */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Sphere key={`low-liquid-${i}`} args={[0.02, 8, 8]} position={[0, 0, 0.15]}>
              <meshStandardMaterial
                color={getRefrigerantColor("lowPressureLiquid")}
                emissive={getRefrigerantColor("lowPressureLiquid")}
                emissiveIntensity={0.3}
              />
            </Sphere>
          ))}

          {/* Partículas: Evaporador para Compressor (gás de baixa pressão) */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Sphere key={`low-gas-${i}`} args={[0.03, 8, 8]} position={[0, 0, 0.15]}>
              <meshStandardMaterial
                color={getRefrigerantColor("lowPressureGas")}
                emissive={getRefrigerantColor("lowPressureGas")}
                emissiveIntensity={0.3}
              />
            </Sphere>
          ))}
        </group>
      )}

      {/* Display de temperatura - Reposicionado para evitar sobreposição */}
      <group position={[0, 2.5, 0]}>
        <Box args={[1.2, 0.6, 0.1]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#222222" metalness={0.5} roughness={0.5} />
        </Box>
        <Text
          position={[0, 0, 0.06]}
          rotation={[0, 0, 0]}
          fontSize={0.25}
          color="#00ffff"
          anchorX="center"
          anchorY="middle"
        >
          {systemTemperature.toFixed(1)}°C
        </Text>
      </group>

      {/* Status do sistema - Reposicionado para evitar sobreposição */}
      <Text
        position={[0, -2.5, 0]}
        rotation={[0, 0, 0]}
        fontSize={0.25}
        color={isRunning ? "#00ff00" : "#ff0000"}
        anchorX="center"
        anchorY="middle"
      >
        Status: {isRunning ? "FUNCIONANDO" : "PARADO"}
      </Text>

      {/* Legenda do ciclo de refrigeração */}
      <group position={[-3.5, 2.5, 0]} visible={focusComponent === "full"}>
        <Text
          position={[0, 0.4, 0]}
          rotation={[0, 0, 0]}
          fontSize={0.15}
          color="#ffffff"
          anchorX="left"
          anchorY="middle"
        >
          Ciclo de Refrigeração
        </Text>

        <group position={[0, 0.2, 0]}>
          <Box args={[0.1, 0.1, 0.05]} position={[0, 0, 0]}>
            <meshStandardMaterial color={getRefrigerantColor("highPressureGas")} />
          </Box>
          <Text
            position={[0.6, 0, 0]}
            rotation={[0, 0, 0]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
            Gás de Alta Pressão
          </Text>
        </group>

        <group position={[0, 0, 0]}>
          <Box args={[0.1, 0.1, 0.05]} position={[0, 0, 0]}>
            <meshStandardMaterial color={getRefrigerantColor("highPressureLiquid")} />
          </Box>
          <Text
            position={[0.6, 0, 0]}
            rotation={[0, 0, 0]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
            Líquido de Alta Pressão
          </Text>
        </group>

        <group position={[0, -0.2, 0]}>
          <Box args={[0.1, 0.1, 0.05]} position={[0, 0, 0]}>
            <meshStandardMaterial color={getRefrigerantColor("lowPressureLiquid")} />
          </Box>
          <Text
            position={[0.6, 0, 0]}
            rotation={[0, 0, 0]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
            Líquido de Baixa Pressão
          </Text>
        </group>

        <group position={[0, -0.4, 0]}>
          <Box args={[0.1, 0.1, 0.05]} position={[0, 0, 0]}>
            <meshStandardMaterial color={getRefrigerantColor("lowPressureGas")} />
          </Box>
          <Text
            position={[0.6, 0, 0]}
            rotation={[0, 0, 0]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="left"
            anchorY="middle"
          >
            Gás de Baixa Pressão
          </Text>
        </group>
      </group>
    </group>
  )
}
