# Clean Code — 13장 동시성 · 16장 SerialDate 리팩터링 · 17장 냄새와 휴리스틱 · 부록 A 동시성 II — 규칙 추출

> **전수 카탈로그** — `clean-code-rules` 스킬의 참조 파일. 원전: Clean Code (Robert C. Martin, 2008) — `docs/pdf/Clean Code ( PDFDrive.com ).pdf`. 이 범위의 본문을 한 줄도 빼지 않고 읽어 추출했다(파일 끝 "커버리지 확인" 참고).
> **인용 형식**: `cc3:<규칙ID>` (예: `cc3:G5`). 규칙 ID는 이 파일 안에서만 유일하다.
> **쪽수**: 인쇄본 쪽수(본문 러닝 헤더 기준). 17장 냄새 코드(C·E·F·G·J·N·T) 66개 전부 수록
> 출처 표기: 장 + 절 제목 (+ 냄새 코드) + 책 쪽수(러닝 헤더 기준). 태그: [일반] 언어 무관 / [Java특화] Java·당대 환경에서만 의미.

---

# 13장 동시성 (Chapter 13: Concurrency, Brett L. Schuchert)

## 동시성이 필요한 이유 (Why Concurrency?)

### R13-1
- 규칙: 동시성은 "무엇(what)"과 "언제(when)"를 분리하는 결합도 해소 전략으로 취급하고, 처리량·응답시간·구조상 이점이 실제로 있을 때만 도입하라.
- 근거: what/when 분리는 처리량과 구조를 개선하지만(작은 협력 컴퓨터들), 대가가 크다.
- 출처: 13장 Why Concurrency?, p.178–179
- 태그: [일반]

### R13-2
- 규칙: 대기(I/O 등) 시간이 지배적인 작업(다수 웹사이트 수집, 다수 사용자 처리, 독립 데이터셋 처리)에서 병렬화를 고려하라.
- 근거: 단일 스레드가 소켓 I/O 대기로 시간을 허비하는 경우 다중 스레드로 개선된다.
- 출처: 13장 Why Concurrency?, p.179
- 태그: [일반]

## 미신과 오해 (Myths and Misconceptions)

### R13-3
- 규칙: "동시성은 항상 성능을 높인다"고 가정하지 말고, 스레드/프로세서가 공유할 대기 시간이 많은지 측정한 뒤 판단하라.
- 근거: 성능 향상은 공유 가능한 대기 시간이 많을 때만 생긴다.
- 출처: 13장 Myths and Misconceptions, p.179
- 태그: [일반]

### R13-4
- 규칙: 동시성 프로그램을 작성할 때는 설계가 단일 스레드와 근본적으로 달라질 수 있음을 전제로 설계를 재검토하라.
- 근거: what/when 분리는 시스템 구조에 거대한 영향을 미친다.
- 출처: 13장 Myths and Misconceptions, p.179–180
- 태그: [일반]

### R13-5
- 규칙: 웹/EJB 컨테이너 등 프레임워크를 쓰더라도 컨테이너가 동시성을 어떻게 다루는지 파악하고 동시 갱신·데드락에 대비하라.
- 근거: 컨테이너의 결합도 해소는 완벽하지 않다.
- 출처: 13장 Myths and Misconceptions, p.179
- 태그: [일반]

### R13-6
- 규칙: 동시성은 성능·코드량 오버헤드를 수반하고 단순 문제에서도 복잡함을 인정하여, 비용 대비 이득을 따져 도입하라.
- 근거: 동시성은 오버헤드가 있고, 올바른 동시성은 단순한 문제에서도 복잡하다.
- 출처: 13장 Myths and Misconceptions, p.179–180
- 태그: [일반]

### R13-7
- 규칙: 재현되지 않는 동시성 버그를 일회성(one-off)으로 치부하지 말고 실제 결함으로 다뤄라.
- 근거: 동시성 버그는 재현이 잘 안 되어 우주선·글리치로 무시되기 쉽다.
- 출처: 13장 Myths and Misconceptions, p.180
- 태그: [일반]

## 난관 (Challenges)

### R13-8
- 규칙: `++counter` 같은 한 줄 연산도 원자적이라고 가정하지 말고, 공유 가변 상태에 대한 읽기-수정-쓰기는 반드시 보호하라.
- 근거: getNextId()의 `++lastIdUsed`는 두 스레드에서 12,870가지 경로가 있고 일부는 같은 값(43,43)을 반환한다.
- 위반 예 → 개선 예: `return ++lastIdUsed;` (비동기) → `synchronized` 또는 AtomicInteger 사용
- 출처: 13장 Challenges, p.180
- 태그: [일반]

## 동시성 방어 원칙 (Concurrency Defense Principles)

### 단일 책임 원칙 (Single Responsibility Principle)

#### R13-9
- 규칙: 동시성 관련 코드를 다른(비즈니스) 코드와 분리하라.
- 근거: 동시성 코드는 고유한 개발·변경·튜닝 생명주기와 고유한 난제를 가지므로 그 자체로 변경 이유다.
- 출처: 13장 Concurrency Defense Principles / Single Responsibility Principle, p.181
- 태그: [일반]

### 따름정리: 데이터 범위를 제한하라 (Corollary: Limit the Scope of Data)

#### R13-10
- 규칙: 공유될 수 있는 데이터는 캡슐화하고 접근을 엄격히 제한하며, 공유 데이터를 갱신하는 임계영역(critical section)의 수를 최소화하라.
- 근거: 갱신 지점이 많을수록 보호 누락, 중복(DRY 위반), 장애 원인 추적 곤란이 늘어난다.
- 출처: 13장 Corollary: Limit the Scope of Data, p.181
- 태그: [일반]

### 따름정리: 데이터 사본을 사용하라 (Corollary: Use Copies of Data)

#### R13-11
- 규칙: 가능하면 객체를 공유하지 말고 복사해 읽기 전용으로 쓰거나, 스레드별 사본에 결과를 모은 뒤 단일 스레드에서 병합하라.
- 근거: 공유를 피하면 문제가 훨씬 적고, 동기화(내장 락) 회피로 객체 생성·GC 비용을 상쇄할 가능성이 크다(비용은 실험으로 확인).
- 출처: 13장 Corollary: Use Copies of Data, p.181–182
- 태그: [일반]

### 따름정리: 스레드는 가능한 한 독립적으로 구현하라 (Corollary: Threads Should Be as Independent as Possible)

#### R13-12
- 규칙: 각 스레드가 다른 스레드와 데이터를 공유하지 않도록, 필요한 데이터를 비공유 출처에서 받아 지역 변수에 저장하게 작성하고, 데이터를 독립 부분집합으로 분할해 독립 스레드가 처리하게 하라.
- 근거: 서블릿이 doGet/doPost 매개변수와 지역변수만 쓰면 동기화 문제가 없다.
- 출처: 13장 Corollary: Threads Should Be as Independent as Possible, p.182
- 태그: [일반]

## 라이브러리를 이해하라 (Know Your Library)

#### R13-13
- 규칙: 스레드 안전 컬렉션(예: ConcurrentHashMap)을 사용하라.
- 근거: java.util.concurrent 컬렉션은 안전하고 성능이 좋으며 복합 연산을 지원한다; ConcurrentHashMap은 거의 모든 상황에서 HashMap보다 낫다.
- 출처: 13장 Know Your Library / Thread-Safe Collections, p.182–183
- 태그: [Java특화]

#### R13-14
- 규칙: 서로 무관한 작업 실행에는 executor 프레임워크를 사용하라.
- 근거: 직접 스레드 관리보다 안전하다.
- 출처: 13장 Know Your Library, p.182
- 태그: [Java특화]

#### R13-15
- 규칙: 가능하면 넌블로킹(nonblocking) 해법을 사용하라.
- 근거: 락 비용·경합을 피한다(부록 A에서 상세).
- 출처: 13장 Know Your Library, p.182
- 태그: [일반]

#### R13-16
- 규칙: 사용하는 라이브러리 클래스가 스레드 안전한지 확인하고, 그렇지 않은 클래스는 공유 시 보호하라.
- 근거: 여러 라이브러리 클래스가 스레드 안전하지 않다.
- 출처: 13장 Know Your Library, p.182
- 태그: [일반]

#### R13-17
- 규칙: 언어가 제공하는 동시성 클래스(Java라면 java.util.concurrent, .atomic, .locks — ReentrantLock·Semaphore·CountDownLatch 등)를 검토하고 숙지하라.
- 근거: 고급 동시성 설계를 지원하는 검증된 도구를 재발명하지 않기 위해.
- 출처: 13장 Thread-Safe Collections, p.183
- 태그: [Java특화]

## 실행 모델을 이해하라 (Know Your Execution Models)

#### R13-18
- 규칙: 한정된 자원(Bound Resources)·상호 배제(Mutual Exclusion)·기아(Starvation)·데드락(Deadlock)·라이브락(Livelock) 개념을 기준으로 동시성 설계를 검토하라.
- 근거: 실행 모델을 논의하기 위한 기본 정의.
- 출처: 13장 Know Your Execution Models, p.183
- 태그: [일반]

#### R13-19
- 규칙: 생산자-소비자(Producer-Consumer), 읽기-쓰기(Readers-Writers), 식사하는 철학자(Dining Philosophers) 알고리즘과 해법을 익히고, 마주친 동시성 문제를 이 변형으로 환원해 풀어라.
- 근거: 대부분의 동시성 문제는 이 세 문제의 변형이다.
- 출처: 13장 Producer-Consumer / Readers-Writers / Dining Philosophers, p.184–185
- 태그: [일반]

#### R13-20
- 규칙: 생산자-소비자 큐는 한정 자원으로 다루어, 생산자는 빈 공간을, 소비자는 항목을 기다리고 서로 시그널하게 설계하라.
- 근거: 큐가 bound resource이므로 상호 시그널이 필요.
- 출처: 13장 Producer-Consumer, p.184
- 태그: [일반]

#### R13-21
- 규칙: 읽기-쓰기 공유 자원에서는 처리량과 기아(쓰기 측/읽기 측) 사이 균형을 명시적으로 설계하라.
- 근거: 읽기 우선이면 쓰기가 굶고, 쓰기 우선이면 처리량이 떨어진다.
- 출처: 13장 Readers-Writers, p.184
- 태그: [일반]

## 동기화하는 메서드 사이에 존재하는 의존성을 이해하라 (Beware Dependencies Between Synchronized Methods)

#### R13-22
- 규칙: 공유 객체 하나에서 여러 메서드를 호출하지 마라; 불가피하면 클라이언트 기반 잠금(Client-Based Locking), 서버 기반 잠금(Server-Based Locking), 연결 서버(Adapted Server) 중 하나로 원자성을 보장하라.
- 근거: 동기화 메서드가 여러 개면 개별 메서드는 보호돼도 메서드 간 조합은 보호되지 않는다.
- 출처: 13장 Beware Dependencies Between Synchronized Methods, p.185
- 태그: [일반]

## 동기화하는 부분을 작게 만들어라 (Keep Synchronized Sections Small)

#### R13-23
- 규칙: 임계영역은 반드시 보호하되, 동기화 블록은 가능한 한 작게 만들어라(임계영역을 크게 잡아 수를 줄이려 하지 마라).
- 근거: 락은 지연·오버헤드를 만들며, 최소 임계영역 이상으로 동기화하면 경합이 늘고 성능이 떨어진다.
- 출처: 13장 Keep Synchronized Sections Small, p.185
- 태그: [일반]

## 올바른 종료 코드는 구현하기 어렵다 (Writing Correct Shut-Down Code Is Hard)

#### R13-24
- 규칙: 정상 종료(graceful shutdown)는 초기부터 고민하고 일찍 동작하게 만들며, 기존 알고리즘을 검토하라.
- 근거: 데드락된 자식 스레드를 기다리는 부모, 종료 시그널을 받지 못하고 생산자를 기다리는 소비자 등 종료는 예상보다 오래 걸린다.
- 출처: 13장 Writing Correct Shut-Down Code Is Hard, p.186
- 태그: [일반]

## 스레드 코드 테스트하기 (Testing Threaded Code)

