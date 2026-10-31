# Clean Code — 부록 B(SerialDate 리팩터링 전후 코드)·부록 C(휴리스틱 교차참조)·에필로그·색인 규칙 추출

> **전수 카탈로그** — `clean-code-rules` 스킬의 참조 파일. 원전: Clean Code (Robert C. Martin, 2008) — `docs/pdf/Clean Code ( PDFDrive.com ).pdf`. 이 범위의 본문을 한 줄도 빼지 않고 읽어 추출했다(파일 끝 "커버리지 확인" 참고).
> **인용 형식**: `cc5:#<번호>` (예: `cc5:#3`). 번호는 파일 전체에서 1–58 연속이다.
> **쪽수**: 인쇄본 쪽수 / Listing 번호. 부록 B 원본(B-1~B-6)→최종본(B-7~B-16) 비교로 추출, 부록 C 휴리스틱 교차참조표 포함
> 부록 B 코드 안에는 냄새 코드 주석이 없다. 그래서 냄새 코드는 (a) 부록 C에서 16장 쪽수(267–284쪽 = SerialDate 리팩터링 장)를 인용한 항목과 (b) 색인의 16장 쪽수 항목(예: "MonthConstants를 enum으로 바꾸기, 272", "default constructor 삭제, 276")을 맞대어 붙였다. 쪽수 근거가 약한 연결은 "(추정)"으로 표시했다.

## A. 프로덕션 코드 리팩터링 규칙 (원본 B-1/B-3/B-5 → 최종 B-7~B-16)

### 이름 짓기 (Naming)

1. **규칙:** 클래스 이름은 구현 방식이 아니라 추상 개념을 나타내게 지어라 (예: `SerialDate` → `DayDate`).
   - 근거: "serial number"는 구현 세부이고, 이 클래스가 나타내는 개념은 "하루 정밀도의 날짜"다.
   - 출처: B-1 vs B-7, 16장 270–271쪽 (색인 "names of classes", "names at the wrong level of abstraction 271")
   - 냄새: N2(적절한 추상 수준의 이름), N1
   - 태그: [일반]

2. **규칙:** 인코딩이나 형식을 흉내 낸 이름(`getYYYY`, `yyyy`, `baseDOW`, `mm/dd/yy`, `ss1`, `sss`)은 서술적인 이름(`getYear`, `year`, `daysUpToMonth`, `firstOrdinalOfYear`)으로 바꿔라.
   - 근거: 형식 코드나 축약어를 읽으려면 독자가 머릿속에서 따로 풀어야 한다.
   - 출처: B-1·B-5 vs B-7·B-16 (`calcSerial` → `calcOrdinal`), 16장
   - 냄새: N1, N6(인코딩 피하기)
   - 태그: [일반]

3. **규칙:** 메서드 이름은 하는 일을 정확히 말하게 지어라. 새 객체를 돌려주는 연산은 변경을 암시하는 `add*` 대신 `plus*`로 짓고, 차이를 돌려주는 `compare`는 `daysSince`로 지어라.
   - 근거: `addDays`는 자기 자신을 바꾸는 것처럼 읽히지만 실제로는 새 날짜를 돌려준다. 불변 객체에서는 오해를 부른다.
   - 출처: B-1 `addDays`/`addMonths`/`addYears`/`compare` vs B-7 `plusDays`/`plusMonths`/`plusYears`/`daysSince`, 16장 290쪽
   - 냄새: G20(함수 이름은 하는 일을 말해야 한다), N4(모호하지 않은 이름)
   - 태그: [일반]

4. **규칙:** 범위·구간 같은 개념에는 표준 용어를 써라 (`INCLUDE_NONE/FIRST/SECOND/BOTH` → `OPEN/CLOSED_LEFT/CLOSED_RIGHT/CLOSED`).
   - 근거: 수학의 구간 용어는 누구나 이미 아는 어휘다.
   - 출처: B-1 178–187행 vs B-10, 16장 276쪽 (색인 "range, including end-point dates in, 276")
   - 냄새: N3(가능하면 표준 명명법 사용)
   - 태그: [일반]

5. **규칙:** 내부 값을 나타내는 이름은 구현이 아닌 의미로 지어라 (`serial` → `ordinalDay`, `SERIAL_LOWER_BOUND` → `EARLIEST_DATE_ORDINAL`, `toSerial()` → `getOrdinalDay()`).
   - 근거: "serial"은 Excel 구현에서 온 말이다. "ordinal day"는 개념을 직접 말한다.
   - 출처: B-5 89·153행 vs B-16 82·91·123행
   - 냄새: N2
   - 태그: [일반]

6. **규칙:** 필드와 같은 개념을 가리키는 매개변수에는 역할이 드러나는 이름(`anOrdinalDay`, `aMonth`, `startingYear`)을 붙여 필드와 구분하라.
   - 근거: `year` 필드와 지역 `year`가 섞이면 어느 값인지 헷갈린다.
   - 출처: B-16 179–201행 (`huntForYearContaining(int anOrdinalDay, int startingYear)`)
   - 태그: [일반]

### 주석 (Comments)

7. **규칙:** 파일 헤더의 변경 이력(Changes 날짜별 기록)은 지우고, 이력은 버전 관리 시스템에 맡겨라.
   - 근거: 저널 주석은 VCS와 중복되고 시간이 지나면 낡는다.
   - 출처: B-1 37–56행, B-5 37–52행 vs B-7(헤더 생략), 16장 270쪽 (색인 "change history, deleting, 270")
   - 냄새: C1(부적절한 정보)
   - 태그: [일반]

