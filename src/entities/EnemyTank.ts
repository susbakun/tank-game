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
import ExplosionEffect from "../effects/ExplosionEffect";
import Bullet from "./Bullet";
import ShootEffect from "../effects/ShootEffect";

class EnemyTank extends GameEntity {
  private _life = 100;
  private _rotation: number; // Current tank rotation in radians (0 = right, π/2 = up, π = left, 3π/2 = down)
  private _moveSpeed = 1.5;
  private _shootCooldown = 0;
  private _shootInterval = 2; // Shoot every 2 seconds
  private _detectionRange = 12; // How far the enemy can see the player
  private _rotationSpeed = 2; // How fast the tank rotates (radians per second)
  private _shootAngleThreshold = 0.5; // Maximum angle difference to allow shooting (≈28.6°)

  constructor(position: Vector3) {
    super(position, "enemy");

    // Initialize with random rotation (0 to 2π radians)
    this._rotation = Math.floor(Math.random() * Math.PI * 2);
  }

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

    const tankBodyTexture =
      ResourseManager.instance.getTexture("tank-body-red");
    const tankTurretTexture =
      ResourseManager.instance.getTexture("tank-turret-red");

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

    // Create collision sphere for the tank
    const collider = new Box3()
      .setFromObject(this._mesh)
      .getBoundingSphere(new Sphere(this._mesh.position.clone()));
    collider.radius *= 0.75; // Make collision sphere slightly smaller than visual

