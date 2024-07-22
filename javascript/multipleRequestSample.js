const {EasyCodef, EasyCodefConstant} = require('easycodef-node');
const {promisify} = require('util');
const readline = require('readline');
const uuid = require('uuid');

// 클라이언트 정보 및 인증 설정
const clientId = '';
const clientSecret = '';
const publicKey = '';

// 서비스 타입 설정
const serviceType = EasyCodefConstant.SERVICE_TYPE_DEMO;    // 데모버전
// const serviceType = EasyCodefConstant.SERVICE_TYPE_API;  // 정식버전

const endPoint = '/v1/kr/public/pp/nhis-health-checkup/result';
const id = uuid.v1();

// 개인정보 설정
const identity = '19990101'; // 생년월일 (19990101 형식 [String))
const userName = '김코드'; // 사용자 이름 [String]
const phoneNo = '01012345678'; // 전화번호 (01012345678 형식 [String])
const telecom = '0'; // 통신사 (SKT/알뜰폰: '0', KT/알뜰폰: '1', LGU+/알뜰폰: '2' [String])



// 간편인증 사용자 완료 여부 체크 Input ReadLine
const userInput = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while (true) {
        const answer = await promisify(rl.question)
            .call(rl, "[CODEF] 엔드유저에게 카카오톡 간편인증 요청을 송신했습니다. 간편인증을 완료하고 콘솔에 '1'을 입력해주세요. : ");
        if (answer === '1') {
            console.log("[CODEF] 간편인증 완료 FLAG");
            break;
        }
    }

    rl.close();
};

// Sleep Method
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 건강나이 알아보기 요청 파라미터
const commonParam = (targetYear) => ({
    organization: '0002',
    loginType: '5', // 간편인증
    identity: identity,
    loginTypeLevel: '1', // 카카오톡
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

const main = async () => {
    // 쉬운 코드에프 객체 생성
    const codef = new EasyCodef();
    codef.setPublicKey(publicKey);
    codef.setClientInfoForDemo(clientId, clientSecret);

    // 조회 할 API 파라미터 설정
    const requestParams = [
        commonParam(2024),
        commonParam(2023),
        commonParam(2022),
        commonParam(2021),
        commonParam(2020),
        commonParam(2019),
        commonParam(2018),
        commonParam(2017),
        commonParam(2016),
        commonParam(2015),
        commonParam(2014)
    ];

    // 0.5초 간격으로 requestParams를 순회하며 각 API 비동기 호출
    const responseTasks = [];
    for (const requestParam of requestParams) {
        console.log('[CODEF]', endPoint, "호출 :", new Date(Date.now()), `${requestParam.key}년 데이터 조회`);
        await sleep(500);
        responseTasks.push(codef.requestProduct(endPoint, serviceType, requestParam));
    }

    // 추가 인증 응답부 처리
    const addAuthResponse = await Promise.any(responseTasks);
    const addAuthJsonResponse = JSON.parse(addAuthResponse);

    if (addAuthJsonResponse.result.code !== 'CF-03002') {
        throw new Error('추가인증 요청에 실패했습니다.');
    }

    // 유저 간편인증 완료 대기
    await userInput();

    // 2차 요청을 보낼 파라미터 찾기
    const addAuthKey = addAuthJsonResponse.key;
    const secondRequestParam = requestParams.find(param => param.key === addAuthKey);

    // 추가인증 요청부 세팅
    secondRequestParam['twoWayInfo'] = addAuthJsonResponse.data;
    secondRequestParam['is2Way'] = true;
    secondRequestParam['simpleAuth'] = '1';

    // 추가요청 (requestCertification)
    const firstResponse = await codef.requestCertification(endPoint, serviceType, secondRequestParam);
    const parsedFirstResponse = JSON.parse(firstResponse);

    if (parsedFirstResponse.result.code !== 'CF-00000') {
        console.warn('[CODEF] 사용자 추가 인증 실패 expected CF-00000 but response was', parsedFirstResponse.result.code)
        console.warn('[CODEF] 사용자가 추가 인증을 마친 후, 1을 입력하였는지 검증하세요.')
        process.exit(1)
    }

    console.log(parsedFirstResponse, '\n');

    // 최초로 요청했던 모든 응답값에 대한 리스트업
    const allResponses = await Promise.all(responseTasks);

    // 전체 응답 중, 응답 대기중인 항목만 필터링 및 출력
    allResponses
        .filter(response => JSON.parse(response).key !== parsedFirstResponse.key)
        .forEach(res => {
            const parsedResponse = JSON.parse(res);
            if (parsedResponse.result.code === 'CF-00000') {
                console.log(parsedResponse, '\n');
            } else {
                console.warn('[CODEF] 비정상 응답 : ', parsedResponse, '\n');
            }
        });
};

main();
