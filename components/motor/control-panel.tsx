"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { useMotorStore } from "@/lib/store"
import { Play, Pause, AlertTriangle, Info } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function ControlPanel() {
  const { rpm, isRunning, toggleRunning, setRpm, temperature, powerConsumption, efficiency } = useMotorStore()
  const [sliderValue, setSliderValue] = useState(rpm)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [efficiencyColor, setEfficiencyColor] = useState("#10b981") // verde por padrão

  // Update slider value when rpm changes in the store
  useEffect(() => {
    setSliderValue(rpm)
  }, [rpm])

  // Update RPM when slider changes
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0])
    setRpm(value[0])

    // Verificar se o RPM está em uma faixa de alerta
    if (value[0] > 2500) {
      setShowWarning(true)
      setWarningMessage("RPM elevado pode causar desgaste prematuro do motor")
    } else {
      setShowWarning(false)
    }
  }

  // Atualizar cor da eficiência com base no valor
  useEffect(() => {
    if (efficiency < 80) {
      setEfficiencyColor("#ef4444") // vermelho para baixa eficiência
    } else if (efficiency < 90) {
      setEfficiencyColor("#f59e0b") // amarelo para eficiência média
    } else {
      setEfficiencyColor("#10b981") // verde para alta eficiência
    }
  }, [efficiency])

  // Simulate temperature and power consumption changes based on RPM
  useEffect(() => {
    if (isRunning && rpm > 0) {
      const interval = setInterval(() => {
        // Update store with simulated values
        useMotorStore.getState().setTemperature(35 + (rpm / 3000) * 50 + Math.random() * 5)
        useMotorStore.getState().setPowerConsumption(200 + (rpm / 3000) * 1200 + Math.random() * 50)
        useMotorStore.getState().setEfficiency(95 - (rpm / 6000) * 10 + Math.random() * 2)

        // Add data point to history
        useMotorStore.getState().addPerformanceDataPoint()
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isRunning, rpm])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Controle do Compressor</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRunning ? "destructive" : "default"}
                size="sm"
                onClick={toggleRunning}
                className="w-24"
                aria-label={isRunning ? "Parar motor" : "Iniciar motor"}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" /> Parar
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" /> Iniciar
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRunning ? "Parar o motor" : "Iniciar o motor"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-4 p-4 rounded-md bg-zinc-800">
        {showWarning && (
          <div className="flex items-start space-x-2 p-2 bg-yellow-900/30 border border-yellow-800/50 rounded-md mb-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-200">{warningMessage}</p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Controle de RPM</span>
            <span className="text-sm font-mono">{sliderValue}</span>
          </div>
          <Slider
            value={[sliderValue]}
            min={0}
            max={3000}
            step={50}
            onValueChange={handleSliderChange}
            disabled={!isRunning}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>0</span>
            <span>1500</span>
            <span>3000</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Temperatura</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Temperatura atual do motor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-lg font-mono">{temperature.toFixed(1)}°C</div>
            <Progress
              value={(temperature / 100) * 100}
              className="h-1.5"
              indicatorClassName={temperature > 80 ? "bg-red-500" : temperature > 60 ? "bg-yellow-500" : "bg-blue-500"}
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Potência</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Consumo de energia atual</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-lg font-mono">{powerConsumption.toFixed(0)}W</div>
            <Progress value={(powerConsumption / 1500) * 100} className="h-1.5" indicatorClassName="bg-green-500" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Eficiência</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Eficiência operacional do motor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-lg font-mono">{efficiency.toFixed(1)}%</div>
            <Progress value={efficiency} className="h-1.5" indicatorClassName={`bg-[${efficiencyColor}]`} />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-zinc-500">Status</span>
            <div className="text-lg font-mono flex items-center">
              <div className={`h-2 w-2 rounded-full mr-2 ${isRunning ? "bg-green-500" : "bg-red-500"}`}></div>
              {isRunning ? "Funcionando" : "Parado"}
            </div>
            <div className="text-xs text-zinc-500">{isRunning ? `Operando a ${rpm} RPM` : "Motor em espera"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
