/**
 * Motor Physics Engine
 *
 * Este módulo implementa cálculos físicos realistas para a simulação
 * do motor hermético e seus componentes.
 */

// Constantes físicas
const GRAVITY = 9.81 // m/s²
const AIR_DENSITY = 1.225 // kg/m³
const OIL_VISCOSITY = 0.05 // Pa·s (valor aproximado para óleo de motor)

// Interface para propriedades físicas dos componentes
export interface PhysicalProperties {
  mass: number // kg
  momentOfInertia: number // kg·m²
  friction: number // coeficiente de atrito (0-1)
  elasticity: number // coeficiente de elasticidade (0-1)
  thermalExpansion: number // coeficiente de expansão térmica (K⁻¹)
}

// Propriedades físicas padrão para diferentes componentes
export const defaultProperties: Record<string, PhysicalProperties> = {
  rotor: {
    mass: 5.0,
    momentOfInertia: 0.12,
    friction: 0.02,
    elasticity: 0.3,
    thermalExpansion: 1.2e-5,
  },
  piston: {
    mass: 0.8,
    momentOfInertia: 0.005,
    friction: 0.15,
    elasticity: 0.2,
    thermalExpansion: 2.3e-5,
  },
  crankshaft: {
    mass: 3.2,
    momentOfInertia: 0.08,
    friction: 0.03,
    elasticity: 0.25,
    thermalExpansion: 1.1e-5,
  },
  flywheel: {
    mass: 8.5,
    momentOfInertia: 0.42,
    friction: 0.01,
    elasticity: 0.1,
    thermalExpansion: 1.0e-5,
  },
  fan: {
    mass: 0.6,
    momentOfInertia: 0.03,
    friction: 0.05,
    elasticity: 0.4,
    thermalExpansion: 2.5e-5,
  },
  gearbox: {
    mass: 4.5,
    momentOfInertia: 0.15,
    friction: 0.04,
    elasticity: 0.2,
    thermalExpansion: 1.3e-5,
  },
}

/**
 * Calcula a posição do pistão com base na posição angular do virabrequim
 * usando equações de cinemática do mecanismo biela-manivela
 */
export function calculatePistonPosition(crankAngle: number, crankRadius: number, connectingRodLength: number): number {
  // Equação cinemática para o mecanismo biela-manivela
  return (
    Math.cos(crankAngle) * crankRadius +
    Math.sqrt(Math.pow(connectingRodLength, 2) - Math.pow(Math.sin(crankAngle) * crankRadius, 2)) -
    (connectingRodLength + crankRadius)
  )
}

/**
 * Calcula a aceleração do pistão com base na posição angular e velocidade angular
 */
export function calculatePistonAcceleration(
  crankAngle: number,
  angularVelocity: number,
  crankRadius: number,
  connectingRodLength: number,
): number {
  const ratio = crankRadius / connectingRodLength

  // Equação para aceleração do pistão
  return crankRadius * Math.pow(angularVelocity, 2) * (Math.cos(crankAngle) + ratio * Math.cos(2 * crankAngle))
}

/**
 * Calcula o torque necessário com base na carga, RPM e temperatura
 */
export function calculateTorque(rpm: number, load: number, temperature: number, cylinderPressure: number): number {
  // Fatores de ajuste baseados na temperatura
  const temperatureFactor = 1 - (temperature - 60) / 200

  // Torque base
  const baseTorque = (cylinderPressure * load) / 10

  // Torque ajustado pela temperatura e RPM
  return baseTorque * temperatureFactor * (1 - (rpm / 6000) * 0.2)
}

/**
 * Calcula a vibração do motor com base no RPM, balanceamento e carga
 */
export function calculateVibration(
  rpm: number,
  balance: number,
  load: number,
): { amplitude: number; frequency: number } {
  // Frequência de vibração baseada no RPM
  const frequency = rpm / 60

  // Amplitude de vibração baseada no balanceamento e carga
  const baseAmplitude = (1 - balance) * 0.01
  const loadFactor = 1 + load * 0.5
  const rpmFactor = Math.pow(rpm / 3000, 2)

  const amplitude = baseAmplitude * loadFactor * rpmFactor

  return { amplitude, frequency }
}

