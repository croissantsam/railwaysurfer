import * as THREE from 'three';

export class GameScene {
  public scene: THREE.Scene;
  public ambientLight: THREE.AmbientLight;
  public sunLight: THREE.DirectionalLight;
  public hemiLight: THREE.HemisphereLight;
  // Fill light from opposite side to reduce harsh shadows
  private fillLight: THREE.DirectionalLight;

  constructor() {
    this.scene = new THREE.Scene();

    // Slightly lighter default fog — not pitch black start
    this.scene.fog = new THREE.Fog(0x0c1122, 60, 220);
    this.scene.background = new THREE.Color(0x0c1122);

    // Hemisphere light: sky tint (top) vs ground bounce (bottom)
    // Much brighter sky intensity for overall luminosity
    this.hemiLight = new THREE.HemisphereLight(0x88aadd, 0x334455, 1.8);
    this.scene.add(this.hemiLight);

    // Ambient fill — increased from 0.4 to 0.9 for much better base visibility
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(this.ambientLight);

    // Main Directional Sun — slightly warmer, strong
    this.sunLight = new THREE.DirectionalLight(0xfff0dd, 2.0);
    this.sunLight.position.set(15, 35, 10);
    this.sunLight.castShadow = true;

    // Shadow frustum must cover the visible road ahead AND the player car.
    // The camera looks ~12 units ahead; the road extends ~120 units in front.
    // Wide frustum = no missing shadows anywhere.
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 200;
    this.sunLight.shadow.camera.left = -30;
    this.sunLight.shadow.camera.right = 30;
    this.sunLight.shadow.camera.top = 80;
    this.sunLight.shadow.camera.bottom = -30;
    // Negative bias avoids shadow acne on flat road surface
    this.sunLight.shadow.bias = -0.002;
    // Normalise bias reduces peter-panning on thin objects
    this.sunLight.shadow.normalBias = 0.05;
    this.scene.add(this.sunLight);

    // Soft fill light from left/front to illuminate shadowed car face
    this.fillLight = new THREE.DirectionalLight(0xaaccff, 0.8);
    this.fillLight.position.set(-10, 20, 5);
    this.fillLight.castShadow = false; // Fill lights don't need shadows
    this.scene.add(this.fillLight);
  }

  setThemeColors(bgColor: number, fogNear: number, fogFar: number, sunColor: number, sunIntensity: number, ambientColor: number): void {
    const col = new THREE.Color(bgColor);
    this.scene.background = col;
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color = col;
      this.scene.fog.near = fogNear;
      this.scene.fog.far = fogFar;
    }
    this.sunLight.color.setHex(sunColor);
    this.sunLight.intensity = sunIntensity;
    this.ambientLight.color.setHex(ambientColor);
  }

  setThemeColorsInterpolated(
    skyColor: THREE.Color,
    fogNear: number,
    fogFar: number,
    sunColor: THREE.Color,
    sunIntensity: number,
    ambientColor: THREE.Color
  ): void {
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(skyColor);
    } else {
      this.scene.background = skyColor.clone();
    }
    if (this.scene.fog instanceof THREE.Fog) {
      this.scene.fog.color.copy(skyColor);
      this.scene.fog.near = fogNear;
      this.scene.fog.far = fogFar;
    }
    this.sunLight.color.copy(sunColor);
    // Clamp sun intensity to a minimum so night biomes still look good
    this.sunLight.intensity = Math.max(sunIntensity, 0.8);
    this.ambientLight.color.copy(ambientColor);

    // Keep hemisphere sky tint in sync with the sky colour (lighter version)
    this.hemiLight.color.copy(skyColor).lerp(new THREE.Color(0xffffff), 0.5);
    this.hemiLight.groundColor.copy(ambientColor).lerp(new THREE.Color(0x222222), 0.3);
  }
}
