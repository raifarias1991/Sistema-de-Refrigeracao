"use client"

import { useState } from "react"
import { useMotorStore } from "@/lib/store"
import { ControlPanel } from "@/components/motor/control-panel"
import { PerformanceMonitor } from "@/components/motor/performance-monitor"
import { RefrigerationControls } from "@/components/refrigeration/refrigeration-controls"
import { RefrigerationMonitor } from "@/components/refrigeration/refrigeration-monitor"
import { AlertsPanel } from "@/components/motor/alerts-panel"
import dynamic from "next/dynamic"

// Importação dinâmica do componente 3D com SSR desativado
const MotorVisualization = dynamic(() => import("@/components/motor/motor-visualization"), { ssr: false })

export default function MotorDashboard() {
  const {
    rpm,
    temperature,
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
    addPerformanceDataPoint,
  } = useMotorStore()

  // Simular mudanças na temperatura do sistema e pressões quando o motor está funcionando
  useState(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        // Calcular nova temperatura do sistema com base na temperatura alvo
        const currentTemp = useMotorStore.getState().systemTemperature
        const targetTemp = useMotorStore.getState().targetTemperature
        const defrost = useMotorStore.getState().defrostMode
        const motorRpm = useMotorStore.getState().rpm

        // Se estiver no modo de degelo, aumentar a temperatura
        if (defrost) {
          useMotorStore.getState().setSystemTemperature(Math.min(5, currentTemp + 0.5))
        } else if (motorRpm > 0) {
          // Calcular diferença e ajustar gradualmente
          const diff = currentTemp - targetTemp
          const adjustment = Math.min(Math.abs(diff) * 0.1, 0.5) * Math.sign(diff) * -1
          useMotorStore.getState().setSystemTemperature(currentTemp + adjustment + (Math.random() * 0.4 - 0.2))
        }

        // Atualizar pressões com alguma variação
        useMotorStore.getState().setCompressorPressure(12.5 + (motorRpm / 3000) * 5 + Math.random() * 0.5 - 0.25)
        useMotorStore.getState().setCondenserPressure(18.2 + (motorRpm / 3000) * 4 + Math.random() * 0.6 - 0.3)
        useMotorStore.getState().setEvaporatorPressure(4.8 - (motorRpm / 3000) * 2 + Math.random() * 0.4 - 0.2)
      }, 1000)

      return () => clearInterval(interval)
    }
  })

  return (
    <div className="p-6 bg-zinc-900 rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Simulador de Motor Hermético para Refrigeração</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Visualização 3D e Controles */}
        <div className="space-y-6">
          {/* Visualização 3D */}
          <div className="bg-zinc-800 rounded-lg overflow-hidden h-[400px]">
            <MotorVisualization />
          </div>

          {/* Controles do Motor */}
          <ControlPanel />

          {/* Monitor de Performance */}
          <PerformanceMonitor />
        </div>

        {/* Coluna Direita - Controles de Refrigeração e Alertas */}
        <div className="space-y-6">
          {/* Controles de Refrigeração */}
          <RefrigerationControls
            rpm={rpm}
            systemTemperature={systemTemperature}
            targetTemperature={targetTemperature}
            onTargetTemperatureChange={setTargetTemperature}
            defrostMode={defrostMode}
            onDefrostModeChange={setDefrostMode}
          />

          {/* Monitor do Sistema de Refrigeração */}
          <RefrigerationMonitor
            rpm={rpm}
            systemTemperature={systemTemperature}
            targetTemperature={targetTemperature}
            compressorPressure={compressorPressure}
            condenserPressure={condenserPressure}
            evaporatorPressure={evaporatorPressure}
            performanceHistory={performanceHistory}
            addPerformanceDataPoint={addPerformanceDataPoint}
            isRunning={isRunning}
          />

          {/* Painel de Alertas */}
          <AlertsPanel />
        </div>
      </div>

      <div className="mt-6 text-sm text-zinc-500">
        <p>
          Este simulador demonstra o funcionamento de um motor hermético para sistemas de refrigeração, com controles
          para ajustar a velocidade do motor e a temperatura alvo do sistema.
        </p>
      </div>
    </div>
  )
}
