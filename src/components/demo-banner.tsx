"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearDemoData } from "@/app/actions/demo";

export function DemoBanner() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleClear() {
    startTransition(async () => {
      await clearDemoData();
      router.refresh();
    });
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-amber-800">
          Estás viendo datos de ejemplo. Bórralos cuando entiendas cómo usar la
          página.
        </p>
        <button
          type="button"
          onClick={handleClear}
          disabled={pending}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {pending ? "Borrando..." : "Borrar datos de ejemplo"}
        </button>
      </div>
    </div>
  );
}
