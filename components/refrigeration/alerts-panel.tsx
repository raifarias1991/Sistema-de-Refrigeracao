"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRefrigerationStore } from "@/lib/refrigeration-store"
import { AlertCircle, ThermometerIcon as ThermometerHot, Activity, X, Info, Droplet } from "lucide-react"
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
  const {
    compressorRpm,
    isRunning,
    systemTemperature,
    targetTemperature,
    compressorPressure,
    condenserPressure,
    evaporatorPressure,
    alerts,
  } = useRefrigerationStore()

  const [alertItems, setAlertItems] = useState<AlertItem[]>([])
  const [showDismissed, setShowDismissed] = useState(false)

  useEffect(() => {
    if (!isRunning) return

    // Verificar alertas de temperatura
    if (systemTemperature > targetTemperature + 15) {
      addAlert({
        type: "error",
        title: "Temperatura Crítica",
        message: `Temperatura do sistema é ${systemTemperature.toFixed(1)}°C, muito acima da meta de ${targetTemperature.toFixed(1)}°C.`,
        icon: <ThermometerHot className="h-4 w-4" />,
      })
    } else if (systemTemperature > targetTemperature + 10) {
      addAlert({
        type: "warning",
        title: "Temperatura Alta",
        message: `Temperatura do sistema é ${systemTemperature.toFixed(1)}°C, acima da meta de ${targetTemperature.toFixed(1)}°C.`,
        icon: <ThermometerHot className="h-4 w-4" />,
      })
    }

    // Verificar alertas de pressão
    if (condenserPressure > 20) {
      addAlert({
        type: "warning",
        title: "Pressão Alta no Condensador",
        message: `Pressão do condensador é ${condenserPressure.toFixed(1)} bar. Verifique a ventilação.`,
        icon: <Activity className="h-4 w-4" />,
      })
    }

    if (evaporatorPressure < 2) {
      addAlert({
        type: "warning",
        title: "Pressão Baixa no Evaporador",
        message: `Pressão do evaporador é ${evaporatorPressure.toFixed(1)} bar. Verifique possível vazamento.`,
        icon: <Activity className="h-4 w-4" />,
      })
    }

    if (compressorPressure > 18) {
      addAlert({
        type: "error",
        title: "Pressão Alta no Compressor",
        message: `Pressão do compressor é ${compressorPressure.toFixed(1)} bar. Risco de danos ao equipamento.`,
        icon: <Activity className="h-4 w-4" />,
      })
    }

    // Verificar alertas de carga de refrigerante
    if (alerts.lowRefrigerant) {
      addAlert({
        type: "warning",
        title: "Baixa Carga de Refrigerante",
        message: "Possível vazamento de refrigerante detectado. Verifique o sistema.",
        icon: <Droplet className="h-4 w-4" />,
      })
    }

    // Adicionar dicas informativas ocasionalmente
    if (Math.random() < 0.01 && compressorRpm > 0) {
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
  }, [
    isRunning,
    compressorRpm,
    systemTemperature,
    targetTemperature,
    compressorPressure,
    condenserPressure,
    evaporatorPressure,
    alerts,
  ])

  const addAlert = (alert: Omit<AlertItem, "id" | "timestamp">) => {
    const newAlert = {
      ...alert,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date(),
    }

    // Adicionar alerta apenas se não existir um similar recente
    setAlertItems((prev) => {
      const exists = prev.some(
        (a) =>
          a.title === newAlert.title && a.message === newAlert.message && Date.now() - a.timestamp.getTime() < 10000,
      )

      if (exists) return prev

      // Manter apenas os últimos 10 alertas
      return [newAlert, ...prev].slice(0, 10)
    })
  }

  const dismissAlert = (id: string) => {
    setAlertItems((prev) => prev.map((alert) => (alert.id === id ? { ...alert, dismissed: true } : alert)))
  }

  const clearAllAlerts = () => {
    setAlertItems((prev) => prev.map((alert) => ({ ...alert, dismissed: true })))
  }

  const visibleAlerts = alertItems.filter((alert) => !alert.dismissed || showDismissed)

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
          {alertItems.length > 0 && (
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
