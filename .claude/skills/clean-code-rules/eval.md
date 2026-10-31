# 트리거 평가 — clean-code-rules

> 이 스킬이 **발동해야 할 때 발동하고, 발동하면 안 될 때 안 하는지** 재는 표본 질의.
> 설명(description)을 고쳤으면 이 표를 돌려 확인한다. 돌리는 법: 질의를 새 세션에 그대로 주고 어떤 스킬이 호출되는지 본다.

| 구분 | 질의 | 기대 |
|------|------|------|
| 발동 | "REQ-005 구현해줘" | tdd-implementation + clean-code-rules (Refactor 완료 조건) |
| 발동 | "이 함수 리팩터링해줘" | clean-code-rules |
| 발동 | "주니어 PR 리뷰해줘" | clean-code-rules (위반을 규칙 ID로 인용) |
| 발동 | "패키지 구조를 기능별로 할지 계층별로 할지 정하자" | architecture-and-delegation + clean-code-rules(ca1 12–14장, ca3 34장을 ADR 평가 기준으로) |
| 비발동 | "요구사항 정리해줘" | define-requirements만 |
| 비발동 | "README 오타 고쳐줘" | 스킬 없음. 코드가 아니다 |
| 경계 | "테스트는 통과하는데 동작이 이상해" | qa-verification. 이 스킬은 품질 판정 기준으로만 함께 쓴다 |
| 경계 | "블록마다 주석 달아야 해?" | clean-code-rules §0. 기존 규칙(블록 단위 무엇·왜 주석)이 책보다 우선한다 |

## 내용 회귀 검사 (책을 빠뜨리지 않았는지)

- 17장 냄새 코드는 66개다(C5·E2·F4·G36·J3·N7·T9). `cc3` 의 `### <코드>:` 제목과 `cc5` 의 부록 C 표가 **같은 66개 집합**이어야 한다:
  ```bash
  R=.claude/skills/clean-code-rules/references
  diff <(rg -o '^### [CEFGJNT][0-9]+:' $R/cc3-*.md | sed 's/### //;s/://' | sort -u) \
       <(sed -n '/^## D\./,/^## 커버리지/p' $R/cc5-*.md | rg -o '\| *[CEFGJNT][0-9]+ *\|' | tr -d '| ' | sort -u) \
    && echo OK
  ```
  2026-10-31 실측: 66 = 66, 일치. 한쪽에 가짜 코드를 넣으면 diff가 차이를 잡는 것도 확인했다(positive control).
- 참조 파일 8개의 규칙 수 합계: Clean Code 753, Clean Architecture 482.
