"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { apiClient } from "@/lib/api";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function Dashboard({
  user,
}: {
  user: CurrentUser;
}) {
  const router = useRouter();
  const [savedUser, setSavedUser] = useState<CurrentUser>(user);
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const hasProfileChanges = useMemo(() => {
    const nameChanged = (name ?? "") !== (savedUser.name ?? "");
    const emailChanged = (email ?? "") !== (savedUser.email ?? "");
    const passwordChanged = newPassword.length > 0;
    return nameChanged || emailChanged || passwordChanged;
  }, [email, name, newPassword.length, savedUser.email, savedUser.name]);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError("New password and confirmation do not match.");
      return;
    }

    const payload: { email?: string; name?: string; password?: string } = {};
    if ((name ?? "") !== (savedUser.name ?? "")) payload.name = name;
    if ((email ?? "") !== (savedUser.email ?? "")) payload.email = email;
    if (newPassword) payload.password = newPassword;

    if (Object.keys(payload).length === 0) {
      setProfileError("No changes to save.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await apiClient.updateCurrentUser(payload);
      setSavedUser(updated);
      setName(updated.name ?? "");
      setEmail(updated.email ?? "");
      setNewPassword("");
      setConfirmPassword("");
      setProfileSuccess("Profile updated.");
      router.refresh();
    } catch (err) {
      const message =
        typeof (err as { message?: unknown })?.message === "string"
          ? (err as { message: string }).message
          : "Failed to update profile.";
      setProfileError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteDialog = () => {
    setDeleteError("");
    setDeleteConfirmText("");
    setIsDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    if (isDeleting) return;
    setIsDeleteOpen(false);
  };

  const canConfirmDelete = deleteConfirmText.trim() === savedUser.email;

  const handleDeleteAccount = async () => {
    setDeleteError("");
    setIsDeleting(true);

    try {
      await apiClient.deleteCurrentUser();
    } catch (err) {
      const message =
        typeof (err as { message?: unknown })?.message === "string"
          ? (err as { message: string }).message
          : "Failed to delete account.";
      setDeleteError(message);
      setIsDeleting(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Auth Project
              </h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Profile
            </h2>

            <div className="border-t border-gray-200 pt-4">
              <form className="space-y-6" onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name
                    </label>
                    <input
                      id="profile-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      id="profile-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Email address"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      New password
                    </label>
                    <input
                      id="profile-password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Leave blank to keep current password"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 8 characters and include uppercase, lowercase, and a number.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="profile-password-confirm"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Confirm new password
                    </label>
                    <input
                      id="profile-password-confirm"
                      name="passwordConfirm"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Re-enter new password"
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm font-medium text-red-800">
                      {profileError}
                    </div>
                  </div>
                )}

                {profileSuccess && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="text-sm font-medium text-green-800">
                      {profileSuccess}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSaving || !hasProfileChanges}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      setProfileError("");
                      setProfileSuccess("");
                      setName(savedUser.name ?? "");
                      setEmail(savedUser.email ?? "");
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
            <div className="border-t border-gray-200 pt-4">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{savedUser.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{savedUser.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">
                    {savedUser.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <a
                href="http://localhost:3000/api/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all"
              >
                <h4 className="font-medium text-gray-900">API Documentation</h4>
                <p className="mt-1 text-sm text-gray-500">View Swagger docs</p>
              </a>
              <div className="block p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900">
                  Session Management
                </h4>
                <p className="mt-1 text-sm text-gray-500">Coming soon...</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white shadow rounded-lg p-6 border border-red-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Danger zone
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Deleting your account is permanent and cannot be undone.
            </p>
            <button
              onClick={openDeleteDialog}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete account
            </button>
          </div>
        </div>
      </main>

      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteDialog}
          />
          <div className="relative w-full max-w-lg rounded-lg bg-white shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900">
              Delete account
            </h4>
            <p className="mt-2 text-sm text-gray-700">
              This will permanently delete your account and sign you out. To
              confirm, type your email:
            </p>
            <p className="mt-1 text-sm font-mono text-gray-900">
              {savedUser.email}
            </p>

            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={isDeleting}
              className="mt-4 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              placeholder="Type your email to confirm"
            />

            {deleteError && (
              <div className="mt-4 rounded-md bg-red-50 p-4">
                <div className="text-sm font-medium text-red-800">
                  {deleteError}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteDialog}
                disabled={isDeleting}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || !canConfirmDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
