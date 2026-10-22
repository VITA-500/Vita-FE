import { describe, expect, it } from "vitest";
import {
  faqFormSchema,
  storeFormSchema,
} from "@/features/admin/common/lib/adminFormSchemas";

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
        businessHours: "09:00-18:00",
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

  it.each([
    "09:00~18:00",
    "09:00 - 18:00",
    "24:00-18:00",
    "09:60-18:00",
    "09:00-09:00",
  ])("rejects hours outside the BE contract: %s", (businessHours) => {
    expect(
      storeFormSchema.safeParse({
        name: "매장",
        address: "서울",
        lat: "37.5",
        lng: "127",
        businessHours,
      }).success,
    ).toBe(false);
  });

  it("accepts overnight business hours supported by BE", () => {
    expect(
      storeFormSchema.safeParse({
        name: "야간 매장",
        address: "서울",
        lat: "37.5",
        lng: "127",
        businessHours: "22:00-02:00",
      }).success,
    ).toBe(true);
  });

  it("rejects store fields that exceed BE limits", () => {
    expect(
      storeFormSchema.safeParse({
        name: "매장",
        address: "a".repeat(256),
        lat: "37.5",
        lng: "127",
        consultServices: "a".repeat(51),
      }).success,
    ).toBe(false);
  });

  it("rejects FAQ subcategories over the BE limit", () => {
    expect(
      faqFormSchema.safeParse({
        answer: "답변",
        category: "모바일",
        question: "질문",
        subcategory: "a".repeat(51),
      }).success,
    ).toBe(false);
  });

  it.each(["00:00-23:59", " 09:00-18:00 ", "", "   ", undefined])(
    "allows valid and optional operation values: %s",
    (businessHours) => {
      expect(
        storeFormSchema.safeParse({
          name: "매장",
          address: "서울",
          lat: "37.5",
          lng: "127",
          businessHours,
        }).success,
      ).toBe(true);
    },
  );
});
