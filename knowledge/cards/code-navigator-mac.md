---
type: Project Knowledge Card
project: code-navigator-mac
title: 맥 네이티브 코드 내비게이터 (Neovim 임베드)
status: DONE
stack: [Swift 6, SwiftUI + AppKit(NSViewRepresentable/NSTextInputClient), Neovim --embed + 자체 MessagePack-RPC, tree-sitter(Java/Kotlin/TS), swift-testing, SwiftPM 4타깃]
summary: Neovim을 프로세스로 임베드해 실제 Vim으로 편집하고, tree-sitter 심볼 인덱스로 정의·참조를 찾는 맥 네이티브 앱. 프로젝트를 탭으로 동시 개방하고 마크다운·HTML을 편집기 위에 렌더한다. 웹판([[code-navigator]])의 네이티브 재구현이자 확장.
tags: [macos, swift, neovim, embed, msgpack-rpc, tree-sitter, ime, key-routing, coretext, gatekeeper]
timestamp: 2026-09-01T00:00:00Z
---

## 핵심 결정 (ADR 요약 — docs/adr/0001~0013 · 0101~0113)

- **경계 = 프로토콜 하나**(`CodeNavigatorContract`). 앱은 엔진 구현을 모른다 — 테스트가 Fake 하나로 전 표면을 대체할 수 있는 것이 이 경계가 옳다는 증거.
- **편집 = Neovim `--embed` + 자체 MessagePack 구현**. 기성 RPC 라이브러리 대신 직접 쓴 이유는 의존성이 아니라 **오류 표면**: 우리가 쓰는 것은 요청/응답/알림 3종뿐이고, 그 밖의 실패는 우리 것이 아니어야 진단이 좁아진다.
- **구문 강조 = Neovim이 분류하고 앱이 색을 정한다**(ADR-0010/0112). 파서를 두 벌 두지 않고, 색 일관성은 앱 디자인 시스템이 소유. **키는 사용자 것이 이기고 색은 앱 것이 이긴다** — 키는 손버릇, 색은 화면 일관성이라 기준이 다르다.
- **`gd`/`gr` = Neovim 세션 매핑 + 빈 신호로 앱 호출**(ADR-0113). Swift 키 라우터에 접두사 상태 기계를 넣지 않는다 — 넣는 순간 `g` 를 누르고 기다리는 상태를 앱이 소유하게 되고, 그건 Neovim이 이미 하는 일이다.
- **텍스트 오프셋 = UTF-16 코드 유닛**(ADR-0007). AppKit·NSTextInputClient가 그 단위라 경계에서 변환하지 않는 쪽을 택했다. Neovim(바이트)과의 변환은 RPC 계층 한 곳에만 있다.
- **탭이 상태의 단위**(ADR-0107). `ProjectWorkspace` 를 탭 안으로 좁혀, 탭 격리를 "지키자"가 아니라 **구조적으로 위반 불가**로 만들었다. 격리 경계는 [[measure-the-isolation-boundary]] 식으로 실측해 그었다(ADR-0009).
- **렌더 보기 = 전면 차단 + 앱이 인라인**(ADR-0109, INV-6). 원격 로드·스크립트 전면 차단, 로컬은 프로젝트 루트로 제한. `data:image/svg+xml` 은 **차단**(SVG는 스크립트를 담는다). 차단·실패·부재를 **각각 다른 문패로** 말한다 — 못 읽은 것을 "차단됨"으로 세면 보안 신호가 부풀고, 부푼 신호는 진짜 차단도 못 믿게 만든다.

## Gotcha (반복 함정)

