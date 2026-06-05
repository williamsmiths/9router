"use client";

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/utils/cn";
import { APP_CONFIG, UPDATER_CONFIG } from "@/shared/constants/config";
import { MEDIA_PROVIDER_KINDS } from "@/shared/constants/providers";
import { useCopyToClipboard } from "@/shared/hooks/useCopyToClipboard";
import Button from "./Button";
import { ConfirmModal } from "./Modal";

// const VISIBLE_MEDIA_KINDS = ["embedding", "image", "imageToText", "tts", "stt", "webSearch", "webFetch", "video", "music"];
const VISIBLE_MEDIA_KINDS = ["embedding", "image", "tts", "stt"];
// Combined entry: webSearch + webFetch share one page at /dashboard/media-providers/web
const COMBINED_WEB_ITEM = { id: "web", label: "Web Fetch & Search", icon: "travel_explore", href: "/dashboard/media-providers/web" };

const navItems = [
  { href: "/dashboard/quota", label: "Quota Tracker", icon: "data_usage", desc: "Track API quota limits" },
  { href: "/dashboard/providers", label: "Providers", icon: "dns", desc: "Manage AI provider connections" },
  { href: "/dashboard/combos", label: "Combos", icon: "layers", desc: "Model combos with fallback" },
  { href: "/dashboard/usage", label: "Usage", icon: "bar_chart", desc: "Usage & analytics" },
];

const debugItems = [
  { href: "/dashboard/endpoint", label: "Endpoint", icon: "api", desc: "API endpoint configuration" },
  { href: "/dashboard/console-log", label: "Console Log", icon: "terminal", desc: "Live server console output" },
];

