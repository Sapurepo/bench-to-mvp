import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Look } from '../../src/engine/types'
import {
  type DrawnPose,
  H,
  type IconName,
  iconURL,
  ROSTER,
  spriteURL,
  W,
} from '../../src/ui/sprite'

// 인스타 게시물(1080×1350)·하이라이트 커버(1080×1920) 장면. ?s=<키> 로 하나만 그린다
// 문구의 게임 사실은 게임 가이드(src/data/guide.ts) 기준. 실제 구단 로고·이름은 넣지 않는다

const look = (name: string) => ROSTER.find((r) => r.name === name)!.look
const KIT = {
  hs: { jersey: '#2f6b3a', trim: '#f4f0e6' },
  uni: { jersey: '#7a1f2b', trim: '#f2c14e' },
  pro: { jersey: '#23306b', trim: '#f2c14e' },
}

export function Sprite(p: {
  look: Look
  pose?: DrawnPose
  kit?: keyof typeof KIT
  k?: number
}) {
  const k = p.k ?? 10
  const spec = { ...p.look, ...KIT[p.kit ?? 'pro'] }
  return (
    <img
      src={spriteURL(spec, p.pose ?? 'idle', 0)}
      width={W * k}
      height={H * k}
      alt=""
    />
  )
}

export function Post(p: {
  n: number
  total: number
  kicker: string
  title: string
  body?: ReactNode
  art: ReactNode
  cta?: boolean
}) {
  return (
    <main className="post">
      <section className="copy">
        <p className="kicker">{p.kicker}</p>
        <h1>{p.title}</h1>
        {p.body && <div className="body">{p.body}</div>}
      </section>
      <div className="art">{p.art}</div>
      <footer>
        {p.cta ? (
          <span className="cta">프로필 링크에서 바로 플레이 ▶</span>
        ) : (
          <span className="handle">@imthefinalmvp</span>
        )}
        <span className="page">
          {p.n}/{p.total}
        </span>
      </footer>
    </main>
  )
}

export const Cover = (p: { icon: IconName; bg: string }) => (
  <main className="cover" style={{ background: p.bg }}>
    <img src={iconURL(p.icon)} alt="" />
  </main>
)

const DOYUN = look('김도윤')
const HAIR_9: Look[] = (
  [
    ['crew', '#2a2324'],
    ['flatTop', '#1e2238'],
    ['spiky', '#e0b04a'],
    ['bangs', '#3a2a20'],
    ['slick', '#6b4428'],
    ['buzz', '#a8743a'],
    ['curtains', '#a0552e'],
    ['afro', '#1a1715'],
    ['messy', '#b9bfcc'],
  ] as const
).map(([hairStyle, hair], i) => ({
  ...DOYUN,
  hairStyle,
  hair,
  skin: i % 6,
  acc: [],
}))