#### R13-25
- 규칙: 문제를 드러낼 잠재력이 있는 테스트를 작성하고, 다양한 프로그램 설정·시스템 설정·부하로 자주 실행하며, 한 번이라도 실패하면 원인을 추적하라(다음 실행에서 통과했다고 무시하지 마라).
- 근거: 스레드가 공유 데이터를 다루면 테스트로 위험을 줄이는 것이 훨씬 복잡해진다.
- 출처: 13장 Testing Threaded Code, p.186
- 태그: [일반]

### 말이 안 되는 실패는 잠정적인 스레드 문제로 취급하라 (Treat Spurious Failures as Candidate Threading Issues)

#### R13-26
- 규칙: 시스템 실패를 일회성(one-off)으로 무시하지 말고 잠재적 스레드 문제로 조사하라.
- 근거: 스레드 버그는 천~백만 번에 한 번 나타나며, 무시할수록 결함 위에 코드가 쌓인다.
- 출처: 13장 Treat Spurious Failures as Candidate Threading Issues, p.187
- 태그: [일반]

### 다중 스레드를 고려하지 않은 순차 코드부터 제대로 돌게 만들자 (Get Your Nonthreaded Code Working First)

#### R13-27
- 규칙: 스레드가 호출할 로직을 스레드를 모르는 POJO로 만들어 스레드 밖에서 먼저 검증하고, 스레드 버그와 비스레드 버그를 동시에 쫓지 마라.
- 근거: 스레드 비인지 코드는 스레드 환경 밖에서 테스트할 수 있고, 그런 코드가 많을수록 좋다.
- 출처: 13장 Get Your Nonthreaded Code Working First, p.187
- 태그: [일반]

### 다중 스레드를 쓰는 코드 부분을 다양한 환경에 쉽게 끼워 넣을 수 있도록 스레드 코드를 구현하라 (Make Your Threaded Code Pluggable)

#### R13-28
- 규칙: 스레드 코드를 스레드 수(1개/여러 개/실행 중 변경), 실제/테스트 더블 협력자, 빠르게/느리게/가변 속도 더블, 반복 횟수 설정으로 실행할 수 있게 플러그형으로 만들어라.
- 근거: 다양한 설정에서 돌려야 숨은 버그가 드러난다.
- 출처: 13장 Make Your Threaded Code Pluggable, p.187
- 태그: [일반]

### 다중 스레드를 쓰는 코드 부분을 상황에 맞춰 조정할 수 있게 작성하라 (Make Your Threaded Code Tunable)

#### R13-29
- 규칙: 스레드 수를 쉽게 조정할 수 있게(가능하면 실행 중 변경·처리량 기반 자가 조정까지) 만들고, 초기부터 설정별 성능을 측정할 방법을 마련하라.
- 근거: 적정 스레드 수는 시행착오로만 찾는다.
- 출처: 13장 Make Your Threaded Code Tunable, p.187–188
- 태그: [일반]

### 프로세서 수보다 많은 스레드를 돌려보라 (Run with More Threads Than Processors)

#### R13-30
- 규칙: 테스트 시 프로세서/코어 수보다 많은 스레드를 돌려 태스크 스와핑을 유도하라.
- 근거: 스와핑이 잦을수록 임계영역 누락·데드락을 발견할 가능성이 높다.
- 출처: 13장 Run with More Threads Than Processors, p.188
- 태그: [일반]

### 다른 플랫폼에서 돌려보라 (Run on Different Platforms)

#### R13-31
- 규칙: 스레드 코드를 모든 대상 배포 플랫폼에서 일찍, 자주 실행해 테스트하라.
- 근거: OS마다 스레드 정책이 달라 OS X에서 실패하던 테스트가 XP에서는 덜 실패했다.
- 출처: 13장 Run on Different Platforms, p.188
- 태그: [일반]

### 코드에 보조 코드를 넣어 돌려라. 강제로 실패를 일으키게 해보라 (Instrument Your Code to Try and Force Failures)

#### R13-32
- 규칙: wait/sleep/yield/priority 호출 같은 계측(instrumentation)을 넣어 실행 순서를 흔들어, 동시성 결함이 가능한 한 일찍·자주 실패하게 만들어라.
- 근거: 수천 경로 중 극소수만 실패하므로 정상 처리에서는 결함이 숨는다.
- 출처: 13장 Instrument Your Code to Try and Force Failures, p.188
- 태그: [일반]

#### R13-33
- 규칙: 수동 계측(hand-coded, 예: `Thread.yield(); // inserted for testing.`)은 까다로운 코드에 국한하고 프로덕션에 남기지 마라; 계측 지점을 찾기 쉽도록 스레드 비인지 POJO와 스레드 제어 클래스를 분리하라.
- 근거: 수동 계측은 위치 선정이 어렵고, 프로덕션을 느리게 하며, 산탄총식이다. yield로 깨졌다면 원래 깨진 코드다.
- 출처: 13장 Hand-Coded, p.189
- 태그: [일반]

#### R13-34
- 규칙: AOP·CGLIB·ASM 등이나 `ThreadJigglePoint.jiggle()` 같은 지글 지점(프로덕션은 no-op 구현, 테스트는 sleep/yield/통과를 무작위 선택 구현)으로 자동 계측하고, 테스트를 수천 번 반복 실행하라.
- 근거: 잘 짠 테스트 + 지글링은 오류 발견 확률을 극적으로 높이며, 테스트 중에만 적용하고 프로덕션에서는 끌 수 있다(ConTest 같은 도구도 있음).
- 출처: 13장 Automated, p.189–190
- 태그: [일반] (도구명은 [Java특화])

## 결론 (Conclusion)

#### R13-35
- 규칙: 스레드 인지 코드는 작고 집중되게 만들고, 테스트할 때는 스레드 인지 코드만 테스트되게 하라.
- 근거: SRP 준수 — 스레드 인지 코드와 비인지 코드를 POJO로 분리.
- 출처: 13장 Conclusion, p.190
- 태그: [일반]

#### R13-36
- 규칙: 공유 데이터에 대한 다중 스레드 연산, 공용 자원 풀 사용, 깨끗한 종료·루프 반복 종료 같은 경계 사례를 동시성 문제의 출처로 점검하라.
- 근거: 이런 경계 사례가 특히 까다롭다.
- 출처: 13장 Conclusion, p.190
- 태그: [일반]

#### R13-37
- 규칙: 잠가야 할 영역만 찾아 잠그고, 필요 없는 영역은 잠그지 말며, 잠긴 영역에서 다른 잠긴 영역을 호출하지 마라.
- 근거: 잠금 남용·중첩은 성능 저하와 데드락을 부른다.
- 출처: 13장 Conclusion, p.191
- 태그: [일반]

#### R13-38
- 규칙: 공유 객체 수와 공유 범위를 최대한 좁히고, 클라이언트가 공유 상태를 관리하게 강요하지 말고 공유 데이터를 가진 객체의 설계를 바꿔 클라이언트를 수용하라.
- 근거: 공유 상태 관리 책임을 서버 쪽에 두어야 올바르기 쉽다.
- 출처: 13장 Conclusion, p.191
- 태그: [일반]

#### R13-39
- 규칙: 스레드 관련 코드를 여러 설정·플랫폼에서 반복적·지속적으로 실행할 수 있게 하고(TDD 3법칙에서 오는 플러그 가능성), 계측에 일찍 투자해 프로덕션 투입 전 최대한 오래 돌려라.
- 근거: one-off 문제는 부하 하에서나 무작위로만 나타난다.
- 출처: 13장 Conclusion, p.191
- 태그: [일반]

---

# 16장 SerialDate 리팩터링 (Chapter 16: Refactoring SerialDate)

## 도입부 (서론, p.267–268)

#### R16-1
- 규칙: 좋은 코드라도 전문가적 코드 리뷰(professional review)를 하고, 자신의 코드에 대한 비평도 환영하라.
- 근거: 비평을 통해서만 배운다 — 의사·조종사·변호사도 한다.
- 출처: 16장 서론, p.268
- 태그: [일반]

## 첫째, 돌려보자 (First, Make It Work)

#### R16-2
- 규칙: 리팩터링 전에 커버리지 도구로 기존 테스트가 무엇을 실행하지 않는지 확인하고, 부족하면 독립적인 단위 테스트 스위트를 먼저 작성해 커버리지를 높여라.
- 근거: 기존 테스트는 185문장 중 91개(~50%)만 실행 [T1][T2]; 완전히 이해하고 리팩터링하려면 커버리지가 필요하다(새 테스트로 92%).
- 출처: 16장 First, Make It Work, p.268
- 태그: [일반]

#### R16-3
- 규칙: "Find Usages"로 호출되지 않는 메서드를 찾아 테스트되지 않는 죽은 코드로 식별하라.
- 근거: MonthCodeToQuarter는 사용되지 않아 테스트되지도 않았다 [F4].
- 출처: 16장 First, Make It Work, p.268
- 태그: [일반]

#### R16-4
- 규칙: 아직 통과하지 않지만 마땅히 가져야 할 동작은 테스트로 먼저 적어 두고, 리팩터링하며 통과시켜라.
- 근거: 주석 처리된(실패) 테스트가 SerialDate가 가져야 할 동작을 나타낸다.
- 출처: 16장 First, Make It Work, p.268
- 태그: [일반]

#### R16-5
- 규칙: 이름에서 자명하게 기대되는 동작(예: 요일/월 문자열 파싱의 대소문자 무시, 약어 지원)을 구현하라.
- 근거: 동작이 당연해 보였다 [G2]; equalsIgnoreCase로 쉽게 해결.
- 위반 예 → 개선 예: `s.equals(monthNames[i])` → `s.equalsIgnoreCase(monthNames[i])`
- 출처: 16장 First, Make It Work, p.268–269
- 태그: [일반]

#### R16-6
- 규칙: 경계 조건(예: 같은 요일의 "다음 요일"은 7일 뒤)을 테스트로 검증하고 off-by-one 비교 연산자(`>` vs `>=`)를 점검하라.
- 근거: getFollowingDayOfWeek가 12/25(토)의 다음 토요일로 12/25를 반환 — 전형적 경계 조건 오류 [G3][T1][T5].
- 위반 예 → 개선 예: `if (baseDOW > targetWeekday)` → `if (baseDOW >= targetWeekday)`
- 출처: 16장 First, Make It Work, p.269
- 태그: [일반]

#### R16-7
- 규칙: 버그가 발견된 함수 근처는 다른 버그가 있을 가능성이 높으므로 철저히 테스트하라.
- 근거: 변경 이력상 이미 버그가 고쳐졌던 함수들에서 또 버그가 나왔다 [T6].
- 출처: 16장 First, Make It Work, p.269
- 태그: [일반]

#### R16-8
- 규칙: 실패하는 테스트 케이스의 패턴과 커버리지 패턴(실행되지 않는 줄)을 분석해 결함 원인을 진단하라.
- 근거: "가장 가까운 날이 미래일 때 실패" 패턴 [T7], 719행이 한 번도 실행되지 않음 → if문이 항상 거짓 [T8].
- 출처: 16장 First, Make It Work, p.269
- 태그: [일반]

#### R16-9
- 규칙: 잘못된 입력에 대해 오류 문자열을 반환하지 말고 예외(IllegalArgumentException 등)를 던져라.
- 근거: weekInMonthToString·relativeToString 테스트가 예외를 던지도록 바꾸자 통과.
- 출처: 16장 First, Make It Work, p.270
- 태그: [일반]

## 둘째, 고치자 (Then Make It Right)

#### R16-10
- 규칙: 리팩터링 중 모든 변경 후마다 전체 단위 테스트를 실행하라.
- 근거: 매 변경이 전체 JCommon에서 동작함을 보장.
- 출처: 16장 Then Make It Right, p.270
- 태그: [일반]

#### R16-11
- 규칙: 소스 파일의 변경 이력 주석은 삭제하고(형상관리 도구에 맡김), 법적으로 필요한 저작권·라이선스만 남겨라.
- 근거: 변경 이력은 1960년대의 유물이다 [C1].
- 출처: 16장 Then Make It Right, p.270
- 태그: [일반]

