export default function LoadingPage() {
  return (
    <div className="page-shell" role="status" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded bg-stone-200" />
      <div className="mt-6 h-40 animate-pulse rounded-3xl bg-stone-100" />
      <span className="sr-only">လုပ်ဆောင်နေသည် / Loading</span>
    </div>
  );
}
