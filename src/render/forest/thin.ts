import { Matrix, Mesh, Quaternion } from "@babylonjs/core";

/** Park a thin-instance mesh at identity and draw every matrix from the buffer. */
export function placeThin(mesh: Mesh, matrices: readonly Matrix[]): void {
  mesh.position.set(0, 0, 0);
  mesh.rotation.set(0, 0, 0);
  mesh.rotationQuaternion = new Quaternion(0, 0, 0, 1);
  mesh.scaling.set(1, 1, 1);
  mesh.computeWorldMatrix(true);
  mesh.isPickable = false;
  mesh.alwaysSelectAsActiveMesh = false;
  if (!matrices.length) {
    mesh.setEnabled(false);
    mesh.thinInstanceCount = 0;
    return;
  }
  mesh.setEnabled(true);
  const buffer = new Float32Array(matrices.length * 16);
  matrices.forEach((matrix, index) => matrix.copyToArray(buffer, index * 16));
  mesh.thinInstanceSetBuffer("matrix", buffer, 16, true);
  mesh.thinInstanceRefreshBoundingInfo(false);
}
