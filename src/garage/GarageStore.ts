import { CARS, CarDefinition, getCarById } from './CarDefinitions';

const COINS_KEY = 'highway_rush_total_coins';
const UNLOCKED_KEY = 'highway_rush_unlocked_cars';
const SELECTED_KEY = 'highway_rush_selected_car';

type Listener = () => void;

class GarageStore {
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('GarageStore listener error:', e);
      }
    });
  }

  getTotalCoins(): number {
    if (typeof window === 'undefined') return 0;
    const val = localStorage.getItem(COINS_KEY);
    return val ? parseInt(val, 10) || 0 : 0;
  }

  addCoins(amount: number): number {
    if (typeof window === 'undefined' || amount <= 0) return this.getTotalCoins();
    const current = this.getTotalCoins();
    const updated = current + amount;
    localStorage.setItem(COINS_KEY, updated.toString());
    this.notify();
    return updated;
  }

  getUnlockedCarIds(): string[] {
    if (typeof window === 'undefined') return ['cyber-racer'];
    try {
      const stored = localStorage.getItem(UNLOCKED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.includes('cyber-racer')) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return ['cyber-racer'];
  }

  isCarUnlocked(id: string): boolean {
    if (id === 'cyber-racer') return true;
    return this.getUnlockedCarIds().includes(id);
  }

  unlockCar(id: string): boolean {
    if (typeof window === 'undefined') return false;
    const car = getCarById(id);
    if (!car) return false;

    if (this.isCarUnlocked(id)) return true;

    const coins = this.getTotalCoins();
    if (coins < car.price) {
      return false; // Not enough coins
    }

    // Deduct coins
    localStorage.setItem(COINS_KEY, (coins - car.price).toString());

    // Add to unlocked
    const unlocked = this.getUnlockedCarIds();
    unlocked.push(id);
    localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));

    // Auto-select newly unlocked car
    this.selectCar(id);

    this.notify();
    return true;
  }

  getSelectedCarId(): string {
    if (typeof window === 'undefined') return 'cyber-racer';
    const id = localStorage.getItem(SELECTED_KEY);
    if (id && this.isCarUnlocked(id)) {
      return id;
    }
    return 'cyber-racer';
  }

  getSelectedCar(): CarDefinition {
    return getCarById(this.getSelectedCarId());
  }

  selectCar(id: string): boolean {
    if (typeof window === 'undefined') return false;
    if (!this.isCarUnlocked(id)) return false;
    localStorage.setItem(SELECTED_KEY, id);
    this.notify();
    return true;
  }
}

export const garageStore = new GarageStore();
export function getGarageStore(): GarageStore {
  return garageStore;
}
