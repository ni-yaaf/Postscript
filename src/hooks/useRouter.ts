import { useCallback, useEffect, useState } from 'react';

export type AppRoute =
  | { name: 'desk-home' }
  | { name: 'desk-new' }
  | { name: 'desk-edit'; id: string }
  | { name: 'desk-archive' }
  | { name: 'desk-letter'; id: string }
  | { name: 'desk-passages' }
  | { name: 'desk-settings' }
  | { name: 'desk-preview' }
  | { name: 'reading-room' }
  | { name: 'public-letter'; slug: string };

function getBasePrefix(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function isPublicGitHubPagesRoot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.github.io');
}

export function parseRouteFromLocation(): AppRoute {
  const basePrefix = getBasePrefix();
  let path = window.location.pathname;
  if (basePrefix && path.startsWith(basePrefix)) {
    path = path.slice(basePrefix.length) || '/';
  }

  // Support hash routes like #/desk or #/letters/slug for static bookmarking
  const hash = window.location.hash;
  if (hash && hash.startsWith('#/')) {
    path = hash.slice(1);
  }

  const normalized = path.replace(/\/+$/, '') || '/';

  if (normalized.startsWith('/letters/')) {
    const slug = decodeURIComponent(normalized.slice('/letters/'.length));
    if (slug) return { name: 'public-letter', slug };
  }
  if (normalized === '/reading-room') {
    return { name: 'reading-room' };
  }
  if (normalized === '/preview') {
    return { name: 'desk-preview' };
  }
  if (normalized === '/desk/new') {
    return { name: 'desk-new' };
  }
  if (normalized.startsWith('/desk/edit/')) {
    const id = decodeURIComponent(normalized.slice('/desk/edit/'.length));
    if (id) return { name: 'desk-edit', id };
  }
  if (normalized === '/desk/archive') {
    return { name: 'desk-archive' };
  }
  if (normalized.startsWith('/desk/letter/')) {
    const id = decodeURIComponent(normalized.slice('/desk/letter/'.length));
    if (id) return { name: 'desk-letter', id };
  }
  if (normalized === '/desk/passages') {
    return { name: 'desk-passages' };
  }
  if (normalized === '/desk/settings') {
    return { name: 'desk-settings' };
  }
  if (normalized === '/desk' || normalized === '/desk/home') {
    return { name: 'desk-home' };
  }

  if (normalized === '/') {
    return isPublicGitHubPagesRoot()
      ? { name: 'reading-room' }
      : { name: 'desk-home' };
  }

  return isPublicGitHubPagesRoot()
    ? { name: 'reading-room' }
    : { name: 'desk-home' };
}

export function routeToPath(route: AppRoute): string {
  const basePrefix = getBasePrefix();
  let sub = '/';
  switch (route.name) {
    case 'desk-home':
      sub = '/desk';
      break;
    case 'desk-new':
      sub = '/desk/new';
      break;
    case 'desk-edit':
      sub = `/desk/edit/${encodeURIComponent(route.id)}`;
      break;
    case 'desk-archive':
      sub = '/desk/archive';
      break;
    case 'desk-letter':
      sub = `/desk/letter/${encodeURIComponent(route.id)}`;
      break;
    case 'desk-passages':
      sub = '/desk/passages';
      break;
    case 'desk-settings':
      sub = '/desk/settings';
      break;
    case 'desk-preview':
      sub = '/preview';
      break;
    case 'reading-room':
      sub = '/reading-room';
      break;
    case 'public-letter':
      sub = `/letters/${encodeURIComponent(route.slug)}/`;
      break;
  }
  return `${basePrefix}${sub}`;
}

export function useRouter() {
  const [route, setRoute] = useState<AppRoute>(() => parseRouteFromLocation());

  useEffect(() => {
    const handleChange = () => {
      setRoute(parseRouteFromLocation());
    };
    window.addEventListener('popstate', handleChange);
    window.addEventListener('hashchange', handleChange);
    return () => {
      window.removeEventListener('popstate', handleChange);
      window.removeEventListener('hashchange', handleChange);
    };
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    const nextUrl = routeToPath(nextRoute);
    if (window.location.pathname !== nextUrl || window.location.hash) {
      window.history.pushState(null, '', nextUrl);
    }
    setRoute(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { route, navigate };
}
