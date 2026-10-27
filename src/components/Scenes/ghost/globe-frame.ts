// The FrameInfo a globe scene publishes each frame: the needle at the centre
// of the view, the camera's distance, and a projection for labels and chip.

import { Vector3, type PerspectiveCamera } from "three";
import type { LatLon } from "@/lib/data";
import { latLonToSphere } from "@/lib/sphere";
import type { FrameInfo } from "../../Turntable/use-turntable";

const world = new Vector3();
const toCamera = new Vector3();

export function globeFrame(camera: PerspectiveCamera, width: number, height: number, needle: LatLon): FrameInfo {
  const project = (lat: number, lon: number) => {
    const p = latLonToSphere(lat, lon);
    world.set(p.x, p.y, p.z);
    const facing = world.dot(toCamera.copy(camera.position).sub(world).normalize());
    const ndc = world.clone().project(camera);
    return { x: ((ndc.x + 1) / 2) * width, y: ((1 - ndc.y) / 2) * height, facing };
  };
  return {
    width,
    height,
    needle: project(needle.lat, needle.lon),
    blend: 1,
    distance: camera.position.length(),
    viewLat: needle.lat,
    viewLon: needle.lon,
    project,
  };
}
