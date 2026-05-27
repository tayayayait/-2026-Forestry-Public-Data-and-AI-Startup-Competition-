import { Link } from "@tanstack/react-router";
import { Construction } from "lucide-react";
import { Button } from "@/components/forest/Button";

export function StubPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <Construction className="size-12 text-text-tertiary" aria-hidden />
      <h1 className="mt-4 text-xl font-semibold text-text-primary">{title}</h1>
      <p className="mt-2 text-sm text-text-secondary max-w-xs">{description}</p>
      <Link to="/" className="mt-6">
        <Button variant="secondary" size="md">
          홈으로 돌아가기
        </Button>
      </Link>
    </div>
  );
}
