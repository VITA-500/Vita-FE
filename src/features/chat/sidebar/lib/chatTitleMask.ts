/**
 * 상담 제목(첫 질문)에 들어간 개인정보를 가린다.
 * 제목은 사이드바·검색처럼 대화를 열지 않아도 보이는 곳에 나오므로, 공용 PC에서 지나가다 보여도
 * 연락처·계좌 같은 값이 그대로 드러나지 않게 한다. 대화 본문은 그대로 둔다.
 */
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)/g;
/** 주민등록번호·외국인등록번호 형태(6자리-7자리). */
const RESIDENT_NUMBER_PATTERN = /\d{6}[-\s]?[1-8]\d{6}/g;
/** 카드·계좌번호처럼 숫자가 12~19자리 이어지는 값(공백·하이픈 허용). */
const LONG_NUMBER_PATTERN = /\d(?:[-\s]?\d){11,18}/g;
/** 휴대폰·지역번호 전화번호. */
const PHONE_PATTERN = /(0\d{1,2})[-.\s]?(\d{3,4})[-.\s]?(\d{4})/g;

const maskLongNumber = (value: string) => {
  const digits = value.replace(/\D/g, "");

  return `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`;
};

export const maskSensitiveText = (text: string) =>
  text
    .replace(EMAIL_PATTERN, (_, domain: string) => `***@${domain}`)
    .replace(RESIDENT_NUMBER_PATTERN, "******-*******")
    .replace(LONG_NUMBER_PATTERN, maskLongNumber)
    .replace(
      PHONE_PATTERN,
      (_, first: string, _middle: string, last: string) =>
        `${first}-****-${last}`,
    );

/** 줄바꿈·연속 공백을 한 칸으로 줄이고 개인정보를 가린 제목용 문자열. */
export const toSafeTitleText = (text: string) =>
  maskSensitiveText(text.replace(/\s+/g, " ").trim());
