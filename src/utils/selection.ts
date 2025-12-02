export function mergeSelection(existing: string[], region: string[], shift: boolean, ctrlOrMeta: boolean): string[] {
  if (shift) {
    const set = new Set(existing);
    region.forEach(id => set.add(id));
    return Array.from(set);
  }
  if (ctrlOrMeta) {
    const set = new Set(existing);
    region.forEach(id => {
      if (set.has(id)) set.delete(id); else set.add(id);
    });
    return Array.from(set);
  }
  return region;
}

