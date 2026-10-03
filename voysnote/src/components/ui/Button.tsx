import Link from "next/link";
import { cx } from "@/lib/utils";

type Variant = "ink" | "ghost" | "outline" | "ember" | "cream";

const styles: Record<Variant, string> = {
  ink: "bg-ink text-cream hover:bg-ink-2",
  ember: "bg-ember text-cream hover:brightness-95",
  outline: "border border-ink/15 text-ink hover:border-ink/40 bg-transparent",
  ghost: "text-ink hover:bg-mist",
  cream: "bg-cream text-ink hover:bg-paper",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background,transform,filter,border-color] duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";

const sizes = { sm: "h-8 px-3.5 text-[13px]", md: "h-11 px-5 text-[15px]", lg: "h-14 px-7 text-[16px]" };

type Common = { variant?: Variant; size?: keyof typeof sizes; className?: string; children: React.ReactNode };

export function Button({ variant = "ink", size = "md", className, ...rest }: Common & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cx(base, styles[variant], sizes[size], className)} {...rest} />;
}

export function ButtonLink({ variant = "ink", size = "md", className, href, ...rest }: Common & { href: string }) {
  return <Link href={href} className={cx(base, styles[variant], sizes[size], className)} {...rest} />;
}
