// src/components/ImageUploadButton.tsx

import {useState, useRef} from "react";
import Tesseract from "tesseract.js";

interface Props {
    onImageProcessed: (base64: string, ocrText?: string) => void;
    disabled?: boolean;
}

export function ImageUploadButton({onImageProcessed, disabled}: Props) {
    const [uploading, setUploading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [ocrResult, setOcrResult] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const processImage = async (file: File) => {
        setUploading(true);
        setShowPreview(true);
        
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);
        
        try {
            // OCR Processing
            const {data: {text}} = await Tesseract.recognize(file, 'eng+ind', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            
            if (text.trim()) {
                setOcrResult(text);
            } else {
                setOcrResult("Tidak ada teks yang terdeteksi");
            }
            
            // Convert to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                onImageProcessed(base64, text.trim() || undefined);
            };
            reader.readAsDataURL(file);
            
        } catch (err) {
            console.error("OCR failed:", err);
            setOcrResult("Gagal membaca gambar");
        } finally {
            setUploading(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert("Hanya file gambar yang didukung");
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) {
            alert("Ukuran gambar maksimal 5MB");
            return;
        }
        
        await processImage(file);
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleSendImage = () => {
        setShowPreview(false);
        setPreviewUrl(null);
        setOcrResult(null);
    };

    const handleCancel = () => {
        setShowPreview(false);
        setPreviewUrl(null);
        setOcrResult(null);
    };

    return (
        <>
            <input
                type="file"
                ref={fileRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{display: "none"}}
                disabled={disabled || uploading}
            />
            <button
                className={`img-upload-btn${uploading ? " uploading" : ""}`}
                onClick={() => fileRef.current?.click()}
                disabled={disabled || uploading}
                title="Upload gambar & extract teks"
            >
                {uploading ? (
                    <>
                        <span className="img-upload-spinner" />
                        <span>OCR...</span>
                    </>
                ) : (
                    <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="2.18" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5-6 6-3-3-5 5" />
                        </svg>
                        <span>Gambar</span>
                    </>
                )}
            </button>

            {showPreview && previewUrl && (
                <div className="img-preview-modal" onClick={handleCancel}>
                    <div className="img-preview-content" onClick={(e) => e.stopPropagation()}>
                        <div className="img-preview-header">
                            <span>📷 Preview Gambar</span>
                            <button onClick={handleCancel}>✕</button>
                        </div>
                        <img src={previewUrl} alt="Preview" className="img-preview-image" />
                        {ocrResult && (
                            <div className="img-preview-ocr">
                                <div className="ocr-label">📝 Teks yang terdeteksi:</div>
                                <pre className="ocr-text-preview">{ocrResult}</pre>
                            </div>
                        )}
                        <div className="img-preview-actions">
                            <button className="img-preview-cancel" onClick={handleCancel}>
                                Batal
                            </button>
                            <button className="img-preview-send" onClick={handleSendImage}>
                                Kirim Gambar {ocrResult && "+ Teks"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}