export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="text-sm uppercase tracking-[0.4em] text-emerald-300">
          Eventix
        </p>
        <h1 className="mt-6 text-4xl font-semibold leading-tight md:text-6xl">
          Book events that feel alive.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-neutral-300">
          Day-one scaffolding is ready. Next up: auth, events, and ticket types.
        </p>
      </section>
    </main>
  );
}
