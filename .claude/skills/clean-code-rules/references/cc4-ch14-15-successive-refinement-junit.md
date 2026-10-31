# Clean Code — 14장 점진적 개선(Successive Refinement), 15장 JUnit 들여다보기(JUnit Internals) 규칙 추출

> **전수 카탈로그** — `clean-code-rules` 스킬의 참조 파일. 원전: Clean Code (Robert C. Martin, 2008) — `docs/pdf/Clean Code ( PDFDrive.com ).pdf`. 이 범위의 본문을 한 줄도 빼지 않고 읽어 추출했다(파일 끝 "커버리지 확인" 참고).
> **인용 형식**: `cc4:<규칙ID>` (예: `cc4:R14-03`). 규칙 ID는 이 파일 안에서만 유일하다.
> **쪽수**: 인쇄본 쪽수(본문 러닝 헤더 기준)
> 출처 표기: 장 + 책의 절 제목 + 페이지(러닝 헤더 기준). 태그: [일반] 언어 무관 / [Java특화] Java·당시 환경에서만 의미.

---

## 14장 점진적 개선 (Successive Refinement)

### (장 도입부) — p.193–194

**R14-01**
- 규칙: 사용법이 단순한 공개 API를 먼저 설계하라 — 생성 한 번(스키마 + 입력)으로 파싱을 끝내고, 이후엔 타입별 조회 메서드(getBoolean/getInt/getString)로 값을 꺼내게 하라.
- 근거: 호출자는 생성 후 질의만 하면 되므로 사용이 단순해진다.
- 예: `new Args("l,p#,d*", args); arg.getInt('p')`
- 출처: 14장 도입부, p.194
- 태그: [일반]

**R14-02**
- 규칙: 입력 형식이나 인자 오류는 하나의 전용 예외(ArgsException)로 던지고, 사람이 읽을 오류 설명은 그 예외의 메서드(errorMessage)로 제공하라.
- 근거: 호출자는 한 곳에서 잡아 일관된 메시지를 얻는다.
- 출처: 14장 도입부, p.194
- 태그: [일반]

### Args 구현 (Args Implementation) — p.194–200

**R14-03**
- 규칙: 코드를 위에서 아래로 건너뛰거나 앞을 내다보지 않고 읽을 수 있게, 호출하는 함수 바로 아래에 호출되는 함수를 배치하라(내려가기 규칙).
- 근거: "위에서 아래로 많이 점프하지 않고 읽을 수 있다."
- 출처: 14장 Args Implementation, p.196
- 태그: [일반]

**R14-04**
- 규칙: 생성자는 고수준 단계(parseSchema, parseArgumentStrings)만 호출하게 하고, 각 단계는 한 단계 낮은 추상화의 작은 함수(parseSchemaElement → validateSchemaElementId …)로 분해하라.
- 근거: 함수가 작고 한 가지 추상화 수준만 다뤄 읽기 쉬움(독자에게 이름·크기·형식에 주목하라고 강조).
- 출처: 14장 Args Implementation, p.195, p.200
- 태그: [일반]

**R14-05**
- 규칙: "여러 타입이 같은 일(파싱·설정·조회)을 각자 방식으로 한다"면 공통 인터페이스(ArgumentMarshaler)와 타입별 구현 클래스로 다형성을 쓰라.
- 근거: 새 인자 타입 추가가 새 파생 클래스 + getXXX + 스키마 case 하나로 끝나 "사소한 노력"이 된다.
- 출처: 14장 Args Implementation, p.197, p.200
- 태그: [일반]

**R14-06**
- 규칙: 새 변형(타입)을 추가할 때 수정 지점이 소수의 예측 가능한 곳(구현 클래스 1, 조회 함수 1, 분기 1, 오류 코드/메시지 1)에 격리되도록 구조를 설계하고, 이를 확장성 평가 기준으로 써라.
- 근거: 저자가 깨끗한 구조의 증거로 "새 타입 추가가 얼마나 쉬운지"를 제시.
- 출처: 14장 Args Implementation, p.200
- 태그: [일반]

**R14-07**
- 규칙: 값이 없거나 타입이 맞지 않는 조회에는 null 대신 타입별 안전한 기본값(false, "", 0)을 반환하라(정적 getValue에서 null·타입 검사).
- 근거: 호출자의 null 처리 부담과 NPE를 제거.
- 예: `if (am != null && am instanceof BooleanArgumentMarshaler) return …; else return false;`
- 출처: 14장 Args Implementation, p.197–198
- 태그: [일반] (instanceof 캐스팅 방식 자체는 [Java특화])

**R14-08**
- 규칙: 저수준 예외(NoSuchElementException, NumberFormatException)는 그 저수준 연산을 하는 클래스 안에서 잡아 도메인 오류 코드가 담긴 예외로 변환하라.
- 근거: NumberFormatException 개념이 IntegerArgumentMarshaler 안에 묻혀 상위 모듈이 깨끗해진다.
- 예: `catch (NumberFormatException e) { throw new ArgsException(INVALID_INTEGER, parameter); }`
- 출처: 14장 Args Implementation, p.198; String Arguments, p.220
- 태그: [일반]

**R14-09**
- 규칙: 오류 종류는 문자열이 아니라 열거형(ErrorCode enum)으로 표현하고, 오류 코드·오류 인자 ID·오류 파라미터를 예외 객체에 담아라.
- 근거: 테스트와 호출자가 메시지 문자열이 아닌 코드로 판별 가능.
- 출처: 14장 Args Implementation, p.198–200
- 태그: [일반]

**R14-10**
- 규칙: 하위 계층에서 던진 예외에 상위 계층만 아는 문맥(어느 인자에서 났는지)을 덧붙인 뒤 재던져라.
- 근거: 마샬러는 인자 문자를 모르므로 Args가 `e.setErrorArgumentId(argChar); throw e;`로 보강.
- 출처: 14장 Args Implementation, p.196
- 태그: [일반]

**R14-11**
- 규칙: 도달 불가능해야 하는 분기(예: OK 상태에서 오류 메시지 요청)는 명시적으로 표시하라("TILT: Should not get here.").
- 근거: 불가능 상태를 조용히 지나치지 않게 함.
- 출처: 14장 Args Implementation, p.199
- 태그: [일반]

**R14-12**
- 규칙: 장황한 언어에서는 코드량이 많아지는 것을 감안하되, 크기가 아니라 이름·함수 크기·형식·구조로 품질을 판단하라.
- 근거: Java는 타입 시스템 때문에 장황하며, Ruby로 쓰면 1/7 크기였다.
- 출처: 14장 Args Implementation, p.200 (각주 1)
- 태그: [Java특화]

