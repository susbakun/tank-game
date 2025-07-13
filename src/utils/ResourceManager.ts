import { Texture, TextureLoader } from "three";
import { GLTF, GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

class ResourseManager {
  private static _instance = new ResourseManager();
  public static get instance() {
    return this._instance;
  }

  private constructor() {}

  private _groundTexture: Texture[] = [];
  private _models = new Map<string, GLTF>();
  private _textures = new Map<string, Texture>();

  public getTexture(textureName: string): Texture | undefined {
    return this._textures.get(textureName);
  }

  public getModel(modelName: string): GLTF | undefined {
    return this._models.get(modelName);
  }

  public load = async () => {
    const textureLoader = new TextureLoader();
    await this.loadGroundTexture(textureLoader);
    await this.loadTextures(textureLoader);
    await this.loadModels();
  };

  public loadTextures = async (textureLoader: TextureLoader) => {
    const tankBodyTexture = await textureLoader.loadAsync(
      "textures/tank-body.png"
    );
    const tankTurretTexture = await textureLoader.loadAsync(
      "textures/tank-turret.png"
    );

    this._textures.set("tank-body", tankBodyTexture);
    this._textures.set("tank-turret", tankTurretTexture);

    const tankBodyTextureRed = await textureLoader.loadAsync(
      "textures/tank-body-red.png"
    );
    const tankTurretTextureRed = await textureLoader.loadAsync(
      "textures/tank-turret-red.png"
    );

    this._textures.set("tank-body-red", tankBodyTextureRed);
    this._textures.set("tank-turret-red", tankTurretTextureRed);

    const wallTexture = await textureLoader.loadAsync("textures/wall.png");
    this._textures.set("wall", wallTexture);
  };

  public loadModels = async () => {
    const modelLoader = new GLTFLoader();
    const tankModel = await modelLoader.loadAsync("models/tank.glb");
    this._models.set("tank", tankModel);
  };

  private loadGroundTexture = async (textureLoader: TextureLoader) => {
    const groundTextureFiles = [
      "g1.png",
      "g2.png",
      "g3.png",
      "g4.png",
      "g5.png",
      "g6.png",
      "g7.png",
      "g8.png",
    ];

    for (let i = 0; i < groundTextureFiles.length; i++) {
      const element = groundTextureFiles[i];
      const texture = await textureLoader.loadAsync(`textures/${element}`);
      this._groundTexture.push(texture);
    }
  };

  public getRandomGroundTexture = () => {
    return this._groundTexture[
      Math.floor(Math.random() * this._groundTexture.length)
    ];
  };
}

export default ResourseManager;
