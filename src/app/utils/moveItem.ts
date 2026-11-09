// A copy of `list` with the item at `from` moved to index `to` (the others shift to make room). Out-of-range or
// unchanged moves return the list as it was.
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return [...list];
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
