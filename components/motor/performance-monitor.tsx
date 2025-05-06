"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from "lucide-react"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type PerformanceDataPoint = {
  timestamp: number
  rpm: number
  temperature: number
  powerConsumption: number
  efficiency: number
  systemTemperature: number
}

export function PerformanceMonitor() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // Simulate data updates (replace with actual data source)
    const interval = setInterval(() => {
      const now = Date.now()
      setData((prevData) => [
        ...prevData.slice(-9), // Keep only the last 10 data points
        {
          time: new Date(now).toLocaleTimeString(),
          rpm: Math.floor(Math.random() * 3000),
          temperature: Math.floor(Math.random() * 100),
          power: Math.floor(Math.random() * 1500),
        },
      ])
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Monitor de Desempenho</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">RPM</CardTitle>
            <CardDescription className="text-xs">Velocidade do motor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono">{data.length > 0 ? data[data.length - 1].rpm : 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Temperatura</CardTitle>
            <CardDescription className="text-xs">Temperatura do motor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono">{data.length > 0 ? data[data.length - 1].temperature : 0}°C</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Potência</CardTitle>
            <CardDescription className="text-xs">Consumo de energia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono">{data.length > 0 ? data[data.length - 1].power : 0}W</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Histórico de Desempenho</span>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-zinc-500 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Gráfico de desempenho do motor ao longo do tempo</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription className="text-xs">RPM e Temperatura</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: "#222", border: "1px solid #444" }} />
              <Line type="monotone" dataKey="rpm" stroke="#8884d8" strokeWidth={2} dot={false} name="RPM" />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#82ca9d"
                strokeWidth={2}
                dot={false}
                name="Temperatura"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
