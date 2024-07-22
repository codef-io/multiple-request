package io.codef;

import com.fasterxml.jackson.core.JsonProcessingException;
import io.codef.api.EasyCodef;
import io.codef.api.EasyCodefServiceType;
import org.json.JSONObject;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.util.*;

import static java.lang.System.exit;

public class MultipleRequestSample {
    private static final String clientId = "";
    private static final String clientSecret = "";
    private static final String publicKey = "";
    private static final EasyCodefServiceType serviceType = EasyCodefServiceType.DEMO;

    private static final String identity = ""; // 생년월일 (19990101 형식 [String))
    private static final String userName = ""; // 사용자 이름 [String]
    private static final String phoneNo = ""; // 전화번호 (01012345678 형식 [String])
    private static final String telecom = ""; // 통신사 (SKT/알뜰폰: '0', KT/알뜰폰: '1', LGU+/알뜰폰: '2' [String])

    private static final String id = UUID.randomUUID().toString();
    private static final String endPoint = "/v1/kr/public/pp/nhis-health-checkup/result";

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

    public static void main(String[] args) throws InterruptedException {
        EasyCodef codef = new EasyCodef();
        codef.setPublicKey(publicKey);
        codef.setClientInfoForDemo(clientId, clientSecret);

        List<HashMap<String, Object>> requestParams = Arrays.asList(
                commonParam(2024),
                commonParam(2023),
                commonParam(2022),
                commonParam(2021),
                commonParam(2020)
        );

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
    }

    private static void requestCertification(
            HashMap<String, Object> requestParam,
            JSONObject resultJson,
            EasyCodef codef
    ) throws InterruptedException, UnsupportedEncodingException, JsonProcessingException {
        System.out.println("[CODEF] 추가인증 요청 | 엔드유저에게 간편인증을 요청합니다.");

        Thread.sleep(3000);
        System.out.println(" ============= 간편 인증 완료 후  콘솔창에 값을 입력해 주세요. =============  ");
        Scanner sc = new Scanner(System.in);
        String i = sc.next();
        System.out.println(" ============= ( 입력 값 : " + i + " ), 2차 요청이 진행될 예정 입니다. ============= ");

        HashMap<String, Object> twoWayInfoMap = new HashMap<>();
        twoWayInfoMap.put("jobIndex", resultJson.getJSONObject("data").getLong("jobIndex"));
        twoWayInfoMap.put("threadIndex", resultJson.getJSONObject("data").getLong("threadIndex"));
        twoWayInfoMap.put("jti", resultJson.getJSONObject("data").getString("jti"));
        twoWayInfoMap.put("twoWayTimestamp", resultJson.getJSONObject("data").getNumber("twoWayTimestamp"));

        requestParam.put("twoWayInfo", twoWayInfoMap);
        requestParam.put("is2Way", true);
        requestParam.put("simpleAuth", "1");

        String result2 = codef.requestCertification(endPoint, serviceType, requestParam);
        JSONObject result2Json = new JSONObject(result2);
        if (!result2Json.getJSONObject("result").getString("code").equals("CF-00000")) {
            System.out.println("[Codef] 엔드유저의 추가 인증이 정상적으로 완료되지 않았습니다.");
            exit(0);
        }
        System.out.println("result = " + result2);
    }
}