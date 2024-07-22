# Use it!

본 다건요청 java 예제는 **`easycodef-java`**, **`json`** 의존성을 필요로 합니다.<br>
이 중, `easycodef-java`는 CODEF API 연동 개발을 돕는 라이브러리 유틸입니다.<br>
해당 라이브러리의 자세한 설명은 [easycodef-java](https://github.com/codef-io/easycodef-java)에서 확인 가능합니다.<br>

<br>

### 0. **Overview**

- 본 예제는 [건강보험공단 건강검진결과](https://developer.codef.io/products/public/each/pp/nhis-health-check) API를 5년 분량을<br>
  다건으로 요청하는 예제 코드로, 입출력부의 자세한 사항은 위 개발가이드를 참고하시기 바랍니다.
- 본 예제는 카카오톡 간편인증을 기반으로 추가인증을 진행합니다.
- 실제 정상적으로
  작동하는 [예제 코드](https://github.com/codef-io/multiple-request/blob/master/java/src/main/java/io/codef/MultipleRequestSample.java)
  를 참고해주세요.

[//]: # (  > [1. Gradle 설정]&#40;#1-gradle-설정&#41;<br>)

[//]: # (  [2. 의존성 Import]&#40;#2-의존성-import&#41;<br>)

[//]: # (  [3. 클라이언트 정보 및 인증 설정]&#40;#3-클라이언트-정보-및-인증-설정&#41;<br>)

[//]: # (  [4. 서비스 타입 설정]&#40;#4-서비스-타입-설정&#41;<br>)

[//]: # (  [5. 예제 Parameter 설정]&#40;#5-예제-parameter-설정&#41;<br>)

[//]: # (  [6. 엔드포인트 및 UUID 설정]&#40;#6-엔드포인트-및-uuid-설정&#41;<br>)

[//]: # (  [7. 공통 파라미터 설계]&#40;#7-공통-파라미터-설계&#41;<br>)

[//]: # (  [8. EasyCodef 객체 생성]&#40;#8-easycodef-객체-생성&#41;<br>)

[//]: # (  [9. 다건요청 호출]&#40;#9-다건요청-호출&#41;<br>)

[//]: # (  [10. 엔드유저 추가인증]&#40;#10-엔드유저-추가인증&#41;<br>)

[//]: # (  [11. 추가인증 요청 &#40;2Way 2차 요청&#41;]&#40;#11-추가인증-요청-2way-2차-요청&#41;<br>)

[//]: # (  [12. 응답 대기 해소 및 다건 요청 응답 반환]&#40;#12-응답-대기-해소-및-다건-요청-응답-반환&#41;<br>)

[//]: # (  [13. Ask Us!]&#40;#13-ask-us&#41;<br>)

<br>

### 1. **Gradle 설정**

- [easycodef-java](https://github.com/codef-io/easycodef-java)에서 해당 라이브러리의 자세한 설명을 확인하실 수 있습니다.
    ```gradle
    dependencies {
      implementation('org.json:json:20211205')
      implementation("io.codef.api:easycodef-java:1.0.5")
    }
    ```

<br>

### 2. **클라이언트 정보 및 인증 설정**<br>

- [CODEF 홈페이지 / 키 관리](https://codef.io/account/keys) 에서 확인 가능

    ```java
    private static final String clientId = "";
    private static final String clientSecret = "";
    private static final String publicKey = "";
    ```

<br>

### 3. **서비스 타입 설정**

- 데모 : 실제 데이터로 1개월간 일 100회씩 무료 테스트
- 정식 : 별도 계약 없이 즉시 도입, 안정적으로 API 호출

    ```java
    private static final EasyCodefServiceType serviceType = EasyCodefServiceType.DEMO;
    private static final EasyCodefServiceType serviceType = EasyCodefServiceType.API;
    ```

<br>

### 4. **예제 Parameter 설정**

- 본 예제는 건강보험공단의 건강검진결과를 1년씩 5개년 분량으로 다건 요청을 시도하는 예제입니다.
- 자세한 요청부 파라미터는 [건강검진결과 개발가이드](https://developer.codef.io/products/public/each/pp/nhis-health-check)를 참고해주세요.

    ```java
    // 사용자 생년월일
    private static final String identity = '19990101';    

    // 사용자 이름
    private static final String userName = '김코드';      

    // 휴대폰 번호 String
    private static final String phoneNo = '01012345678';

    // 통신사 String (SKT/알뜰폰: '0', KT/알뜰폰: '1', LGU+/알뜰폰: '2')
    private static final String telecom = '0'; 
    ```

<br>

### 5. **엔드포인트 및 UUID 설정**

- `id` 필드는 다건 요청 간, 로그인 세션을 공유하는 요청을 구분하기 위한 고유의 필드입니다.
- 자세한 설명은 [건강검진결과 개발가이드](https://developer.codef.io/products/public/each/pp/nhis-health-check)를 참고해주세요.

    ```java
    // SSO ID
    private static final String id = UUID.randomUUID().toString();

    // 건강보험공단 건강검진결과조회 요청 endPoint
    private static final String endPoint = '/v1/kr/public/pp/nhis-health-checkup/result';
    ```

<br>

### 6. **공통 파라미터 설계**

- commonParam을 기준으로, 2020 ~ 2024년까지<br>
  총 5개년의 건강검진 요청부를 미리 세팅합니다.

  ```java
  private static HashMap<String, Object> commonParam(Integer targetYear) {
        HashMap<String, Object> param = new HashMap<>();
        param.put("organization", "0002");
        param.put("loginType", "5");
        param.put("identity", identity);
        param.put("loginTypeLevel", "1");
        param.put("userName", userName);
        param.put("telecom", telecom);
        param.put("phoneNo", phoneNo);
        param.put("id", id);
        param.put("inquiryType", "0");
        param.put("searchStartYear", targetYear.toString());
        param.put("searchEndYear", targetYear.toString());
        param.put("type", "1");
    
        return param;
  }
  ```

  ```java
  List<HashMap<String, Object>> requestParams = Arrays.asList(
          commonParam(2024),
          commonParam(2023),
          commonParam(2022),
          commonParam(2021),
          commonParam(2020)
  );
  ```

<br>

### 7. **EasyCodef 객체 생성**

- Codef 객체를 활용해 사용자 키 값을 기준으로 요청을 간편하게 보낼 수 있습니다.
- 해당 라이브러리의 자세한 설명은 [easycodef-java](https://github.com/codef-io/easycodef-java)에서 확인 가능합니다.

    ```java
    public static void main(String[] args) throws InterruptedException {
        EasyCodef codef = new EasyCodef();
        codef.setPublicKey(publicKey);
        codef.setClientInfoForDemo(clientId, clientSecret);
    ```

<br>

### 8. **다건요청 호출**

- 1초 간격으로 requestParams를 순회하며 요청 API를 비동기 호출합니다.
- 이 때, 나머지 4개의 API는 TimeOut 300초까지 응답 대기 상태로,<br>
  사용자가 추가인증을 완료하고, 추가인증 요청을 보낼 때 까지 대기합니다.

    ```java
    for (HashMap<String, Object> requestParam : requestParams) {
        Thread.sleep(1000);

        new Thread(() -> {
            try {
                System.out.println("LocalDate.now() = " + LocalDateTime.now());
                String result = codef.requestProduct(endPoint, serviceType, requestParam);
                JSONObject resultJson = new JSONObject(result);

                if (resultJson.getJSONObject("result").getString("code").equals("CF-03002")) {
                    requestCertification(requestParam, resultJson, codef);
                } else if (resultJson.getJSONObject("result").getString("code").equals("CF-00000")) {
                    System.out.println("result = " + resultJson);
                } else {
                    System.out.println("비정상 result " + resultJson);
                }
            } catch (IOException | InterruptedException e) {
                throw new RuntimeException(e);
            }
        }).start();
    }
    ```

- 건강검진 API는 추가인증이 필요한 API이므로 다건요청이 정상적으로 호출되었다면<br>
  5개의 응답 중 가장 먼저 반환되는 응답은 아래와 같이 `CF-03002` 응답을 반환합니다.

    ```java
    if (resultJson.getJSONObject("result").getString("code").equals("CF-03002")) {
        requestCertification(requestParam, resultJson, codef);
    ```

- 이 때, `CF-03002`를 반환한 응답부 중 `data` 객체를 2차 요청부에 활용해야 합니다.

    ```java
    HashMap<String, Object> twoWayInfoMap = new HashMap<>();
    twoWayInfoMap.put("jobIndex", resultJson.getJSONObject("data").getLong("jobIndex"));
    twoWayInfoMap.put("threadIndex", resultJson.getJSONObject("data").getLong("threadIndex"));
    twoWayInfoMap.put("jti", resultJson.getJSONObject("data").getString("jti"));
    twoWayInfoMap.put("twoWayTimestamp", resultJson.getJSONObject("data").getNumber("twoWayTimestamp"));

    requestParam.put("twoWayInfo", twoWayInfoMap);
    requestParam.put("is2Way", true);
    requestParam.put("simpleAuth", "1");

    String result2 = codef.requestCertification(endPoint, serviceType, requestParam);
    ```

<br>

### 9. **엔드유저 추가인증**

- 본 예제는, 간단한 연동을 위해 콘솔에 1을 입력한다면, 유저가 간편인증을 완료했다는 요청으로 간주합니다.
- 실제 개발 과정에서는 **클라이언트의 View에서 엔드유저의 간편인증 완료 요청**을 처리해야합니다.
- `CF-03002` 응답이 정상적으로 반환되었다면, 엔드유저에게 인증 요청이 전송됩니다.
- 본 예제는 전체 TimeOut 300초, TwoWay 간편 인증 Timeout 270초로 구성되어 있으며,
  이는 [건강검진결과 개발가이드](https://developer.codef.io/products/public/each/pp/nhis-health-check)에서 확인하실 수 있습니다.
    ```java
    System.out.println("[CODEF] 추가인증 요청 | 엔드유저에게 간편인증을 요청합니다.");

    Thread.sleep(3000);
    System.out.println(" ============= 간편 인증 완료 후  콘솔창에 값을 입력해 주세요. =============  ");
  
    Scanner sc = new Scanner(System.in);
    String i = sc.next();
  
    System.out.println(" ============= ( 입력 값 : " + i + " ), 2차 요청이 진행될 예정 입니다. ============= ");
    ```

<br>

### 10. Ask Us!

- 다건요청 문의사항과 개발 과정에서의 오류 등에 대한 문의를 [홈페이지 문의게시판](https://codef.io/cs/inquiry)에 올려주시면 개발팀이 직접 답변을 드립니다.
- 문의게시판의 작성 양식에 맞춰 문의 글을 남겨주세요. 최대한 빠르게 답변 드리겠습니다. 감사합니다.

   >  Q&A 운영시간 : 평일 08:00 ~ 17:00