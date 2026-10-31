# Clean Code (Robert C. Martin) — 앞부분 + 1~4장 규칙 추출

> **전수 카탈로그** — `clean-code-rules` 스킬의 참조 파일. 원전: Clean Code (Robert C. Martin, 2008) — `docs/pdf/Clean Code ( PDFDrive.com ).pdf`. 이 범위의 본문을 한 줄도 빼지 않고 읽어 추출했다(파일 끝 "커버리지 확인" 참고).
> **인용 형식**: `cc1:<규칙ID>` (예: `cc1:CC-A-012`). 규칙 ID는 이 파일 안에서만 유일하다.
> **쪽수**: 인쇄본 쪽수(본문 러닝 헤더 기준)
> 태그: [일반] = 언어 무관 / [Java특화] = Java·그 시대 도구에서만 의미 있음.
> 페이지 번호는 본문 상단 머리글(예: "34 Chapter 3: Functions") 기준. 앞부분(서문)은 로마 숫자 페이지.

---

## 앞부분 (Front Matter)

### Foreword (James O. Coplien) — p. xix–xxiii

**CC-A-001 정리·정돈: 코드는 예상되는 위치에 둔다 (Seiton — "a place for everything")**
- 규칙: 코드 조각은 독자가 찾을 것이라 예상하는 위치에 두고, 그렇지 않으면 그곳으로 옮기도록 리팩터링하라.
- 근거: 무엇이 어디 있는지 아는 것(적절한 이름 포함)이 핵심이다.
- 출처: Foreword, 5S(Seiri/Seiton) — p. xx
- 태그: [일반]

**CC-A-002 청소: 역사·소망을 담은 주석과 주석 처리된 코드를 제거한다 (Seiso)**
- 규칙: 과거 이력이나 미래 희망을 담은 주석, 주석 처리된 코드 줄을 남기지 말고 삭제하라.
- 근거: 작업장을 쓰레기 없이 유지하는 것(Seiso).
- 출처: Foreword, 5S(Seiso) — p. xx
- 태그: [일반]

**CC-A-003 표준화: 팀 단위 일관된 코딩 스타일·관행을 합의해 따른다 (Seiketsu)**
- 규칙: 팀이 합의한 일관된 코딩 스타일과 관행을 모든 코드에 적용하라.
- 근거: 그룹이 작업장을 깨끗이 유지하는 방법에 합의해야 한다. 일관된 들여쓰기는 낮은 버그 밀도의 가장 유의한 지표 중 하나였다(Bell Labs).
- 출처: Foreword, 5S(Seiketsu) — p. xx, xxii
- 태그: [일반]

**CC-A-004 규율: 자기 작업을 자주 돌아보고 바꿀 의지를 가진다 (Shutsuke)**
- 규칙: 합의된 관행을 지키고, 자신의 코드를 정기적으로 되돌아보며 개선하라.
- 근거: 자기 규율이 나머지 4S를 지탱한다.
- 출처: Foreword, 5S(Shutsuke) — p. xx
- 태그: [일반]

**CC-A-005 가차 없는 리팩터링 / 예방 정비 (Refactor mercilessly)**
- 규칙: 버그가 드러나기를 기다리지 말고 마모되는 부분을 매일 점검·리팩터링하라.
- 근거: 고장 정비(breakdown maintenance)는 예외여야 한다. 코드를 읽기 쉽게 만드는 것은 실행 가능하게 만드는 것만큼 중요하다.
- 출처: Foreword — p. xx
- 태그: [일반]

**CC-A-006 체크인 전 리팩터링, 리팩터링을 "완료(Done)" 정의에 포함**
- 규칙: 체크인 전에 리팩터링하고, 리팩터링을 작업 완료 정의의 일부로 취급하라.
- 근거: Scrum 권장 관행. 캠프장을 발견했을 때보다 깨끗하게 떠난다.
- 출처: Foreword — p. xxii
- 태그: [일반]

**CC-A-007 코드 상태에 대해 정직하라**
- 규칙: 동료와 자신에게 코드의 실제 상태(미흡한 점 포함)를 숨기지 말고 드러내라.
- 근거: 작은 것에서의 정직은 작은 것이 아니다. 완벽이 아니라 정직과 최선이 요구된다.
- 출처: Foreword — p. xxii
- 태그: [일반]

**CC-A-008 변수 이름에 세심한 주의 (attentive to every variable name)**
- 규칙: 모든 변수 이름을 첫 아이 이름 짓듯 신중히 지어라.
- 근거: 디테일(문손잡이)이 전체의 품질을 결정한다.
- 출처: Foreword — p. xxi
- 태그: [일반]

### Introduction — p. xxv–xxvii
(실천 규칙 없음: 장인정신 = 지식 + 연습, 책 3부 구성, 휴리스틱 [Hnn] 전방 참조 설명.)

---

## Chapter 1: Clean Code

### There Will Be Code — p. 2

**CC-A-009 요구사항은 결국 코드다 — 정밀함을 생략하지 않는다**
- 규칙: 요구사항의 세부를 기계가 실행할 수 있을 만큼 정밀하게 명세하는 일(=코드)을 추상화로 회피하지 마라.
- 근거: 코드는 요구사항의 세부를 표현하는 언어이며, 잘 명세된 요구사항은 코드만큼 형식적이고 실행 가능한 테스트가 될 수 있다.
- 출처: Ch1, There Will Be Code — p. 2
- 태그: [일반]

### Bad Code — p. 3–4

