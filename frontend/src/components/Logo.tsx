import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5">
      <Image
        src="/logo.svg"
        alt=""
        width={28}
        height={28}
        priority
        aria-hidden
        className="transition group-hover:scale-105"
      />
      <span className="text-lg font-semibold tracking-tight text-foreground">
        Watchify
      </span>
    </Link>
  );
}
