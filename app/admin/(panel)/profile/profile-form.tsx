"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfile, changePassword } from "./actions";

export function ProfileForm({
  initialName,
  email,
  role,
  lastLoginAt,
}: {
  initialName: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
}) {
  const router = useRouter();
  const [profilePending, setProfilePending] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [passwordPending, setPasswordPending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  async function handleProfileSubmit(formData: FormData) {
    setProfilePending(true);
    setProfileError(null);
    setProfileSaved(false);
    try {
      await updateProfile(formData);
      setProfileSaved(true);
      router.refresh();
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setProfilePending(false);
    }
  }

  async function handlePasswordSubmit(formData: FormData) {
    setPasswordPending(true);
    setPasswordError(null);
    setPasswordSaved(false);
    try {
      await changePassword(formData);
      setPasswordSaved(true);
      (document.getElementById("change-password-form") as HTMLFormElement)?.reset();
    } catch (e) {
      setPasswordError(e instanceof Error ? e.message : "Failed to change password");
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleProfileSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-name">Name</Label>
              <Input id="profile-name" name="name" required defaultValue={initialName} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={email} disabled />
              <p className="text-xs text-muted-foreground">Email is your login and can&apos;t be changed here.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <p>Role: <span className="font-medium text-foreground">{role}</span></p>
              <p>Last login: <span className="font-medium text-foreground">{lastLoginAt ?? "—"}</span></p>
            </div>
            {profileError && <p className="text-sm text-red-600">{profileError}</p>}
            {profileSaved && !profileError && <p className="text-sm text-emerald-600">Profile updated.</p>}
            <Button type="submit" disabled={profilePending} className="w-fit">
              {profilePending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="change-password-form" action={handlePasswordSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input id="current-password" name="currentPassword" type="password" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input id="new-password" name="newPassword" type="password" required minLength={8} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input id="confirm-password" name="confirmPassword" type="password" required minLength={8} />
            </div>
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            {passwordSaved && !passwordError && <p className="text-sm text-emerald-600">Password changed.</p>}
            <Button type="submit" disabled={passwordPending} className="w-fit">
              {passwordPending ? "Saving…" : "Change password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
