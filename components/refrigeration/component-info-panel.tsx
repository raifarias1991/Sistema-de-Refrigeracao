"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu, Thermometer, Gauge, Fan, Snowflake, Droplet, Zap } from "lucide-react"
import { Progress } from "@/components/ui/progress"

type ComponentInfoPanelProps = {
  currentComponent: string
  compressorRpm: number
  compressorPressure: number
  condenserPressure: number
  evaporatorPressure: number
  systemTemperature: number
  targetTemperature: number
}

export function ComponentInfoPanel({
  currentComponent,
  compressorRpm,
  compressorPressure,
  condenserPressure,
  evaporatorPressure,
  systemTemperature,
  targetTemperature,
}: ComponentInfoPanelProps) {
  if (currentComponent === "full") return null

  // Calcular valores derivados
  const pressureDiff = condenserPressure - evaporatorPressure
  const compressionRatio = condenserPressure / compressorPressure
  const superheat = 5 + (Math.random() * 2 - 1) // Simulação de superaquecimento
  const subcooling = 3 + (Math.random() * 2 - 1) // Simulação de subresfriamento
  const rpmPercentage = (compressorRpm / 3000) * 100
  const tempDiff = Math.abs(systemTemperature - targetTemperature)
  const coolingCapacity = compressorRpm > 0 ? 500 + (compressorRpm / 3000) * 1500 : 0
  const powerConsumption = compressorRpm > 0 ? 200 + (compressorRpm / 3000) * 800 * (pressureDiff / 10) : 0
  const cop = powerConsumption > 0 ? coolingCapacity / powerConsumption : 0

  const componentInfo = {
    compressor: {
      title: "Compressor",
      description: "Comprime o refrigerante gasoso aumentando sua pressão e temperatura",
      icon: <Cpu className="h-5 w-5" />,
      specs: [
        { label: "Tipo", value: "Hermético Rotativo" },
        { label: "Velocidade", value: `${compressorRpm} RPM`, progress: rpmPercentage },
        { label: "Pressão de Sucção", value: `${compressorPressure.toFixed(1)} bar` },
        { label: "Razão de Compressão", value: `${compressionRatio.toFixed(2)}:1` },
        { label: "Potência", value: `${Math.round(powerConsumption)} W` },
        { label: "Eficiência", value: "85%" },
        { label: "Refrigerante", value: "R-134a" },
        { label: "Estado na Entrada", value: "Vapor superaquecido" },
        { label: "Estado na Saída", value: "Vapor a alta pressão" },
      ],
    },
    condenser: {
      title: "Condensador",
      description: "Dissipa o calor do refrigerante, convertendo-o de gás para líquido",
      icon: <Fan className="h-5 w-5" />,
      specs: [
        { label: "Tipo", value: "Tubo aletado com ventilador" },
        { label: "Pressão", value: `${condenserPressure.toFixed(1)} bar` },
        { label: "Temperatura", value: `${(systemTemperature + 15).toFixed(1)}°C` },
        { label: "Subresfriamento", value: `${subcooling.toFixed(1)}°C` },
        { label: "Capacidade", value: `${Math.round(coolingCapacity)} W` },
        { label: "Eficiência", value: "90%" },
        { label: "Estado na Entrada", value: "Vapor a alta pressão" },
        { label: "Estado na Saída", value: "Líquido subresfriado" },
        { label: "Rejeição de Calor", value: `${Math.round(coolingCapacity + powerConsumption)} W` },
      ],
    },
    expansion: {
      title: "Válvula de Expansão",
      description: "Reduz a pressão do refrigerante líquido antes de entrar no evaporador",
      icon: <Gauge className="h-5 w-5" />,
      specs: [
        { label: "Tipo", value: "Termostática" },
        { label: "Pressão Entrada", value: `${condenserPressure.toFixed(1)} bar` },
        { label: "Pressão Saída", value: `${evaporatorPressure.toFixed(1)} bar` },
        { label: "Queda de Pressão", value: `${(condenserPressure - evaporatorPressure).toFixed(1)} bar` },
        { label: "Abertura", value: "50%" },
        { label: "Bulbo Sensor", value: `${(systemTemperature + superheat).toFixed(1)}°C` },
        { label: "Estado na Entrada", value: "Líquido subresfriado" },
        { label: "Estado na Saída", value: "Mistura líquido-vapor" },
        { label: "Controle", value: "Superaquecimento" },
      ],
    },
    evaporator: {
      title: "Evaporador",
      description: "Absorve calor do ambiente, convertendo o refrigerante de líquido para gás",
      icon: <Thermometer className="h-5 w-5" />,
      specs: [
        { label: "Tipo", value: "Tubo aletado com ventilador" },
        { label: "Pressão", value: `${evaporatorPressure.toFixed(1)} bar` },
        { label: "Temperatura", value: `${systemTemperature.toFixed(1)}°C` },
        { label: "Temperatura Alvo", value: `${targetTemperature.toFixed(1)}°C` },
        { label: "Superaquecimento", value: `${superheat.toFixed(1)}°C` },
        { label: "Capacidade", value: `${Math.round(coolingCapacity)} W` },
        { label: "Eficiência", value: "90%" },
        { label: "Estado na Entrada", value: "Mistura líquido-vapor" },
        { label: "Estado na Saída", value: "Vapor superaquecido" },
      ],
    },
  }

  const info = componentInfo[currentComponent as keyof typeof componentInfo]
  if (!info) return null

  return (
    <Card className="bg-zinc-900/90 border-zinc-800 backdrop-blur-sm w-64 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-zinc-800 rounded-md text-blue-400">{info.icon}</div>
          <div>
            <CardTitle className="text-sm">{info.title}</CardTitle>
            <CardDescription className="text-xs">{info.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {info.specs.map((spec, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">{spec.label}</span>
                <span className="text-xs font-medium">{spec.value}</span>
              </div>
              {spec.progress !== undefined && (
                <Progress
                  value={spec.progress}
                  className="h-1"
                  indicatorClassName={
                    spec.progress > 80 ? "bg-red-500" : spec.progress > 60 ? "bg-yellow-500" : "bg-blue-500"
                  }
                />
              )}
            </div>
          ))}
        </div>

        {currentComponent === "compressor" && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                <span className="text-xs">COP</span>
              </div>
              <span className="text-xs font-medium">{cop.toFixed(2)}</span>
            </div>
            <Progress
              value={(cop / 5) * 100}
              className="h-1 mt-1"
              indicatorClassName={cop > 3 ? "bg-green-500" : cop > 2 ? "bg-yellow-500" : "bg-red-500"}
            />
          </div>
        )}

        {currentComponent === "evaporator" && systemTemperature < 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Snowflake className="h-4 w-4 mr-1 text-blue-400" />
                <span className="text-xs">Formação de Gelo</span>
              </div>
              <span className="text-xs font-medium">{Math.min(100, Math.abs(systemTemperature) * 10).toFixed(0)}%</span>
            </div>
            <Progress
              value={Math.min(100, Math.abs(systemTemperature) * 10)}
              className="h-1 mt-1"
              indicatorClassName="bg-blue-200"
            />
          </div>
        )}

        {currentComponent === "condenser" && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Droplet className="h-4 w-4 mr-1 text-blue-400" />
                <span className="text-xs">Condensação</span>
              </div>
              <span className="text-xs font-medium">{Math.min(100, condenserPressure * 5).toFixed(0)}%</span>
            </div>
            <Progress
              value={Math.min(100, condenserPressure * 5)}
              className="h-1 mt-1"
              indicatorClassName="bg-blue-400"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
