import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function SiteFooter() {
  const t = await getTranslations("layout.footer");
  return (
    <footer className="mt-10 border-t border-neutral-100 px-4 py-8 text-xs text-neutral-400 sm:px-6 md:px-8 dark:border-neutral-800 dark:text-neutral-500">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <p className="text-neutral-500 dark:text-neutral-400">{t("tagline")}</p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>MADE BY. GGOZIL</span>
          <span aria-hidden>·</span>
          <a
            href="https://pomowriter.oopy.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-600 hover:underline dark:hover:text-neutral-300"
          >
            {t("writingApp")}
          </a>
          <span aria-hidden>·</span>
          <Link
            href="/feedback"
            className="hover:text-neutral-600 hover:underline dark:hover:text-neutral-300"
          >
            {t("feedback")}
          </Link>
        </div>
        <p className="text-neutral-300 dark:text-neutral-600">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
