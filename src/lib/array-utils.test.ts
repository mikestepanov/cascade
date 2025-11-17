import { describe, expect, it, vi } from "vitest";
import { arraysEqual, chunk, createToggleHandler, toggleInArray, unique } from "./array-utils";

describe("array-utils", () => {
  describe("toggleInArray", () => {
    it("should add item if not present in array", () => {
      const array = [1, 2, 3];
      const result = toggleInArray(array, 4);

      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should remove item if present in array", () => {
      const array = [1, 2, 3, 4];
      const result = toggleInArray(array, 3);

      expect(result).toEqual([1, 2, 4]);
    });

    it("should not mutate original array", () => {
      const array = [1, 2, 3];
      const original = [...array];

      toggleInArray(array, 4);

      expect(array).toEqual(original);
    });

    it("should work with string arrays", () => {
      const array = ["a", "b", "c"];
      const result1 = toggleInArray(array, "d");
      const result2 = toggleInArray(array, "b");

      expect(result1).toEqual(["a", "b", "c", "d"]);
      expect(result2).toEqual(["a", "c"]);
    });

    it("should work with object arrays", () => {
      const obj1 = { id: 1 };
      const obj2 = { id: 2 };
      const obj3 = { id: 3 };
      const array = [obj1, obj2];

      const result1 = toggleInArray(array, obj3);
      const result2 = toggleInArray(array, obj1);

      expect(result1).toEqual([obj1, obj2, obj3]);
      expect(result2).toEqual([obj2]);
    });

    it("should handle empty array", () => {
      const array: number[] = [];
      const result = toggleInArray(array, 1);

      expect(result).toEqual([1]);
    });

    it("should remove all occurrences", () => {
      const array = [1, 2, 3, 2, 4];
      const result = toggleInArray(array, 2);

      expect(result).toEqual([1, 3, 4]);
    });
  });

  describe("createToggleHandler", () => {
    it("should create a handler that toggles items in array", () => {
      const mockSetter = vi.fn();
      const handler = createToggleHandler(mockSetter);

      handler(5);

      expect(mockSetter).toHaveBeenCalledTimes(1);
      expect(mockSetter).toHaveBeenCalledWith(expect.any(Function));
    });

    it("should add item when called with new item", () => {
      let state = [1, 2, 3];
      const setter = (fn: (prev: number[]) => number[]) => {
        state = fn(state);
      };
      const handler = createToggleHandler(setter);

      handler(4);

      expect(state).toEqual([1, 2, 3, 4]);
    });

    it("should remove item when called with existing item", () => {
      let state = [1, 2, 3];
      const setter = (fn: (prev: number[]) => number[]) => {
        state = fn(state);
      };
      const handler = createToggleHandler(setter);

      handler(2);

      expect(state).toEqual([1, 3]);
    });

    it("should work with React-style state setter", () => {
      const mockSetter = vi.fn((fn) => {
        const prev = [1, 2, 3];
        return fn(prev);
      });
      const handler = createToggleHandler(mockSetter);

      handler(4);

      expect(mockSetter).toHaveBeenCalledWith(expect.any(Function));
      const updateFn = mockSetter.mock.calls[0][0];
      expect(updateFn([1, 2, 3])).toEqual([1, 2, 3, 4]);
    });
  });

  describe("unique", () => {
    it("should remove duplicate numbers", () => {
      const array = [1, 2, 2, 3, 3, 3, 4];
      const result = unique(array);

      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should remove duplicate strings", () => {
      const array = ["a", "b", "b", "c", "a"];
      const result = unique(array);

      expect(result).toEqual(["a", "b", "c"]);
    });

    it("should handle array with no duplicates", () => {
      const array = [1, 2, 3, 4];
      const result = unique(array);

      expect(result).toEqual([1, 2, 3, 4]);
    });

    it("should handle empty array", () => {
      const array: number[] = [];
      const result = unique(array);

      expect(result).toEqual([]);
    });

    it("should handle array with all same elements", () => {
      const array = [5, 5, 5, 5];
      const result = unique(array);

      expect(result).toEqual([5]);
    });

    it("should preserve order of first occurrence", () => {
      const array = [3, 1, 2, 1, 3];
      const result = unique(array);

      expect(result).toEqual([3, 1, 2]);
    });

    it("should not mutate original array", () => {
      const array = [1, 2, 2, 3];
      const original = [...array];

      unique(array);

      expect(array).toEqual(original);
    });
  });

  describe("arraysEqual", () => {
    it("should return true for identical arrays", () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];

      expect(arraysEqual(a, b)).toBe(true);
    });

    it("should return true for arrays with same elements in different order", () => {
      const a = [1, 2, 3];
      const b = [3, 1, 2];

      expect(arraysEqual(a, b)).toBe(true);
    });

    it("should return false for arrays with different elements", () => {
      const a = [1, 2, 3];
      const b = [1, 2, 4];

      expect(arraysEqual(a, b)).toBe(false);
    });

    it("should return false for arrays of different lengths", () => {
      const a = [1, 2, 3];
      const b = [1, 2];

      expect(arraysEqual(a, b)).toBe(false);
    });

    it("should return true for empty arrays", () => {
      const a: number[] = [];
      const b: number[] = [];

      expect(arraysEqual(a, b)).toBe(true);
    });

    it("should work with string arrays", () => {
      const a = ["apple", "banana", "cherry"];
      const b = ["cherry", "apple", "banana"];

      expect(arraysEqual(a, b)).toBe(true);
    });

    it("should handle arrays with duplicate elements", () => {
      const a = [1, 2, 2, 3];
      const b = [2, 1, 3, 2];

      expect(arraysEqual(a, b)).toBe(true);
    });

    it("should return false when duplicates count differs", () => {
      const a = [1, 2, 2, 3];
      const b = [1, 2, 3, 3];

      expect(arraysEqual(a, b)).toBe(false);
    });

    it("should not mutate original arrays", () => {
      const a = [3, 1, 2];
      const b = [1, 2, 3];
      const originalA = [...a];
      const originalB = [...b];

      arraysEqual(a, b);

      expect(a).toEqual(originalA);
      expect(b).toEqual(originalB);
    });
  });

  describe("chunk", () => {
    it("should split array into chunks of specified size", () => {
      const array = [1, 2, 3, 4, 5, 6];
      const result = chunk(array, 2);

      expect(result).toEqual([
        [1, 2],
        [3, 4],
        [5, 6],
      ]);
    });

    it("should handle array not evenly divisible by chunk size", () => {
      const array = [1, 2, 3, 4, 5];
      const result = chunk(array, 2);

      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });

    it("should handle chunk size larger than array", () => {
      const array = [1, 2, 3];
      const result = chunk(array, 5);

      expect(result).toEqual([[1, 2, 3]]);
    });

    it("should handle chunk size of 1", () => {
      const array = [1, 2, 3];
      const result = chunk(array, 1);

      expect(result).toEqual([[1], [2], [3]]);
    });

    it("should handle empty array", () => {
      const array: number[] = [];
      const result = chunk(array, 2);

      expect(result).toEqual([]);
    });

    it("should work with string arrays", () => {
      const array = ["a", "b", "c", "d", "e"];
      const result = chunk(array, 2);

      expect(result).toEqual([["a", "b"], ["c", "d"], ["e"]]);
    });

    it("should not mutate original array", () => {
      const array = [1, 2, 3, 4];
      const original = [...array];

      chunk(array, 2);

      expect(array).toEqual(original);
    });

    it("should handle chunk size equal to array length", () => {
      const array = [1, 2, 3, 4];
      const result = chunk(array, 4);

      expect(result).toEqual([[1, 2, 3, 4]]);
    });

    it("should work with large chunk sizes", () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const result = chunk(array, 3);

      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9], [10]]);
    });
  });
});
