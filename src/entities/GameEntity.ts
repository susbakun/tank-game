import { Box3, Mesh, Sphere, Vector3 } from "three";

type EntityType = "general" | "player" | "bullet" | "enemy";

abstract class GameEntity {
  protected _position: Vector3;
  protected _mesh: Mesh = new Mesh();
  public get mesh() {
    return this._mesh;
  }

  public set mesh(mesh: Mesh) {
    this._mesh = mesh.clone();
  }

  constructor(position: Vector3, entity: EntityType = "general") {
    this._position = position;
    this._mesh.position.set(
      this._position.x,
      this._position.y,
      this._position.z
    );

    this._entity = entity;
  }

  protected _shouldDispose = false;
  public get shouldDispose() {
    return this._shouldDispose;
  }

  protected _collider?: Box3 | Sphere;
  public get collider() {
    return this._collider;
  }

  protected _entity: EntityType;
  public get entity() {
    return this._entity;
  }

  public load = async () => {};
  public update = (_deltaT: number) => {};
  public dispose = () => {};
}

export default GameEntity;
