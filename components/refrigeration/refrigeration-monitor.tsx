"use client"

import { useEffect, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gauge, Info, Thermometer, Zap, BarChart } from "lucide-react"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PerformanceDataPoint = {
  timestamp: number
  compressorRpm: number
  systemTemperature: number
  targetTemperature: number
  compressorPressure: number
  condenserPressure: number
  evaporatorPressure: number
  powerConsumption: number
  cop: number
}

type RefrigerationMonitorProps = {
  compressorRpm: number
  systemTemperature: number
  targetTemperature: number
  compressorPressure: number
  condenserPressure: number
  evaporatorPressure: number
  performanceHistory: PerformanceDataPoint[]
  isRunning: boolean
}

export function RefrigerationMonitor({
  compressorRpm,
  systemTemperature,
  targetTemperature,
  compressorPressure,
  condenserPressure,
  evaporatorPressure,
  performanceHistory,
  isRunning,
}: RefrigerationMonitorProps) {
  const [chartData, setChartData] = useState<any[]>([])
  const [cop, setCop] = useState(0)
  const [powerConsumption, setPowerConsumption] = useState(0)
  const [superheat, setSuperheat] = useState(5) // Superaquecimento padrão (5°C)
  const [subcooling, setSubcooling] = useState(3) // Subresfriamento padrão (3°C)
  const [refrigerantMass, setRefrigerantMass] = useState(0.5) // kg
  const [refrigerantFlow, setRefrigerantFlow] = useState(0) // kg/s
  const [coolingCapacity, setCoolingCapacity] = useState(0) // W
  const [activeTab, setActiveTab] = useState("performance")

  // Calcular parâmetros do sistema
  useEffect(() => {
    if (!isRunning || compressorRpm === 0) {
      setCop(0)
      setPowerConsumption(0)
      setRefrigerantFlow(0)
      setCoolingCapacity(0)
      return
    }

    // Calcular consumo de energia com base no RPM e diferença de pressão
    const pressureDiff = condenserPressure - evaporatorPressure
    const power = 200 + (compressorRpm / 3000) * 800 * (pressureDiff / 10)
    setPowerConsumption(power)

    // Calcular fluxo de refrigerante
    const flow = (compressorRpm / 3000) * 0.05 // kg/s
    setRefrigerantFlow(flow)

    // Calcular capacidade de refrigeração
    const capacity = flow * 200 * (1 - evaporatorPressure / condenserPressure) // Aproximação simplificada
    setCoolingCapacity(capacity)

    // Calcular COP
    const newCop = capacity / power
    setCop(Math.max(0.5, Math.min(5, newCop)))

    // Calcular superaquecimento e subresfriamento
    const newSuperheat = 5 + (Math.random() * 2 - 1) // Simulação de variação
    const newSubcooling = 3 + (Math.random() * 2 - 1) // Simulação de variação
    setSuperheat(newSuperheat)
    setSubcooling(newSubcooling)
  }, [isRunning, compressorRpm, systemTemperature, targetTemperature, condenserPressure, evaporatorPressure])

  // Formatar dados para o gráfico
  useEffect(() => {
    const formattedData = performanceHistory.map((point, index) => ({
      name: new Date(point.timestamp).toLocaleTimeString(),
      temp: point.systemTemperature,
      target: point.targetTemperature,
      compPressure: point.compressorPressure,
      condPressure: point.condenserPressure,
      evapPressure: point.evaporatorPressure,
      power: point.powerConsumption,
      cop: point.cop,
    }))

    setChartData(formattedData)
  }, [performanceHistory])

  // Função para determinar a cor com base no valor do COP
  const getCOPColor = () => {
    if (cop < 1.5) return "text-red-500"
    if (cop < 2.5) return "text-yellow-500"
    return "text-green-500"
  }

  // Criar dados para o diagrama P-h (pressão-entalpia)
  const createPhDiagramData = () => {
    // Pontos do ciclo de refrigeração
    const points = [
      { name: "1", ph: 250, p: evaporatorPressure }, // Saída do evaporador
      { name: "2", ph: 275, p: compressorPressure }, // Saída do compressor
      { name: "3", ph: 125, p: condenserPressure }, // Saída do condensador
      { name: "4", ph: 125, p: evaporatorPressure }, // Saída da válvula de expansão
    ]

    // Linhas de saturação (simplificadas)
    const saturationCurve = []
    for (let i = 0; i <= 10; i++) {
      const p = 2 + i * 2
      saturationCurve.push(
        { name: `L${i}`, ph: 100 + i * 5, p: p, type: "liquid" },
        { name: `V${i}`, ph: 250 - i * 5, p: p, type: "vapor" },
      )
    }

    return [...points, ...saturationCurve]
  }

  // Criar dados para o diagrama T-s (temperatura-entropia)
  const createTsDiagramData = () => {
    // Pontos do ciclo de refrigeração (simplificados)
    const points = [
      { name: "1", ts: 6, t: systemTemperature + superheat }, // Saída do evaporador
      { name: "2", ts: 6.2, t: systemTemperature + 50 }, // Saída do compressor
      { name: "3", ts: 4.5, t: systemTemperature + 15 - subcooling }, // Saída do condensador
      { name: "4", ts: 4.5, t: systemTemperature }, // Saída da válvula de expansão
    ]

    // Linhas de saturação (simplificadas)
    const saturationCurve = []
    for (let i = 0; i <= 10; i++) {
      const t = -10 + i * 10
      saturationCurve.push(
        { name: `L${i}`, ts: 4 + i * 0.2, t: t, type: "liquid" },
        { name: `V${i}`, ts: 6 - i * 0.1, t: t, type: "vapor" },
      )
    }

    return [...points, ...saturationCurve]
  }

  const phDiagramData = createPhDiagramData()
  const tsDiagramData = createTsDiagramData()

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Monitor do Sistema</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Gauge className="h-4 w-4 mr-1 text-blue-400" />
              Compressor
            </CardTitle>
            <CardDescription className="text-xs">Pressão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono">{compressorPressure.toFixed(1)} bar</div>
            <Progress
              value={(compressorPressure / 20) * 100}
              className="h-1.5 mt-2"
              indicatorClassName={compressorPressure > 15 ? "bg-red-500" : "bg-blue-500"}
            />
            <div className="mt-1 text-xs text-zinc-500 flex justify-between">
              <span>RPM: {compressorRpm}</span>
              <span>Razão: {(condenserPressure / evaporatorPressure).toFixed(1)}:1</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Thermometer className="h-4 w-4 mr-1 text-red-400" />
              Condensador
            </CardTitle>
            <CardDescription className="text-xs">Pressão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono">{condenserPressure.toFixed(1)} bar</div>
            <Progress
              value={(condenserPressure / 25) * 100}
              className="h-1.5 mt-2"
              indicatorClassName={condenserPressure > 20 ? "bg-red-500" : "bg-red-400"}
            />
            <div className="mt-1 text-xs text-zinc-500 flex justify-between">
              <span>Temp: ~{(systemTemperature + 15).toFixed(1)}°C</span>
              <span>Sub: {subcooling.toFixed(1)}°C</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Thermometer className="h-4 w-4 mr-1 text-blue-400" />
              Evaporador
            </CardTitle>
            <CardDescription className="text-xs">Pressão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono">{evaporatorPressure.toFixed(1)} bar</div>
            <Progress
              value={(evaporatorPressure / 10) * 100}
              className="h-1.5 mt-2"
              indicatorClassName={evaporatorPressure < 3 ? "bg-red-500" : "bg-blue-400"}
            />
            <div className="mt-1 text-xs text-zinc-500 flex justify-between">
              <span>Temp: {systemTemperature.toFixed(1)}°C</span>
              <span>Sup: {superheat.toFixed(1)}°C</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Zap className="h-4 w-4 mr-1 text-yellow-400" />
              Desempenho
            </CardTitle>
            <CardDescription className="text-xs">COP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-mono ${getCOPColor()}`}>{cop.toFixed(2)}</div>
            <Progress
              value={(cop / 5) * 100}
              className="h-1.5 mt-2"
              indicatorClassName={cop < 1.5 ? "bg-red-500" : cop < 2.5 ? "bg-yellow-500" : "bg-green-500"}
            />
            <div className="mt-1 text-xs text-zinc-500 flex justify-between">
              <span>Potência: {powerConsumption.toFixed(0)}W</span>
              <span>Capacidade: {coolingCapacity.toFixed(0)}W</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-800 border-zinc-700">
          <TabsTrigger value="performance" className="data-[state=active]:bg-zinc-700">
            <BarChart className="h-4 w-4 mr-1" />
            Desempenho
          </TabsTrigger>
          <TabsTrigger value="temperature" className="data-[state=active]:bg-zinc-700">
            <Thermometer className="h-4 w-4 mr-1" />
            Temperatura
          </TabsTrigger>
          <TabsTrigger value="pressure" className="data-[state=active]:bg-zinc-700">
            <Gauge className="h-4 w-4 mr-1" />
            Pressão
          </TabsTrigger>
          <TabsTrigger value="diagrams" className="data-[state=active]:bg-zinc-700">
            <BarChart className="h-4 w-4 mr-1" />
            Diagramas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-4">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Desempenho do Sistema</span>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-zinc-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Gráfico de desempenho do sistema ao longo do tempo</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis yAxisId="left" stroke="#888" />
                      <YAxis yAxisId="right" orientation="right" stroke="#888" />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="power"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={false}
                        name="Potência (W)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="cop"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name="COP"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-500">
                    {isRunning ? "Coletando dados..." : "Inicie o sistema para ver dados de desempenho"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="temperature" className="mt-4">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Histórico de Temperatura</span>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-zinc-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Gráfico de temperatura do sistema ao longo do tempo</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis
                        stroke="#888"
                        domain={[Math.min(targetTemperature - 5, -20), Math.max(systemTemperature + 5, 10)]}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                      <ReferenceLine y={targetTemperature} stroke="#ef4444" strokeDasharray="3 3" />
                      <Line
                        type="monotone"
                        dataKey="temp"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="Temperatura Atual"
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                        name="Temperatura Alvo"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-500">
                    {isRunning ? "Coletando dados..." : "Inicie o sistema para ver dados de temperatura"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pressure" className="mt-4">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Histórico de Pressão</span>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-zinc-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">Gráfico de pressões do sistema ao longo do tempo</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis dataKey="name" stroke="#888" />
                      <YAxis stroke="#888" domain={[0, 25]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="compPressure"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="Compressor"
                      />
                      <Line
                        type="monotone"
                        dataKey="condPressure"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        name="Condensador"
                      />
                      <Line
                        type="monotone"
                        dataKey="evapPressure"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        name="Evaporador"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-500">
                    {isRunning ? "Coletando dados..." : "Inicie o sistema para ver dados de pressão"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagrams" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Diagrama P-h</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-zinc-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Diagrama Pressão-Entalpia do ciclo de refrigeração</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={phDiagramData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis
                        dataKey="ph"
                        stroke="#888"
                        label={{ value: "Entalpia (kJ/kg)", position: "insideBottom", offset: -5 }}
                      />
                      <YAxis
                        dataKey="p"
                        stroke="#888"
                        label={{ value: "Pressão (bar)", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      {/* Ciclo de refrigeração */}
                      <Line
                        data={phDiagramData.filter((d) => d.name && !d.type)}
                        type="linear"
                        dataKey="p"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                      {/* Curva de saturação - líquido */}
                      <Line
                        data={phDiagramData.filter((d) => d.type === "liquid")}
                        type="monotone"
                        dataKey="p"
                        stroke="#10b981"
                        strokeWidth={1}
                        dot={false}
                      />
                      {/* Curva de saturação - vapor */}
                      <Line
                        data={phDiagramData.filter((d) => d.type === "vapor")}
                        type="monotone"
                        dataKey="p"
                        stroke="#ef4444"
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Diagrama T-s</span>
                  <TooltipProvider>
                    <UITooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-zinc-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Diagrama Temperatura-Entropia do ciclo de refrigeração</p>
                      </TooltipContent>
                    </UITooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tsDiagramData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                      <XAxis
                        dataKey="ts"
                        stroke="#888"
                        label={{ value: "Entropia (kJ/kg·K)", position: "insideBottom", offset: -5 }}
                      />
                      <YAxis
                        dataKey="t"
                        stroke="#888"
                        label={{ value: "Temperatura (°C)", angle: -90, position: "insideLeft" }}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }}
                        labelStyle={{ color: "#fff" }}
                      />
                      {/* Ciclo de refrigeração */}
                      <Line
                        data={tsDiagramData.filter((d) => d.name && !d.type)}
                        type="linear"
                        dataKey="t"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                      />
                      {/* Curva de saturação - líquido */}
                      <Line
                        data={tsDiagramData.filter((d) => d.type === "liquid")}
                        type="monotone"
                        dataKey="t"
                        stroke="#10b981"
                        strokeWidth={1}
                        dot={false}
                      />
                      {/* Curva de saturação - vapor */}
                      <Line
                        data={tsDiagramData.filter((d) => d.type === "vapor")}
                        type="monotone"
                        dataKey="t"
                        stroke="#ef4444"
                        strokeWidth={1}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Parâmetros do Sistema</span>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-zinc-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Parâmetros técnicos do sistema de refrigeração</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-zinc-500">Refrigerante</div>
              <div className="text-sm font-medium">R-134a</div>
              <div className="text-xs text-zinc-500">Carga: 0.5 kg</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-500">Superaquecimento</div>
              <div className="text-sm font-medium">{superheat.toFixed(1)}°C</div>
              <Progress
                value={(superheat / 10) * 100}
                className="h-1"
                indicatorClassName={superheat > 8 ? "bg-red-500" : superheat < 3 ? "bg-yellow-500" : "bg-green-500"}
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-500">Subresfriamento</div>
              <div className="text-sm font-medium">{subcooling.toFixed(1)}°C</div>
              <Progress
                value={(subcooling / 8) * 100}
                className="h-1"
                indicatorClassName={subcooling > 6 ? "bg-yellow-500" : subcooling < 1 ? "bg-red-500" : "bg-green-500"}
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-zinc-500">Fluxo de Refrigerante</div>
              <div className="text-sm font-medium">{(refrigerantFlow * 1000).toFixed(1)} g/s</div>
              <Progress value={(refrigerantFlow / 0.05) * 100} className="h-1" indicatorClassName="bg-blue-500" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
