import { describe, it, expect } from "vitest";
import { validateAndComputeRoi } from "@/components/tools/RoiCalculator";

describe("validateAndComputeRoi", () => {
  it("computes positive ROI correctly", () => {
    const res = validateAndComputeRoi({
      initialInvestment: "1000",
      finalValue: "1500",
      additionalInvestments: "200",
      timePeriod: "2",
      timeUnit: "years",
    });
    expect(res.error).toBeNull();
    expect(res.totalInvested).toBe(1200); // initial + additional
    expect(res.totalReturn).toBe(300); // 1500 - 1200
    expect(res.roiPercent).toBeCloseTo((300 / 1200) * 100, 2);
  });

  it("handles negative ROI when final < invested", () => {
    const res = validateAndComputeRoi({
      initialInvestment: "5000",
      finalValue: "4000",
      additionalInvestments: "0",
      timePeriod: "1",
      timeUnit: "years",
    });
    expect(res.error).toBeNull();
    expect(res.totalReturn).toBe(-1000);
    expect(res.roiPercent).toBeCloseTo((-1000 / 5000) * 100, 2);
  });

  it("rejects scientific notation", () => {
    const res = validateAndComputeRoi({
      initialInvestment: "1e6",
      finalValue: "2000000",
      additionalInvestments: "0",
      timePeriod: "1",
      timeUnit: "years",
    });
    expect(res.error).toBeTruthy();
    expect(res.errorField).toBe("initialInvestment");
  });

  it("rejects invalid time unit", () => {
    const res = validateAndComputeRoi({
      initialInvestment: "100",
      finalValue: "200",
      additionalInvestments: "0",
      timePeriod: "1",
      timeUnit: "invalid", // triggers whitelist failure
    });
    expect(res.error).toBeTruthy();
    expect(res.errorField).toBe("timeUnit");
  });

  it("errors when final provided without initial", () => {
    const res = validateAndComputeRoi({
      initialInvestment: "", // missing
      finalValue: "5000",
      additionalInvestments: "0",
      timePeriod: "1",
      timeUnit: "years",
    });
    expect(res.error).toBeTruthy();
    expect(res.errorField).toBe("initialInvestment");
  });

  it("rejects zero total invested after inputs", () => {
    const res = validateAndComputeRoi({
      initialInvestment: "0", // user explicitly provided zero
      finalValue: "1000",
      additionalInvestments: "0",
      timePeriod: "1",
      timeUnit: "years",
    });
    expect(res.error).toBeTruthy();
    expect(res.errorField).toBe("initialInvestment");
  });

  it("annualized ROI matches expected for months", () => {
    const res = validateAndComputeRoi({
      initialInvestment: "1000",
      finalValue: "1100",
      additionalInvestments: "0",
      timePeriod: "12",
      timeUnit: "months",
    });
    expect(res.error).toBeNull();
    // 12 months = 1 year, ratio 1.1
    expect(res.annualizedPercent).toBeCloseTo(10, 2);
  });
});
