"use client"

import { useState, useEffect, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei"
import { useMotorStore } from "@/lib/store"
import { CustomMotorModel } from "@/components/motor/custom-motor-model"
import { EnhancedMotorModel } from "@/components/motor/enhanced-motor-model"
import { IntegratedMotorRefrigeration } from "@/components/refrigeration/integrated-motor-refrigeration"
import { RefrigerationSystem } from "@/components/refrigeration/refrigeration-system"
import {
  GearboxElement,
  FlexibleCouplingElement,
  CoolingFanElement,
  FlywheelElement,
} from "@/components/motor/machine-elements"
import { ViewControls } from "@/components/motor/view-controls"
import { ElementSelector } from "@/components/motor/element-selector"
import { ElementInfoPanel } from "@/components/motor/element-info-panel"

export default function MotorVisualization() {
  const [viewMode, setViewMode] = useState<"normal" | "exploded" | "transparent">("normal")
  const [currentElement, setCurrentElement] = useState<string>("none")
  const [showInfo, setShowInfo] = useState(false)
  const [infoPosition, setInfoPosition] = useState({ x: 0, y: 0 })
  const [useEnhancedPhysics, setUseEnhancedPhysics] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Obter estados do store
  const rpm = useMotorStore((state) => state.rpm)
  const isRunning = useMotorStore((state) => state.isRunning)
  const temperature = useMotorStore((state) => state.temperature)
  const systemTemperature = useMotorStore((state) => state.systemTemperature)
  const targetTemperature = useMotorStore((state) => state.targetTemperature)

  // Calcular carga do motor com base na diferença de temperatura
  const calculateMotorLoad = () => {
    if (!isRunning || rpm === 0) return 0

    // Maior diferença de temperatura = maior carga
    const tempDiff = Math.abs(systemTemperature - targetTemperature)
    const basedOnTemp = Math.min(1, tempDiff / 15)

    // RPM também afeta a carga
    const basedOnRpm = rpm / 3000

    // Combinar fatores
    return Math.min(1, basedOnTemp * 0.7 + basedOnRpm * 0.3)
  }

  const motorLoad = calculateMotorLoad()

  // Mostrar painel de informações quando um elemento é selecionado
  useEffect(() => {
    setShowInfo(currentElement !== "none")
  }, [currentElement])

  // Posicionar o painel de informações
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setInfoPosition({
        x: rect.width - 280,
        y: 20,
      })
    }
  }, [containerRef.current])

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Controles de visualização */}
      <div className="absolute top-4 left-4 z-10">
        <ViewControls currentView={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Seletor de elementos */}
      <div className="absolute top-4 right-4 z-10">
        <ElementSelector currentElement={currentElement} onElementChange={setCurrentElement} />
      </div>

      {/* Painel de informações do elemento */}
      {showInfo && (
        <div
          className="absolute z-10"
          style={{
            top: `${infoPosition.y}px`,
            left: `${infoPosition.x}px`,
          }}
        >
          <ElementInfoPanel currentElement={currentElement} rpm={rpm} />
        </div>
      )}

      {/* Toggle para física avançada */}
      <div className="absolute bottom-12 left-4 z-10">
        <button
          onClick={() => setUseEnhancedPhysics(!useEnhancedPhysics)}
          className={`px-3 py-1 text-xs rounded-md ${
            useEnhancedPhysics ? "bg-green-600 hover:bg-green-700" : "bg-zinc-700 hover:bg-zinc-600"
          }`}
        >
          Física Avançada: {useEnhancedPhysics ? "Ativada" : "Desativada"}
        </button>
      </div>

      {/* Canvas 3D */}
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={40} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} minDistance={5} maxDistance={20} />

        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />

        <Environment preset="warehouse" background={false} />

        {/* Fundo gradiente */}
        <mesh position={[0, 0, -10]}>
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial color="#111111" />
        </mesh>

        {/* Motor principal - escolher entre modelo básico e avançado */}
        {useEnhancedPhysics ? (
          <EnhancedMotorModel viewMode={viewMode} rpm={rpm} temperature={temperature} load={motorLoad} />
        ) : (
          <CustomMotorModel viewMode={viewMode} rpm={rpm} temperature={temperature} />
        )}

        {/* Elementos adicionais baseados na seleção */}
        <GearboxElement rpm={rpm} visible={currentElement === "gearbox"} />
        <FlexibleCouplingElement rpm={rpm} visible={currentElement === "coupling"} />
        <CoolingFanElement rpm={rpm} visible={currentElement === "fan"} />
        <FlywheelElement rpm={rpm} visible={currentElement === "flywheel"} />

        {/* Sistema de refrigeração */}
        <RefrigerationSystem
          rpm={rpm}
          temperature={temperature}
          visible={currentElement === "refrigeration"}
          targetTemperature={targetTemperature}
        />

        {/* Sistema integrado (visível apenas quando nenhum elemento específico está selecionado) */}
        <IntegratedMotorRefrigeration visible={currentElement === "none"} />
      </Canvas>

      {/* Instruções de uso */}
      <div className="absolute bottom-4 left-4 right-4 text-xs text-zinc-500 bg-zinc-900/80 p-2 rounded-md backdrop-blur-sm">
        <p>
          <span className="font-medium">Controles:</span> Arraste para girar | Scroll para zoom | Shift+Arraste para
          mover
        </p>
      </div>
    </div>
  )
}
