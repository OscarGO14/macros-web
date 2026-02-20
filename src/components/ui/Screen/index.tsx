export default function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background pt-4">
      <div className="px-6">{children}</div>
    </main>
  );
}
