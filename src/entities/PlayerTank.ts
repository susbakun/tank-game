import {
  Box3,
  Material,
  Mesh,
  MeshStandardMaterial,
  Sphere,
  Vector3,
} from "three";
import GameEntity from "./GameEntity";
import ResourseManager from "../utils/ResourceManager";
import GameScene from "../scene/GameScene";
import Bullet from "./Bullet";
import ShootEffect from "../effects/ShootEffect";
import ExplosionEffect from "../effects/ExplosionEffect";

type KeyboardState = {
  leftPressed: boolean;
  rightPressed: boolean;
  upPressed: boolean;
  downPressed: boolean;
};

class PlayerTank extends GameEntity {
  private _rotation = 0;
  private _life = 100;
  private _shootCooldown = 0;
  private _shootInterval = 2;

  private _keyboardState: KeyboardState = {
    leftPressed: false,
    rightPressed: false,
    upPressed: false,
    downPressed: false,
  };

  constructor(position: Vector3) {
    super(position, "player");
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        this._keyboardState.upPressed = true;
        break;
      case "ArrowDown":
        this._keyboardState.downPressed = true;
        break;
      case "ArrowLeft":
        this._keyboardState.leftPressed = true;
        break;
      case "ArrowRight":
        this._keyboardState.rightPressed = true;
        break;
      default:
        break;
    }
  };

  private handleKeyUp = async (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        this._keyboardState.upPressed = false;
        break;
      case "ArrowDown":
        this._keyboardState.downPressed = false;
        break;
      case "ArrowLeft":
        this._keyboardState.leftPressed = false;
        break;
      case "ArrowRight":
        this._keyboardState.rightPressed = false;
        break;
      case " ":
        if (this._shootCooldown <= 0) {
          await this.shoot();
          this._shootCooldown = this._shootInterval;
        }
        break;

      default:
        break;
    }
  };

  public load = async () => {
    const tankModel = ResourseManager.instance.getModel("tank");
    if (!tankModel) throw "unable to get tank model";

    const tankSceneData = tankModel.scene.clone();

    if (!tankModel) throw "unable to load the model";

    const tankBodyMesh = tankSceneData.children.find(
      (m) => m.name === "Body"
    ) as Mesh;
    const tankTurretMesh = tankSceneData.children.find(
      (m) => m.name === "Turret"
    ) as Mesh;

    const tankBodyTexture = ResourseManager.instance.getTexture("tank-body");
    const tankTurretTexture =
      ResourseManager.instance.getTexture("tank-turret");

    if (
      !tankBodyMesh ||
      !tankTurretMesh ||
      !tankBodyTexture ||
      !tankTurretTexture
    )
      throw "unable to load user model and texture";

    const tankBodyMaterial = new MeshStandardMaterial({
      map: tankBodyTexture,
    });
    const tankTurretMaterial = new MeshStandardMaterial({
      map: tankTurretTexture,
    });

    tankBodyMesh.material = tankBodyMaterial;
    tankTurretMesh.material = tankTurretMaterial;

    this._mesh.add(tankBodyMesh);
    this._mesh.add(tankTurretMesh);

    const collider = new Box3()
      .setFromObject(this._mesh)
      .getBoundingSphere(new Sphere(this._mesh.position.clone()));
    collider.radius *= 0.75;

    this._collider = collider;
  };

  private shoot = async () => {
    const offset = new Vector3(
      Math.sin(this._rotation) * 0.45,
      -Math.cos(this._rotation) * 0.45,
      0.5
    );
    const shootingPosition = this._mesh.position.clone().add(offset);
    const bullet = new Bullet(shootingPosition, this._rotation);
    await bullet.load();

    const shootEffect = new ShootEffect(shootingPosition, this._rotation);
    await shootEffect.load();

    GameScene.instance.addToScene(bullet);
    GameScene.instance.addToScene(shootEffect);
  };

  public damage = () => {
    this._life -= 20;
    if (this._life <= 0) {
      this._shouldDispose = true;
      const explosion = new ExplosionEffect(this._mesh.position, 1);
      explosion.load().then(() => {
        GameScene.instance.addToScene(explosion);
      });
    }
  };

  public update = (deltaT: number) => {
    let computedMovement = new Vector3(0, 0, 0);
    let computedRotation = this._rotation;

    if (this._keyboardState.leftPressed) {
      computedRotation += Math.PI * deltaT;
    } else if (this._keyboardState.rightPressed) {
      computedRotation -= Math.PI * deltaT;
    }

    const fullCircle = Math.PI * 2;
    if (computedRotation > fullCircle) {
      computedRotation -= fullCircle;
    } else if (computedRotation < 0) {
      computedRotation += fullCircle;
    }

    const moveSpeed = 2.5;
    const yMovement = moveSpeed * deltaT * Math.cos(computedRotation);
    const xMovement = moveSpeed * deltaT * Math.sin(computedRotation);

    if (this._keyboardState.upPressed) {
      computedMovement = new Vector3(xMovement, -yMovement, 0);
    } else if (this._keyboardState.downPressed) {
      computedMovement = new Vector3(-xMovement, yMovement, 0);
    }

    const testingSphere = this._collider?.clone() as Sphere;
    testingSphere.center.add(computedMovement);

    const colliders = GameScene.instance.gameEntities.filter(
      (e) =>
        e !== this &&
        e.entity !== "bullet" &&
        e.collider &&
        e.collider.intersectsSphere(testingSphere)
    );

    if (colliders.length) return;

    this._mesh.setRotationFromAxisAngle(new Vector3(0, 0, 1), computedRotation);
    this._rotation = computedRotation;
    this._mesh.position.add(computedMovement);
    (this._collider as Sphere).center.add(computedMovement);

    GameScene.instance.camera.position.set(
      this._mesh.position.x,
      this._mesh.position.y,
      GameScene.instance.camera.position.z
    );

    this._shootCooldown -= GameScene.instance.deltaT;
  };

  public dispose = () => {
    this._mesh.geometry.dispose();
    (this._mesh.material as Material).dispose();
    GameScene.instance.loadText();
  };
}

export default PlayerTank;