8. **규칙:** 메서드 이름과 시그니처를 되풀이할 뿐인 Javadoc(`@param code the code being checked` 류)은 지워라.
   - 근거: 정보는 더해 주지 않고 잡음만 늘리며, 코드가 바뀌면 거짓이 된다.
   - 출처: B-1 전반 vs B-7(메서드 Javadoc 0개), 16장 272·275·276쪽 (색인 "redundant comments 272, 275", "javadocs as clutter 276")
   - 냄새: C3(중복 주석), G12(잡동사니)
   - 태그: [일반]

9. **규칙:** 내용이 틀린 주석(예: `isOnOrBefore`, `isAfter`, `isOnOrAfter`의 Javadoc이 모두 "same date"라고 적힌 복붙)은 고치거나 지워라.
   - 근거: 오해를 부르는 주석은 주석이 없는 것보다 해롭다.
   - 출처: B-1 937–968행, B-5 333–370행 vs B-7(삭제)
   - 냄새: C2(낡은 주석), C3
   - 태그: [일반]

10. **규칙:** "Need to find a better approach." 같은 혼잣말 주석과, 코드가 이미 말하는 단계 표시 주석(`// check arguments...`, `// find the date...`)은 지워라. 문제가 있다면 코드를 고쳐라.
    - 근거: 해결 의도만 남기고 행동하지 않는 주석은 잡음이다.
    - 출처: B-1 275·641·648·745·768행 vs B-7
    - 냄새: C4(서툰 주석), C3
    - 태그: [일반]

11. **규칙:** 코드만으로 알 수 없는 외부 사정을 설명하는 주석(Excel의 1900년 윤년 버그, 1-Jan-1900=2 규약)과 클래스의 존재 이유를 설명하는 주석("Why not just use java.util.Date?")은 남겨라.
    - 근거: 의도나 비자명한 외부 제약을 알려 주는 주석은 좋은 주석이다.
    - 출처: B-7 42–57행, B-16 61–80행 (최종본에도 유지됨)
    - 태그: [일반]

### 상수·enum (Constants / Enums)

12. **규칙:** 서로 관련된 `int` 상수 묶음(월·요일·주차·상대 위치·구간 포함 코드)은 enum으로 바꿔라.
    - 근거: enum은 유효하지 않은 값을 타입 수준에서 막고, 행동을 붙일 자리를 준다.
    - 출처: B-3 MonthConstants, B-1 109–205행 → B-8 `Month`, B-9 `Day`, B-11 `WeekInMonth`, B-12 `WeekdayRange`, B-10 `DateInterval`, 16장 272·277쪽 (색인 "enum(s), changing MonthConstants to, 272", "DAY enumeration, 277")
    - 냄새: J3(상수 대 enum)
    - 태그: [Java특화] (원칙은 일반이다. 타입이 있는 열거형이 있는 언어에는 다 적용된다)

13. **규칙:** 인터페이스를 구현(`implements MonthConstants`)해서 상수를 상속받지 마라. 필요하면 static import나 enum을 써라.
    - 근거: 상수 상속은 상수의 출처를 숨기고 상속 계층을 오용한다.
    - 출처: B-1 86–88행 vs B-7 60행 (`DayDate implements Comparable, Serializable`만 남음), B-16 57행 `import static org.jfree.date.Month.FEBRUARY`, 16장 271쪽 (색인 "constants, inheriting, 271")
    - 냄새: J2(상수를 상속하지 마라)
    - 태그: [Java특화]

14. **규칙:** `isValidXxxCode(int)` 같은 유효성 함수는 enum 타입으로 없애라. 정수를 받아야 하는 경계에서는 `fromInt`가 잘못된 값에 즉시 예외를 던지게 하라.
    - 근거: 타입이 유효성을 보장하면 호출자가 따로 검사할 필요가 없다.
    - 출처: B-1 `isValidWeekdayCode`/`isValidMonthCode`/`isValidWeekInMonthCode` 225–493행 vs B-8 20–26행, B-9 22–28행
    - 냄새: J3, G5
    - 태그: [일반]

15. **규칙:** 매직 넘버는 이름 있는 상수나 enum 값으로 바꿔라 (`1900` → `MINIMUM_YEAR_SUPPORTED`, 끝의 `+1` → `EARLIEST_DATE_ORDINAL`, `1` → `Month.JANUARY.toInt()`, 요일 기준값 → `Day.SUNDAY.toInt()`).
    - 근거: 숫자만 보고는 의미를 알 수 없고, 같은 값이 여러 곳에 흩어진다.
    - 출처: B-5 112·433·441·452행 vs B-16 97–100·159–164·169행, B-7 73·77·141–143행
    - 냄새: G25(매직 넘버를 이름 있는 상수로)
    - 태그: [일반]

16. **규칙:** 범위를 알리는 예외 메시지는 리터럴을 박지 말고 같은 상수로 조립하라 (`"must be in range " + MINIMUM_YEAR_SUPPORTED + " to " + MAXIMUM_YEAR_SUPPORTED`).
    - 근거: 상수가 바뀌면 메시지도 자동으로 따라간다. 리터럴은 거짓이 된다.
    - 출처: B-5 116–118행 vs B-16 98–100행 (같은 파일 116–117행 serial 메시지는 리터럴로 남은 비일관 사례)
    - 냄새: G25, G11(비일관성)
    - 태그: [일반]

### 책임 배치·구조 (Placement / Structure)

