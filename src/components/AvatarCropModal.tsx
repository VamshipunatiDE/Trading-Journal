import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Check } from 'lucide-react';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropSave: (croppedDataUrl: string) => void;
}

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onCropSave
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  // Non-passive wheel event listener for zooming without page scrolling
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isOpen) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom(prevZoom => {
        const newZoom = Math.min(4, Math.max(0.5, prevZoom * zoomFactor));
        const scale = newZoom / prevZoom;

        // Scale pan offset proportionally so focal point stays centered
        setPan(prevPan => ({
          x: prevPan.x * scale,
          y: prevPan.y * scale
        }));

        return newZoom;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen]);

  if (!isOpen || !imageSrc) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const nudge = (dx: number, dy: number) => {
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const handleSave = () => {
    const canvas = document.createElement('canvas');
    const size = 800; // 800x800 high resolution
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (!ctx || !imgRef.current) return;

    const img = imgRef.current;
    const frameSize = 280; // Size of circular preview frame in UI

    // Calculate crop parameters
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const scaleFactor = size / frameSize;
    const centerX = size / 2 + pan.x * scaleFactor;
    const centerY = size / 2 + pan.y * scaleFactor;

    const drawnWidth = img.naturalWidth * zoom * scaleFactor;
    const drawnHeight = img.naturalHeight * zoom * scaleFactor;

    ctx.drawImage(
      img,
      centerX - drawnWidth / 2,
      centerY - drawnHeight / 2,
      drawnWidth,
      drawnHeight
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropSave(dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12161E] text-white border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h3 className="font-display font-semibold text-lg text-gray-100">Adjust & Crop Profile Photo</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Viewport */}
        <div className="p-6 flex flex-col items-center">
          <p className="text-xs text-gray-400 mb-4 text-center">
            Drag to reposition image • Scroll wheel to zoom in/out
          </p>

          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-[280px] h-[280px] rounded-full overflow-hidden border-4 border-[#3ED9B8] shadow-inner cursor-grab active:cursor-grabbing bg-gray-950 flex items-center justify-center select-none"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? 'none' : 'transform 0.05s linear',
                maxWidth: 'none',
                maxHeight: 'none',
                width: 'auto',
                height: '280px',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Controls Bar */}
          <div className="mt-6 w-full flex flex-col gap-4">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3 bg-[#191F2A] px-4 py-2.5 rounded-xl border border-gray-800">
              <ZoomOut className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                min="0.5"
                max="3.5"
                step="0.05"
                value={zoom}
                onChange={e => {
                  const newZoom = parseFloat(e.target.value);
                  const scale = newZoom / zoom;
                  setPan(prev => ({ x: prev.x * scale, y: prev.y * scale }));
                  setZoom(newZoom);
                }}
                className="w-full accent-[#3ED9B8] bg-gray-700 h-1.5 rounded-lg cursor-pointer"
              />
              <ZoomIn className="w-4 h-4 text-gray-400" />
            </div>

            {/* Nudge Buttons */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xs text-gray-400 mr-2">Fine Nudge:</span>
              <button onClick={() => nudge(-10, 0)} className="p-2 bg-[#191F2A] border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-200">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={() => nudge(10, 0)} className="p-2 bg-[#191F2A] border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-200">
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => nudge(0, -10)} className="p-2 bg-[#191F2A] border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-200">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button onClick={() => nudge(0, 10)} className="p-2 bg-[#191F2A] border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-200">
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800 bg-[#161B24]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#3ED9B8] hover:bg-[#34c4a5] text-black font-semibold text-sm flex items-center gap-2 transition"
          >
            <Check className="w-4 h-4" />
            Save Profile Photo
          </button>
        </div>
      </div>
    </div>
  );
};
