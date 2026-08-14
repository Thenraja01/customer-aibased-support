import { useEffect, useState, useRef, useCallback } from "react";
import { X, Loader2, AlertCircle, EyeOff } from "lucide-react";
import AxiosInstance from "@/api/axiosInstance";
import { useFreshToken } from "@/hooks/useFreshToken";

interface DocumentViewerProps {
  title: string;
  fileUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentViewer({
  title,
  fileUrl,
  isOpen,
  onClose,
}: DocumentViewerProps) {
  const token = useFreshToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [isImage, setIsImage] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Keyboard accessibility: Escape key closes modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  }, [onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Resolve Cloudinary secure URL via backend authorization.
  // Uses the axios instance so expired access tokens are transparently
  // refreshed and the request retried (raw fetch would 401 instead).
  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    let active = true;
    setLoading(true);
    setError(null);
    setResolvedUrl(null);

    const resolveUrl = async () => {
      try {
        const fetchUrl = fileUrl.includes("?") ? `${fileUrl}&json=true` : `${fileUrl}?json=true`;
        const response = await AxiosInstance.get(fetchUrl, {
          validateStatus: (status: number) => status >= 200 && status < 400,
        });

        if (!active) return;

        if (response.status === 403) {
          setError("You don't have permission to view this document.");
          setLoading(false);
          return;
        }

        if (response.status >= 400) {
          setError(
            `Failed to retrieve document: ${
              response.status === 401 ? "Unauthorized" : response.statusText || response.status
            }`
          );
          setLoading(false);
          return;
        }

        // The backend returns a signed Cloudinary URL in the JSON response
        const finalUrl = response.data?.url || fileUrl;

        // Check if content is an image based on the URL extension or title
        const checkIsImage =
          /\.(jpg|jpeg|png|gif|webp)$/i.test(finalUrl) || /\.(jpg|jpeg|png|gif|webp)$/i.test(title);
        setResolvedUrl(finalUrl);
        setIsImage(!!checkIsImage);
      } catch (err: any) {
        if (active) {
          setError(err.message || "An error occurred while opening the document.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    resolveUrl();

    return () => {
      active = false;
    };
  }, [isOpen, fileUrl, token]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-card rounded-xl shadow-2xl border dark:border-white/[0.06] max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden outline-none animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="viewer-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-white/[0.06] flex items-center justify-between shrink-0 bg-muted/20">
          <h2 id="viewer-title" className="text-sm font-semibold truncate pr-4 text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
            aria-label="Close document viewer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 bg-muted/10 relative flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card/50">
              <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
              <p className="text-xs text-muted-foreground font-medium">Securing access and loading file...</p>
            </div>
          )}

          {error ? (
            <div className="p-6 text-center max-w-sm flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
                {error.includes("permission") ? <EyeOff size={22} /> : <AlertCircle size={22} />}
              </div>
              <h3 className="text-sm font-semibold text-foreground">Access Restricted</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 text-xs font-semibold px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                Close Viewer
              </button>
            </div>
          ) : resolvedUrl ? (
            isImage ? (
              <div className="w-full h-full flex items-center justify-center p-6 overflow-auto">
                <img
                  src={resolvedUrl}
                  alt={title}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md animate-in fade-in duration-300"
                />
              </div>
            ) : (
              <iframe
                src={resolvedUrl}
                title={title}
                className="w-full h-full border-none bg-white animate-in fade-in duration-300"
                aria-label={title}
              />
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
