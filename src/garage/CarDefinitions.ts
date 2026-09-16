export interface CarDefinition {
  id: string;
  name: string;
  tagline: string;
  price: number; // 0 = default free
  color: number; // Primary body paint hex
  accentColor: number; // Stripe / secondary hex
  emissiveColor: number; // Glow / headlights tint hex
  cabinColor: number;
  stats: {
    speedMultiplierBonus: number; // e.g. 0.1 for +10%
    invulnerabilityDuration: number; // base 2.4s + bonus
    boostMultiplier: number; // multiplier on boost effect
    handlingLerp: number; // higher = snappier lane switch
  };
  bonusDescription: string;
}

export const CARS: CarDefinition[] = [
  {
    id: 'cyber-racer',
    name: 'Cyber Racer',
    tagline: 'Standard Street Legend',
    price: 0,
    color: 0x00d4ff, // Electric Cyan
    accentColor: 0xffffff,
    emissiveColor: 0x002233,
    cabinColor: 0x1e2840,
    stats: {
      speedMultiplierBonus: 0,
      invulnerabilityDuration: 2.4,
      boostMultiplier: 1.0,
      handlingLerp: 16.0,
    },
    bonusDescription: 'Balanced baseline performance.',
  },
  {
    id: 'inferno-gt',
    name: 'Inferno GT',
    tagline: 'Scorching High-Speed Beast',
    price: 50,
    color: 0xff2244, // Fiery Red
    accentColor: 0xffaa00,
    emissiveColor: 0x440810,
    cabinColor: 0x241418,
    stats: {
      speedMultiplierBonus: 0.15, // +15% score multiplier
      invulnerabilityDuration: 2.4,
      boostMultiplier: 1.1,
      handlingLerp: 16.5,
    },
    bonusDescription: '+15% Score multiplier on all distance driven!',
  },
  {
    id: 'ghost-phantom',
    name: 'Ghost Phantom',
    tagline: 'Hyper-Shielded Prototype',
    price: 120,
    color: 0xe8ecf8, // Pearlescent White
    accentColor: 0x7c3aed, // Purple accent
    emissiveColor: 0x202040,
    cabinColor: 0x141828,
    stats: {
      speedMultiplierBonus: 0.05,
      invulnerabilityDuration: 3.4, // +1.0s invulnerability
      boostMultiplier: 1.0,
      handlingLerp: 16.0,
    },
    bonusDescription: '+1.0s Shield invulnerability on crash recovery!',
  },
  {
    id: 'neon-viper',
    name: 'Neon Viper',
    tagline: 'Overcharged Nitro Specialist',
    price: 200,
    color: 0xa855f7, // Neon Purple
    accentColor: 0x22d3ee, // Cyan stripe
    emissiveColor: 0x3b0764,
    cabinColor: 0x1a102e,
    stats: {
      speedMultiplierBonus: 0.1,
      invulnerabilityDuration: 2.4,
      boostMultiplier: 1.4, // +40% boost speed
      handlingLerp: 17.0,
    },
    bonusDescription: '+40% More powerful nitro boost acceleration!',
  },
  {
    id: 'storm-ripper',
    name: 'Storm Ripper',
    tagline: 'Ultra Agility Cyber Concept',
    price: 350,
    color: 0xfacc15, // Cyber Yellow
    accentColor: 0x18181b, // Jet black stripes
    emissiveColor: 0x422006,
    cabinColor: 0x1c1917,
    stats: {
      speedMultiplierBonus: 0.15,
      invulnerabilityDuration: 2.6,
      boostMultiplier: 1.2,
      handlingLerp: 22.0, // Snappy 22.0 handling
    },
    bonusDescription: 'Ultra-fast instantaneous lane switching!',
  },
  {
    id: 'shadow-elite',
    name: 'Shadow Elite',
    tagline: 'Masterwork Stealth Hypercar',
    price: 600,
    color: 0x18181b, // Midnight Stealth Black
    accentColor: 0xeab308, // Gold metallic trim
    emissiveColor: 0xb45309,
    cabinColor: 0x09090b,
    stats: {
      speedMultiplierBonus: 0.25, // +25% score
      invulnerabilityDuration: 3.5, // 3.5s shield
      boostMultiplier: 1.5, // +50% boost
      handlingLerp: 24.0, // Apex handling
    },
    bonusDescription: 'Apex Hypercar: +25% Score, 3.5s Shield, +50% Nitro, Apex handling!',
  },
];

export function getCarById(id: string): CarDefinition {
  return CARS.find((c) => c.id === id) || CARS[0];
}
