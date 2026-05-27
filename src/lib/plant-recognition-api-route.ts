import { fetchPlantRecognition } from "./gemini-plant-recognition";
import { toPlantInfoList } from "./forest-plants";
import { fetchForestPlants } from "./forest-plants-csv.server";

export async function handlePlantRecognitionApiRequest(
  request: Request,
  env: unknown,
  fetchImpl: typeof fetch,
): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await request.json();
    const { imageBase64, mimeType } = body as { imageBase64?: string; mimeType?: string };

    if (!imageBase64 || !mimeType) {
      return new Response(
        JSON.stringify({ success: false, error: "이미지 데이터가 필요합니다." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
    if (!geminiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Gemini API 키가 설정되지 않았습니다." }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const recognitionResult = await fetchPlantRecognition({
      apiKey: geminiKey,
      imageBase64,
      mimeType,
      fetchImpl,
    });

    let enrichedData = null;

    try {
      let forestPlants = await fetchForestPlants({
        searchWrd: recognitionResult.plantName,
        numOfRows: 1,
      });

      if (forestPlants.items.length === 0 && recognitionResult.scientificName) {
        forestPlants = await fetchForestPlants({
          searchWrd: recognitionResult.scientificName,
          numOfRows: 1,
        });
      }

      if (forestPlants.items.length > 0) {
        const plantInfo = toPlantInfoList(forestPlants)[0];

        enrichedData = {
          story: plantInfo.description,
          usage: plantInfo.usage,
        };
      }
    } catch (err) {
      console.warn("정제 CSV 식물 데이터 매칭 실패 (무시됨):", err);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          recognition: recognitionResult,
          enriched: enrichedData,
        },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (error) {
    console.error("식물 인식 실패:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
