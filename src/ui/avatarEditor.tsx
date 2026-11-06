import type { Dispatch, SetStateAction } from 'react'
import { clamp } from '../engine/rng'
import type {
  Accessory,
  Brows,
  Ears,
  Eyes,
  HairStyle,
  Look,
  Mouth,
} from '../engine/types'
import { tr } from '../i18n'
import { PixelPlayer } from './pixelPlayer'
import { type Kit, kitSpec, type Pose } from './pose'
import { faceParts, H, ROSTER, spriteURL, W } from './sprite'

// 상점에서 사야 입을 수 있는 치장. 생성 단계에선 잠가 두고 보여만 준다
const SHOP: Accessory[] = [
  'cap',
  'earbuds',
  'shades',
  'undershirt',
  'tights',
  'headphones',
  'goldShoes',
  'chain',
]
const SKINS = ['아이보리', '살구', '베이지', '구릿빛', '브라운', '딥 브라운']
const HAIRS: [HairStyle, string][] = [
  ['crew', '크루컷'],
  ['flatTop', '플랫탑'],
  ['spiky', '스파이키'],
  ['bangs', '앞머리'],
  ['slick', '포마드'],
  ['buzz', '버즈컷'],
  ['curtains', '가르마'],
  ['afro', '아프로'],
  ['messy', '바람머리'],
]
const HAIR_COLORS: [string, string][] = [
  ['#2a2324', '흑발'],
  ['#1e2238', '블루블랙'],
  ['#3a2a20', '다크브라운'],
  ['#6b4428', '브라운'],
  ['#a8743a', '카멜'],
  ['#a0552e', '적갈색'],
  ['#e0b04a', '금발'],
  ['#b9bfcc', '애쉬 실버'],
]
const EYES: [Eyes, string][] = [
  ['calm', '기본'],
  ['sharp', '날카로운'],
  ['round', '동그란'],
  ['sleepy', '졸린'],
  ['happy', '웃는'],
  ['wink', '윙크'],
]
const BROWS: [Brows, string][] = [
  ['flat', '일자'],
  ['angry', '치켜뜬'],
  ['raised', '올라간'],
  ['soft', '처진'],
  ['thick', '굵은'],
]
const EARS: [Ears, string][] = [
  ['normal', '기본'],
  ['small', '작은'],
  ['big', '큰'],
  ['pointy', '뾰족한'],
]
const MOUTHS: [Mouth, string][] = [
  ['flat', '기본'],
  ['smile', '미소'],
  ['open', '활짝'],
  ['tight', '앙다문'],
  ['smirk', '씩'],
]
const BANDS: [string, string][] = [
  ['#f4f0e6', '화이트'],
  ['#f2c14e', '골드'],
  ['#d8433a', '레드'],
  ['#5a3fa0', '퍼플'],
  ['#1e1a1a', '블랙'],
]
const TABS = [
  ['preset', '프리셋'],
  ['skin', '피부'],
  ['hair', '헤어'],
  ['eyes', '눈'],
  ['ears', '귀'],
  ['mouth', '입'],
  ['acc', '장식'],
] as const
type Tab = (typeof TABS)[number][0]
const POSE_STRIP: [Pose, string][] = [
  ['idle', '드리블'],
  ['shoot', '슛'],
  ['cheer', '환호'],
  ['sad', '패배'],
]

interface Avatar {
  look: Look
  // 마지막으로 고른 프리셋(ROSTER 인덱스). modified 면 거기서 부위를 손본 상태
  base: number
  modified: boolean
}
export interface AvatarState extends Avatar {
  tab: Tab
  history: Avatar[]
}

// 썸네일은 스프라이트 격자의 20×20 칸을 잘라 보인다 (왼쪽 위 [x, y])
const CROPS = { head: [5, 2], torso: [5, 18], legs: [5, 34] } as const
type Crop = keyof typeof CROPS

function Thumb({
  look,
  kit,
  crop = 'head',
  scale = 3,
}: {
  look: Look
  kit: Kit
  crop?: Crop
  scale?: number
}) {
  const [x, y] = CROPS[crop]
  return (
    <span
      className="av-thumb"
      style={{ width: 20 * scale, height: 20 * scale }}
    >
      <img
        className="px"
        src={spriteURL(kitSpec(look, kit), 'guard', 0)}
        width={W * scale}
        height={H * scale}
        alt=""
        style={{ margin: `${-y * scale}px 0 0 ${-x * scale}px` }}
      />
    </span>
  )
}

interface Tile {
  label: string
  on: boolean
  look: Look
  pick: () => void
  crop?: Crop
  locked?: boolean
}
interface Swatch {
  label: string
  hex: string
  on: boolean
  pick: () => void
}
interface Group {
  title: string
  hint?: string
  tiles?: Tile[]
  swatches?: Swatch[]
}

const pickOne = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)]