#### R16-12
- 규칙: 긴 import 목록은 와일드카드(java.text.*, java.util.*)로 줄여라.
- 근거: [J1].
- 출처: 16장 Then Make It Right, p.270
- 태그: [Java특화]

#### R16-13
- 규칙: 주석에 HTML 태그 같은 추가 언어를 섞지 말고(필요하면 `<pre>`로 감싸) 소스와 생성 문서의 서식을 일치시켜라.
- 근거: 한 주석에 Java·영어·Javadoc·HTML 네 언어 [G1].
- 출처: 16장 Then Make It Right, p.270
- 태그: [일반]

#### R16-14
- 규칙: 클래스 이름은 구현을 암시하지 말고(추상 클래스는 구현을 숨겨야 함) 서술적이어야 하며, 부정확한 용어("serial number" 대신 "ordinal")를 쓰지 마라.
- 근거: SerialDate는 서술적이지 않고 [N1] 추상화 수준이 틀렸다 [N2] → DayDate로 개명.
- 출처: 16장 Then Make It Right, p.270–271
- 태그: [일반]

#### R16-15
- 규칙: 상수를 쓰려고 상수 클래스/인터페이스를 상속하지 말고, 관련 상수 묶음은 enum으로 만들어라.
- 근거: MonthConstants 상속은 낡은 꼼수이며 나쁜 생각이다 [J2]; enum으로 바꾸면 int 월 검증 코드(isValidMonthCode 등)를 없앨 수 있다 [G5].
- 위반 예 → 개선 예: `class DayDate implements MonthConstants` → `enum Month { JANUARY(1), ... }`
- 출처: 16장 Then Make It Right, p.271–272
- 태그: [Java특화]

#### R16-16
- 규칙: 안전장치를 수동으로 무력화하지 마라 — 버전 간 역직렬화를 기대하지 말고, 수동 serialVersionUID보다 명확히 실패하는 자동 관리를 택하라.
- 근거: 수동 ID 갱신을 잊으면 조용하고 정의되지 않은 실패가 나지만 InvalidClassException은 원인이 분명하다 [G4].
- 출처: 16장 Then Make It Right, p.272
- 태그: [Java특화]

#### R16-17
- 규칙: 중복되는(코드가 이미 말하는) 주석은 삭제하라.
- 근거: 중복 주석은 거짓과 잘못된 정보가 모이는 곳이다 [C2][C3].
- 출처: 16장 Then Make It Right, p.272, 275
- 태그: [일반]

#### R16-18
- 규칙: 특정 구현에만 관련된 상수·변수·함수는 추상 기반 클래스에서 그것을 쓰는 파생 클래스로 내려라.
- 근거: EARLIEST/LATEST_DATE_ORDINAL, MIN/MAX_YEAR_SUPPORTED, leapYearCount는 SpreadsheetDate에만 관련 [G6].
- 출처: 16장 Then Make It Right, p.272–273, 279
- 태그: [일반]

#### R16-19
- 규칙: 기반 클래스가 파생 클래스를 알게 하지 말고, 인스턴스 생성과 구현 정보 질의는 추상 팩토리(ABSTRACT FACTORY)로 분리하라.
- 근거: addDays→createInstance가 SpreadsheetDate를 생성 [G7] → DayDateFactory 도입(SINGLETON+DECORATOR+ABSTRACT FACTORY 조합).
- 출처: 16장 Then Make It Right, p.273–274
- 태그: [일반]

#### R16-20
- 규칙: 생성 메서드 등 이름을 의도가 드러나게 바꿔라(createInstance → makeDate, toSerial → toOrdinal → getOrdinalDay, getYYYY → getYear, compare → daysSince, make → fromInt).
- 근거: [N1].
- 출처: 16장 Then Make It Right, p.274, 279, 282, 283
- 태그: [일반]

#### R16-21
- 규칙: 같은 데이터를 제공하는 공개 함수가 있으면 테이블(배열) 자체는 private으로 감춰라.
- 근거: LAST_DAY_OF_MONTH는 lastDayOfMonth가 있으므로 공개할 이유가 없다 [G8].
- 출처: 16장 Then Make It Right, p.275
- 태그: [일반]

#### R16-22
- 규칙: 어디서도 쓰이지 않는 테이블·필드·접근자·함수는 삭제하라.
- 근거: AGGREGATE_DAYS_TO_END_OF_MONTH, description 필드, isValidMonthCode 등 [G9].
- 출처: 16장 Then Make It Right, p.275–276, 278
- 태그: [일반]

#### R16-23
- 규칙: 구현 특정적이지 않은 데이터라도 사용처가 한 곳뿐이면 사용처 가까이 옮기고, 일관성을 위해 private으로 두라(필요하면 쉽게 되돌릴 수 있다).
- 근거: [G10][G11].
- 출처: 16장 Then Make It Right, p.275
- 태그: [일반]

#### R16-24
- 규칙: int 상수 집합은 enum으로 바꿔 기호로 전달하고, 이름은 수학 용어처럼 확립된 문제 영역 명명법을 사용하라(INCLUDE_* → DateInterval.CLOSED/CLOSED_LEFT/CLOSED_RIGHT/OPEN).
- 근거: enum은 IDE로 이름·타입 변경이 쉽고 -1·2 같은 리터럴 누락 걱정이 없다 [J3][N3].
- 출처: 16장 Then Make It Right, p.275–276
- 태그: [일반]

#### R16-25
- 규칙: 구현 없는 기본 생성자, 시그니처 이상을 말하지 않는 Javadoc, 가치 없는 인수·지역변수의 `final` 같은 잡동사니는 제거하라.
- 근거: 컴파일러가 생성하거나 테스트가 이미 잡는 것들은 혼란만 더한다 [G12][C3]. (단 가끔의 final 상수는 좋다)
- 출처: 16장 Then Make It Right, p.276
- 태그: [일반] (final은 [Java특화])

#### R16-26
- 규칙: 코드 변경으로 틀려진 주석(예: -1 반환 설명인데 이제 예외를 던짐)은 즉시 삭제/수정하라.
- 근거: [C2].
- 출처: 16장 Then Make It Right, p.276, 283
- 태그: [일반]

#### R16-27
- 규칙: 같은 본문을 가진 중복 if문은 `||`로 합쳐라.
- 근거: [G5].
- 출처: 16장 Then Make It Right, p.276
- 태그: [일반]

#### R16-28
- 규칙: 특정 개념의 파싱·문자열 변환 함수는 그 개념의 타입(enum)으로 옮기고(Day.parse, toString), 다른 클래스에 의존하지 않는 개념은 자체 소스 파일로 분리하라.
- 근거: Day 개념은 DayDate에 의존하지 않는다 — 인위적 결합 제거 [G13].
- 출처: 16장 Then Make It Right, p.276–277
- 태그: [일반]

#### R16-29
- 규칙: 하나가 다른 하나만 호출하는 쌍둥이 함수는 하나로 합치고 단순화하라.
- 근거: 두 getMonths 함수 [G9][G12][F4] → getMonthNames.
- 출처: 16장 Then Make It Right, p.277–278
- 태그: [일반]

#### R16-30
- 규칙: 다른 타입의 데이터로 계산하는 함수(기능 욕심)는 그 타입의 메서드로 옮겨라(monthCodeToQuarter → Month.quarter()).
- 근거: [G14].
- 출처: 16장 Then Make It Right, p.278
- 태그: [일반]

#### R16-31
- 규칙: 출력 형식을 고르는 플래그 인수 대신 형식별 함수(toString/toShortString)를 만들어라.
- 근거: 플래그로 쌍둥이를 부르는 패턴은 나쁘다 [G15].
- 출처: 16장 Then Make It Right, p.278
- 태그: [일반]

#### R16-32
- 규칙: 복합 조건은 의미 있는 이름의 boolean 변수로 나눠 표현력을 높여라.
- 근거: isLeapYear를 fourth/hundredth/fourHundredth로 [G16].
- 위반 예 → 개선 예: 복잡한 한 줄 식 → `return fourth && (!hundredth || fourHundredth);`
- 출처: 16장 Then Make It Right, p.279
- 태그: [일반]

#### R16-33
- 규칙: 개념에 속한 데이터(월별 마지막 날 배열)는 그 개념 타입(Month enum)에 둬라.
- 근거: [G17].
- 출처: 16장 Then Make It Right, p.279
- 태그: [일반]

#### R16-34
- 규칙: 인스턴스 변수에 작용하는 함수는 static으로 두지 말고 인스턴스 메서드로 만들어라.
- 근거: addDays, addMonths, getPreviousDayOfWeek [G18].
- 출처: 16장 Then Make It Right, p.279–280
- 태그: [일반]

#### R16-35
- 규칙: 복잡한 알고리즘은 설명적 임시 변수(EXPLAINING TEMPORARY VARIABLES)로 단계별 이름을 붙여 투명하게 하라.
- 근거: addMonths의 thisMonthAsOrdinal, resultMonthAsOrdinal 등 [G19].
- 출처: 16장 Then Make It Right, p.279–281
- 태그: [일반]

#### R16-36
- 규칙: 새 인스턴스를 반환하고 원본을 바꾸지 않는 메서드는 변경을 암시하는 이름(addDays)이 아니라 그 사실이 드러나는 이름(plusDays)으로 지어라.
- 근거: `date.addDays(7);`은 date가 바뀐다고 오해하게 한다 [G20][N4].
- 위반 예 → 개선 예: `date.addDays(7)` → `DayDate date = oldDate.plusDays(5);`
- 출처: 16장 Then Make It Right, p.280
- 태그: [일반]

#### R16-37
- 규칙: 동작은 하지만 복잡한 알고리즘은 실제 무슨 일이 일어나는지 이해한 뒤 단순화하라.
- 근거: getPreviousDayOfWeek [G21].
- 출처: 16장 Then Make It Right, p.280
- 태그: [일반]

#### R16-38
- 규칙: 비슷한 함수들은 같은 패턴으로 구현하라(getNearestDayOfWeek를 getPrevious/Following 패턴에 맞춤).
- 근거: [G11].
- 출처: 16장 Then Make It Right, p.281
- 태그: [일반]

#### R16-39
- 규칙: 자기 클래스 타입 인수를 받는 인스턴스 메서드는 진짜 인스턴스 메서드(this 사용)로 바꿔라.
- 근거: getEndOfCurrentMonth가 자기 클래스를 욕심낸다 [G14] → getEndOfMonth().
- 출처: 16장 Then Make It Right, p.281
- 태그: [일반]

#### R16-40
- 규칙: 테스트 외에는 호출자가 없는 함수는 (교묘한 리팩터링 대신) 함수와 그 테스트를 함께 삭제하라.
- 근거: weekInMonthToString, relativeToString — "Fool me twice, shame on me".
- 출처: 16장 Then Make It Right, p.281
- 태그: [일반]

#### R16-41
- 규칙: 구현에 의존하지 않는 추상 메서드는 기반 클래스로 끌어올려라(toDate, compare, isInRange 등).
- 근거: 부적절하게 추상적인 메서드 [G6].
- 출처: 16장 Then Make It Right, p.282
- 태그: [일반]

#### R16-42
- 규칙: 구현에 대한 논리적 의존성(예: ordinal 0의 요일)은 추상 메서드(getDayOfWeekForOrdinalZero)로 물리적 의존성으로 만들고, 알고리즘의 일반 부분은 기반 클래스로 올려라.
- 근거: 논리적으로 구현에 의존한다면 물리적으로도 의존해야 한다 [G22][G6].
- 출처: 16장 Then Make It Right, p.282
- 태그: [일반]

#### R16-43
- 규칙: 테스트가 없는 메서드를 발견하면 테스트를 작성하라.
- 근거: daysSince(compare)에 테스트가 없어 작성.
- 출처: 16장 Then Make It Right, p.282
- 태그: [일반]

#### R16-44
- 규칙: 타입 코드로 분기하는 switch문은 각 case를 enum 상수별 메서드(다형성)로 옮겨 대체하라.
- 근거: isInRange의 switch → DateInterval.isIn [G23].
- 출처: 16장 Then Make It Right, p.282–283
- 태그: [일반]

