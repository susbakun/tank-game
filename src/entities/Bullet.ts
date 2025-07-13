import {
  Box3,
  Material,
  Mesh,
  MeshPhongMaterial,
  Sphere,
  SphereGeometry,
  Vector3,
} from "three";
import GameEntity from "./GameEntity";
import GameScene from "../scene/GameScene";
import ExplosionEffect from "../effects/ExplosionEffect";
import EnemyTank from "./EnemyTank";
import PlayerTank from "./PlayerTank";

type Shooter = "player" | "enemny";

class Bullet extends GameEntity {
  private _angle: number;
  private _shooter: Shooter;

  constructor(position: Vector3, angle: number, shooter: Shooter = "player") {
    super(position, "bullet");
    this._angle = angle;
    this._shooter = shooter;
  }

  public load = async () => {
    const geometry = new SphereGeometry(0.085);
    const material = new MeshPhongMaterial({ color: 0x262626 });
    this._mesh = new Mesh(geometry, material);
    this._mesh.position.set(
      this._position.x,
      this._position.y,
      this._position.z
    );

    this._collider = new Box3()
      .setFromObject(this._mesh)
      .getBoundingSphere(new Sphere(this._mesh.position));
  };

  public update = (deltaT: number) => {
    const travelSpeed = 9;
    const computedMovement = new Vector3(
      deltaT * travelSpeed * Math.sin(this._angle),
      -deltaT * travelSpeed * Math.cos(this._angle),
      0
    );

    this._mesh.position.add(computedMovement);

    const colliders = GameScene.instance.gameEntities.filter(
      (e) =>
        e.collider &&
        ((this._shooter === "player" && e.entity !== "player") ||
          (this._shooter === "enemny" && e.entity !== "enemy")) &&
        e !== this &&
        e.collider.intersectsSphere(this._collider as Sphere)
    );

    if (colliders.length) {
      this._shouldDispose = true;

      const explosion = new ExplosionEffect(this._mesh.position, 1);
      explosion.load().then(() => {
        GameScene.instance.addToScene(explosion);
      });

      const enemies = colliders.filter((c) => c.entity === "enemy");
      if (enemies.length) {
        (enemies[0] as EnemyTank).damage(20);
      }

      const player = colliders.filter((c) => c.entity === "player");
      if (player.length) {
        (player[0] as PlayerTank).damage();
      }
    }
  };

  public dispose = () => {
    this._mesh.geometry.dispose();
    (this._mesh.material as Material).dispose();
  };
}

export default Bullet;
