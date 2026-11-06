import { Fragment, useEffect, useRef, useState } from 'react'
import { HIGH_SCHOOLS } from '../data/schools'
import { newGame } from '../engine/game'
import {
  ATTR_KEYS,
  ATTR_LABELS,
  ATTR_MAX,
  ATTR_MIN,
  createPlayer,
  growthPerOvr,
  heightRange,
  idealWeight,
  overall,
  POSITION_LABELS,
  START_TOTAL,
  STYLES,
  WEIGHT_RANGE,
  WEIGHTS,
  weightSpeedMod,
} from '../engine/player'
import { clamp, Rng } from '../engine/rng'
import type { AttrKey, Attributes, GameState, Position } from '../engine/types'
import { T, tr } from '../i18n'
import { AvatarEditor, type AvatarState } from './avatarEditor'
import { PixelPlayer } from './pixelPlayer'
import { teamKit } from './pose'
import { Radar } from './radar'
import { ROSTER } from './sprite'
import { TeamLogo } from './teamLogo'

const POSITIONS = Object.keys(POSITION_LABELS) as Position[]
const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0]
const STEPS = ['아바타', '기본 정보', '스카우팅 리포트', '집중 능력치']
// 스카우팅 레이더는 스피드를 뺀 6축 (스피드는 체격 보정이 섞여 따로 본다)
const HEX: AttrKey[] = ATTR_KEYS.filter((k) => k !== 'speed')
const REGIONS = ['전체', ...new Set(HIGH_SCHOOLS.map((h) => h.region))]
const regionLabel = (r: string) => tr(r === '경기' ? '경기도' : r)
const label = (k: AttrKey) => tr(ATTR_LABELS[k])
const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '±0')
// 포지션의 핵심 능력치 두 개 (오버롤 비중 순)
const core = (p: Position) =>
  [...ATTR_KEYS].sort((a, b) => WEIGHTS[p][b] - WEIGHTS[p][a]).slice(0, 2)

// "A · B · C" 한 줄: 항목 안에서는 끊지 않고 구분점 뒤에서만 줄을 바꾼다 (일본어는 아무 데서나 끊긴다)
function Parts({ items }: { items: string[] }) {
  return items.map((t, i) => (
    <Fragment key={i}>
      <span className="cs-part">
        {t}
        {i < items.length - 1 && ' ·'}
      </span>{' '}
    </Fragment>
  ))
}

