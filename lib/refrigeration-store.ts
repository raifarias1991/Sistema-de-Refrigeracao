import { create } from "zustand"

// Define the performance data point type
type PerformanceDataPoint = {
  timestamp: number
  compressorRpm: number
  systemTemperature: number
  targetTemperature: number
  compressorPressure: number
  condenserPressure: number
  evaporatorPressure: number
  powerConsumption: number
  cop: number // Coefficient of Performance
  superheat: number // Superaquecimento na saída do evaporador
  subcooling: number // Subresfriamento na saída do condensador
  refrigerantState: {
    compressorInlet: string // Estado do refrigerante na entrada do compressor
    compressorOutlet: string // Estado do refrigerante na saída do compressor
    condenserInlet: string // Estado do refrigerante na entrada do condensador
    condenserOutlet: string // Estado do refrigerante na saída do condensador
    expansionValveInlet: string // Estado do refrigerante na entrada da válvula de expansão
    expansionValveOutlet: string // Estado do refrigerante na saída da válvula de expansão
    evaporatorInlet: string // Estado do refrigerante na entrada do evaporador
    evaporatorOutlet: string // Estado do refrigerante na saída do evaporador
  }
}

// Define the store state type
interface RefrigerationState {
  // Sistema de refrigeração
  compressorRpm: number
  isRunning: boolean
  systemTemperature: number
  targetTemperature: number
  compressorPressure: number
  condenserPressure: number
  evaporatorPressure: number
  defrostMode: boolean
  performanceHistory: PerformanceDataPoint[]
  powerConsumption: number
  cop: number // Coefficient of Performance
  refrigerantFlow: number
  refrigerantCharge: number
  superheat: number // Superaquecimento na saída do evaporador
  subcooling: number // Subresfriamento na saída do condensador
  compressorEfficiency: number
  condenserEfficiency: number
  evaporatorEfficiency: number
  expansionValveOpening: number
  ambientTemperature: number

  // Refrigerante
  refrigerantType: string
  refrigerantState: {
    compressorInlet: string
    compressorOutlet: string
    condenserInlet: string
    condenserOutlet: string
    expansionValveInlet: string
    expansionValveOutlet: string
    evaporatorInlet: string
    evaporatorOutlet: string
  }

  // Alertas e status
  alerts: {
    highPressure: boolean
    lowPressure: boolean
    highTemperature: boolean
    lowRefrigerant: boolean
    highSuperheat: boolean
    lowSuperheat: boolean
    highSubcooling: boolean
    lowSubcooling: boolean
    compressorOverload: boolean
    frozenEvaporator: boolean
  }

  // Actions
  setCompressorRpm: (rpm: number) => void
  toggleRunning: () => void
  setSystemTemperature: (temperature: number) => void
  setTargetTemperature: (temperature: number) => void
  setCompressorPressure: (pressure: number) => void
  setCondenserPressure: (pressure: number) => void
  setEvaporatorPressure: (pressure: number) => void
  setDefrostMode: (mode: boolean) => void
  setPowerConsumption: (power: number) => void
  setCOP: (cop: number) => void
  setRefrigerantFlow: (flow: number) => void
  setRefrigerantCharge: (charge: number) => void
  setSuperheat: (superheat: number) => void
  setSubcooling: (subcooling: number) => void
  setCompressorEfficiency: (efficiency: number) => void
  setCondenserEfficiency: (efficiency: number) => void
  setEvaporatorEfficiency: (efficiency: number) => void
  setExpansionValveOpening: (opening: number) => void
  setAmbientTemperature: (temperature: number) => void
  setRefrigerantType: (type: string) => void
  setRefrigerantState: (state: Partial<RefrigerationState["refrigerantState"]>) => void
  addPerformanceDataPoint: () => void
  setAlert: (alert: keyof RefrigerationState["alerts"], value: boolean) => void
  simulateSystemBehavior: () => void
}