### 어떻게 짰느냐고? (How Did I Do This?) — p.200–201

**R14-13**
- 규칙: 한 번에 깨끗한 코드를 쓰려 하지 말고, 먼저 동작하는 초안(더러운 코드)을 쓴 뒤 여러 차례 다듬어라(점진적 개선).
- 근거: "깨끗한 코드를 짜려면 먼저 지저분한 코드를 짠 뒤 정리해야 한다" — 프로그래밍은 과학보다 공예.
- 출처: 14장 How Did I Do This?, p.200
- 태그: [일반]

**R14-14**
- 규칙: "동작한다"에서 작업을 끝내지 말라 — 동작 확인 후 반드시 구조를 정리하고 나서 다음 작업으로 넘어가라.
- 근거: 동작하는 상태로 방치하고 넘어가는 것은 "직업적 자살"이다.
- 출처: 14장 How Did I Do This?, p.201
- 태그: [일반]

### Args: 1차 초안 (Args: The Rough Draft) — p.201–212

**R14-15**
- 규칙: 클래스의 인스턴스 변수가 계속 늘어나면(타입별 맵, 오류 상태 필드 다수) 설계 붕괴 신호로 보고 구조를 재검토하라.
- 근거: "인스턴스 변수의 수가 압도적"이라는 것이 초안이 썩은 첫 증상.
- 출처: 14장 Args: The Rough Draft, p.206
- 태그: [일반]

**R14-16**
- 규칙: 의미 없는 매직 문자열 기본값("TILT" 등)으로 필드를 초기화하지 말라.
- 근거: 저자가 "TILT 같은 이상한 문자열"을 썩은 더미의 요소로 지목.
- 출처: 14장 Args: The Rough Draft, p.206
- 태그: [일반]

**R14-17**
- 규칙: 빈 catch 블록으로 예외를 삼키고 별도의 valid 플래그로 상태를 추적하지 말라 — 오류는 예외로 전파하라.
- 근거: 초안의 `catch (ArgsException e) {}` + `valid=false` 패턴이 최종본에서 예외 전파로 대체됨(isValid 제거).
- 위반 예 → 개선 예: `try { parseArguments(); } catch (ArgsException e) {} return valid;` → `parseArguments();` (throws)
- 출처: 14장 Args: The Rough Draft, p.201, p.203; String Arguments 최종 Listing 14-16, p.247
- 태그: [일반]

**R14-18**
- 규칙: 오류 정보를 여러 인스턴스 필드(errorArgumentId, errorParameter, errorCode)에 흩어 저장하지 말고 예외 객체에 담아 던져라.
- 근거: 전역적 가변 오류 상태는 try-catch-catch 더미를 만들고 Args의 책임을 흐린다.
- 출처: 14장 Args: The Rough Draft, p.203–204; String Arguments, p.247–248
- 태그: [일반]

**R14-19**
- 규칙: 타입마다 별도의 자료구조(booleanArgs, stringArgs, intArgs)와 별도의 is/set/get 함수 세트를 복제하지 말라 — 타입 하나 추가될 때마다 여러 곳이 같이 늘어난다면 추상화가 빠진 것이다.
- 근거: 타입 두 개(String, int) 추가만으로 유지보수 가능한 코드가 버그투성이 더미로 변했다.
- 출처: 14장 Args: The Rough Draft, p.208
- 태그: [일반]

**R14-20**
- 규칙: 기능을 하나 추가할 때마다 코드가 얼마나 지저분해지는지 관찰하고, 엉망의 "씨앗"이 보이면 커지기 전에 조치하라.
- 근거: 혼란은 점진적으로 쌓였다 — Boolean만 있을 땐 괜찮았지만 이미 씨앗이 있었다.
- 출처: 14장 Args: The Rough Draft, p.206, p.208, p.212
- 태그: [일반]

**R14-21**
- 규칙: 자신의 코드를 남이 볼 때의 반응("그대로 두지 않아서 다행이다")을 기준으로, 초안 상태의 코드를 남겨 두지 말라.
- 근거: 당신이 초안으로 남긴 코드를 다른 사람도 똑같이 느낀다.
- 출처: 14장 Args: The Rough Draft, p.206
- 태그: [일반]

**R14-22**
- 규칙: 좋은 이름과 대략적 구조만으로는 부족하다 — 이름이 좋아도 구조가 문제를 통제하지 못하면 리팩터링하라.
- 근거: 저자는 함수·변수 이름을 신경 썼지만 "문제가 손을 벗어나게 두었다."
- 출처: 14장 Args: The Rough Draft, p.206
- 태그: [일반]

### 그래서 멈췄다 (So I Stopped) — p.212

**R14-23**
- 규칙: 추가 기능이 구조를 더 악화시킬 것이 보이면 기능 추가를 멈추고 먼저 리팩터링하라(밀어붙이지 말라).
- 근거: 밀어붙이면 동작은 하겠지만 고치기엔 너무 큰 혼란을 남긴다 — "지금이 고칠 때".
- 출처: 14장 So I Stopped, p.212
- 태그: [일반]

**R14-24**
- 규칙: 리팩터링 전에 "변형(타입) 하나 추가할 때 어디어디를 고쳐야 했는가"를 열거해 변경 축을 파악하고, 그것으로 추상화를 도출하라.
- 근거: 각 타입이 스키마 파싱·인자 파싱/변환·getXXX 세 곳을 요구함을 파악 → ArgumentMarshaler 탄생.
- 출처: 14장 So I Stopped, p.212
- 태그: [일반]

**R14-25**
- 규칙: "여러 타입이 모두 비슷한 메서드를 가진다"면 그것을 클래스(계층)로 추출하라.
- 근거: "다양한 타입, 모두 비슷한 메서드 — 클래스처럼 들린다."
- 출처: 14장 So I Stopped, p.212
- 태그: [일반]

### 점진적으로 개선하다 (On Incrementalism) — p.212–214

**R14-26**
- 규칙: "개선"이라는 명목으로 구조를 한꺼번에 크게 바꾸지 말라.
- 근거: 대규모 변경 후 이전과 똑같이 동작하게 되돌리기가 매우 어렵고, 일부 프로그램은 회복하지 못한다.
- 출처: 14장 On Incrementalism, p.212
- 태그: [일반]

**R14-27**
- 규칙: TDD 규율로 시스템을 항상 동작하는 상태로 유지하라 — 시스템을 깨뜨리는 변경은 허용되지 않으며, 모든 변경 후에도 이전과 똑같이 동작해야 한다.
- 근거: TDD의 핵심 교리는 "언제나 시스템이 돌아가야 한다".
- 출처: 14장 On Incrementalism, p.213
- 태그: [일반]

