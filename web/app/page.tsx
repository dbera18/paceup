import StoryWall from "@/components/StoryWall";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-10 sm:pt-16">
      <header className="mb-8 text-center sm:mb-10">
        <h1 className="text-5xl font-black tracking-tight text-brand-text">PaceUp</h1>
        <p className="mt-2 text-xl font-semibold text-text">Every Step Has a Purpose.</p>
      </header>
      <StoryWall />
    </main>
  );
}
