export function shouldPushSpaPageView(
  previousRoute: string | null,
  currentRoute: string,
) {
  return previousRoute !== null && previousRoute !== currentRoute;
}
