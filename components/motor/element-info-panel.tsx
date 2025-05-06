"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Cog, Link, Fan, Disc, Snowflake } from "lucide-react"

type ElementInfoPanelProps = {
  currentElement: string
  rpm: number
}

export function ElementInfoPanel({ currentElement, rpm }: ElementInfoPanelProps) {
  if (currentElement === "none") return null

  const elementInfo = {
    gearbox: {
      title: "Caixa de Redução",
      description: "Reduz a velocidade do motor e aumenta o torque",
      icon: <Cog className="h-5 w-5" />,
      specs: [
        { label: "Relação", value: "1:4" },
        { label: "Velocidade de Saída", value: `${Math.round(rpm / 4)} RPM` },
        { label: "Multiplicador de Torque", value: "4x" },
        { label: "Eficiência", value: "96%" },
      ],
    },
    coupling: {
      title: "Acoplamento Flexível",
      description: "Conecta o eixo do motor à carga com amortecimento de vibração",
      icon: <Link className="h-5 w-5" />,
      specs: [
        { label: "Tipo", value: "Elastomérico" },
        { label: "Classificação de Torque", value: "120 Nm" },
        { label: "Desalinhamento", value: "±2°" },
        { label: "Material", value: "Aço/Poliuretano" },
      ],
    },
    fan: {
      title: "Ventilador de Refrigeração",
      description: "Refrigeração forçada a ar para o motor",
      icon: <Fan className="h-5 w-5" />,
      specs: [
        { label: "Fluxo de Ar", value: `${Math.round(rpm * 0.05)} CFM` },
        { label: "Diâmetro", value: "250mm" },
        { label: "Pás", value: "7" },
        { label: "Nível de Ruído", value: `${Math.round(30 + rpm * 0.01)} dB` },
      ],
    },
    flywheel: {
      title: "Volante de Inércia",
      description: "Armazena energia rotacional e suaviza a operação",
      icon: <Disc className="h-5 w-5" />,
      specs: [
        { label: "Peso", value: "8.5 kg" },
        { label: "Diâmetro", value: "320mm" },
        { label: "Inércia", value: "0.42 kg·m²" },
        { label: "Material", value: "Ferro Fundido" },
      ],
    },
    refrigeration: {
      title: "Sistema de Refrigeração",
      description: "Sistema de refrigeração baseado em compressor",
      icon: <Snowflake className="h-5 w-5" />,
      specs: [
        { label: "Refrigerante", value: "R-134a" },
        { label: "Capacidade de Refrigeração", value: `${Math.round(rpm * 0.5)} W` },
        { label: "Tipo de Compressor", value: "Rotativo" },
        { label: "COP", value: "3.2" },
      ],
    },
  }

  const info = elementInfo[currentElement as keyof typeof elementInfo]
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
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
          {info.specs.map((spec, index) => (
            <div key={index} className={index % 2 === 0 ? "col-span-1" : "col-span-1"}>
              <div className="text-zinc-500">{spec.label}</div>
              <div className="font-medium">{spec.value}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