**R14-28**
- 규칙: 리팩터링 전에 언제든 돌릴 수 있는 자동화 테스트 묶음(단위 테스트 + 인수 테스트)을 확보하라 — 그것이 동작 불변을 보증한다.
- 근거: 테스트가 통과하면 시스템이 명세대로 동작한다고 확신할 수 있다.
- 출처: 14장 On Incrementalism, p.213
- 태그: [일반]

**R14-29**
- 규칙: 리팩터링은 아주 작은 변경을 매우 많이 하는 방식으로 하되, 각 변경이 목표 구조로 한 걸음 이동하면서 시스템을 계속 동작시키게 하라.
- 근거: 각 변경은 ArgumentMarshaler 개념으로 다가가면서도 시스템을 유지했다.
- 출처: 14장 On Incrementalism, p.213
- 태그: [일반]

**R14-30**
- 규칙: 새 구조는 먼저 아무것도 깨지 않는 골격(빈 클래스·하위 클래스)으로 추가하고 시작하라.
- 근거: 기존 코드 끝에 ArgumentMarshaler 골격을 붙이는 것은 "분명 아무것도 깨지 않는다".
- 출처: 14장 On Incrementalism, p.213
- 태그: [일반]

**R14-31**
- 규칙: 다음 단계는 "가능한 한 적게 깨지는 가장 단순한 수정"을 고르고(예: 맵 하나의 값 타입만 교체), 깨진 몇 곳을 즉시 고쳐라.
- 근거: Boolean 맵 하나만 ArgumentMarshaler로 바꿔 몇 문장만 깨짐.
- 출처: 14장 On Incrementalism, p.213
- 태그: [일반]

**R14-32**
- 규칙: 작은 변경에서 테스트가 깨지면 다른 변경을 하기 전에 그것부터 바로 통과시켜라.
- 근거: "점진주의는 다른 변경 전에 이것을 빨리 동작시키라고 요구했다."
- 출처: 14장 On Incrementalism, p.214; String Arguments, p.215
- 태그: [일반]

**R14-33**
- 규칙: 구조를 바꾸면 기존 방어 코드(null 검사 등)가 무의미해지지 않았는지 확인하고, 방어 지점을 새 구조에 맞게 옮겨라.
- 근거: falseIfNull이 boolean의 null을 막았지만, 맵 값이 마샬러가 되자 마샬러 자체의 null을 검사해야 했다.
- 위반 예 → 개선 예: `falseIfNull(booleanArgs.get(arg).getBoolean())` → `am != null && am.getBoolean()`
- 출처: 14장 On Incrementalism, p.214
- 태그: [일반]

**R14-34**
- 규칙: 쓸모없어진 함수는 호출부와 함께 즉시 삭제하라.
- 근거: falseIfNull이 무용해지자 호출과 함수 자체를 제거.
- 출처: 14장 On Incrementalism, p.214
- 태그: [일반]

**R14-35**
- 규칙: 변경 후 "같은 방식으로 실패하는지"를 확인해 새 오류를 도입하지 않았음을 검증하라 — 실패 양상이 바뀌지 않으면 그 단계는 안전하다.
- 근거: "테스트가 여전히 같은 방식으로 실패해서 새 오류를 넣지 않았다고 확신했다."
- 출처: 14장 On Incrementalism, p.214
- 태그: [일반]

**R14-36**
- 규칙: 복잡한 식은 중간 결과를 지역 변수로 분리한 뒤 로직(null 검사 등)을 추가하라.
- 근거: getBoolean을 두 줄로 나누고 변수에 담은 뒤 null 검사를 넣음.
- 출처: 14장 On Incrementalism, p.214
- 태그: [일반]

**R14-37**
- 규칙: 좁은 범위의 지역 변수는 짧은 이름을 써도 된다 — 타입을 그대로 반복한 긴 이름이 중복이고 함수를 어지럽힌다면 줄여라(이름 길이는 범위에 비례 [N5]).
- 근거: argumentMarshaller는 "심하게 중복되고 함수를 어지럽혀" am으로 줄임.
- 출처: 14장 On Incrementalism, p.214
- 태그: [일반]

### String 인수 (String Arguments) — p.214–250

**R14-38**
- 규칙: 같은 종류의 변경(새 타입 이관)은 같은 순서·패턴(맵 교체 → parse → set → get)으로 반복 적용하라.
- 근거: String 추가는 Boolean과 "매우 비슷"했고 놀랄 것이 없었다.
- 출처: 14장 String Arguments, p.214–215
- 태그: [일반]

**R14-39**
- 규칙: 변경은 하나씩, 테스트가 (통과하지 않더라도) 계속 실행 가능한 방식으로 하고, 깨진 테스트는 다음 변경 전에 통과시켜라.
- 근거: "변경을 한 번에 하나씩, 테스트가 계속 돌아가도록 했다."
- 출처: 14장 String Arguments, p.215
- 태그: [일반]

**R14-40**
- 규칙: 계층으로 옮길 때는 먼저 모든 동작을 기반 클래스에 모은 다음, 하나씩 파생 클래스로 내려보내라(pull up 후 push down).
- 근거: 그래야 프로그램 모양을 점진적으로 바꾸면서 모든 것을 계속 동작시킬 수 있다.
- 출처: 14장 String Arguments, p.215, p.217
- 태그: [일반]

**R14-41**
- 규칙: 메서드를 파생 클래스로 내릴 때는 (1) 기반에 추상 메서드 추가 → (2) 파생에서 구현 → (3) 호출부를 새 메서드로 교체 → (4) 테스트 통과 확인 → (5) 기반의 옛 메서드 삭제 순으로 하라.
- 근거: setBoolean을 abstract set으로 대체한 절차.
- 출처: 14장 String Arguments, p.217
- 태그: [일반]

**R14-42**
- 규칙: 다형적 메서드의 시그니처는 모든 구현이 필요로 하는 인자를 받게 설계하라 — 일부 구현이 그 인자를 쓰지 않더라도 공통 인터페이스를 위해 받는다.
- 근거: Boolean의 set은 String을 쓰지 않지만 String·Integer 마샬러가 쓸 것이라 받게 했다(이후 Iterator도 같은 이유).
- 출처: 14장 String Arguments, p.217, p.233
- 태그: [일반]

**R14-43**
- 규칙: 컴파일만 되게 하는 임시 구현(예: `return null`)을 넣고 실패를 확인한 뒤 진짜 구현(추상화 + 파생 구현)으로 테스트를 통과시켜라.
- 근거: get을 null 반환으로 추가 → 컴파일되고 테스트 실패 → abstract로 바꾸고 구현해 통과.
- 출처: 14장 String Arguments, p.218
- 태그: [일반]

