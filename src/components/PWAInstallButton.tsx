import React, { useState } from 'react';
import { Smartphone, X, Share, PlusSquare, MoreVertical, Download, Check, Copy } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Suppress when already running as an installed standalone app
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowGuideModal(true);
      }
      return;
    }
    setShowGuideModal(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Fallback ignored
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        title="Install ExtractionLab on your phone or device"
      >
        {isInstallable ? <Download className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">Install App</span>
        <span className="sm:hidden">Install</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-slate-800 rounded-xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
                  Progressive Web App
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Install ExtractionLab on Your Phone
                </h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                aria-label="Close install guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              ExtractionLab works offline and installs directly onto your iPhone or Android home screen with its own app icon and full-screen view—no App Store required.
            </p>

            {/* iOS Instructions */}
            <div className={`p-3.5 rounded-lg border text-xs space-y-2 ${isIOS ? 'bg-amber-950/20 border-amber-500/40' : 'bg-slate-900/70 border-slate-800'}`}>
              <div className="font-semibold text-white">iPhone / iPad (Safari)</div>
              <ol className="space-y-1.5 text-slate-300 list-decimal list-inside">
                <li>Open this app URL in <strong>Safari</strong>.</li>
                <li className="flex items-center gap-1.5 flex-wrap">
                  <span>Tap the</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                    <Share className="w-3 h-3 text-amber-400" /> Share
                  </span>
                  <span>button in the toolbar.</span>
                </li>
                <li className="flex items-center gap-1.5 flex-wrap">
                  <span>Scroll down and tap</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                    <PlusSquare className="w-3 h-3 text-amber-400" /> Add to Home Screen
                  </span>
                </li>
              </ol>
            </div>

            {/* Android Instructions */}
            <div className={`p-3.5 rounded-lg border text-xs space-y-2 ${!isIOS ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-900/40 border-slate-800/80'}`}>
              <div className="font-semibold text-white">Android (Chrome / Edge)</div>
              <ol className="space-y-1.5 text-slate-300 list-decimal list-inside">
                <li>Open the standalone <strong>Shared App URL</strong> directly in <strong>Chrome</strong> (not inside an embedded preview frame).</li>
                <li className="flex items-center gap-1.5 flex-wrap">
                  <span>Tap the</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[11px]">
                    <MoreVertical className="w-3 h-3 text-amber-400" /> Menu
                  </span>
                  <span>and select <strong>Install app</strong> / <strong>Add to Home screen</strong>.</span>
                </li>
              </ol>
              <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                Note: If Chrome only shows &ldquo;Create shortcut&rdquo; or &ldquo;Create link&rdquo;, make sure the app is shared publicly (&ldquo;Anyone with the link&rdquo;) or deployed to a public URL, since Chrome Android&apos;s installer cannot verify login-gated previews.
              </p>
            </div>

            {/* Quick Copy URL */}
            <div className="pt-1">
              <div className="text-[11px] font-mono text-slate-400 mb-1.5">Current App URL</div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={typeof window !== 'undefined' ? window.location.origin : ''}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 focus:outline-none"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white flex items-center gap-1.5 shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
