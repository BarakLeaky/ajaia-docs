import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <h1>Document not found</h1>
      <p className="sub">It may have been deleted, or you may not have access to it.</p>
      <Link href="/">Back to documents</Link>
    </main>
  );
}