17. **규칙:** 기반 클래스가 파생 클래스를 알게 하지 마라. 구체 인스턴스 생성(`new SpreadsheetDate(...)`)은 추상 팩토리(`DayDateFactory` + `SpreadsheetDateFactory`)로 옮겨라.
    - 근거: 기반 클래스가 파생 클래스에 의존하면 둘을 따로 배포하거나 교체할 수 없다.
    - 출처: B-1 795–827행 `createInstance` vs B-14, B-15, 16장 273–274쪽 (색인 "ABSTRACT FACTORY pattern 273, 274", "base classes knowing about derivatives 273")
    - 냄새: G7(기반 클래스가 파생 클래스에 의존)
    - 태그: [일반]

18. **규칙:** 팩토리에는 구현을 갈아 끼울 수 있는 정적 설정 지점(`setInstance`)을 두어라.
    - 근거: 테스트나 다른 구현이 생성 전략을 대체할 수 있게 된다.
    - 출처: B-14 4–7행
    - 태그: [일반]

19. **규칙:** 상수와 표는 그것을 실제로 쓰는 클래스로 옮겨라 (`LAST_DAY_OF_MONTH` → `Month`, `AGGREGATE_DAYS_*`·`EARLIEST/LATEST_DATE_ORDINAL`·`MIN/MAX_YEAR` → `SpreadsheetDate`).
    - 근거: 구현 세부가 추상 클래스에 있으면 추상화 수준이 섞인다.
    - 출처: B-1 97–160행 vs B-8 11–12행, B-16 82–89행, 16장 273·275쪽 (색인 "tables, moving, 275", "variables moving to a different class 273")
    - 냄새: G6(잘못된 추상 수준의 코드), G17(잘못 둔 책임)
    - 태그: [일반]

20. **규칙:** 어떤 타입의 데이터만 다루는 함수는 그 타입의 메서드로 옮겨라 (`monthCodeToQuarter` → `Month.quarter()`, `monthCodeToString` → `Month.toString()`, `stringToMonthCode` → `Month.parse()`, `stringToWeekdayCode` → `Day.parse()`).
    - 근거: 다른 클래스의 데이터만 만지는 함수는 기능 욕심(feature envy)이다.
    - 출처: B-1 250–472행 vs B-8, B-9, 16장 278–279쪽 (색인 "feature envy, smelling of, 278", "Month enum 278", "functions moving 279")
    - 냄새: G14(기능 욕심), G17
    - 태그: [일반]

21. **규칙:** 같은 타입의 기준값을 인자로 받는 static 메서드(`addDays(days, base)`)는 인스턴스 메서드(`plusDays(days)`)로 바꿔라. static을 감싸기만 하던 인스턴스 오버로드는 지워라.
    - 근거: 다형적으로 동작할 수 있는 연산을 static으로 두는 것은 부적절하다. 같은 연산이 두 번 있으면 중복이다.
    - 출처: B-1 571–726행 및 1006–1032행 vs B-7 68–119행, 16장 280쪽 (색인 "methods changing from static to instance 280")
    - 냄새: G18(부적절한 static), G5
    - 태그: [일반]

22. **규칙:** 인스턴스 메서드는 `this`를 대상으로 동작하게 하라. 같은 타입의 매개변수를 받으면서 `this`를 무시하는 인스턴스 메서드(`getEndOfCurrentMonth(base)`)를 만들지 마라.
    - 근거: 원본은 호출하려면 아무 의미 없는 더미 인스턴스가 필요했다(B-4 394행 `createInstance(2)`). 놀람 최소 원칙에 어긋난다.
    - 출처: B-1 735–740행, B-4 393–408행 vs B-7 121–126행 `getEndOfMonth()`
    - 냄새: G18, G2(당연한 동작 미구현) (추정)
    - 태그: [일반]

23. **규칙:** 어떤 인스턴스와도 무관한 순수 계산(`isLeapYear`, `lastDayOfMonth`, `leapYearCount`)은 별도 유틸리티 클래스(`DateUtil`)의 static 함수로 모아라.
    - 근거: static이 맞는 함수는 다형성이 필요 없는 함수뿐이다. 그런 함수는 추상 클래스에서 빼낸다.
    - 출처: B-1 502–560행 vs B-13, 16장 279쪽 (색인 "static function, 279")
    - 냄새: G18
    - 태그: [일반]

24. **규칙:** 논리적 의존을 물리적으로 드러내라. 하위 클래스가 기반 클래스의 가정을 하드코딩(`(serial + 6) % 7 + 1`)하지 말고, 기반 클래스가 추상 메서드(`getDayOfWeekForOrdinalZero()`)로 필요한 값을 명시적으로 요구하게 하라.
    - 근거: 숨은 가정은 구현을 바꾸면 조용히 깨진다.
    - 출처: B-5 246–248행 vs B-7 66·139–144행, B-16 139행, 16장 282쪽 (색인 "logical dependencies, 282")
    - 냄새: G22(논리적 의존을 물리적으로)
    - 태그: [일반]

25. **규칙:** 추상 클래스에는 꼭 필요한 기본 연산만 추상으로 남기고(`getOrdinalDay`, `getYear`, `getMonth`, `getDayOfMonth`), 그것으로 구할 수 있는 연산(`isOn`, `isBefore`, `isInRange`, `daysSince`, `getDayOfWeek`)은 기반 클래스에서 한 번만 구현하라.
    - 근거: 원본은 비교 연산 8개를 추상으로 두어 구현체마다 같은 코드를 반복하게 했다.
    - 출처: B-1 913–995행 + B-5 291–419행 vs B-7 61–64·146–178행, 16장 282쪽 (색인 "abstract methods, modifying, 282")
    - 냄새: G5(중복), G6
    - 태그: [일반]

