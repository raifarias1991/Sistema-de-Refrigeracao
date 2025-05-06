"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Snowflake, Thermometer, RotateCcw, Info, AlertTriangle, Play, Pause } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

type RefrigerationControlsProps = {
  compressorRpm: number
  isRunning: boolean
  toggleRunning: () => void
  systemTemperature: number
  targetTemperature: number
  onTargetTemperatureChange: (temp: number) => void
  defrostMode: boolean
  onDefrostModeChange: (mode: boolean) => void
}

export function RefrigerationControls({
  compressorRpm,
  isRunning,
  toggleRunning,
  systemTemperature,
  targetTemperature,
  onTargetTemperatureChange,
  defrostMode,
  onDefrostModeChange,
}: RefrigerationControlsProps) {
  const [sliderValue, setSliderValue] = useState(targetTemperature)
  const [rpmSliderValue, setRpmSliderValue] = useState(compressorRpm)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [coolingEfficiency, setCoolingEfficiency] = useState(100)

  // Atualizar o slider quando a temperatura alvo mudar
  useEffect(() => {
    setSliderValue(targetTemperature)
  }, [targetTemperature])

  // Atualizar o slider de RPM quando o RPM mudar
  useEffect(() => {
    setRpmSliderValue(compressorRpm)
  }, [compressorRpm])

  // Atualizar temperatura alvo quando o slider mudar
  const handleSliderChange = (value: number[]) => {
    setSliderValue(value[0])
    onTargetTemperatureChange(value[0])

    // Verificar se a temperatura alvo está em uma faixa de alerta
    if (value[0] < -15) {
      setShowWarning(true)
      setWarningMessage("Temperaturas muito baixas aumentam o consumo de energia")
    } else {
      setShowWarning(false)
    }
  }

  // Atualizar RPM quando o slider mudar
  const handleRpmSliderChange = (value: number[]) => {
    setRpmSliderValue(value[0])
    // Aqui você pode adicionar uma função para atualizar o RPM no store
    // Por exemplo: setCompressorRpm(value[0])
  }

  // Alternar modo de degelo
  const handleDefrostToggle = (checked: boolean) => {
    onDefrostModeChange(checked)
  }

  // Calcular eficiência de resfriamento com base na diferença de temperatura e RPM
  useEffect(() => {
    if (compressorRpm === 0) {
      setCoolingEfficiency(0)
      return
    }

    const tempDiff = Math.abs(systemTemperature - targetTemperature)
    const rpmFactor = compressorRpm / 3000 // Normalizado para 0-1

    // Eficiência diminui quando a diferença de temperatura é grande ou o RPM é muito baixo
    let efficiency = 100 - tempDiff * 5
    efficiency = efficiency * (0.3 + rpmFactor * 0.7) // RPM afeta a eficiência

    // Modo de degelo reduz a eficiência
    if (defrostMode) {
      efficiency *= 0.5
    }

    setCoolingEfficiency(Math.max(0, Math.min(100, efficiency)))
  }, [compressorRpm, systemTemperature, targetTemperature, defrostMode])

  // Calcular o progresso do resfriamento
  const coolingProgress = Math.min(
    100,
    Math.max(0, Math.round(((targetTemperature - systemTemperature) / targetTemperature) * 100)),
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Controles do Sistema</h2>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isRunning ? "destructive" : "default"}
                  size="sm"
                  onClick={toggleRunning}
                  className="w-24"
                  aria-label={isRunning ? "Parar sistema" : "Iniciar sistema"}
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
                <p>{isRunning ? "Parar o sistema" : "Iniciar o sistema"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="space-y-4 p-4 rounded-md bg-zinc-800">
        {showWarning && (
          <div className="flex items-start space-x-2 p-2 bg-yellow-900/30 border border-yellow-800/50 rounded-md mb-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-200">{warningMessage}</p>
          </div>
        )}

        {defrostMode && (
          <div className="flex items-start space-x-2 p-2 bg-blue-900/30 border border-blue-800/50 rounded-md mb-3">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-200">
              Modo de degelo ativado. O sistema está temporariamente aquecendo o evaporador para remover o acúmulo de
              gelo.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Temperatura Alvo</span>
            <span className="text-sm font-mono">{sliderValue.toFixed(1)}°C</span>
          </div>
          <Slider
            value={[sliderValue]}
            min={-20}
            max={10}
            step={0.5}
            onValueChange={handleSliderChange}
            className="py-2"
            disabled={defrostMode}
          />
          <div className="flex justify-between text-xs text-zinc-500">
            <span>-20°C</span>
            <span>-5°C</span>
            <span>10°C</span>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex justify-between">
            <span className="text-sm text-zinc-400">Velocidade do Compressor</span>
            <span className="text-sm font-mono">{rpmSliderValue} RPM</span>
          </div>
          <Slider
            value={[rpmSliderValue]}
            min={0}
            max={3000}
            step={50}
            onValueChange={handleRpmSliderChange}
            className="py-2"
            disabled={!isRunning}
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
              <span className="text-xs text-zinc-500">Temperatura Atual</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Temperatura atual do sistema de refrigeração</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-lg font-mono flex items-center">
              <Thermometer className="h-4 w-4 mr-1 text-blue-400" />
              {systemTemperature.toFixed(1)}°C
            </div>
            <Progress
              value={((systemTemperature + 20) / 30) * 100}
              className="h-1.5"
              indicatorClassName={
                systemTemperature > 0 ? "bg-red-500" : systemTemperature > -10 ? "bg-blue-400" : "bg-blue-600"
              }
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Temperatura Alvo</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Temperatura desejada para o sistema</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-lg font-mono flex items-center">
              <Snowflake className="h-4 w-4 mr-1 text-blue-400" />
              {targetTemperature.toFixed(1)}°C
            </div>
            <Progress
              value={((targetTemperature + 20) / 30) * 100}
              className="h-1.5"
              indicatorClassName="bg-blue-600"
            />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs text-zinc-500">Velocidade do Compressor</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-zinc-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Velocidade atual do compressor</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="text-lg font-mono flex items-center">
              <RotateCcw className="h-4 w-4 mr-1 text-blue-400" />
              {compressorRpm > 0 ? `${compressorRpm} RPM` : "0 RPM"}
            </div>
            <Progress value={(compressorRpm / 3000) * 100} className="h-1.5" indicatorClassName="bg-green-500" />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-zinc-500">Modo</span>
            <div className="text-lg font-mono">
              <Badge variant={defrostMode ? "outline" : "default"} className="font-normal">
                {defrostMode ? "Degelo" : "Refrigeração"}
              </Badge>
            </div>
            <div className="text-xs text-zinc-500">
              {defrostMode ? "Removendo acúmulo de gelo" : compressorRpm > 0 ? "Resfriando ativamente" : "Em espera"}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <Switch
            id="defrost-mode"
            checked={defrostMode}
            onCheckedChange={handleDefrostToggle}
            aria-label="Ativar modo de degelo"
          />
          <Label htmlFor="defrost-mode" className="text-sm">
            Modo de Degelo
          </Label>
        </div>

        <div className="pt-4">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-zinc-500">Progresso de Refrigeração</span>
            <span className="text-xs text-zinc-500">{coolingProgress}%</span>
          </div>
          <div className="h-2 w-full bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500"
              style={{
                width: `${coolingProgress}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>Eficiência: {coolingEfficiency.toFixed(0)}%</span>
            <span>
              {systemTemperature <= targetTemperature
                ? "Temperatura atingida"
                : `Diferença: ${(systemTemperature - targetTemperature).toFixed(1)}°C`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
