"use client"

import { Button } from "@/components/ui/button"
import { Settings, Cog, Link, Fan, Disc, Snowflake } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ElementSelectorProps = {
  currentElement: string
  onElementChange: (element: string) => void
}

export function ElementSelector({ currentElement, onElementChange }: ElementSelectorProps) {
  const elements = [
    { id: "none", label: "Motor Apenas", icon: <Settings className="h-4 w-4" />, tooltip: "Visualizar apenas o motor" },
    {
      id: "gearbox",
      label: "Caixa de Engrenagens",
      icon: <Cog className="h-4 w-4" />,
      tooltip: "Visualizar caixa de redução",
    },
    {
      id: "coupling",
      label: "Acoplamento",
      icon: <Link className="h-4 w-4" />,
      tooltip: "Visualizar acoplamento flexível",
    },
    {
      id: "fan",
      label: "Ventilador",
      icon: <Fan className="h-4 w-4" />,
      tooltip: "Visualizar ventilador de refrigeração",
    },
    { id: "flywheel", label: "Volante", icon: <Disc className="h-4 w-4" />, tooltip: "Visualizar volante de inércia" },
    {
      id: "refrigeration",
      label: "Refrigeração",
      icon: <Snowflake className="h-4 w-4" />,
      tooltip: "Visualizar sistema de refrigeração",
    },
  ]

  return (
    <div className="bg-zinc-900/90 p-2 rounded-lg backdrop-blur-sm border border-zinc-800 shadow-lg">
      <div className="text-xs text-zinc-400 mb-2 px-2 font-medium">Componentes</div>
      <div className="space-y-1.5">
        {elements.map((element) => (
          <TooltipProvider key={element.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={currentElement === element.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => onElementChange(element.id)}
                  className={`justify-start w-full px-3 py-1 h-8 ${
                    currentElement === element.id ? "" : "bg-zinc-800/50 hover:bg-zinc-700/50"
                  }`}
                >
                  {element.icon}
                  <span className="text-xs ml-2">{element.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>{element.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  )
}