26. **규칙:** 정수 코드에 따라 갈리는 if/else 사슬은 행동을 가진 다형적 enum(각 상수가 `isIn`을 구현)으로 바꿔라.
    - 근거: 분기가 타입 안에 들어가면 새 경우를 추가해도 호출부가 바뀌지 않는다.
    - 출처: B-5 399–419행 vs B-10, B-7 174–178행, 16장 282–283쪽 (색인 "DateInterval enum, 282–283")
    - 냄새: G23(if/else·switch보다 다형성)
    - 태그: [일반]

27. **규칙:** 공개 상수·필드·메서드를 줄여라. 내부 도구(`DATE_FORMAT_SYMBOLS`)는 `private static`으로 숨겨라.
    - 근거: 인터페이스가 넓을수록 결합이 늘어난다.
    - 출처: B-1 94–95행 `public static final DATE_FORMAT_SYMBOLS` vs B-8 10행, B-9 16행, B-13 6행 (모두 private)
    - 냄새: G8(과도한 정보)
    - 태그: [일반]

28. **규칙:** 쓰이지 않는 코드는 지워라: 미사용 표(`AGGREGATE_DAYS_TO_END_OF_MONTH`, `LEAP_YEAR_AGGREGATE_DAYS_TO_END_OF_MONTH`), 미사용 기능(`description` 필드와 getter/setter, `getMonths`, `weekInMonthToString`, `relativeToString`).
    - 근거: 죽은 코드는 읽는 비용만 들고 가치는 없다.
    - 출처: B-1 143–153·207–208·293–316·751–783·851–862행, B-5 100–101·173–185행 vs B-7·B-16 (삭제됨), 16장 283쪽 부근 (추정)
    - 냄새: G9(죽은 코드), F4(죽은 함수)
    - 태그: [일반]

29. **규칙:** 아무것도 하지 않는 기본 생성자(`protected SerialDate() {}`)는 지워라.
    - 근거: 컴파일러가 만들어 주는 것과 같은 코드는 잡음이다.
    - 출처: B-1 213–214행 vs B-7, 16장 276쪽 (색인 "default constructor, deleting, 276")
    - 냄새: G12(잡동사니)
    - 태그: [Java특화]

30. **규칙:** 매개변수와 지역 변수에 붙은 기계적인 `final`은 걷어 내라 (팀 규칙이 요구하지 않는 한).
    - 근거: 실질적인 보호는 거의 없고 시각적 잡음만 늘린다.
    - 출처: B-1·B-5 전반 vs B-7·B-16, 16장 276쪽 (색인 "final keywords, 276")
    - 냄새: G12
    - 태그: [Java특화]

31. **규칙:** `java.util` 같은 한 패키지에서 여러 클래스를 들여올 때는 와일드카드 import로 목록을 줄여라.
    - 근거: 긴 import 목록은 잡음이고, 와일드카드는 강한 의존을 만들지 않는다.
    - 출처: B-1 61–65행 vs B-7 39–40행 `import java.util.*;`, 16장 270쪽 (색인 "import lists, shortening in SerialDate, 270")
    - 냄새: J1(와일드카드로 긴 import 목록 피하기)
    - 태그: [Java특화]

32. **규칙:** 직렬화 버전 ID(`serialVersionUID`)를 습관처럼 손으로 고정하지 마라. 호환되지 않는 버전 간 역직렬화가 조용히 성공하는 것보다 실패하는 편이 낫다.
    - 근거: 수동 ID는 구조가 바뀐 클래스도 역직렬화를 허용해 버린다.
    - 출처: B-1 91행, B-5 83행 vs B-7(제거), 16장 272쪽 (색인 "manual control, over a serial ID, 272", "versions, not deserializing across, 272")
    - 태그: [Java특화]

### 함수 (Functions)

33. **규칙:** 플래그 boolean 인자로 동작을 고르는 함수(`monthCodeToString(month, shortened)`, `getMonths(shortened)`)는 목적별 함수(`toString()`, `toShortString()`)로 나눠라.
    - 근거: boolean 인자는 함수가 두 가지 일을 한다는 신호다. 호출부의 `true`/`false`는 뜻을 알 수 없다.
    - 출처: B-1 307–316·406–426행 vs B-8 36–42행, 16장 278쪽 (색인 "methods calling a twin with a flag, 278")
    - 냄새: G15(선택자 인자), F3(플래그 인자)
    - 태그: [일반]

34. **규칙:** 공통 로직은 이름 있는 private 함수로 뽑아 중복을 없애라 (`addMonths`와 `addYears`의 말일 보정 → `correctLastDayOfMonth`, 생성 경로 → `firstOrdinalOfYear`).
    - 근거: 같은 계산이 여러 곳에 있으면 고칠 때 하나를 빠뜨린다.
    - 출처: B-1 597–599·620–622행 vs B-7 79·85·89–94행, B-16 203–205행
    - 냄새: G5(중복), G33(경계 조건 캡슐화)
    - 태그: [일반]

35. **규칙:** 긴 계산 함수는 단계마다 의도를 드러내는 이름의 함수로 쪼개라 (`calcDayMonthYear` → `huntForYearContaining`, `firstOrdinalOfYear`, `huntForMonthContaining`, `daysBeforeThisMonth`).
    - 근거: 한 함수는 한 가지 일만, 한 추상 수준에서만 해야 한다.
    - 출처: B-5 447–493행 vs B-16 167–205행
    - 냄새: G30(함수는 한 가지 일), G34(한 단계 추상만 내려가기)
    - 태그: [일반]

