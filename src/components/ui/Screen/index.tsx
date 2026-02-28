export default function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex flex-col bg-background pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-xl px-6">{children}</div>
    </main>
  );
}
