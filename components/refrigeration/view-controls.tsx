"use client"

import { Button } from "@/components/ui/button"
import { Eye, Layers, Box } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ViewControlsProps = {
  currentView: "normal" | "exploded" | "transparent"
  onViewChange: (view: "normal" | "exploded" | "transparent") => void
}

export function ViewControls({ currentView, onViewChange }: ViewControlsProps) {
  return (
    <div className="flex space-x-1 bg-zinc-900/90 p-1.5 rounded-lg backdrop-blur-sm border border-zinc-800 shadow-lg">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === "normal" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange("normal")}
              className={`px-2 py-1 h-7 ${currentView === "normal" ? "" : "bg-zinc-800/50 hover:bg-zinc-700/50"}`}
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">Normal</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualização normal do sistema</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === "exploded" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange("exploded")}
              className={`px-2 py-1 h-7 ${currentView === "exploded" ? "" : "bg-zinc-800/50 hover:bg-zinc-700/50"}`}
            >
              <Layers className="h-4 w-4" />
              <span className="sr-only">Explodido</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualização com componentes separados</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={currentView === "transparent" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewChange("transparent")}
              className={`px-2 py-1 h-7 ${currentView === "transparent" ? "" : "bg-zinc-800/50 hover:bg-zinc-700/50"}`}
            >
              <Box className="h-4 w-4" />
              <span className="sr-only">Raio-X</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visualização transparente para ver componentes internos</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