36. **규칙:** 복잡한 산술이나 조건식은 의미 있는 이름의 설명 변수로 나눠 써라 (`thisMonthAsOrdinal`, `resultMonthAndYearAsOrdinal`, `fourth`/`hundredth`/`fourHundredth`, `offsetToTarget`).
    - 근거: 중간값에 이름이 붙으면 공식이 저절로 설명된다.
    - 출처: B-1 502–517·593–596행 vs B-7 72–81·96–119행, B-13 12–17행, 16장 279–281쪽 (색인 "temporary variables, explaining, 279–281")
    - 냄새: G19(설명 변수 사용)
    - 태그: [일반]

37. **규칙:** 알고리즘을 이해한 다음에는 단순한 형태로 다시 써라. 원본 `getPreviousDayOfWeek`·`getNearestDayOfWeek`의 `Math.min/max` 조합은 오프셋 계산 몇 줄로 줄일 수 있다.
    - 근거: "아마 돌아가겠지" 수준의 코드에는 버그가 숨는다 (원본 `getNearestDayOfWeek`에는 실제로 버그가 있었다).
    - 출처: B-1 638–726행 vs B-7 96–119행, 16장 269–270쪽 (색인 "algorithms, correcting, 269–270")
    - 냄새: G21(알고리즘을 이해하라)
    - 태그: [일반]

38. **규칙:** 의미 없는 별칭 변수(`final int dd = d;`)를 만들지 말고, 의미가 담긴 값(`int daysInMonth = day - 1;`)으로 써라.
    - 근거: 값을 그냥 옮겨 담는 변수는 아무것도 설명하지 않는다.
    - 출처: B-5 440–441행 vs B-16 163–164행
    - 냄새: G12, G19
    - 태그: [일반]

39. **규칙:** 인자 검사는 앞쪽에서 "잘못되면 바로 throw"하는 가드 절로 써라. 유효할 때만 대입하는 if/else 중첩은 쓰지 마라. 검사를 마친 뒤 필드를 한꺼번에 대입하라.
    - 근거: 정상 흐름이 들여쓰기 없이 위에서 아래로 읽힌다.
    - 출처: B-5 110–143행 vs B-16 96–108행, B-16 141–147행 `equals`의 이른 반환
    - 태그: [일반]

40. **규칙:** 같은 일을 하는 생성자 오버로드는 하나의 주 생성자에 위임하라 (`SpreadsheetDate(int, int, int)` → `this(day, Month.fromInt(month), year)`).
    - 근거: 검증 로직이 한 곳에만 있게 된다.
    - 출처: B-16 110–112행
    - 냄새: G5
    - 태그: [일반]

### 오류 처리 (Error handling)

41. **규칙:** 변환이나 파싱에 실패하면 `-1` 같은 신호값이나 `"ERROR : Relative To String"` 같은 오류 문자열을 반환하지 말고 예외를 던져라.
    - 근거: 신호값은 호출자가 확인을 잊으면 조용히 퍼진다. 오류 문자열은 정상 값과 구별할 수 없다.
    - 출처: B-1 247–268·437–470·760·780행 vs B-8 44–55행, B-9 30–45행
    - 냄새: G3(경계에서의 잘못된 동작), G26(정확하라) (추정)
    - 태그: [일반]

42. **규칙:** 예외 메시지에는 문제를 일으킨 값을 넣어라 (`"Invalid month index " + monthIndex`, `String.format("%s is not a valid weekday string", s)`).
    - 근거: 값 없이 "invalid code."만 있으면 원인을 추적할 수 없다.
    - 출처: B-1 371–372행 vs B-8 25·54행, B-9 26–27·43–44행
    - 태그: [일반]

43. **규칙:** `NumberFormatException`을 삼키며 신호값으로 흘려보내는 파싱 흐름은 한 함수 안에서 끝을 맺어라. 파싱을 모두 시도했는데도 실패하면 마지막에 반드시 예외를 던져라.
    - 근거: 원본은 예외를 삼킨 뒤 `-1`이 남는 경로가 있어 "0"·"13" 같은 입력이 애매하게 처리됐다 (B-4 153–154행의 todo 테스트가 이를 드러낸다).
    - 출처: B-1 449–454행 vs B-8 50–54행
    - 태그: [일반]

### 동작·일관성 (Behavior / Consistency)

44. **규칙:** 사용자가 당연히 기대하는 동작은 구현하라. 이름 파싱은 대소문자를 가리지 않아야 한다(`equalsIgnoreCase`).
    - 근거: 원본은 "monday", "JAN"을 인식하지 못했고, 그것을 검증하는 테스트들이 주석 처리되어 있었다.
    - 출처: B-1 259·263·459·463행 (`equals`), B-4 23–63·163–213행 (주석 처리된 기대) vs B-8 57–60행, B-9 38–39행
    - 냄새: G2(당연한 동작 미구현), T4
    - 태그: [일반]

45. **규칙:** 객체 생성 경로를 하나로 통일하라 (모든 생성은 `DayDateFactory.makeDate`를 거친다).
    - 근거: 같은 일을 여러 방식으로 하면 독자가 차이를 찾느라 헤맨다.
    - 출처: B-1 `SerialDate.createInstance`가 여기저기 흩어져 있음 vs B-7 69·80·86·125행
    - 냄새: G11(비일관성)
    - 태그: [일반]