const settingsItem = { href: "/dashboard/profile", label: "Settings", icon: "settings", desc: "Manage your preferences" };

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const [mediaOpen, setMediaOpen] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isDisconnected, setIsDisconnected] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shutdownCountdown, setShutdownCountdown] = useState(0);
  const { copied, copy } = useCopyToClipboard(2000);

  const INSTALL_CMD = UPDATER_CONFIG.installCmdLatest;

  // Lazy check for new npm version on mount
  useEffect(() => {
    fetch("/api/version")
      .then(res => res.json())
      .then(data => { if (data.hasUpdate) setUpdateInfo(data); })
      .catch(() => {});
  }, []);

  const isActive = (href) => {
    if (href === "/dashboard/quota") {
      return pathname === "/dashboard" || pathname.startsWith("/dashboard/quota");
    }
    return pathname.startsWith(href);
  };

  // Open manual update panel (no countdown yet — user must click Copy to trigger shutdown)
  const handleUpdate = () => {
    setShowUpdateModal(false);
    setIsUpdating(true);
  };

  // Triggered by Copy button inside ManualUpdatePanel: copy + countdown + shutdown
  const handleCopyAndShutdown = async () => {
    try { await navigator.clipboard.writeText(INSTALL_CMD); } catch { /* clipboard blocked */ }
    copy(INSTALL_CMD);
    let remaining = UPDATER_CONFIG.shutdownCountdownSec;
    setShutdownCountdown(remaining);
    const timer = setInterval(() => {
      remaining -= 1;
      setShutdownCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        fetch("/api/version/shutdown", { method: "POST" }).catch(() => {});
        setIsDisconnected(true);
      }
    }, 1000);
  };

  const handleCancelUpdate = () => {
    setIsUpdating(false);
    setShutdownCountdown(0);
  };

  // Note: legacy updater poll removed. New flow: copy install cmd + shutdown server,
  // user runs the command manually in another terminal.


  const handleShutdown = async () => {
    setIsShuttingDown(true);
    try {
      await fetch("/api/version/shutdown", { method: "POST" });
    } catch (e) {
      // Expected to fail as server shuts down; ignore error
    }
    setIsShuttingDown(false);
    setShowShutdownModal(false);
    setIsDisconnected(true);
  };

  // Filter nav items by search query (label / description match)
  const q = navQuery.trim().toLowerCase();
  const matches = (item) =>
    !q ||
    item.label.toLowerCase().includes(q) ||
    (item.desc && item.desc.toLowerCase().includes(q));

  const filteredNav = navItems.filter(matches);
  const filteredDebug = debugItems.filter(matches);
  const filteredSettings = matches(settingsItem);
  const mediaSubItems = [
    ...MEDIA_PROVIDER_KINDS.filter((k) => VISIBLE_MEDIA_KINDS.includes(k.id)),
    COMBINED_WEB_ITEM,
  ];
  const filteredMediaSubs = mediaSubItems.filter(
    (k) => !q || k.label.toLowerCase().includes(q)
  );
  const mediaMatches = !q || q.includes("media") || filteredMediaSubs.length > 0;
  const showSystemSection =
    filteredDebug.length > 0 || filteredSettings || mediaMatches;
  const noResults =
    q && filteredNav.length === 0 && !showSystemSection;

  return (
    <>
      <aside className="flex w-[17.5rem] flex-col border-r border-border-subtle bg-vibrancy backdrop-blur-xl transition-colors duration-300 min-h-full">
        {/* Logo */}
        <div className="px-5 pt-6 pb-4 flex flex-col gap-3">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-[var(--shadow-warm)] ring-1 ring-brand-500/20">
              <span className="material-symbols-outlined text-white text-[22px]">hub</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-[15px] font-semibold tracking-tight text-text-main truncate group-hover:text-primary transition-colors">
                {APP_CONFIG.name}
              </h1>
              <span className="text-[11px] text-text-muted font-medium">v{APP_CONFIG.version}</span>
            </div>
          </Link>
          {updateInfo && (
            <div className="flex flex-col gap-2 rounded-xl border border-brand-500/20 bg-brand-500/5 p-3">
              <span className="text-xs font-medium text-brand-700 dark:text-brand-300">
                Update available · v{updateInfo.latestVersion}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  className="shrink-0 px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-400 text-white text-[11px] font-semibold transition-colors"
                >
                  Update
                </button>
                <button
                  type="button"
                  onClick={() => copy(INSTALL_CMD)}
                  title="Copy install command"
                  className="flex-1 min-w-0 text-left rounded-lg px-2 py-1 hover:bg-brand-500/10 transition-colors"
                >
                  <code className="block text-[10px] text-brand-700/90 dark:text-brand-300/90 font-mono truncate">
                    {copied ? "Copied" : INSTALL_CMD}
                  </code>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick search to filter menu */}
        <div className="px-4 pb-2">
          <div className="relative">
            <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-text-muted">
              search
            </span>
            <input
              type="text"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
              placeholder="Search menu…"
              aria-label="Search menu"
              className="h-9 w-full rounded-lg border border-border-subtle bg-surface-2/60 pl-8 pr-7 text-[13px] text-text-main placeholder:text-text-muted/70 transition-colors focus:border-primary/40 focus:bg-surface focus:outline-none"
            />
            {navQuery && (
              <button
                type="button"
                onClick={() => setNavQuery("")}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-text-muted hover:text-text-main"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto custom-scrollbar">
          {filteredNav.length > 0 && (
            <p className="px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-text-muted/70">
              Core
            </p>
          )}
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              title={item.desc}
              className={cn(
                "nav-link group",
                isActive(item.href) ? "nav-link-active" : "text-text-muted hover:bg-surface-2 hover:text-text-main"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[18px]",
                  isActive(item.href) ? "fill-1" : "group-hover:text-primary transition-colors"
                )}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}

          {noResults && (
            <div className="px-3 py-6 text-center text-[12px] text-text-muted">
              No menu items match “{navQuery}”.
            </div>
          )}

          {/* System section */}
          {showSystemSection && (
          <div className="pt-4 mt-3 border-t border-border-subtle space-y-0.5">
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-text-muted/70 uppercase tracking-[0.14em]">
              System
            </p>

            {/* Media Providers accordion */}
            {mediaMatches && (
            <button
              type="button"
              onClick={() => setMediaOpen((v) => !v)}
              className={cn(
                "nav-link w-full",
                pathname.startsWith("/dashboard/media-providers")
                  ? "nav-link-active"
                  : "text-text-muted hover:bg-surface-2 hover:text-text-main"
              )}
            >
              <span className="material-symbols-outlined text-[18px]">perm_media</span>
              <span className="flex-1 text-left">Media Providers</span>
              <span
                className={cn(
                  "material-symbols-outlined text-[16px] text-text-muted transition-transform duration-200",
                  (mediaOpen || q) && "rotate-180"
                )}
              >
                expand_more
              </span>
            </button>
            )}
            {mediaMatches && (mediaOpen || q) && (
              <div className="ml-3 pl-3 border-l border-border-subtle space-y-0.5 my-1">
                {filteredMediaSubs.map((kind) => (
                  <Link
                    key={kind.id}
                    href={kind.href || `/dashboard/media-providers/${kind.id}`}
                    onClick={onClose}
                    className={cn(
                      "nav-link py-1.5 text-[12px]",
                      pathname.startsWith(kind.href || `/dashboard/media-providers/${kind.id}`)
                        ? "nav-link-active"
                        : "text-text-muted hover:bg-surface-2 hover:text-text-main"
                    )}
                  >
                    <span className="material-symbols-outlined text-[16px]">{kind.icon}</span>
                    <span>{kind.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {filteredDebug.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "nav-link group",
                  isActive(item.href) ? "nav-link-active" : "text-text-muted hover:bg-surface-2 hover:text-text-main"
                )}
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-[18px]",
                    isActive(item.href) ? "fill-1" : "group-hover:text-primary transition-colors"
                  )}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}

            {filteredSettings && (
            <Link
              href={settingsItem.href}
              onClick={onClose}
              title={settingsItem.desc}
              className={cn(
                "nav-link group",
                isActive("/dashboard/profile") ? "nav-link-active" : "text-text-muted hover:bg-surface-2 hover:text-text-main"
              )}
            >
              <span
                className={cn(
                  "material-symbols-outlined text-[18px]",
                  isActive("/dashboard/profile") ? "fill-1" : "group-hover:text-primary transition-colors"
                )}
              >
                {settingsItem.icon}
              </span>
              <span>{settingsItem.label}</span>
            </Link>
            )}
          </div>
          )}
        </nav>

        <div className="p-4 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setShowShutdownModal(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle px-3 py-2.5 text-[13px] font-medium text-text-muted transition-colors hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-600 dark:hover:text-red-400"
          >
            <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
            Shutdown server
          </button>
        </div>
      </aside>

      {/* Shutdown Confirmation Modal */}
      <ConfirmModal
        isOpen={showShutdownModal}
        onClose={() => setShowShutdownModal(false)}
        onConfirm={handleShutdown}
        title="Close Proxy"
        message="Are you sure you want to close the proxy server?"
        confirmText="Close"
        cancelText="Cancel"
        variant="danger"
        loading={isShuttingDown}
      />

      {/* Update Confirmation Modal */}
      <ConfirmModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleUpdate}
        title="Update 9Router"
        message={`Show install command for v${updateInfo?.latestVersion || ""}? You can copy it and shutdown to install manually.`}
        confirmText="Show Command"
        cancelText="Cancel"
        variant="primary"
      />

      {/* Disconnected / Updating Overlay */}
      {(isDisconnected || isUpdating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          {isUpdating ? (
            <ManualUpdatePanel
              latestVersion={updateInfo?.latestVersion}
              installCmd={INSTALL_CMD}
              copied={copied}
              onCopyAndShutdown={handleCopyAndShutdown}
              onCancel={handleCancelUpdate}
              countdown={shutdownCountdown}
              isDisconnected={isDisconnected}
            />
          ) : (
            <div className="text-center p-8">
              <div className="flex items-center justify-center size-16 rounded-full bg-red-500/20 text-red-500 mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">power_off</span>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Server Disconnected</h2>
              <p className="text-text-muted mb-6">The proxy server has been stopped.</p>
              <Button variant="secondary" onClick={() => globalThis.location.reload()}>
                Reload Page
              </Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

Sidebar.propTypes = {
  onClose: PropTypes.func,
};

function ManualUpdatePanel({ latestVersion, installCmd, copied, onCopyAndShutdown, onCancel, countdown, isDisconnected }) {
  const isCountingDown = countdown > 0;
  return (
    <div className="w-full max-w-lg rounded-xl bg-neutral-900/95 border border-white/10 p-6 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center size-11 rounded-full bg-amber-500/20 text-amber-400">
          <span className="material-symbols-outlined text-[24px]">content_copy</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Update 9Router{latestVersion ? ` to v${latestVersion}` : ""}</h2>
          <p className="text-xs text-white/60">
            {isDisconnected
              ? "Server stopped. Paste the command into a terminal to install."
              : isCountingDown
                ? `Command copied. Server will stop in ${countdown}s...`
                : "Click the button below to copy the install command and shutdown."}
          </p>
        </div>
      </div>

      <p className="text-sm text-white/80 mb-2">Install command:</p>
      <div className="w-full px-3 py-2 rounded bg-white/5 mb-4">
        <code className="text-xs font-mono text-amber-400 break-all">{installCmd}</code>
      </div>

      <ol className="text-xs text-white/70 space-y-1 list-decimal list-inside mb-4">
        <li>Click <strong>Copy & Shutdown</strong> below.</li>
        <li>Paste the command into your terminal and press Enter.</li>
        <li>Run <code className="px-1 rounded bg-white/10 text-green-400">9router</code> again after install.</li>
      </ol>

      {isDisconnected ? (
        <Button variant="secondary" fullWidth onClick={() => globalThis.location.reload()}>
          Reload Page
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onCancel} disabled={isCountingDown}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={onCopyAndShutdown} disabled={isCountingDown}>
            {copied ? "✓ Copied — shutting down..." : isCountingDown ? `Shutting down in ${countdown}s` : "Copy & Shutdown"}
          </Button>
        </div>
      )}
    </div>
  );
}

ManualUpdatePanel.propTypes = {
  latestVersion: PropTypes.string,
  installCmd: PropTypes.string.isRequired,
  copied: PropTypes.bool,
  onCopyAndShutdown: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  countdown: PropTypes.number,
  isDisconnected: PropTypes.bool,
};
