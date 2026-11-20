import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import {
  generateId,
  generateToken,
  isValidEmail,
  slugify,
  formatDate,
  formatRelativeTime,
  debounce,
  throttle,
  deepClone,
  isEqual,
  pick,
  omit,
  groupBy,
  sortBy,
  uniqueBy,
  clamp,
  range,
  retry,
  createSignal
} from './index';

describe('Utility functions', () => {
  describe('generateId', () => {
    it('generates unique ids', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(1000);
    });
    
    it('generates string ids', () => {
      expect(typeof generateId()).toBe('string');
      expect(generateId().length).toBeGreaterThan(0);
    });
  });
  
  describe('generateToken', () => {
    it('generates tokens of specified length', () => {
      expect(generateToken(16).length).toBe(16);
      expect(generateToken(64).length).toBe(64);
    });
    
    it('generates unique tokens', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken(32));
      }
      expect(tokens.size).toBe(100);
    });
    
    it('uses alphanumeric characters', () => {
      const token = generateToken(32);
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });
  });
  
  describe('isValidEmail', () => {
    it('validates correct emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.org')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
    });
    
    it('rejects invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@domain')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });
  
  describe('slugify', () => {
    it('converts to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });
    
    it('replaces spaces with hyphens', () => {
      expect(slugify('hello world')).toBe('hello-world');
    });
    
    it('removes special characters', () => {
      expect(slugify('Hello@World!')).toBe('helloworld');
    });
    
    it('collapses multiple hyphens', () => {
      expect(slugify('hello---world')).toBe('hello-world');
    });
    
    it('trims hyphens', () => {
      expect(slugify('-hello-')).toBe('hello');
    });
  });
  
  describe('formatDate', () => {
    it('formats date in default locale', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date);
      expect(formatted).toContain('Jan');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });
    
    it('accepts custom options', () => {
      const date = new Date('2024-01-15');
      const formatted = formatDate(date, 'en-US', { weekday: 'long' });
      expect(formatted).toContain('Monday');
    });
  });
  
  describe('formatRelativeTime', () => {
    it('formats past times', () => {
      const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const formatted = formatRelativeTime(past);
      expect(formatted).toContain('day');
    });
    
    it('formats future times', () => {
      const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const formatted = formatRelativeTime(future);
      expect(formatted).toContain('day');
    });
    
    it('formats recent times in minutes', () => {
      const recent = new Date(Date.now() - 30 * 60 * 1000);
      const formatted = formatRelativeTime(recent);
      expect(formatted).toContain('minute');
    });
  });
  
  describe('debounce', () => {
    it('delays function execution', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);
      
      debounced('a');
      debounced('b');
      debounced('c');
      
      expect(fn).not.toHaveBeenCalled();
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('c');
    });
  });
  
  describe('throttle', () => {
    it('limits function execution rate', async () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);
      
      throttled('a');
      throttled('b');
      throttled('c');
      
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      throttled('d');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith('d');
    });
  });
  
  describe('deepClone', () => {
    it('creates deep copy of objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });
    
    it('handles arrays', () => {
      const original = [1, [2, 3]];
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[1]).not.toBe(original[1]);
    });
  });
  
  describe('isEqual', () => {
    it('returns true for equal objects', () => {
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });
    
    it('returns false for different objects', () => {
      expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    });
    
    it('handles key order', () => {
      expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
    });
  });
  
  describe('pick', () => {
    it('picks specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 });
    });
    
    it('ignores missing keys', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, ['a', 'b'])).toEqual({ a: 1, b: 2 });
    });
  });
  
  describe('omit', () => {
    it('omits specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(omit(obj, ['b'])).toEqual({ a: 1, c: 3 });
    });
    
    it('ignores missing keys', () => {
      const obj = { a: 1, b: 2 };
      expect(omit(obj, ['b'])).toEqual({ a: 1 });
    });
  });
  
  describe('groupBy', () => {
    it('groups items by key', () => {
      const items = [
        { id: 1, category: 'a' },
        { id: 2, category: 'b' },
        { id: 3, category: 'a' }
      ];
      const groups = groupBy(items, item => item.category);
      
      expect(groups.get('a')).toHaveLength(2);
      expect(groups.get('b')).toHaveLength(1);
    });
  });
  
  describe('sortBy', () => {
    it('sorts ascending by default', () => {
      const items = [{ v: 3 }, { v: 1 }, { v: 2 }];
      const sorted = sortBy(items, x => x.v);
      expect(sorted.map(x => x.v)).toEqual([1, 2, 3]);
    });
    
    it('sorts descending', () => {
      const items = [{ v: 3 }, { v: 1 }, { v: 2 }];
      const sorted = sortBy(items, x => x.v, 'desc');
      expect(sorted.map(x => x.v)).toEqual([3, 2, 1]);
    });
  });
  
  describe('uniqueBy', () => {
    it('removes duplicates by key', () => {
      const items = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'a' }
      ];
      const unique = uniqueBy(items, x => x.name);
      expect(unique).toHaveLength(2);
      expect(unique.map(x => x.name)).toEqual(['a', 'b']);
    });
  });
  
  describe('clamp', () => {
    it('clamps to min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });
    
    it('clamps to max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });
    
    it('returns value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });
  });
  
  describe('range', () => {
    it('generates range', () => {
      expect(range(0, 5)).toEqual([0, 1, 2, 3, 4]);
      expect(range(2, 8, 2)).toEqual([2, 4, 6]);
    });
  });
  
  describe('retry', () => {
    it('succeeds on first try', async () => {
      const result = await retry(() => Promise.resolve('success'), { retries: 3, delay: 10 });
      expect(result).toBe('success');
    });
    
    it('retries on failure', async () => {
      let attempts = 0;
      const result = await retry(
        () => {
          attempts++;
          if (attempts < 3) throw new Error('fail');
          return Promise.resolve('success');
        },
        { retries: 3, delay: 10 }
      );
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });
    
    it('throws after max retries', async () => {
      await expect(
        retry(() => Promise.reject(new Error('fail')), { retries: 2, delay: 10 })
      ).rejects.toThrow('fail');
    });
  });
  
  describe('createSignal', () => {
    it('creates signal with initial value', () => {
      const signal = createSignal(42);
      expect(signal.get()).toBe(42);
    });
    
    it('updates value', () => {
      const signal = createSignal(0);
      signal.set(10);
      expect(signal.get()).toBe(10);
    });
    
    it('notifies subscribers', () => {
      const signal = createSignal(0);
      const subscriber = vi.fn();
      const unsubscribe = signal.subscribe(subscriber);
      
      signal.set(1);
      expect(subscriber).toHaveBeenCalledWith(1);
      
      signal.set(2);
      expect(subscriber).toHaveBeenCalledWith(2);
      
      unsubscribe();
      signal.set(3);
      expect(subscriber).toHaveBeenCalledTimes(2);
    });
    
    it('does not notify if value unchanged', () => {
      const signal = createSignal(0);
      const subscriber = vi.fn();
      signal.subscribe(subscriber);
      
      signal.set(0);
      signal.set(0);
      expect(subscriber).not.toHaveBeenCalled();
    });
  });
});