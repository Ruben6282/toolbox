/**
 * Comprehensive unit tests for DiscountCalculator
 * Tests all validation logic, edge cases, and calculation accuracy
 */

import { describe, it, expect } from "vitest";
import { validateAndComputeDiscount } from "@/components/tools/DiscountCalculator";

describe("DiscountCalculator - validateAndComputeDiscount", () => {
  describe("Original Price Validation", () => {
    it("should accept valid price", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.price).toBe(100);
    });

    it("should accept price with decimals", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "99.99",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.price).toBe(99.99);
    });

    it("should handle empty price", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.price).toBe(0);
    });

    it("should trim whitespace from price", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "  100  ",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.price).toBe(100);
    });

    it("should reject negative price", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "-100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("price");
    });

    it("should reject price exceeding max", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "1000000001",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("price");
    });

    it("should reject non-numeric price", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "abc",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("price");
    });

    it("should reject Infinity price", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "Infinity",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("price");
    });

    it("should reject NaN price", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "NaN",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("price");
    });
  });

  describe("Percentage Discount Validation", () => {
    it("should accept valid percentage discount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "25",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(25);
    });

    it("should accept 0% discount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "0",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(0);
    });

    it("should accept 100% discount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "100",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(100);
    });

    it("should trim whitespace from percentage", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "  20  ",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(20);
    });

    it("should reject negative percentage", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "-10",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("discount");
    });

    it("should reject percentage over 100", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "101",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("discount");
    });

    it("should reject non-numeric percentage", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "abc",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("discount");
    });

    it("should handle empty percentage discount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(0);
    });
  });

  describe("Fixed Amount Discount Validation", () => {
    it("should accept valid fixed discount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "amount",
        discountValue: "25",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(25);
    });

    it("should accept discount equal to price", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "amount",
        discountValue: "100",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(100);
    });

    it("should reject discount exceeding price", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "amount",
        discountValue: "150",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("discount");
      expect(result.error).toContain("cannot exceed");
    });

    it("should reject negative discount amount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "amount",
        discountValue: "-10",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("discount");
    });

    it("should reject discount amount exceeding max", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "amount",
        discountValue: "1000000001",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("discount");
    });

    it("should handle empty discount amount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "amount",
        discountValue: "",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(0);
    });

    it("should trim whitespace from amount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "amount",
        discountValue: "  25  ",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(25);
    });
  });

  describe("Tax Rate Validation", () => {
    it("should accept valid tax rate", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "8.5",
      });
      expect(result.error).toBeNull();
      expect(result.taxRate).toBe(8.5);
    });

    it("should accept 0% tax", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.taxRate).toBe(0);
    });

    it("should accept 100% tax", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "100",
      });
      expect(result.error).toBeNull();
      expect(result.taxRate).toBe(100);
    });

    it("should handle empty tax rate", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "",
      });
      expect(result.error).toBeNull();
      expect(result.taxRate).toBe(0);
    });

    it("should trim whitespace from tax rate", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "  8.5  ",
      });
      expect(result.error).toBeNull();
      expect(result.taxRate).toBe(8.5);
    });

    it("should reject negative tax rate", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "-5",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("tax");
    });

    it("should reject tax rate over 100", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "101",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("tax");
    });

    it("should reject non-numeric tax rate", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "abc",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("tax");
    });
  });

  describe("Calculation Accuracy", () => {
    it("should calculate percentage discount correctly", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "20",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.price).toBe(100);
      expect(result.discountAmount).toBe(20);
      expect(result.discountedPrice).toBe(80);
      expect(result.savings).toBe(20);
      expect(result.effectivePercent).toBe(20);
    });

    it("should calculate fixed discount correctly", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "amount",
        discountValue: "25",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.price).toBe(100);
      expect(result.discountAmount).toBe(25);
      expect(result.discountedPrice).toBe(75);
      expect(result.savings).toBe(25);
      expect(result.effectivePercent).toBe(25);
    });

    it("should calculate tax correctly", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "20",
        taxRate: "10",
      });
      expect(result.error).toBeNull();
      expect(result.discountedPrice).toBe(80);
      expect(result.taxAmount).toBe(8);
      expect(result.finalPrice).toBe(88);
    });

    it("should round to 2 decimal places", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "99.99",
        discountType: "percentage",
        discountValue: "33.33",
        taxRate: "8.25",
      });
      expect(result.error).toBeNull();
      // 99.99 * 0.3333 = 33.33
      expect(result.discountAmount).toBe(33.33);
      // 99.99 - 33.33 = 66.66
      expect(result.discountedPrice).toBe(66.66);
      // 66.66 * 0.0825 = 5.50
      expect(result.taxAmount).toBe(5.5);
      // 66.66 + 5.50 = 72.16
      expect(result.finalPrice).toBe(72.16);
    });

    it("should handle 100% discount correctly", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "100",
        taxRate: "10",
      });
      expect(result.error).toBeNull();
      expect(result.discountedPrice).toBe(0);
      expect(result.taxAmount).toBe(0);
      expect(result.finalPrice).toBe(0);
      expect(result.savings).toBe(100);
    });

    it("should calculate effective percentage for fixed discount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "200",
        discountType: "amount",
        discountValue: "50",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.effectivePercent).toBe(25);
    });

    it("should handle zero price with fixed discount", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "0",
        discountType: "amount",
        discountValue: "0",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.effectivePercent).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small amounts", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "0.01",
        discountType: "percentage",
        discountValue: "50",
        taxRate: "5",
      });
      expect(result.error).toBeNull();
      expect(result.discountAmount).toBe(0.01);
      expect(result.discountedPrice).toBe(0);
    });

    it("should handle very large valid amounts", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "999999999",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "5",
      });
      expect(result.error).toBeNull();
      expect(result.price).toBe(999999999);
    });

    it("should handle scientific notation input", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "1e2",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.price).toBe(100);
    });

    it("should reject scientific notation that exceeds max", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "1e10",
        discountType: "percentage",
        discountValue: "10",
        taxRate: "0",
      });
      expect(result.error).not.toBeNull();
      expect(result.errorField).toBe("price");
    });

    it("should handle all zeros", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "0",
        discountType: "percentage",
        discountValue: "0",
        taxRate: "0",
      });
      expect(result.error).toBeNull();
      expect(result.price).toBe(0);
      expect(result.discountAmount).toBe(0);
    });

    it("should verify all calculated values are finite", () => {
      const result = validateAndComputeDiscount({
        originalPrice: "100",
        discountType: "percentage",
        discountValue: "25",
        taxRate: "10",
      });
      expect(result.error).toBeNull();
      expect(Number.isFinite(result.price!)).toBe(true);
      expect(Number.isFinite(result.discountAmount!)).toBe(true);
      expect(Number.isFinite(result.discountedPrice!)).toBe(true);
      expect(Number.isFinite(result.taxAmount!)).toBe(true);
      expect(Number.isFinite(result.finalPrice!)).toBe(true);
      expect(Number.isFinite(result.savings!)).toBe(true);
      expect(Number.isFinite(result.effectivePercent!)).toBe(true);
    });
  });
});
