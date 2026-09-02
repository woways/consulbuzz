import { useEffect, useRef, useState } from "react";
import { X, Loader2 } from "lucide-react";

const JITSI_DOMAIN = "meet.jit.si";
const JITSI_SCRIPT = "https://meet.jit.si/external_api.js";

// Load the Jitsi external API script once, shared across mounts.
let jitsiScriptPromise = null;
function loadJitsiScript() {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (jitsiScriptPromise) return jitsiScriptPromise;

  jitsiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      'script[data-jitsi="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Jitsi"))
      );
      return;
    }
    const script = document.createElement("script");
    script.src = JITSI_SCRIPT;
    script.async = true;
    script.dataset.jitsi = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Jitsi"));
    document.body.appendChild(script);
  });
  return jitsiScriptPromise;
}

/**
 * Full-screen Jitsi meeting overlay.
 * Props:
 *   open        - whether to show
 *   roomName    - unique Jitsi room name
 *   displayName - the current user's name (shown in the call)
 *   subject     - optional meeting title
 *   onClose     - called when the user closes / leaves
 */
export default function MeetingRoom({
  open,
  roomName,
  displayName,
  subject,
  onClose,
}) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !roomName) return undefined;

    let disposed = false;
    setLoading(true);
    setError("");

    loadJitsiScript()
      .then(() => {
        if (disposed || !containerRef.current) return;

        // Clear any previous instance.
        if (apiRef.current) {
          apiRef.current.dispose();
          apiRef.current = null;
        }

        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          width: "100%",
          height: "100%",
          userInfo: { displayName: displayName || "Guest" },
          configOverwrite: {
            prejoinPageEnabled: true,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
          },
        });

        apiRef.current = api;

        api.addEventListener("videoConferenceJoined", () => {
          if (!disposed) setLoading(false);
          if (subject) {
            try {
              api.executeCommand("subject", subject);
            } catch (e) {
              // non-fatal
            }
          }
        });

        // When the user hangs up, close the overlay.
        api.addEventListener("readyToClose", () => {
          if (!disposed) onClose?.();
        });

        // Fallback: hide spinner shortly after load even if the join event lags.
        window.setTimeout(() => {
          if (!disposed) setLoading(false);
        }, 4000);
      })
      .catch(() => {
        if (!disposed) {
          setError("Unable to start the meeting. Please try again.");
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [open, roomName, displayName, subject, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-slate-950">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900 px-4 py-2.5">
        <div className="min-w-0">
          <div className="truncate text-sm font-bold text-white">
            {subject || "Meeting"}
          </div>
          <div className="truncate text-[11px] text-slate-400">
            Room: {roomName}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700"
        >
          <X size={14} />
          Leave
        </button>
      </div>

      {/* Meeting area */}
      <div className="relative flex-1">
        {loading && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-slate-950 text-sm text-slate-300">
            <Loader2 size={18} className="animate-spin" />
            Starting meeting...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-950 text-center text-sm text-slate-300">
            <div>{error}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/20 px-4 py-2 text-xs font-bold text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