// Create the store
export const useRefrigerationStore = create<RefrigerationState>((set, get) => ({
  // Estado inicial
  compressorRpm: 0,
  isRunning: false,
  systemTemperature: 25, // Temperatura ambiente inicial
  targetTemperature: 5, // Temperatura alvo padrão para refrigeração
  compressorPressure: 10,
  condenserPressure: 15,
  evaporatorPressure: 4,
  defrostMode: false,
  performanceHistory: [],
  powerConsumption: 0,
  cop: 3.0,
  refrigerantFlow: 0,
  refrigerantCharge: 100, // Percentual de carga do refrigerante (100% = carga completa)
  superheat: 5, // Superaquecimento padrão (5°C)
  subcooling: 3, // Subresfriamento padrão (3°C)
  compressorEfficiency: 85, // Eficiência do compressor (%)
  condenserEfficiency: 90, // Eficiência do condensador (%)
  evaporatorEfficiency: 90, // Eficiência do evaporador (%)
  expansionValveOpening: 50, // Abertura da válvula de expansão (%)
  ambientTemperature: 25, // Temperatura ambiente (°C)

  // Refrigerante
  refrigerantType: "R-134a", // Tipo de refrigerante
  refrigerantState: {
    compressorInlet: "Vapor superaquecido",
    compressorOutlet: "Vapor superaquecido a alta pressão",
    condenserInlet: "Vapor superaquecido a alta pressão",
    condenserOutlet: "Líquido subresfriado",
    expansionValveInlet: "Líquido subresfriado",
    expansionValveOutlet: "Mistura líquido-vapor",
    evaporatorInlet: "Mistura líquido-vapor",
    evaporatorOutlet: "Vapor superaquecido",
  },

  // Estado inicial dos alertas
  alerts: {
    highPressure: false,
    lowPressure: false,
    highTemperature: false,
    lowRefrigerant: false,
    highSuperheat: false,
    lowSuperheat: false,
    highSubcooling: false,
    lowSubcooling: false,
    compressorOverload: false,
    frozenEvaporator: false,
  },

  // Actions
  setCompressorRpm: (rpm) => {
    set({ compressorRpm: rpm })
    get().simulateSystemBehavior()
  },

  toggleRunning: () => {
    const isRunning = !get().isRunning
    set({ isRunning })

    // Se estiver desligando, zerar o RPM
    if (!isRunning) {
      set({ compressorRpm: 0 })
    } else {
      // Ao ligar, definir um RPM padrão
      set({ compressorRpm: 1500 })
      get().simulateSystemBehavior()
    }
  },

  setSystemTemperature: (temperature) => set({ systemTemperature: temperature }),
  setTargetTemperature: (temperature) => {
    set({ targetTemperature: temperature })
    get().simulateSystemBehavior()
  },
  setCompressorPressure: (pressure) => set({ compressorPressure: pressure }),
  setCondenserPressure: (pressure) => set({ condenserPressure: pressure }),
  setEvaporatorPressure: (pressure) => set({ evaporatorPressure: pressure }),
  setDefrostMode: (mode) => {
    set({ defrostMode: mode })
    get().simulateSystemBehavior()
  },
  setPowerConsumption: (power) => set({ powerConsumption: power }),
  setCOP: (cop) => set({ cop: cop }),
  setRefrigerantFlow: (flow) => set({ refrigerantFlow: flow }),
  setRefrigerantCharge: (charge) => set({ refrigerantCharge: charge }),
  setSuperheat: (superheat) => set({ superheat: superheat }),
  setSubcooling: (subcooling) => set({ subcooling: subcooling }),
  setCompressorEfficiency: (efficiency) => set({ compressorEfficiency: efficiency }),
  setCondenserEfficiency: (efficiency) => set({ condenserEfficiency: efficiency }),
  setEvaporatorEfficiency: (efficiency) => set({ evaporatorEfficiency: efficiency }),
  setExpansionValveOpening: (opening) => set({ expansionValveOpening: opening }),
  setAmbientTemperature: (temperature) => set({ ambientTemperature: temperature }),
  setRefrigerantType: (type) => set({ refrigerantType: type }),
  setRefrigerantState: (state) => set({ refrigerantState: { ...get().refrigerantState, ...state } }),

  addPerformanceDataPoint: () => {
    const {
      compressorRpm,
      systemTemperature,
      targetTemperature,
      compressorPressure,
      condenserPressure,
      evaporatorPressure,
      powerConsumption,
      cop,
      superheat,
      subcooling,
      refrigerantState,
    } = get()

    const newDataPoint = {
      timestamp: Date.now(),
      compressorRpm,
      systemTemperature,
      targetTemperature,
      compressorPressure,
      condenserPressure,
      evaporatorPressure,
      powerConsumption,
      cop,
      superheat,
      subcooling,
      refrigerantState,
    }

    // Manter apenas os últimos 20 pontos de dados
    const history = [...get().performanceHistory, newDataPoint].slice(-20)
    set({ performanceHistory: history })
  },

  setAlert: (alert, value) => {
    set({ alerts: { ...get().alerts, [alert]: value } })
  },

  // Simulação do comportamento do sistema baseado em princípios termodinâmicos reais
  simulateSystemBehavior: () => {
    const {
      isRunning,
      compressorRpm,
      targetTemperature,
      systemTemperature,
      ambientTemperature,
      refrigerantCharge,
      expansionValveOpening,
      compressorEfficiency,
      condenserEfficiency,
      evaporatorEfficiency,
      defrostMode,
    } = get()

    if (!isRunning) {
      // Sistema desligado - pressões tendem a equalizar
      const currentCompressorPressure = get().compressorPressure
      const currentCondenserPressure = get().condenserPressure
      const currentEvaporatorPressure = get().evaporatorPressure

      // Equalização gradual das pressões
      const equilibriumPressure = 10 // Pressão de equilíbrio em repouso
      const equalizationRate = 0.1 // Taxa de equalização

      set({
        compressorPressure:
          currentCompressorPressure + (equilibriumPressure - currentCompressorPressure) * equalizationRate,
        condenserPressure:
          currentCondenserPressure + (equilibriumPressure - currentCondenserPressure) * equalizationRate,
        evaporatorPressure:
          currentEvaporatorPressure + (equilibriumPressure - currentEvaporatorPressure) * equalizationRate,
        refrigerantFlow: 0,
        powerConsumption: 0,
        cop: 0,
      })

      return
    }

    // Sistema em funcionamento

    // 1. Calcular pressões baseadas no RPM, carga de refrigerante e abertura da válvula
    const rpmFactor = compressorRpm / 3000 // Normalizado para 0-1
    const chargeFactor = refrigerantCharge / 100 // Normalizado para 0-1
    const valveFactor = expansionValveOpening / 100 // Normalizado para 0-1

    // Pressão de sucção (evaporador) - diminui com aumento do RPM e aumenta com abertura da válvula
    const baseEvaporatorPressure = 4 + valveFactor * 2 - rpmFactor * 1.5

    // Pressão de descarga (condensador) - aumenta com RPM e diminui com abertura da válvula
    const baseCondenserPressure = 12 + rpmFactor * 8 - valveFactor * 2

    // Pressão do compressor - média entre sucção e descarga, afetada pela eficiência
    const baseCompressorPressure =
      baseEvaporatorPressure + (baseCondenserPressure - baseEvaporatorPressure) * (compressorEfficiency / 100)

    // Ajuste das pressões pela carga de refrigerante
    const evaporatorPressure = baseEvaporatorPressure * chargeFactor
    const condenserPressure = baseCondenserPressure * chargeFactor
    const compressorPressure = baseCompressorPressure * chargeFactor

    // 2. Calcular fluxo de refrigerante baseado no RPM e diferença de pressão
    const pressureDiff = condenserPressure - evaporatorPressure
    const refrigerantFlow = rpmFactor * 100 * chargeFactor * (pressureDiff / 10)

    // 3. Calcular consumo de energia
    const basePower = 200 + rpmFactor * 800 // Potência base do compressor
    const pressureLoadFactor = pressureDiff / 10 // Fator de carga devido à diferença de pressão
    const powerConsumption = basePower * pressureLoadFactor * (100 / compressorEfficiency)

    // 4. Calcular efeito de refrigeração e COP
    const tempDiff = Math.abs(systemTemperature - targetTemperature)
    const coolingCapacity = ((refrigerantFlow * evaporatorEfficiency) / 100) * 10 // Capacidade de refrigeração em watts

    // COP = Capacidade de refrigeração / Potência consumida
    const cop = powerConsumption > 0 ? coolingCapacity / powerConsumption : 0

    // 5. Calcular superaquecimento e subresfriamento
    const superheat = 5 + (100 - expansionValveOpening) / 20 - rpmFactor * 2
    const subcooling = 3 + rpmFactor * 2 - (100 - expansionValveOpening) / 20

    // 6. Determinar estados do refrigerante
    const refrigerantState = {
      compressorInlet: "Vapor superaquecido",
      compressorOutlet: "Vapor superaquecido a alta pressão",
      condenserInlet: "Vapor superaquecido a alta pressão",
      condenserOutlet: "Líquido subresfriado",
      expansionValveInlet: "Líquido subresfriado",
      expansionValveOutlet: "Mistura líquido-vapor",
      evaporatorInlet: "Mistura líquido-vapor",
      evaporatorOutlet: "Vapor superaquecido",
    }

    // 7. Calcular temperatura do sistema baseada no funcionamento
    let newSystemTemp = systemTemperature

    if (defrostMode) {
      // No modo de degelo, a temperatura aumenta gradualmente
      newSystemTemp += 0.2
    } else if (compressorRpm > 0) {
      // Quando o compressor está funcionando, a temperatura se aproxima da temperatura alvo
      const coolingPower = (coolingCapacity / 1000) * 0.1 // Efeito de resfriamento
      const ambientEffect = (ambientTemperature - systemTemperature) * 0.01 // Efeito da temperatura ambiente

      newSystemTemp = systemTemperature - (systemTemperature - targetTemperature) * coolingPower + ambientEffect
    }

    // 8. Verificar condições de alerta
    const alerts = { ...get().alerts }

    // Alertas de pressão
    alerts.highPressure = condenserPressure > 18
    alerts.lowPressure = evaporatorPressure < 2

    // Alertas de temperatura
    alerts.highTemperature = systemTemperature > targetTemperature + 10
    alerts.frozenEvaporator = systemTemperature < -5

    // Alertas de superaquecimento e subresfriamento
    alerts.highSuperheat = superheat > 10
    alerts.lowSuperheat = superheat < 2
    alerts.highSubcooling = subcooling > 8
    alerts.lowSubcooling = subcooling < 1

    // Alerta de sobrecarga do compressor
    alerts.compressorOverload = powerConsumption > 1200

    // Alerta de baixa carga de refrigerante
    alerts.lowRefrigerant = refrigerantCharge < 70

    // Atualizar o estado
    set({
      compressorPressure,
      condenserPressure,
      evaporatorPressure,
      refrigerantFlow,
      powerConsumption,
      cop,
      superheat,
      subcooling,
      refrigerantState,
      systemTemperature: newSystemTemp,
      alerts,
    })

    // Adicionar ponto de dados ao histórico
    get().addPerformanceDataPoint()
  },
}))
