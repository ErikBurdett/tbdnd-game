import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    const unitTexture = this.make.graphics({ x: 0, y: 0 }, false);
    unitTexture.fillStyle(0xffffff, 1);
    unitTexture.fillRect(5, 2, 6, 4);
    unitTexture.fillRect(4, 6, 8, 7);
    unitTexture.fillRect(2, 8, 2, 5);
    unitTexture.fillRect(12, 8, 2, 5);
    unitTexture.fillRect(5, 13, 2, 3);
    unitTexture.fillRect(9, 13, 2, 3);
    unitTexture.generateTexture("unit-pixel", 16, 16);
    unitTexture.destroy();

    const officerTexture = this.make.graphics({ x: 0, y: 0 }, false);
    officerTexture.fillStyle(0xffffff, 1);
    officerTexture.fillRect(6, 1, 8, 5);
    officerTexture.fillTriangle(2, 6, 18, 6, 10, 18);
    officerTexture.generateTexture("officer-pixel", 20, 20);
    officerTexture.destroy();

    this.scene.start("StrategicMap");
  }
}