- **🔑 `interpretKeyEvents` 로 가는 catch-all 이 결함을 세 번 낳았다.** 탈출 키·화음·방향키/delete/Enter 가 전부 `return .interpretForComposition` 한 줄로 떨어졌고, 그 줄에 무엇이 오는지 한 번도 열거되지 않았다. 마지막 둘은 **사용자가 직접 눌러 보고** 신고했다. 관련: [[unenumerated-catch-all]]
- **macOS `StandardKeyBinding.dict` 에서 Enter·Tab 은 문자가 아니라 명령이다.** `insertNewline:`/`insertTab:` 로 오고, 이 경로에서 **문자를 만드는 것은 space 뿐**이다. 리더가 "space·return·tab 셋 다 문자를 만든다"를 재지 않고 지시해 Enter 를 죽였다.
- **`NSEvent.keyCode` 는 마우스 이벤트에 없다.** 키 이벤트용 초기화를 마우스 경로에서 재사용하면 `NSInternalInconsistencyException` 이 나고 **이벤트 루프가 그것을 삼킨다** — 크래시도 로그도 없이 클릭만 죽는다. 수식자만 읽는 초기화를 따로 뺐다.
- **`swift test` 병렬 실행이 4/7 확률로 SIGSEGV.** 크래시 스택에 우리 프레임이 0개고 제품 코드는 도달 불가(메인 액터 전용)라 툴체인 문제로 판정, `--no-parallel` 을 게이트에 고정하고 **그 판단 근거를 스크립트 주석에 남겼다**(왜 느린 옵션을 쓰는지 모르면 다음 사람이 지운다).
- **인증 안 된 앱은 macOS 15+ 에서 "우클릭 → 열기"가 통하지 않는다.** 그 우회는 제거됐다. `xattr -d com.apple.quarantine` 또는 시스템 설정의 "확인 없이 열기"뿐. 오래된 안내를 그대로 적으면 사용자가 벽을 다시 만난다.
- **`swift build --arch` 는 툴체인에 따라 조용히 무시된다.** 얇은 바이너리는 겉으로 같아 보이고, 실패는 **남의 맥에서만** 드러난다 → 패키징 스크립트가 `lipo -archs` 로 검증하고 아니면 실패시킨다.
- **`ProjectWorkspace.tabs()` 는 제품 호출 0 / 검증 호출 18.** 지우는 대신 **두 장부의 발산을 재는 오라클**로 남겼다(ADR-0111). "안 쓰는 코드"와 "측정 도구"는 다르다.
- **한글 조합 중의 이동 키는 끝내 라이브로 못 쟀다.** 합성 입력이 *어느 창이 앞인가*에 의존하고, `TISSelectInputSource` 로 강제하는 것은 **REQ-014 AC-4("앱은 사용자 입력 소스를 바꾸지 않는다")의 방어선을 검증 도구가 깨는 것**이라 하지 않았다. 규칙을 지키는지 재려고 규칙을 깨면 그 측정은 무의미하다. → 사람 손 1분짜리 `verify-korean-chords.sh` 로 이관하고 README·BUILD_COMPLETE에 **미검증으로 명시**.

## 이 빌드의 지배적 실패 (회고 핵심)

> **테스트가 초록인데 기능이 죽어 있다 — 여덟 번.**

셋은 위의 catch-all 한 줄, 둘은 사용자가 찾았다. 공통 구조는 **"통과하는 테스트가 존재하는 상태"** 로 결함이 사는 것이다: 테스트는 열거된 것만 보고 결함은 열거되지 않은 곳에 있어, 커버리지도 함께 올라간다.

**부수 집계**: 검사기 사각 9회(전부 즉석 셸 명령 — 자기검사 붙은 검사기에서는 0회) · 근거 붕괴 6유형 · 공허한 단언 10건(`allSatisfy` 가 빈 집합에서 참). 관련: [[checker-self-test-or-not-a-checker]] · [[verify-the-checker]]

## 산출물 카탈로그

- `_workspace/01_requirements.md`(REQ-001~011) · `01b`(012~014) · `01c`(015~017) + INV-1~8 + SC-1~13
- `_workspace/02_design.md` + `prototype/`(HTML) + `prototype/shots/`(25장) — 프론트 구현 타깃이자 QA 대조 기준
- `_workspace/DECISIONS.md` — 리더 판정 ~700줄. **뒤집힌 판정을 지우지 않고 남긴 것**이 회고의 최대 정보원
- `_workspace/gate.sh` — 뷰 마운트 전수 · 포커스 대칭+도달성 · 입력소스 호출 0건 · 자체 검사 3종 · 민감정보 스캔
- `_workspace/verify-korean-chords.sh` — 사람 개입 검증(8칸 + 자기검사 4종)
- `scripts/bundle.sh`(번들 매니페스트: 빌드시각·HEAD·clean 여부) · `scripts/package-dmg.sh`(유니버설 검증 + DMG)
- `docs/adr/` 24건 · `README.md`(설치·게이트·**알려진 미검증** 절)

## 결과

**1,407 테스트 / 179 스위트**, 풀게이트 **연속 3회 동일**(같은 트리 `79241c4`), 열린 결함 0. 유휴 메모리 31MB. 배포는 유니버설 5.3MB DMG(ad-hoc 서명, 미공증).

앞선 시도에서 3회차가 **1,375 대 1,376** 한 건 차이로 무효가 됐다 — 진단 프로브가 측정 중 트리에 들어왔다. **움직이는 트리에서 돌린 게이트는 측정이 아니다.**
