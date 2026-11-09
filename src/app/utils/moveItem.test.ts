import { describe, it, expect } from 'vitest';
import { moveItem } from './moveItem';

describe('moveItem', () => {
  it('moves an item later and earlier, shifting the rest', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
  it('leaves the list alone for no move or an out-of-range one, and never changes the original', () => {
    const list = ['a', 'b', 'c'];
    expect(moveItem(list, 1, 1)).toEqual(list);
    expect(moveItem(list, 0, 5)).toEqual(list);
    expect(moveItem(list, -1, 1)).toEqual(list);
    expect(moveItem(list, 0, 2)).not.toBe(list);
    expect(list).toEqual(['a', 'b', 'c']);
  });
});
