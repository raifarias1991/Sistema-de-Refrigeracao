"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useMotorStore } from "@/lib/store"
import { AlertCircle, ThermometerIcon as ThermometerHot, Zap, Activity, X, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

type AlertItem = {
  id: string
  type: "warning" | "error" | "info"
  title: string
  message: string
  icon: React.ReactNode
  timestamp: Date
  dismissed?: boolean
}

export function AlertsPanel() {
  const { temperature, rpm, powerConsumption, isRunning, systemTemperature, targetTemperature } = useMotorStore()
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [showDismissed, setShowDismissed] = useState(false)

  useEffect(() => {
    if (!isRunning) return

    // Check for temperature alerts
    if (temperature > 80) {
      addAlert({
        type: "error",
        title: "Temperatura Crítica",
        message: `Temperatura do motor é ${temperature.toFixed(1)}°C. Ação imediata necessária.`,
        icon: <ThermometerHot className="h-4 w-4" />,
      })
    } else if (temperature > 70 && temperature <= 80) {
      addAlert({
        type: "warning",
        title: "Temperatura Alta",
        message: `Temperatura do motor é ${temperature.toFixed(1)}°C. Considere reduzir a carga.`,
        icon: <ThermometerHot className="h-4 w-4" />,
      })
    }

    // Check for power consumption alerts
    if (powerConsumption > 1400) {
      addAlert({
        type: "warning",
        title: "Consumo de Energia Alto",
        message: `Consumo de energia é ${powerConsumption.toFixed(0)}W. Verifique problemas mecânicos.`,
        icon: <Zap className="h-4 w-4" />,
      })
    }

    // Check for RPM alerts
    if (rpm > 2800) {
      addAlert({
        type: "warning",
        title: "RPM Alto",
        message: `Velocidade do motor é ${rpm} RPM. Aproximando-se da velocidade máxima nominal.`,
        icon: <Activity className="h-4 w-4" />,
      })
    }

    // Check for refrigeration system alerts
    if (systemTemperature > targetTemperature + 10) {
      addAlert({
        type: "warning",
        title: "Desvio de Temperatura",
        message: `Temperatura do sistema (${systemTemperature.toFixed(1)}°C) está muito acima da meta (${targetTemperature.toFixed(1)}°C).`,
        icon: <ThermometerHot className="h-4 w-4" />,
      })
    }

    // Add informational alerts occasionally
    if (Math.random() < 0.01 && rpm > 0) {
      const infoAlerts = [
        {
          title: "Manutenção Preventiva",
          message: "Recomendado verificar filtros e conexões a cada 1000 horas de operação.",
        },
        {
          title: "Dica de Eficiência",
          message: "Manter a temperatura alvo entre -5°C e 0°C oferece melhor eficiência energética.",
        },
        {
          title: "Ciclo de Degelo",
          message: "Considere ativar o modo de degelo periodicamente para otimizar o desempenho.",
        },
      ]

      const randomInfo = infoAlerts[Math.floor(Math.random() * infoAlerts.length)]

      addAlert({
        type: "info",
        title: randomInfo.title,
        message: randomInfo.message,
        icon: <Info className="h-4 w-4" />,
      })
    }
  }, [temperature, rpm, powerConsumption, isRunning, systemTemperature, targetTemperature])

  const addAlert = (alert: Omit<AlertItem, "id" | "timestamp">) => {
    const newAlert = {
      ...alert,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
    }

    // Add alert if it doesn't already exist (prevent duplicates)
    setAlerts((prev) => {
      const exists = prev.some(
        (a) =>
          a.title === newAlert.title && a.message === newAlert.message && Date.now() - a.timestamp.getTime() < 10000, // Don't add if similar alert is less than 10 seconds old
      )

      if (exists) return prev

      // Keep only the last 10 alerts
      return [newAlert, ...prev].slice(0, 10)
    })
  }

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.map((alert) => (alert.id === id ? { ...alert, dismissed: true } : alert)))
  }

  const clearAllAlerts = () => {
    setAlerts((prev) => prev.map((alert) => ({ ...alert, dismissed: true })))
  }

  const visibleAlerts = alerts.filter((alert) => !alert.dismissed || showDismissed)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Alertas do Sistema</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDismissed(!showDismissed)}
            className="text-xs h-8 bg-zinc-800/80 hover:bg-zinc-700/80"
          >
            {showDismissed ? "Ocultar Resolvidos" : "Mostrar Todos"}
          </Button>
          {alerts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllAlerts}
              className="text-xs h-8 bg-zinc-800/80 hover:bg-zinc-700/80"
            >
              Limpar Todos
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {visibleAlerts.length > 0 ? (
          visibleAlerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.type === "error" ? "destructive" : "default"}
              className={`bg-zinc-800 border-l-4 ${alert.dismissed ? "opacity-50" : "opacity-100"} ${
                alert.type === "error"
                  ? "border-l-red-500"
                  : alert.type === "warning"
                    ? "border-l-yellow-500"
                    : "border-l-blue-500"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div
                    className={`mr-2 ${
                      alert.type === "error"
                        ? "text-red-500"
                        : alert.type === "warning"
                          ? "text-yellow-500"
                          : "text-blue-500"
                    }`}
                  >
                    {alert.icon || <AlertCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <AlertTitle className="text-sm font-medium">{alert.title}</AlertTitle>
                    <AlertDescription className="text-xs text-zinc-400">{alert.message}</AlertDescription>
                    <div className="text-xs text-zinc-500 mt-1">{alert.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
                {!alert.dismissed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(alert.id)}
                    className="h-6 w-6 p-0 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </Alert>
          ))
        ) : (
          <div className="text-zinc-500 text-sm text-center">Nenhum alerta no momento.</div>
        )}
      </div>
    </div>
  )
}
