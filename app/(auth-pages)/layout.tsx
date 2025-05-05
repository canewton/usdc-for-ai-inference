'use client';

import { useSession } from '../contexts/SessionContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  session.setAi3dGenerations([]);
  session.setImageChats([]);
  session.setTextChats([]);
  session.setWalletBalance(null);
  session.setDemoLimit(0);
  session.setIsAiInferenceLoading(false);
  return (
    <div className="flex flex-col gap-12 items-center mt-20">{children}</div>
  );
}
