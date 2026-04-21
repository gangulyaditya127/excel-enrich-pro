import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

const AppLayout = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background bg-gradient-mesh">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/60 glass sticky top-0 z-20 px-2">
            <SidebarTrigger className="ml-1" />
            <div className="ml-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <h1 className="text-sm font-semibold tracking-tight">
                Excel Processing <span className="text-gradient-primary">System</span>
              </h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;