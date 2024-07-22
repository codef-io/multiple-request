# Use it!

본 다건요청 js 예제는 **`easycodef-node`**, **`uuid`** 의존성을 필요로 합니다.<br>
이 중, `easycodef-node`는 CODEF API 연동 개발을 돕는 라이브러리 유틸입니다.<br>
해당 라이브러리의 자세한 설명은 [easycodef-node](https://github.com/codef-io/easycodef-node)에서 확인 가능합니다.<br>

<br>

### 0. **Overview**

- 본 예제는 [건강보험공단 건강검진결과](https://developer.codef.io/products/public/each/pp/nhis-health-check) API를 5년 분량을<br>
다건으로 요청하는 예제 코드로, 입출력부의 자세한 사항은 위 개발가이드를 참고하시기 바랍니다.
- 본 예제는 카카오톡 간편인증을 기반으로 추가인증을 진행합니다.
- 실제 정상적으로 작동하는 [예제 코드](https://github.com/codef-io/multiple-request/blob/master/javascript/multipleRequestSample.js)를 참고해주세요.


    > [1. 의존성 설치](#1-의존성-설치)<br>
    [2. 의존성 Import](#2-의존성-import)<br>
    [3. 클라이언트 정보 및 인증 설정](#3-클라이언트-정보-및-인증-설정)<br>
    [4. 서비스 타입 설정](#4-서비스-타입-설정)<br>
    [5. 예제 Parameter 설정](#5-예제-parameter-설정)<br>
    [6. 엔드포인트 및 UUID 설정](#6-엔드포인트-및-uuid-설정)<br>
    [7. 공통 파라미터 설계](#7-공통-파라미터-설계)<br>
    [8. EasyCodef 객체 생성](#8-easycodef-객체-생성)<br>
    [9. 다건요청 호출](#9-다건요청-호출)<br>
    [10. 엔드유저 추가인증](#10-엔드유저-추가인증)<br>
    [11. 추가인증 요청 (2Way 2차 요청)](#11-추가인증-요청-2way-2차-요청)<br>
    [12. 응답 대기 해소 및 다건 요청 응답 반환](#12-응답-대기-해소-및-다건-요청-응답-반환)<br>
    [13. Ask Us!](#13-ask-us)<br>

<br>

### 1. **의존성 설치**
- [easycodef-node](https://github.com/codef-io/easycodef-node)에서 해당 라이브러리의 자세한 설명을 확인하실 수 있습니다.
    ```bash
    $ npm i easycodef-node
    $ npm i uuid
    ```

<br>

### 2. **의존성 Import**
- 설치한 의존성을 적절하게 Import합니다.
    ```js
    const {EasyCodef, EasyCodefConstant} = require('easycodef-node');
    const {promisify} = require('util');
    const readline = require('readline');
    const uuid = require('uuid');
    ```

<br>

### 3. **클라이언트 정보 및 인증 설정**<br>

- [CODEF 홈페이지 / 키 관리](https://codef.io/account/keys) 에서 확인 가능

    ```js
    const clientId = '';   
    const clientSecret = '';
    const publicKey = '';
    ```

<br>

### 4. **서비스 타입 설정**

- 데모 : 실제 데이터로 1개월간 일 100회씩 무료 테스트
- 정식 : 별도 계약 없이 즉시 도입, 안정적으로 API 호출

    ```js
    const serviceType = EasyCodefConstant.SERVICE_TYPE_API;     // 정식버전
    const serviceType = EasyCodefConstant.SERVICE_TYPE_DEMO;    // 데모버전
    ```

<br>

### 5. **예제 Parameter 설정**
- 본 예제는 건강보험공단의 건강검진결과를 1년씩 5개년 분량으로 다건 요청을 시도하는 예제입니다.
- 자세한 요청부 파라미터는 [건강검진결과 개발가이드](https://developer.codef.io/products/public/each/pp/nhis-health-check)를 참고해주세요.

    ```js
    // 사용자 생년월일
    const identity = '19990101';    

    // 사용자 이름
    const userName = '김코드';      

    // 휴대폰 번호 String
    const phoneNo = '01012345678';

    // 통신사 String (SKT/알뜰폰: '0', KT/알뜰폰: '1', LGU+/알뜰폰: '2')
    const telecom = '0'; 
    ```

<br>

### 6. **엔드포인트 및 UUID 설정**
- `id` 필드는 다건 요청 간, 로그인 세션을 공유하는 요청을 구분하기 위한 고유의 필드입니다.
- 자세한 설명은 [건강검진결과 개발가이드](https://developer.codef.io/products/public/each/pp/nhis-health-check)를 참고해주세요.

    ```js
    // SSO ID
    const id = uuid.v1();

    // 건강보험공단 건강검진결과조회 요청 endPoint
    const endPoint = '/v1/kr/public/pp/nhis-health-checkup/result';
    ```

<br>

### 7. **공통 파라미터 설계**

- 해당 예제는 같은 API를 `searchStartYear`, `searchEndYear`를 변경하여<br>
총 5개년 건강검진 정보를 조회하는 것을 목적으로 하고 있습니다.
- `key`는 Codef API의 `echo` 기능을 활용한 파라미터로,<br>
Codef API는 개발가이드에 요구하는 외의 Parameter의 Key와 Value를 그대로 응답부에 반환합니다.


    ```js
    const commonParam = (targetYear) => ({
        organization: '0002',
        loginType: '5', 
        identity: identity,
        loginTypeLevel: '1', 
        userName: userName,
        telecom: telecom,
        phoneNo: phoneNo,
        id: id,
        inquiryType: '0',
        searchStartYear: targetYear.toString(),
        searchEndYear: targetYear.toString(),
        key: targetYear.toString(),
        type: '1'
    });
    ```

- commonParam을 기준으로, 2020 ~ 2024년까지<br>
총 5개년의 건강검진 요청부를 미리 세팅합니다.

    ```js
    const requestParams = [
        commonParam(2024),
        commonParam(2023),
        commonParam(2022),
        commonParam(2021),
        commonParam(2020)
    ];
    ```

<br>

### 8. **EasyCodef 객체 생성**

- Codef 객체를 활용해 사용자 키 값을 기준으로 요청을 간편하게 보낼 수 있습니다.
- 해당 라이브러리의 자세한 설명은 [easycodef-node](https://github.com/codef-io/easycodef-node)에서 확인 가능합니다.

    ```js
    const main = async () => {
        const codef = new EasyCodef();
        codef.setPublicKey(publicKey);
        codef.setClientInfoForDemo(clientId, clientSecret);
    ```

<br>

### 9. **다건요청 호출**

- 0.5초 간격으로 requestParams를 순회하며 요청 API를 비동기 호출합니다.
- 이 때, 나머지 4개의 API는 TimeOut 300초까지 응답 대기 상태로,<br>
사용자가 추가인증을 완료하고, 추가인증 요청을 보낼 때 까지 대기합니다.

    ```js
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const responseTasks = [];
        for (const requestParam of requestParams) {
            await sleep(500);
            const task = codef.requestProducts(endPoint, serviceType, requestParam)
            responseTasks.push(task);
        }

        // Promise.Any로 가장 먼저 응답이 반환되는 Task 응답부 get
        const addAuthResponse = await Promise.any(responseTasks);
        const addAuthJsonResponse = JSON.parse(addAuthResponse);
    ```

- 건강검진 API는 추가인증이 필요한 API이므로 다건요청이 정상적으로 호출되었다면<br>
5개의 응답 중 가장 먼저 반환되는 응답은 아래와 같이 `CF-03002` 응답을 반환합니다.

    ```js
        // 가장 먼저 반환된 응답이 `CF-03002`가 아닐 경우 에러 반환
        if (addAuthJsonResponse.result.code !== 'CF-03002') {
            throw new Error('추가인증 요청에 실패했습니다.');
        }
    ```

- 이 때, `CF-03002`를 반환한 응답부 중 `data` 객체를 2차 요청부에 활용해야 합니다.

    ```json
    {
        "result": {
            "code": "CF-03002",
            "extraMessage": "API 요청 처리가 정상 진행 중입니다. 추가 정보를 입력하세요.",
            "message": "성공",
            "transactionId": "669ef2a6ec82f3c03b2b928a"
        },
        "data": {
            "jobIndex": 0,
            "threadIndex": 0,
            "jti": "669ef2a6ec82f3c03b2b928a",
            "twoWayTimestamp": 1721692839244,
            "continue2Way": true,
            "extraInfo": {
                "commSimpleAuth": ""
            },
            "method": "simpleAuth"
        },
        "key": "2023"
    }
    ```

<br>

### 10. **엔드유저 추가인증**

- 본 예제는, 간단한 연동을 위해 콘솔에 1을 입력한다면, 유저가 간편인증을 완료했다는 요청으로 간주합니다.
- 실제 개발 과정에서는 **클라이언트의 View에서 엔드유저의 간편인증 완료 요청**을 처리해야합니다.
- `CF-03002` 응답이 정상적으로 반환되었다면, 엔드유저에게 인증 요청이 전송됩니다.
    ```js
    const userInput = async () => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        while (true) {
            const answer = await promisify(rl.question)
                .call(rl, "[CODEF] 간편인증을 완료하고 콘솔에 '1'을 입력해주세요. : ");
            if (answer === '1') {
                console.log("[CODEF] 간편인증 완료 FLAG");
                break;
            }
        }

        rl.close();
    };
    ```

- 본 예제는 전체 TimeOut 300초, TwoWay 간편 인증 Timeout 270초로 구성되어 있으며,
이는 [건강검진결과 개발가이드](https://developer.codef.io/products/public/each/pp/nhis-health-check)에서 확인하실 수 있습니다.

    ```js
        // 엔드유저가 간편인증을 완료 후, 콘솔에 1을 입력할 때 까지 대기
        await userInput();
    ```

<br>

### 11. **추가인증 요청 (2Way 2차 요청)**

- 엔드유저가 추가인증을 완료했다면, 1차 입력부를 포함해 추가인증 입력부를 조합해<br>
같은 엔드포인트로 2차 요청을 전송해야 합니다.
- `key`는 Codef API의 `echo` 기능을 활용한 파라미터로,<br>
Codef API는 개발가이드에 요구하는 외의 Parameter의 Key와 Value를 그대로 응답부에 반환합니다.

    ```js
        // 2차 요청을 보낼 파라미터 찾기
        const addAuthKey = addAuthJsonResponse.key;
        const secondRequestParam = requestParams.find(
            param => param.key === addAuthKey
        );
    ```

- 본 예제는 [easycodef-node](https://github.com/codef-io/easycodef-node)의 `requestCertification()` 메소드를 활용해 추가요청을 처리합니다.
- `key` 를 통해, `CF-03002` 응답을 받은 1차 요청부 파라미터를 찾고,<br>
2차 요청부에 `twoWayInfo`, `is2Way`, `simpleAuth` 파라미터를 세팅해 추가인증 완료 요청을 전송합니다.

    ```js
        // 요청부 세팅
        secondRequestParam['twoWayInfo'] = addAuthJsonResponse.data;
        secondRequestParam['is2Way'] = true;
        secondRequestParam['simpleAuth'] = '1';

        // 추가요청
        const firstResponse = 
            await codef.requestCertification(
                endPoint, 
                serviceType, 
                secondRequestParam
            );

        const parsedFirstResponse = JSON.parse(firstResponse);

        // Expected CF-00000 [성공]
        if (parsedFirstResponse.result.code !== 'CF-00000') {
            console.warn(
                '[CODEF] 사용자 추가 인증 실패 expected CF-00000 but response was', 
                parsedFirstResponse.result.code
            )
            console.warn('[CODEF] 사용자가 추가 인증을 마친 후, 1을 입력하였는지 검증하세요.')
            process.exit(1)
        }

        // 최초 요청에 대한 응답
        console.log(parsedFirstResponse, '\n');
    ```

<br>

### 12. **응답 대기 해소 및 다건 요청 응답 반환**

- 추가인증 요청에 대한 응답에 `CF-00000` 코드가 반환되었다면,<br>
다건요청이 정상적으로 수행되었고, 이는 곧 응답 대기 상태에 있던 요청이 정상적으로 반환되었음을 의미합니다.

    ```js
        // 최초로 요청했던 모든 응답값에 대한 리스트업
        const allResponses = await Promise.all(responseTasks);

        // 전체 응답 중, 응답 대기중인 항목만 필터링 및 출력
        allResponses
            .filter(response => 
                JSON.parse(response).key !== parsedFirstResponse.key
            )
            .forEach(res => {
                const parsedResponse = JSON.parse(res);
                if (parsedResponse.result.code === 'CF-00000') {
                    console.log(parsedResponse, '\n');
                } else {
                    console.warn('[CODEF] 비정상 응답 : ', parsedResponse, '\n');
                }
            }
        );
    ```

<br>

### 13. Ask Us!

- 다건요청 문의사항과 개발 과정에서의 오류 등에 대한 문의를 [홈페이지 문의게시판](https://codef.io/cs/inquiry)에 올려주시면 개발팀이 직접 답변을 드립니다. 
- 문의게시판의 작성 양식에 맞춰 문의 글을 남겨주세요. 최대한 빠르게 답변 드리겠습니다. 감사합니다.

   >  Q&A 운영시간 : 평일 08:00 ~ 17:00