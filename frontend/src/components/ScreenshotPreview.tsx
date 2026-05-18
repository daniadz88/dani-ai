// src/components/ScreenshotPreview.tsx

import React, { useState } from "react";  // ✅ Import yang benar di PERTAMA

interface Props {
    imageBase64: string;
    ocrText: string | null;
    isProcessing: boolean;
    onCancel: () => void;
    onSend: (prompt?: string) => void;
}

export function ScreenshotPreview({imageBase64, ocrText, isProcessing, onCancel, onSend}: Props) {
    const [prompt, setPrompt] = useState("");  // ✅ useState dari React

    return (
        <div className="pending-screenshot">
            <div className="pending-screenshot-header">
                <span>📸 Screenshot siap</span>
                <button onClick={onCancel}>✕</button>
            </div>
            <div className="pending-screenshot-preview">
                <img src={imageBase64} alt="Screenshot preview" />
            </div>
            {isProcessing && (
                <div className="pending-screenshot-processing">
                    <span className="processing-spinner"></span>
                    Membaca teks...
                </div>
            )}
            {ocrText && !isProcessing && (
                <div className="pending-screenshot-ocr">
                    <div className="ocr-label">📝 Teks terdeteksi:</div>
                    <pre>{ocrText}</pre>
                </div>
            )}
            <textarea
                className="pending-screenshot-prompt"
                placeholder="Tambahkan prompt (opsional)... Contoh: 'Jelaskan gambar ini' atau 'Apa yang kamu lihat?'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
            />
            <div className="pending-screenshot-actions">
                <button className="pending-cancel" onClick={onCancel}>Batal</button>
                <button className="pending-send" onClick={() => onSend(prompt)}>
                    Kirim {prompt ? `"${prompt.slice(0, 30)}${prompt.length > 30 ? '...' : ''}"` : "Gambar"}
                </button>
            </div>
        </div>
    );
}