#### R16-45
- 규칙: 리팩터링 마지막에 클래스 전체를 다시 훑어 흐름을 점검하라 — 낡은 서두 주석 갱신 [C2], 남은 enum을 각 파일로 [G12], 무관한 static 유틸을 별도 클래스(DateUtil)로 [G6], 추상 메서드를 상단에 [G24].
- 근거: 한 번 더 전체 흐름을 보는 패스.
- 출처: 16장 Then Make It Right, p.283
- 태그: [일반]

#### R16-46
- 규칙: enum의 index 필드는 private으로 하고 toInt() 같은 접근자를 제공하라.
- 근거: 데이터 은닉 [G8].
- 출처: 16장 Then Make It Right, p.283
- 태그: [일반]

#### R16-47
- 규칙: 여러 메서드에 반복되는 로직은 메서드 추출로 제거하라(plusYears/plusMonths → correctLastDayOfMonth).
- 근거: [G5].
- 출처: 16장 Then Make It Right, p.283
- 태그: [일반]

#### R16-48
- 규칙: 의미가 있는 매직 넘버(예: 1)는 명명된 값(Month.JANUARY.toInt(), Day.SUNDAY.toInt())으로 대체하라.
- 근거: [G25].
- 출처: 16장 Then Make It Right, p.283
- 태그: [일반]

#### R16-49
- 규칙: 클래스를 줄여 커버리지 비율이 떨어지는 것은 문제 삼지 말고, 커버리지는 비율이 아니라 무엇이 미검증인지로 판단하라.
- 근거: DayDate 84.9% — 남은 미검증 줄은 사소하다.
- 출처: 16장 Then Make It Right, p.284
- 태그: [일반]

## 결론 (Conclusion)

#### R16-50
- 규칙: 보이스카우트 규칙을 따라 체크아웃할 때보다 깨끗하게 체크인하라(커버리지 증가, 버그 수정, 코드 명확화·축소).
- 근거: 다음 사람이 더 쉽게 다루고 더 개선할 수 있다.
- 출처: 16장 Conclusion, p.284
- 태그: [일반]

---

# 17장 냄새와 휴리스틱 (Chapter 17: Smells and Heuristics)

## 주석 (Comments)

### C1: 부적절한 정보 (Inappropriate Information)
- 규칙: 변경 이력·작성자·최종수정일·SPR 번호 같은 메타데이터는 주석에 넣지 말고 형상관리/이슈 추적 시스템에 두며, 주석은 코드·설계에 대한 기술적 메모로만 써라.
- 근거: 다른 시스템이 더 잘 보관하는 정보는 소스를 어지럽힌다.
- 출처: 17장 Comments / C1, p.286
- 태그: [일반]

### C2: 쓸모 없는 주석 (Obsolete Comment)
- 규칙: 낡을 주석은 쓰지 말고, 낡고 무관하고 틀린 주석을 발견하면 즉시 갱신하거나 삭제하라.
- 근거: 낡은 주석은 코드에서 멀어져 무관함과 오도의 섬이 된다.
- 출처: 17장 Comments / C2, p.286
- 태그: [일반]

### C3: 중복된 주석 (Redundant Comment)
- 규칙: 코드가 스스로 충분히 설명하는 것을 반복하는 주석(예: `i++; // increment i`, 시그니처 이상을 말하지 않는 Javadoc)은 쓰지 말고, 코드가 스스로 말할 수 없는 것만 주석으로 써라.
- 근거: 중복 주석은 가치 없이 잡음만 더한다.
- 위반 예 → 개선 예: `@param sellRequest @return @throws ...`만 있는 Javadoc → 삭제
- 출처: 17장 Comments / C3, p.286
- 태그: [일반]

### C4: 성의 없는 주석 (Poorly Written Comment)
- 규칙: 주석을 쓴다면 단어를 신중히 고르고, 문법·구두점을 지키고, 장황하거나 당연한 말을 피하며 간결하게 써라.
- 근거: 쓸 가치가 있는 주석은 잘 쓸 가치도 있다.
- 출처: 17장 Comments / C4, p.287
- 태그: [일반]

### C5: 주석 처리된 코드 (Commented-Out Code)
- 규칙: 주석 처리된 코드를 보면 즉시 삭제하라(형상관리가 기억한다).
- 근거: 얼마나 오래됐는지·의미가 있는지 아무도 모른 채 썩어가며 모듈을 오염시킨다.
- 출처: 17장 Comments / C5, p.287
- 태그: [일반]

## 환경 (Environment)

### E1: 여러 단계로 빌드해야 한다 (Build Requires More Than One Step)
- 규칙: 하나의 간단한 명령으로 체크아웃하고, 또 하나의 간단한 명령으로 전체를 빌드할 수 있게 하라.
- 근거: 여러 조각 체크아웃, 난해한 명령, 흩어진 JAR/XML 탐색은 빌드를 어렵게 한다.
- 위반 예 → 개선 예: 수동 단계 나열 → `svn get mySystem; cd mySystem; ant all`
- 출처: 17장 Environment / E1, p.287
- 태그: [일반]

### E2: 여러 단계로 테스트해야 한다 (Tests Require More Than One Step)
- 규칙: 모든 단위 테스트를 IDE 버튼 하나나 셸 명령 하나로 실행할 수 있게 하라.
- 근거: 모든 테스트 실행은 근본적이고 중요하므로 빠르고 쉽고 명확해야 한다.
- 출처: 17장 Environment / E2, p.287
- 태그: [일반]

## 함수 (Functions)

### F1: 너무 많은 인수 (Too Many Arguments)
- 규칙: 함수 인수는 적게 유지하라 — 0개가 최선, 다음 1·2·3개이며, 4개 이상은 강하게 피하라.
- 근거: 인수가 많을수록 이해·사용이 어렵다(3장 Function Arguments).
- 출처: 17장 Functions / F1, p.288
- 태그: [일반]

### F2: 출력 인수 (Output Arguments)
- 규칙: 출력 인수를 쓰지 말고, 상태를 바꿔야 한다면 호출 대상 객체의 상태를 바꿔라.
- 근거: 독자는 인수를 입력으로 기대한다.
- 출처: 17장 Functions / F2, p.288
- 태그: [일반]

### F3: 플래그 인수 (Flag Arguments)
- 규칙: boolean 인수를 없애고 함수를 나눠라.
- 근거: boolean 인수는 함수가 여러 일을 한다고 대놓고 공표하며 혼란스럽다.
- 출처: 17장 Functions / F3, p.288
- 태그: [일반]

### F4: 죽은 함수 (Dead Function)
- 규칙: 호출되지 않는 메서드는 삭제하라.
- 근거: 죽은 코드를 유지하는 것은 낭비이며 형상관리가 기억한다.
- 출처: 17장 Functions / F4, p.288
- 태그: [일반]

## 일반 (General)

### G1: 한 소스 파일에 여러 언어를 사용한다 (Multiple Languages in One Source File)
- 규칙: 소스 파일 하나에는 가능한 한 한 언어만 쓰고, 불가피한 추가 언어(XML·HTML·JS·YAML 등)의 수와 범위를 최소화하라.
- 근거: 여러 언어가 섞이면 혼란스럽고 조잡하다.
- 출처: 17장 General / G1, p.288
- 태그: [일반]

### G2: 당연한 동작을 구현하지 않는다 (Obvious Behavior Is Unimplemented)
- 규칙: 최소 놀람의 원칙(Principle of Least Surprise)에 따라 다른 프로그래머가 합리적으로 기대할 동작을 구현하라(예: 요일 이름→enum 변환은 약어·대소문자 무시 지원).
- 근거: 당연한 동작이 없으면 함수 이름에 대한 직관을 믿지 못하고 코드를 세세히 읽어야 한다.
- 출처: 17장 General / G2, p.288–289
- 태그: [일반]

### G3: 경계를 올바로 처리하지 않는다 (Incorrect Behavior at the Boundaries)
- 규칙: 직관에 의존하지 말고 모든 경계 조건·코너 케이스·예외를 찾아 각각 테스트를 작성하라.
- 근거: 올바른 동작은 생각보다 복잡하며, 성실함을 대체할 것은 없다.
- 출처: 17장 General / G3, p.289
- 태그: [일반]

### G4: 안전 절차 무시 (Overridden Safeties)
- 규칙: 컴파일러 경고 끄기, 실패 테스트 비활성화("나중에 고치자"), 수동 serialVersionUID 같은 안전장치 무력화를 하지 마라.
- 근거: 체르노빌처럼 안전장치를 하나씩 끄면 재앙이 온다; 끝없는 디버깅의 위험.
- 출처: 17장 General / G4, p.289
- 태그: [일반]

### G5: 중복 (Duplication)
- 규칙: 중복을 찾아 제거하라 — 복붙 코드는 메서드로, 반복되는 동일 조건의 switch/case·if/else 사슬은 다형성으로, 코드는 다르지만 비슷한 알고리즘은 TEMPLATE METHOD나 STRATEGY 패턴으로.
- 근거: 중복은 추상화 기회를 놓친 것이며(DRY, Once and only once), 추상화로 설계 어휘가 늘고 오류가 줄어든다.
- 출처: 17장 General / G5, p.289–290
- 태그: [일반]

### G6: 추상화 수준이 올바르지 못하다 (Code at Wrong Level of Abstraction)
- 규칙: 고수준 일반 개념(기반 클래스·인터페이스)과 저수준 세부 개념(파생 클래스)을 완전히 분리하라 — 구현에만 관련된 상수·변수·유틸 함수는 기반 클래스에 두지 마라(파일·컴포넌트·모듈에도 적용).
- 근거: 잘못된 추상화는 거짓말로 때울 수 없다(무한 Stack의 percentFull()이 0을 반환하면 거짓말).
- 위반 예 → 개선 예: `interface Stack { double percentFull(); }` → `interface BoundedStack extends Stack { double percentFull(); }`
- 출처: 17장 General / G6, p.290–291
- 태그: [일반]

### G7: 기초 클래스가 파생 클래스에 의존한다 (Base Classes Depending on Their Derivatives)
- 규칙: 기반 클래스가 파생 클래스 이름을 언급하지 않게 하라(파생 수가 고정된 FSM처럼 같은 jar로 함께 배포되는 경우만 예외).
- 근거: 기반과 파생을 별도 jar로 독립 배포할 수 있어야 변경 영향이 줄고 유지보수가 쉬워진다.
- 출처: 17장 General / G7, p.291
- 태그: [일반]

### G8: 과도한 정보 (Too Much Information)
- 규칙: 클래스·모듈 인터페이스를 작고 좁게 유지하라 — 메서드·인스턴스 변수·함수가 아는 변수를 최소화하고, 데이터·유틸 함수·상수·임시값을 숨기며, 하위 클래스용 protected 변수·함수를 남발하지 마라.
- 근거: 작은 인터페이스는 결합도를 낮추고 적은 것으로 많은 일을 하게 한다.
- 출처: 17장 General / G8, p.291–292
- 태그: [일반]

### G9: 죽은 코드 (Dead Code)
- 규칙: 실행되지 않는 코드(불가능한 조건의 if 본문, 던지지 않는 try의 catch, 호출되지 않는 유틸, 발생하지 않는 case)를 삭제하라.
- 근거: 죽은 코드는 설계 변경 시 갱신되지 않아 오래될수록 냄새가 난다.
- 출처: 17장 General / G9, p.292
- 태그: [일반]

### G10: 수직 분리 (Vertical Separation)
- 규칙: 변수와 함수는 사용되는 곳 가까이 정의하라 — 지역 변수는 첫 사용 바로 위에, private 함수는 첫 사용 바로 아래에.
- 근거: 수직 거리가 짧아야 아래로 훑기만 해도 찾을 수 있다.
- 출처: 17장 General / G10, p.292
- 태그: [일반]

### G11: 일관성 부족 (Inconsistency)
- 규칙: 어떤 일을 한 방식으로 했다면 비슷한 일은 모두 같은 방식으로 하라(같은 타입 변수명 통일, processVerificationRequest ↔ processDeletionRequest 같은 이름 패턴).
- 근거: 최소 놀람의 원칙 — 일관성은 읽기·수정을 쉽게 한다.
- 출처: 17장 General / G11, p.292
- 태그: [일반]

