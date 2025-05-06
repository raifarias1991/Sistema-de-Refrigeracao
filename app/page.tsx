"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import { useRefrigerationStore } from "@/lib/refrigeration-store"
import { RefrigerationControls } from "@/components/refrigeration/refrigeration-controls"
import { RefrigerationMonitor } from "@/components/refrigeration/refrigeration-monitor"
import { AlertsPanel } from "@/components/refrigeration/alerts-panel"

// Importação dinâmica com SSR desativado para componentes 3D
const RefrigerationVisualization = dynamic(() => import("@/components/refrigeration/refrigeration-visualization"), {
  ssr: false,
})

export default function Home() {
  const {
    compressorRpm,
    isRunning,
    systemTemperature,
    targetTemperature,
    setTargetTemperature,
    defrostMode,
    setDefrostMode,
    compressorPressure,
    condenserPressure,
    evaporatorPressure,
    performanceHistory,
    simulateSystemBehavior,
    toggleRunning,
  } = useRefrigerationStore()

  // Garantir que o sistema comece parado
  useEffect(() => {
    if (isRunning) {
      toggleRunning()
    }
  }, [])

  // Simulação do comportamento do sistema
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      // Simular o comportamento do sistema
      simulateSystemBehavior()
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, simulateSystemBehavior])

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">Simulador de Sistema de Refrigeração</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visualização 3D - Ocupa mais espaço na tela */}
          <div className="lg:col-span-8 xl:col-span-9">
            <div className="bg-zinc-900 rounded-lg overflow-hidden h-[600px] border border-zinc-800 shadow-lg">
              <RefrigerationVisualization />
            </div>
          </div>

          {/* Controles - Coluna lateral mais compacta */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-6">
            <RefrigerationControls
              compressorRpm={compressorRpm}
              isRunning={isRunning}
              toggleRunning={toggleRunning}
              systemTemperature={systemTemperature}
              targetTemperature={targetTemperature}
              onTargetTemperatureChange={setTargetTemperature}
              defrostMode={defrostMode}
              onDefrostModeChange={setDefrostMode}
            />
            <AlertsPanel />
          </div>

          {/* Monitor de desempenho (span completo) */}
          <div className="lg:col-span-12 space-y-6">
            <RefrigerationMonitor
              compressorRpm={compressorRpm}
              systemTemperature={systemTemperature}
              targetTemperature={targetTemperature}
              compressorPressure={compressorPressure}
              condenserPressure={condenserPressure}
              evaporatorPressure={evaporatorPressure}
              performanceHistory={performanceHistory}
              isRunning={isRunning}
            />
          </div>
        </div>

        <footer className="mt-8 text-center text-zinc-500 text-sm">
          <p>Simulador de Sistema de Refrigeração v1.0</p>
          <p className="mt-1">Desenvolvido com Next.js, Three.js e Zustand</p>
        </footer>
      </div>
    </main>
  )
}