46. **규칙:** 문자열 표현은 연결 연산 대신 형식 문자열로 만들고, 구성 요소의 `toString`에 맡겨라 (`String.format("%02d-%s-%d", day, month, year)`).
    - 근거: 형식이 한눈에 보이고, 월 이름 변환 책임이 `Month`에 머문다.
    - 출처: B-1 869–872행 vs B-7 135–137행
    - 태그: [일반]

47. **규칙:** enum의 정수 매핑 조회는 `values()`를 도는 하나의 `fromInt`로 구현하라. 상수를 하나하나 나열한 switch는 쓰지 마라.
    - 근거: 상수를 추가해도 조회 코드는 바뀌지 않는다.
    - 출처: B-1 227–238·328–344행 vs B-8 20–26행, B-9 22–28행
    - 태그: [Java특화]

## B. 테스트 규칙 (원본 B-2 → Bob의 B-4, 그리고 리팩터링 과정)

48. **규칙:** 리팩터링에 들어가기 전에 대상 코드를 철저히 덮는 테스트를 먼저 써라. 함수마다 정상 값, 경계(윤년, 2월 말일, 1900·2100·2400년), 예외 경로를 확인하라.
    - 근거: 원본 SerialDateTests는 커버리지가 낮아 리팩터링을 지켜 주지 못했다.
    - 출처: B-2 vs B-4 (예: 223–270행), 16장 268–269쪽
    - 냄새: T1(불충분한 테스트), T5(경계 조건 테스트)
    - 태그: [일반]

49. **규칙:** 커버리지 도구로 테스트되지 않은 코드를 찾아라.
    - 근거: 원본 테스트가 무엇을 덮지 못하는지 Clover로 측정했다.
    - 출처: 16장 268–269쪽 (색인 "Clover, 268, 269"; B-4가 그 결과물이다)
    - 냄새: T2(커버리지 도구 사용)
    - 태그: [일반]

50. **규칙:** 실패하는 테스트를 지우지 마라. 주석 처리(`//todo`)한 테스트는 명세가 모호하거나 버그가 있다는 질문으로 다루고, 결국 해결해서 다시 살려라.
    - 근거: 무시된 테스트는 모호함에 대한 질문이다. B-4의 주석 테스트들은 대소문자 파싱, 범위 밖 월, `getNearestDayOfWeek` 버그를 가리켰다.
    - 출처: B-4 23–63·153–154·163–213·318·338·346–383·417–433행, 16장 269쪽
    - 냄새: T4(무시한 테스트는 모호함에 대한 질문)
    - 태그: [일반]

51. **규칙:** 버그가 하나 나온 함수 주변은 철저하게 테스트하라 (예: `getNearestDayOfWeek`를 요일 7개 × 입력일 7개로 전수 점검).
    - 근거: 버그는 모여 있는 경향이 있다.
    - 출처: B-4 329–391행, 16장 269쪽
    - 냄새: T6(버그 근처는 철저히), T7(실패 패턴이 드러낸다)
    - 태그: [일반]

52. **규칙:** 하찮아 보이는 함수(`weekdayCodeToString`, `monthCodeToQuarter`)도 테스트를 생략하지 마라.
    - 근거: 사소한 테스트도 문서 역할을 하고, 그것을 쓰는 비용은 작다.
    - 출처: B-4 66–102행
    - 냄새: T3(사소한 테스트를 건너뛰지 마라)
    - 태그: [일반]

53. **규칙:** 단언은 `assertEquals(expected, actual)` 순서를 지켜라.
    - 근거: 원본 `assertEquals(SerialDate.leapYearCount(1899), 0)`는 순서가 거꾸로라서 실패 메시지가 오해를 부른다.
    - 출처: B-2 235–263행 vs B-4 239–253행
    - 태그: [일반]

54. **규칙:** 테스트 안에서 예외를 잡아 출력만 하고(`catch (Exception e) { System.out.println(e) }`) 넘어가지 마라. 테스트 메서드가 `throws Exception`을 선언해서 예외를 실패로 드러내게 하라.
    - 근거: 삼킨 예외는 실제 원인을 숨기고, 엉뚱한 단언 실패로 바뀐다.
    - 출처: B-2 274–286행 vs B-4 전 테스트 `throws Exception`
    - 태그: [Java특화]

55. **규칙:** 반복되는 생성 코드는 짧은 테스트 도우미(`d(day, month, year)`)로 감싸서 테스트를 도메인 언어처럼 읽히게 하라.
    - 근거: 잡음이 줄어 테스트의 의도(입력 → 기대값)가 드러난다.
    - 출처: B-4 280행 `private static SpreadsheetDate d(...)`
    - 태그: [일반]

56. **규칙:** 기본 로케일 같은 실행 환경에 따라 결과가 달라지는 테스트는 피하라. 피할 수 없다면 의존성을 명시하고 고정하라.
    - 근거: 원본 테스트 주석은 "영어 로케일이 아니면 실패한다…더 나은 테스트를 고안하라"고 인정했다. 환경에 따라 결과가 달라지면 반복 가능하지 않다.
    - 출처: B-2 163–164·174–175·191–192행
    - 태그: [일반]

57. **규칙:** 잘못된 입력에 대한 예외 동작도 명세로 보고 테스트하라 (`try { ...; fail(...) } catch (IllegalArgumentException e) {}`).
    - 근거: 오류 경로도 공개 동작의 일부다.
    - 출처: B-4 97–101·131–135·310–314·322–326·386–390행
    - 냄새: T5
    - 태그: [일반]

## C. 에필로그 규칙