**R14-44**
- 규칙: 동작이 파생 클래스로 옮겨지면 관련 필드도 파생 클래스로 내리고 가시성을 protected에서 private으로 좁혀라.
- 근거: booleanValue를 BooleanArgumentMarshaler로 옮기고 private으로 만들었다.
- 출처: 14장 String Arguments, p.218
- 태그: [일반]

**R14-45**
- 규칙: 타입별로 다르게 반환해야 하는 get을 공통 추상 메서드로 만들면 Object 반환·캐스트가 필요해 추하다는 점을 인지하고, 가능하면 타입별 정적 조회 등 캐스트를 숨기는 방식으로 최종 정리하라.
- 근거: "get 함수를 배포하는 건 항상 추하다 — 반환 타입이 Object여야 한다." 최종본은 정적 getValue로 캐스트를 각 클래스에 숨김.
- 출처: 14장 String Arguments, p.218; Args Implementation, p.197
- 태그: [Java특화]

**R14-46**
- 규칙: 자료구조를 교체할 때는 옛 것을 바로 지우지 말고, 새 자료구조를 병행 추가한 뒤 메서드를 하나씩 새 것으로 옮기고 마지막에 옛 것을 삭제하라(병행 변경).
- 근거: 세 맵을 그냥 지우면 시스템이 깨지므로 marshalers 맵을 추가하고 하나씩 전환.
- 출처: 14장 String Arguments, p.221, p.224
- 태그: [일반]

**R14-47**
- 규칙: 같은 조회(marshalers.get)를 여러 함수가 반복하면 한 번 조회해 결과를 인자로 넘겨 중복을 제거하라.
- 근거: is*Arg마다 있던 marshalers.get 중복 호출을 setArgument에서 한 번으로.
- 출처: 14장 String Arguments, p.222
- 태그: [일반]

**R14-48**
- 규칙: 존재 이유가 사라진 작은 함수(한 줄짜리 isXxxArg, 하는 일이 거의 없는 parseXxxSchemaElement)는 인라인하라.
- 근거: "세 isxxxArg 메서드를 둘 좋은 이유가 없었다", "별로 하는 일이 없어" 인라인.
- 출처: 14장 String Arguments, p.222, p.225
- 태그: [일반]

**R14-49**
- 규칙: 흩어진 예외 처리 코드는 공통 호출부(setArgument) 한 곳으로 모아라.
- 근거: valid/errorArgumentId 설정을 setArgument의 catch로 통합.
- 출처: 14장 String Arguments, p.223
- 태그: [일반]

**R14-50**
- 규칙: 리팩터링 중에는 단위 테스트뿐 아니라 인수 테스트까지 전부 돌려라 — 인수 테스트만 검증하는 행위가 있을 수 있다.
- 근거: 비 boolean 인자에 getBoolean 호출 시 false를 반환해야 한다는 건 FitNesse 테스트만 확인했고, 단위 테스트만 돌려서 놓칠 뻔했다.
- 출처: 14장 String Arguments, p.224
- 태그: [일반]

**R14-51**
- 규칙: 별도로 실행되는 테스트 묶음이 있으면 하나의 실행으로 모두 돌도록 통합하라(예: 단위 테스트에서 인수 테스트 전체 호출).
- 근거: 같은 종류의 놀람을 막으려 FitNesse 전체를 호출하는 단위 테스트를 추가.
- 출처: 14장 String Arguments, p.224 (각주 2)
- 태그: [일반]

**R14-52**
- 규칙: 공개 조회 메서드는 잘못된 타입 요청(ClassCastException)에도 예외 대신 문서화된 기본값을 반환하도록 계약을 지켜라(인수 테스트가 명세한 행위 유지).
- 근거: getBoolean/getString/getInt가 캐스트 실패 시 false/""/0 반환.
- 출처: 14장 String Arguments, p.224–225
- 태그: [Java특화] (캐스트 예외 기반 처리)

**R14-53**
- 규칙: 리팩터링 한 묶음 후 전체 그림을 다시 보고 남은 냄새(상단 변수 무더기, 타입 분기, 추한 set 함수, 오류 처리)를 솔직하게 목록화해 다음 작업을 정하라.
- 근거: "그 모든 작업 후에도 약간 실망스럽다… 아직 할 일이 많다."
- 출처: 14장 String Arguments, p.225, p.231
- 태그: [일반]

**R14-54**
- 규칙: instanceof로 타입을 분기하는 if-else 사슬(type-case)은 다형적 메서드 호출 하나로 대체하라 [G23].
- 근거: setArgument에 바라는 것은 ArgumentMarshaler.set 한 번 호출.
- 위반 예 → 개선 예: `if (m instanceof Boolean…) setBooleanArg(m); else if (m instanceof String…) …` → `m.set(currentArgument);`
- 출처: 14장 String Arguments, p.231, p.236
- 태그: [일반]

**R14-55**
- 규칙: 함수를 다른 클래스로 옮길 때 인자가 여러 개(배열 + 현재 인덱스) 필요해지면, 그것을 하나의 추상(Iterator)으로 묶어 인자 수를 줄여라 [F1].
- 근거: args와 currentArgument 두 개를 넘기는 건 "지저분하다" — 리스트로 바꾸고 Iterator 하나를 넘김.
- 출처: 14장 String Arguments, p.231
- 태그: [일반]

**R14-56**
- 규칙: 배열 + 수동 인덱스 증감 대신 이터레이터를 써서 "다음 인자 소비"를 표현하고, 범위 초과는 ArrayIndexOutOfBounds 대신 이터레이터 예외(NoSuchElement)로 처리하라.
- 근거: currentArgument++ / args[currentArgument]가 currentArgument.next()로 단순화.
- 출처: 14장 String Arguments, p.231–232
- 태그: [일반] (구체 예외 이름은 [Java특화])

**R14-57**
- 규칙: 큰 변경 하나도 여러 작은 단계(예: 10단계)로 나누고 단계마다 모든 테스트를 통과시켜라.
- 근거: "10단계가 걸렸고 각 단계 후 모든 테스트를 통과시켰다."
- 출처: 14장 String Arguments, p.231
- 태그: [일반]

**R14-58**
- 규칙: 분기 사슬을 제거하려면 먼저 그 사슬에 섞인 오류/예외 조건(m == null)을 사슬 밖의 가드 절로 빼내라.
- 근거: if-else 사슬을 완전히 없애려면 오류 조건을 먼저 꺼내야 했다.
- 예: `if (m == null) return false;` 를 분기 앞에 둠
- 출처: 14장 String Arguments, p.232–233
- 태그: [일반]

