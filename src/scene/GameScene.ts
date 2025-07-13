import {
  Clock,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import GameEntity from "../entities/GameEntity";
import GameMap from "../map/GameMap";
import ResourseManager from "../utils/ResourceManager";
import PlayerTank from "../entities/PlayerTank";
import Wall from "../map/Wall";
import EnemyTank from "../entities/EnemyTank";
import { FontLoader, TextGeometry } from "three/examples/jsm/Addons.js";

class GameScene {
  private static _instance = new GameScene();
  public static get instance() {
    return this._instance;
  }

  private _width: number;
  private _height: number;
  private _renderer: WebGLRenderer;

  private _camera: PerspectiveCamera;
  public get camera() {
    return this._camera;
  }

  private _gameEntities: GameEntity[] = [];
  public get gameEntities() {
    return this._gameEntities;
  }

  private readonly _scene = new Scene();

  private _clock: Clock = new Clock();

  private _textGeometry: Mesh | null = null;

  private _mapSize = 15;
  public get mapSize() {
    return this._mapSize;
  }

  private _deltaT: number = this._clock.getDelta();
  public get deltaT() {
    return this._deltaT;
  }

  private constructor() {
    this._width = window.innerWidth;
    this._height = window.innerHeight;

    this._renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
    });

    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(this._width, this._height);

    const target = document.querySelector<HTMLDivElement>("#app");
    if (!target) throw new Error("the target not found");

    target.appendChild(this._renderer.domElement);

    const aspectRatio = this._width / this._height;

    this._camera = new PerspectiveCamera(45, aspectRatio, 0.1, 1000);
    this._camera.position.set(7, 7, 14);

    window.addEventListener("resize", this.resize, false);

    const gameMap = new GameMap(new Vector3(0, 0, 0), this._mapSize);
    this._gameEntities.push(gameMap);

    const playerTank = new PlayerTank(new Vector3(7, 7, 0));
    this._gameEntities.push(playerTank);

    const enemyTank = new EnemyTank(new Vector3(3, 3, 0));
    this._gameEntities.push(enemyTank);

    const enemyTank2 = new EnemyTank(new Vector3(10, 10, 0));
    this._gameEntities.push(enemyTank2);

    this.createWalls();
  }

  private createWalls() {
    const edge = this._mapSize - 1;

    this._gameEntities.push(new Wall(new Vector3(0, 0, 0)));
    this._gameEntities.push(new Wall(new Vector3(edge, 0, 0)));
    this._gameEntities.push(new Wall(new Vector3(edge, edge, 0)));
    this._gameEntities.push(new Wall(new Vector3(0, edge, 0)));

    for (let i = 0; i < edge; i++) {
      this._gameEntities.push(new Wall(new Vector3(i, 0, 0)));
      this._gameEntities.push(new Wall(new Vector3(edge, i, 0)));
      this._gameEntities.push(new Wall(new Vector3(i, edge, 0)));
      this._gameEntities.push(new Wall(new Vector3(0, i, 0)));
    }
  }

  private resize = () => {
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._renderer.setSize(this._width, this._height);
    this._camera.aspect = this._width / this._height;
    this._camera.updateProjectionMatrix();
  };

  public render = () => {
    requestAnimationFrame(this.render);

    this.disposeEntities();

    this._deltaT = this._clock.getDelta();
    for (let i = 0; i < this._gameEntities.length; i++) {
      const element = this._gameEntities[i];
      element.update(this._deltaT);
    }

    if (this._textGeometry) {
      this._scene.add(this._textGeometry);
    }

    this._renderer.render(this._scene, this._camera);
  };

  public load = async () => {
    await ResourseManager.instance.load();

    for (let i = 0; i < this._gameEntities.length; i++) {
      const element = this._gameEntities[i];
      await element.load();
      this._scene.add(element.mesh);
    }

    const light = new HemisphereLight(0xffffbb, 0x080820, 1);
    this._scene.add(light);
  };

  public loadText = () => {
    const loader = new FontLoader();

    loader.load("font.json", (font) => {
      var geometry = new TextGeometry("You loosed", {
        font: font,
        size: 80,
        depth: 5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 10,
        bevelSize: 8,
        bevelOffset: 0,
        bevelSegments: 5,
      });

      const material = new MeshLambertMaterial({
        color: 0xff4500,
      });

      const mesh = new Mesh(geometry, material);
      mesh.position.set(this.camera.position.x - 2, this._camera.position.y, 5);
      mesh.scale.multiplyScalar(0.01);
      mesh.castShadow = true;

      this._textGeometry = mesh.clone();
    });
  };

  public addToScene = (entity: GameEntity) => {
    this._gameEntities.push(entity);
    this._scene.add(entity.mesh);
  };

  public disposeEntities = () => {
    const entitiesToBeDisposed = this._gameEntities.filter(
      (e) => e.shouldDispose
    );

    entitiesToBeDisposed.forEach((e) => {
      this._scene.remove(e.mesh);
      e.dispose();
    });

    this._gameEntities = [
      ...this._gameEntities.filter((e) => !e.shouldDispose),
    ];
  };
}

export default GameScene;
