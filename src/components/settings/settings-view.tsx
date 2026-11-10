"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Field, fieldAria } from "@/components/app/field";
import { Notice, type NoticeState } from "@/components/app/notice";
import {
  MutedText,
  PageHeader,
  PageTitle,
  Panel,
  PanelTitle,
} from "@/components/app/panel";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/client-api";

export type Profile = { name: string; email: string; teamName: string };
type Errors = Partial<Record<"name" | "teamName", string>>;

// Halaman Pengaturan: ubah nama pengguna dan nama tim, dan keluar dari akun.
export function SettingsView({ initialProfile }: { initialProfile: Profile }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialProfile);
  const [draft, setDraft] = useState({
    name: initialProfile.name,
    teamName: initialProfile.teamName,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  const dirty = draft.name !== saved.name || draft.teamName !== saved.teamName;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || pending) return;
    const name = draft.name.trim();
    const teamName = draft.teamName.trim();
    const nextErrors: Errors = {};
    if (!name) nextErrors.name = "Isi nama pengguna.";
    if (!teamName) nextErrors.teamName = "Isi nama tim.";
    setErrors(nextErrors);
    const firstInvalid = (["name", "teamName"] as const).find(
      (field) => nextErrors[field],
    );
    if (firstInvalid) {
      document.getElementById(`settings-${firstInvalid}`)?.focus();
      return;
    }

    setPending(true);
    try {
      const profile = await apiFetch<Profile>("/api/profile", {
        method: "PATCH",
        body: {
          ...(name !== saved.name && { name }),
          ...(teamName !== saved.teamName && { teamName }),
        },
      });
      setSaved(profile);
      setDraft({ name: profile.name, teamName: profile.teamName });
      setNotice({ tone: "success", message: "Profil tersimpan." });
      // Nama dan nama tim di menu samping dibaca dari server.
      router.refresh();
    } catch (error) {
      setNotice({ tone: "error", message: errorMessage(error) });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="@container/page grid max-w-[720px] gap-6">
      <div className="grid gap-4">
        <PageHeader>
          <div className="grid gap-1">
            <PageTitle>Pengaturan</PageTitle>
            <MutedText>Profil pemilik dan informasi dasar tim.</MutedText>
          </div>
        </PageHeader>
        <Notice notice={notice} onDismiss={() => setNotice(null)} />
      </div>

      <Panel aria-labelledby="settings-profile-title">
        <PanelTitle id="settings-profile-title">Profil</PanelTitle>
        <form
          noValidate
          method="post"
          onSubmit={handleSave}
          className="grid gap-4"
        >
          <Field id="settings-name" label="Nama pengguna" error={errors.name}>
            <Input
              id="settings-name"
              name="name"
              autoComplete="name"
              maxLength={100}
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              {...fieldAria("settings-name", undefined, errors.name)}
            />
          </Field>

          <Field
            id="settings-email"
            label="Email untuk masuk"
            hint="Email dipakai untuk masuk dan tidak bisa diubah dari halaman ini."
          >
            <Input
              id="settings-email"
              name="email"
              type="email"
              readOnly
              value={saved.email}
              className="bg-muted text-muted-foreground"
              {...fieldAria("settings-email", true)}
            />
          </Field>

          <Field
            id="settings-teamName"
            label="Nama tim"
            hint="Tampil di bawah nama aplikasi pada menu samping."
            error={errors.teamName}
          >
            <Input
              id="settings-teamName"
              name="teamName"
              autoComplete="organization"
              maxLength={120}
              value={draft.teamName}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  teamName: event.target.value,
                }))
              }
              {...fieldAria("settings-teamName", true, errors.teamName)}
            />
          </Field>

          <div className="flex flex-wrap items-center justify-end gap-3 pt-1">
            <MutedText id="settings-save-hint">
              {dirty
                ? "Ada perubahan yang belum disimpan."
                : "Belum ada perubahan untuk disimpan."}
            </MutedText>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={!dirty || pending}
              onClick={() => {
                setDraft({ name: saved.name, teamName: saved.teamName });
                setErrors({});
              }}
            >
              Batalkan
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={!dirty || pending}
              aria-describedby="settings-save-hint"
            >
              {pending ? "Menyimpan…" : "Simpan perubahan"}
            </Button>
          </div>
        </form>
      </Panel>

      <Panel aria-labelledby="settings-session-title">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="grid gap-1">
            <PanelTitle id="settings-session-title">Sesi</PanelTitle>
            <MutedText>
              Keluar setelah selesai bekerja supaya data tim tetap aman.
            </MutedText>
          </div>
          <SignOutButton />
        </div>
      </Panel>
    </div>
  );
}
