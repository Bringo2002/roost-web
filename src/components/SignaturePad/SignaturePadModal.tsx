import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icon/Icon';
import { Modal } from '../Modal/Modal';
import styles from './SignaturePadModal.module.css';

interface SignaturePadModalProps {
  /** "Tenant" or "Landlord": shown in the title. */
  signerLabel: string;
  onConfirm: (png: Blob) => void;
  onClose: () => void;
}

const PEN_WIDTH = 3;

/** Draw-to-sign pad: black pen on white, exported as a PNG (same as the app). */
export function SignaturePadModal({ signerLabel, onConfirm, onClose }: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  const paintBlank = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height } = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  };

  // Size the bitmap for the screen's pixel density so lines stay sharp.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = PEN_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
    paintBlank();
  }, []);

  const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pointFrom(e);
    lastPoint.current = p;
    // A tap leaves a dot.
    ctx.beginPath();
    ctx.arc(p.x, p.y, PEN_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    setHasInk(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !lastPoint.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const p = pointFrom(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
  };

  const endStroke = () => {
    drawing.current = false;
    lastPoint.current = null;
  };

  const clear = () => {
    paintBlank();
    setHasInk(false);
  };

  const confirm = () => {
    if (!hasInk) return;
    canvasRef.current?.toBlob(blob => {
      if (blob) onConfirm(blob);
    }, 'image/png');
  };

  return (
    <Modal
      title={`${signerLabel} signature`}
      onClose={onClose}
      footer={
        <>
          <button className={styles.outlineBtn} onClick={clear} type="button">
            <Icon name="rotate" size={16} /> Clear
          </button>
          <button className={styles.primaryBtn} onClick={confirm} disabled={!hasInk} type="button">
            <Icon name="check" size={16} /> Confirm Signature
          </button>
        </>
      }
    >
      <p className={styles.hint}>Sign below with your finger, a stylus or your mouse</p>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        aria-label={`${signerLabel} signature drawing area`}
      />
    </Modal>
  );
}