**R14-59**
- 규칙: 리팩터링 중 무언가를 넣었다가 다시 빼는 일을 두려워하지 말라 — 각 단계가 다음 단계를 가능하게 하는 디딤돌이면 된다.
- 근거: "넣었다 빼는 일은 리팩터링에서 흔하다… 루빅 큐브처럼 작은 단계가 큰 목표를 이룬다."
- 출처: 14장 String Arguments, p.233
- 태그: [일반]

**R14-60**
- 규칙: 위임만 하는 래퍼 함수(setBooleanArg처럼 m.set을 부르기만 하는 함수)는 대상 메서드가 생기면 제거하고 직접 호출하라.
- 근거: "이제 setBooleanArg는 쓸모없다… 직접 호출할 수 있다."
- 출처: 14장 String Arguments, p.234–235
- 태그: [일반]

**R14-61**
- 규칙: 새 추상 메서드를 도입할 때는 기존 메서드와 잠시 공존(오버로드)시키고 모든 파생 클래스에 구현을 넣은 뒤, 호출부를 하나씩 전환하고 옛 메서드를 삭제하라.
- 근거: set(Iterator)을 set(String) 옆에 추가 → 각 파생 구현 → 전환 → 정리.
- 출처: 14장 String Arguments, p.234–237
- 태그: [일반]

**R14-62**
- 규칙: 다형성 이관이 끝나면 남은 찌꺼기 메서드(내부 위임용 set(String) 등)를 정리해 한 메서드 안에서 완결되게 다듬어라.
- 근거: IntegerArgumentMarshaler의 "crufty functions"를 제거하고 정리.
- 출처: 14장 String Arguments, p.237
- 태그: [일반]

**R14-63**
- 규칙: 상태나 구현을 갖지 않는 추상 클래스는 인터페이스로 바꿔라.
- 근거: ArgumentMarshaler가 추상 메서드만 남자 interface로 전환.
- 출처: 14장 String Arguments, p.237
- 태그: [일반]

**R14-64**
- 규칙: 리팩터링한 구조가 좋은지 검증하려면 실제로 새 변형(Double 타입)을 추가해 보고, 변경이 적고 격리되는지 확인하라.
- 근거: "구조에 새 인자 타입을 추가하는 게 얼마나 쉬운지 보자 — 변경이 적고 격리돼야 한다."
- 출처: 14장 String Arguments, p.237
- 태그: [일반]

**R14-65**
- 규칙: 새 기능은 그 기능을 검증하는 실패 테스트부터 작성하고 구현하라(TDD).
- 근거: Double 지원 전 testSimpleDoublePresent를 먼저 추가.
- 출처: 14장 String Arguments, p.237
- 태그: [일반]

**R14-66**
- 규칙: 새 기능을 넣을 때는 정상 경로뿐 아니라 오류 경로(잘못된 값, 값 누락)별 테스트를 각각 작성하라 — 이미 통과할 것 같아도 완전성을 위해 쓴다.
- 근거: testInvalidDouble, testMissingDouble — 후자는 "완전성을 위해" 작성.
- 출처: 14장 String Arguments, p.238–239
- 태그: [일반]

**R14-67**
- 규칙: 기능 추가에 손대는 김에 그 주변 코드(스키마 파싱 분기)도 정리하라.
- 근거: Double 추가 시 "스키마 파싱 코드를 정리하고" ## 감지를 추가.
- 출처: 14장 String Arguments, p.237
- 태그: [일반]

**R14-68**
- 규칙: 자기 모듈의 것이 아닌 예외(ParseException 등 남의 예외)를 공개 API로 던지지 말고, 모듈 전용 예외 하나로 통합하라.
- 근거: "ParseException은 우리 것이 아니다" — 모든 예외를 ArgsException 하나로 병합.
- 출처: 14장 String Arguments, p.239
- 태그: [일반]

**R14-69**
- 규칙: 예외 클래스와 오류 코드·오류 메시지 지원 코드는 독립 모듈(파일)로 분리하라.
- 근거: 오류 코드가 Args에 속하지 않으며, 분리하면 잡다한 오류 지원 코드를 옮길 자연스러운 자리가 생긴다.
- 출처: 14장 String Arguments, p.239, p.242
- 태그: [일반]

**R14-70**
- 규칙: 모듈이 던지는 예외는 한 종류로 제한하라.
- 근거: "이제 Args가 던지는 예외는 ArgsException뿐 — 좋다."
- 출처: 14장 String Arguments, p.242
- 태그: [일반]

**R14-71**
- 규칙: 예외에 대한 테스트는 예외 클래스 자체의 테스트(메시지 포맷: ArgsExceptionTest)와 사용 모듈 테스트(오류 코드·인자 ID 검증: ArgsTest)로 책임을 나눠 작성하라.
- 근거: Args 테스트는 errorCode/argumentId/parameter만 검증하고 메시지 문자열은 ArgsExceptionTest가 검증.
- 출처: 14장 String Arguments, p.242–245 (Listing 14-13, 14-14)
- 태그: [일반]

**R14-72**
- 규칙: 예외 테스트는 "예외가 던져지지 않으면 fail()"로 끝나는 try/catch 패턴을 쓰고, catch에서 오류 코드와 오류 문맥(인자 ID, 파라미터)을 단언하라.
- 근거: Listing 14-13의 모든 오류 테스트 형식.
- 예: `try { new Args("x#", …); fail(); } catch (ArgsException e) { assertEquals(INVALID_INTEGER, e.getErrorCode()); … }`
- 출처: 14장 String Arguments, p.242–244
- 태그: [일반] (구체 문법은 [Java특화] — JUnit3 TestCase)

**R14-73**
- 규칙: 테스트 이름은 검증하는 시나리오를 드러내게 지어라(testMissingStringArgument, testSpacesInFormat, testNonLetterSchema).
- 근거: 테스트 목록만으로 명세를 읽을 수 있다.
- 출처: 14장 String Arguments, p.242–244
- 태그: [일반]

**R14-74**
- 규칙: 경계 사례(스키마·인자 모두 없음, 스키마 없이 인자 있음, 공백 포함 형식, 문자가 아닌 이름)를 테스트로 명시하라.
- 근거: Listing 14-13이 이런 경계 사례를 모두 포함.
- 출처: 14장 String Arguments, p.242–243
- 태그: [일반]

**R14-75**
- 규칙: 오류 시 상태 플래그(valid)를 남기고 계속 진행하지 말고, 예상치 못한 인자도 즉시 예외로 던져라.
- 근거: 최종 parseElement는 unexpectedArguments/valid 대신 UNEXPECTED_ARGUMENT 예외를 던진다.
- 출처: 14장 String Arguments, p.248
- 태그: [일반]

