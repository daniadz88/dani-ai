// src/hooks/useScreenshot.ts

import { useState, useCallback } from "react";

export interface PendingAttachment {
    id: string;
    base64: string;
    label: string;
    ocrText: string | null;
    isOcrDone: boolean;
}

export function useScreenshot() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [attachments, setAttachments] = useState<PendingAttachment[]>([]);

    const addImage = useCallback(async (blob: Blob) => {
        setIsProcessing(true);

        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });

        const id = `att-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        setAttachments((prev) => [
            ...prev,
            { id, base64, label: "Screenshot", ocrText: null, isOcrDone: false },
        ]);

        try {
            const Tesseract = (await import("tesseract.js")).default;
            const { data: { text } } = await Tesseract.recognize(blob, "eng+ind");
            const extracted = text.trim() || null;
            setAttachments((prev) =>
                prev.map((a) =>
                    a.id === id ? { ...a, ocrText: extracted, isOcrDone: true } : a
                )
            );
        } catch {
            setAttachments((prev) =>
                prev.map((a) =>
                    a.id === id ? { ...a, isOcrDone: true } : a
                )
            );
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const remove = useCallback((id: string) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    }, []);

    const clear = useCallback(() => {
        setAttachments([]);
        setIsProcessing(false);
    }, []);

    return { isProcessing, attachments, addImage, remove, clear };
}