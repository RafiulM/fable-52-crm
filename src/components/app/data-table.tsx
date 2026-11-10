import { cn } from "cn";

// Tabel data yang tetap terbaca di layar sempit. Di panel lebar tampil sebagai
// tabel biasa; saat panel menyempit (<= 640px) tiap baris menjadi kartu dua
// kolom dan nama kolom muncul di atas nilainya (dari prop `label`).
// Harus berada di dalam <Panel>, karena lebarnya diukur dari panel.

export function DataTable({
  className,
  ...props
}: React.ComponentProps<"table">) {
  return (
    <table
      className={cn(
        "block w-full border-collapse @min-[641px]/panel:table",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="hidden @min-[641px]/panel:table-header-group">
      <tr>{children}</tr>
    </thead>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return (
    <tbody className="block @min-[641px]/panel:table-row-group">{children}</tbody>
  );
}

export function Tr({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-3 border-t py-4 @min-[641px]/panel:table-row @min-[641px]/panel:border-0 @min-[641px]/panel:py-0",
        className,
      )}
      {...props}
    />
  );
}

export function Th({
  end,
  children,
}: {
  end?: boolean;
  children: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "pr-4 pb-2 text-left text-xs leading-[1.33] font-semibold tracking-[0.01em] whitespace-nowrap text-muted-foreground last:pr-0",
        end && "text-right",
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  label,
  end,
  full,
  mono,
  muted,
  nowrap,
  className,
  children,
}: {
  // Nama kolom, ditampilkan di atas nilai saat baris menjadi kartu.
  label: string;
  end?: boolean;
  // Mengambil satu baris penuh saat menjadi kartu.
  full?: boolean;
  mono?: boolean;
  muted?: boolean;
  nowrap?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <td
      data-label={label}
      className={cn(
        "block min-w-0 before:mb-1 before:block before:font-sans before:text-xs before:leading-[1.33] before:font-semibold before:text-muted-foreground before:content-[attr(data-label)] @min-[641px]/panel:table-cell @min-[641px]/panel:border-t @min-[641px]/panel:py-3 @min-[641px]/panel:pr-4 @min-[641px]/panel:align-middle @min-[641px]/panel:before:hidden @min-[641px]/panel:last:pr-0",
        full && "col-span-2",
        end && "@min-[641px]/panel:text-right",
        nowrap && "@min-[641px]/panel:whitespace-nowrap",
        mono && "font-mono",
        muted && "text-muted-foreground",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <p className="border-t pt-6 pb-2 text-muted-foreground">{children}</p>
  );
}
