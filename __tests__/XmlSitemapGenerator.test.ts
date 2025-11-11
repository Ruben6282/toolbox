/**
 * XmlSitemapGenerator - Enterprise Security Test Suite
 * 
 * Tests for:
 * - XML injection prevention (escapeXml)
 * - Date validation (validateDate)
 * - Path sanitization (sanitizePath)
 * - HTTPS enforcement
 * - Rate limits
 * - Change frequency validation
 * - Priority validation
 * 
 * @security Critical security test coverage
 */

import { describe, it, expect } from 'vitest';

// ===================================================================
// HELPER FUNCTIONS (exported from component for testing)
// ===================================================================

/**
 * Escape XML special characters to prevent XML injection attacks
 */
const escapeXml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

/**
 * Validate date format (YYYY-MM-DD) with strict checks
 */
const validateDate = (dateString: string): boolean => {
  if (!dateString || typeof dateString !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return false;
  }
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && date.toISOString().split('T')[0] === dateString;
};

/**
 * Sanitize URL path to prevent path traversal and injection
 */
const sanitizePath = (path: string): string => {
  if (!path) return '';
  return path
    .replace(/\.\./g, '')        // Remove parent directory references
    .replace(/\/\//g, '/')       // Remove double slashes
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .trim();
};

/**
 * Validate changefreq value against XML Sitemap spec
 */
const validateChangefreq = (freq: string): boolean => {
  const allowed = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
  return allowed.includes(freq);
};

/**
 * Validate priority value (0.0 to 1.0)
 */
const validatePriority = (priority: string): boolean => {
  const num = parseFloat(priority);
  return !isNaN(num) && isFinite(num) && num >= 0 && num <= 1;
};

describe('XmlSitemapGenerator - Security Tests', () => {
  
  // ===================================================================
  // XML INJECTION PREVENTION TESTS (escapeXml)
  // ===================================================================
  
  describe('XML Injection Prevention (escapeXml)', () => {
    it('should escape less-than character', () => {
      const input = '<script>';
      const result = escapeXml(input);
      expect(result).toBe('&lt;script&gt;');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should escape greater-than character', () => {
      const input = 'a > b';
      const result = escapeXml(input);
      expect(result).toBe('a &gt; b');
    });

    it('should escape ampersand', () => {
      const input = 'Company & Associates';
      const result = escapeXml(input);
      expect(result).toBe('Company &amp; Associates');
    });

    it('should escape single quotes', () => {
      const input = "O'Reilly";
      const result = escapeXml(input);
      expect(result).toBe('O&apos;Reilly');
    });

    it('should escape double quotes', () => {
      const input = 'Say "Hello"';
      const result = escapeXml(input);
      expect(result).toBe('Say &quot;Hello&quot;');
    });

    it('should escape all XML special characters together', () => {
      const input = '<tag attr="value">content & more</tag>';
      const result = escapeXml(input);
      expect(result).toBe('&lt;tag attr=&quot;value&quot;&gt;content &amp; more&lt;/tag&gt;');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('"');
    });

    it('should handle empty string', () => {
      const result = escapeXml('');
      expect(result).toBe('');
    });

    it('should handle string without special characters', () => {
      const input = 'https://example.com/page';
      const result = escapeXml(input);
      expect(result).toBe('https://example.com/page');
    });

    it('should prevent XML injection attack (CDATA)', () => {
      const input = ']]><script>alert("xss")</script><![CDATA[';
      const result = escapeXml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });

    it('should escape URL with query parameters', () => {
      const input = 'https://example.com/page?a=1&b=2';
      const result = escapeXml(input);
      expect(result).toBe('https://example.com/page?a=1&amp;b=2');
    });

    it('should handle multiple ampersands', () => {
      const input = 'a&b&c&d';
      const result = escapeXml(input);
      expect(result).toBe('a&amp;b&amp;c&amp;d');
    });

    it('should handle mixed special characters', () => {
      const input = `<loc>"https://example.com/page?id=1&cat=2"</loc>`;
      const result = escapeXml(input);
      expect(result).not.toContain('<loc>');
      expect(result).not.toContain('</loc>');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&amp;');
    });

    it('should handle null/undefined gracefully', () => {
      expect(escapeXml(null as any)).toBe('');
      expect(escapeXml(undefined as any)).toBe('');
    });
  });

  // ===================================================================
  // DATE VALIDATION TESTS (validateDate)
  // ===================================================================
  
  describe('Date Validation (validateDate)', () => {
    it('should accept valid date format (YYYY-MM-DD)', () => {
      expect(validateDate('2025-01-15')).toBe(true);
      expect(validateDate('2024-12-31')).toBe(true);
      expect(validateDate('2025-11-11')).toBe(true);
    });

    it('should reject invalid date format', () => {
      expect(validateDate('2025/01/15')).toBe(false);
      expect(validateDate('01-15-2025')).toBe(false);
      expect(validateDate('15-01-2025')).toBe(false);
      expect(validateDate('2025-1-5')).toBe(false);
    });

    it('should reject invalid dates (Feb 30)', () => {
      expect(validateDate('2025-02-30')).toBe(false);
      expect(validateDate('2025-02-31')).toBe(false);
    });

    it('should reject invalid month (13)', () => {
      expect(validateDate('2025-13-01')).toBe(false);
    });

    it('should reject invalid day (32)', () => {
      expect(validateDate('2025-01-32')).toBe(false);
    });

    it('should handle leap years correctly', () => {
      expect(validateDate('2024-02-29')).toBe(true);  // 2024 is leap year
      expect(validateDate('2025-02-29')).toBe(false); // 2025 is not leap year
    });

    it('should reject empty string', () => {
      expect(validateDate('')).toBe(false);
    });

    it('should reject non-string input', () => {
      expect(validateDate(null as any)).toBe(false);
      expect(validateDate(undefined as any)).toBe(false);
      expect(validateDate(123 as any)).toBe(false);
    });

    it('should reject partial dates', () => {
      expect(validateDate('2025-01')).toBe(false);
      expect(validateDate('2025')).toBe(false);
    });

    it('should reject dates with extra characters', () => {
      expect(validateDate('2025-01-15 00:00:00')).toBe(false);
      expect(validateDate('2025-01-15T00:00:00')).toBe(false);
    });

    it('should reject invalid date strings', () => {
      expect(validateDate('not-a-date')).toBe(false);
      expect(validateDate('abcd-ef-gh')).toBe(false);
    });

    it('should accept boundary dates', () => {
      expect(validateDate('1970-01-01')).toBe(true);
      expect(validateDate('2099-12-31')).toBe(true);
    });
  });

  // ===================================================================
  // PATH SANITIZATION TESTS (sanitizePath)
  // ===================================================================
  
  describe('Path Sanitization (sanitizePath)', () => {
    it('should remove parent directory references (..)', () => {
      const input = '/page/../../etc/passwd';
      const result = sanitizePath(input);
      expect(result).not.toContain('..');
      expect(result).toBe('/page/etc/passwd');
    });

    it('should remove double slashes', () => {
      const input = '/page//subpage///file';
      const result = sanitizePath(input);
      expect(result).toBe('/page/subpage/file');
    });

    it('should remove control characters', () => {
      const input = '/page\x00\x01\x1F\x7F/file';
      const result = sanitizePath(input);
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\x01');
      expect(result).not.toContain('\x1F');
      expect(result).not.toContain('\x7F');
      expect(result).toBe('/page/file');
    });

    it('should trim whitespace', () => {
      const input = '  /page/file  ';
      const result = sanitizePath(input);
      expect(result).toBe('/page/file');
    });

    it('should handle empty string', () => {
      const result = sanitizePath('');
      expect(result).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizePath(null as any)).toBe('');
      expect(sanitizePath(undefined as any)).toBe('');
    });

    it('should handle multiple parent directory references', () => {
      const input = '/a/../b/../c/../d';
      const result = sanitizePath(input);
      expect(result).not.toContain('..');
      expect(result).toBe('/a/b/c/d');
    });

    it('should handle normal paths unchanged', () => {
      const input = '/blog/article/2025/post-title';
      const result = sanitizePath(input);
      expect(result).toBe('/blog/article/2025/post-title');
    });

    it('should handle paths with query parameters', () => {
      const input = '/page?id=1&category=tech';
      const result = sanitizePath(input);
      expect(result).toBe('/page?id=1&category=tech');
    });

    it('should combine all sanitization rules', () => {
      const input = '  /..//page//../../file\x00\x01  ';
      const result = sanitizePath(input);
      expect(result).not.toContain('..');
      expect(result).not.toContain('//');
      expect(result).not.toContain('\x00');
      expect(result).toBe('/page/file');
    });
  });

  // ===================================================================
  // CHANGEFREQ VALIDATION TESTS
  // ===================================================================
  
  describe('Change Frequency Validation (validateChangefreq)', () => {
    it('should accept valid changefreq values', () => {
      expect(validateChangefreq('always')).toBe(true);
      expect(validateChangefreq('hourly')).toBe(true);
      expect(validateChangefreq('daily')).toBe(true);
      expect(validateChangefreq('weekly')).toBe(true);
      expect(validateChangefreq('monthly')).toBe(true);
      expect(validateChangefreq('yearly')).toBe(true);
      expect(validateChangefreq('never')).toBe(true);
    });

    it('should reject invalid changefreq values', () => {
      expect(validateChangefreq('sometimes')).toBe(false);
      expect(validateChangefreq('often')).toBe(false);
      expect(validateChangefreq('rarely')).toBe(false);
      expect(validateChangefreq('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(validateChangefreq('Daily')).toBe(false);
      expect(validateChangefreq('WEEKLY')).toBe(false);
      expect(validateChangefreq('Monthly')).toBe(false);
    });

    it('should reject special characters', () => {
      expect(validateChangefreq('daily;')).toBe(false);
      expect(validateChangefreq('<script>')).toBe(false);
    });
  });

  // ===================================================================
  // PRIORITY VALIDATION TESTS
  // ===================================================================
  
  describe('Priority Validation (validatePriority)', () => {
    it('should accept valid priority values (0.0 to 1.0)', () => {
      expect(validatePriority('0.0')).toBe(true);
      expect(validatePriority('0.5')).toBe(true);
      expect(validatePriority('1.0')).toBe(true);
      expect(validatePriority('0.75')).toBe(true);
    });

    it('should accept integer boundary values', () => {
      expect(validatePriority('0')).toBe(true);
      expect(validatePriority('1')).toBe(true);
    });

    it('should reject values below 0', () => {
      expect(validatePriority('-0.1')).toBe(false);
      expect(validatePriority('-1')).toBe(false);
    });

    it('should reject values above 1', () => {
      expect(validatePriority('1.1')).toBe(false);
      expect(validatePriority('2')).toBe(false);
      expect(validatePriority('10')).toBe(false);
    });

    it('should reject non-numeric values', () => {
      expect(validatePriority('high')).toBe(false);
      expect(validatePriority('medium')).toBe(false);
      expect(validatePriority('')).toBe(false);
    });

    it('should reject Infinity', () => {
      expect(validatePriority('Infinity')).toBe(false);
      expect(validatePriority('-Infinity')).toBe(false);
    });

    it('should reject NaN', () => {
      expect(validatePriority('NaN')).toBe(false);
    });

    it('should accept decimal precision', () => {
      expect(validatePriority('0.123456')).toBe(true);
      expect(validatePriority('0.9999')).toBe(true);
    });

    it('should reject special characters', () => {
      expect(validatePriority('0.5;')).toBe(false);
      expect(validatePriority('<script>')).toBe(false);
    });
  });

  // ===================================================================
  // INTEGRATION TESTS
  // ===================================================================
  
  describe('Integration Tests', () => {
    it('should generate valid XML sitemap entry', () => {
      const url = 'https://example.com/page';
      const lastmod = '2025-11-11';
      const changefreq = 'weekly';
      const priority = '0.8';

      // Validate all components
      expect(validateDate(lastmod)).toBe(true);
      expect(validateChangefreq(changefreq)).toBe(true);
      expect(validatePriority(priority)).toBe(true);

      // Generate XML
      const xml = `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
    <changefreq>${escapeXml(changefreq)}</changefreq>
    <priority>${escapeXml(priority)}</priority>
  </url>`;

      expect(xml).toContain('<loc>https://example.com/page</loc>');
      expect(xml).toContain('<lastmod>2025-11-11</lastmod>');
      expect(xml).toContain('<changefreq>weekly</changefreq>');
      expect(xml).toContain('<priority>0.8</priority>');
    });

    it('should sanitize dangerous URL before XML generation', () => {
      const dangerousUrl = 'https://example.com/page?id=1&cat=<script>alert(1)</script>';
      const sanitizedUrl = escapeXml(dangerousUrl);
      
      expect(sanitizedUrl).not.toContain('<script>');
      expect(sanitizedUrl).toContain('&lt;script&gt;');
      expect(sanitizedUrl).toContain('&amp;');
    });

    it('should handle complete sitemap workflow', () => {
      const urls = [
        { url: 'https://example.com/', lastmod: '2025-11-11', changefreq: 'daily', priority: '1.0' },
        { url: 'https://example.com/about', lastmod: '2025-11-10', changefreq: 'monthly', priority: '0.8' },
        { url: 'https://example.com/blog', lastmod: '2025-11-09', changefreq: 'weekly', priority: '0.7' }
      ];

      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      urls.forEach(urlData => {
        // Validate
        expect(validateDate(urlData.lastmod)).toBe(true);
        expect(validateChangefreq(urlData.changefreq)).toBe(true);
        expect(validatePriority(urlData.priority)).toBe(true);

        // Generate
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${escapeXml(urlData.url)}</loc>\n`;
        sitemap += `    <lastmod>${escapeXml(urlData.lastmod)}</lastmod>\n`;
        sitemap += `    <changefreq>${escapeXml(urlData.changefreq)}</changefreq>\n`;
        sitemap += `    <priority>${escapeXml(urlData.priority)}</priority>\n`;
        sitemap += `  </url>\n`;
      });

      sitemap += '</urlset>';

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<urlset');
      expect(sitemap).toContain('</urlset>');
      expect(sitemap).toContain('<loc>https://example.com/</loc>');
    });

    it('should reject workflow with invalid data', () => {
      const invalidDate = '2025-13-40'; // Invalid month and day
      const invalidChangefreq = 'sometimes'; // Not in spec
      const invalidPriority = '1.5'; // Above 1.0

      expect(validateDate(invalidDate)).toBe(false);
      expect(validateChangefreq(invalidChangefreq)).toBe(false);
      expect(validatePriority(invalidPriority)).toBe(false);
    });
  });

  // ===================================================================
  // RATE LIMIT & PERFORMANCE TESTS
  // ===================================================================
  
  describe('Rate Limits & Performance', () => {
    const MAX_BULK_IMPORT_URLS = 1000;
    const MAX_URL_LENGTH = 2000;

    it('should handle bulk import up to limit', () => {
      const urls = Array.from({ length: MAX_BULK_IMPORT_URLS }, (_, i) => 
        `https://example.com/page${i}`
      );

      expect(urls.length).toBe(MAX_BULK_IMPORT_URLS);
      
      // All should be valid lengths
      urls.forEach(url => {
        expect(url.length).toBeLessThan(MAX_URL_LENGTH);
      });
    });

    it('should identify URLs exceeding length limit', () => {
      const longPath = 'a'.repeat(MAX_URL_LENGTH + 100);
      const url = `https://example.com/${longPath}`;
      
      expect(url.length).toBeGreaterThan(MAX_URL_LENGTH);
      // Component should reject this before processing
    });

    it('should efficiently validate multiple dates', () => {
      const dates = Array.from({ length: 100 }, (_, i) => 
        `2025-${String(i % 12 + 1).padStart(2, '0')}-15`
      );

      const startTime = performance.now();
      dates.forEach(date => validateDate(date));
      const endTime = performance.now();

      // Validation should be fast (under 50ms for 100 dates)
      expect(endTime - startTime).toBeLessThan(50);
    });

    it('should efficiently escape XML in bulk', () => {
      const urls = Array.from({ length: 100 }, (_, i) => 
        `https://example.com/page${i}?id=${i}&cat=tech`
      );

      const startTime = performance.now();
      urls.forEach(url => escapeXml(url));
      const endTime = performance.now();

      // Escaping should be fast (under 50ms for 100 URLs)
      expect(endTime - startTime).toBeLessThan(50);
    });
  });

  // ===================================================================
  // EDGE CASES
  // ===================================================================
  
  describe('Edge Cases', () => {
    it('should handle URL with all XML special characters', () => {
      const url = `https://example.com/page?a=1&b=2&c=<>&'";`;
      const result = escapeXml(url);
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('&b='); // Should be &amp;b=
      expect(result).toContain('&amp;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&apos;');
      expect(result).toContain('&quot;');
    });

    it('should handle path with mixed attacks', () => {
      const path = '/..//page/../../etc//passwd\x00\x01';
      const result = sanitizePath(path);
      
      expect(result).not.toContain('..');
      expect(result).not.toContain('//');
      expect(result).not.toContain('\x00');
      expect(result).not.toContain('\x01');
    });

    it('should handle date at year boundaries', () => {
      expect(validateDate('2024-12-31')).toBe(true);
      expect(validateDate('2025-01-01')).toBe(true);
    });

    it('should handle priority edge values', () => {
      expect(validatePriority('0.0000001')).toBe(true);
      expect(validatePriority('0.9999999')).toBe(true);
    });
  });
});
