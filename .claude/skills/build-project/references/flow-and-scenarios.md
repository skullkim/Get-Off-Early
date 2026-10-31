# 데이터 흐름

> `build-project` 스킬의 참조 파일. 본문에서 떼어 둔 이유는 이 내용이 **특정 국면에서만** 필요하기 때문이다 — 스킬이 트리거될 때마다 컨텍스트에 올리지 않는다.

## 데이터 흐름

```
[사용자] ⇄ [리더=PM] → 01_requirements.md
                            ↓
                  [PD 서브에이전트] → 02_design.md
                            ↓
        [빌드 팀: Agent 로 named 스폰]
   backend-senior ⇄(API계약)⇄ frontend-senior
        │ 위임                    │ 위임
   backend-junior            frontend-junior
        └────→ 코드 + 테스트 + 04_coverage_matrix.md ←────┘
                            ↓ (게이트 통과)
                    [qa] → 05_qa_report_round{N}.md
                            ↓ 버그 → 개발자 (루프)
                       전체 PASS → [리더: 최종 보고]
                            ↓
              [리더: 회고(retrospective)] → 하네스 파일/메모리 갱신
                            ↓
              .claude/retro/log.md + CLAUDE.md 변경 이력
```
