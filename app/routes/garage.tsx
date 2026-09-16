import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { CARS, CarDefinition } from '../../src/garage/CarDefinitions';
import { garageStore } from '../../src/garage/GarageStore';

export const Route = createFileRoute('/garage')({
  component: GarageRouteComponent,
});

function GarageRouteComponent() {
  const navigate = useNavigate();
  const [totalCoins, setTotalCoins] = useState(0);
  const [selectedCarId, setSelectedCarId] = useState('cyber-racer');
  const [unlockedIds, setUnlockedIds] = useState<string[]>(['cyber-racer']);
  const [justUnlocked, setJustUnlocked] = useState<string | null>(null);

  const refreshStoreState = () => {
    setTotalCoins(garageStore.getTotalCoins());
    setSelectedCarId(garageStore.getSelectedCarId());
    setUnlockedIds(garageStore.getUnlockedCarIds());
  };

  useEffect(() => {
    refreshStoreState();
    return garageStore.subscribe(refreshStoreState);
  }, []);

  const handleSelect = (carId: string) => {
    garageStore.selectCar(carId);
    setSelectedCarId(carId);
  };

  const handleUnlock = (car: CarDefinition) => {
    if (totalCoins < car.price) return;
    const success = garageStore.unlockCar(car.id);
    if (success) {
      setJustUnlocked(car.id);
      setTimeout(() => setJustUnlocked(null), 2500);
      refreshStoreState();
    }
  };

  return (
    <div className="garage-page">
      <div className="garage-header">
        <div className="garage-title-group">
          <span className="garage-badge">CYBER WORKSHOP</span>
          <h1 className="garage-title">VEHICLE GARAGE</h1>
          <p className="garage-subtitle">
            Earn coins during high-speed runs to unlock legendary hypercars with exclusive performance perks.
          </p>
        </div>

        <div className="garage-balance-card">
          <span className="balance-label">YOUR COINS</span>
          <div className="balance-amount">
            <span className="coin-glow">🪙</span>
            <span className="balance-number">{totalCoins.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {justUnlocked && (
        <div className="unlock-alert-banner animate-bounce">
          🎉 Successfully unlocked and equipped <strong>{CARS.find(c => c.id === justUnlocked)?.name}</strong>!
        </div>
      )}

      <div className="garage-grid">
        {CARS.map((car) => {
          const isUnlocked = unlockedIds.includes(car.id);
          const isSelected = selectedCarId === car.id;
          const canAfford = totalCoins >= car.price;
          const colorHex = '#' + car.color.toString(16).padStart(6, '0');
          const accentHex = '#' + car.accentColor.toString(16).padStart(6, '0');

          return (
            <div
              key={car.id}
              className={`garage-card ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`}
            >
              <div
                className="car-visual-preview"
                style={{
                  background: `linear-gradient(135deg, ${colorHex}22 0%, #121624 100%)`,
                  borderColor: isSelected ? colorHex : 'rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="car-color-swatch"
                  style={{
                    backgroundColor: colorHex,
                    boxShadow: `0 0 20px ${colorHex}88`,
                    border: `2px solid ${accentHex}`,
                  }}
                />
                <span className="preview-icon">🏎️</span>
                {isSelected && <span className="active-tag">EQUIPPED</span>}
                {!isUnlocked && <span className="locked-tag">🔒 LOCKED</span>}
              </div>

              <div className="car-card-body">
                <div className="car-header-row">
                  <h3 className="car-name">{car.name}</h3>
                  <span className="car-price-badge">
                    {car.price === 0 ? 'FREE' : `${car.price} 🪙`}
                  </span>
                </div>
                <div className="car-tagline">{car.tagline}</div>

                <div className="car-perk-box">
                  <span className="perk-label">⚡ BONUS PERK:</span>
                  <span className="perk-desc">{car.bonusDescription}</span>
                </div>

                <div className="car-stats-list">
                  <div className="stat-row">
                    <span>SCORE MULTIPLIER</span>
                    <span className="stat-val">+{Math.round(car.stats.speedMultiplierBonus * 100)}%</span>
                  </div>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${Math.max(15, (car.stats.speedMultiplierBonus / 0.25) * 100)}%` }}
                    />
                  </div>

                  <div className="stat-row">
                    <span>SHIELD DURATION</span>
                    <span className="stat-val">{car.stats.invulnerabilityDuration.toFixed(1)}s</span>
                  </div>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill shield-fill"
                      style={{ width: `${((car.stats.invulnerabilityDuration - 2.0) / 1.5) * 100}%` }}
                    />
                  </div>

                  <div className="stat-row">
                    <span>NITRO POWER</span>
                    <span className="stat-val">+{Math.round((car.stats.boostMultiplier - 1.0) * 100)}%</span>
                  </div>
                  <div className="stat-bar-track">
                    <div
                      className="stat-bar-fill nitro-fill"
                      style={{ width: `${Math.max(15, ((car.stats.boostMultiplier - 1.0) / 0.5) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="car-card-footer">
                  {isSelected ? (
                    <button type="button" className="arcade-btn selected-btn" disabled>
                      ✓ IN USE
                    </button>
                  ) : isUnlocked ? (
                    <button
                      type="button"
                      className="arcade-btn select-btn"
                      onClick={() => handleSelect(car.id)}
                    >
                      EQUIP CAR
                    </button>
                  ) : canAfford ? (
                    <button
                      type="button"
                      className="arcade-btn unlock-btn pulse"
                      onClick={() => handleUnlock(car)}
                    >
                      UNLOCK ({car.price} 🪙)
                    </button>
                  ) : (
                    <button type="button" className="arcade-btn locked-btn" disabled>
                      NEEDS {car.price - totalCoins} MORE 🪙
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="garage-bottom-nav">
        <button
          type="button"
          className="arcade-btn primary-action-btn"
          onClick={() => navigate({ to: '/' })}
        >
          BACK TO HIGHWAY 🎮
        </button>
      </div>
    </div>
  );
}