const SCENES: Record<string, ReactNode> = {
  // 하이라이트 커버: 원형으로 잘리므로 가운데 아이콘만. 이름은 인스타 하이라이트 제목으로
  'cover-start': <Cover icon="ball" bg="#f07a2b" />,
  'cover-hall': <Cover icon="trophy" bg="#1a1715" />,
  'cover-patch': <Cover icon="star" bg="#4f9fdc" />,
  'cover-career': <Cover icon="heart" bg="#1d8a57" />,

  // 게시물 1: 게임 소개
  'p1-1': (
    <Post
      n={1}
      total={5}
      kicker="농구 커리어 시뮬레이션"
      title={'벤치에서\n파엠까지'}
      body="고교 농구부 벤치에서 NBA 파이널 MVP까지, 한 선수의 농구 인생을 시즌 단위로 살아 본다"
      art={<Sprite look={DOYUN} pose="bench" kit="hs" />}
    />
  ),
  'p1-2': (
    <Post
      n={2}
      total={5}
      kicker="STEP 1 · 고교"
      title={'고1,\n벤치에서 시작'}
      body="포지션·플레이 스타일·고등학교를 고르고 시즌마다 출전시간을 따낸다"
      art={<Sprite look={DOYUN} kit="hs" />}
    />
  ),
  'p1-3': (
    <Post
      n={3}
      total={5}
      kicker="STEP 2 · 대학 or KBL"
      title={'진학할까,\n바로 프로?'}
      body="고교 3시즌 뒤 대학 진학과 KBL 드래프트 중에서 고른다. 오버롤이 높으면 미국 대학(NCAA) 제안도 온다"
      art={<Sprite look={DOYUN} pose="shoot" kit="uni" />}
    />
  ),
  'p1-4': (
    <Post
      n={4}
      total={5}
      kicker="STEP 3 · NBA"
      title={'NBA의 문을\n두드린다'}
      body="서머리그 도전, 드래프트 1라운드면 루키 계약, 2라운드면 투웨이 계약"
      art={<Sprite look={DOYUN} pose="cheer" />}
    />
  ),
  'p1-5': (
    <Post
      n={5}
      total={5}
      kicker="GOAL"
      title={'파이널 MVP'}
      body="은퇴하면 공용 명예의 전당에 내 커리어를 남길 수 있다. 설치 없이 브라우저로 바로"
      art={<Sprite look={DOYUN} pose="trophy" />}
      cta
    />
  ),

  // 게시물 2: 아바타 꾸미기
  'p2-1': (
    <Post
      n={1}
      total={4}
      kicker="NEW · 아바타 꾸미기"
      title={'내 선수를\n부위별로'}
      body="피부·헤어·눈·눈썹·귀·입·장식을 하나씩 골라 나만의 선수를 만든다"
      art={['류시안', '하준', '김도윤', '나도현', '송이안'].map((n) => (
        <Sprite key={n} look={look(n)} k={7} />
      ))}
    />
  ),
  'p2-2': (
    <Post
      n={2}
      total={4}
      kicker="헤어"
      title={'헤어 9종 ×\n컬러 8종'}
      body="크루컷·포마드·가르마부터 아프로·바람머리까지"
      art={
        <div className="grid">
          {HAIR_9.map((l, i) => (
            <Sprite key={i} look={l} k={5} />
          ))}
        </div>
      }
    />
  ),
  'p2-3': (
    <Post
      n={3}
      total={4}
      kicker="얼굴"
      title={'눈 6 · 눈썹 5\n귀 4 · 입 5'}
      body="윙크, 졸린 눈, 치켜뜬 눈썹… 조합은 직접 찾아보세요"
      art={
        <div className="busts">
          {(
            [
              { eyes: 'wink', brows: 'raised', mouth: 'smile', ears: 'big' },
              { eyes: 'sharp', brows: 'angry', mouth: 'tight', ears: 'normal' },
              { eyes: 'sleepy', brows: 'soft', mouth: 'open', ears: 'pointy' },
            ] as const
          ).map((f, i) => (
            <div key={i} className="bust">
              <Sprite look={{ ...look('하준'), ...f, acc: [] }} k={12} />
            </div>
          ))}
        </div>
      }
    />
  ),
  'p2-4': (
    <Post
      n={4}
      total={4}
      kicker="상점 치장"
      title={'번 돈으로\n꾸민다'}
      body="모자·선글라스·체인·골드 슈즈… 상점에서 사서 내 선수에게 입힌다"
      art={(
        [
          ['cap', 'shades'],
          ['chain', 'goldShoes'],
          ['headphones', 'undershirt'],
          ['fedora', 'earring'],
        ] as const
      ).map((acc, i) => (
        <Sprite key={i} look={{ ...ROSTER[i * 3].look, acc: [...acc] }} k={7} />
      ))}
      cta
    />
  ),

  // 게시물 3: 숨은 규칙
  'p3-1': (
    <Post
      n={1}
      total={5}
      kicker="알고 하면 다르다"
      title={'숨은 규칙\n4가지'}
      body="벤치에서 파엠까지, 처음 하는 분이 가장 많이 놓치는 것들"
      art={<Sprite look={look('문지호')} />}
    />
  ),
  'p3-2': (
    <Post
      n={2}
      total={5}
      kicker="규칙 1"
      title={'잠재력은\n안 보인다'}
      body="화면의 오버롤은 지금 실력일 뿐. 다시 뽑기로 오버롤을 올려도 잠재력은 그대로다. 초반 몇 시즌 오버롤이 오르는 속도로 짐작하자"
      art={<Sprite look={look('문지호')} kit="hs" />}
    />
  ),
  'p3-3': (
    <Post
      n={3}
      total={5}
      kicker="규칙 2"
      title={'38세부터\n급격한 노쇠'}
      body="전성기가 끝나면 조금씩, 38세부터는 크게 떨어진다. 36세부터 매년 은퇴를 고민하고 45세엔 은퇴"
      art={<Sprite look={{ ...DOYUN, hair: '#b9bfcc' }} pose="sad" />}
    />
  ),
  'p3-4': (
    <Post
      n={4}
      total={5}
      kicker="규칙 3"
      title={'천재형 vs\n노력형'}
      body={
        <dl className="vs">
          <dt>천재형</dt>
          <dd>잠재력이 높지만 오프시즌에 훈련을 안 하면 성장이 둔해진다</dd>
          <dt>노력형</dt>
          <dd>
            잠재력은 낮지만 훈련할수록 성장 보너스, 훈련에 성공하면 능력치 +1 더
          </dd>
        </dl>
      }
      art={[
        <Sprite key="a" look={look('차민규')} pose="shoot" k={8} />,
        <Sprite key="b" look={look('백승호')} k={8} />,
      ]}
    />
  ),
  'p3-5': (
    <Post
      n={5}
      total={5}
      kicker="규칙 4"
      title={'아시안게임\n금메달 = 면제'}
      body="미필이면 22세부터 매년 입대를 묻고, 28세엔 더 미룰 수 없다. 국가대표로 금메달을 따면 병역 면제"
      art={<Sprite look={DOYUN} pose="cheer" />}
      cta
    />
  ),
}

const key = new URLSearchParams(location.search).get('s') ?? 'p1-1'
createRoot(document.getElementById('root')!).render(SCENES[key] ?? null)