export function AvatarEditor({
  av,
  setAv,
  kit,
}: {
  av: AvatarState
  setAv: Dispatch<SetStateAction<AvatarState>>
  kit: Kit
}) {
  const L = av.look
  const cur = { ...faceParts(L), hairStyle: L.hairStyle }
  const commit = (look: Look, preset?: number) =>
    setAv((a) => ({
      ...a,
      look,
      base: preset ?? a.base,
      modified: preset === undefined,
      history: [
        ...a.history,
        { look: a.look, base: a.base, modified: a.modified },
      ].slice(-40),
    }))
  const undo = () =>
    setAv((a) => {
      const prev = a.history.at(-1)
      return prev ? { ...a, ...prev, history: a.history.slice(0, -1) } : a
    })
  const randomize = () => {
    const free = (ids: Accessory[]) => ids.filter((id) => !SHOP.includes(id))
    const acc: Accessory[] = []
    const one = (ids: Accessory[], p: number) => {
      const pool = free(ids)
      if (pool.length && Math.random() < p) acc.push(pickOne(pool))
    }
    one(['headband', 'cap', 'headphones'], 0.4)
    one(['glasses', 'shades'], 0.2)
    one(['earring', 'earbuds'], 0.25)
    for (const id of free(['wrist', 'sleeve', 'knee', 'bandaid']))
      if (Math.random() < 0.22) acc.push(id)
    commit({
      ...L,
      skin: Math.floor(Math.random() * SKINS.length),
      hair: pickOne(HAIR_COLORS)[0],
      hairStyle: pickOne(HAIRS)[0],
      eyes: pickOne(EYES)[0],
      brows: pickOne(BROWS)[0],
      ears: pickOne(EARS)[0],
      mouth: pickOne(MOUTHS)[0],
      accent: pickOne(BANDS)[0],
      acc,
    })
  }

  const set = <K extends keyof Look>(k: K, v: Look[K]) => ({
    look: { ...L, [k]: v },
    pick: () => commit({ ...L, [k]: v }),
  })
  const part = <K extends 'hairStyle' | 'eyes' | 'brows' | 'ears' | 'mouth'>(
    k: K,
    list: [NonNullable<Look[K]>, string][],
  ): Tile[] =>
    list.map(([id, label]) => ({ label, on: cur[k] === id, ...set(k, id) }))
  // 한 자리에 하나만: 없음 + 후보 중 하나
  const exclusive = (items: [Accessory, string][]): Tile[] => {
    const ids = items.map((i) => i[0])
    const rest = L.acc.filter((a) => !ids.includes(a))
    const none: Tile = {
      label: '없음',
      on: !ids.some((a) => L.acc.includes(a)),
      look: { ...L, acc: rest },
      pick: () => commit({ ...L, acc: rest }),
    }
    return [
      none,
      ...items.map(([id, label]) => ({
        label,
        on: L.acc.includes(id),
        locked: SHOP.includes(id),
        look: { ...L, acc: [...rest, id] },
        pick: () => commit({ ...L, acc: [...rest, id] }),
      })),
    ]
  }
  // 여러 개 착용: 누를 때마다 넣고 뺀다. 썸네일은 착용한 모습
  const toggles = (items: [Accessory, string, Crop][]): Tile[] =>
    items.map(([id, label, crop]) => {
      const worn = L.acc.includes(id)
      const on = worn ? L.acc : [...L.acc, id]
      return {
        label,
        on: worn,
        crop,
        locked: SHOP.includes(id),
        look: { ...L, acc: on },
        pick: () =>
          commit({ ...L, acc: worn ? L.acc.filter((a) => a !== id) : on }),
      }
    })
  const swatch = (
    k: 'hair' | 'accent',
    list: [string, string][],
    dflt?: string,
  ): Swatch[] =>
    list.map(([hex, label]) => ({
      label,
      hex,
      on: (L[k] ?? dflt) === hex,
      pick: set(k, hex).pick,
    }))
  const shopHint = '상점 아이템은 구매 후 착용'

  const BUILD: Record<Tab, () => Group[]> = {
    preset: () => [
      {
        title: '기본 캐릭터',
        hint: '고른 뒤 부위별로 다듬을 수 있어요',
        tiles: ROSTER.map((r, i) => ({
          label: r.name,
          on: av.base === i && !av.modified,
          look: r.look,
          pick: () => commit(r.look, i),
        })),
      },
    ],
    skin: () => [
      {
        title: '피부색',
        tiles: SKINS.map((label, i) => ({
          label,
          on: L.skin === i,
          ...set('skin', i),
        })),
      },
    ],
    hair: () => [
      { title: '헤어스타일', tiles: part('hairStyle', HAIRS) },
      {
        title: '머리색',
        hint: '눈썹 색도 함께 바뀌어요',
        swatches: swatch('hair', HAIR_COLORS),
      },
    ],
    eyes: () => [
      { title: '눈 모양', tiles: part('eyes', EYES) },
      { title: '눈썹', tiles: part('brows', BROWS) },
    ],
    ears: () => [
      { title: '귀 모양', tiles: part('ears', EARS) },
      {
        title: '귀 장식',
        hint: shopHint,
        tiles: exclusive([
          ['earring', '피어싱'],
          ['earbuds', '무선 이어폰'],
        ]),
      },
    ],
    mouth: () => [
      {
        title: '입 모양',
        hint: '환호 · 패배 포즈에선 표정이 바뀌어요',
        tiles: part('mouth', MOUTHS),
      },
    ],
    acc: () => [
      {
        title: '머리',
        hint: shopHint,
        tiles: exclusive([
          ['headband', '헤드밴드'],
          ['cap', '스냅백'],
          ['headphones', '헤드폰'],
        ]),
      },
      {
        title: '안경',
        tiles: exclusive([
          ['glasses', '안경'],
          ['shades', '선글라스'],
        ]),
      },
      {
        title: '몸 · 팔다리',
        hint: '여러 개 착용 가능',
        tiles: toggles([
          ['wrist', '손목밴드', 'torso'],
          ['sleeve', '암슬리브', 'torso'],
          ['knee', '무릎 보호대', 'legs'],
          ['bandaid', '반창고', 'head'],
          ['undershirt', '컴프레션 상의', 'torso'],
          ['tights', '컴프레션 하의', 'legs'],
          ['chain', '금목걸이', 'torso'],
          ['goldShoes', '시그니처 농구화', 'legs'],
        ]),
      },
      {
        title: '밴드 색상',
        hint: '헤드밴드 · 손목밴드에 적용',
        swatches: swatch('accent', BANDS, '#f4f0e6'),
      },
    ],
  }

  return (
    <>
      <section className="panel panel-sunk pick">
        <div className="pick-head">
          <span className="tag gold">P1 SELECT</span>
          <h2 className="av-name">
            <span>{tr(ROSTER[av.base].name)}</span>
            {av.modified && <small>{tr('커스텀')}</small>}
            <label className="num-field">
              #
              <input
                type="number"
                min={0}
                max={99}
                value={L.num}
                aria-label={tr('등번호')}
                onChange={(e) => {
                  const n = clamp(Math.round(+e.target.value) || 0, 0, 99)
                  // "07"처럼 숫자로는 같은 값이면 React 가 화면을 고치지 않아 앞자리 0이 남는다
                  e.target.value = String(n)
                  setAv((a) => ({ ...a, look: { ...a.look, num: n } }))
                }}
              />
            </label>
          </h2>
        </div>

        <div className="av-stage">
          <div className="av-court">
            <PixelPlayer pose="idle" kit={kit} look={L} scale={4} />
          </div>
          <div className="av-side">
            <figure className="av-face">
              <Thumb look={L} kit={kit} scale={6} />
              <figcaption>{tr('얼굴 확대')}</figcaption>
            </figure>
            <div className="av-actions">
              <button className="ghost" onClick={randomize}>
                {tr('랜덤')}
              </button>
              <button
                className="ghost"
                onClick={undo}
                disabled={!av.history.length}
              >
                {tr('되돌리기')}
              </button>
            </div>
          </div>
        </div>

        <div className="pose-strip">
          {POSE_STRIP.map(([pose, label]) => (
            <figure key={pose}>
              <PixelPlayer pose={pose} kit={kit} look={L} scale={2} />
              <figcaption>{tr(label)}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="panel av-editor">
        <div className="tabs" role="tablist" aria-label={tr('꾸미기 부위')}>
          {TABS.map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={av.tab === id}
              onClick={() => setAv((a) => ({ ...a, tab: id }))}
            >
              {tr(label)}
            </button>
          ))}
        </div>
        {BUILD[av.tab]().map((g) => (
          <div key={g.title} className="av-group">
            <div className="av-group-head">
              <h3>{tr(g.title)}</h3>
              {g.hint && <small className="muted">{tr(g.hint)}</small>}
            </div>
            {g.tiles && (
              <div className="av-tiles">
                {g.tiles.map((t) => (
                  <button
                    key={t.label}
                    className="roster-card"
                    aria-pressed={t.on}
                    disabled={t.locked}
                    title={
                      t.locked
                        ? tr('상점에서 구매 후 착용할 수 있어요')
                        : undefined
                    }
                    onClick={t.pick}
                  >
                    {t.locked && <span className="tag">{tr('상점')}</span>}
                    <Thumb look={t.look} kit={kit} crop={t.crop} />
                    <b>{tr(t.label)}</b>
                  </button>
                ))}
              </div>
            )}
            {g.swatches && (
              <div className="chips">
                {g.swatches.map((c) => (
                  <button
                    key={c.hex}
                    className={c.on ? 'chip on av-chip' : 'chip av-chip'}
                    aria-pressed={c.on}
                    onClick={c.pick}
                  >
                    <span className="av-swatch" style={{ background: c.hex }} />
                    {tr(c.label)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </>
  )
}
