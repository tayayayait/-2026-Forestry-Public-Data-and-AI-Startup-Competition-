import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Camera,
  Image as ImageIcon,
  Leaf,
  Loader2,
  Sparkles,
  UploadCloud,
  X,
  RefreshCw,
} from "lucide-react";
import { usePlantRecognition, type PlantRecognitionResponse } from "@/hooks/usePlantRecognition";
import { usePlants } from "@/hooks/usePlants";
import { buildPlantGuideItems } from "@/lib/plant-guide";

export const Route = createFileRoute("/plants")({
  component: PlantsPage,
});

function PlantsPage() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const { mutate: recognizePlant, isPending: isRecognizing } = usePlantRecognition();
  const [recognitionData, setRecognitionData] = React.useState<
    PlantRecognitionResponse["data"] | null
  >(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [isCameraStarting, setIsCameraStarting] = React.useState(false);
  const [cameraError, setCameraError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPlantId, setSelectedPlantId] = React.useState<string | undefined>();
  const plantsQuery = usePlants(searchQuery);
  const plantGuideItems = React.useMemo(
    () =>
      buildPlantGuideItems({
        plants: plantsQuery.data ?? [],
        fallbackPlants: [],
        searchQuery,
        date: new Date(),
      }),
    [plantsQuery.data, searchQuery],
  );
  const selectedPlant = React.useMemo(
    () => plantGuideItems.find((plant) => plant.id === selectedPlantId),
    [plantGuideItems, selectedPlantId],
  );

  const submitPlantFile = React.useCallback(
    (file: File) => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setRecognitionData(null);

      recognizePlant(file, {
        onSuccess: (res) => {
          if (res.success && res.data) {
            setRecognitionData(res.data);
          } else {
            alert(res.error || "식물 인식에 실패했습니다.");
            URL.revokeObjectURL(objectUrl);
            setPreviewUrl(null);
          }
        },
        onError: (err) => {
          alert(err.message || "식물 인식 중 오류가 발생했습니다.");
          URL.revokeObjectURL(objectUrl);
          setPreviewUrl(null);
        },
      });
    },
    [previewUrl, recognizePlant],
  );

  const stopCamera = React.useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStream(null);
    setIsCameraOpen(false);
    setCameraError(null);
  }, []);

  React.useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  React.useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("이 브라우저에서는 카메라 촬영을 지원하지 않습니다.");
      return;
    }

    setIsCameraStarting(true);
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraStream(stream);
      setIsCameraOpen(true);
    } catch {
      setCameraError("카메라 권한이 거부되었거나 카메라를 열 수 없습니다.");
    } finally {
      setIsCameraStarting(false);
    }
  };

  const captureCameraPhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError("카메라 화면이 아직 준비되지 않았습니다.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");

    if (!context) {
      setCameraError("촬영 이미지를 생성할 수 없습니다.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("촬영 이미지를 저장할 수 없습니다.");
          return;
        }

        const file = new File([blob], `plant-${Date.now()}.jpg`, { type: "image/jpeg" });
        stopCamera();
        submitPlantFile(file);
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    submitPlantFile(file);

    // Reset inputs
    e.target.value = "";
  };

  const handleReset = () => {
    stopCamera();
    setRecognitionData(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col p-4 pb-4 lg:p-5">
      {/* Header */}
      <div className="mb-5 mt-2 text-center">
        <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-forest-100 text-forest-600 shadow-sm">
          <Leaf className="size-7" />
        </span>
        <h1 className="text-2xl font-bold text-forest-900">AI 숲 생물 도감</h1>
        <p className="mt-2 text-sm text-text-secondary">
          궁금한 식물의 사진을 찍으면 AI가
          <br />
          치유 정보와 함께 알려드립니다.
        </p>
      </div>

      <section className="mb-4 rounded-2xl border border-forest-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-forest-900">산림청 식물 도감 검색</h2>
          <span className="text-xs font-semibold text-text-tertiary">정제 CSV</span>
        </div>
        <input
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setSelectedPlantId(undefined);
          }}
          placeholder="식물명 검색"
          className="mb-3 h-10 w-full rounded-xl border border-border-default px-3 text-sm outline-none focus:border-forest-500"
        />
        <div className="max-h-28 space-y-2 overflow-y-auto">
          {plantGuideItems.slice(0, 6).map((plant) => (
            <button
              key={plant.id}
              type="button"
              onClick={() => setSelectedPlantId(plant.id)}
              className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                selectedPlantId === plant.id
                  ? "bg-forest-100 ring-1 ring-forest-300"
                  : "bg-forest-50 hover:bg-forest-100"
              }`}
            >
              <span>
                <span className="block text-sm font-bold text-forest-900">{plant.name}</span>
                <span className="line-clamp-1 text-xs text-text-tertiary">
                  {plant.scientificName || plant.seasonLabel}
                </span>
              </span>
              <Leaf className="mt-0.5 size-4 shrink-0 text-forest-600" aria-hidden />
            </button>
          ))}
          {plantsQuery.isLoading && (
            <p className="text-xs text-text-tertiary">산림청 식물 정보를 불러오는 중입니다.</p>
          )}
          {plantsQuery.isError && (
            <p className="text-xs text-text-tertiary">식물 정보를 불러올 수 없습니다.</p>
          )}
          {!plantsQuery.isLoading && !plantsQuery.isError && plantGuideItems.length === 0 && (
            <p className="text-xs text-text-tertiary">검색 결과가 없습니다.</p>
          )}
        </div>
        {selectedPlant && (
          <div className="mt-4 rounded-2xl border border-forest-100 bg-forest-50 p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-forest-900">{selectedPlant.name}</h3>
                <p className="text-xs italic text-text-tertiary">
                  {selectedPlant.scientificName || "학명 정보 없음"}
                </p>
              </div>
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-forest-700">
                산림청
              </span>
            </div>
            {selectedPlant.description && (
              <p className="text-sm leading-relaxed text-forest-900">{selectedPlant.description}</p>
            )}
            <div className="mt-3 grid gap-2 text-xs text-text-secondary">
              {selectedPlant.habitat && (
                <p>
                  <span className="font-bold text-forest-800">서식장소</span>{" "}
                  {selectedPlant.habitat}
                </p>
              )}
              {selectedPlant.usage && (
                <p>
                  <span className="font-bold text-forest-800">안내</span> {selectedPlant.usage}
                </p>
              )}
            </div>
            <p className="mt-3 border-t border-forest-100 pt-3 text-xs text-text-tertiary">
              정제 CSV에는 이미지 필드가 없습니다.
            </p>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      <div className="flex flex-col">
        {isRecognizing ? (
          <div className="flex flex-col items-center justify-center space-y-5 rounded-2xl border-2 border-dashed border-forest-200 bg-white p-6 py-10 shadow-sm">
            <div className="relative flex size-24 items-center justify-center rounded-full bg-forest-50">
              <Loader2 className="size-10 animate-spin text-forest-600" />
              <Sparkles className="absolute -right-1 -top-1 size-6 animate-pulse text-yellow-400" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-forest-900">AI가 식물을 분석 중입니다</h2>
              <p className="mt-1 text-sm text-text-tertiary">잠시만 기다려주세요...</p>
            </div>
            {previewUrl && (
              <div className="mt-4 size-32 overflow-hidden rounded-2xl border-4 border-white shadow-md">
                <img
                  src={previewUrl}
                  alt="분석 중인 식물"
                  className="h-full w-full object-cover opacity-50 blur-sm grayscale"
                />
              </div>
            )}
          </div>
        ) : recognitionData ? (
          <div className="flex flex-col overflow-hidden rounded-3xl border border-forest-100 bg-white shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Image Header */}
            {previewUrl && (
              <div className="relative h-48 w-full bg-forest-50">
                <img src={previewUrl} alt="인식된 식물" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      icon={Leaf}
                      className="bg-forest-500 text-white border-none backdrop-blur-md bg-opacity-80"
                    >
                      {recognitionData.recognition.confidence}% AI 추정
                    </Badge>
                    <Badge className="bg-white/20 text-white border-none backdrop-blur-md">
                      {recognitionData.recognition.family}
                    </Badge>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold">
                    {recognitionData.recognition.plantName}
                  </h2>
                  <p className="text-sm font-medium italic opacity-90">
                    {recognitionData.recognition.scientificName}
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                  aria-label="결과 닫기"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

            {/* Analysis Data */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-6">
                {/* Forest Therapy Note (Highlight) */}
                <div className="rounded-2xl border border-coral/20 bg-coral/5 p-4 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-5">
                    <Sparkles className="size-24" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="size-5 text-coral" />
                    <h3 className="font-bold text-coral-dark">AI 산림치유 추천 포인트</h3>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-coral-dark/90">
                    {recognitionData.recognition.forestTherapyNote}
                  </p>
                </div>

                {/* Characteristics & Medicine */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="mb-1 text-xs font-bold text-text-tertiary">개화 시기</h4>
                    <p className="text-sm text-text-primary">
                      {recognitionData.recognition.floweringPeriod}
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-1 text-xs font-bold text-text-tertiary">주요 서식지</h4>
                    <p className="text-sm text-text-primary">
                      {recognitionData.recognition.habitat}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <h4 className="mb-1 text-xs font-bold text-text-tertiary">형태적 특징</h4>
                    <p className="text-sm text-text-primary leading-relaxed">
                      {recognitionData.recognition.characteristics}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <h4 className="mb-1 text-xs font-bold text-text-tertiary">약효 / 활용</h4>
                    <p className="text-sm text-text-primary leading-relaxed">
                      {recognitionData.recognition.medicinalUse}
                    </p>
                  </div>
                </div>

                {/* Forest Service CSV Data (if available) */}
                {recognitionData.enriched?.story && (
                  <div className="rounded-2xl bg-forest-50 p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-forest-600 text-white">
                        <Leaf className="size-3.5" />
                      </span>
                      <h4 className="font-bold text-forest-900">산림청 정제 도감 설명</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-forest-800">
                      {recognitionData.enriched.story}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="border-t border-border-subtle bg-neutral-50 p-4">
              <button
                onClick={handleReset}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-border-default py-3.5 text-sm font-bold text-text-primary transition-colors hover:bg-neutral-50 shadow-sm"
              >
                <RefreshCw className="size-4" />
                다른 식물 찾아보기
              </button>
            </div>
          </div>
        ) : isCameraOpen ? (
          <div className="overflow-hidden rounded-2xl border border-forest-200 bg-white shadow-sm">
            <div className="relative aspect-[3/4] max-h-[420px] w-full overflow-hidden bg-black">
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                muted
                playsInline
              />
              <div className="pointer-events-none absolute inset-x-8 inset-y-10 rounded-2xl border border-white/70" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-border-subtle bg-white p-3">
              <button
                type="button"
                onClick={captureCameraPhoto}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 text-sm font-bold text-white transition-colors hover:bg-forest-900 active:scale-[0.98]"
              >
                <Camera className="size-4" />
                촬영하기
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="h-12 rounded-xl border border-border-default bg-white px-4 text-sm font-bold text-text-secondary transition-colors hover:bg-neutral-50"
              >
                취소
              </button>
            </div>
            {cameraError && (
              <p className="border-t border-border-subtle px-4 py-3 text-xs text-error">
                {cameraError}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={startCamera}
              disabled={isCameraStarting}
              className="group flex min-h-[176px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-forest-200 bg-white px-6 py-7 shadow-sm transition-all hover:border-forest-400 hover:bg-forest-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <div className="flex size-14 items-center justify-center rounded-full bg-forest-100 text-forest-600 transition-transform group-hover:scale-110">
                {isCameraStarting ? (
                  <Loader2 className="size-7 animate-spin" />
                ) : (
                  <Camera className="size-7" />
                )}
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold text-forest-900">카메라로 바로 찍기</h2>
                <p className="mt-1 text-sm text-text-tertiary">눈앞의 식물을 촬영하세요</p>
              </div>
            </button>
            {cameraError && <p className="px-1 text-xs text-error">{cameraError}</p>}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex min-h-[72px] items-center justify-center gap-3 rounded-2xl border border-border-default bg-white p-4 transition-all hover:bg-neutral-50 active:scale-[0.98]"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-neutral-100 text-text-secondary">
                <ImageIcon className="size-5" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-text-primary">앨범에서 사진 선택</h3>
                <p className="text-xs text-text-tertiary">저장된 식물 사진 불러오기</p>
              </div>
              <UploadCloud className="ml-auto size-5 text-text-tertiary opacity-50 transition-opacity group-hover:opacity-100" />
            </button>
          </div>
        )}
      </div>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

// Inline Badge component to replace the external one for simpler imports
function Badge({
  children,
  icon: Icon,
  className,
}: {
  children: React.ReactNode;
  icon?: any;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${className || ""}`}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}
