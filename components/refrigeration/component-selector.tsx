"use client"

import { Button } from "@/components/ui/button"
import { Cpu, Thermometer, Gauge, Fan, Snowflake } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ComponentSelectorProps = {
  currentComponent: string
  onComponentChange: (component: string) => void
}

export function ComponentSelector({ currentComponent, onComponentChange }: ComponentSelectorProps) {
  const components = [
    {
      id: "full",
      label: "Sistema Completo",
      icon: <Snowflake className="h-4 w-4" />,
      tooltip: "Visualizar sistema completo",
    },
    {
      id: "compressor",
      label: "Compressor",
      icon: <Cpu className="h-4 w-4" />,
      tooltip: "Visualizar apenas o compressor",
    },
    {
      id: "condenser",
      label: "Condensador",
      icon: <Fan className="h-4 w-4" />,
      tooltip: "Visualizar apenas o condensador",
    },
    {
      id: "expansion",
      label: "Válvula de Expansão",
      icon: <Gauge className="h-4 w-4" />,
      tooltip: "Visualizar apenas a válvula de expansão",
    },
    {
      id: "evaporator",
      label: "Evaporador",
      icon: <Thermometer className="h-4 w-4" />,
      tooltip: "Visualizar apenas o evaporador",
    },
  ]

  return (
    <div className="bg-zinc-900/90 p-2 rounded-lg backdrop-blur-sm border border-zinc-800 shadow-lg max-w-[180px]">
      <div className="text-xs text-zinc-400 mb-2 px-1 font-medium">Componentes</div>
      <div className="space-y-1">
        {components.map((component) => (
          <TooltipProvider key={component.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentComponent === component.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onComponentChange(component.id)}
                  className={`justify-start w-full px-2 py-1 h-7 text-xs ${
                    currentComponent === component.id ? "" : "bg-zinc-800/50 hover:bg-zinc-700/50"
                  }`}
                >
                  {component.icon}
                  <span className="text-xs ml-1 truncate">{component.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{component.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  )
}
