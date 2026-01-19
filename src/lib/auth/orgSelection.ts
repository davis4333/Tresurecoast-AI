import { cookies } from "next/headers";

const COOKIE_NAME = "tca_selected_org";
const HEADER_NAME = "x-org-public-id";
const MAX_AGE_DAYS = 30;
const MAX_AGE_SECONDS = MAX_AGE_DAYS * 24 * 60 * 60;

export function getSelectedOrgPublicId(request?: Request): string | null {
  if (request) {
    const headerValue = request.headers.get(HEADER_NAME);
    if (headerValue && headerValue.trim()) {
      return headerValue.trim();
    }
  }

  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (cookie?.value && cookie.value.trim()) {
      return cookie.value.trim();
    }
  } catch {
  }

  return null;
}

export function setSelectedOrgPublicId(publicId: string): void {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, publicId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSelectedOrgPublicId(): void {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME, HEADER_NAME };
