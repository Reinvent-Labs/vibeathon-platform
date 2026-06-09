import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  light?: boolean;
  size?: number;
  className?: string;
};

/** Official VIBEATHON wordmark with an accessible home link. */
export function Logo({
  href = "/",
  light = true,
  size = 144,
  className = "",
}: LogoProps) {
  return (
    <Link href={href} className={`inline-flex min-h-0 items-center ${className}`}>
      <Image
        src={light ? "/logo-white.png" : "/logo-color.png"}
        alt="VIBEATHON 2026"
        width={size}
        height={Math.round(size * 0.35)}
        priority
        style={{ width: size, height: "auto" }}
      />
    </Link>
  );
}
