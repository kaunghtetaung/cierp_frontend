/**
 * Image Editor Component
 * Comprehensive image editing with crop, rotate, watermark, filters, and resize
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import {
  X,
  Crop as CropIcon,
  RotateCw,
  Type,
  Maximize2,
  Save,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

export interface ImageEditorProps {
  isOpen: boolean;
  imageUrl: string;
  fileName: string;
  onSave: (editedFile: File) => void;
  onClose: () => void;
}

type EditorTool = 'none' | 'crop' | 'rotate' | 'watermark' | 'filters' | 'resize';

interface Filters {
  brightness: number;
  contrast: number;
  saturation: number;
}

export function ImageEditor({ isOpen, imageUrl, fileName, onSave, onClose }: ImageEditorProps) {
  const [activeTool, setActiveTool] = useState<EditorTool>('none');
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [watermarkText, setWatermarkText] = useState('');
  const [filters, setFilters] = useState<Filters>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
  });
  const [resizeWidth, setResizeWidth] = useState(0);
  const [resizeHeight, setResizeHeight] = useState(0);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);

  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load image
  useEffect(() => {
    if (!isOpen) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      setResizeWidth(img.width);
      setResizeHeight(img.height);
      setAspectRatio(img.width / img.height);
    };
  }, [imageUrl, isOpen]);

  // Update preview canvas whenever settings change
  useEffect(() => {
    if (!image || !previewCanvasRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate display size (max 800x600 while maintaining aspect ratio)
    const maxWidth = 800;
    const maxHeight = 600;
    let displayWidth = image.width;
    let displayHeight = image.height;

    if (displayWidth > maxWidth || displayHeight > maxHeight) {
      const ratio = Math.min(maxWidth / displayWidth, maxHeight / displayHeight);
      displayWidth = Math.round(displayWidth * ratio);
      displayHeight = Math.round(displayHeight * ratio);
    }

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply rotation
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Apply filters
    ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;

    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    ctx.restore();

    // Apply watermark
    if (watermarkText && activeTool !== 'crop') {
      ctx.font = `${Math.max(20, canvas.width / 30)}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      const padding = 20;
      ctx.strokeText(watermarkText, canvas.width - padding, canvas.height - padding);
      ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);
    }
  }, [image, rotation, filters, watermarkText, activeTool]);

  // Handle resize with aspect ratio
  const handleResizeWidthChange = (value: number) => {
    setResizeWidth(value);
    if (maintainAspectRatio) {
      setResizeHeight(Math.round(value / aspectRatio));
    }
  };

  const handleResizeHeightChange = (value: number) => {
    setResizeHeight(value);
    if (maintainAspectRatio) {
      setResizeWidth(Math.round(value * aspectRatio));
    }
  };

  // Apply all edits and save
  const handleSave = async () => {
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let sourceImage: HTMLImageElement | HTMLCanvasElement = image;
    let sourceWidth = image.width;
    let sourceHeight = image.height;

    // Step 1: Apply crop if exists
    if (completedCrop && imgRef.current) {
      const cropCanvas = document.createElement('canvas');
      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) return;

      const scaleX = image.naturalWidth / imgRef.current.width;
      const scaleY = image.naturalHeight / imgRef.current.height;

      cropCanvas.width = completedCrop.width * scaleX;
      cropCanvas.height = completedCrop.height * scaleY;

      cropCtx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      );

      sourceImage = cropCanvas;
      sourceWidth = cropCanvas.width;
      sourceHeight = cropCanvas.height;
    }

    // Step 2: Determine final canvas size (with rotation considered)
    const finalWidth = resizeWidth || sourceWidth;
    const finalHeight = resizeHeight || sourceHeight;

    if (rotation % 180 !== 0) {
      // For 90° or 270° rotation, swap width and height
      canvas.width = finalHeight;
      canvas.height = finalWidth;
    } else {
      canvas.width = finalWidth;
      canvas.height = finalHeight;
    }

    // Step 3: Apply rotation
    ctx.save();
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      if (rotation % 180 !== 0) {
        ctx.translate(-canvas.height / 2, -canvas.width / 2);
        ctx.drawImage(sourceImage, 0, 0, canvas.height, canvas.width);
      } else {
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
      }
    } else {
      ctx.drawImage(sourceImage, 0, 0, canvas.width, canvas.height);
    }
    ctx.restore();

    // Step 4: Apply filters by redrawing to a new canvas
    if (filters.brightness !== 100 || filters.contrast !== 100 || filters.saturation !== 100) {
      const filterCanvas = document.createElement('canvas');
      const filterCtx = filterCanvas.getContext('2d');
      if (!filterCtx) return;

      filterCanvas.width = canvas.width;
      filterCanvas.height = canvas.height;
      filterCtx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%)`;
      filterCtx.drawImage(canvas, 0, 0);

      // Copy back to main canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(filterCanvas, 0, 0);
    }

    // Step 5: Apply watermark
    if (watermarkText) {
      ctx.font = `${Math.max(24, canvas.width / 30)}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      const padding = 30;
      ctx.strokeText(watermarkText, canvas.width - padding, canvas.height - padding);
      ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);
    }

    // Convert canvas to blob and save
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        onSave(file);
      },
      'image/jpeg',
      0.92
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Edit Image: {fileName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-6 py-3 border-b bg-gray-50">
          <button
            onClick={() => setActiveTool('crop')}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              activeTool === 'crop' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <CropIcon size={18} />
            Crop
          </button>
          <button
            onClick={() => setActiveTool('rotate')}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              activeTool === 'rotate' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <RotateCw size={18} />
            Rotate
          </button>
          <button
            onClick={() => setActiveTool('watermark')}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              activeTool === 'watermark' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Type size={18} />
            Watermark
          </button>
          <button
            onClick={() => setActiveTool('filters')}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              activeTool === 'filters' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Sliders size={18} />
            Filters
          </button>
          <button
            onClick={() => setActiveTool('resize')}
            className={`flex items-center gap-2 px-3 py-2 rounded ${
              activeTool === 'resize' ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'
            }`}
          >
            <Maximize2 size={18} />
            Resize
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center p-6 bg-gray-100 overflow-auto">
            {activeTool === 'crop' && image ? (
              <div className="max-w-full max-h-full">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                >
                  <img
                    ref={imgRef}
                    src={imageUrl}
                    alt={fileName}
                    style={{
                      maxWidth: '800px',
                      maxHeight: '600px',
                      width: 'auto',
                      height: 'auto',
                    }}
                  />
                </ReactCrop>
              </div>
            ) : (
              <canvas
                ref={previewCanvasRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l bg-white p-6 overflow-y-auto">
            {activeTool === 'crop' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Crop Image</h3>
                <p className="text-sm text-gray-600">
                  Drag on the image to select the area you want to keep.
                </p>
                {completedCrop && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                    <p>Width: {Math.round(completedCrop.width)}px</p>
                    <p>Height: {Math.round(completedCrop.height)}px</p>
                  </div>
                )}
              </div>
            )}

            {activeTool === 'rotate' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Rotate Image</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded"
                  >
                    <RotateCcw size={18} />
                    90° Left
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded"
                  >
                    <RotateCw size={18} />
                    90° Right
                  </button>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Custom Angle: {rotation}°</label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </div>
              </div>
            )}

            {activeTool === 'watermark' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Add Watermark</h3>
                <div>
                  <label className="text-sm text-gray-600">Watermark Text</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    placeholder="Enter watermark text"
                    className="w-full px-3 py-2 border rounded mt-1"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Watermark will appear in the bottom-right corner
                </p>
              </div>
            )}

            {activeTool === 'filters' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Color Correction</h3>
                <div>
                  <label className="text-sm text-gray-600 flex justify-between">
                    <span>Brightness</span>
                    <span>{filters.brightness}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.brightness}
                    onChange={(e) => setFilters({ ...filters, brightness: Number(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 flex justify-between">
                    <span>Contrast</span>
                    <span>{filters.contrast}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.contrast}
                    onChange={(e) => setFilters({ ...filters, contrast: Number(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 flex justify-between">
                    <span>Saturation</span>
                    <span>{filters.saturation}%</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={filters.saturation}
                    onChange={(e) =>
                      setFilters({ ...filters, saturation: Number(e.target.value) })
                    }
                    className="w-full mt-2"
                  />
                </div>
              </div>
            )}

            {activeTool === 'resize' && (
              <div className="space-y-4">
                <h3 className="font-semibold mb-4">Resize Image</h3>
                <div>
                  <label className="text-sm text-gray-600">Width (px)</label>
                  <input
                    type="number"
                    value={resizeWidth}
                    onChange={(e) => handleResizeWidthChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Height (px)</label>
                  <input
                    type="number"
                    value={resizeHeight}
                    onChange={(e) => handleResizeHeightChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded mt-1"
                  />
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                  />
                  <span className="text-sm">Maintain aspect ratio</span>
                </label>
              </div>
            )}

            {activeTool === 'none' && (
              <div className="text-center text-gray-500 mt-8">
                <p className="mb-4">Select a tool from the toolbar to start editing</p>
                <div className="text-sm text-gray-400">
                  <p>Original size:</p>
                  <p>
                    {image?.width} × {image?.height}px
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            <Save size={18} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
