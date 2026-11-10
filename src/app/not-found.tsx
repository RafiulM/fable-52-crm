import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto grid max-w-lg gap-4 px-6 py-24">
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="text-[25px] leading-[1.2] font-medium">
        Halaman ini tidak ada
      </h1>
      <p className="text-muted-foreground">
        Alamatnya mungkin salah ketik, atau halamannya sudah dipindahkan.
      </p>
      <div>
        <Button asChild size="lg">
          <Link href="/">Kembali ke dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
