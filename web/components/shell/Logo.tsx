import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="group inline-flex items-baseline rounded-lg font-serif text-[1.65rem] font-semibold tracking-tight text-text">
      PaceUp
      <span aria-hidden className="ml-0.5 inline-block size-2 rounded-full bg-accent transition-transform duration-300 group-hover:scale-125" />
    </Link>
  );
}
