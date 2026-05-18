// src/components/ScreenshotHandler.tsx

import {useEffect, RefObject} from "react";

interface Props {
    textareaRef: RefObject<HTMLTextAreaElement>;
    onImagePasted: (imageBase64: string, ocrText: string | null) => void;
}

export function ScreenshotHandler({textareaRef, onImagePasted}: Props) {
    useEffect(() => {
        const handlePaste = async (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            // Cek apakah target adalah textarea
            const target = e.target as HTMLElement;
            const isTextarea = target.tagName === 'TEXTAREA' || 
                               textareaRef.current === target ||
                               textareaRef.current?.contains(target);

            if (!isTextarea) return;

            for (const item of items) {
                if (item.type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const blob = item.getAsFile();
                    if (!blob) continue;

                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64 = reader.result as string;
                        
                        // OCR Process
                        const ocrText = await processImage(base64);
                        
                        // Callback dengan gambar dan OCR text
                        if (onImagePasted) {
                            onImagePasted(base64, ocrText);
                        }
                    };
                    reader.readAsDataURL(blob);
                    break;
                }
            }
        };

        // Fake processImage untuk sementara
        const processImage = async (imageData: string): Promise<string | null> => {
            try {
                const blob = await fetch(imageData).then(res => res.blob());
                const file = new File([blob], "screenshot.png", {type: "image/png"});
                const Tesseract = (await import("tesseract.js")).default;
                const {data: {text}} = await Tesseract.recognize(file, 'eng+ind');
                return text.trim() || null;
            } catch (err) {
                console.error("OCR failed:", err);
                return null;
            }
        };

        document.addEventListener('paste', handlePaste);
        return () => document.removeEventListener('paste', handlePaste);
    }, [textareaRef, onImagePasted]);

    return null;
}