**R14-76**
- 규칙: 특수 경우 지름길(스키마·인자 길이 0이면 바로 true 반환 등)이 일반 로직으로 이미 처리된다면 제거하라.
- 근거: 최종 parse()는 빈 입력 특수 처리 없이 parseSchema(); parseArguments();만 한다.
- 출처: 14장 String Arguments, p.247
- 태그: [일반]

**R14-77**
- 규칙: 리팩터링의 상당 부분이 삭제와 이동이 되도록 하라 — 코드가 줄고 제자리를 찾는 것이 진척의 신호다.
- 근거: "Args 변경의 대부분은 삭제였다… 많은 코드가 ArgsException으로 옮겨졌다."
- 출처: 14장 String Arguments, p.250
- 태그: [일반]

**R14-78**
- 규칙: 각 클래스(각 ArgumentMarshaler)는 자기 파일로 분리하라.
- 근거: "ArgumentMarshaller를 모두 각자의 파일로 옮겼다. 더 좋다!"
- 출처: 14장 String Arguments, p.250
- 태그: [일반]

**R14-79**
- 규칙: 좋은 설계의 핵심은 분할이다 — 서로 다른 종류의 코드를 둘 적절한 자리를 만들어 관심사를 분리하라.
- 근거: 관심사 분리는 코드를 이해·유지보수하기 훨씬 쉽게 만든다.
- 출처: 14장 String Arguments, p.250
- 태그: [일반]

**R14-80**
- 규칙: 오류 메시지 포맷팅을 인자 처리 클래스에 두지 말라(SRP) — 핵심 책임 클래스는 핵심 처리만 하게 하라.
- 근거: Args는 인자 처리에 관한 것이지 오류 메시지 형식에 관한 것이 아니다.
- 출처: 14장 String Arguments, p.250
- 태그: [일반]

**R14-81**
- 규칙: 책임 배치가 타협(예: 메시지 포맷을 예외 클래스에 둠)일 때는 그 트레이드오프(편의 vs 맞춤성)를 인지하고 의식적으로 선택하라.
- 근거: 기본 메시지의 편의가 무시할 수 없어 ArgsException에 두는 타협을 택했다.
- 출처: 14장 String Arguments, p.250
- 태그: [일반]

### 결론 (Conclusion) — p.250

**R14-82**
- 규칙: 코드가 동작하는 것만으로 만족하지 말라 — 동작하는 코드도 종종 심하게 망가져 있으며, 구조와 설계를 개선하는 것이 전문가의 의무다.
- 근거: 동작하는 코드에 만족하는 프로그래머는 비전문가처럼 행동하는 것이다.
- 출처: 14장 Conclusion, p.250
- 태그: [일반]

**R14-83**
- 규칙: "시간이 없다"는 이유로 구조 개선을 미루지 말라 — 나쁜 코드는 일정·요구사항·팀 문제보다 더 깊고 오래 프로젝트를 망친다.
- 근거: 나쁜 일정·요구사항·팀은 고칠 수 있지만 나쁜 코드는 썩어 팀을 끌어내린다.
- 출처: 14장 Conclusion, p.250
- 태그: [일반]

**R14-84**
- 규칙: 엉망을 만들었으면 쌓이기 전에 즉시 치워라(오전의 엉망은 오후에, 5분 전의 엉망은 지금).
- 근거: 썩은 코드는 숨은 의존성이 얽혀 정리 비용이 매우 크지만, 방금 만든 엉망은 치우기 쉽다.
- 출처: 14장 Conclusion, p.250
- 태그: [일반]

**R14-85**
- 규칙: 코드를 항상 가능한 한 깨끗하고 단순하게 유지하고, 부패가 시작되지 않게 하라.
- 근거: "Never let the rot get started."
- 출처: 14장 Conclusion, p.250
- 태그: [일반]

**R14-86**
- 규칙: 모듈 간 숨은·얽힌 의존성이 생기지 않게 경계를 유지하라.
- 근거: 코드가 썩으면 모듈이 서로 스며들어 숨은 의존성을 만들고, 그것을 찾아 끊기는 길고 고된 일이다.
- 출처: 14장 Conclusion, p.250
- 태그: [일반]

---

## 15장 JUnit 들여다보기 (JUnit Internals)

### JUnit 프레임워크 (The JUnit Framework) — p.252–265

**R15-01**
- 규칙: 모듈의 요구사항은 산문보다 테스트 케이스로 설명하라 — 테스트가 명세 역할을 하게 하라.
- 근거: "더 설명할 수 있지만 테스트 케이스가 더 잘한다."
- 출처: 15장 The JUnit Framework, p.252
- 태그: [일반]

**R15-02**
- 규칙: 테스트 자체의 구조도 비평 대상으로 삼아 더 단순하고 명확하게 만들 수 있는지 검토하라.
- 근거: 독자에게 "테스트 구조를 비평하라 — 더 단순하거나 명확할 수 있는가?"
- 출처: 15장 The JUnit Framework, p.252
- 태그: [일반]

**R15-03**
- 규칙: 리팩터링 전에 코드 커버리지를 측정해 모든 줄·if·for가 테스트로 실행되는지 확인하라.
- 근거: 100% 커버리지가 코드 동작에 대한 높은 확신을 준다(그래서 안심하고 리팩터링 가능).
- 출처: 15장 The JUnit Framework, p.254
- 태그: [일반]

**R15-04**
- 규칙: 버그 수정에는 그 버그를 재현하는 회귀 테스트를 추가하라(예: testBug609972).
- 근거: 테스트 목록에 보고된 버그 재현 케이스가 포함됨.
- 출처: 15장 The JUnit Framework, p.254 (Listing 15-1)
- 태그: [일반]

**R15-05**
- 규칙: null 입력·동일 입력·겹치는 일치·문맥 길이 0/양수 등 입력 조합의 경계 사례를 각각 테스트하라.
- 근거: ComparisonCompactorTest가 이 조합을 망라해 100% 커버.
- 출처: 15장 The JUnit Framework, p.252–254
- 태그: [일반]

**R15-06**
- 규칙: 출력 형식에 쓰이는 고정 문자열(ELLIPSIS, DELTA_START, DELTA_END)은 이름 있는 상수로 선언하라.
- 근거: 원본·최종본 모두 상수 사용, 상수 없는 "defactored" 버전은 "[", "..."가 흩어져 읽기 어렵다.
- 출처: 15장 The JUnit Framework, p.254, p.256
- 태그: [일반]

