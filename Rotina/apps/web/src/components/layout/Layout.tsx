import { Outlet } from 'react-router-dom';
export function Layout() {
  return (
    <div className="min-h-screen bg-bg-deep text-fg font-sans">
      <Outlet />
    </div>
  );
}
