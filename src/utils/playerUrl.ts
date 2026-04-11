export function getDefaultPlayerUrl(): string {
  if (typeof window === "undefined") {
    return "https://manse-murhana.github.io/Camu-Box/#/player";
  }

  const appUrl = new URL(import.meta.env.BASE_URL, window.location.origin);
  appUrl.hash = "/player";
  return appUrl.toString();
}