58. **규칙:** 테스트 주도 개발과 깨끗한 코드 작성을 그때그때의 선택이 아닌 직업윤리 차원의 약속으로 다뤄라. 일정에 쫓겨도 테스트를 먼저 쓰고 깨끗하게 짜는 일을 건너뛰지 마라.
   - 근거: 저자는 "Test Obsessed" 팔찌를 벗을 수 없었다. 그것을 벗는 것은 최선의 코드를 쓰겠다는 약속을 배신하는 일이었다.
   - 출처: Epilogue, 411쪽
   - 태그: [일반]

## D. 부록 C: 휴리스틱 교차 참조 전체 표

부록 C 원문에는 코드와 "장-쪽" 목록만 있고 제목은 없다. 아래 제목은 17장(285–314쪽)의 휴리스틱 제목이며, 대조 편의를 위해 붙였다. 쪽 표기는 원문 그대로다 ("16-276" = 16장 276쪽).

| 코드 | 제목 (17장) | 인용 위치 (원문 그대로) |
|---|---|---|
| C1 | Inappropriate Information (부적절한 정보) | 16-276, 16-279, 17-292 |
| C2 | Obsolete Comment (낡은 주석) | 16-279, 16-285, 16-295, 17-292 |
| C3 | Redundant Comment (중복 주석) | 16-283, 16-285, 16-288, 17-293 |
| C4 | Poorly Written Comment (서툰 주석) | 17-293 |
| C5 | Commented-Out Code (주석 처리된 코드) | 17-293 |
| E1 | Build Requires More Than One Step (여러 단계가 필요한 빌드) | 17-294 |
| E2 | Tests Require More Than One Step (여러 단계가 필요한 테스트) | 17-294 |
| F1 | Too Many Arguments (너무 많은 인자) | 14-239, 17-295 |
| F2 | Output Arguments (출력 인자) | 17-295 |
| F3 | Flag Arguments (플래그 인자) | 17-295 |
| F4 | Dead Function (죽은 함수) | 14-289, 16-273, 16-285, 16-287, 16-288, 17-295 |
| G1 | Multiple Languages in One Source File (한 소스 파일에 여러 언어) | 16-276, 17-295 |
| G2 | Obvious Behavior Is Unimplemented (당연한 동작 미구현) | 16-273, 16-274, 17-296 |
| G3 | Incorrect Behavior at the Boundaries (경계에서의 잘못된 동작) | 16-274, 17-296 |
| G4 | Overridden Safeties (무시한 안전 장치) | 9-31, 16-279, 16-286, 16-291, 17-297 |
| G5 | Duplication (중복) | 9-31, 16-279, 16-286, 16-291, 16-296, 17-297 |
| G6 | Code at Wrong Level of Abstraction (잘못된 추상 수준의 코드) | 6-106, 16-280, 16-283, 16-284, 16-289, 16-293, 16-294, 16-296, 17-299 |
| G7 | Base Classes Depending on Their Derivatives (파생 클래스에 의존하는 기반 클래스) | 16-281, 16-283, 17-300 |
| G8 | Too Much Information (과도한 정보) | 16-283, 17-301 |
| G9 | Dead Code (죽은 코드) | 16-283, 16-285, 16-286, 16-287, 17-302 |
| G10 | Vertical Separation (수직 분리) | 5-86, 15-264, 16-276, 16-284, 17-302 |
| G11 | Inconsistency (비일관성) | 15-264, 16-284, 16-288, 16-292, 17-302 |
| G12 | Clutter (잡동사니) | 16-284, 16-285, 16-286, 16-287, 16-288, 16-295, 17-303 |
| G13 | Artificial Coupling (인위적 결합) | 16-286, 16-288, 17-303 |
| G14 | Feature Envy (기능 욕심) | 16-288, 16-292, 17-304 |
| G15 | Selector Arguments (선택자 인자) | 16-288, 17-305 |
| G16 | Obscured Intent (모호한 의도) | 16-289, 17-306 |
| G17 | Misplaced Responsibility (잘못 둔 책임) | 16-289, 17-307, 17-312 |
| G18 | Inappropriate Static (부적절한 static) | 16-289, 16-290, 16-291, 17-308 |
| G19 | Use Explanatory Variables (설명 변수 사용) | 16-290, 16-291, 16-292, 17-309 |
| G20 | Function Names Should Say What They Do (함수 이름은 하는 일을 말해야) | 16-290, 17-309 |
| G21 | Understand the Algorithm (알고리즘을 이해하라) | 16-291, 17-310 |
| G22 | Make Logical Dependencies Physical (논리적 의존을 물리적으로) | 16-294, 17-322 |
| G23 | Prefer Polymorphism to If/Else or Switch/Case (if/else·switch보다 다형성) | ??-44, 14-239, 16-295, 17-313 |
| G24 | Follow Standard Conventions (표준 관례를 따르라) | 16-296, 17-313 |
| G25 | Replace Magic Numbers with Named Constants (매직 넘버를 이름 있는 상수로) | 16-296, 17-314 |
| G26 | Be Precise (정확하라) | 17-316 |
| G27 | Structure over Convention (관례보다 구조) | 17-316 |
| G28 | Encapsulate Conditionals (조건 캡슐화) | 15-262, 17-317 |
| G29 | Avoid Negative Conditionals (부정 조건 피하기) | 15-262, 17-317 |
| G30 | Functions Should Do One Thing (함수는 한 가지 일만) | 15-263, 17-317 |
| G31 | Hidden Temporal Couplings (숨은 시간적 결합) | 15-264, 17-318 |
| G32 | Don't Be Arbitrary (일관성 없이 하지 마라) | 15-265, 17-319 |
| G33 | Encapsulate Boundary Conditions (경계 조건 캡슐화) | 15-265, 15-266, 17-320 |
| G34 | Functions Should Descend Only One Level of Abstraction (한 단계 추상만 내려가기) | 1-40, 6-106, 17-321 |
| G35 | Keep Configurable Data at High Levels (설정 데이터는 높은 수준에) | 5-90, 17-323 |
| G36 | Avoid Transitive Navigation (추이적 탐색 피하기) | 6-103, 17-324 |
| J1 | Avoid Long Import Lists by Using Wildcards (와일드카드로 긴 import 목록 피하기) | 16-276, 17-325 |
| J2 | Don't Inherit Constants (상수를 상속하지 마라) | 16-278, 16-285, 17-326 |
| J3 | Constants versus Enums (상수 대 enum) | 16-283, 16-285, 17-327 |
| N1 | Choose Descriptive Names (서술적인 이름) | 15-264, 16-277, 16-279, 16-282, 16-287, 16-288, 16-289, 16-290, 16-294, 16-296, 17-328 |
| N2 | Choose Names at the Appropriate Level of Abstraction (적절한 추상 수준의 이름) | 16-277, 17-330 |
| N3 | Use Standard Nomenclature Where Possible (가능하면 표준 명명법) | 16-284, 16-288, 17-331 |
| N4 | Unambiguous Names (모호하지 않은 이름) | 15-263, 16-291, 17-332 |
| N5 | Use Long Names for Long Scopes (긴 범위에는 긴 이름) | 2-26, 14-221, 15-262, 17-332 |
| N6 | Avoid Encodings (인코딩 피하기) | 15-261, 17-333 |
| N7 | Names Should Describe Side-Effects (이름으로 부수 효과 설명) | 15-263, 17-333 |
| T1 | Insufficient Tests (불충분한 테스트) | 16-273, 16-274, 17-334 |
| T2 | Use a Coverage Tool! (커버리지 도구 사용) | 16-273, 17-334 |
| T3 | Don't Skip Trivial Tests (사소한 테스트를 건너뛰지 마라) | 16-274, 17-334 |
| T4 | An Ignored Test Is a Question about an Ambiguity (무시한 테스트는 모호함에 대한 질문) | 17-334 |
| T5 | Test Boundary Conditions (경계 조건 테스트) | 16-274, 16-275, 17-335 |
| T6 | Exhaustively Test Near Bugs (버그 근처는 철저히) | 16-275, 17-335 |
| T7 | Patterns of Failure Are Revealing (실패 패턴이 드러낸다) | 16-275, 17-335 |
| T8 | Test Coverage Patterns Can Be Revealing (커버리지 패턴이 드러낸다) | 16-275, 17-335 |
| T9 | Tests Should Be Fast (테스트는 빨라야 한다) | 17-336 |