export function CreateScreen({
  onStart,
  onBack,
}: {
  onStart: (s: GameState) => void
  onBack: () => void
}) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [position, setPosition] = useState<Position>('PG')
  const [style, setStyle] = useState(STYLES.PG[0].name)
  const [school, setSchool] = useState(HIGH_SCHOOLS[0].id)
  const [region, setRegion] = useState('전체')
  const [seed, setSeed] = useState(randomSeed)
  const [av, setAv] = useState<AvatarState>({
    look: ROSTER[0].look,
    base: 0,
    modified: false,
    tab: 'preset',
    history: [],
  })
  const [focus, setFocus] = useState<AttrKey | undefined>()
  // 스카우팅 리포트에서 손본 값. null 이면 뽑힌 값을 그대로 쓴다
  const [custom, setCustom] = useState<Attributes | null>(null)
  const [height, setHeight] = useState<number | null>(null)
  const [weight, setWeight] = useState<number | null>(null)
  // 레이더에서 강조할 축 (능력치 줄·집중 카드에 마우스를 올렸을 때)
  const [hover, setHover] = useState<AttrKey | null>(null)
  // 단계를 넘기면 앱 박스(.screen) 맨 위부터 보여 준다 (App 의 화면 전환과 같은 규칙)
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    mainRef.current?.closest('.screen')?.scrollTo(0, 0)
  }, [step])

  const rng = new Rng(seed)
  const look = av.look
  const kit = teamKit(school)
  const base = createPlayer(
    rng,
    name.trim() || tr('이름 없음'),
    position,
    style,
  )
  const pool = custom ?? base.attrs
  const h = height ?? base.height
  const wt = weight ?? base.weight
  const mod = weightSpeedMod(h, wt)
  const withMod = (a: Attributes) => ({
    ...a,
    speed: clamp(a.speed + mod, 20, 99),
  })
  const player = { ...base, height: h, weight: wt, attrs: withMod(pool), look }
  const left = START_TOTAL - ATTR_KEYS.reduce((s, k) => s + pool[k], 0)
  const [hMin, hMax] = heightRange(position)
  const ovr = overall(player)
  const ranked = [...ATTR_KEYS].sort(
    (a, b) => player.attrs[b] - player.attrs[a],
  )
  const hs = HIGH_SCHOOLS.find((s) => s.id === school)!
  const posParts = [tr(POSITION_LABELS[position]), tr(style)]

  const choosePosition = (p: Position) => {
    setPosition(p)
    setStyle(STYLES[p][0].name)
    setCustom(null)
    setHeight(null)
    setWeight(null)
  }
  const chooseStyle = (s: string) => {
    setStyle(s)
    setCustom(null)
  }
  const reroll = () => {
    setSeed(randomSeed())
    setCustom(null)
    setHeight(null)
    setWeight(null)
  }

  // 집중 능력치: OVR 1 성장당 능력치별 몫. 성장량(잠재력)은 드러내지 않는다
  const split = growthPerOvr(position, focus)
  const even = growthPerOvr(position)
  const splitMax =
    Math.max(...ATTR_KEYS.map((k) => growthPerOvr(position, k)[k])) * 1.05
  const fmtSplit = (v: number) => `+${v.toFixed(1)}`

  const last = step === STEPS.length - 1
  const canNext = step !== 1 || !!name.trim()

  return (
    <main ref={mainRef} className="create">
      <header>
        <p className="eyebrow">
          {step + 1} / {STEPS.length}
        </p>
        <h1>{tr(STEPS[step])}</h1>
      </header>

      {step === 0 && <AvatarEditor av={av} setAv={setAv} kit={kit} />}

      {step === 1 && (
        <>
          <section className="panel panel-sunk">
            <div className="cs-card">
              <div className="cs-court">
                <PixelPlayer pose="idle" kit={kit} look={look} scale={3} />
              </div>
              <div className="cs-id">
                <p className="eyebrow">
                  {tr('내 선수')} · #{look.num}
                </p>
                <h2 className={name.trim() ? 'cs-name' : 'cs-name muted'}>
                  {name.trim() || tr('이름 없음')}
                </h2>
                <div className="row">
                  <span className="tag">{position}</span>
                  <span className="cs-pos">
                    <Parts items={posParts} />
                  </span>
                </div>
                <div className="row">
                  <TeamLogo teamId={hs.id} name={hs.name} size={22} />
                  <b>{tr(hs.name)}</b>
                  <small className="muted">{regionLabel(hs.region)}</small>
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <label className="field">
              <span className="cs-field-head">
                <span>{tr('선수 이름')}</span>
                <span>{name.length} / 10</span>
              </span>
              <input
                value={name}
                maxLength={10}
                placeholder={tr('예: 김코트')}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            {!name.trim() && (
              <small className="cs-warn">
                {tr('이름을 정해야 다음 단계로 넘어갈 수 있어요.')}
              </small>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>{tr('포지션')}</h3>
              <small className="muted">
                {tr('신장 범위와 능력치 배분이 달라져요')}
              </small>
            </div>
            <div className="cs-grid cs-grid-pos">
              {POSITIONS.map((p) => {
                const [lo, hi] = heightRange(p)
                return (
                  <button
                    key={p}
                    className={p === position ? 'option on' : 'option'}
                    aria-pressed={p === position}
                    onClick={() => choosePosition(p)}
                  >
                    <b className="cs-pos-id">{p}</b>
                    <small>{tr(POSITION_LABELS[p])}</small>
                    <span className="cs-mono">
                      {lo}–{hi}cm
                    </span>
                    <span className="cs-sub">
                      {core(p).map((k) => (
                        <span key={k}>{label(k)}</span>
                      ))}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>{tr('플레이 스타일')}</h3>
              <small className="muted">
                {tr('고른 스타일의 능력치가 더 높게 나와요')}
              </small>
            </div>
            <div className="cs-grid cs-grid-style">
              {STYLES[position].map((s) => (
                <button
                  key={s.name}
                  className={s.name === style ? 'option on' : 'option'}
                  aria-pressed={s.name === style}
                  onClick={() => chooseStyle(s.name)}
                >
                  <b>{tr(s.name)}</b>
                  <small>
                    <Parts
                      items={Object.entries(s.bonus).map(
                        ([k, v]) => `${label(k as AttrKey)} +${v}`,
                      )}
                    />
                  </small>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>{tr('고등학교')}</h3>
              <small className="muted">
                {tr('유니폼 색이 학교를 따라가요')}
              </small>
            </div>
            <div className="chips" role="group" aria-label={tr('지역')}>
              {REGIONS.map((r) => (
                <button
                  key={r}
                  className={r === region ? 'chip on' : 'chip'}
                  aria-pressed={r === region}
                  onClick={() => setRegion(r)}
                >
                  {regionLabel(r)}
                </button>
              ))}
            </div>
            <div className="cs-grid cs-grid-school">
              {HIGH_SCHOOLS.filter(
                (s) => region === '전체' || s.region === region,
              ).map((s) => (
                <button
                  key={s.id}
                  className={
                    s.id === school ? 'option on cs-school' : 'option cs-school'
                  }
                  aria-pressed={s.id === school}
                  onClick={() => setSchool(s.id)}
                >
                  <TeamLogo teamId={s.id} name={s.name} size={28} />
                  <span>
                    <b>{tr(s.name)}</b>
                    <small>{regionLabel(s.region)}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {step === 2 && (
        <>
          <section className="panel panel-sunk">
            <div className="cs-scout">
              <div className="cs-wall">
                <PixelPlayer pose="guard" kit={kit} look={look} scale={2} />
              </div>
              <div className="cs-id">
                <p className="eyebrow">SCOUTING REPORT</p>
                <h2 className="cs-name">{player.name}</h2>
                <span className="cs-line">
                  <Parts
                    items={[
                      `${position} ${posParts[0]}`,
                      posParts[1],
                      tr(hs.name),
                    ]}
                  />
                </span>
              </div>
              <div className="ovr-shield inline">
                <div>
                  <small>OVR</small>
                  <strong>{ovr}</strong>
                </div>
              </div>
            </div>
            <div className="kv">
              <span>{tr('강점')}</span>
              <b>{ranked.slice(0, 2).map(label).join(' · ')}</b>
              <span>{tr('보완')}</span>
              <b>{label(ranked[ranked.length - 1])}</b>
            </div>
            <div className="row">
              <button className="ghost" onClick={reroll}>
                {tr('다시 뽑기')}
              </button>
              <small className="muted">
                {tr('신체 조건과 능력치가 새로 정해져요')}
              </small>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>{tr('능력치')}</h3>
              <span className="cs-left">
                <small className="muted">{tr('남은 포인트')}</small>
                <b>{left}</b>
              </span>
            </div>
            <Radar
              keys={HEX}
              vals={player.attrs}
              base={withMod(base.attrs)}
              lo={20}
              hi={60}
              hover={hover}
              rings
              label={tr('능력치 육각형')}
            />
            <div className="cs-legend">
              <span>
                <i className="cs-key-fill" />
                {tr('현재')}
              </span>
              <span>
                <i className="cs-key-dash" />
                {tr('스카우트 원안')}
              </span>
            </div>
            <div className="cs-stats">
              {ATTR_KEYS.map((k) => {
                const d = pool[k] - base.attrs[k]
                return (
                  <div
                    key={k}
                    className="cs-stat"
                    onMouseEnter={() => setHover(k)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <span className="cs-stat-name">
                      <b>{label(k)}</b>
                      {k === 'speed' && (
                        <small className="muted">
                          {tr('체격 보정 {mod}', { mod: signed(mod) })} ·{' '}
                          {tr('육각형 밖')}
                        </small>
                      )}
                    </span>
                    <button
                      className="ghost tiny"
                      aria-label={tr('{attr} 내리기', {
                        attr: T(ATTR_LABELS[k]),
                      })}
                      disabled={pool[k] <= ATTR_MIN}
                      onClick={() => setCustom({ ...pool, [k]: pool[k] - 1 })}
                    >
                      −
                    </button>
                    <span className="cs-stat-val">
                      {player.attrs[k]}
                      {d !== 0 && (
                        <em className={d > 0 ? 'up' : 'down'}>{signed(d)}</em>
                      )}
                    </span>
                    <button
                      className="ghost tiny"
                      aria-label={tr('{attr} 올리기', {
                        attr: T(ATTR_LABELS[k]),
                      })}
                      disabled={left <= 0 || pool[k] >= ATTR_MAX}
                      onClick={() => setCustom({ ...pool, [k]: pool[k] + 1 })}
                    >
                      +
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="row between">
              <small className="muted">
                {tr(
                  '능력치는 {min}~{max} 사이에서 총합 {total} 포인트를 나눠 가져요.',
                  { min: ATTR_MIN, max: ATTR_MAX, total: START_TOTAL },
                )}
              </small>
              <button
                className="ghost"
                disabled={!custom}
                onClick={() => setCustom(null)}
              >
                {tr('원안으로')}
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>{tr('체격')}</h3>
              <b
                className={
                  mod > 0 ? 'cs-mod up' : mod < 0 ? 'cs-mod down' : 'cs-mod'
                }
              >
                {tr('스피드')} {signed(mod)}
              </b>
            </div>
            <label className="field">
              <span className="cs-field-head">
                <span>{tr('신장')}</span>
                <b>{h}cm</b>
              </span>
              <input
                type="range"
                min={hMin}
                max={hMax}
                value={h}
                onChange={(e) => setHeight(+e.target.value)}
              />
              <span className="cs-range">
                <span>{hMin}cm</span>
                <span>{tr('{pos} 범위', { pos: position })}</span>
                <span>{hMax}cm</span>
              </span>
            </label>
            <label className="field">
              <span className="cs-field-head">
                <span>{tr('몸무게')}</span>
                <b>{wt}kg</b>
              </span>
              <input
                type="range"
                min={WEIGHT_RANGE[0]}
                max={WEIGHT_RANGE[1]}
                value={wt}
                onChange={(e) => setWeight(+e.target.value)}
              />
              <span className="cs-range">
                <span>{WEIGHT_RANGE[0]}kg</span>
                <span>{tr('적정 {n}kg', { n: idealWeight(h) })}</span>
                <span>{WEIGHT_RANGE[1]}kg</span>
              </span>
            </label>
            <small className="muted">
              {tr(
                '적정 체중보다 가벼우면 스피드가 오르고(최대 +4), 무거우면 내려가요(최대 −10).',
              )}
            </small>
          </section>
        </>
      )}

      {step === 3 && (
        <>
          <section className="panel panel-sunk">
            <div className="panel-head">
              <h3>{tr('성장 배분')}</h3>
              <span className="tag">
                {focus
                  ? tr('{attr} 집중', { attr: T(ATTR_LABELS[focus]) })
                  : tr('균형 성장')}
              </span>
            </div>
            <small className="muted">
              {tr('OVR이 1 오를 때 각 능력치가 오르는 양이에요.')}
            </small>
            <Radar
              keys={ATTR_KEYS}
              vals={split}
              base={focus ? even : undefined}
              lo={0}
              hi={splitMax}
              hover={hover}
              fmt={fmtSplit}
              label={tr('성장 배분')}
            />
            <div className="cs-legend">
              {focus && (
                <span>
                  <i className="cs-key-dash" />
                  {tr('균형 성장')}
                </span>
              )}
              <span>
                <i className="cs-key-fill" />
                {focus
                  ? tr('{attr} 집중', { attr: T(ATTR_LABELS[focus]) })
                  : tr('균형 성장')}
              </span>
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h3>{tr('무엇을 키울까요?')}</h3>
              <small className="muted">
                {tr('매년 오프시즌에 다시 고를 수 있어요')}
              </small>
            </div>
            <div className="cs-grid cs-grid-focus">
              <button
                className={focus ? 'option' : 'option on'}
                aria-pressed={!focus}
                onClick={() => setFocus(undefined)}
              >
                <b>{tr('균형 성장')}</b>
                <small>{tr('포지션 비중대로 고르게')}</small>
              </button>
              {ATTR_KEYS.map((k) => (
                <button
                  key={k}
                  className={k === focus ? 'option on' : 'option'}
                  aria-pressed={k === focus}
                  onClick={() => setFocus(k)}
                  onMouseEnter={() => setHover(k)}
                  onMouseLeave={() => setHover(null)}
                >
                  <b>{label(k)}</b>
                  <small>
                    {tr('현재')} {Math.round(player.attrs[k])}
                  </small>
                  <span className="cs-gain">
                    <span>{fmtSplit(growthPerOvr(position, k)[k])}</span>
                    <small>{tr('균형 시 {n}', { n: fmtSplit(even[k]) })}</small>
                  </span>
                </button>
              ))}
            </div>
            <small className="muted">
              {tr(
                '집중 능력치를 바꿔도 OVR 성장량은 같아요. 어디에 나눠 담을지만 달라져요. 실제 성장량은 나이와 출전 시간 등에 따라 달라져요.',
              )}
            </small>
          </section>
        </>
      )}

      <div className="row">
        <button
          className="ghost"
          onClick={() => (step ? setStep(step - 1) : onBack())}
        >
          {tr('이전')}
        </button>
        <button
          className="primary grow"
          disabled={!canNext}
          onClick={() =>
            last
              ? onStart(newGame(rng.state, player, school, focus))
              : setStep(step + 1)
          }
        >
          {last ? tr('고1 시즌 시작') : tr('다음')}
        </button>
      </div>
    </main>
  )
}
