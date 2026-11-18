import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { sessionStore, useDevSession } from '@/lib/session';
import { Landing } from '@/pages/Landing';
import { DevAccess } from '@/pages/DevAccess';
import { DevLayout } from '@/pages/DevLayout';
import { DevHome } from '@/pages/DevHome';
import { Playground } from '@/pages/Playground';
import { DocsPage } from '@/pages/Docs';
import { Logo, ButtonLink } from '@/components/ui';

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => { if (!hash) window.scrollTo(0, 0); else document.getElementById(hash.slice(1))?.scrollIntoView(); }, [pathname, hash]);
  return null;
}

/** Cierra la sesión cuando el token vence. */
function ExpireWatch() {
  const s = useDevSession();
  useEffect(() => {
    if (!s) return;
    const t = setTimeout(() => sessionStore.clear(), Math.max(0, s.expiresAt - Date.now()));
    return () => clearTimeout(t);
  }, [s]);
  return null;
}

function Protected({ children }: { children: (s: NonNullable<ReturnType<typeof useDevSession>>) => React.ReactNode }) {
  const s = useDevSession();
  return s ? <>{children(s)}</> : <Navigate to="/acceso?tipo=dev" replace />;
}

function NotFound() {
  return (
    <main id="contenido" className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <Logo symbol height={48} /><h1 className="t-h2 m-0">No encontramos esa página</h1><ButtonLink to="/">Volver al inicio</ButtonLink>
    </main>
  );
}

export function App() {
  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:bg-layer-01 focus:p-3">Saltar al contenido</a>
      <ScrollTop /><ExpireWatch />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/acceso" element={<DevAccess />} />
        <Route path="/dev" element={<DevLayout />}>
          <Route index element={<Protected>{(s) => <DevHome s={s} />}</Protected>} />
          <Route path="probar" element={<Protected>{(s) => <Playground s={s} />}</Protected>} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="docs/:id" element={<DocsPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