### G12: 잡동사니 (Clutter)
- 규칙: 구현 없는 기본 생성자, 쓰지 않는 변수, 호출되지 않는 함수, 정보 없는 주석 등 잡동사니를 제거하라.
- 근거: 의미 없는 산물은 코드를 어지럽힌다.
- 출처: 17장 General / G12, p.293
- 태그: [일반]

### G13: 인위적 결합 (Artificial Coupling)
- 규칙: 서로 의존하지 않는 것을 결합하지 마라 — 일반 enum·범용 static 함수를 특정 클래스 안에 두지 말고, 함수·상수·변수를 선언할 올바른 위치를 고민해 정하라.
- 근거: 임시로 편한 곳에 둔 선언은 목적 없는 모듈 간 결합을 만든다.
- 출처: 17장 General / G13, p.293
- 태그: [일반]

### G14: 기능 욕심 (Feature Envy)
- 규칙: 다른 객체의 접근자/변경자로 그 객체 데이터를 조작하는 메서드는 그 객체의 클래스로 옮겨라(단, 보고서 형식처럼 옮기면 SRP/OCP/CCP를 어기는 경우는 필요악으로 허용).
- 근거: 기능 욕심은 한 클래스의 내부를 다른 클래스에 노출한다(calculateWeeklyPay가 HourlyEmployee를 욕심냄).
- 출처: 17장 General / G14, p.293–294
- 태그: [일반]

### G15: 선택자 인수 (Selector Arguments)
- 규칙: 동작을 고르는 선택자 인수(boolean·enum·int 등)를 쓰지 말고 여러 함수로 나눠라.
- 근거: 끝에 매달린 false 인수는 의미를 알 수 없고, 여러 함수를 하나로 합치는 게으른 방법이다.
- 위반 예 → 개선 예: `calculateWeeklyPay(boolean overtime)` → `straightPay()`, `overTimePay()`, `overTimeBonus(...)`
- 출처: 17장 General / G15, p.294–295
- 태그: [일반]

### G16: 모호한 의도 (Obscured Intent)
- 규칙: 줄줄이 이어진 식, 헝가리식 표기법, 매직 넘버로 의도를 가리지 말고 의도가 드러나게 표현하라.
- 근거: 작고 빽빽한 코드(`m_otCalc`, `iThsWkd * iThsRte + ...`)는 이해 불가능하다.
- 출처: 17장 General / G16, p.295
- 태그: [일반]

### G17: 잘못 지운 책임 (Misplaced Responsibility)
- 규칙: 코드는 독자가 자연스럽게 기대할 위치에 두고(PI는 삼각함수 곁, OVERTIME_RATE는 HourlyPayCalculator), 성능상 다른 곳에서 계산해야 하면 함수 이름에 그 사실을 반영하라(computeRunningTotalOfHours).
- 근거: 최소 놀람의 원칙; 함수 이름이 책임 위치를 결정하는 단서다.
- 출처: 17장 General / G17, p.295–296
- 태그: [일반]

### G18: 부적절한 static 함수 (Inappropriate Static)
- 규칙: 비static 메서드를 우선하고, 다형적으로 동작할 가능성이 조금이라도 있으면 static으로 만들지 마라(Math.max처럼 소유 객체가 없고 다형성이 필요 없는 경우만 static).
- 근거: HourlyPayCalculator.calculatePay는 여러 계산 알고리즘으로 다형성이 필요할 수 있다.
- 출처: 17장 General / G18, p.296
- 태그: [일반]

### G19: 서술적 변수 (Use Explanatory Variables)
- 규칙: 계산을 의미 있는 이름의 중간 변수로 나눠라(많을수록 대체로 좋다).
- 근거: `String key = match.group(1); String value = match.group(2);`처럼 불투명한 모듈이 투명해진다.
- 출처: 17장 General / G19, p.296–297
- 태그: [일반]

### G20: 이름과 기능이 일치하는 함수 (Function Names Should Say What They Do)
- 규칙: 호출만 보고 무엇을 하는지(단위, 원본 변경 여부) 알 수 있게 이름 지어라 — 원본을 바꾸면 addDaysTo/increaseByDays, 새 객체를 반환하면 daysLater/daysSince.
- 근거: 구현·문서를 봐야 알 수 있다면 더 나은 이름을 찾거나 기능을 재배치해야 한다.
- 위반 예 → 개선 예: `date.add(5)` → `date.daysLater(5)`
- 출처: 17장 General / G20, p.297
- 태그: [일반]

### G21: 알고리즘을 이해하라 (Understand the Algorithm)
- 규칙: 테스트 통과만으로 끝내지 말고 함수가 어떻게 동작하는지 확실히 이해하라 — 가장 좋은 방법은 동작이 자명할 만큼 깔끔하게 리팩터링하는 것이다.
- 근거: if문과 플래그를 덧대 "동작"하게 만든 코드는 이해 부족의 산물이다.
- 출처: 17장 General / G21, p.297–298
- 태그: [일반]

### G22: 논리적 의존성은 물리적으로 드러내라 (Make Logical Dependencies Physical)
- 규칙: 의존하는 모듈에 대해 가정하지 말고, 필요한 정보는 그 모듈에 명시적으로 물어라.
- 근거: HourlyReporter의 PAGE_SIZE=55는 포매터의 능력에 대한 가정이다 → HourlyReportFormatter.getMaxPageSize() 호출.
- 출처: 17장 General / G22, p.298–299
- 태그: [일반]

### G23: If/Else 혹은 Switch/Case 문보다 다형성을 사용하라 (Prefer Polymorphism to If/Else or Switch/Case)
- 규칙: switch 사용 전에 다형성을 먼저 고려하고, "ONE SWITCH" 규칙을 지켜라 — 한 유형의 선택에는 switch를 하나만 두고, 그 case들은 시스템 나머지의 switch를 대체할 다형 객체를 생성해야 한다.
- 근거: 함수가 타입보다 더 자주 바뀌는 경우는 드물므로 모든 switch를 의심해야 한다.
- 출처: 17장 General / G23, p.299
- 태그: [일반]

### G24: 표준 표기법을 따르라 (Follow Standard Conventions)
- 규칙: 업계 표준 기반 팀 코딩 표준(인스턴스 변수 선언 위치, 클래스·메서드·변수 명명, 괄호 위치 등)을 모두가 따르고, 코드 자체가 그 예시가 되게 하라.
- 근거: 괄호 위치 자체는 중요하지 않고 합의가 중요하다.
- 출처: 17장 General / G24, p.299–300
- 태그: [일반]

### G25: 매직 숫자는 명명된 상수로 교체하라 (Replace Magic Numbers with Named Constants)
- 규칙: 원시 숫자(및 자기 설명적이지 않은 모든 토큰)는 잘 지은 상수 뒤에 숨겨라(86400→SECONDS_PER_DAY, 55→LINES_PER_PAGE); 단 자명한 공식의 수(5280, 8, 2)는 그대로 둘 수 있고, π 같은 오류 위험 큰 값은 정의된 상수(Math.PI)를 써라.
- 근거: 3.1415927535890793처럼 익숙한 값은 검토 없이 지나쳐 오류가 숨는다.
- 위반 예 → 개선 예: `assertEquals(7777, Employee.find("John Doe").employeeNumber())` → `assertEquals(HOURLY_EMPLOYEE_ID, Employee.find(HOURLY_EMPLOYEE_NAME).employeeNumber())`
- 출처: 17장 General / G25, p.300–301
- 태그: [일반]

### G26: 정확하라 (Be Precise)
- 규칙: 코드의 결정은 정확히 내려라 — null을 반환할 수 있는 함수는 null 검사, 유일하다고 생각하는 레코드 조회는 다른 레코드가 없는지 확인, 통화는 부동소수점이 아니라 정수(또는 정수 기반 Money 클래스)와 적절한 반올림, 동시 갱신 가능성이 있으면 잠금/트랜잭션, 변수 타입은 필요한 만큼만 구체적으로(ArrayList 대신 List), 변수를 기본 protected로 두지 마라.
- 근거: 코드의 모호함과 부정확함은 의견 불일치나 게으름의 산물이며 제거해야 한다.
- 출처: 17장 General / G26, p.301
- 태그: [일반]

### G27: 관례보다 구조를 사용하라 (Structure over Convention)
- 규칙: 설계 결정은 명명 관례가 아니라 준수를 강제하는 구조로 강제하라(이름 잘 붙인 enum + switch보다 추상 메서드를 가진 기반 클래스).
- 근거: 기반 클래스는 구체 클래스가 모든 추상 메서드를 구현하도록 강제하지만, switch는 매번 같은 방식으로 구현되도록 강제하지 못한다.
- 출처: 17장 General / G27, p.301
- 태그: [일반]

### G28: 조건을 캡슐화하라 (Encapsulate Conditionals)
- 규칙: 조건문의 boolean 논리는 의도를 설명하는 함수로 추출하라.
- 근거: if/while 맥락 속 boolean 논리는 이해하기 어렵다.
- 위반 예 → 개선 예: `if (timer.hasExpired() && !timer.isRecurrent())` → `if (shouldBeDeleted(timer))`
- 출처: 17장 General / G28, p.301
- 태그: [일반]

### G29: 부정 조건은 피하라 (Avoid Negative Conditionals)
- 규칙: 가능하면 조건을 긍정형으로 표현하라.
- 근거: 부정은 긍정보다 이해하기 조금 더 어렵다.
- 위반 예 → 개선 예: `if (!buffer.shouldNotCompact())` → `if (buffer.shouldCompact())`
- 출처: 17장 General / G29, p.302
- 태그: [일반]

### G30: 함수는 한 가지만 해야 한다 (Functions Should Do One Thing)
- 규칙: 여러 단계(순회·판단·처리)를 수행하는 함수를 각각 한 가지만 하는 작은 함수로 나눠라.
- 근거: pay()는 직원 순회·지급일 확인·지급 세 가지를 한다.
- 위반 예 → 개선 예: `pay()` 한 덩어리 → `pay()` / `payIfNecessary(e)` / `calculateAndDeliverPay(e)`
- 출처: 17장 General / G30, p.302
- 태그: [일반]

### G31: 숨겨진 시간적인 결합 (Hidden Temporal Couplings)
- 규칙: 호출 순서가 중요하면 각 함수가 다음 함수에 필요한 결과를 반환하게 하는 "버킷 브리게이드"로 인수를 구성해 시간적 결합을 드러내라.
- 근거: saturateGradient→reticulateSplines→diveForMoog 순서가 강제되지 않으면 잘못된 순서 호출로 예외가 난다; 추가 구문 복잡도는 실제 시간적 복잡도를 드러낸다.
- 위반 예 → 개선 예: `saturateGradient(); reticulateSplines();` → `Gradient g = saturateGradient(); List<Spline> s = reticulateSplines(g); diveForMoog(s, reason);`
- 출처: 17장 General / G31, p.302–303
- 태그: [일반]

### G32: 일관성을 유지하라 (Don't Be Arbitrary)
- 규칙: 코드 구조에 이유를 갖고 그 이유가 구조로 전달되게 하라 — 다른 클래스의 유틸리티가 아닌 public 클래스는 다른 클래스 안에 중첩하지 말고 패키지 최상위에 두어라.
- 근거: 임의로 보이는 구조는 다른 사람이 바꿔도 된다고 느끼고, 일관된 구조는 보존된다(AliasLinkWidget.VariableExpandingWidgetRoot 사례).
- 출처: 17장 General / G32, p.303–304
- 태그: [일반]

### G33: 경계 조건을 캡슐화하라 (Encapsulate Boundary Conditions)
- 규칙: 경계 조건 처리를 한곳에 모으고 `+1`/`-1`을 코드 곳곳에 흩뿌리지 마라 — 의미 있는 이름의 변수로 감싸라.
- 근거: 경계 조건은 추적하기 어렵다.
- 위반 예 → 개선 예: `if(level + 1 < tags.length) ... level + 1 ...` → `int nextLevel = level + 1;`
- 출처: 17장 General / G33, p.304
- 태그: [일반]

