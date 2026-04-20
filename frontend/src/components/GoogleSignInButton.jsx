import { useEffect, useMemo, useRef, useState } from "react";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
let googleScriptPromise;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

function GoogleSignInButton({ onCredential, onError, text = "continue_with", disabled = false }) {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);

  const clientId = useMemo(() => import.meta.env.VITE_GOOGLE_CLIENT_ID || "", []);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let mounted = true;

    loadGoogleScript()
      .then(() => {
        if (!mounted || !containerRef.current || !window.google?.accounts?.id) {
          return;
        }

        window.google.accounts.id.disableAutoSelect();

        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: (response) => {
            if (response?.credential) {
              onCredentialRef.current(response.credential);
            } else if (onError) {
              onError(new Error("Google did not return a credential"));
            }
          },
        });

        containerRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "rectangular",
          width: "360",
        });

        setIsReady(true);
      })
      .catch(() => {
        if (mounted && onError) {
          onError(new Error("Unable to load Google sign in"));
        }
      });

    return () => {
      mounted = false;
    };
  }, [clientId, onError, text]);

  const onUseAnotherAccount = () => {
    if (!window.google?.accounts?.id) {
      if (onError) {
        onError(new Error("Google sign in is not ready yet"));
      }
      return;
    }

    window.google.accounts.id.disableAutoSelect();
    window.google.accounts.id.prompt();
  };

  if (!clientId) {
    return <p className="google-auth-error">Google login is not configured for this app.</p>;
  }

  return (
    <div className="google-auth-slot" aria-disabled={disabled}>
      <div ref={containerRef} className={disabled ? "google-auth-disabled" : ""} />
      {!isReady ? <p className="google-auth-loading">Loading Google Sign-In...</p> : null}
      <button
        className="google-use-another-btn"
        type="button"
        onClick={onUseAnotherAccount}
        disabled={disabled || !isReady}
      >
        Use another Google account
      </button>
    </div>
  );
}

export default GoogleSignInButton;
