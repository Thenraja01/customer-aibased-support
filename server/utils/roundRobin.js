const counters = new Map();

export const getNextIndex = (organizationId, length) => {
  if (length === 0) return -1;
  const key = organizationId.toString();
  const current = counters.get(key) || 0;
  const index = current % length;
  counters.set(key, current + 1);
  return index;
};
