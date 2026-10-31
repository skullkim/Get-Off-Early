// 아키텍처·구현 참조 문서의 정합성을 CI에서 결정적으로 지킨다.
//
// 왜 테스트인가: 이 문서들은 서로를 전제한다 — 차트가 좁힌 후보를 가이드가 상세화하고,
// 규칙 파일이 검증하고, pagemap이 원문 위치를 가리킨다. 한쪽만 고치면 에이전트가 없는 절을
// 읽으러 가거나(끊긴 링크), 차트에 있는 패턴의 구현 리스크를 못 찾는다(11:11 깨짐).
// 사람이 눈으로 지키던 것을 머지마다 기계가 지키게 한다.
//
// 자기검사(positive control): 각 파서는 **무엇을 몇 개 찾았는지 먼저 단언**한다.
// 정규식이 바뀌어 아무것도 매칭하지 않게 되면 "위반 0건"으로 조용히 통과하기 때문이다
// (knowledge/patterns/verify-the-checker.md — 실제로 게이트 스크립트가 이 방식으로 3중 실패했다).

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const ARCH_REFS = join(ROOT, '.claude/skills/architecture-and-delegation/references')
const TDD_REFS = join(ROOT, '.claude/skills/tdd-implementation/references')

const read = (p) => readFileSync(p, 'utf8')

const CHART = join(ARCH_REFS, 'architecture-decision-chart.md')
const GUIDE = join(ARCH_REFS, 'architecture-patterns-guide.md')
const CA_RULES = join(ARCH_REFS, 'clean-architecture-rules.md')
const CC_RULES = join(TDD_REFS, 'clean-code-rules.md')
const BOOK_SKILL = join(ROOT, '.claude/skills/clean-code-rules/SKILL.md')

/** 차트 §5 역매핑 표의 오른쪽 열에서 패턴 이름을 뽑는다 (차트가 아는 패턴의 집합). */
function patternsFromChart(text) {
  const start = text.indexOf('## 5. 빠른 역매핑')
  assert.notEqual(start, -1, '차트에 §5 역매핑 절이 있어야 한다 (파서의 앵커)')
  const section = text.slice(start, text.indexOf('\n## ', start + 1))
  const names = new Set()
  for (const line of section.split('\n')) {
    const m = /^\|[^|]+\|\s*([^|]+?)\s*\|/.exec(line)
    if (!m) continue
    const cell = m[1]
    if (cell.startsWith('---') || cell === '먼저 볼 패턴') continue
    for (const name of cell.split('·')) names.add(name.trim())
  }
  return names
}

