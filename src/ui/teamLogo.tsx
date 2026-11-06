import { useState } from 'react'
import { tr } from '../i18n'
import { HIGH_SCHOOLS } from '../data/schools'
import { KBL_TEAMS, NBA_TEAMS } from '../data/teams'
import { flagURL } from './flagArt'
import { teamKit } from './pose'

// 프로 구단과 고교(교표: 각 학교 공식 홈페이지 학교상징에서 잘라 96px PNG)만 로고가 있다.
// 대학·상무 등은 팀 색 배지로 대체.
const PRO = new Map<string, string>([
  ...KBL_TEAMS.map((t): [string, string] => [t.id, `/logos/kbl/${t.id}.svg`]),
  ...NBA_TEAMS.map((t): [string, string] => [t.id, `/logos/nba/${t.id}.svg`]),
])
// 고교는 이름으로만 찾는다 (id 가 구단과 겹친다: 안양고 'anyang')
const BY_NAME = new Map([
  ...[...KBL_TEAMS, ...NBA_TEAMS].map((t): [string, string] => [
    t.name,
    PRO.get(t.id)!,
  ]),
  ...HIGH_SCHOOLS.map((s): [string, string] => [
    s.name,
    `/logos/hs/${s.id}.png`,
  ]),
])
const NAME = new Map([...KBL_TEAMS, ...NBA_TEAMS].map((t) => [t.id, t.name]))

export function TeamLogo({
  teamId,
  name = '',
  size = 28,
}: {
  teamId?: string
  name?: string
  size?: number
}) {
  // 로고 파일을 못 불러오면 배지로 대체
  const [broken, setBroken] = useState<string>()
  // 학교 id 가 구단 id 와 겹칠 수 있어(안양고 'anyang' = 안양 정관장) 이름이 오면 이름이 맞을 때만 id 로 찾는다
  const byId =
    teamId && (!name || NAME.get(teamId) === name) ? PRO.get(teamId) : undefined
  const src = byId || BY_NAME.get(name)
  if (src && src !== broken) {
    return (
      <img
        className="logo"
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setBroken(src)}
      />
    )
  }
  // 아시안게임 국가대표는 픽셀 국기
  const flag = flagURL(name)
  if (flag)
    return (
      <img className="logo flag" src={flag} alt="" width={size} height={size} />
    )
  return (
    <span
      className="logo badge"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        background: teamKit(teamId ?? name).jersey,
      }}
      aria-hidden
    >
      {tr((name || (teamId && NAME.get(teamId)) || '').trim()).charAt(0)}
    </span>
  )
}

export function LeagueLogo({
  league,
  height = 20,
}: {
  league: 'kbl' | 'nba'
  height?: number
}) {
  const [broken, setBroken] = useState(false)
  if (broken) return <b>{league.toUpperCase()}</b>
  return (
    <img
      className="league"
      src={`/logos/${league}.svg`}
      alt={league.toUpperCase()}
      height={height}
      onError={() => setBroken(true)}
    />
  )
}
