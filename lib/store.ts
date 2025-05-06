import { create } from "zustand"

// Define the performance data point type
type PerformanceDataPoint = {
  timestamp: number
  rpm: number
  temperature: number
  powerConsumption: number
  efficiency: number
  systemTemperature: number
}

// Define the store state type
interface MotorState {
  rpm: number
  temperature: number
  powerConsumption: number
  efficiency: number
  isRunning: boolean
  systemTemperature: number
  targetTemperature: number
  compressorPressure: number
  condenserPressure: number
  evaporatorPressure: number
  defrostMode: boolean
  performanceHistory: PerformanceDataPoint[]

  // Physics-related properties
  motorLoad: number
  motorBalance: number
  vibrationLevel: number
  thermalExpansion: number
  frictionCoefficient: number

  // Actions
  setRpm: (rpm: number) => void
  setTemperature: (temperature: number) => void
  setPowerConsumption: (powerConsumption: number) => void
  setEfficiency: (efficiency: number) => void
  toggleRunning: () => void
  setSystemTemperature: (temperature: number) => void
  setTargetTemperature: (temperature: number) => void
  setCompressorPressure: (pressure: number) => void
  setCondenserPressure: (pressure: number) => void
  setEvaporatorPressure: (pressure: number) => void
  setDefrostMode: (mode: boolean) => void
  addPerformanceDataPoint: () => void

  // Physics-related actions
  setMotorLoad: (load: number) => void
  setMotorBalance: (balance: number) => void
  setVibrationLevel: (level: number) => void
  setThermalExpansion: (expansion: number) => void
  setFrictionCoefficient: (friction: number) => void
}

// Create the store
export const useMotorStore = create<MotorState>((set, get) => ({
  rpm: 0,
  temperature: 45,
  powerConsumption: 750,
  efficiency: 92,
  isRunning: false, // Garantir que comece desligado
  systemTemperature: 5,
  targetTemperature: 2,
  compressorPressure: 12.5,
  condenserPressure: 18.2,
  evaporatorPressure: 4.8,
  defrostMode: false,
  performanceHistory: [],

  // Physics-related properties with default values
  motorLoad: 0.5,
  motorBalance: 0.9,
  vibrationLevel: 0.1,
  thermalExpansion: 0,
  frictionCoefficient: 0.02,

  // Actions
  setRpm: (rpm) => set({ rpm }),
  setTemperature: (temperature) => set({ temperature }),
  setPowerConsumption: (powerConsumption) => set({ powerConsumption }),
  setEfficiency: (efficiency) => set({ efficiency }),
  toggleRunning: () => {
    const isRunning = !get().isRunning
    set({ isRunning })

    // If turning off, reduce RPM
    if (!isRunning) {
      set({ rpm: 0 })
    } else {
      // When turning on, set a default RPM
      set({ rpm: 1200 })
    }
  },
  setSystemTemperature: (temperature) => set({ systemTemperature: temperature }),
  setTargetTemperature: (temperature) => set({ targetTemperature: temperature }),
  setCompressorPressure: (pressure) => set({ compressorPressure: pressure }),
  setCondenserPressure: (pressure) => set({ condenserPressure: pressure }),
  setEvaporatorPressure: (pressure) => set({ evaporatorPressure: pressure }),
  setDefrostMode: (mode) => set({ defrostMode: mode }),
  addPerformanceDataPoint: () => {
    const { rpm, temperature, powerConsumption, efficiency, systemTemperature } = get()
    const newDataPoint = {
      timestamp: Date.now(),
      rpm,
      temperature,
      powerConsumption,
      efficiency,
      systemTemperature,
    }

    // Keep only the last 20 data points
    const history = [...get().performanceHistory, newDataPoint].slice(-20)
    set({ performanceHistory: history })
  },

  // Physics-related actions
  setMotorLoad: (load) => set({ motorLoad: load }),
  setMotorBalance: (balance) => set({ motorBalance: balance }),
  setVibrationLevel: (level) => set({ vibrationLevel: level }),
  setThermalExpansion: (expansion) => set({ thermalExpansion: expansion }),
  setFrictionCoefficient: (friction) => set({ frictionCoefficient: friction }),
}))