    this._collider = collider;
  };

  /**
   * Find the player entity in the game scene
   * @returns Player entity or null if not found
   */
  private findPlayer(): GameEntity | null {
    return (
      GameScene.instance.gameEntities.find(
        (entity) => entity.entity === "player"
      ) || null
    );
  }

  /**
   * Calculate the angle from enemy to player
   * @param player The player entity
   * @returns Angle in radians (0 = right, π/2 = up, π = left, 3π/2 = down)
   */
  private calculateAngleToPlayer(player: GameEntity): number {
    // Create direction vector from enemy to player
    const direction = new Vector3()
      .subVectors(player.mesh.position, this._mesh.position)
      .normalize(); // Make it a unit vector (length = 1)

    // Calculate angle using atan2
    // Note: -direction.y is used because our game coordinate system is flipped
    // In our system: 0° = right, 90° = up, 180° = left, 270° = down
    return Math.atan2(direction.x, -direction.y);
  }

  /**
   * Shoot a bullet in the current direction
   */
  private async shoot() {
    // Calculate bullet spawn position (slightly in front of tank)
    const offset = new Vector3(
      Math.sin(this._rotation) * 0.45, // X offset based on current rotation
      -Math.cos(this._rotation) * 0.45, // Y offset (negative because Y is flipped)
      0.5 // Z offset (height)
    );
    const shootingPosition = this._mesh.position.clone().add(offset);

    // Create bullet and shoot effect
    const bullet = new Bullet(shootingPosition, this._rotation, "enemny");
    await bullet.load();

    const shootEffect = new ShootEffect(shootingPosition, this._rotation);
    await shootEffect.load();

    GameScene.instance.addToScene(bullet);
    GameScene.instance.addToScene(shootEffect);
  }

  public update = async (deltaT: number) => {
    const player = this.findPlayer();

    if (player) {
      // Calculate distance to player
      const distanceToPlayer = this._mesh.position.distanceTo(
        player.mesh.position
      );

      if (distanceToPlayer <= this._detectionRange) {
        // PLAYER DETECTED - Follow and shoot behavior
        const targetAngle = this.calculateAngleToPlayer(player);

        // Calculate angle difference (how much we need to turn)
        const angleDiff = targetAngle - this._rotation;
        const rotationSpeed = this._rotationSpeed * deltaT; // Convert to radians per frame

        // CRITICAL: Normalize angle difference to find shortest rotation path
        // This prevents the tank from taking the long way around when turning
        let normalizedAngleDiff = angleDiff;
        while (normalizedAngleDiff > Math.PI) {
          normalizedAngleDiff -= Math.PI * 2; // Take the shorter path
        }
        while (normalizedAngleDiff < -Math.PI) {
          normalizedAngleDiff += Math.PI * 2; // Take the shorter path
        }

        // Rotate towards target if not already facing it
        if (Math.abs(normalizedAngleDiff) > 0.05) {
          // Small threshold to prevent jittering
          if (normalizedAngleDiff > 0) {
            // Turn left (increase rotation)
            this._rotation += rotationSpeed;
          } else {
            // Turn right (decrease rotation)
            this._rotation -= rotationSpeed;
          }
        }

        // Keep rotation between 0 and 2π radians
        const fullCircle = Math.PI * 2;
        if (this._rotation > fullCircle) {
          this._rotation -= fullCircle;
        } else if (this._rotation < 0) {
          this._rotation += fullCircle;
        }

        // Move towards player if not too close
        if (distanceToPlayer > 2) {
          // Calculate movement vector based on current rotation
          const computedMovement = new Vector3(
            this._moveSpeed * deltaT * Math.sin(this._rotation), // X movement
            -this._moveSpeed * deltaT * Math.cos(this._rotation), // Y movement (negative because Y is flipped)
            0
          );

          // Test collision before moving
          const testingSphere = new Sphere(
            (this._collider as Sphere).clone().center,
            (this._collider as Sphere).clone().radius
          );
          testingSphere.center.add(computedMovement);

          // Check for collisions with other entities
          const colliders = GameScene.instance.gameEntities.filter(
            (c) =>
              c !== this &&
              c.collider &&
              c.collider.intersectsSphere(testingSphere) &&
              c.entity !== "bullet"
          );

          if (colliders.length) {
            // If blocked, turn 90° to find a new path
            this._rotation += Math.PI * 0.5;
          } else {
            // No collision, move forward
            this._mesh.position.add(computedMovement);
            (this._collider as Sphere).center.add(computedMovement);
          }
        }

        // Handle shooting
        this._shootCooldown -= deltaT;
        if (
          this._shootCooldown <= 0 &&
          Math.abs(normalizedAngleDiff) < this._shootAngleThreshold
        ) {
          // Only shoot if we're facing the target (within threshold)
          await this.shoot();
          this._shootCooldown = this._shootInterval;
        }
      } else {
        // PLAYER NOT DETECTED - Roam randomly
        const computedMovement = new Vector3(
          this._moveSpeed * deltaT * Math.sin(this._rotation),
          -this._moveSpeed * deltaT * Math.cos(this._rotation),
          0
        );

        // Test collision before moving
        const testingSphere = new Sphere(
          (this._collider as Sphere).clone().center,
          (this._collider as Sphere).clone().radius
        );
        testingSphere.center.add(computedMovement);

        const colliders = GameScene.instance.gameEntities.filter(
          (c) =>
            c !== this &&
            c.collider &&
            c.collider.intersectsSphere(testingSphere) &&
            c.entity !== "bullet"
        );

        if (colliders.length) {
          // If blocked, pick a random new direction
          this._rotation = Math.floor(Math.random() * Math.PI * 2);
          return;
        }

        // No collision, move forward
        this._mesh.position.add(computedMovement);
        (this._collider as Sphere).center.add(computedMovement);
      }
    }

    // Apply rotation to the visual mesh
    this._mesh.setRotationFromAxisAngle(new Vector3(0, 0, 1), this._rotation);
  };

  /**
   * Take damage from being hit
   * @param amount Damage amount
   */
  public damage = (amount: number) => {
    this._life -= amount;
    if (this._life <= 0) {
      this._shouldDispose = true;
      // Create explosion effect when destroyed
      const explosion = new ExplosionEffect(this._mesh.position, 1);
      explosion.load().then(() => {
        GameScene.instance.addToScene(explosion);
      });
    }
  };

  /**
   * Clean up resources when tank is destroyed
   */
  public dispose = () => {
    this._mesh.children.forEach((c) => {
      (c as Mesh).geometry.dispose();
      ((c as Mesh).material as Material).dispose();
      this._mesh.remove(c);
    });
  };
}

export default EnemyTank;
