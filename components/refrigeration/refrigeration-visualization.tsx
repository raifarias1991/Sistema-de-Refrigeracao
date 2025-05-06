"use client"

import { useState, useRef, useEffect } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei"
import { useRefrigerationStore } from "@/lib/refrigeration-store"
import { RefrigerationSystem } from "@/components/refrigeration/refrigeration-system"
import { ViewControls } from "@/components/refrigeration/view-controls"
import { ComponentSelector } from "@/components/refrigeration/component-selector"
import { ComponentInfoPanel } from "@/components/refrigeration/component-info-panel"

export default function RefrigerationVisualization() {
  const [viewMode, setViewMode] = useState<"normal" | "exploded" | "transparent">("normal")
  const [currentComponent, setCurrentComponent] = useState<string>("full")
  const [showInfo, setShowInfo] = useState(false)
  const [infoPosition, setInfoPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Obter estados do store
  const {
    compressorRpm,
    isRunning,
    systemTemperature,
    targetTemperature,
    compressorPressure,
    condenserPressure,
    evaporatorPressure,
    refrigerantFlow,
  } = useRefrigerationStore()

  // Mostrar painel de informações quando um componente é selecionado
  useEffect(() => {
    setShowInfo(currentComponent !== "full")

    // Posicionar o painel de informações
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()

      // Ajustar posição para evitar sobreposição
      setInfoPosition({
        x: rect.width - 280 - 20, // 20px de margem da borda
        y: 80, // Posicionado abaixo dos controles de visualização
      })
    }
  }, [currentComponent, containerRef.current])

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Controles de visualização - Posicionado no canto superior esquerdo com espaçamento adequado */}
      <div className="absolute top-4 left-4 z-20">
        <ViewControls currentView={viewMode} onViewChange={setViewMode} />
      </div>

      {/* Seletor de componentes - Posicionado no canto superior direito com espaçamento adequado */}
      <div className="absolute top-4 right-4 z-20">
        <ComponentSelector currentComponent={currentComponent} onComponentChange={setCurrentComponent} />
      </div>

      {/* Painel de informações do componente - Posicionado para evitar sobreposição */}
      {showInfo && (
        <div
          className="absolute z-10"
          style={{
            top: `${infoPosition.y}px`,
            right: "20px",
            maxWidth: "280px",
          }}
        >
          <ComponentInfoPanel
            currentComponent={currentComponent}
            compressorRpm={compressorRpm}
            compressorPressure={compressorPressure}
            condenserPressure={condenserPressure}
            evaporatorPressure={evaporatorPressure}
            systemTemperature={systemTemperature}
            targetTemperature={targetTemperature}
          />
        </div>
      )}

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

        {/* Sistema de refrigeração */}
        <RefrigerationSystem
          compressorRpm={compressorRpm}
          isRunning={isRunning}
          systemTemperature={systemTemperature}
          targetTemperature={targetTemperature}
          compressorPressure={compressorPressure}
          condenserPressure={condenserPressure}
          evaporatorPressure={evaporatorPressure}
          refrigerantFlow={refrigerantFlow}
          viewMode={viewMode}
          focusComponent={currentComponent}
        />
      </Canvas>

      {/* Instruções de uso - Posicionado na parte inferior com espaçamento adequado */}
      <div className="absolute bottom-4 left-4 right-4 text-xs text-zinc-500 bg-zinc-900/80 p-2 rounded-md backdrop-blur-sm">
        <p>
          <span className="font-medium">Controles:</span> Arraste para girar | Scroll para zoom | Shift+Arraste para
          mover
        </p>
      </div>
    </div>
  )
}