/**
 * Calcula a expansão térmica de um componente
 */
export function calculateThermalExpansion(
  initialSize: number,
  temperature: number,
  referenceTemperature: number,
  thermalExpansionCoefficient: number,
): number {
  return initialSize * (1 + thermalExpansionCoefficient * (temperature - referenceTemperature))
}

/**
 * Calcula a resistência ao movimento devido ao atrito
 */
export function calculateFrictionResistance(
  velocity: number,
  frictionCoefficient: number,
  normalForce: number,
): number {
  return frictionCoefficient * normalForce * Math.sign(velocity)
}

/**
 * Calcula a inércia rotacional e o tempo necessário para atingir uma velocidade
 */
export function calculateAccelerationTime(
  initialRpm: number,
  targetRpm: number,
  momentOfInertia: number,
  torque: number,
): number {
  // Converter RPM para rad/s
  const initialOmega = (initialRpm * 2 * Math.PI) / 60
  const targetOmega = (targetRpm * 2 * Math.PI) / 60

  // Tempo = (mudança de momento angular) / torque
  return (momentOfInertia * (targetOmega - initialOmega)) / torque
}

/**
 * Calcula a eficiência do motor com base na temperatura e RPM
 */
export function calculateEfficiency(rpm: number, temperature: number, load: number): number {
  // Eficiência base (90%)
  let efficiency = 90

  // Ajuste baseado na temperatura
  if (temperature < 60) {
    // Baixa temperatura reduz a eficiência
    efficiency -= (60 - temperature) * 0.3
  } else if (temperature > 80) {
    // Alta temperatura reduz a eficiência
    efficiency -= (temperature - 80) * 0.5
  }

  // Ajuste baseado no RPM
  // Eficiência máxima em torno de 1800-2200 RPM
  const rpmFactor = 1 - Math.abs(rpm - 2000) / 2000
  efficiency *= 0.8 + rpmFactor * 0.2

  // Ajuste baseado na carga
  // Eficiência máxima em torno de 70-80% de carga
  const loadFactor = 1 - Math.abs(load - 0.75) / 0.75
  efficiency *= 0.9 + loadFactor * 0.1

  return Math.max(50, Math.min(98, efficiency))
}

/**
 * Calcula a pressão do cilindro com base na posição do pistão e temperatura
 */
export function calculateCylinderPressure(
  pistonPosition: number,
  temperature: number,
  compressionRatio: number,
): number {
  // Normalizar posição do pistão (0 = BDC, 1 = TDC)
  const normalizedPosition = (pistonPosition + 1) / 2

  // Volume relativo baseado na posição do pistão e taxa de compressão
  const relativeVolume = 1 + (compressionRatio - 1) * (1 - normalizedPosition)

  // Pressão baseada na lei dos gases (P1*V1 = P2*V2)
  const basePressure = 1 // pressão atmosférica
  const pressure = (basePressure * compressionRatio) / relativeVolume

  // Ajuste pela temperatura
  const temperatureFactor = (temperature + 273.15) / 293.15 // Kelvin

  return pressure * temperatureFactor
}

/**
 * Calcula a resistência do ar para componentes rotativos
 */
export function calculateAirResistance(angularVelocity: number, radius: number, dragCoefficient: number): number {
  // Velocidade tangencial na ponta
  const tangentialVelocity = angularVelocity * radius

  // Força de arrasto
  const dragForce = 0.5 * AIR_DENSITY * Math.pow(tangentialVelocity, 2) * dragCoefficient

  // Torque de resistência
  return dragForce * radius
}

/**
 * Calcula o fluxo de calor entre componentes
 */
export function calculateHeatTransfer(
  temperatureDifference: number,
  thermalConductivity: number,
  contactArea: number,
  distance: number,
): number {
  // Lei de Fourier para transferência de calor por condução
  return (thermalConductivity * contactArea * temperatureDifference) / distance
}
