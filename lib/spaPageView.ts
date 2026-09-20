export function shouldPushSpaPageView(
  previousPath: string | null,
  currentPath: string,
) {
  return previousPath !== null && previousPath !== currentPath;
}