### G34: 함수는 추상화 수준을 한 단계만 내려가야 한다 (Functions Should Descend Only One Level of Abstraction)
- 규칙: 함수 내 모든 문장은 같은 추상화 수준이어야 하며, 그 수준은 함수 이름이 설명하는 동작보다 한 단계 아래여야 한다; 추상화 경계로 쪼갠 뒤 새로 드러난 경계도 계속 분리하라.
- 근거: HruleWidget.render가 "수평선의 크기" 개념과 HR 태그 문법을 섞음 → HtmlTag와 hrSize()로 분리하자 XHTML `<hr/>` 누락 버그도 드러났다.
- 출처: 17장 General / G34, p.304–306
- 태그: [일반]

#### R17-G34a
- 규칙: 필드 이름이 실제 목적과 다르면(size → extraDashes) 실제 의미로 바꿔라.
- 근거: size 필드는 실제로 추가 대시 수를 담고 있었다.
- 출처: 17장 General / G34, p.305
- 태그: [일반]

### G35: 설정 정보는 최상위 단계에 둬라 (Keep Configurable Data at High Levels)
- 규칙: 기본값·설정값 같은 고수준에서 알려진 상수는 저수준 함수에 묻지 말고 최상위에 두고(예: Arguments 클래스 상단의 DEFAULT_PORT), 저수준 함수에 인수로 전달하라.
- 근거: 저수준 곳곳의 `if (arguments.port == 0) // use 80 by default`를 찾아다닐 필요가 없고 쉽게 바꿀 수 있다.
- 출처: 17장 General / G35, p.306
- 태그: [일반]

### G36: 추이적 탐색을 피하라 (Avoid Transitive Navigation)
- 규칙: 모듈은 직접 협력자만 알게 하라(디미터 법칙, "부끄럼 타는 코드") — `a.getB().getC().doSomething()` 같은 연쇄 탐색 대신 직접 협력자가 필요한 서비스를 제공하게 하라(`myCollaborator.doSomething()`).
- 근거: 많은 모듈이 a.getB().getC()를 쓰면 B와 C 사이에 Q를 끼우는 설계 변경이 어려워져 아키텍처가 경직된다.
- 출처: 17장 General / G36, p.306–307
- 태그: [일반]

## 자바 (Java)

### J1: 긴 import 목록을 피하고 와일드카드를 사용하라 (Avoid Long Import Lists by Using Wildcards)
- 규칙: 한 패키지에서 둘 이상의 클래스를 쓰면 `import package.*;`로 패키지 전체를 import하라(이름 충돌 시에만 개별 import/정규화).
- 근거: 긴 import 목록은 부담스럽고, 개별 import는 강한 의존성이지만 와일드카드는 검색 경로만 추가해 결합을 줄인다; IDE가 개별 목록으로 변환해 줄 수 있다.
- 출처: 17장 Java / J1, p.307
- 태그: [Java특화]

### J2: 상수는 상속하지 않는다 (Don't Inherit Constants)
- 규칙: 상수를 인터페이스에 넣고 그 인터페이스를 상속/구현해 접근하지 말고, static import를 사용하라.
- 근거: 상수가 상속 계층 꼭대기에 숨어 출처를 알 수 없다 — 언어의 범위 규칙을 속이는 데 상속을 쓰지 마라.
- 위반 예 → 개선 예: `abstract class Employee implements PayrollConstants` → `import static PayrollConstants.*;`
- 출처: 17장 Java / J2, p.307–308
- 태그: [Java특화]

### J3: 상수 대 Enum (Constants versus Enums)
- 규칙: `public static final int` 대신 enum을 쓰고, enum의 메서드·필드(상수별 메서드 구현 포함)를 활용하라.
- 근거: int의 의미는 사라질 수 있지만 이름 있는 enum의 의미는 사라지지 않으며, enum은 훨씬 표현력·유연성이 높다(HourlyPayGrade.rate()).
- 출처: 17장 Java / J3, p.308–309
- 태그: [Java특화] (원리 — 이름 있는 열거형 우선 — 는 [일반])

## 이름 (Names)

### N1: 서술적인 이름을 사용하라 (Choose Descriptive Names)
- 규칙: 이름을 성급히 정하지 말고 서술적인지 확인하며, 소프트웨어가 진화해 의미가 표류하므로 이름의 적절성을 자주 재평가하라.
- 근거: 이름이 가독성의 90%를 차지한다 — `x()`, `q`, `kk`, `l[z]` 대신 `score()`, `isStrike(frame)`, `nextTwoBallsForStrike(frame)`.
- 출처: 17장 Names / N1, p.309–310
- 태그: [일반]

### N2: 적절한 추상화 수준에서 이름을 선택하라 (Choose Names at the Appropriate Level of Abstraction)
- 규칙: 구현을 드러내는 이름 대신 클래스·함수의 추상화 수준을 반영하는 이름을 고르고, 코드를 훑을 때마다 너무 낮은 수준의 이름을 발견하면 바꿔라.
- 근거: Modem.dial(phoneNumber)은 전화 접속이 아닌 모뎀에 맞지 않다 → connect(connectionLocator), getConnectedLocator().
- 출처: 17장 Names / N2, p.311
- 태그: [일반]

### N3: 가능하다면 표준 명명법을 사용하라 (Use Standard Nomenclature Where Possible)
- 규칙: 기존 관례(패턴명 — 예: AutoHangupModemDecorator, 언어 관례 — 예: toString)와 프로젝트 유비쿼터스 언어(ubiquitous language)의 용어를 이름에 사용하라.
- 근거: 기존 관례에 기반한 이름이 이해하기 쉽고, 프로젝트 특유 의미를 담은 이름일수록 독자가 이해하기 쉽다.
- 출처: 17장 Names / N3, p.311–312
- 태그: [일반]

### N4: 명확한 이름 (Unambiguous Names)
- 규칙: 함수·변수의 동작이 모호하지 않게 드러나는 이름을 써라(호출처가 적으면 길어도 좋다).
- 근거: doRename 안에 renamePage가 있으면 차이를 알 수 없다 → renamePageAndOptionallyAllReferences.
- 출처: 17장 Names / N4, p.312
- 태그: [일반]

### N5: 긴 범위는 긴 이름을 사용하라 (Use Long Names for Long Scopes)
- 규칙: 이름 길이를 범위 길이에 비례시켜라 — 몇 줄짜리 범위는 i, j 같은 짧은 이름, 넓은 범위는 길고 정확한 이름.
- 근거: 짧은 이름은 먼 거리에서 의미를 잃지만, 5줄 루프의 i를 rollCount로 바꾸면 오히려 흐려진다.
- 출처: 17장 Names / N5, p.312
- 태그: [일반]

### N6: 인코딩을 피하라 (Avoid Encodings)
- 규칙: 이름에 타입·범위 정보(m_, f 접두어, 헝가리식 표기)나 프로젝트/서브시스템 인코딩(vis_)을 넣지 마라.
- 근거: 현대 환경이 그 정보를 제공하므로 중복되고 산만하다.
- 출처: 17장 Names / N6, p.312–313
- 태그: [일반]

### N7: 이름으로 부수 효과를 설명하라 (Names Should Describe Side-Effects)
- 규칙: 이름은 함수·변수·클래스가 하는 모든 일을 설명해야 하며, 단순 동사로 부수 효과를 숨기지 마라.
- 근거: getOos()는 없으면 생성까지 한다 → createOrReturnOos.
- 출처: 17장 Names / N7, p.313
- 태그: [일반]

## 테스트 (Tests)

### T1: 불충분한 테스트 (Insufficient Tests)
- 규칙: "이 정도면 충분해 보인다"가 아니라, 깨질 가능성이 있는 모든 것을 테스트하라 — 탐색되지 않은 조건이나 검증되지 않은 계산이 남아 있는 한 불충분하다.
- 근거: 테스트 스위트는 잠재적으로 깨질 만한 모든 것을 시험해야 한다.
- 출처: 17장 Tests / T1, p.313
- 태그: [일반]

### T2: 커버리지 도구를 사용하라! (Use a Coverage Tool!)
- 규칙: 커버리지 도구로 테스트 전략의 빈틈(미검증 모듈·클래스·함수, 확인되지 않은 if/catch 본문)을 찾아라.
- 근거: IDE가 커버 줄을 녹색/빨강으로 표시해 빠르게 찾을 수 있다.
- 출처: 17장 Tests / T2, p.313
- 태그: [일반]

### T3: 사소한 테스트를 건너뛰지 마라 (Don't Skip Trivial Tests)
- 규칙: 사소한 테스트도 작성하라.
- 근거: 작성이 쉽고 문서로서의 가치가 비용보다 크다.
- 출처: 17장 Tests / T3, p.313
- 태그: [일반]

### T4: 무시한 테스트는 모호함을 뜻한다 (An Ignored Test Is a Question about an Ambiguity)
- 규칙: 요구사항이 불분명한 동작 세부사항은 주석 처리된 테스트(컴파일 안 될 때)나 @Ignore 테스트(컴파일될 때)로 질문을 표현하라.
- 근거: 불명확한 요구사항에 대한 질문을 코드로 기록한다.
- 출처: 17장 Tests / T4, p.313
- 태그: [일반] (@Ignore는 [Java특화])

### T5: 경계 조건을 테스트하라 (Test Boundary Conditions)
- 규칙: 경계 조건 테스트에 특별히 신경 써라.
- 근거: 알고리즘의 중간은 맞추면서 경계를 잘못 판단하는 경우가 흔하다.
- 출처: 17장 Tests / T5, p.314
- 태그: [일반]

### T6: 버그 주변은 철저히 테스트하라 (Exhaustively Test Near Bugs)
- 규칙: 함수에서 버그를 발견하면 그 함수를 철저히 테스트하라.
- 근거: 버그는 모이는 경향이 있어 혼자가 아닐 가능성이 크다.
- 출처: 17장 Tests / T6, p.314
- 태그: [일반]

### T7: 실패 패턴을 살펴라 (Patterns of Failure Are Revealing)
- 규칙: 테스트 케이스를 최대한 완전하게, 합리적 순서로 작성하고, 실패하는 케이스의 패턴(예: 5자 초과 입력, 음수 두 번째 인수)으로 문제를 진단하라.
- 근거: 테스트 보고서의 빨강/초록 패턴만으로 "아하!"를 얻을 수 있다.
- 출처: 17장 Tests / T7, p.314
- 태그: [일반]

### T8: 테스트 커버리지 패턴을 살펴라 (Test Coverage Patterns Can Be Revealing)
- 규칙: 통과하는 테스트가 실행하거나 실행하지 않는 코드를 살펴 실패하는 테스트의 원인 단서를 찾아라.
- 근거: 실행되지 않는 줄은 조건이 항상 거짓임을 시사한다(SerialDate 사례).
- 출처: 17장 Tests / T8, p.314
- 태그: [일반]

### T9: 테스트는 빨라야 한다 (Tests Should Be Fast)
- 규칙: 테스트를 빠르게 유지하기 위해 필요한 모든 일을 하라.
- 근거: 느린 테스트는 실행되지 않으며, 일정이 빡빡하면 가장 먼저 스위트에서 빠진다.
- 출처: 17장 Tests / T9, p.314
- 태그: [일반]

## 결론 (Conclusion)

#### R17-1
- 규칙: 휴리스틱 목록을 기계적 규칙집이 아니라 가치 체계로 받아들여, 목록에 없는 상황에서도 그 가치(깨끗함·전문가 정신)에 따라 판단하라.
- 근거: 깨끗한 코드는 규칙을 따라 작성되는 것이 아니라 규율을 이끄는 가치에서 나온다.
- 출처: 17장 Conclusion, p.314
- 태그: [일반]

---

# 부록 A 동시성 II (Appendix A: Concurrency II, Brett L. Schuchert)

## 클라이언트/서버 예제 (Client/Server Example)

### 서버 (The Server)

#### RA-1
- 규칙: 성능 요구(처리량)는 타임아웃이 걸린 테스트(예: `@Test(timeout = 10000)`)로 형식화해 검증하라.
- 근거: "허용 가능한 성능"을 테스트로 단언하는 고전적 처리량 검증.
- 출처: 부록 A Client/Server Example / The Server, p.318
- 태그: [일반] (JUnit 문법은 [Java특화])

