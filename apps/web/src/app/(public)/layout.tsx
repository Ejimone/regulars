import Link from "next/link";

/**
 * Chrome for pages a customer of the business sees — not the operator. It
 * deliberately carries no links back into the workspace.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1">{children}</main>
      <footer className="border-t border-hairline">
        <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 py-6">
          <p className="text-xs text-muted-foreground">
            Answered with{" "}
            <Link
              href="/"
              className="underline-offset-4 transition-colors duration-150 ease-ui hover:text-foreground hover:underline"
            >
              Regulars
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
