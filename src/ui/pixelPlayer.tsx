import { tr } from '../i18n'
import type { Look } from '../engine/types'
import { useFrame } from './frame'
import { type Kit, kitSpec, type Pose } from './pose'
import { DEFAULT_LOOK, type DrawnPose, H, spriteURL, W } from './sprite'

// v2 에 없는 포즈는 가장 가까운 포즈로 그린다
const DRAWN: Record<Pose, DrawnPose> = {
  idle: 'idle',
  shoot: 'shoot',
  cheer: 'cheer',
  sad: 'sad',
  celebrate: 'cheer',
  injured: 'sad',
  salute: 'cheer',
  wave: 'wave',
  guard: 'guard',
  trophy: 'trophy',
}

export function PixelPlayer({
  pose,
  kit,
  look = DEFAULT_LOOK,
  scale = 3,
}: {
  pose: Pose
  kit: Kit
  look?: Look
  scale?: number
}) {
  const frame = useFrame()
  return (
    <img
      className="px"
      src={spriteURL(kitSpec(look, kit), DRAWN[pose], frame)}
      width={W * scale}
      height={H * scale}
      alt={tr('선수 캐릭터')}
    />
  )
}
