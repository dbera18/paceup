import { ReactNode } from "react";
import CreateSheet from "@/components/create/CreateSheet";
import AppProvider from "./AppProvider";
import BottomNav from "./BottomNav";
import Toast from "./Toast";
import TopBar from "./TopBar";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <TopBar />
      {/* extra bottom padding on phones so the bottom bar never covers content */}
      <div className="flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-16">{children}</div>
      <BottomNav />
      <CreateSheet />
      <Toast />
    </AppProvider>
  );
}
