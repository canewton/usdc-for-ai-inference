import { AuthContainer } from './auth-container';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthContainer>
      <div className="flex flex-col gap-12 items-center mt-20">{children}</div>
    </AuthContainer>
  );
}