**코드 수: 66개** (C 5 · E 2 · F 4 · G 36 · J 3 · N 7 · T 9).

원문에서 이상해 보이는 인용 (다른 청크와 대조할 때 주의):
- F4의 "14-289": 14장은 289쪽까지 가지 않으므로 오탈자로 보인다.
- G23의 "??-44": 장 번호가 비어 있다 (3장 44쪽 근방으로 추정).
- G22의 "17-322", G35의 "17-323", G36의 "17-324": 17장 G 절의 쪽 순서가 다른 G 항목들과 맞지 않는다. 원문 그대로 둔다.
- G17은 17장 안에서 307쪽과 312쪽 두 곳에 인용된다.
- 16장 인용이 하나도 없는 코드: C4, C5, E1, E2, F1~F3, G26~G36, N5~N7, T9. 이들은 SerialDate 사례에서는 등장하지 않으므로 다른 장의 청크에서 확인해야 한다.

## 커버리지 확인

- 마지막으로 읽은 행: **4508** (파일 총 4508행, 끝까지 읽음. 800행 단위 Read 6회: 1–800, 800–1599, 1600–2399, 2400–3199, 3200–3999, 4000–4508)
- 거친 섹션:
  - 부록 B: Listing B-1 SerialDate.java(1–1123행), B-2 SerialDateTests.java(1127–1476), B-3 MonthConstants.java(1480–1577), B-4 BobsSerialDateTest.java(1581–2077), B-5 SpreadsheetDate.java(2081–2612), B-6 RelativeDayOfWeekRule.java(2616–2841), B-7 DayDate.java Final(2845–3006), B-8 Month.java(3010–3076), B-9 Day.java(3080–3135), B-10 DateInterval.java(3139–3166), B-11 WeekInMonth.java(3170–3185), B-12 WeekdayRange.java(3189–3195), B-13 DateUtil.java(3199–3232), B-14 DayDateFactory.java(3236–3276), B-15 SpreadsheetDateFactory.java(3280–3315), B-16 SpreadsheetDate.java Final(3319–3501)
  - 부록 C: Cross References of Heuristics (3503–3581)
  - 에필로그 (3582–3604)
  - 색인 Index (3606–4508). 규칙 본문은 없다. 16장 쪽수 항목은 위 규칙에 냄새와 쪽수를 붙이는 근거로 썼다.
- 참고: B-6 RelativeDayOfWeekRule에는 리팩터링된 최종본이 없다 (`switch`의 `default: break;`가 `null`을 돌려주는 원본만 있다). 그래서 이 파일에서는 규칙을 따로 뽑지 않았다.
