// Skala sumbu-Y yang rapi: langkah 1/2/2,5/5/10 × 10^n dan 2–4 ruas,
// supaya label sumbunya bulat (mis. 0, 5, 10, 15, 20 jt).
export function chartScale(value: number) {
  const safe = Math.max(value, 1);
  const rough = safe / 4;
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const unit = rough / power;
  const step =
    (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) *
    power;
  const count = Math.max(1, Math.ceil(safe / step));
  return { max: step * count, step, count };
}

// Garis sumbu dari atas ke bawah, dengan posisi dalam persen tinggi grafik.
export function chartTicks(scale: ReturnType<typeof chartScale>) {
  return Array.from({ length: scale.count + 1 }, (_, index) => ({
    value: scale.max - index * scale.step,
    top: (index / scale.count) * 100,
  }));
}
