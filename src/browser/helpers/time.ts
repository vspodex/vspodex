export function addZero(value: number, digits = 2): string {
  return `${value}`.padStart(digits, "0");
}

export function formatTime(value: number, withSeconds = true): string {
  const hours = Math.trunc(value / 3600000);
  const minutes = Math.trunc(value / 60000) % 60;
  const seconds = Math.trunc(value / 1000) % 60;

  if (withSeconds) {
    if (hours > 0) {
      return `${hours}:${addZero(minutes)}:${addZero(seconds)}`;
    }

    return `${minutes}:${addZero(seconds)}`;
  }

  return `${hours}:${addZero(minutes)}`;
}
