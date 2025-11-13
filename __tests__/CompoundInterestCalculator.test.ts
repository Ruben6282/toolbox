import { describe, it, expect } from "vitest";
import { validateAndComputeCompoundInterest } from "@/components/tools/CompoundInterestCalculator";

describe("validateAndComputeCompoundInterest", () => {
  it("returns empty results when no principal and no contributions", () => {
    const res = validateAndComputeCompoundInterest({
      principal: "0",
      interestRate: "5",
      time: "10",
      timeUnit: "years",
      compoundingFrequency: "annually",
      additionalContributions: "0",
      contributionFrequency: "monthly",
    });
    expect(res.error).toBeNull();
    expect(res.finalAmount).toBe(0);
  });

  it("handles 0% interest rate with contributions (no division by zero)", () => {
    const res = validateAndComputeCompoundInterest({
      principal: "1000",
      interestRate: "0",
      time: "2",
      timeUnit: "years",
      compoundingFrequency: "monthly",
      additionalContributions: "100",
      contributionFrequency: "monthly",
    });
    expect(res.error).toBeNull();
    // 24 periods * $100 + principal
    expect(res.totalContributions).toBeCloseTo(1000 + 24 * 100, 2);
    expect(res.finalAmount).toBeCloseTo(res.totalContributions!, 2);
    expect(res.totalInterest).toBeCloseTo(0, 2);
  });

  it("rejects scientific notation", () => {
    const res = validateAndComputeCompoundInterest({
      principal: "1e6",
      interestRate: "5",
      time: "10",
      timeUnit: "years",
      compoundingFrequency: "annually",
      additionalContributions: "0",
      contributionFrequency: "monthly",
    });
    expect(res.error).toBeTruthy();
    expect(res.errorField).toBe("principal");
  });

  it("rejects invalid enum values", () => {
    const res = validateAndComputeCompoundInterest({
      principal: "1000",
      interestRate: "5",
      time: "1",
      timeUnit: "decades" as any,
      compoundingFrequency: "annually",
      additionalContributions: "0",
      contributionFrequency: "monthly",
    });
    expect(res.error).toBeTruthy();
    expect(res.errorField).toBe("timeUnit");
  });

  it("caps time horizon and errors when too large", () => {
    const res = validateAndComputeCompoundInterest({
      principal: "1000",
      interestRate: "5",
      time: "10000",
      timeUnit: "days",
      compoundingFrequency: "annually",
      additionalContributions: "0",
      contributionFrequency: "monthly",
    });
    expect(res.error).toBeTruthy();
    expect(res.errorField).toBe("time");
  });

  it("computes a sane happy path", () => {
    const res = validateAndComputeCompoundInterest({
      principal: "10000",
      interestRate: "6",
      time: "10",
      timeUnit: "years",
      compoundingFrequency: "monthly",
      additionalContributions: "200",
      contributionFrequency: "monthly",
    });
    expect(res.error).toBeNull();
    expect(res.finalAmount!).toBeGreaterThan(res.totalContributions!);
    expect(res.totalInterest!).toBeGreaterThan(0);
    expect(Number.isFinite(res.effectiveAnnualRate!)).toBe(true);
  });
});
