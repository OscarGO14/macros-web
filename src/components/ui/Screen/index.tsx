export default function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background pt-4 pb-20">
      <div className="mx-auto w-full max-w-xl px-6">{children}</div>
    </main>
  );
}