**R15-07**
- 규칙: ctxt, s1, s2, pfx, sfx, cmp1 같은 축약·무의미 이름을 쓰지 말고 contextLength, expected, actual, prefix 같은 서술적 이름을 써라.
- 근거: Listing 15-3(defactored)과 원본 비교로 이름의 가치를 보여 줌.
- 출처: 15장 The JUnit Framework, p.256
- 태그: [일반]

**R15-08**
- 규칙: 하나의 큰 함수에 루프·계산을 몰아넣지 말고 findCommonPrefix, findCommonSuffix, compactString처럼 의도를 드러내는 작은 함수로 분할하라.
- 근거: 원본이 "잘 분할되어 있고 표현력 있다"고 평가, 분할 안 된 버전과 대비.
- 출처: 15장 The JUnit Framework, p.254–256
- 태그: [일반]

**R15-09**
- 규칙: 이미 좋은 코드라도 보이스카우트 규칙에 따라 손댈 때는 발견했을 때보다 조금 더 깨끗하게 만들어 놓고 떠나라.
- 근거: "저자들이 매우 좋은 상태로 남겼지만 보이스카우트 규칙은 더 깨끗이 하라고 한다."
- 출처: 15장 The JUnit Framework, p.257; Conclusion, p.265
- 태그: [일반]

**R15-10**
- 규칙: 멤버 변수에 범위를 인코딩하는 접두어(f, m_ 등)를 붙이지 말라 [N6].
- 근거: 오늘날 개발 환경에서는 이런 범위 인코딩이 중복이다.
- 위반 예 → 개선 예: `fExpected` → `expected`
- 출처: 15장 The JUnit Framework, p.257
- 태그: [일반]

**R15-11**
- 규칙: 복합 조건문은 의도를 설명하는 이름의 함수로 추출(캡슐화)하라 [G28].
- 근거: 캡슐화하지 않은 조건은 의도가 불분명하다.
- 위반 예 → 개선 예: `if (expected == null || actual == null || areStringsEqual())` → `if (shouldNotCompact())`
- 출처: 15장 The JUnit Framework, p.257–258
- 태그: [일반]

**R15-12**
- 규칙: 지역 변수 이름이 멤버 변수와 같아 `this.`로 구분해야 하는 상황을 만들지 말라 — 다른 것을 뜻한다면 다른, 모호하지 않은 이름을 붙여라 [N4].
- 근거: 같은 이름이면 같은 것을 뜻하는지 독자가 헷갈린다.
- 위반 예 → 개선 예: `String expected = compactString(this.expected);` → `String compactExpected = compactString(expected);`
- 출처: 15장 The JUnit Framework, p.258
- 태그: [일반]

**R15-13**
- 규칙: 부정 조건보다 긍정 조건을 쓰라 — 부정형 조건 함수는 긍정형으로 뒤집어라 [G29].
- 근거: 부정문은 긍정문보다 이해하기 약간 더 어렵다.
- 위반 예 → 개선 예: `if (shouldNotCompact())` → `if (canBeCompacted())`
- 출처: 15장 The JUnit Framework, p.258
- 태그: [일반]

**R15-14**
- 규칙: 함수 이름은 부수 효과와 실제 반환값까지 포함해 함수가 하는 일을 정확히 서술하라 [N7].
- 근거: compact는 압축하지 않을 수도 있고(오류 검사 부수 효과를 숨김) 압축 문자열이 아니라 형식화된 메시지를 반환하므로 formatCompactedComparison이 맞다.
- 출처: 15장 The JUnit Framework, p.258
- 태그: [일반]

**R15-15**
- 규칙: 함수 이름은 인자와 함께 읽었을 때 자연스러운 문장이 되도록 지어라.
- 근거: formatCompactedComparison(message)는 인자와 함께 훨씬 잘 읽힌다.
- 출처: 15장 The JUnit Framework, p.258
- 태그: [일반]

**R15-16**
- 규칙: 함수는 한 가지 일만 하게 하라 — 포맷팅 함수는 포맷팅만, 압축 함수는 압축만 하도록 분리하라 [G30].
- 근거: compact... 함수는 압축 이외의 일을 해선 안 된다 → compactExpectedAndActual 추출.
- 출처: 15장 The JUnit Framework, p.258–259
- 태그: [일반]

**R15-17**
- 규칙: 한 함수 안의 호출들은 일관된 관례를 따르게 하라 — 일부는 값을 반환해 대입하고 일부는 멤버를 몰래 설정하는 식으로 섞지 말라 [G11].
- 근거: 마지막 두 줄은 반환값을 대입, 앞 두 줄은 아님 — 일관성 없음 → find 함수가 값을 반환하게 변경.
- 출처: 15장 The JUnit Framework, p.259
- 태그: [일반]

**R15-18**
- 규칙: 변수 이름은 실제 의미(인덱스인지 길이인지)를 정확히 반영하도록 바꿔라 [N1].
- 근거: prefix/suffix가 사실 인덱스여서 prefixIndex로, 이후 실제로는 길이라 suffixLength/prefixLength로 개명.
- 출처: 15장 The JUnit Framework, p.259, p.261
- 태그: [일반]

**R15-19**
- 규칙: 숨겨진 시간적 결합(호출 순서 의존)을 드러내라 — 한 함수가 다른 함수가 먼저 계산한 멤버 상태에 의존하면, 순서가 강제되도록 구조를 바꿔라 [G31].
- 근거: findCommonSuffix가 findCommonPrefix의 결과에 의존 — 순서가 바뀌면 어려운 디버깅이 기다린다.
- 출처: 15장 The JUnit Framework, p.259
- 태그: [일반]

**R15-20**
- 규칙: 시간적 결합을 인자 전달로 드러낼 때 그 인자가 왜 필요한지 설명되지 않는 임의적 구조라면 다른 방법을 택하라 [G32] — 선행 단계를 후행 함수 안에서 호출하고 이름에 함께 드러내라(findCommonPrefixAndSuffix).
- 근거: prefixIndex 인자 전달은 순서는 강제하지만 이유를 설명하지 못해 다른 프로그래머가 되돌릴 수 있다.
- 출처: 15장 The JUnit Framework, p.260
- 태그: [일반]

**R15-21**
- 규칙: 구조를 바로잡은 뒤 드러난 추한 코드(복잡한 루프 조건·인덱스 계산)는 의도를 드러내는 작은 도우미 함수(suffixOverlapsPrefix, charFromEnd)로 추출하라.
- 근거: 리팩터링이 findCommonPrefixAndSuffix의 추함을 드러냈고, 도우미 함수 추출로 "훨씬 낫다".
- 출처: 15장 The JUnit Framework, p.260–261
- 태그: [일반]

