export default function middleware(request: Request): Response | undefined {
  const username = process.env.FOUNDRY_DEMO_USERNAME;
  const password = process.env.FOUNDRY_DEMO_PASSWORD;
  if (!username || !password) return undefined;

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const [user, pass] = atob(auth.slice("Basic ".length)).split(":");
    if (user === username && pass === password) return undefined;
  }

  return new Response("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="foundry-live-demo"' },
  });
}

export const config = {
  matcher: "/(.*)",
};
