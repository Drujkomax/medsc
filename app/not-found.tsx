import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-heading text-6xl font-bold text-msc-primary">404</p>
      <h1 className="text-xl font-semibold text-foreground">Страница не найдена</h1>
      <p className="max-w-md text-muted-foreground">
        Возможно, ссылка устарела или страница была перемещена.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-msc-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-msc-accent/90"
      >
        На главную
      </Link>
    </div>
  );
}
