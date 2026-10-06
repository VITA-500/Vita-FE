import { describe, expect, it } from "vitest";
import { faqFormSchema, storeFormSchema } from "./adminFormSchemas";

describe("admin form schemas", () => {
  it("requires FAQ category, question, and answer", () => {
    expect(
      faqFormSchema.safeParse({
        answer: "",
        category: undefined,
        question: "",
      }).success,
    ).toBe(false);
  });

  it("accepts a valid FAQ payload", () => {
    expect(
      faqFormSchema.safeParse({
        answer: "답변",
        category: "서비스안내",
        question: "질문",
        subcategory: "정보변경",
      }).success,
    ).toBe(true);
  });

  it("rejects non-numeric store coordinates", () => {
    expect(
      storeFormSchema.safeParse({
        address: "서울 강남구 테헤란로 111",
        lat: "위도",
        lng: "127.0000",
        name: "VITA 강남점",
      }).success,
    ).toBe(false);
  });

  it("accepts optional store operation fields", () => {
    expect(
      storeFormSchema.safeParse({
        address: "서울 강남구 테헤란로 111",
        businessHours: "",
        consultServices: "휴대폰상담, 요금제변경",
        lat: "37.2660",
        lng: "127.0000",
        name: "VITA 강남점",
        phone: "",
        providedServices: "유심발급",
      }).success,
    ).toBe(true);
  });

  it("accepts formatted store operation fields", () => {
    expect(
      storeFormSchema.safeParse({
        address: "서울 강남구 테헤란로 111",
        businessHours: "09:00~18:00",
        lat: "37.2660",
        lng: "127.0000",
        name: "VITA 강남점",
        phone: "02-1234-5678",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid store operation fields", () => {
    expect(
      storeFormSchema.safeParse({
        address: "서울 강남구 테헤란로 111",
        businessHours: "오전 9시",
        lat: "37.2660",
        lng: "127.0000",
        name: "VITA 강남점",
        phone: "전화번호",
      }).success,
    ).toBe(false);
  });
});