#### RA-2
- 규칙: 스레드를 추가하기 전에 시간이 어디서 소비되는지(I/O 바운드 vs 프로세서 바운드) 측정하라 — 프로세서 바운드에는 스레드 추가가 무의미하고, I/O 바운드에서만 동시성이 효율을 높인다.
- 근거: CPU 사이클은 한정되어 있고, I/O 대기 시간을 다른 처리가 쓸 때만 이득이다.
- 출처: 부록 A The Server, p.318
- 태그: [일반]

### 스레드 추가하기 (Adding Threading) / 서버 분석 (Server Observations)

#### RA-3
- 규칙: 요청마다 무제한으로 스레드를 생성하지 마라 — 스레드 수 상한(스레드 풀)을 두어라.
- 근거: 제한이 없으면 JVM 한계에 도달하거나 다수 사용자 동시 접속 시 시스템이 멈춘다.
- 출처: 부록 A Server Observations, p.319
- 태그: [일반]

#### RA-4
- 규칙: 소켓 연결 관리·클라이언트 처리·스레드 정책·서버 종료 정책을 각각 별도 클래스로 분리하고, 스레드 관리는 소수의 잘 통제된 곳에 두며 그 코드는 스레드 관리 외에 아무것도 하지 않게 하라.
- 근거: process 함수 하나가 네 가지 책임과 여러 추상화 수준을 가져 SRP를 위반; 분리하면 스레드 전략 변경 영향이 줄고 나머지를 스레드 걱정 없이 테스트할 수 있다.
- 위반 예 → 개선 예: process() 내부에서 `new Thread(...)` → `clientScheduler.schedule(requestProcessor)` (ClientScheduler 인터페이스 + ThreadPerRequestScheduler/ExecutorClientScheduler 구현)
- 출처: 부록 A Server Observations, p.319–321
- 태그: [일반]

#### RA-5
- 규칙: 스레드 정책을 인터페이스(예: ClientScheduler) 뒤에 두어, 정책 변경(스레드-당-요청 → Executor 스레드 풀)이 새 클래스 작성과 교체만으로 끝나게 하라.
- 근거: 스레드 관리가 한 곳에 격리되면 동시성 문제를 찾을 곳도 하나다.
- 출처: 부록 A Server Observations / Conclusion, p.320–321
- 태그: [일반]

## 가능한 실행 경로 (Possible Paths of Execution)

### 경로 수 (Number of Paths)

#### RA-6
- 규칙: 반복·분기 없는 한 줄 코드도 스레드 T개·명령 N개면 (NT)!/(N!^T)개의 실행 경로가 있음을 인지하고, 공유 갱신 메서드는 synchronized 등으로 경로를 직렬화하라.
- 근거: `++lastIdUsed`는 바이트코드 8개로 두 스레드에서 12,870 경로(long이면 2,704,156); synchronized로 두 스레드 경로가 2개(N!)로 준다.
- 출처: 부록 A Number of Paths, p.322–323
- 태그: [일반]

### 심층 분석 (Digging Deeper)

#### RA-7
- 규칙: 64비트 값(long/double) 대입은 원자적이라고 가정하지 마라(JVM 명세상 32비트 두 번).
- 근거: 두 32비트 대입 사이에 다른 스레드가 끼어들 수 있다.
- 출처: 부록 A Digging Deeper, p.323–324
- 태그: [Java특화]

#### RA-8
- 규칙: 전위/후위 증가 연산자(++)는 원자적이지 않으므로 공유 변수에 사용할 때는 동기화하라.
- 근거: GETFIELD 후 선점되면 두 스레드 모두 43을 얻어 증가 하나가 사라진다; getNextId를 synchronized로 하면 해결.
- 출처: 부록 A Digging Deeper, p.324–326
- 태그: [일반]

### 결론 (Conclusion)

#### RA-9
- 규칙: 메모리 모델을 무엇이 안전하고 안전하지 않은지 알 만큼 이해하고, 공유 객체/값의 위치, 동시 읽기/갱신 문제를 일으킬 수 있는 코드, 그 보호 방법을 파악하라.
- 근거: ++가 원자적이라는 것은 흔한 오해다.
- 출처: 부록 A Possible Paths of Execution / Conclusion, p.326
- 태그: [일반]

## 라이브러리를 이해하라 (Knowing Your Library)

### Executor 프레임워크 (Executor Framework)

#### RA-10
- 규칙: 스레드를 직접 생성하거나 손수 만든 스레드 풀을 쓰고 있다면 Executor 프레임워크(스레드 풀링, 자동 크기 조정, 재생성, Callable·Future 지원)로 교체하라.
- 근거: 코드가 더 깔끔하고 따라가기 쉽고 작아진다.
- 출처: 부록 A Executor Framework, p.326
- 태그: [Java특화]

#### RA-11
- 규칙: 여러 독립 연산을 실행하고 모두 끝나기를 기다려야 하면 Future(결과가 필요하면 Callable)로 외부 호출을 비동기로 시작하고 로컬 처리 후 get()으로 합쳐라.
- 근거: processRequest 예 — 외부 호출과 로컬 처리를 겹친다.
- 출처: 부록 A Executor Framework, p.326–327
- 태그: [일반]

### 넌블로킹 방법 (Nonblocking Solutions)

#### RA-12
- 규칙: 단순 값의 스레드 안전 갱신에는 synchronized 대신 AtomicInteger·AtomicBoolean·AtomicReference 같은 CAS(Compare and Swap) 기반 넌블로킹 클래스를 사용하라.
- 근거: synchronized는 경합이 없어도 항상 락을 얻는 비관적 잠금이고, CAS는 낙관적 잠금처럼 충돌 감지 후 재시도하므로 중간~높은 경합에서도 거의 항상 더 빠르다.
- 위반 예 → 개선 예: `synchronized void incrementValue() { ++value; }` → `value.incrementAndGet();`
- 출처: 부록 A Nonblocking Solutions, p.327–328
- 태그: [일반] (클래스명은 [Java특화])

### 다중 스레드 환경에서 안전하지 않은 클래스 (Nonthread-Safe Classes)

#### RA-13
- 규칙: SimpleDateFormat, 데이터베이스 연결, java.util 컨테이너, 서블릿처럼 본질적으로 스레드 안전하지 않은 클래스를 스레드 간 공유하지 마라(공유 시 보호하라).
- 근거: 이들은 본질적으로 스레드 안전하지 않다.
- 출처: 부록 A Nonthread-Safe Classes, p.328
- 태그: [Java특화]

#### RA-14
- 규칙: 개별 메서드가 스레드 안전해도 여러 메서드 호출 조합(check-then-act, 예: containsKey 후 put)은 안전하지 않으므로 클라이언트 기반 잠금, ADAPTER를 통한 서버 기반 잠금, 또는 putIfAbsent 같은 복합 연산을 제공하는 스레드 안전 컬렉션으로 원자화하라.
- 근거: containsKey와 put 사이에 다른 스레드가 값을 추가할 수 있다.
- 위반 예 → 개선 예: `if(!hashTable.containsKey(k)) hashTable.put(k, v);` → `concurrentHashMap.putIfAbsent(k, v);`
- 출처: 부록 A Nonthread-Safe Classes, p.328–329
- 태그: [일반]

## 메서드 사이에 존재하는 의존성을 조심하라 (Dependencies Between Methods Can Break Concurrent Code)

#### RA-15
- 규칙: hasNext()/next()처럼 클라이언트가 두 동기화 메서드를 연속 호출해야 하는 API를 공유 객체에 두지 마라 — 상태 확인과 동작을 하나의 원자적 메서드로 합쳐라.
- 근거: 각 메서드가 동기화돼도 마지막 반복에서 두 스레드가 끼어들어 끝을 넘어선다 — 프로덕션에서 오래 뒤에 나타나고 추적이 어렵다.
- 출처: 부록 A Dependencies Between Methods Can Break Concurrent Code, p.329–330
- 태그: [일반]

### 실패를 용인하라 (Tolerate the Failure)

#### RA-16
- 규칙: 메서드 간 의존성으로 인한 동시성 실패를 예외 포착·정리로 "용인"하는 해법은 피하라(실패가 무해하도록 설계할 수 있는 경우의 최후 수단).
- 근거: 자정에 재부팅해 메모리 누수를 치우는 것처럼 조잡하다.
- 출처: 부록 A Tolerate the Failure, p.330
- 태그: [일반]

### 클라이언트에서 잠금 (Client-Based Locking)

#### RA-17
- 규칙: 클라이언트 기반 잠금은 스레드 안전하지 않은 서드파티 도구를 써야 하는 등 불가피할 때만 사용하라.
- 근거: 모든 클라이언트가 잠금을 기억해야 해 DRY를 위반하고, 한 곳만 빠뜨려도 재현 불가한 장애가 난다(1971년 링 버퍼 사례 — "클라이언트 기반 잠금은 정말 형편없다").
- 출처: 부록 A Client-Based Locking, p.330–332
- 태그: [일반]

#### RA-18
- 규칙: 원인 모를 동시성 장애를 우회 핵(주기적 리셋 등)이나 디버그 출력으로 덮지 말고 근본 원인(보호되지 않은 사용)을 찾아 고쳐라.
- 근거: 링 버퍼 리셋 핵은 증상만 숨겼고, 디버그 출력은 문제를 "사라지게" 해 시스템에 남는다.
- 출처: 부록 A Client-Based Locking, p.331–332; Deadlock 각주 4, p.336
- 태그: [일반]

### 서버에서 잠금 (Server-Based Locking)

#### RA-19
- 규칙: 클라이언트 기반 잠금보다 서버 기반 잠금을 우선하라 — 서버 API를 다중 스레드 인지형으로 바꿔(getNextOrNull 같은 원자 메서드) 잠금을 서버 안에 두라.
- 근거: 중복 감소, 단일 스레드 배포 시 비안전 서버로 교체해 성능 확보, 오류 가능성 감소, 단일 정책 강제, 공유 변수 범위 축소.
- 위반 예 → 개선 예: `while(it.hasNext()) it.next()` + 클라이언트 synchronized → `Integer v = it.getNextOrNull(); if (v == null) break;`
- 출처: 부록 A Server-Based Locking, p.332–333
- 태그: [일반]

#### RA-20
- 규칙: 서버 코드를 소유하지 않았다면 ADAPTER로 API를 바꾸고 잠금을 추가하거나(ThreadSafeIntegerIterator), 더 나아가 확장 인터페이스를 가진 스레드 안전 컬렉션을 사용하라.
- 근거: 서버를 못 바꿔도 서버 기반 잠금의 이점을 얻는다.
- 출처: 부록 A Server-Based Locking, p.333
- 태그: [일반]

## 처리율 높이기 (Increasing Throughput)

#### RA-21
- 규칙: 공유 객체의 synchronized 블록은 임계영역(예: URL 반복자에서 다음 URL 꺼내기)만 감싸고, I/O·파싱 같은 나머지는 각 스레드의 비공유 인스턴스(스레드별 PageReader)에서 수행하라.
- 근거: 가능한 한 적게 동기화하는 편이 가능한 한 많이 동기화하는 것보다 항상 낫다.
- 출처: 부록 A Increasing Throughput, p.333–334
- 태그: [일반]

### 단일 스레드에서 처리율 계산 / 다중 스레드에서 처리율 계산 (Single-Thread / Multithread Calculation of Throughput)

#### RA-22
- 규칙: 작업들을 임의 순서로 독립 처리할 수 있으면, I/O 바운드 단계와 프로세서 바운드 단계를 여러 스레드로 겹쳐 처리량을 높이고, 도입 전 I/O·처리 시간으로 기대 처리량을 계산하라.
- 근거: I/O 1초 + 파싱 0.5초 예에서 단일 스레드는 1.5초/페이지, 3스레드는 초당 2페이지(3배).
- 출처: 부록 A Single-Thread / Multithread Calculation of Throughput, p.334–335
- 태그: [일반]

## 데드락 (Deadlock)

