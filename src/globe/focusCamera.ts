import gsap from 'gsap'
import * as THREE from 'three'
import type { PerspectiveCamera } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { GLOBE_RADIUS, NODE_SURFACE_OFFSET } from './geo'
import type { LatLng } from './geo'
import { latLngToVector3 } from './geo'

const _target = new THREE.Vector3()
const _cameraPos = new THREE.Vector3()

/** 默认对准中国大陆中部 */
export const CHINA_GLOBE_CENTER: LatLng = { lat: 35, lng: 103 }
/** 「全部国家」时拉远，便于浏览全球 */
export const WORLD_GLOBE_CENTER: LatLng = { lat: 20, lng: 10 }
export const DEFAULT_GLOBE_DISTANCE = 2.05
export const WORLD_GLOBE_DISTANCE = 2.35

export function getGlobeCameraPosition(
  latLng: LatLng,
  distance = DEFAULT_GLOBE_DISTANCE,
): [number, number, number] {
  const r = GLOBE_RADIUS + NODE_SURFACE_OFFSET
  const [x, y, z] = latLngToVector3(latLng.lat, latLng.lng, r)
  _target.set(x, y, z)
  _cameraPos.copy(_target).normalize().multiplyScalar(distance)
  return [_cameraPos.x, _cameraPos.y, _cameraPos.z]
}

export function applyGlobeView(
  camera: PerspectiveCamera,
  controls: OrbitControlsImpl,
  latLng: LatLng = CHINA_GLOBE_CENTER,
  distance = DEFAULT_GLOBE_DISTANCE,
): void {
  const [x, y, z] = getGlobeCameraPosition(latLng, distance)
  camera.position.set(x, y, z)
  controls.target.set(0, 0, 0)
  controls.update()
}

export function resetGlobeCamera(
  camera: PerspectiveCamera,
  controls: OrbitControlsImpl,
): void {
  const [x, y, z] = getGlobeCameraPosition(CHINA_GLOBE_CENTER)
  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)
  gsap.to(camera.position, {
    x,
    y,
    z,
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: () => controls.update(),
  })
  gsap.to(controls.target, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.6,
    ease: 'power2.out',
    onUpdate: () => controls.update(),
  })
}

export function focusGlobeOnLatLng(
  camera: PerspectiveCamera,
  controls: OrbitControlsImpl,
  latLng: LatLng,
  distance = 2.05,
): void {
  const [x, y, z] = getGlobeCameraPosition(latLng, distance)

  gsap.killTweensOf(camera.position)
  gsap.killTweensOf(controls.target)
  gsap.to(camera.position, {
    x,
    y,
    z,
    duration: 0.75,
    ease: 'power2.inOut',
    onUpdate: () => controls.update(),
  })
  gsap.to(controls.target, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.75,
    ease: 'power2.inOut',
    onUpdate: () => controls.update(),
  })
}
