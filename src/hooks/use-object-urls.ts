import { useRef, useEffect } from 'react';
import { validateImageFile, createSafeObjectUrl, enforceMaxDimensions, MAX_IMAGE_DIMENSION } from '@/lib/security';
import { notify } from '@/lib/notify';

interface CreateOptions {
  downscaleLarge?: boolean;
  maxDimension?: number;
  /** Skip validation (not recommended) */
  skipValidation?: boolean;
}

/**
 * Hook to manage a set of object URLs with automatic cleanup on unmount.
 * Provides helpers to create validated image object URLs with optional downscaling.
 */
export function useObjectUrls() {
  const urlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const snapshot = new Set(urlsRef.current);
    return () => {
      snapshot.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch (err) { /* non-fatal */ }
      });
    };
  }, []);

  const revoke = (url: string | null | undefined) => {
    if (!url || !url.startsWith('blob:')) return;
    if (urlsRef.current.has(url)) {
      try { URL.revokeObjectURL(url); } catch (err) { /* ignore */ }
      urlsRef.current.delete(url);
    }
  };

  const createImageUrl = async (file: File, opts: CreateOptions = {}): Promise<string | null> => {
    if (!opts.skipValidation) {
      const err = validateImageFile(file);
      if (err) {
        notify.error(err);
        return null;
      }
    }
    const baseUrl = createSafeObjectUrl(file);
    if (!baseUrl) {
      notify.error('Failed to create preview URL');
      return null;
    }
    let finalUrl = baseUrl;
    if (opts.downscaleLarge) {
      finalUrl = await enforceMaxDimensions(baseUrl, opts.maxDimension || MAX_IMAGE_DIMENSION);
      if (finalUrl !== baseUrl) {
        // Replace URL if a new URL was generated
        urlsRef.current.add(finalUrl);
        // Revoke the original URL since we don't use it anymore
        revoke(baseUrl);
      }
    }
    urlsRef.current.add(finalUrl);
    return finalUrl;
  };

  return {
    createImageUrl,
    revoke,
    /** List of current tracked URLs (read-only) */
    list: () => Array.from(urlsRef.current),
  };
}