#### RA-23
- 규칙: 둘 이상의 유한 자원 풀을 여러 연산이 서로 다른 순서로 획득하지 않게 하라(create: MQ→DB, update: DB→MQ는 풀 크기를 넘는 사용자에서 데드락).
- 근거: 데드락은 현장에서 드물게 발생해 재현·디버깅에 몇 주가 걸린다.
- 출처: 부록 A Deadlock, p.335–336
- 태그: [일반]

#### RA-24
- 규칙: 데드락의 네 조건 — 상호 배제(Mutual Exclusion), 잠금 & 대기(Lock & Wait), 선점 불가(No Preemption), 순환 대기(Circular Wait) — 중 하나 이상을 깨뜨리도록 설계하라.
- 근거: 네 조건이 모두 성립해야 데드락이 가능하며, 하나만 깨도 불가능하다.
- 출처: 부록 A Deadlock / Mutual Exclusion / Lock & Wait / No Preemption / Circular Wait, p.336–337
- 태그: [일반]

### 상호 배제 깨기 (Breaking Mutual Exclusion)

#### RA-25
- 규칙: 동시 사용 가능한 자원(AtomicInteger 등)을 쓰거나, 자원 수를 경쟁 스레드 수 이상으로 늘리거나, 점유 전에 모든 자원이 비어 있는지 확인해 상호 배제를 우회하라.
- 근거: 대부분 자원은 수가 제한되고 동시 사용이 안 되며, 두 번째 자원이 첫 번째의 결과에 의존하기도 하므로 적용 범위가 제한적이다.
- 출처: 부록 A Breaking Mutual Exclusion, p.337
- 태그: [일반]

### 잠금 & 대기 깨기 (Breaking Lock & Wait)

#### RA-26
- 규칙: 대기하지 마라 — 각 자원을 점유 전에 확인하고, 바쁜 자원을 만나면 가진 자원을 모두 놓고 다시 시작하되, 기아(Starvation)와 라이브락(Livelock) 위험을 감안하라.
- 근거: 비효율적이지만 다른 방법이 다 실패해도 거의 항상 구현할 수 있다.
- 출처: 부록 A Breaking Lock & Wait, p.338
- 태그: [일반]

### 선점 불가 깨기 (Breaking Preemption)

#### RA-27
- 규칙: 자원이 바쁘면 소유자에게 해제를 요청하는 메커니즘을 두고, 요청받은 소유자가 다른 자원을 기다리는 중이면 모두 놓고 다시 시작하게 하라(요청 관리가 까다로움에 유의).
- 근거: 대기를 허용하므로 재시작 횟수가 줄어든다.
- 출처: 부록 A Breaking Preemption, p.338
- 태그: [일반]

### 순환 대기 깨기 (Breaking Circular Wait)

#### RA-28
- 규칙: 모든 스레드가 합의한 전역 자원 순서대로 자원을 할당하게 하여 순환 대기를 막아라(가장 흔한 방법); 단 획득 순서≠사용 순서로 인한 과도한 잠금 시간과, 두 번째 자원 ID가 첫 번째 결과에서 나오는 경우 적용 불가함을 감안하라.
- 근거: 모든 스레드가 같은 순서로 할당하면 데드락이 불가능하다.
- 출처: 부록 A Breaking Circular Wait, p.338–339
- 태그: [일반]

#### RA-29
- 규칙: 데드락 회피 전략은 각각 대가(기아, CPU 과사용·응답성 저하)가 있으므로(TANSTAAFL), 스레드 관련 부분을 격리해 튜닝·실험으로 최적 전략을 정하라.
- 근거: 격리는 최적 전략을 결정하는 통찰을 얻는 강력한 방법이다.
- 출처: 부록 A Breaking Circular Wait, p.339
- 태그: [일반]

## 다중 스레드 코드 테스트 (Testing Multithreaded Code)

#### RA-30
- 규칙: 동시성 결함을 증명하는 테스트는 공유 인스턴스 하나에 두 스레드를 반복 실행시키고 기대값(시작값+2)과 다르면 "결함 증명"으로 종료하며, 정해진 반복 내 증명 못 하면 실패하게 작성하라.
- 근거: Listing A-2 — 단, 이런 단순 반복 테스트는 수백만 회가 필요하고 기계·OS·JVM마다 재조정이 필요해 단독으로는 부족하다.
- 출처: 부록 A Testing Multithreaded Code, p.339–341
- 태그: [일반]

#### RA-31
- 규칙: 몬테카를로 테스트(Monte Carlo Testing)를 하라 — 조정 가능한 유연한 테스트를 테스트 서버에서 튜닝 값을 무작위로 바꿔 반복 실행하고, 일찍 작성해 CI에서 돌리며, 실패 조건을 꼼꼼히 로그로 남겨라.
- 근거: 테스트가 한 번이라도 실패하면 코드가 깨진 것이다.
- 출처: 부록 A Testing Multithreaded Code, p.341
- 태그: [일반]

#### RA-32
- 규칙: 모든 대상 배포 플랫폼에서 반복적·지속적으로 테스트를 돌리고, 오래 통과할수록 "코드가 올바르다" 또는 "테스트가 문제를 드러내기에 부적절하다" 둘 중 하나임을 인지하라.
- 근거: 오래 실패하지 않는 것이 정확성의 증명은 아니다.
- 출처: 부록 A Testing Multithreaded Code, p.341
- 태그: [일반]

#### RA-33
- 규칙: 부하를 바꿔 가며(가능하면 프로덕션에 가까운 부하를 시뮬레이션해) 테스트를 실행하라.
- 근거: 동시성 문제는 부하 하에서 드러난다; 그래도 10억 분의 1 문제는 찾기 어렵다.
- 출처: 부록 A Testing Multithreaded Code, p.341–342
- 태그: [일반]

## 스레드 코드 테스트를 도와주는 도구 (Tool Support for Testing Thread-Based Code)

#### RA-34
- 규칙: 다중 사용자·가변 부하를 시뮬레이션하는 테스트를 작성하고, 테스트·프로덕션 코드를 ConTest 같은 계측 도구로 계측한 뒤 실행해 비스레드 안전 코드가 더 일찍·더 확실히 실패하게 하라.
- 근거: 계측 후 실패율이 천만 회 중 1회에서 약 30회 중 1회로 올랐다.
- 출처: 부록 A Tool Support for Testing Thread-Based Code, p.342
- 태그: [일반] (ConTest는 [Java특화])

## 결론 (Conclusion)

#### RA-35
- 규칙: 동시성 시스템을 작성할 예정이면 깨끗한 동기화·잠금 규율 외에 Doug Lea의 Concurrent Programming in Java 등으로 더 깊이 학습하라.
- 근거: 이 장은 방대한 영역의 표면만 다뤘다.
- 출처: 부록 A Conclusion, p.342
- 태그: [일반]

## 튜토리얼: 전체 코드 예제 (Tutorial: Full Code Examples)

#### RA-36
- 규칙: 다른 스레드가 바꾸는 종료 플래그(keepProcessing)는 volatile로 선언하고, 종료 시 플래그를 내린 뒤 블로킹 자원(ServerSocket)을 닫아 대기 중인 accept를 깨워라; 블로킹 accept에는 타임아웃(setSoTimeout)을 둬라.
- 근거: Listing A-3의 stopProcessing — 종료 시그널을 받지 못하고 블로킹되는 문제(13장 종료 코드) 방지.
- 출처: 부록 A Tutorial: Full Code Examples / Client/Server Nonthreaded, p.343
- 태그: [Java특화] (원리는 [일반])

#### RA-37
- 규칙: 정리(close) 중 무시해도 되는 예외는 의도가 드러나는 이름의 헬퍼(closeIgnoringException, 변수명 `ignore`)에 격리하고, 예상된 예외(종료 시 SocketException)만 선택적으로 무시하라.
- 근거: handle(e)는 SocketException이 아닐 때만 스택 트레이스를 출력한다.
- 출처: 부록 A Client/Server Nonthreaded, p.343–344
- 태그: [일반]

---

## 커버리지 확인

### 마지막으로 읽은 줄
- 파일 총 4167행(wc -l; 실제 마지막 텍스트 행 4167 "This page intentionally left blank") — **4167행까지 전부 읽음** (Read: 1–630, 630–1429, 1430–2129, 2130–2809, 2810–3509, 3510–4167).

### 만난 절 제목 목록
**13장 Concurrency:** Why Concurrency? · Myths and Misconceptions · Challenges · Concurrency Defense Principles · Single Responsibility Principle · Corollary: Limit the Scope of Data · Corollary: Use Copies of Data · Corollary: Threads Should Be as Independent as Possible · Know Your Library · Thread-Safe Collections · Know Your Execution Models · Producer-Consumer · Readers-Writers · Dining Philosophers · Beware Dependencies Between Synchronized Methods · Keep Synchronized Sections Small · Writing Correct Shut-Down Code Is Hard · Testing Threaded Code · Treat Spurious Failures as Candidate Threading Issues · Get Your Nonthreaded Code Working First · Make Your Threaded Code Pluggable · Make Your Threaded Code Tunable · Run with More Threads Than Processors · Run on Different Platforms · Instrument Your Code to Try and Force Failures · Hand-Coded · Automated · Conclusion · Bibliography

**16장 Refactoring SerialDate:** (서론) · First, Make It Work · Then Make It Right · Conclusion · Bibliography

**17장 Smells and Heuristics:** (서론) · Comments · Environment · Functions · General · Java · Names · Tests · Conclusion · Bibliography

**부록 A Concurrency II:** (서론) · Client/Server Example · The Server · Adding Threading · Server Observations · Conclusion · Possible Paths of Execution · Number of Paths · (박스: Calculating the Possible Orderings) · Digging Deeper · Conclusion · Knowing Your Library · Executor Framework · Nonblocking Solutions · Nonthread-Safe Classes · Dependencies Between Methods Can Break Concurrent Code · Tolerate the Failure · Client-Based Locking · Server-Based Locking · Increasing Throughput · Single-Thread Calculation of Throughput · Multithread Calculation of Throughput · Deadlock · Mutual Exclusion · Lock & Wait · No Preemption · Circular Wait · Breaking Mutual Exclusion · Breaking Lock & Wait · Breaking Preemption · Breaking Circular Wait · Testing Multithreaded Code · Tool Support for Testing Thread-Based Code · Conclusion · Tutorial: Full Code Examples · Client/Server Nonthreaded · Client/Server Using Threads (Listing A-3~A-5, 스레드 버전 process — 파일은 여기서 끝남; 원서의 이후 튜토리얼 목록은 이 청크에 없음)

### 냄새 코드 체크리스트 (17장)
- 주석 C1–C5: C1 ✔ C2 ✔ C3 ✔ C4 ✔ C5 ✔ (5/5)
- 환경 E1–E2: E1 ✔ E2 ✔ (2/2)
- 함수 F1–F4: F1 ✔ F2 ✔ F3 ✔ F4 ✔ (4/4)
- 일반 G1–G36: G1 ✔ G2 ✔ G3 ✔ G4 ✔ G5 ✔ G6 ✔ G7 ✔ G8 ✔ G9 ✔ G10 ✔ G11 ✔ G12 ✔ G13 ✔ G14 ✔ G15 ✔ G16 ✔ G17 ✔ G18 ✔ G19 ✔ G20 ✔ G21 ✔ G22 ✔ G23 ✔ G24 ✔ G25 ✔ G26 ✔ G27 ✔ G28 ✔ G29 ✔ G30 ✔ G31 ✔ G32 ✔ G33 ✔ G34 ✔ G35 ✔ G36 ✔ (36/36)
- 자바 J1–J3: J1 ✔ J2 ✔ J3 ✔ (3/3)
- 이름 N1–N7: N1 ✔ N2 ✔ N3 ✔ N4 ✔ N5 ✔ N6 ✔ N7 ✔ (7/7)
- 테스트 T1–T9: T1 ✔ T2 ✔ T3 ✔ T4 ✔ T5 ✔ T6 ✔ T7 ✔ T8 ✔ T9 ✔ (9/9)
- 텍스트에 없는 코드: 없음 (총 66개 전부 원문에 존재하고 개별 기록함)
