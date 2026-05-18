// src/hooks/useScreenshot.ts

import {useState, useCallback} from "react";
import Tesseract from "tesseract.js";

export function useScreenshot() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [pendingOcrText, setPendingOcrText] = useState<string | null>(null);

    const processImage = useCallback(async (imageData: string): Promise<string | null> => {
        setIsProcessing(true);
        
        try {
            const blob = await fetch(imageData).then(res => res.blob());
            const file = new File([blob], "screenshot.png", {type: "image/png"});
            
            const {data: {text}} = await Tesseract.recognize(file, 'eng+ind', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });
            
            const extractedText = text.trim() ? text : null;
            setPendingOcrText(extractedText);
            return extractedText;
        } catch (err) {
            console.error("OCR failed:", err);
            setPendingOcrText(null);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    const setPending = useCallback((imageData: string | null) => {
        setPendingImage(imageData);
    }, []);

    const clearPending = useCallback(() => {
        setPendingImage(null);
        setPendingOcrText(null);
    }, []);

    return {
        isProcessing,
        pendingImage,
        pendingOcrText,
        setPending,
        clearPending,
        processImage
    };
}