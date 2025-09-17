// src/component/QrScanner.tsx
import { useEffect, useRef } from "react";
import QrScanner from "qr-scanner";

type Props = {
  active?: boolean;
  onResult: (text: string) => void;
  onError?: (err: unknown) => void;
  className?: string;
};

export default function QrScannerView({
  active = true,
  onResult,
  onError,
  className,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const lastFireRef = useRef(0);

  useEffect(() => {
    let disposed = false;

    async function start() {
      // 1) Requisito de contexto seguro (https o localhost)
      const isLocalhost =
        location.hostname === "localhost" || location.hostname === "127.0.0.1";
      const isSecure = location.protocol === "https:";
      if (!isSecure && !isLocalhost) {
        const msg =
          "La cámara solo está disponible en HTTPS o en http://localhost.";
        console.warn(msg);
        onError?.(new Error(msg));
        return;
      }

      if (!active || !videoRef.current) return;

      try {
        // 2) Verifica si hay cámara
        const hasCam = await QrScanner.hasCamera();
        if (!hasCam) {
          throw new Error("No se encontró cámara en el dispositivo.");
        }

        // 3) Crea el scanner (sin WORKER_PATH en versiones recientes)
        scannerRef.current = new QrScanner(
          videoRef.current,
          (res) => {
            const txt = (res as any)?.data ?? (res as any)?.text ?? String(res);
            const now = Date.now();
            if (now - lastFireRef.current < 600) return; // debounce
            lastFireRef.current = now;
            onResult(txt);
          },
          {
            // opciones útiles
            returnDetailedScanResult: true,
            highlightScanRegion: true,
            maxScansPerSecond: 8,
            // preferir cámara trasera en móviles
            preferredCamera: "environment",
          }
        );

        await scannerRef.current.start();
        if (disposed) return;

        // iOS: a veces requiere reproducir el <video>
        try {
          await videoRef.current.play();
        } catch {
          /* ignore */
        }
      } catch (e) {
        // Errores comunes: NotAllowedError (permiso), NotFoundError (sin cam), SecurityError (http)
        onError?.(e);
      }
    }

    start();

    // Cleanup
    return () => {
      disposed = true;
      (async () => {
        try {
          await scannerRef.current?.stop();
        } catch {}
        try {
          scannerRef.current?.destroy();
        } catch {}
        scannerRef.current = null;
      })();
    };
  }, [active, onResult, onError]);

  return (
    <video
      ref={videoRef}
      className={className ?? "w-full aspect-[4/3] rounded-xl bg-black/5"}
      muted
      playsInline
    />
  );
}