**CC-A-010 "나중에 정리" 금지 (LeBlanc's law: Later equals never)**
- 규칙: 동작하는 지저분한 코드를 "나중에 정리하겠다"며 남기지 말고 지금 정리하라.
- 근거: 나중은 결코 오지 않는다. 회사 하나가 나쁜 코드로 망했다.
- 출처: Ch1, Bad Code — p. 3–4
- 태그: [일반]

### The Total Cost of Owning a Mess — p. 4–7

**CC-A-011 엉망의 총비용을 인식하고 상시 청결 유지**
- 규칙: 생산성이 0으로 수렴하지 않도록 코드를 항상 깨끗하게 유지하라(인원 추가로 해결하지 마라).
- 근거: 엉망이 쌓이면 모든 변경이 다른 두세 곳을 깨뜨리고, 새 인원은 설계 의도를 몰라 엉망을 더한다.
- 출처: Ch1, The Total Cost of Owning a Mess — p. 4
- 태그: [일반]

**CC-A-012 대재설계 대신 점진적 정리 (The Grand Redesign in the Sky)**
- 규칙: 전면 재작성(그린필드 재설계)에 기대지 말고 기존 코드를 지속적으로 깨끗하게 유지하라.
- 근거: 재설계 팀은 구 시스템을 영원히 따라잡아야 하고, 10년 뒤 새 시스템도 엉망이 된다.
- 출처: Ch1, The Grand Redesign in the Sky — p. 5
- 태그: [일반]

**CC-A-013 코드를 열정적으로 방어하라 (Attitude)**
- 규칙: 일정·요구 압박이 있어도 엉망을 만드는 위험을 관리자에게 알리고 코드 품질을 양보하지 마라.
- 근거: 관리자가 일정을 지키는 게 일이듯 코드를 지키는 게 프로그래머의 일이다(손 씻기를 거부하는 의사의 비유).
- 출처: Ch1, Attitude — p. 5–6
- 태그: [일반]

**CC-A-014 빨리 가는 유일한 길은 깨끗하게 유지하는 것 (The Primal Conundrum)**
- 규칙: 마감을 맞추려 엉망을 만들지 말고, 항상 코드를 최대한 깨끗하게 유지하라.
- 근거: 엉망은 즉시 속도를 늦추어 결국 마감을 놓치게 한다.
- 출처: Ch1, The Primal Conundrum — p. 6
- 태그: [일반]

**CC-A-015 동작 보존 변환의 연속으로 정리 (code-sense)**
- 규칙: 지저분한 모듈은 동작을 보존하는 작은 변환(behavior-preserving transformations)을 순서대로 적용해 개선하라.
- 근거: "코드 감각"은 선택지를 보고 최선의 변형 경로를 계획하게 해준다.
- 출처: Ch1, The Art of Clean Code? — p. 6–7
- 태그: [일반]

### What Is Clean Code? — p. 7–12

**CC-A-016 로직은 단순하게, 버그가 숨을 곳이 없게 (Stroustrup)**
- 규칙: 로직을 직관적으로 작성해 버그가 숨기 어렵게 하라.
- 근거: 우아하고 효율적인 코드는 읽는 즐거움을 준다.
- 출처: Ch1, What Is Clean Code? (Bjarne Stroustrup) — p. 7
- 태그: [일반]

**CC-A-017 의존성을 최소화하고 명시적으로 정의 (Stroustrup / Big Dave Thomas)**
- 규칙: 의존성은 최소로 유지하고 명시적으로 선언하라.
- 근거: 유지보수를 쉽게 한다.
- 출처: Ch1, What Is Clean Code? — p. 7, 9
- 태그: [일반]

**CC-A-018 에러 처리는 명확한 전략에 따라 빠짐없이 (Stroustrup)**
- 규칙: 에러 처리를 하나의 명시된 전략에 따라 완전하게 구현하라(축약·생략 금지).
- 근거: 생략된 에러 처리·메모리 누수·경쟁 조건·일관성 없는 이름은 모두 디테일을 얼버무린 것이다.
- 출처: Ch1, What Is Clean Code? — p. 7–8
- 태그: [일반]

**CC-A-019 성능은 원칙 없는 최적화 유혹이 없을 만큼 최적에 가깝게**
- 규칙: 성능을 최적에 가깝게 유지해, 나중에 누군가 원칙 없는 최적화로 코드를 더럽히고 싶어지지 않게 하라.
- 근거: 낭비된 사이클은 우아하지 않고, 나쁜 코드는 엉망을 키우도록 "유혹"한다.
- 출처: Ch1, What Is Clean Code? (Stroustrup) — p. 7–8
- 태그: [일반]

**CC-A-020 깨진 유리창을 방치하지 않는다 (Broken Windows)**
- 규칙: 작은 결함·지저분함이라도 발견 즉시 고쳐, 방치된 흔적이 추가 부패를 부르지 않게 하라.
- 근거: 나쁜 코드를 고치는 사람은 더 나쁘게 만드는 경향이 있다.
- 출처: Ch1, What Is Clean Code? — p. 8
- 태그: [일반]

**CC-A-021 깨끗한 코드는 한 가지를 잘한다 (does one thing well)**
- 규칙: 각 함수·클래스·모듈이 주변 디테일에 오염되지 않은 단일 목적에 집중하게 하라.
- 근거: 나쁜 코드는 너무 많은 일을 하려 해 의도가 흐려진다.
- 출처: Ch1, What Is Clean Code? (Stroustrup) — p. 7–8
- 태그: [일반]

**CC-A-022 잘 쓴 산문처럼 읽히고 설계 의도를 가리지 않는다 (Booch)**
- 규칙: 코드는 단순·직접적이며, 명료한 추상화와 직선적인 제어 흐름으로 설계자의 의도를 드러내게 하라.
- 근거: 깨끗한 코드는 잘 쓴 산문처럼 읽힌다.
- 출처: Ch1, What Is Clean Code? (Grady Booch) — p. 8
- 태그: [일반]

**CC-A-023 사실적이고 필요한 것만 담는다 (crisp abstraction)**
- 규칙: 추측성 코드를 넣지 말고, 꼭 필요한 것만 결단력 있게 담아라.
- 근거: "crisp" = 망설임·불필요한 디테일 없이 단호하고 사실적인.
- 출처: Ch1, What Is Clean Code? — p. 9
- 태그: [일반]

**CC-A-024 원저자 아닌 개발자도 읽고 개선할 수 있게 (Big Dave Thomas)**
- 규칙: 다른 개발자가 쉽게 읽을 뿐 아니라 쉽게 변경·확장할 수 있도록 작성하라.
- 근거: 읽기 쉬운 코드와 바꾸기 쉬운 코드는 다르다.
- 출처: Ch1, What Is Clean Code? — p. 9
- 태그: [일반]

**CC-A-025 테스트 없는 코드는 깨끗하지 않다**
- 규칙: 모든 코드에 단위 테스트와 인수 테스트를 갖춰라.
- 근거: 아무리 우아해도 테스트가 없으면 깨끗하지 않다.
- 출처: Ch1, What Is Clean Code? (Big Dave Thomas) — p. 9
- 태그: [일반]

**CC-A-026 한 가지 일을 하는 방법은 하나만 제공**
- 규칙: 같은 일을 하는 여러 방법을 두지 말고 하나의 방법만 제공하라.
- 근거: Big Dave Thomas의 깨끗한 코드 정의.
- 출처: Ch1, What Is Clean Code? — p. 9
- 태그: [일반]

**CC-A-027 명확하고 최소한의 API**
- 규칙: 공개 API는 명확하고 최소한으로 유지하라.
- 근거: 작은 것이 더 낫다(Smaller is better).
- 출처: Ch1, What Is Clean Code? — p. 9
- 태그: [일반]

**CC-A-028 사람이 읽을 수 있게 (literate code)**
- 규칙: 코드를 사람이 읽기 좋은 형태로 구성하라.
- 근거: Knuth의 문학적 프로그래밍 — 코드만으로 모든 정보를 표현할 수 없는 언어도 있다.
- 출처: Ch1, What Is Clean Code? — p. 9
- 태그: [일반]

**CC-A-029 돌봄의 흔적: 더 개선할 명백한 부분이 없게 (Feathers)**
- 규칙: 코드를 넘기기 전에 명백히 개선할 수 있는 부분이 남지 않도록 다듬어라.
- 근거: 깨끗한 코드는 항상 신경 쓰는 사람이 쓴 것처럼 보인다.
- 출처: Ch1, What Is Clean Code? (Michael Feathers) — p. 10
- 태그: [일반]

**CC-A-030 Beck의 단순 설계 규칙 (우선순위 순)**
- 규칙: 코드를 ①모든 테스트 통과 ②중복 없음 ③시스템의 모든 설계 아이디어 표현 ④클래스·메서드·함수 등 엔터티 수 최소화의 우선순위로 다듬어라.
- 근거: Ron Jeffries가 시작과 끝을 이 규칙으로 한다.
- 출처: Ch1, What Is Clean Code? (Ron Jeffries) — p. 10
- 태그: [일반]

**CC-A-031 중복은 표현되지 않은 아이디어의 신호**
- 규칙: 같은 일이 반복되면 그 뒤에 있는 개념을 찾아 코드로 명확히 표현(추출)하라.
- 근거: 중복은 머릿속 아이디어가 코드에 잘 표현되지 않았다는 신호다.
- 출처: Ch1, What Is Clean Code? (Ron Jeffries) — p. 10
- 태그: [일반]

**CC-A-032 더 나은 이름이 떠오르면 여러 번이라도 이름을 바꾼다**
- 규칙: 이름이 자리 잡을 때까지 주저 없이 여러 번 개명하라(리팩터링 도구 활용).
- 근거: 현대 도구로 이름 변경 비용은 낮다.
- 출처: Ch1, What Is Clean Code? (Ron Jeffries) — p. 10
- 태그: [일반]

**CC-A-033 둘 이상의 일을 하는 객체는 쪼개고, 메서드는 Extract Method**
- 규칙: 객체가 둘 이상의 일을 하면 여러 객체로 나누고, 메서드가 둘 이상의 일을 하면 Extract Method로 "무엇"을 말하는 메서드와 "어떻게"를 담는 하위 메서드로 나눠라.
- 근거: 표현력은 이름을 넘어 책임 분리까지 포함한다.
- 출처: Ch1, What Is Clean Code? (Ron Jeffries) — p. 11
- 태그: [일반]

**CC-A-034 단순한 추상화를 일찍 만든다 (예: 컬렉션 검색 감싸기)**
- 규칙: "컬렉션에서 찾기" 같은 반복 요소는 구체 구현을 더 추상적인 메서드·클래스로 감싸라.
- 근거: 구현(예: 해시맵)을 언제든 바꿀 수 있고, 실제로 필요한 몇 가지 검색 방식에만 집중하게 된다.
- 출처: Ch1, What Is Clean Code? (Ron Jeffries) — p. 11
- 태그: [일반]

**CC-A-035 놀람 최소: 읽는 루틴마다 예상대로 (Ward Cunningham)**
- 규칙: 각 루틴이 독자가 예상한 그대로 동작하고 읽히도록 작성하라.
- 근거: 깨끗한 코드를 읽을 땐 놀라지 않는다. 각 모듈이 다음 모듈의 무대를 마련한다.
- 출처: Ch1, What Is Clean Code? (Ward Cunningham) — p. 11–12
- 태그: [일반]

**CC-A-036 언어가 그 문제를 위해 만들어진 것처럼 보이게**
- 규칙: 언어 탓을 하지 말고, 그 문제를 위해 만든 언어처럼 보이도록 코드를 작성하라.
- 근거: 프로그램을 단순해 보이게 하는 것은 언어가 아니라 프로그래머다.
- 출처: Ch1, What Is Clean Code? — p. 12
- 태그: [일반]

### Schools of Thought — p. 12–13
(실천 규칙 없음: 이 책은 Object Mentor 학파의 견해이며 다른 학파에서도 배울 것.)

### We Are Authors — p. 13–14

**CC-A-037 읽기 쉽게 쓴다 — 쓰기가 다소 어려워지더라도**
- 규칙: 코드를 쓸 때 독자를 위한 저자로서, 쓰기가 더 어려워지더라도 읽기 쉬운 쪽을 택하라.
- 근거: 읽기:쓰기 시간 비율은 10:1을 넘고, 주변 코드가 읽기 쉬워야 새 코드도 쓰기 쉽다.
- 출처: Ch1, We Are Authors — p. 13–14
- 태그: [일반]

### The Boy Scout Rule — p. 14

**CC-A-038 보이스카우트 규칙 (The Boy Scout Rule)**
- 규칙: 체크아웃했을 때보다 조금이라도 더 깨끗하게 체크인하라(변수 이름 하나 개선, 큰 함수 하나 분리, 작은 중복 하나 제거, 복합 if 하나 정리).
- 근거: 모두가 그렇게 하면 코드는 부패할 수 없다. 지속적 개선은 전문성의 본질.
- 출처: Ch1, The Boy Scout Rule — p. 14
- 태그: [일반]

### Prequel and Principles — p. 15

**CC-A-039 객체지향 설계 원칙(SRP·OCP·DIP)을 코드 수준에서 적용**
- 규칙: 단일 책임 원칙(SRP), 개방-폐쇄 원칙(OCP), 의존성 역전 원칙(DIP)을 코드 작성 시 적용하라.
- 근거: 이 책은 PPP의 원칙을 코드 수준에서 되풀이한다.
- 출처: Ch1, Prequel and Principles — p. 15
- 태그: [일반]

### Conclusion / Bibliography — p. 15
(실천 규칙 없음: "연습하라".)

---

## Chapter 2: Meaningful Names (by Tim Ottinger)

### Introduction — p. 17–18
(이름 짓기는 많이 하므로 잘해야 한다 — 이하 규칙들의 서론.)

### Use Intention-Revealing Names — p. 18–19

**CC-A-040 의도를 드러내는 이름 (Use Intention-Revealing Names)**
- 규칙: 변수·함수·클래스 이름이 존재 이유, 하는 일, 사용법을 답하게 하라 — 이름에 주석이 필요하면 다시 지어라.
- 근거: 좋은 이름은 시간이 들지만 그 이상을 절약한다.
- 위반 예 → 개선 예: `int d; // elapsed time in days` → `int elapsedTimeInDays;`
- 출처: Ch2, Use Intention-Revealing Names — p. 18
- 태그: [일반]

**CC-A-041 측정값 이름에 측정 대상과 단위를 포함**
- 규칙: 측정값을 담는 이름에는 무엇을 측정하는지와 단위를 함께 넣어라.
- 근거: `d`는 경과 시간도 일 단위도 떠올리게 하지 않는다.
- 위반 예 → 개선 예: `d` → `daysSinceCreation`, `fileAgeInDays`
- 출처: Ch2, Use Intention-Revealing Names — p. 18
- 태그: [일반]

**CC-A-042 맥락을 코드에 명시 — 암묵성(implicity) 제거**
- 규칙: 컨테이너 내용, 인덱스의 의미, 상수 값의 의미, 반환값 사용법 등 독자가 알아야 할 맥락을 이름으로 코드에 드러내라.
- 근거: 문제는 코드의 복잡성이 아니라 맥락이 코드에 명시되지 않은 정도다.
- 위반 예 → 개선 예: `getThem()`/`theList`/`x[0] == 4` → `getFlaggedCells()`/`gameBoard`/`cell[STATUS_VALUE] == FLAGGED`
- 출처: Ch2, Use Intention-Revealing Names — p. 18–19
- 태그: [일반]

**CC-A-043 원시 배열 대신 의도를 드러내는 작은 클래스 + 술어 메서드로 매직 넘버 숨기기**
- 규칙: 의미 있는 개념을 int 배열 같은 원시 구조로 표현하지 말고 작은 클래스로 만들고, `isFlagged()` 같은 의도 드러내는 메서드로 매직 넘버를 숨겨라.
- 근거: 이름만 바꿔도 무슨 일이 일어나는지 이해하기 어렵지 않게 된다.
- 위반 예 → 개선 예: `int[] cell; cell[0]==4` → `Cell cell; cell.isFlagged()`
- 출처: Ch2, Use Intention-Revealing Names — p. 19
- 태그: [일반]

### Avoid Disinformation — p. 19–20

**CC-A-044 그릇된 정보를 피하라 — 고착된 다른 의미를 가진 단어 금지 (Avoid Disinformation)**
- 규칙: 플랫폼 이름 등 이미 널리 다른 뜻으로 쓰이는 단어(예: hp, aix, sco)를 이름이나 약어로 쓰지 마라.
- 근거: 의도와 다른 고착된 의미가 거짓 단서를 남긴다.
- 출처: Ch2, Avoid Disinformation — p. 19
- 태그: [일반]

**CC-A-045 실제 타입이 아닌 컨테이너 타입 단어를 이름에 넣지 않는다**
- 규칙: 실제로 List가 아닌 것을 `accountList`라 부르지 말고 `accountGroup`, `bunchOfAccounts`, `accounts`처럼 지어라(실제 List여도 타입 인코딩은 피하는 게 낫다).
- 근거: "list"는 프로그래머에게 특정 의미가 있어 잘못된 결론을 유도한다.
- 출처: Ch2, Avoid Disinformation — p. 19 (각주 1)
- 태그: [일반]

**CC-A-046 아주 조금만 다른 이름을 피한다**
- 규칙: 모양이 매우 비슷해 구별이 어려운 이름(예: `XYZControllerForEfficientHandlingOfStrings` vs `...StorageOfStrings`)을 만들지 마라.
- 근거: 미세한 차이를 알아채는 데 오래 걸린다.
- 출처: Ch2, Avoid Disinformation — p. 20
- 태그: [일반]

**CC-A-047 비슷한 개념은 비슷하게 표기 — 일관된 철자**
- 규칙: 유사한 개념은 일관된 철자로 짓고, 비슷한 것들의 이름이 알파벳순으로 모이면서 차이는 뚜렷하게 하라.
- 근거: 일관성 없는 표기는 그릇된 정보이며, 자동완성으로 이름만 보고 고르는 개발자를 오도한다.
- 출처: Ch2, Avoid Disinformation — p. 20
- 태그: [일반]

**CC-A-048 소문자 l·대문자 O를 변수명으로 쓰지 않는다**
- 규칙: 숫자 1·0과 혼동되는 소문자 `l`이나 대문자 `O`를 변수명으로 쓰지 마라.
- 근거: 폰트 변경 같은 구전 해결책 대신 이름 변경으로 확실히 해결된다.
- 위반 예: `if ( O == l ) a = O1; else l = 01;`
- 출처: Ch2, Avoid Disinformation — p. 20
- 태그: [일반]

### Make Meaningful Distinctions — p. 20–21

**CC-A-049 의미 있게 구분하라 — 컴파일러만 만족시키는 이름 변경 금지 (Make Meaningful Distinctions)**
- 규칙: 같은 스코프 충돌을 피하려고 철자를 일부러 틀리거나(예: `klass`) 임의로 바꾸지 말고, 이름이 다르면 의미도 다르게 하라.
- 근거: 철자 오류를 고치면 컴파일이 깨지는 기이한 상황이 생긴다.
- 출처: Ch2, Make Meaningful Distinctions — p. 20 (각주 2)
- 태그: [일반]

**CC-A-050 숫자 연번 이름 금지 (a1, a2, … aN)**
- 규칙: `a1`, `a2` 같은 연번 이름 대신 역할을 드러내는 이름(예: `source`, `destination`)을 써라.
- 근거: 연번 이름은 정보가 전혀 없다(noninformative).
- 위반 예 → 개선 예: `copyChars(char a1[], char a2[])` → `copyChars(char source[], char destination[])`
- 출처: Ch2, Make Meaningful Distinctions — p. 21
- 태그: [일반]

**CC-A-051 불용어(noise words)로 구분하지 않는다 — Info, Data, Object, a/the**
- 규칙: `Product`/`ProductInfo`/`ProductData`, `Customer`/`CustomerObject`, `zork`/`theZork`처럼 의미 없는 접미·접두어로 이름을 구분하지 마라.
- 근거: Info·Data는 a·an·the 같은 불용어로, 다르게 만들었을 뿐 다른 의미를 주지 않는다.
- 출처: Ch2, Make Meaningful Distinctions — p. 21
- 태그: [일반]

**CC-A-052 접두 관례는 의미 있는 구분일 때만**
- 규칙: a·the 같은 접두어 관례는 일관된 의미 구분(예: 모든 지역변수 a, 모든 인자 the)을 할 때만 써라.
- 근거: 이미 `zork`가 있어서 `theZork`를 만드는 것이 문제다(저자는 IDE 덕에 이 관례도 버림).
- 출처: Ch2, Make Meaningful Distinctions — p. 21 (각주 3)
- 태그: [일반]

**CC-A-053 이름에 중복된 타입 단어 금지 (variable, table, String)**
- 규칙: 변수명에 "variable", 테이블명에 "table", `NameString`처럼 이미 자명한 종류 단어를 넣지 마라.
- 근거: 불용어는 중복이다. Name이 부동소수일 리 없다.
- 출처: Ch2, Make Meaningful Distinctions — p. 21
- 태그: [일반]

**CC-A-054 독자가 차이를 알 수 있게 구분한다**
- 규칙: `getActiveAccount()`/`getActiveAccounts()`/`getActiveAccountInfo()`나 `moneyAmount`/`money`, `customerInfo`/`customer`, `accountData`/`account`, `theMessage`/`message`처럼 구별 불가능한 이름 쌍을 두지 말고, 차이가 무엇을 제공하는지 드러나게 하라.
- 근거: 어느 함수를 호출해야 할지 알 수 없다.
- 출처: Ch2, Make Meaningful Distinctions — p. 21
- 태그: [일반]

### Use Pronounceable Names — p. 21–22

**CC-A-055 발음할 수 있는 이름 (Use Pronounceable Names)**
- 규칙: 발음할 수 없는 약어 조합 대신 발음 가능한 영어 단어로 지어라.
- 근거: 프로그래밍은 사회적 활동이며 발음 못하면 토론할 수 없다.
- 위반 예 → 개선 예: `DtaRcrd102 { Date genymdhms; String pszqint; }` → `Customer { Date generationTimestamp; String recordId; }`
- 출처: Ch2, Use Pronounceable Names — p. 21–22
- 태그: [일반]

### Use Searchable Names — p. 22–23

**CC-A-056 검색하기 쉬운 이름 — 숫자 리터럴 대신 이름 붙은 상수 (Use Searchable Names)**
- 규칙: 의미 있는 숫자 상수에는 검색 가능한 이름(예: `MAX_CLASSES_PER_STUDENT`, `WORK_DAYS_PER_WEEK`)을 붙여라.
- 근거: `7`, `5` 같은 숫자는 grep으로 의도한 용도만 걸러낼 수 없고, 자릿수 바뀐 오타는 검색을 피해간다.
- 위반 예 → 개선 예: `s += (t[j]*4)/5;` → `realTaskWeeks = realTaskDays / WORK_DAYS_PER_WEEK;`
- 출처: Ch2, Use Searchable Names — p. 22–23
- 태그: [일반]

**CC-A-057 한 글자 이름은 짧은 메서드의 지역변수에서만**
- 규칙: 한 글자 이름(특히 `e` 같은 흔한 글자)은 짧은 메서드 안의 지역변수에만 쓰고, 여러 곳에서 보이거나 쓰이는 변수·상수에는 검색 친화적 이름을 붙여라.
- 근거: 이름 길이는 스코프 크기에 비례해야 한다 [N5].
- 출처: Ch2, Use Searchable Names — p. 22–23
- 태그: [일반]

### Avoid Encodings — p. 23–24

**CC-A-058 인코딩을 피하라 — 이름에 타입·스코프 정보 넣지 않기 (Avoid Encodings)**
- 규칙: 이름에 타입이나 스코프 정보를 인코딩하지 마라.
- 근거: 해독 부담을 늘리고, 발음이 어렵고, 오타 내기 쉽고, 신규 인원이 또 하나의 인코딩 "언어"를 배워야 한다.
- 출처: Ch2, Avoid Encodings — p. 23
- 태그: [일반]

**CC-A-059 헝가리안 표기법 금지 (Hungarian Notation)**
- 규칙: 헝가리안 표기법 등 타입 인코딩을 쓰지 마라 — 타입이 바뀌면 이름이 거짓이 된다.
- 근거: 현대 언어는 컴파일러가 타입을 강제하고, 인코딩은 이름·타입 변경을 어렵게 하고 독자를 오도한다.
- 위반 예: `PhoneNumber phoneString; // 타입 바뀌었는데 이름은 그대로`
- 출처: Ch2, Avoid Encodings / Hungarian Notation — p. 23–24
- 태그: [일반] (역사적 배경: Windows C API·Fortran 시대는 [Java특화] 아님, 언어 무관 원칙)

**CC-A-060 멤버 접두어 금지 (Member Prefixes: m_)**
- 규칙: 멤버 변수에 `m_` 같은 접두·접미어를 붙이지 말고, 클래스·함수를 작게 유지하고 멤버를 색으로 구분하는 편집기를 써라.
- 근거: 사람들은 곧 접두어를 무시하게 되고, 접두어는 보이지 않는 잡음이자 낡은 코드의 표식이 된다.
- 위반 예 → 개선 예: `private String m_dsc; setName(name){m_dsc=name;}` → `String description; setDescription(description){this.description=description;}`
- 출처: Ch2, Avoid Encodings / Member Prefixes — p. 24
- 태그: [일반]

**CC-A-061 인터페이스에 I 접두어를 붙이지 않는다 — 인코딩이 필요하면 구현 쪽에 (Interfaces and Implementations)**
- 규칙: 인터페이스는 장식 없이(`ShapeFactory`) 두고, 굳이 인코딩해야 한다면 구현 클래스 쪽(`ShapeFactoryImp`)에 붙여라.
- 근거: 사용자는 인터페이스를 받는다는 사실을 알 필요가 없다. 앞의 `I`는 방해이거나 과잉 정보다.
- 출처: Ch2, Avoid Encodings / Interfaces and Implementations — p. 24
- 태그: [일반]

### Avoid Mental Mapping — p. 25

**CC-A-062 자신의 기억력에 의존하는 이름 금지 (Avoid Mental Mapping)**
- 규칙: 독자가 머릿속에서 다른 개념으로 번역해야 하는 이름(예: url에서 호스트·스킴을 뗀 소문자 버전을 `r`로)을 쓰지 말고 문제·해법 영역 용어를 써라.
- 근거: 똑똑한 프로그래머와 전문가의 차이 — 명료함이 최고다.
- 출처: Ch2, Avoid Mental Mapping — p. 25
- 태그: [일반]

**CC-A-063 루프 카운터 i·j·k는 아주 작은 스코프에서만, l은 절대 금지**
- 규칙: 루프 카운터는 스코프가 매우 작고 충돌이 없을 때만 i, j, k를 쓰고 `l`은 쓰지 마라. 그 외에는 한 글자 이름을 쓰지 마라(a·b가 이미 있어서 c를 쓰는 것은 최악).
- 근거: 한 글자 이름은 독자가 실제 개념으로 매핑해야 하는 자리표시자다.
- 출처: Ch2, Avoid Mental Mapping — p. 25
- 태그: [일반]

### Class Names — p. 25

**CC-A-064 클래스 이름은 명사·명사구, 동사·모호어 금지 (Class Names)**
- 규칙: 클래스·객체 이름은 명사나 명사구(`Customer`, `WikiPage`, `Account`, `AddressParser`)로 짓고, `Manager`·`Processor`·`Data`·`Info` 같은 단어와 동사는 피하라.
- 근거: 책의 명명 규칙.
- 출처: Ch2, Class Names — p. 25
- 태그: [일반]

### Method Names — p. 25

**CC-A-065 메서드 이름은 동사·동사구 (Method Names)**
- 규칙: 메서드 이름은 동사나 동사구(`postPayment`, `deletePage`, `save`)로 지어라.
- 근거: 메서드는 행위를 나타낸다.
- 출처: Ch2, Method Names — p. 25
- 태그: [일반]

**CC-A-066 접근자·변경자·술어는 get/set/is 접두어 (JavaBean 표준)**
- 규칙: 접근자·변경자·술어는 값 이름을 따서 `get`, `set`, `is` 접두어를 붙여라.
- 근거: javabean 표준.
- 위반 예 → 개선 예: `employee.getName()`, `customer.setName("mike")`, `paycheck.isPosted()`
- 출처: Ch2, Method Names — p. 25
- 태그: [Java특화] (JavaBean 규약; 다른 언어는 그 언어의 표준 관례로 대체)

**CC-A-067 생성자 오버로딩 대신 인자를 설명하는 정적 팩토리 메서드**
- 규칙: 생성자를 오버로딩할 땐 인자를 설명하는 이름의 정적 팩토리 메서드를 제공하고, 필요하면 해당 생성자를 private으로 막아 사용을 강제하라.
- 근거: `Complex.FromRealNumber(23.0)`이 `new Complex(23.0)`보다 의미가 분명하다.
- 출처: Ch2, Method Names — p. 25
- 태그: [일반]

### Don't Be Cute — p. 26

**CC-A-068 기발한 이름 금지 — 재미보다 명료함 (Don't Be Cute)**
- 규칙: 유머·속어·문화 의존 농담(`HolyHandGrenade`, `whack()`, `eatMyShorts()`) 대신 의미를 그대로 말하는 이름(`DeleteItems`, `kill()`, `abort()`)을 써라.
- 근거: 기발한 이름은 같은 유머를 공유하고 그 농담을 기억하는 사람에게만 기억된다. 말하는 대로 의미하고, 의미하는 대로 말하라.
- 출처: Ch2, Don't Be Cute — p. 26
- 태그: [일반]

### Pick One Word per Concept — p. 26

**CC-A-069 한 개념에 한 단어 (Pick One Word per Concept)**
- 규칙: 하나의 추상 개념에는 하나의 단어를 골라 코드베이스 전체에서 일관되게 써라(`fetch`/`retrieve`/`get` 혼용 금지, `controller`/`manager`/`driver` 혼용 금지).
- 근거: IDE는 주석을 보여주지 않으므로 함수 이름은 홀로 서야 하고 일관되어야 한다. 일관된 어휘는 사용자에게 큰 이득이다.
- 출처: Ch2, Pick One Word per Concept — p. 26
- 태그: [일반]

### Don't Pun — p. 26–27

**CC-A-070 말장난 금지 — 한 단어를 두 목적으로 쓰지 않는다 (Don't Pun)**
- 규칙: 의미가 다른 연산에 "일관성"을 이유로 같은 단어를 쓰지 마라(두 값을 더하는 `add`가 있다면, 컬렉션에 넣는 메서드는 `insert`나 `append`로).
- 근거: 같은 용어로 다른 아이디어를 표현하면 말장난이다. 코드는 정독이 아니라 훑어 읽혀야 하며, 명료함의 책임은 저자에게 있다.
- 출처: Ch2, Don't Pun — p. 26–27
- 태그: [일반]

### Use Solution Domain Names — p. 27

**CC-A-071 해법 영역 이름 사용 (Use Solution Domain Names)**
- 규칙: 기술적 개념에는 전산 용어·알고리즘명·패턴명·수학 용어(예: `AccountVisitor`, `JobQueue`)를 써라.
- 근거: 코드를 읽는 사람은 프로그래머다. 모든 이름을 문제 영역에서 가져오면 동료가 고객에게 매번 물어야 한다.
- 출처: Ch2, Use Solution Domain Names — p. 27
- 태그: [일반]

### Use Problem Domain Names — p. 27

**CC-A-072 문제 영역 이름 사용 (Use Problem Domain Names)**
- 규칙: 적절한 프로그래머 용어가 없으면 문제 영역 용어를 쓰고, 문제 영역 개념에 가까운 코드는 문제 영역 이름을 써라.
- 근거: 유지보수자가 도메인 전문가에게 물어볼 수 있다. 해법·문제 영역 개념의 분리가 좋은 설계자의 일이다.
- 출처: Ch2, Use Problem Domain Names — p. 27
- 태그: [일반]

### Add Meaningful Context — p. 27–29

**CC-A-073 의미 있는 맥락 추가 — 클래스·함수·네임스페이스로 감싸기 (Add Meaningful Context)**
- 규칙: 홀로는 모호한 이름은 잘 지은 클래스·함수·네임스페이스로 감싸 맥락을 주고, 접두어(`addrState`)는 최후의 수단으로만 써라.
- 근거: `state` 하나만 보면 주소의 일부인지 알 수 없다. `Address` 클래스면 컴파일러도 안다.
- 출처: Ch2, Add Meaningful Context — p. 27–28
- 태그: [일반]

**CC-A-074 함께 쓰이는 변수 묶음은 클래스 필드로 만들고 긴 함수를 쪼갠다**
- 규칙: 긴 함수 전체에 걸쳐 쓰이는 관련 변수들은 맥락을 드러내는 클래스(예: `GuessStatisticsMessage`)의 필드로 옮기고, 알고리즘을 작은 함수들로 분해하라.
- 근거: 맥락이 함수 이름과 알고리즘에서만 추론되면 변수 의미가 불투명하다.
- 위반 예 → 개선 예: `printGuessStatistics` 안의 `number/verb/pluralModifier` → `GuessStatisticsMessage.make()` + `thereAreNoLetters()/thereIsOneLetter()/thereAreManyLetters()`
- 출처: Ch2, Add Meaningful Context (Listing 2-1, 2-2) — p. 28–29
- 태그: [일반]

### Don't Add Gratuitous Context — p. 29–30

**CC-A-075 불필요한 맥락 금지 — 앱 이름 접두어 등 (Don't Add Gratuitous Context)**
- 규칙: 모든 클래스에 애플리케이션 약어(예: `GSD`) 같은 접두어를 붙이지 마라.
- 근거: 자동완성 목록이 수천 개로 늘어 도구를 방해하고, `GSDAccountAddress`의 17자 중 10자가 중복·무관하다.
- 출처: Ch2, Don't Add Gratuitous Context — p. 29
- 태그: [일반]

**CC-A-076 명확하다면 짧은 이름이 낫다 — 필요 이상 맥락 금지**
- 규칙: 명확함을 잃지 않는 한 짧은 이름을 택하고, 필요 이상의 맥락을 이름에 넣지 마라.
- 근거: 정밀함이 모든 이름 짓기의 목적이다.
- 출처: Ch2, Don't Add Gratuitous Context — p. 30
- 태그: [일반]

**CC-A-077 클래스 이름과 인스턴스 이름의 구분 — 클래스는 일반·정밀하게**
- 규칙: `accountAddress`·`customerAddress`는 `Address` 인스턴스 이름으로 쓰고 클래스 이름은 `Address`로 하라. 종류를 구분해야 하면 `PostalAddress`, `MAC`, `URI`처럼 더 정밀한 이름을 써라.
- 근거: 결과 이름이 더 정밀하다.
- 출처: Ch2, Don't Add Gratuitous Context — p. 30
- 태그: [일반]

### Final Words — p. 30

**CC-A-078 더 나은 이름으로의 개명을 두려워하지 않는다**
- 규칙: 다른 개발자의 반대를 걱정하지 말고 더 나은 이름으로 개명하라. 남의 코드를 유지보수할 땐 리팩터링 도구로 이름 문제를 해결하라.
- 근거: 이름은 외우는 것이 아니라 도구로 다루며, 코드가 문단·문장(또는 표·자료구조)처럼 읽히는지에 집중해야 한다.
- 출처: Ch2, Final Words — p. 30
- 태그: [일반]

---

## Chapter 3: Functions

### (도입부) — p. 31–34

**CC-A-079 함수는 읽는 사람이 3분 안에 의도를 파악할 수 있게 (Listing 3-1 → 3-2)**
- 규칙: 중복 코드, 이상한 문자열, 낯선 타입·API, 플래그로 제어되는 이중 중첩 if가 한 함수에 섞이지 않게 메서드 추출·개명·재구조화를 적용하라.
- 근거: 추상화 수준이 너무 많이 섞인 함수는 3분 동안 봐도 이해되지 않는다. 몇 번의 추출로 9줄짜리 의도 드러내는 함수가 된다.
- 위반 예 → 개선 예: `testableHtml(...)` (수십 줄) → `renderPageWithSetupsAndTeardowns(...)` (9줄)
- 출처: Ch3, 도입부 (Listing 3-1, 3-2) — p. 32–34
- 태그: [일반]

### Small! — p. 34–35

**CC-A-080 작게! 그리고 더 작게! (Small!)**
- 규칙: 함수는 작게, 그보다 더 작게 만들어라 — 20줄을 넘기는 일은 거의 없게 하고, 이상적으로는 2~4줄로 각자 한 이야기를 하며 다음 함수로 이끌게 하라.
- 근거: 40년 시행착오의 경험. Kent Beck의 Sparkle 프로그램은 모든 함수가 2~4줄이고 투명하게 명백했다.
- 위반 예 → 개선 예: Listing 3-2(9줄) → Listing 3-3(`if (isTestPage(pageData)) includeSetupAndTeardownPages(pageData, isSuite); return pageData.getHtml();`)
- 출처: Ch3, Small! — p. 34–35
- 태그: [일반]

**CC-A-081 줄 길이 제한 — 150자 금지**
- 규칙: 한 줄이 150자에 이르지 않게 하라(함수도 100줄 금지).
- 근거: 큰 모니터에 들어간다고 길게 써도 되는 것은 아니다.
- 출처: Ch3, Small! — p. 34
- 태그: [일반]

**CC-A-082 블록은 한 줄, 그 한 줄은 대개 함수 호출 (Blocks and Indenting)**
- 규칙: if·else·while 등의 블록 본문은 한 줄로 만들고, 그 줄은 서술적인 이름의 함수 호출로 하라.
- 근거: 바깥 함수가 작아지고, 호출된 함수의 이름이 문서 역할을 한다.
- 출처: Ch3, Small! / Blocks and Indenting — p. 35
- 태그: [일반]

**CC-A-083 들여쓰기 수준은 1~2단계까지**
- 규칙: 함수 안에 중첩 구조가 들어갈 만큼 크게 만들지 말고, 들여쓰기 수준을 1~2단계 이하로 유지하라.
- 근거: 읽고 이해하기 쉬워진다.
- 출처: Ch3, Small! / Blocks and Indenting — p. 35
- 태그: [일반]

### Do One Thing — p. 35–36

**CC-A-084 한 가지만 하라 (Do One Thing)**
- 규칙: 함수는 한 가지 일만 하고, 그 일을 잘하고, 그 일만 하게 하라.
- 근거: 30년 넘게 반복된 조언. 버퍼 생성·페이지 조회·경로 렌더·문자열 추가·HTML 생성을 한 함수에서 하면 여러 일을 하는 것이다.
- 출처: Ch3, Do One Thing — p. 35
- 태그: [일반]

**CC-A-085 "한 가지"의 판정: 함수 이름 아래 한 단계 추상화 단계들만 수행 (TO 문단 테스트)**
- 규칙: 함수를 "TO <함수이름>, 우리는 …한다"라는 짧은 TO 문단으로 기술했을 때 모든 단계가 이름보다 정확히 한 단계 낮은 추상화 수준이면 한 가지 일로 판정하라.
- 근거: 함수를 만드는 이유는 큰 개념(이름)을 다음 추상화 수준의 단계들로 분해하는 것이다.
- 출처: Ch3, Do One Thing — p. 36
- 태그: [일반]

**CC-A-086 구현을 단순 재진술하지 않는 이름으로 함수를 더 추출할 수 있으면 여러 일을 하는 것이다**
- 규칙: 구현을 그대로 다시 말하는 수준이 아닌 이름으로 다른 함수를 추출할 수 있다면, 그 함수는 여러 일을 하는 것이므로 추출하라.
- 근거: `includeSetupsAndTeardownsIfTestPage`처럼 코드를 재진술할 뿐인 추출은 추상화 수준을 바꾸지 않는다 [G34].
- 출처: Ch3, Do One Thing — p. 36
- 태그: [일반]

**CC-A-087 함수 내 섹션 금지 (Sections within Functions)**
- 규칙: 함수가 선언부·초기화·본처리(예: declarations, initializations, sieve)처럼 섹션으로 나뉜다면 각 섹션을 별도 함수로 분리하라.
- 근거: 한 가지 일을 하는 함수는 의미 있게 섹션으로 나눌 수 없다. 섹션은 여러 일을 한다는 명백한 증상이다.
- 출처: Ch3, Do One Thing / Sections within Functions — p. 36
- 태그: [일반]

### One Level of Abstraction per Function — p. 36–37

**CC-A-088 함수당 추상화 수준은 하나 (One Level of Abstraction per Function)**
- 규칙: 함수 안의 모든 문장을 같은 추상화 수준으로 맞춰라(예: `getHtml()` 같은 고수준과 `.append("\n")` 같은 저수준을 섞지 마라).
- 근거: 섞이면 어떤 표현이 핵심 개념이고 어떤 것이 세부인지 구분할 수 없고, 깨진 유리창처럼 세부가 계속 달라붙는다.
- 출처: Ch3, One Level of Abstraction per Function — p. 36–37
- 태그: [일반]

**CC-A-089 위에서 아래로 읽기: 내려가기 규칙 (The Stepdown Rule)**
- 규칙: 각 함수 바로 아래에 그 함수가 호출하는 다음 추상화 수준의 함수가 오도록 배치해, 위에서 아래로 한 단계씩 추상화 수준을 내려가며 TO 문단들처럼 읽히게 하라.
- 근거: 코드가 하향식 서사처럼 읽혀야 하며, 이는 함수를 짧게 유지하고 한 가지 일만 하게 하는 핵심 기법이다.
- 출처: Ch3, Reading Code from Top to Bottom: The Stepdown Rule — p. 37 (Listing 3-7 p. 50–52)
- 태그: [일반]

### Switch Statements — p. 37–39

**CC-A-090 switch(및 if/else 체인)는 저수준 클래스에 묻고 반복하지 않는다 — 다형성 사용 (Switch Statements)**
- 규칙: 타입에 따라 분기하는 switch·if/else 체인을 여러 함수(`calculatePay`, `isPayday`, `deliverPay` …)에 반복하지 말고, 추상 팩토리 안에 한 번만 두어 다형적 객체를 생성하고 나머지 연산은 인터페이스를 통한 다형성으로 디스패치하라.
- 근거: switch는 본질적으로 N가지 일을 하고, 커지며, SRP(변경 이유가 여럿)와 OCP(새 타입마다 수정)를 위반하고, 같은 구조의 함수가 무한히 생긴다.
- 위반 예 → 개선 예: `calculatePay(Employee e){ switch(e.type){...} }` → `abstract class Employee { calculatePay(); }` + `EmployeeFactoryImpl.makeEmployee()` 안에만 switch
- 출처: Ch3, Switch Statements (Listing 3-4, 3-5) — p. 37–39
- 태그: [일반]

**CC-A-091 switch 허용 조건**
- 규칙: switch는 ①단 한 번만 나타나고 ②다형적 객체 생성에만 쓰이며 ③상속 관계 뒤에 숨어 시스템 나머지에 보이지 않을 때만 허용하라 [G23].
- 근거: 저자의 일반 규칙(상황에 따라 예외는 있음).
- 출처: Ch3, Switch Statements — p. 38–39
- 태그: [일반]

**CC-A-092 알 수 없는 타입은 default에서 예외를 던진다 (예제에서 시연)**
- 규칙: 타입 분기의 default 경우에는 조용히 넘어가지 말고 명시적 예외(예: `InvalidEmployeeType`)를 던져라.
- 근거: Listing 3-4/3-5가 모든 분기에 `default: throw new InvalidEmployeeType(...)`을 둔다.
- 출처: Ch3, Switch Statements (Listing 3-4, 3-5) — p. 38–39
- 태그: [일반]

### Use Descriptive Names — p. 39–40

**CC-A-093 서술적인 이름을 사용하라 (Use Descriptive Names)**
- 규칙: 함수가 하는 일을 잘 설명하는 이름을 붙여라(예: `testableHtml` → `SetupTeardownIncluder.render`, private 메서드도 `isTestable`, `includeSetupAndTeardownPages`처럼).
- 근거: 작고 한 가지만 하는 함수에 좋은 이름을 붙이는 것이 "예상대로인 코드"의 절반이다. 함수가 작을수록 서술적 이름 짓기가 쉽다.
- 출처: Ch3, Use Descriptive Names — p. 39
- 태그: [일반]

**CC-A-094 긴 이름을 두려워하지 마라**
- 규칙: 짧고 수수께끼 같은 이름이나 긴 설명 주석 대신 길고 서술적인 이름을 쓰고, 여러 단어가 쉽게 읽히는 명명 관례를 사용하라.
- 근거: 긴 서술적 이름 > 짧은 수수께끼 이름, 긴 서술적 이름 > 긴 서술적 주석.
- 출처: Ch3, Use Descriptive Names — p. 39
- 태그: [일반]

**CC-A-095 이름 선택에 시간을 쓰고 여러 후보로 코드를 읽어본다**
- 규칙: 여러 이름을 시도해 각각을 넣은 채로 코드를 읽어보고, IDE의 이름 변경으로 가장 서술적인 이름을 찾을 때까지 실험하라.
- 근거: 좋은 이름을 찾는 과정이 모듈 설계를 명확히 하고 종종 유익한 재구조화로 이어진다.
- 출처: Ch3, Use Descriptive Names — p. 40
- 태그: [일반]

**CC-A-096 이름에 일관된 구문·명사·동사를 사용**
- 규칙: 모듈 내 함수 이름에 같은 구문·명사·동사를 일관되게 써서(예: `includeSetupAndTeardownPages`, `includeSetupPages`, `includeSuiteSetupPage`, `includeSetupPage`) 이름의 나열이 이야기를 하게 하라.
- 근거: 비슷한 어구 덕분에 독자는 빠진 짝(`includeTeardownPages` 등)까지 예상할 수 있다.
- 출처: Ch3, Use Descriptive Names — p. 40
- 태그: [일반]

### Function Arguments — p. 40–41

**CC-A-097 인수 개수는 0 > 1 > 2, 3은 피하고 4 이상은 금지 (Function Arguments)**
- 규칙: 함수 인수는 0개(niladic)를 이상으로, 1개(monadic), 2개(dyadic) 순으로 선호하고, 3개(triadic)는 가능하면 피하며, 4개 이상(polyadic)은 특별한 정당화가 있어도 쓰지 마라.
- 근거: 인수는 개념적 부담이 크고, 인수 조합이 늘수록 테스트 케이스 작성이 기하급수로 어려워진다.
- 출처: Ch3, Function Arguments — p. 40
- 태그: [일반]

**CC-A-098 함수 이름과 다른 추상화 수준의 인수를 넘기지 말고 필드로 승격**
- 규칙: 여러 private 메서드에 반복해 넘기는 세부 객체(예: `StringBuffer`)는 인수 대신 인스턴스 변수로 만들어라.
- 근거: `includeSetupPageInto(newPageContent)`보다 `includeSetupPage()`가 이해하기 쉽다. 인수는 이름과 다른 추상화 수준의 세부를 알게 강요한다.
- 출처: Ch3, Function Arguments — p. 40 (Listing 3-7)
- 태그: [일반]

**CC-A-099 출력 인수는 입력 인수보다 이해하기 어렵다 — 피하라**
- 규칙: 정보를 인수로 내보내지 말고 반환값으로 내보내라.
- 근거: 독자는 정보가 인수로 들어오고 반환값으로 나간다고 기대해 출력 인수에 두 번 읽게 된다.
- 출처: Ch3, Function Arguments — p. 41
- 태그: [일반]

### Common Monadic Forms — p. 41

**CC-A-100 단항 함수는 "질문" 또는 "변환" 형식으로, 이름으로 구분 (Common Monadic Forms)**
- 규칙: 인수 하나를 받는 함수는 ①인수에 대해 질문하거나(`boolean fileExists("MyFile")`) ②인수를 변환해 반환하는(`InputStream fileOpen("MyFile")`) 형태로 만들고, 이름으로 그 구분을 명확히 하며 일관된 맥락에서 써라.
- 근거: 독자가 단항 함수에서 기대하는 두 가지 용도다.
- 출처: Ch3, Common Monadic Forms — p. 41
- 태그: [일반]

**CC-A-101 이벤트 형식의 단항 함수는 이벤트임이 분명하게**
- 규칙: 입력 인수로 시스템 상태를 바꾸고 출력이 없는 이벤트 함수(예: `void passwordAttemptFailedNtimes(int attempts)`)는 조심해서 쓰고, 이벤트라는 것이 이름과 맥락에서 분명하게 하라.
- 근거: 독자가 이것을 이벤트로 해석해야 한다.
- 출처: Ch3, Common Monadic Forms — p. 41
- 태그: [일반]

**CC-A-102 변환은 출력 인수가 아니라 반환값으로**
- 규칙: 위 형식에 맞지 않는 단항 함수(예: `void includeSetupPageInto(StringBuffer pageText)`)를 피하고, 입력을 변환한다면 결과를 반환값으로 내라 — 구현이 입력을 그대로 반환하더라도.
- 근거: `StringBuffer transform(StringBuffer in)`이 `void transform(StringBuffer out)`보다 낫다 — 적어도 변환의 형식을 따른다.
- 출처: Ch3, Common Monadic Forms — p. 41
- 태그: [일반]

### Flag Arguments — p. 41

**CC-A-103 플래그 인수 금지 — 함수를 둘로 나눈다 (Flag Arguments)**
- 규칙: boolean을 인수로 넘기지 말고, 참/거짓 각각에 해당하는 두 함수로 나눠라.
- 근거: 플래그 인수는 함수가 여러 일을 한다고 대놓고 공표하며, `render(true)`는 독자를 혼란스럽게 한다.
- 위반 예 → 개선 예: `render(boolean isSuite)` → `renderForSuite()`, `renderForSingleTest()`
- 출처: Ch3, Flag Arguments — p. 41
- 태그: [일반]

### Dyadic Functions — p. 42

**CC-A-104 이항 함수는 비용이 있다 — 무시하게 되는 인수가 버그 은신처 (Dyadic Functions)**
- 규칙: 인수 하나를 습관적으로 무시하게 되는 이항 함수(예: `writeField(outputStream, name)`)를 만들지 마라.
- 근거: 무시하는 코드 부분에 버그가 숨는다.
- 출처: Ch3, Dyadic Functions — p. 42
- 태그: [일반]

**CC-A-105 이항이 적절한 경우: 하나의 값의 순서 있는 구성요소**
- 규칙: 두 인수가 자연스러운 응집성과 자연스러운 순서를 가진 단일 값의 구성요소일 때만(예: `new Point(0,0)`) 이항 함수를 자연스럽게 써라.
- 근거: `outputStream`과 `name`은 응집성도 순서도 없다. `assertEquals(expected, actual)`처럼 자연 순서가 없는 인수는 순서를 뒤바꾸는 실수를 낳는다.
- 출처: Ch3, Dyadic Functions — p. 42
- 태그: [일반]

**CC-A-106 이항을 단항으로 바꾸는 기법**
- 규칙: 이항 함수는 가능하면 단항으로 바꿔라 — ①메서드를 인수 객체의 멤버로 옮기거나(`outputStream.writeField(name)`) ②인수를 현재 클래스의 멤버 변수로 만들거나 ③인수를 생성자로 받는 새 클래스(`FieldWriter`)를 추출하라.
- 근거: 이항은 악은 아니지만 비용이 있으므로 사용 가능한 메커니즘을 활용해 줄여야 한다.
- 출처: Ch3, Dyadic Functions — p. 42 (각주 10)
- 태그: [일반]

### Triads — p. 42

**CC-A-107 삼항 함수는 신중히 (Triads)**
- 규칙: 인수 3개짜리 함수를 만들기 전에 매우 신중하게 재고하라(예: `assertEquals(message, expected, actual)`은 message를 expected로 오독하게 한다).
- 근거: 순서·멈칫함·무시의 문제가 두 배 이상이 된다. 단, `assertEquals(1.0, amount, .001)`처럼 부동소수 상대 비교를 상기시키는 경우는 그 멈칫함이 가치 있다.
- 출처: Ch3, Triads — p. 42
- 태그: [일반]

### Argument Objects — p. 43

**CC-A-108 인수 객체: 함께 다니는 인수들을 클래스로 묶는다 (Argument Objects)**
- 규칙: 인수가 2~3개를 넘어가야 할 것 같으면 함께 전달되는 변수들을 독자적인 이름을 가진 클래스로 묶어라.
- 근거: 함께 전달되는 변수 묶음은 고유 이름을 가질 자격이 있는 개념의 일부일 가능성이 크다 — 속임수가 아니다.
- 위반 예 → 개선 예: `makeCircle(double x, double y, double radius)` → `makeCircle(Point center, double radius)`
- 출처: Ch3, Argument Objects — p. 43
- 태그: [일반]

### Argument Lists — p. 43

**CC-A-109 가변 인수는 하나의 List 인수로 센다 — 총 3개 이하 (Argument Lists)**
- 규칙: 동일하게 취급되는 가변 인수는 List 타입 인수 하나로 간주하고, 가변 인수 함수도 단항·이항·삼항까지만 허용하라(그 이상 금지).
- 근거: `String.format(String format, Object... args)`는 사실상 이항이다.
- 출처: Ch3, Argument Lists — p. 43
- 태그: [일반]

### Verbs and Keywords — p. 43

**CC-A-110 단항 함수는 동사/명사 쌍으로 (Verbs and Keywords)**
- 규칙: 단항 함수의 이름과 인수가 좋은 동사/명사 쌍을 이루게 하라(`write(name)`보다 `writeField(name)`이 더 좋다).
- 근거: 함수 이름이 함수의 의도와 인수의 순서·의도를 설명한다.
- 출처: Ch3, Verbs and Keywords — p. 43
- 태그: [일반]

**CC-A-111 키워드 형식: 인수 이름을 함수 이름에 넣는다**
- 규칙: 인수 순서를 기억해야 하는 함수는 인수 이름을 함수 이름에 인코딩하라(예: `assertEquals` → `assertExpectedEqualsActual(expected, actual)`).
- 근거: 인수 순서를 기억해야 하는 문제를 크게 완화한다.
- 출처: Ch3, Verbs and Keywords — p. 43
- 태그: [일반]

### Have No Side Effects — p. 44

**CC-A-112 부수 효과를 일으키지 마라 (Have No Side Effects)**
- 규칙: 함수가 이름으로 약속한 한 가지 외에 클래스 변수·인수·시스템 전역을 몰래 바꾸지 않게 하라.
- 근거: 부수 효과는 거짓말이며 이상한 시간적 결합과 순서 의존성을 만든다.
- 위반 예: `checkPassword(userName, password)` 안에서 `Session.initialize()` 호출 — 호출자가 세션 데이터를 날릴 위험.
- 출처: Ch3, Have No Side Effects (Listing 3-6) — p. 44
- 태그: [일반]

**CC-A-113 시간적 결합이 불가피하면 함수 이름에 드러낸다 (Temporal Coupling)**
- 규칙: 특정 시점에만 호출해야 하는 시간적 결합이 꼭 필요하면 이를 함수 이름에 명시하라(예: `checkPasswordAndInitializeSession`) — 단 이는 "한 가지만" 규칙을 위반한다는 점을 인식하라.
- 근거: 부수 효과로 숨겨진 시간적 결합은 특히 혼란스럽다.
- 출처: Ch3, Have No Side Effects — p. 44
- 태그: [일반]

### Output Arguments — p. 45

**CC-A-114 출력 인수를 피하고 소유 객체의 상태를 바꾼다 (Output Arguments)**
- 규칙: 출력 인수를 쓰지 말고, 상태를 바꿔야 한다면 그 상태를 소유한 객체의 메서드로 만들어라(`appendFooter(s)` → `report.appendFooter()`).
- 근거: 함수 시그니처를 확인하게 만드는 것은 인지적 단절이다. OO 언어에서는 `this`가 출력 인수 역할을 한다.
- 출처: Ch3, Have No Side Effects / Output Arguments — p. 45
- 태그: [일반]

### Command Query Separation — p. 45–46

**CC-A-115 명령과 조회를 분리하라 (Command Query Separation)**
- 규칙: 함수는 객체 상태를 변경하거나(명령) 객체 정보를 반환하거나(조회) 둘 중 하나만 하게 하라.
- 근거: `if (set("username", "unclebob"))`는 set이 동사인지 형용사인지 모호하다. 이름을 `setAndCheckIfExists`로 바꿔도 해결되지 않는다.
- 위반 예 → 개선 예: `if (set("username","unclebob"))` → `if (attributeExists("username")) { setAttribute("username","unclebob"); }`
- 출처: Ch3, Command Query Separation — p. 45–46
- 태그: [일반]

### Prefer Exceptions to Returning Error Codes — p. 46–48

**CC-A-116 오류 코드보다 예외를 사용하라 (Prefer Exceptions to Returning Error Codes)**
- 규칙: 명령 함수에서 오류 코드를 반환하지 말고 예외를 던져, 오류 처리 코드를 정상 경로 코드와 분리하라.
- 근거: 오류 코드 반환은 CQS의 미묘한 위반이고(명령을 if 조건식으로 쓰게 함), 호출자가 즉시 처리해야 해서 깊은 중첩을 만든다.
- 위반 예 → 개선 예: `if (deletePage(page) == E_OK) { if (...== E_OK) {...} }` → `try { deletePage(page); registry.deleteReference(...); ... } catch (Exception e) { logger.log(e.getMessage()); }`
- 출처: Ch3, Prefer Exceptions to Returning Error Codes — p. 46
- 태그: [일반]

**CC-A-117 try/catch 블록 본문을 별도 함수로 추출 (Extract Try/Catch Blocks)**
- 규칙: try 블록과 catch 블록의 본문을 각각 별도 함수로 추출하라(예: `delete()`는 오류 처리만, `deletePageAndAllReferences()`는 실제 처리만, `logError()`는 로깅만).
- 근거: try/catch는 코드 구조를 흐리고 오류 처리와 정상 처리를 섞는다. 분리하면 이해·수정이 쉬워진다.
- 출처: Ch3, Extract Try/Catch Blocks — p. 46–47
- 태그: [일반]

**CC-A-118 오류 처리도 한 가지 일이다 — try는 첫 단어, catch/finally 뒤엔 아무것도 없게 (Error Handling Is One Thing)**
- 규칙: 오류를 처리하는 함수는 오류 처리만 하게 하라 — 함수에 `try`가 있으면 함수의 맨 첫 단어여야 하고 catch/finally 블록 뒤에는 아무 코드도 없어야 한다.
- 근거: 함수는 한 가지 일을 해야 하고, 오류 처리는 한 가지 일이다.
- 출처: Ch3, Error Handling Is One Thing — p. 47
- 태그: [일반]

**CC-A-119 모든 오류 코드를 모은 Error enum/클래스(의존성 자석) 금지 (The Error.java Dependency Magnet)**
- 규칙: 모든 오류 코드를 정의한 공용 `Error` enum·클래스를 만들지 말고, 기존 예외 클래스를 상속한 새 예외로 오류를 추가하라.
- 근거: 그런 클래스는 수많은 클래스가 import하는 의존성 자석이 되어 변경 시 전부 재컴파일·재배포해야 하므로, 개발자가 새 코드를 추가하지 않고 옛 코드를 재사용하게 된다. 예외 파생은 재컴파일 없이 추가 가능(OCP).
- 출처: Ch3, The Error.java Dependency Magnet — p. 47–48
- 태그: [일반] (재컴파일·재배포 비용 논거는 Java 시대 배경이 강함)

### Don't Repeat Yourself — p. 48

**CC-A-120 반복하지 마라 (Don't Repeat Yourself, DRY)**
- 규칙: 다른 코드에 섞여 균일하지 않게 반복되는 알고리즘까지 찾아내 하나의 함수(예: `include(pageName, arg)`)로 통합하라.
- 근거: 중복은 코드를 부풀리고, 알고리즘 변경 시 N배 수정과 N배 누락 오류 기회를 만든다. 중복은 소프트웨어 모든 악의 근원일 수 있다.
- 출처: Ch3, Don't Repeat Yourself — p. 48 (Listing 3-7)
- 태그: [일반]

### Structured Programming — p. 48–49

**CC-A-121 작은 함수에선 다중 return·break·continue 허용, goto는 금지 (Structured Programming)**
- 규칙: 함수를 작게 유지한다면 단일 진입·단일 출구 규칙에 얽매이지 말고 표현력을 높이는 경우 return·break·continue를 여러 번 써도 되지만, goto는 쓰지 마라.
- 근거: 다익스트라의 구조적 프로그래밍 규칙은 큰 함수에서만 큰 이점이 있다. goto는 큰 함수에서만 의미가 있다.
- 출처: Ch3, Structured Programming — p. 48–49
- 태그: [일반]

### How Do You Write Functions Like This? — p. 49

**CC-A-122 초안 후 다듬기 — 테스트를 유지하며 리팩터링 (How Do You Write Functions Like This?)**
- 규칙: 처음엔 길고 복잡하게 써도 되지만, 모든 줄을 덮는 단위 테스트를 먼저 갖춘 뒤 함수 분리·개명·중복 제거·메서드 축소와 재배치·클래스 추출을 테스트를 계속 통과시키며 반복해 규칙에 맞게 다듬어라.
- 근거: 글쓰기처럼 생각을 먼저 적고 읽기 좋게 다듬는다. 처음부터 이 규칙대로 쓸 수 있는 사람은 없다.
- 출처: Ch3, How Do You Write Functions Like This? — p. 49
- 태그: [일반]

### Conclusion — p. 49–50

**CC-A-123 시스템을 이야기로 — 함수는 동사, 클래스는 명사인 도메인 특화 언어로**
- 규칙: 함수들을 시스템의 동작을 기술하는 명확하고 정밀한 도메인 특화 언어(함수=동사, 클래스=명사)로 서로 잘 맞물리게 설계하라.
- 근거: 프로그래밍의 예술은 언어 설계의 예술이다. 진짜 목표는 시스템의 이야기를 들려주는 것이다.
- 출처: Ch3, Conclusion — p. 49–50
- 태그: [일반]

### SetupTeardownIncluder (Listing 3-7) — p. 50–52

**CC-A-124 정적 진입점 + private 생성자 + 인스턴스 필드로 상태 보관 (Listing 3-7이 시연)**
- 규칙: 여러 단계 처리를 하는 정적 함수는 공개 정적 진입점이 private 생성자로 인스턴스를 만들어 작업을 위임하게 하고, 단계 간 공유 데이터는 인수 대신 private 필드로 보관하며, 하위 단계 메서드는 모두 private으로 두라.
- 근거: Listing 3-7에서 `render(pageData)` → `new SetupTeardownIncluder(pageData).render(isSuite)`로 인수를 없애고 각 함수가 다음 함수를 소개하며 일관된 추상화 수준을 유지한다.
- 출처: Ch3, SetupTeardownIncluder (Listing 3-7) — p. 50–52
- 태그: [일반]

**CC-A-125 기존 호출자를 위한 기본값 오버로드로 리팩터링 범위 한정 (Listing 3-7이 시연)**
- 규칙: 리팩터링 범위를 해당 함수와 그 아래로 제한해야 할 때는 기존 시그니처를 유지하는 위임 오버로드(예: `render(pageData)` → `render(pageData, false)`)를 두어라.
- 근거: 저자는 호출자가 이미 플래그를 넘기고 있어 리팩터링 범위를 제한하려 플래그를 남겼다고 밝힌다(본래는 함수를 둘로 나눴어야 함).
- 출처: Ch3, Flag Arguments / SetupTeardownIncluder — p. 41, 50
- 태그: [일반]

**CC-A-126 술어는 이름 붙은 함수로 추출 (Listing 3-2/3-7이 시연)**
- 규칙: 조건식(예: `pageData.hasAttribute("Test")`)은 `isTestPage()` 같은 이름 붙은 술어 함수나 설명 변수로 추출하라.
- 근거: Listing 3-2 `boolean isTestPage = ...`, Listing 3-3/3-7 `isTestPage()` — 의도가 드러난다.
- 출처: Ch3, 도입부·Small!·SetupTeardownIncluder — p. 33, 35, 50
- 태그: [일반]

---

## Chapter 4: Comments

### (도입부) — p. 53–54

**CC-A-127 나쁜 코드에 주석 달지 말고 새로 짜라 ("Don't comment bad code—rewrite it.")**
- 규칙: 주석을 쓰고 싶어지면 먼저 코드로 의도를 표현할 방법이 없는지 고민하고, 가능하면 주석 대신 코드를 고쳐라.
- 근거: 주석은 기껏해야 필요악이며 코드로 의도를 표현하지 못한 실패를 보상하는 것이다(Kernighan & Plauger).
- 출처: Ch4, 도입부 — p. 53–54
- 태그: [일반]

**CC-A-128 주석은 거짓말을 한다 — 진실의 유일한 원천은 코드**
- 규칙: 주석을 최소화하고, 쓴 주석은 그것이 설명하는 코드 바로 옆에 두어 코드가 바뀔 때 함께 유지하라.
- 근거: 주석은 오래될수록, 코드에서 멀어질수록 틀리기 쉽다(예: `HTTP_DATE_REGEXP`와 그 예시 주석 사이에 다른 필드가 끼어듦). 부정확한 주석은 주석이 없는 것보다 훨씬 나쁘다.
- 출처: Ch4, 도입부 — p. 54
- 태그: [일반]

### Comments Do Not Make Up for Bad Code — p. 55

**CC-A-129 주석은 나쁜 코드를 보완하지 못한다 (Comments Do Not Make Up for Bad Code)**
- 규칙: 지저분한 코드를 설명하는 주석을 쓰는 대신 그 시간에 코드를 정리하라.
- 근거: 주석이 적고 명료한 코드가 주석이 많고 복잡한 코드보다 훨씬 낫다.
- 출처: Ch4, Comments Do Not Make Up for Bad Code — p. 55
- 태그: [일반]

### Explain Yourself in Code — p. 55

**CC-A-130 코드로 의도를 표현하라 — 주석 대신 같은 말을 하는 함수 (Explain Yourself in Code)**
- 규칙: 주석으로 설명하려는 조건·로직은 주석과 같은 말을 하는 이름의 함수로 추출하라.
- 근거: 몇 초만 생각하면 대부분의 의도를 코드로 표현할 수 있다.
- 위반 예 → 개선 예: `// Check to see if the employee is eligible for full benefits` + `if ((employee.flags & HOURLY_FLAG) && (employee.age > 65))` → `if (employee.isEligibleForFullBenefits())`
- 출처: Ch4, Explain Yourself in Code — p. 55
- 태그: [일반]

### Good Comments — p. 55–59

**CC-A-131 진짜 좋은 주석은 쓰지 않을 방법을 찾은 주석 (Good Comments)**
- 규칙: 아래의 "좋은 주석" 유형에 해당하더라도 먼저 주석 없이 표현할 방법을 찾아라.
- 근거: 유일하게 진짜 좋은 주석은 쓰지 않을 방법을 찾아낸 주석이다.
- 출처: Ch4, Good Comments — p. 55
- 태그: [일반]

**CC-A-132 법적 주석은 허용하되 외부 문서를 참조 (Legal Comments)**
- 규칙: 회사 표준이 요구하는 저작권·라이선스 주석은 파일 첫머리에 두되, 계약서나 법률 전문을 넣지 말고 표준 라이선스나 외부 문서를 참조하라.
- 근거: 법적 이유로 필요하고 합리적이지만, 잡음이 되어선 안 된다(IDE가 접어줌).
- 출처: Ch4, Legal Comments — p. 55–56
- 태그: [일반]

**CC-A-133 정보를 제공하는 주석 — 가능하면 이름으로 대체 (Informative Comments)**
- 규칙: 기본 정보(예: 정규식이 매칭하는 형식 `// format matched kk:mm:ss EEE, MMM dd, yyyy`)를 주석으로 줄 수 있지만, 가능하면 함수 이름(`responderInstance` → `responderBeingTested`)이나 전용 클래스(날짜·시간 형식 변환 클래스)로 옮겨 주석을 불필요하게 하라.
- 근거: 함수 이름으로 정보를 전달하는 편이 낫다.
- 출처: Ch4, Informative Comments — p. 56
- 태그: [일반]

**CC-A-134 의도를 설명하는 주석 (Explanation of Intent)**
- 규칙: 구현에 대한 정보를 넘어 결정 뒤의 의도(예: `return 1; // we are greater because we are the right type.`, "경쟁 조건을 만들려는 최선의 시도로 스레드를 많이 생성")를 주석으로 남겨라.
- 근거: 그 해법에 동의하지 않더라도 작성자가 무엇을 하려 했는지는 알 수 있다.
- 출처: Ch4, Explanation of Intent — p. 56–57
- 태그: [일반]

**CC-A-135 의미를 명료히 하는 주석 — 바꿀 수 없는 코드에만, 정확성 각별히 확인 (Clarification)**
- 규칙: 모호한 인수·반환값의 의미를 풀어주는 주석(예: `assertTrue(a.compareTo(b) == -1); // a < b`)은 표준 라이브러리 등 변경할 수 없는 코드에만 쓰고, 더 나은 방법이 없는지 확인한 뒤 정확성을 각별히 검증하라.
- 근거: 인수·반환값 자체를 명확하게 만드는 것이 낫고, 명료화 주석은 틀릴 위험이 크며 검증하기 어렵다.
- 출처: Ch4, Clarification — p. 57
- 태그: [일반]

**CC-A-136 결과를 경고하는 주석 (Warning of Consequences)**
- 규칙: 다른 프로그래머가 저지를 수 있는 위험한 결과(예: `//SimpleDateFormat is not thread safe, so we need to create each instance independently.`)는 주석으로 경고하라.
- 근거: 효율을 이유로 정적 초기화를 쓰려는 과잉 열성 프로그래머를 막는다.
- 출처: Ch4, Warning of Consequences — p. 58
- 태그: [일반]

**CC-A-137 테스트 비활성화는 이름 장난 대신 프레임워크의 ignore 기능 + 사유 문자열로**
- 규칙: 테스트를 끌 때는 메서드 이름 앞 밑줄 같은 관례 대신 테스트 프레임워크의 무시 기능에 설명 문자열을 붙여라(예: `@Ignore("Takes too long to run")`).
- 근거: JUnit 4 이전엔 `_testWithReallyBigFile` 관례 + 주석을 썼지만 지금은 속성으로 사유를 남긴다.
- 출처: Ch4, Warning of Consequences — p. 58
- 태그: [Java특화] (JUnit 3→4 세부. 원칙 "비활성화 사유를 프레임워크 기능으로 명시"는 일반)

**CC-A-138 TODO 주석은 허용하되 나쁜 코드의 핑계로 쓰지 말고 주기적으로 정리 (TODO Comments)**
- 규칙: 지금 할 수 없는 작업(퇴화 구현의 이유와 미래, 폐기 예정 기능 삭제, 다른 사람 검토 요청, 더 나은 이름 요청, 예정된 이벤트에 의존하는 변경)은 `//TODO`로 남길 수 있지만, 나쁜 코드를 남기는 핑계로 쓰지 말고 정기적으로 훑어 제거 가능한 것을 없애라.
- 근거: IDE가 TODO를 찾아주지만, 코드가 TODO로 어질러져서는 안 된다.
- 출처: Ch4, TODO Comments — p. 58–59
- 태그: [일반]

**CC-A-139 중요성을 증폭하는 주석 (Amplification)**
- 규칙: 사소해 보이지만 중요한 코드(예: `trim()`이 시작 공백을 제거해 다른 리스트로 인식되는 것을 막음)의 중요성은 주석으로 강조하라.
- 근거: 그렇지 않으면 대수롭지 않게 여겨 제거될 수 있다.
- 출처: Ch4, Amplification — p. 59
- 태그: [일반]

**CC-A-140 공개 API에는 좋은 문서 주석(Javadoc)을 작성 (Javadocs in Public APIs)**
- 규칙: 공개 API를 작성한다면 좋은 문서 주석을 반드시 작성하되, 다른 주석과 마찬가지로 오해·비지역성·부정직이 없도록 유지하라.
- 근거: 잘 설명된 공개 API만큼 유용한 것이 없다(표준 Java 라이브러리 javadoc).
- 출처: Ch4, Javadocs in Public APIs — p. 59
- 태그: [일반] (Javadoc 도구 자체는 Java지만 "공개 API 문서화"는 언어 무관)

### Bad Comments — p. 59–71

**CC-A-141 나쁜 주석의 일반 특성 (Bad Comments)**
- 규칙: 형편없는 코드를 지탱하는 목발, 핑계, 불충분한 결정의 정당화, 혼잣말에 해당하는 주석을 쓰지 마라.
- 근거: 대부분의 주석이 이 범주에 속한다.
- 출처: Ch4, Bad Comments — p. 59
- 태그: [일반]

**CC-A-142 주절거리는 주석 금지 — 쓸 거면 최선의 주석을 (Mumbling)**
- 규칙: 의무감이나 프로세스 때문에 대충 주석을 달지 말고, 쓰기로 했다면 의미가 다른 모듈을 뒤지지 않아도 전달되는 최선의 주석을 써라.
- 근거: `catch(IOException e) { // No properties files means all defaults are loaded }`는 누가·언제 기본값을 로드하는지 알 수 없는 수수께끼다. 다른 모듈을 봐야 의미를 알 수 있는 주석은 실패다.
- 출처: Ch4, Mumbling — p. 59–60
- 태그: [일반]

**CC-A-143 빈 catch 블록에 의미를 주석으로 얼버무리지 않는다 (Mumbling 예제가 시연)**
- 규칙: 예외를 삼키는 빈 catch 블록을 두려면 그 처리(예: 기본값 로드)가 실제로 어디서 일어나는지 코드로 명확히 하라 — 해야 할 일을 나중에 하겠다는 메모로 빈 catch를 남기지 마라.
- 근거: 저자는 그 주석이 "나중에 기본값 로드 코드를 쓰라"는 자기 메모일 수 있다는 가능성을 가장 무섭다고 지적한다.
- 출처: Ch4, Mumbling — p. 60
- 태그: [일반]

**CC-A-144 같은 이야기를 중복하는 주석 금지 (Redundant Comments)**
- 규칙: 코드보다 정보가 많지도, 읽기 쉽지도, 의도·근거를 주지도 않는 헤더 주석이나 필드별 Javadoc(Tomcat `ContainerBase` 예)을 쓰지 마라.
- 근거: 코드보다 덜 정밀하며 독자가 진짜 이해 대신 부정확함을 받아들이게 만든다. 코드를 어지럽히고 가린다.
- 출처: Ch4, Redundant Comments (Listing 4-1, 4-2) — p. 60–62
- 태그: [일반]

**CC-A-145 오해할 여지가 있는 주석 금지 — 주석은 정확해야 한다 (Misleading Comments)**
- 규칙: 주석이 코드 동작을 정확히 기술하는지 확인하라(예: "this.closed가 true가 되면 반환"이 아니라 실제로는 "true이면 반환, 아니면 타임아웃까지 기다렸다가 여전히 아니면 예외").
- 근거: 미묘한 오정보가 다른 프로그래머를 잘못된 기대 속에 호출하게 하고 느린 실행을 디버깅하게 만든다.
- 출처: Ch4, Misleading Comments — p. 63
- 태그: [일반]

**CC-A-146 의무적으로 다는 주석 금지 — "모든 함수에 Javadoc" 규칙 금지 (Mandated Comments)**
- 규칙: 모든 함수에 문서 주석, 모든 변수에 주석을 다는 규칙을 만들거나 따르지 마라.
- 근거: 그런 주석(Listing 4-3의 `@param title The title of the CD`)은 코드를 어지럽히고 거짓말을 퍼뜨리며 혼란을 낳는다.
- 출처: Ch4, Mandated Comments (Listing 4-3) — p. 63
- 태그: [일반]

**CC-A-147 이력을 기록하는 주석 금지 (Journal Comments)**
- 규칙: 모듈 첫머리에 변경 이력(날짜·변경 내용) 로그를 남기지 말고 완전히 제거하라 — 소스 관리 시스템에 맡겨라.
- 근거: 소스 관리 시스템이 없던 시절의 관행이며 지금은 모듈을 흐리는 잡음일 뿐이다.
- 출처: Ch4, Journal Comments — p. 63–64
- 태그: [일반]

**CC-A-148 있으나 마나 한 주석(잡음) 금지 (Noise Comments)**
- 규칙: 뻔한 것을 다시 말하는 주석(`/** Default constructor. */`, `/** The day of the month. */`, `@return the day of the month.`)을 쓰지 마라.
- 근거: 독자는 이런 주석을 건너뛰게 되고, 결국 주변 코드가 바뀌면서 주석이 거짓말을 하게 된다.
- 출처: Ch4, Noise Comments — p. 64–65
- 태그: [일반]

**CC-A-149 짜증 표출 주석 대신 구조 개선 — 중첩 try/catch를 함수로 추출**
- 규칙: 주석으로 불평하고 싶어지면(예: `//Give me a break!`) 그 원인이 되는 코드 구조(중첩 try/catch)를 별도 함수(`addExceptionAndCloseResponse`)로 추출해 해결하라.
- 근거: 잡음을 만들고 싶은 유혹을 코드를 정리하려는 결단으로 바꾸면 더 나은 프로그래머가 된다.
- 출처: Ch4, Noise Comments (Listing 4-4, 4-5) — p. 65–66
- 태그: [일반]

**CC-A-150 무시하는 예외 catch에는 왜 무시하는지 설명 (Listing 4-4가 시연)**
- 규칙: 의도적으로 무시하는 catch 블록에는 그 이유를 밝히는 주석(예: `// normal. someone stopped the request.`)을 남겨라.
- 근거: 저자는 Listing 4-4의 첫 주석이 catch 블록을 무시하는 이유를 설명하므로 적절하다고 평가한다.
- 출처: Ch4, Noise Comments — p. 65
- 태그: [일반]

**CC-A-151 무서운 잡음 — 복붙된 문서 주석 금지 (Scary Noise)**
- 규칙: 문서화하고 싶다는 잘못된 욕구로 필드마다 `/** The name. */` 같은 문서 주석을 달지 마라(복붙 오류 `/** The version. */ private String info;`가 섞인다).
- 근거: 작성자가 주의를 기울이지 않는 주석에서 독자가 얻을 것은 없다.
- 출처: Ch4, Scary Noise — p. 66
- 태그: [일반]

**CC-A-152 함수나 변수로 표현할 수 있다면 주석을 달지 마라 (Don't Use a Comment When You Can Use a Function or a Variable)**
- 규칙: 복잡한 식을 설명하는 주석 대신 의미 있는 이름의 설명 변수나 함수로 식을 분해하라.
- 근거: 주석을 먼저 썼더라도 이후 리팩터링으로 주석을 제거했어야 한다.
- 위반 예 → 개선 예: `// does the module from the global list <mod> depend on the subsystem we are part of?` `if (smodule.getDependSubsystems().contains(subSysMod.getSubSystem()))` → `moduleDependees = smodule.getDependSubsystems(); ourSubSystem = subSysMod.getSubSystem(); if (moduleDependees.contains(ourSubSystem))`
- 출처: Ch4, Don't Use a Comment When You Can Use a Function or a Variable — p. 67
- 태그: [일반]

**CC-A-153 위치를 표시하는 배너 주석은 아주 드물게 (Position Markers)**
- 규칙: `// Actions //////////` 같은 배너는 이득이 클 때만 극히 드물게 쓰고, 특히 끝의 슬래시 행렬은 제거하라.
- 근거: 배너를 남용하면 배경 잡음이 되어 무시된다.
- 출처: Ch4, Position Markers — p. 67
- 태그: [일반]

**CC-A-154 닫는 괄호에 다는 주석 금지 — 함수를 줄여라 (Closing Brace Comments)**
- 규칙: 닫는 괄호에 `} //while`, `} //try` 같은 주석을 달고 싶다면 대신 함수를 짧게 만들어라.
- 근거: 깊이 중첩된 긴 함수엔 의미가 있을지 모르나, 작고 캡슐화된 함수에선 잡음일 뿐이다.
- 출처: Ch4, Closing Brace Comments (Listing 4-6) — p. 67–68
- 태그: [일반]

**CC-A-155 공로·저자 표시 주석 금지 (Attributions and Bylines)**
- 규칙: `/* Added by Rick */` 같은 저자 표시를 코드에 넣지 말고 소스 관리 시스템에 맡겨라.
- 근거: 이런 주석은 수년간 남아 점점 부정확하고 무관해진다.
- 출처: Ch4, Attributions and Bylines — p. 68
- 태그: [일반]

**CC-A-156 주석으로 처리한 코드 금지 — 그냥 삭제 (Commented-Out Code)**
- 규칙: 코드를 주석 처리해 남기지 말고 삭제하라 — 소스 관리 시스템이 기억한다.
- 근거: 다른 사람은 이유가 있을 거라 생각해 지울 용기를 못 내고, 주석 처리된 코드는 나쁜 와인병 바닥의 찌꺼기처럼 쌓인다.
- 출처: Ch4, Commented-Out Code — p. 68–69
- 태그: [일반]

**CC-A-157 HTML 주석 금지 (HTML Comments)**
- 규칙: 소스 주석에 HTML 태그·엔티티(`<p/>`, `&lt;`, `&quot;`)를 넣지 말고, 웹 페이지용 장식은 추출 도구(Javadoc 등)의 책임으로 두어라.
- 근거: 주석을 가장 읽기 쉬워야 할 곳(편집기/IDE)에서 읽기 어렵게 만든다.
- 출처: Ch4, HTML Comments — p. 69
- 태그: [일반]

**CC-A-158 전역 정보 금지 — 주석은 근처 코드만 기술 (Nonlocal Information)**
- 규칙: 주석은 바로 옆 코드만 설명하게 하고, 그 함수가 통제하지 않는 시스템 전반의 정보(예: `setFitnessePort`의 "Defaults to 8082")를 넣지 마라.
- 근거: 기본값을 가진 코드가 바뀔 때 이 주석이 함께 바뀐다는 보장이 없다.
- 출처: Ch4, Nonlocal Information — p. 69–70
- 태그: [일반]

**CC-A-159 너무 많은 정보 금지 (Too Much Information)**
- 규칙: 흥미로운 역사적 논의나 무관한 세부 설명(예: base64 RFC 전문)을 주석에 넣지 마라 — 필요하면 참조 식별자(RFC 번호) 정도만 남겨라.
- 근거: 코드를 읽는 사람에게 그런 난해한 정보는 필요 없다.
- 출처: Ch4, Too Much Information — p. 70
- 태그: [일반]

**CC-A-160 모호한 관계 금지 — 주석과 코드의 연관이 명백하게 (Inobvious Connection)**
- 규칙: 주석과 그것이 설명하는 코드의 관계가 명백하게 하라 — 주석이 또 설명을 필요로 하지 않게 하라(예: "filter bytes"가 `+1`인지 `*3`인지, 왜 `200`인지 불명).
- 근거: 주석의 목적은 스스로 설명하지 못하는 코드를 설명하는 것이다.
- 출처: Ch4, Inobvious Connection — p. 70
- 태그: [일반]

**CC-A-161 함수 헤더 주석 대신 좋은 이름 (Function Headers)**
- 규칙: 짧은 함수에 헤더 주석을 달지 말고, 한 가지 일을 하는 작은 함수에 잘 고른 이름을 붙여라.
- 근거: 짧은 함수는 설명이 많이 필요 없다.
- 출처: Ch4, Function Headers — p. 70
- 태그: [일반]

**CC-A-162 비공개 코드에서 Javadoc 금지 (Javadocs in Nonpublic Code)**
- 규칙: 외부 공개용이 아닌 시스템 내부 클래스·함수에는 형식적 문서 주석을 달지 마라.
- 근거: 내부 코드용 javadoc 페이지 생성은 대개 쓸모없고 추가 형식은 잡동사니·방해물일 뿐이다.
- 출처: Ch4, Javadocs in Nonpublic Code — p. 71
- 태그: [일반] (Javadoc 명칭은 Java지만 "비공개 코드 형식 문서 주석 금지"는 언어 무관)

### Example (Listing 4-7 → 4-8) — p. 71–74

**CC-A-163 "잘 문서화된" 코드도 주석 문제의 덩어리일 수 있다 — 주석 대신 이름 있는 작은 함수로 분해 (Example)**
- 규칙: 섹션 주석(`// declarations`, `// initialize array to true.`, `// sieve`)과 줄 끝 주석(`// bump count.`, `// return the primes`)으로 설명하는 긴 함수를 `uncrossIntegersUpTo`, `crossOutMultiples`, `putUncrossedIntegersIntoResult`처럼 의도를 드러내는 작은 함수로 분해하고, 남는 주석은 설명적인 것만 두어라.
- 근거: 리팩터링 후 전체 모듈에 주석이 두 개만 남는다. 한때 "잘 문서화된" 코드로 여겨졌던 것이 작은 엉망이다.
- 출처: Ch4, Example (Listing 4-7, 4-8) — p. 71–74
- 태그: [일반]

**CC-A-164 한 글자·약어 변수를 의미 있는 이름으로 (Example이 시연)**
- 규칙: `s`(배열 크기), `f`(플래그 배열) 같은 이름에 주석을 붙이지 말고 `crossedOut`, `multiple`처럼 의미 있는 이름을 써라.
- 근거: Listing 4-7의 `int s = maxValue + 1; // size of array`는 이름이 의도를 드러내지 못해 주석이 필요한 경우다.
- 출처: Ch4, Example — p. 71–73
- 태그: [일반]

**CC-A-165 잘못된 입력은 이른 반환(가드)으로 먼저 처리 (Example이 시연)**
- 규칙: 유효하지 않은 입력 처리를 큰 if 블록 뒤의 else에 두지 말고 함수 앞부분의 가드로 먼저 처리하라(`if (maxValue < 2) return new int[0];`).
- 근거: Listing 4-7은 `if (maxValue >= 2) // the only valid case { ...긴 본문... } else return new int[0];` 구조였고, 4-8은 입력 검사를 앞으로 옮겨 본문을 세 단계 호출로 줄였다.
- 출처: Ch4, Example — p. 71–73
- 태그: [일반]

**CC-A-166 주석은 코드와 일치해야 한다 — "null 배열 반환" 같은 부정확한 주석 금지 (Example이 시연)**
- 규칙: 주석이 실제 동작과 다르지 않게 하라(Listing 4-7의 `return new int[0]; // return null array if bad input.`는 null이 아니라 빈 배열을 반환한다).
- 근거: 부정확한 주석은 없는 것보다 나쁘다(장 도입부의 원칙을 예제가 시연).
- 출처: Ch4, Example — p. 72
- 태그: [일반]

**CC-A-167 남기는 주석: 알고리즘 입문용 요약과 비자명한 근거**
- 규칙: 주석을 남긴다면 독자를 알고리즘에 안내하는 짧은 클래스 요약이나, 이름·구조로 표현할 수 없는 근거(예: 반복 한계로 제곱근을 쓰는 이유)에 한정하라.
- 근거: Listing 4-8의 두 주석이 그 예이며, 두 번째는 단순한 변수명이나 다른 구조로 표현할 수 없었다.
- 출처: Ch4, Example — p. 74
- 태그: [일반]

**CC-A-168 영리한 최적화가 이해 비용을 정당화하는지 따져본다**
- 규칙: 반복을 제곱근까지로 제한하는 것 같은 최적화는 절약되는 시간이 다른 사람들이 이해하는 데 드는 시간과 노력보다 큰지 검토한 뒤에만 넣어라.
- 근거: 저자도 그것이 자만(conceit)일 수 있으며 모두가 들일 이해 비용만큼 가치 있는지 확신하지 못한다고 밝힌다.
- 출처: Ch4, Example — p. 74
- 태그: [일반]

**CC-A-169 작성자·버전 태그(@author, @version)를 소스에 남기지 않는다 (Example이 시연)**
- 규칙: 클래스 문서 주석에 `@author`, `@version 13 Feb 2002` 같은 저자·날짜 태그나 역사적 일화(에라토스테네스 전기)를 넣지 마라.
- 근거: Listing 4-8에서는 이것들이 제거되었다(저자 표시·너무 많은 정보·이력 주석의 결합 사례).
- 출처: Ch4, Example — p. 71–72
- 태그: [일반]

### Bibliography — p. 74
(규칙 없음.)

---

## 커버리지 확인

- 읽은 마지막 줄 번호: **4066** (파일 끝 — Chapter 5 표지의 "5"까지. 1–4066 전부를 800줄 단위로 순서대로 읽음)
- 추출 규칙 수: **169개** (CC-A-001 ~ CC-A-169)

### 만난 섹션 제목 전체 목록

**앞부분 (Front Matter)**
- 시리즈 소개 / 표제지 / 판권 / 헌사 (규칙 없음)
- Contents (목차: 1–17장, 부록 A–C — 이 청크의 범위 밖 장은 목차로만 등장)
- Foreword (James O. Coplien) — 5S: Seiri, Seiton, Seiso, Seiketsu, Shutsuke
- Introduction
- Acknowledgments / Artwork
- On the Cover

**Chapter 1: Clean Code**
- There Will Be Code
- Bad Code
- The Total Cost of Owning a Mess
  - The Grand Redesign in the Sky
  - Attitude
  - The Primal Conundrum
  - The Art of Clean Code?
  - What Is Clean Code? (Bjarne Stroustrup / Grady Booch / "Big" Dave Thomas / Michael Feathers / Ron Jeffries / Ward Cunningham)
- Schools of Thought
- We Are Authors
- The Boy Scout Rule
- Prequel and Principles
- Conclusion
- Bibliography

**Chapter 2: Meaningful Names**
- Introduction
- Use Intention-Revealing Names
- Avoid Disinformation
- Make Meaningful Distinctions
- Use Pronounceable Names
- Use Searchable Names
- Avoid Encodings
  - Hungarian Notation
  - Member Prefixes
  - Interfaces and Implementations
- Avoid Mental Mapping
- Class Names
- Method Names
- Don't Be Cute
- Pick One Word per Concept
- Don't Pun
- Use Solution Domain Names
- Use Problem Domain Names
- Add Meaningful Context (Listing 2-1, 2-2)
- Don't Add Gratuitous Context
- Final Words

**Chapter 3: Functions**
- (도입부, Listing 3-1, 3-2)
- Small! (Listing 3-3)
  - Blocks and Indenting
- Do One Thing
  - Sections within Functions
- One Level of Abstraction per Function
  - Reading Code from Top to Bottom: The Stepdown Rule
- Switch Statements (Listing 3-4, 3-5)
- Use Descriptive Names
- Function Arguments
  - Common Monadic Forms
  - Flag Arguments
  - Dyadic Functions
  - Triads
  - Argument Objects
  - Argument Lists
  - Verbs and Keywords
- Have No Side Effects (Listing 3-6)
  - Output Arguments
- Command Query Separation
- Prefer Exceptions to Returning Error Codes
  - Extract Try/Catch Blocks
  - Error Handling Is One Thing
  - The Error.java Dependency Magnet
- Don't Repeat Yourself
- Structured Programming
- How Do You Write Functions Like This?
- Conclusion
- SetupTeardownIncluder (Listing 3-7)
- Bibliography

**Chapter 4: Comments**
- (도입부)
- Comments Do Not Make Up for Bad Code
- Explain Yourself in Code
- Good Comments
  - Legal Comments
  - Informative Comments
  - Explanation of Intent
  - Clarification
  - Warning of Consequences
  - TODO Comments
  - Amplification
  - Javadocs in Public APIs
- Bad Comments
  - Mumbling
  - Redundant Comments (Listing 4-1, 4-2)
  - Misleading Comments
  - Mandated Comments (Listing 4-3)
  - Journal Comments
  - Noise Comments (Listing 4-4, 4-5)
  - Scary Noise
  - Don't Use a Comment When You Can Use a Function or a Variable
  - Position Markers
  - Closing Brace Comments (Listing 4-6)
  - Attributions and Bylines
  - Commented-Out Code
  - HTML Comments
  - Nonlocal Information
  - Too Much Information
  - Inobvious Connection
  - Function Headers
  - Javadocs in Nonpublic Code
  - Example (Listing 4-7, 4-8)
- Bibliography

**Chapter 5 표지** (줄 4066 — 본문은 이 청크에 없음)
