import { useMutation } from "@tanstack/react-query";
import type { PlantRecognitionResult } from "@/lib/gemini-plant-recognition";

export type PlantRecognitionResponse = {
  success: boolean;
  data?: {
    recognition: PlantRecognitionResult;
    enriched?: {
      story?: string;
      usage?: string;
    };
  };
  error?: string;
};

async function recognizePlant(file: File): Promise<PlantRecognitionResponse> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Str = reader.result as string;
        // ex: "data:image/jpeg;base64,/9j/4AAQ..."
        const parts = base64Str.split(",");
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
        const imageBase64 = parts[1];

        const response = await fetch("/api/plant-recognition", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imageBase64,
            mimeType,
          }),
        });

        if (!response.ok) {
          throw new Error("서버 응답 오류: " + response.status);
        }

        const data = await response.json();
        resolve(data as PlantRecognitionResponse);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("파일을 읽는 도중 오류가 발생했습니다."));
    reader.readAsDataURL(file);
  });
}

export function usePlantRecognition() {
  return useMutation({
    mutationFn: recognizePlant,
  });
}
