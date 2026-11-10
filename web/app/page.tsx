import StoryWall from "@/components/StoryWall";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-stone-900">PaceUp</h1>
        <p className="mt-2 text-lg text-emerald-700">Every Step Has a Purpose.</p>
      </header>
      <StoryWall />
    </main>
  );
}