**R15-22**
- 규칙: 같은 개념에는 같은 용어를 써라 — 인덱스와 길이가 사실상 같은 경우라도 일관성을 위해 하나("length")로 통일하라.
- 근거: prefixIndex도 "length"로 쓰는 편이 더 일관적이다.
- 출처: 15장 The JUnit Framework, p.261
- 태그: [일반]

**R15-23**
- 규칙: 코드 곳곳에 흩어진 +1/-1 보정은 경계 조건을 캡슐화하지 못한 신호다 — 기준(0-기반/1-기반)을 바로잡고 보정은 그것이 자연스러운 한 곳(charFromEnd의 -1, <= 비교)에 모아라 [G33].
- 근거: suffixIndex가 1-기반이라 computeCommonSuffix에 +1이 흩어졌고, 고치자 suffixLength로 개명 가능해져 가독성이 크게 향상.
- 출처: 15장 The JUnit Framework, p.261–262
- 태그: [일반]

**R15-24**
- 규칙: 리팩터링 중 의미가 이상해 보이는 조건문을 발견하면 그것이 사실 무의미(항상 참/거짓)했던 것은 아닌지 분석하라.
- 근거: suffixIndex가 1 미만일 수 없어 `if (suffixLength > 0)`은 원래 기능이 없었다 — 숨은 버그성 코드 발견.
- 출처: 15장 The JUnit Framework, p.262
- 태그: [일반]

**R15-25**
- 규칙: 불필요해 보이는 코드는 주석 처리(또는 제거) 후 테스트를 돌려 확인하고, 통과하면 삭제하고 함수를 단순화하라 [G9].
- 근거: compactString의 두 if를 주석 처리하고 테스트가 통과하자 제거 → 함수가 단순한 조각 조합이 됨.
- 출처: 15장 The JUnit Framework, p.262
- 태그: [일반]

**R15-26**
- 규칙: 문자열을 여러 조각으로 조립하는 함수는 각 조각을 이름 있는 함수(startingEllipsis, startingContext, delta, endingContext, endingEllipsis)로 만들고 순서대로 이어 붙여 구성을 그대로 읽히게 하라.
- 근거: 최종 compact는 조각들을 조합하는 것이 한눈에 보인다.
- 출처: 15장 The JUnit Framework, p.262, p.264
- 태그: [일반]

**R15-27**
- 규칙: 하위 문자열 계산의 시작·끝 같은 중간값에는 의미 있는 이름의 지역 변수(contextStart, contextEnd, deltaStart, deltaEnd)를 써서 긴 식을 풀어라.
- 근거: 원본의 긴 substring 식과 비교해 최종본의 설명 변수가 의도를 드러냄.
- 출처: 15장 The JUnit Framework, p.264
- 태그: [일반]

**R15-28**
- 규칙: 조건 분기마다 return을 중복하기보다, 기본값으로 변수를 초기화하고 조건에 따라 덮어쓴 뒤 단일 return하는 편이 더 단순하면 그렇게 하라.
- 근거: 최종 formatCompactedComparison은 compactExpected=expected로 시작해 조건부로 덮어쓰고 Assert.format 한 번 호출.
- 출처: 15장 The JUnit Framework, p.263
- 태그: [일반]

**R15-29**
- 규칙: 모듈 안 함수들을 분석 함수 그룹과 합성 함수 그룹으로 나누고, 각 정의가 사용 직후에 오도록 위상 정렬하라(분석 먼저, 합성 나중).
- 근거: 최종본이 "꽤 예쁜" 이유 — 분석/합성 분리 + 사용 직후 정의.
- 출처: 15장 The JUnit Framework, p.265
- 태그: [일반]

**R15-30**
- 규칙: 앞서 한 리팩터링 결정(추출, 조건 방향)을 나중에 되돌리는 것을 주저하지 말라 — 리팩터링은 시행착오를 반복하며 수렴하는 과정이다.
- 근거: 추출했던 메서드를 다시 인라인하고 조건 방향도 다시 바꿨다 — "전형적이다".
- 출처: 15장 The JUnit Framework, p.265
- 태그: [일반]

**R15-31**
- 규칙: 부정 조건을 피할 수 없을 때는 긍정형 래퍼(shouldBeCompacted → !shouldNotBeCompacted)로 호출부를 긍정형으로 유지하고, 부정형 본체는 기본 사실(null이거나 같음)을 그대로 서술하게 하라.
- 근거: 최종본의 shouldBeCompacted/shouldNotBeCompacted 쌍.
- 출처: 15장 The JUnit Framework, p.263, p.265
- 태그: [일반]

**R15-32**
- 규칙: 여러 줄에 걸친 긴 불리언 식은 연산자 단위로 줄을 나눠 각 조건이 한 줄에 하나씩 보이게 정렬하라.
- 근거: 최종 shouldNotBeCompacted가 `expected == null ||` / `actual == null ||` / `expected.equals(actual)`로 정렬.
- 출처: 15장 The JUnit Framework, p.263
- 태그: [일반]

**R15-33**
- 규칙: 문자열 조립은 `+` 연결 대신 빌더(StringBuilder 체인)로 각 조각을 한 줄씩 append하라.
- 근거: 최종 compact가 StringBuilder 체인으로 조각을 나열.
- 출처: 15장 The JUnit Framework, p.264
- 태그: [Java특화]

### 결론 (Conclusion) — p.265

**R15-34**
- 규칙: 이미 잘 작성된 모듈이라도 개선의 여지가 없다고 가정하지 말고, 손대는 모든 코드를 발견했을 때보다 조금 더 낫게 남겨라.
- 근거: "어떤 모듈도 개선에서 면제되지 않으며, 각자 코드를 조금 더 낫게 남길 책임이 있다."
- 출처: 15장 Conclusion, p.265
- 태그: [일반]

---

## 커버리지 확인

- 마지막으로 읽은 줄: 3629 (파일 끝 — 3627 "This page intentionally left blank", 3628 다음 장 번호 "16")
- 만난 절 제목 (순서대로):
  - 14장 Successive Refinement — Case Study of a Command-Line Argument Parser (도입부, p.193–194)
  - Args Implementation (p.194)
  - How Did I Do This? (p.200)
  - Args: The Rough Draft (p.201)
  - So I Stopped (p.212)
  - On Incrementalism (p.212)
  - String Arguments (p.214)
  - Conclusion (p.250)
  - 15장 JUnit Internals (도입부, p.251)
  - The JUnit Framework (p.252)
  - Conclusion (p.265)
- 총 규칙 수: 120 (14장 86 + 15장 34)
