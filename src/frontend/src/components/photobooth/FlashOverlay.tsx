import { useEffect } from "react";
import { usePhotoboothStore } from "../../store/photoboothStore";

export function FlashOverlay() {
  const { flashActive, setFlashActive } = usePhotoboothStore();

  useEffect(() => {
    if (flashActive) {
      const t = setTimeout(() => setFlashActive(false), 450);
      return () => clearTimeout(t);
    }
  }, [flashActive, setFlashActive]);

  if (!flashActive) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] bg-white pointer-events-none flash-overlay"
      aria-hidden="true"
    />
  );
}