/** 가이드의 `## N-M. 패턴명` 헤딩에서 패턴 이름을 뽑는다. 괄호 부제는 버린다. */
function patternsFromGuide(text) {
  const names = new Set()
  for (const m of text.matchAll(/^## \d+-\d+\.\s*(.+)$/gm)) {
    names.add(m[1].replace(/\s*\(.*$/, '').trim())
  }
  return names
}

test('차트와 가이드가 같은 패턴 집합을 다룬다 (11:11)', () => {
  const chart = patternsFromChart(read(CHART))
  const guide = patternsFromGuide(read(GUIDE))

  // positive control — 파서가 실제로 찾았는지부터 확인한다
  assert.equal(chart.size, 11, `차트 역매핑에서 11개 패턴을 찾아야 한다 (찾음: ${[...chart]})`)
  assert.equal(guide.size, 11, `가이드 헤딩에서 11개 패턴을 찾아야 한다 (찾음: ${[...guide]})`)

  const onlyChart = [...chart].filter((p) => !guide.has(p))
  const onlyGuide = [...guide].filter((p) => !chart.has(p))
  assert.deepEqual(onlyChart, [], `차트에만 있는 패턴 — 가이드에 구현 체크리스트가 없다: ${onlyChart}`)
  assert.deepEqual(onlyGuide, [], `가이드에만 있는 패턴 — 차트가 후보로 올리지 못한다: ${onlyGuide}`)
})

test('가이드의 모든 패턴이 5개 필수 소절을 갖는다', () => {
  const REQUIRED = ['**정의.**', '**추구하는 바.**', '**해결하려는 문제.**', '**구현 시 신경 쓸 점.**', '**적용하면 안 되는 때.**']
  const text = read(GUIDE)
  const blocks = text.split(/^## (?=\d+-\d+\.)/m).slice(1)

  assert.equal(blocks.length, 11, `패턴 블록 11개를 잘라야 한다 (자름: ${blocks.length})`)

  for (const block of blocks) {
    const title = block.split('\n')[0].trim()
    for (const sub of REQUIRED) {
      assert.ok(block.includes(sub), `"${title}" 에 ${sub} 소절이 없다`)
    }
  }
})

test('규칙 본문의 단일 소스는 clean-code-rules 스킬이고, 하네스 층은 그걸 가리킨다', () => {
  // 사용자 결정(2026-10-31): 두 층을 유지하고 역할을 나눈다.
  // 규칙 본문 = clean-code-rules 스킬 / 채택·기각 판정 = 각 스킬의 references.
  // 판정 층이 스킬을 가리키지 않으면 두 층이 같은 규칙을 따로 키우게 된다.
  const skill = read(BOOK_SKILL)
  assert.match(skill, /^## 0\. 우선순위/m, '스킬 §0 우선순위표가 충돌 판정의 권위다')

  let pointed = 0
  for (const doc of [CA_RULES, CC_RULES]) {
    const text = read(doc)
    assert.match(text, /clean-code-rules` 스킬|clean-code-rules 스킬/,
      `${doc} 는 규칙 본문의 단일 소스(clean-code-rules 스킬)를 명시해야 한다`)
    assert.match(text, /단일 소스/, `${doc} 에 "단일 소스" 가 어디인지 적혀 있어야 한다`)
    pointed++
  }
  assert.equal(pointed, 2, '판정 층 문서 2개를 검사해야 한다')
})

test('기각표가 사유와 함께 존재한다 (책을 근거로 되돌리는 것을 막는 층)', () => {
  const text = read(CC_RULES)
  assert.match(text, /^## B\. 기각/m, '기각 절이 있어야 한다')
  for (const rejected of ['J1', 'final', '주석']) {
    assert.ok(text.includes(rejected), `기각 절이 ${rejected} 를 다뤄야 한다`)
  }
  // 사유 없는 기각은 다음 에이전트가 되돌린다 — 표에 사유 열이 채워져 있는지 센다
  const rows = text.split('\n').filter((l) => /^\|/.test(l) && l.split('|').length >= 5)
  assert.ok(rows.length >= 6, `기각/수렴표의 행을 6개 이상 찾아야 한다 (찾음: ${rows.length})`)
})

test('참조 문서의 상대 링크가 모두 실재한다 (orphan 없음)', () => {
  const docs = [
    [CHART, ARCH_REFS],
    [GUIDE, ARCH_REFS],
    [CA_RULES, ARCH_REFS],
    [CC_RULES, TDD_REFS],
    [BOOK_SKILL, join(ROOT, '.claude/skills/clean-code-rules')],
    [join(ARCH_REFS, 'document-template.md'), ARCH_REFS],
    [join(ROOT, '.claude/skills/architecture-and-delegation/SKILL.md'), join(ROOT, '.claude/skills/architecture-and-delegation')],
    [join(ROOT, '.claude/skills/tdd-implementation/SKILL.md'), join(ROOT, '.claude/skills/tdd-implementation')],
  ]

  let checked = 0
  let skippedPlaceholders = 0
  for (const [doc, base] of docs) {
    assert.ok(existsSync(doc), `참조 문서 자체가 없다: ${doc}`)
    const text = read(doc)
    for (const m of text.matchAll(/\]\(([^)#:]+\.md)(?:#[^)]*)?\)/g)) {
      // `{프로젝트}` 처럼 치환자가 든 경로는 템플릿 예시다 — 실재할 수 없다.
      if (m[1].includes('{')) { skippedPlaceholders++; continue }
      const target = resolve(base, m[1])
      checked++
      assert.ok(existsSync(target), `${doc} 의 링크가 끊겼다: ${m[1]} → ${target}`)
    }
  }

  // positive control — 링크를 하나도 검사하지 않았다면 정규식이 죽은 것이다.
  // 치환자 제외가 전체를 삼켜도 같은 증상이 나므로 둘을 따로 센다.
  assert.ok(checked >= 8, `실링크를 8개 이상 검사해야 한다 (검사: ${checked}, 치환자 제외: ${skippedPlaceholders})`)
  assert.ok(skippedPlaceholders <= 3, `치환자 제외가 너무 많다 — 예외가 검사를 삼키고 있다 (${skippedPlaceholders})`)

  // 이 문서들은 경로를 마크다운 링크보다 **백틱**으로 더 많이 쓴다. 변이 테스트에서
  // 백틱 경로를 깨뜨렸을 때 위 루프가 잡지 못했으므로(검사기 사각) 따로 검사한다.
  // 단, **빌드 산출물 경로는 제외**한다 — `_workspace/…` 와 프로젝트 레포의 `docs/adr/…` 는
  // 빌드 중에 생기므로 이 레포에 없는 것이 정상이다. 검사 대상은 우리가 커밋하는 문서 트리뿐.
  // 제외는 **열거**한다. catch-all 로 두면 나중에 `.claude/…` 경로가 조용히 제외돼도
  // 테스트는 계속 초록이다(knowledge/patterns/unenumerated-catch-all.md).
  const ARTIFACT = /^(_workspace\/|docs\/adr\/)/   // 빌드 중 생기므로 이 레포에 없다
  let backticked = 0
  const skipped = []
  for (const [doc, base] of docs) {
    for (const m of read(doc).matchAll(/`([^`\s{}]*\/[^`\s{}]*\.md)`/g)) {
      const ref = m[1]
      if (ARTIFACT.test(ref)) { skipped.push(ref); continue }
      // 레포 루트 기준(`.claude/skills/...`)과 문서 기준(`references/...`) 둘 다 쓰인다.
      // 둘 중 하나로 풀리면 실재, 아니면 깨진 참조다.
      backticked++
      const found = [resolve(ROOT, ref), resolve(base, ref)].some(existsSync)
      assert.ok(found, `${doc} 의 백틱 경로가 실재하지 않는다: ${ref}`)
    }
  }
  assert.ok(backticked >= 8, `백틱 경로를 8개 이상 검사해야 한다 (검사: ${backticked}, 산출물 제외: ${skipped.length})`)
})

test('docs/pdf/ 는 커밋하지 않는다 (다른 기계 이식성)', () => {
  // 원서 PDF 는 저작물이고 레포에 없다. 규칙은 스킬 references/ 에 번역돼 있어
  // PDF 없이 자기완결적이어야 한다 — 그래야 다른 기계에서 세팅이 끊기지 않는다.
  assert.match(read(join(ROOT, '.gitignore')), /^docs\/pdf\/$/m, 'docs/pdf/ 가 .gitignore 에 있어야 한다')
})
