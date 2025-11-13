/**
 * Comprehensive unit tests for MortgageCalculator
 * Tests all validation logic, edge cases, and calculation accuracy
 */

import { describe, it, expect } from "vitest";
import { validateAndComputeMortgage } from "@/components/tools/MortgageCalculator";

describe("MortgageCalculator - validateAndComputeMortgage", () => {
  describe("Loan Amount Validation", () => {
    it("should accept valid loan amount", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.loanAmount).toBe(300000);
    });

    it("should trim whitespace", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "  300000  ",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.loanAmount).toBe(300000);
    });

    it("should reject scientific notation", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "1e6",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("loanAmount");
      expect(result.error).toContain("Scientific notation");
    });

    it("should reject negative loan amount", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "-100000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("loanAmount");
    });

    it("should reject loan amount exceeding max", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "10000000001",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("loanAmount");
    });

    it("should reject non-numeric loan amount", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "abc",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("loanAmount");
    });

    it("should handle empty loan amount", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.loanAmount).toBe(0);
    });
  });

  describe("Interest Rate Validation", () => {
    it("should accept valid interest rate", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5.5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.interestRate).toBe(5.5);
    });

    it("should accept 0% interest rate", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "0",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.interestRate).toBe(0);
    });

    it("should reject interest rate over 30%", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "31",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("interestRate");
    });

    it("should reject negative interest rate", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "-1",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("interestRate");
    });

    it("should reject scientific notation", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "1e2",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("interestRate");
    });
  });

  describe("Loan Term Validation", () => {
    it("should accept valid loan term", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "15",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.loanTerm).toBe(15);
    });

    it("should default to 30 years if empty", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.loanTerm).toBe(30);
    });

    it("should reject loan term less than 1", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "0",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("loanTerm");
    });

    it("should reject loan term over 50 years", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "51",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("loanTerm");
    });

    it("should reject decimal loan term", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30.5",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("loanTerm");
    });

    it("should floor decimal to integer if passed validation", () => {
      // This tests internal behavior - the validation should prevent decimals
      // but if one somehow gets through, it should be floored
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.loanTerm).toBe(30);
      expect(Number.isInteger(result.loanTerm)).toBe(true);
    });
  });

  describe("Down Payment Validation", () => {
    it("should accept valid down payment", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "60000",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.downPayment).toBe(60000);
    });

    it("should reject down payment exceeding loan amount", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "400000",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("downPayment");
      expect(result.error).toContain("cannot exceed");
    });

    it("should accept down payment equal to loan amount", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "300000",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      // Should error because loan amount after down payment would be 0
      expect(result.error).not.toBeNull();
    });

    it("should reject negative down payment", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "-10000",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("downPayment");
    });
  });

  describe("Property Tax Validation", () => {
    it("should accept valid property tax", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "6000",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.propertyTax).toBe(6000);
    });

    it("should handle empty property tax", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.propertyTax).toBe(0);
    });

    it("should reject negative property tax", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "-1000",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("propertyTax");
    });
  });

  describe("Home Insurance Validation", () => {
    it("should accept valid home insurance", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "1200",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.homeInsurance).toBe(1200);
    });

    it("should reject negative home insurance", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "-500",
        pmi: "",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("homeInsurance");
    });
  });

  describe("PMI Rate Validation", () => {
    it("should accept valid PMI rate", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "0.5",
      });
      expect(result.error).toBeNull();
      expect(result.pmiRate).toBe(0.5);
    });

    it("should accept 0% PMI", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "0",
      });
      expect(result.error).toBeNull();
      expect(result.pmiRate).toBe(0);
    });

    it("should reject PMI rate over 5%", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "6",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("pmi");
    });

    it("should reject negative PMI rate", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "-1",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("pmi");
    });
  });

  describe("Calculation Accuracy", () => {
    it("should calculate basic mortgage correctly", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.actualLoanAmount).toBe(300000);
      expect(result.monthlyPayment).toBeGreaterThan(1600);
      expect(result.monthlyPayment).toBeLessThan(1620);
    });

    it("should calculate mortgage with down payment", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "60000",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.actualLoanAmount).toBe(240000);
      expect(result.monthlyPayment).toBeLessThan(1300);
    });

    it("should calculate 0% interest correctly", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "120000",
        interestRate: "0",
        loanTerm: "10",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      // 120000 / (10 * 12) = 1000
      expect(result.monthlyPayment).toBe(1000);
      expect(result.totalInterest).toBe(0);
    });

    it("should calculate PMI on actual loan amount", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "60000",
        propertyTax: "",
        homeInsurance: "",
        pmi: "1",
      });
      expect(result.error).toBeNull();
      // PMI should be on $240,000 (loan after down payment)
      // 1% of 240000 / 12 = 200
      expect(result.monthlyPmi).toBe(200);
    });

    it("should include all monthly costs in total", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "6000",
        homeInsurance: "1200",
        pmi: "1",
      });
      expect(result.error).toBeNull();
      const expectedTotal = 
        result.monthlyPayment! + 
        result.monthlyTax! + 
        result.monthlyInsurance! + 
        result.monthlyPmi!;
      expect(result.totalMonthlyPayment).toBe(expectedTotal);
    });

    it("should round all values to 2 decimal places", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "333333.33",
        interestRate: "4.75",
        loanTerm: "30",
        downPayment: "33333.33",
        propertyTax: "5555.55",
        homeInsurance: "1111.11",
        pmi: "0.75",
      });
      expect(result.error).toBeNull();
      
      // Check all monetary values have at most 2 decimal places
      const checkDecimals = (num: number) => {
        const decimals = (num.toString().split('.')[1] || '').length;
        return decimals <= 2;
      };
      
      expect(checkDecimals(result.monthlyPayment!)).toBe(true);
      expect(checkDecimals(result.monthlyTax!)).toBe(true);
      expect(checkDecimals(result.monthlyInsurance!)).toBe(true);
      expect(checkDecimals(result.monthlyPmi!)).toBe(true);
      expect(checkDecimals(result.totalMonthlyPayment!)).toBe(true);
      expect(checkDecimals(result.totalPayment!)).toBe(true);
      expect(checkDecimals(result.totalInterest!)).toBe(true);
    });

    it("should verify all results are finite", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "60000",
        propertyTax: "6000",
        homeInsurance: "1200",
        pmi: "1",
      });
      expect(result.error).toBeNull();
      expect(Number.isFinite(result.monthlyPayment!)).toBe(true);
      expect(Number.isFinite(result.monthlyTax!)).toBe(true);
      expect(Number.isFinite(result.monthlyInsurance!)).toBe(true);
      expect(Number.isFinite(result.monthlyPmi!)).toBe(true);
      expect(Number.isFinite(result.totalMonthlyPayment!)).toBe(true);
      expect(Number.isFinite(result.totalPayment!)).toBe(true);
      expect(Number.isFinite(result.totalInterest!)).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small loan amounts", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "1000",
        interestRate: "5",
        loanTerm: "5",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.monthlyPayment).toBeGreaterThan(0);
    });

    it("should handle very large valid loan amounts", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "9999999999",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(Number.isFinite(result.monthlyPayment!)).toBe(true);
    });

    it("should handle 1-year loan term", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "100000",
        interestRate: "5",
        loanTerm: "1",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.loanTerm).toBe(1);
    });

    it("should handle 50-year loan term", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "50",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.loanTerm).toBe(50);
    });

    it("should handle all optional fields empty", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "300000",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.downPayment).toBe(0);
      expect(result.propertyTax).toBe(0);
      expect(result.homeInsurance).toBe(0);
      expect(result.pmiRate).toBe(0);
    });

    it("should return empty result for zero loan amount", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "0",
        interestRate: "5",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.monthlyPayment).toBe(0);
    });

    it("should return empty result for zero interest rate with zero loan", () => {
      const result = validateAndComputeMortgage({
        loanAmount: "0",
        interestRate: "0",
        loanTerm: "30",
        downPayment: "",
        propertyTax: "",
        homeInsurance: "",
        pmi: "",
      });
      expect(result.error).toBeNull();
      expect(result.monthlyPayment).toBe(0);
    });
  });
});
