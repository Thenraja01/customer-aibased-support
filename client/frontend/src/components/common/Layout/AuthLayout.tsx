import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            SupportAI
          </h1>
          <p className="text-muted-foreground mt-2">AI-Powered Customer Support</p>
        </div>
        <div className="bg-card rounded-xl shadow-sm border p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
