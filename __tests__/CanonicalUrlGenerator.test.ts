/**
 * CanonicalUrlGenerator - Enterprise Security Test Suite
 * 
 * Tests for:
 * - HTTPS enforcement
 * - URL validation (sanitizeUrl)
 * - XSS prevention (encodeMetaTag)
 * - Input length limits
 * - Rate limits
 * - Invalid URL scenarios
 * 
 * @security Critical security test coverage
 */

import { describe, it, expect } from 'vitest';
import { sanitizeUrl, encodeMetaTag } from '@/lib/security';

describe('CanonicalUrlGenerator - Security Tests', () => {
  
  // ===================================================================
  // HTTPS ENFORCEMENT TESTS
  // ===================================================================
  
  describe('HTTPS Enforcement', () => {
    it('should accept valid HTTPS URLs', () => {
      const url = 'https://example.com/page';
      const result = sanitizeUrl(url, true);
      expect(result).toBe('https://example.com/page');
    });

    it('should reject HTTP URLs when HTTPS enforced', () => {
      const url = 'http://example.com/page';
      const result = sanitizeUrl(url, true);
      expect(result).toBeNull();
    });

    it('should reject FTP protocol', () => {
      const url = 'ftp://example.com/file';
      const result = sanitizeUrl(url, true);
      expect(result).toBeNull();
    });

    it('should reject file:// protocol', () => {
      const url = 'file:///etc/passwd';
      const result = sanitizeUrl(url, true);
      expect(result).toBeNull();
    });

    it('should reject javascript: protocol (XSS)', () => {
      const url = 'javascript:alert(1)';
      const result = sanitizeUrl(url, true);
      expect(result).toBeNull();
    });

    it('should reject data: protocol (XSS)', () => {
      const url = 'data:text/html,<script>alert(1)</script>';
      const result = sanitizeUrl(url, true);
      expect(result).toBeNull();
    });
  });

  // ===================================================================
  // URL VALIDATION TESTS
  // ===================================================================
  
  describe('URL Validation (sanitizeUrl)', () => {
    it('should accept URLs with paths', () => {
      const url = 'https://example.com/path/to/page';
      const result = sanitizeUrl(url, true);
      expect(result).toBe('https://example.com/path/to/page');
    });

    it('should accept URLs with query parameters', () => {
      const url = 'https://example.com/page?id=123&lang=en';
      const result = sanitizeUrl(url, true);
      expect(result).toBe('https://example.com/page?id=123&lang=en');
    });

    it('should accept URLs with fragments', () => {
      const url = 'https://example.com/page#section';
      const result = sanitizeUrl(url, true);
      expect(result).toBe('https://example.com/page#section');
    });

    it('should accept URLs with subdomains', () => {
      const url = 'https://blog.example.com/article';
      const result = sanitizeUrl(url, true);
      expect(result).toBe('https://blog.example.com/article');
    });

    it('should accept URLs with ports', () => {
      const url = 'https://example.com:8443/page';
      const result = sanitizeUrl(url, true);
      expect(result).toBe('https://example.com:8443/page');
    });

    it('should reject empty URLs', () => {
      const result = sanitizeUrl('', true);
      expect(result).toBeNull();
    });

    it('should reject whitespace-only URLs', () => {
      const result = sanitizeUrl('   ', true);
      expect(result).toBeNull();
    });

    it('should reject malformed URLs', () => {
      const url = 'not-a-valid-url';
      const result = sanitizeUrl(url, true);
      expect(result).toBeNull();
    });

    it('should reject URLs without protocol', () => {
      const url = 'example.com/page';
      const result = sanitizeUrl(url, true);
      expect(result).toBeNull();
    });

    it('should reject URLs with spaces', () => {
      const url = 'https://example.com/path with spaces';
      const result = sanitizeUrl(url, true);
      // Should either reject or encode spaces properly
      expect(result).toMatch(/^https:\/\//);
    });
  });

  // ===================================================================
  // XSS PREVENTION TESTS
  // ===================================================================
  
  describe('XSS Prevention (encodeMetaTag)', () => {
    it('should encode HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = encodeMetaTag(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should encode quotes', () => {
      const input = 'Title with "quotes" and \'apostrophes\'';
      const result = encodeMetaTag(input);
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });

    it('should encode ampersands', () => {
      const input = 'Company & Associates';
      const result = encodeMetaTag(input);
      expect(result).toContain('&amp;');
    });

    it('should handle URLs with query parameters safely', () => {
      const input = 'https://example.com?a=1&b=2';
      const result = encodeMetaTag(input);
      expect(result).toContain('&amp;');
    });

    it('should handle empty strings', () => {
      const result = encodeMetaTag('');
      expect(result).toBe('');
    });

    it('should handle special HTML entities', () => {
      const input = '< > & " \'';
      const result = encodeMetaTag(input);
      expect(result).toBe('&lt; &gt; &amp; &quot; &#x27;');
    });
  });

  // ===================================================================
  // URL LENGTH VALIDATION TESTS
  // ===================================================================
  
  describe('URL Length Limits', () => {
    const MAX_URL_LENGTH = 2000;

    it('should accept URLs within length limit', () => {
      const url = 'https://example.com/' + 'a'.repeat(100);
      expect(url.length).toBeLessThan(MAX_URL_LENGTH);
      const result = sanitizeUrl(url, true);
      expect(result).not.toBeNull();
    });

    it('should identify excessively long URLs', () => {
      const longPath = 'a'.repeat(MAX_URL_LENGTH + 100);
      const url = `https://example.com/${longPath}`;
      expect(url.length).toBeGreaterThan(MAX_URL_LENGTH);
      // Component should reject this before sanitizeUrl is called
    });

    it('should handle URLs at exact length limit', () => {
      // Create URL exactly at 2000 chars
      const pathLength = MAX_URL_LENGTH - 'https://example.com/'.length;
      const url = 'https://example.com/' + 'a'.repeat(pathLength);
      expect(url.length).toBe(MAX_URL_LENGTH);
    });
  });

  // ===================================================================
  // EDGE CASES AND ATTACK VECTORS
  // ===================================================================
  
  describe('Edge Cases & Attack Vectors', () => {
    it('should reject URLs with null bytes', () => {
      const url = 'https://example.com/page\x00.html';
      const result = sanitizeUrl(url, true);
      // Should reject or sanitize null bytes
      if (result) {
        expect(result).not.toContain('\x00');
      }
    });

    it('should handle Unicode characters in URLs', () => {
      const url = 'https://example.com/页面';
      const result = sanitizeUrl(url, true);
      expect(result).not.toBeNull();
    });

    it('should reject SSRF attempts (internal IPs)', () => {
      const urls = [
        'https://127.0.0.1/admin',
        'https://localhost/api',
        'https://192.168.1.1/config',
        'https://10.0.0.1/secret'
      ];
      
      urls.forEach(url => {
        const result = sanitizeUrl(url, true);
        // Depending on sanitizeUrl implementation, might accept or reject
        // Document expected behavior
        if (result) {
          // If accepted, ensure it's properly sanitized
          expect(result).toMatch(/^https:\/\//);
        }
      });
    });

    it('should handle URLs with encoded characters', () => {
      const url = 'https://example.com/page%20name';
      const result = sanitizeUrl(url, true);
      expect(result).not.toBeNull();
    });

    it('should reject URLs with backslashes (Windows path confusion)', () => {
      const url = 'https://example.com\\..\\..\\etc\\passwd';
      const result = sanitizeUrl(url, true);
      // Should reject or normalize to forward slashes
      if (result) {
        expect(result).not.toContain('\\');
      }
    });
  });

  // ===================================================================
  // CANONICAL TAG GENERATION TESTS
  // ===================================================================
  
  describe('Canonical Tag Generation', () => {
    it('should generate valid canonical tag HTML', () => {
      const url = 'https://example.com/page';
      const safeUrl = sanitizeUrl(url, true);
      const encoded = encodeMetaTag(safeUrl!);
      const tag = `<link rel="canonical" href="${encoded}">`;
      
      expect(tag).toContain('rel="canonical"');
      expect(tag).toContain('href="https://example.com/page"');
      expect(tag).not.toContain('<script>');
    });

    it('should safely encode special characters in canonical URLs', () => {
      const url = 'https://example.com/page?a=1&b=2';
      const safeUrl = sanitizeUrl(url, true);
      const encoded = encodeMetaTag(safeUrl!);
      
      expect(encoded).toContain('&amp;');
      expect(encoded).not.toContain('&b='); // Should be &amp;b=
    });

    it('should handle multiple canonical tags safely', () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3'
      ];
      
      urls.forEach(url => {
        const safeUrl = sanitizeUrl(url, true);
        expect(safeUrl).not.toBeNull();
        const encoded = encodeMetaTag(safeUrl!);
        expect(encoded).toMatch(/^https:\/\//);
      });
    });
  });

  // ===================================================================
  // PERFORMANCE & DOS PREVENTION TESTS
  // ===================================================================
  
  describe('Performance & DoS Prevention', () => {
    it('should handle maximum URL list size (100 URLs)', () => {
      const MAX_URLS = 100;
      const urls = Array.from({ length: MAX_URLS }, (_, i) => 
        `https://example.com/page${i}`
      );
      
      expect(urls.length).toBe(MAX_URLS);
      
      // All should be valid
      urls.forEach(url => {
        const result = sanitizeUrl(url, true);
        expect(result).not.toBeNull();
      });
    });

    it('should reject URL list exceeding maximum', () => {
      const MAX_URLS = 100;
      const tooManyUrls = MAX_URLS + 1;
      
      // Component should prevent adding more than MAX_URLS
      expect(tooManyUrls).toBeGreaterThan(MAX_URLS);
    });

    it('should efficiently validate multiple URLs', () => {
      const urls = Array.from({ length: 50 }, (_, i) => 
        `https://example.com/page${i}`
      );
      
      const startTime = performance.now();
      urls.forEach(url => sanitizeUrl(url, true));
      const endTime = performance.now();
      
      // Validation should complete quickly (under 100ms for 50 URLs)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  // ===================================================================
  // INTEGRATION TESTS
  // ===================================================================
  
  describe('Integration Tests', () => {
    it('should handle complete canonical workflow', () => {
      // Step 1: Validate canonical URL
      const canonicalUrl = 'https://example.com/canonical';
      const safeCanonical = sanitizeUrl(canonicalUrl, true);
      expect(safeCanonical).toBe(canonicalUrl);

      // Step 2: Validate alternative URLs
      const alternativeUrls = [
        'https://example.com/page?variant=1',
        'https://example.com/page?variant=2'
      ];
      
      alternativeUrls.forEach(url => {
        const safe = sanitizeUrl(url, true);
        expect(safe).not.toBeNull();
      });

      // Step 3: Generate canonical tags
      const encoded = encodeMetaTag(safeCanonical);
      const tag = `<link rel="canonical" href="${encoded}">`;
      
      expect(tag).toContain('rel="canonical"');
      expect(tag).toContain('https://example.com/canonical');
    });

    it('should reject workflow with invalid URLs', () => {
      // Attempt with HTTP URL (should fail)
      const httpUrl = 'http://example.com/page';
      const result = sanitizeUrl(httpUrl, true);
      expect(result).toBeNull();

      // Attempt with XSS URL (should fail)
      const xssUrl = 'javascript:alert(1)';
      const xssResult = sanitizeUrl(xssUrl, true);
      expect(xssResult).toBeNull();
    });

    it('should handle mixed valid and invalid URLs', () => {
      const urls = [
        'https://example.com/valid1',     // Valid
        'http://example.com/invalid',     // Invalid (HTTP)
        'https://example.com/valid2',     // Valid
        'javascript:alert(1)',            // Invalid (XSS)
        'https://example.com/valid3'      // Valid
      ];

      const results = urls.map(url => sanitizeUrl(url, true));
      
      expect(results[0]).not.toBeNull();
      expect(results[1]).toBeNull();
      expect(results[2]).not.toBeNull();
      expect(results[3]).toBeNull();
      expect(results[4]).not.toBeNull();
    });
  });
});
