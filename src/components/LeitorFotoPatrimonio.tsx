import { useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Tesseract?: {
      createWorker: (language: string) => Promise<{
        recognize: (image: File) => Promise<{ data: { text: string } }>;
        terminate: () => Promise<void>;
      }>;
    };
  }
}

let tesseractPromise: Promise<void> | null = null;

function carregarTesseract() {
  if (window.Tesseract) return Promise.resolve();
  if (!tesseractPromise) {
    tesseractPromise = new Promise<void>((resolve, reject) => {
      const existente = document.querySelector<HTMLScriptElement>('script[data-tesseract="true"]');
      if (existente) {
        existente.addEventListener("load", () => resolve(), { once: true });
        existente.addEventListener("error", () => reject(new Error("Não foi possível carregar o leitor de texto.")), { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      script.async = true;
      script.dataset.tesseract = "true";
      script.onload = () => resolve();
      script.onerror = () => {
        tesseractPromise = null;
        reject(new Error("Não foi possível carregar o leitor de texto. Verifique sua conexão."));
      };
      document.head.appendChild(script);
    });
  }
  return tesseractPromise;
}

export function LeitorFotoPatrimonio({
  onNumeroReconhecido,
  compacto = false,
}: {
  onNumeroReconhecido: (numero: string) => void;
  compacto?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lendo, setLendo] = useState(false);

  async function lerFoto(arquivo?: File) {
    if (!arquivo) return;
    if (!arquivo.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida.");
      return;
    }
    setLendo(true);
    try {
      await carregarTesseract();
      if (!window.Tesseract) throw new Error("O leitor de texto não ficou disponível.");
      const worker = await window.Tesseract.createWorker("eng");
      try {
        const resultado = await worker.recognize(arquivo);
        const texto = resultado.data.text;
        const candidatos = texto.match(/\d[\d\s.-]{4,}\d/g) ?? [];
        const numero = candidatos
          .map((c) => c.replace(/\D/g, ""))
          .filter((c) => c.length >= 5)
          .sort((a, b) => b.length - a.length)[0];
        if (!numero) {
          toast.error("Não consegui identificar o tombamento. Tente uma foto mais nítida ou digite o número.");
          return;
        }
        onNumeroReconhecido(numero);
        toast.success(`Número reconhecido: ${numero}. Confira antes de continuar.`);
      } finally {
        await worker.terminate();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ler a foto.");
    } finally {
      setLendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        aria-label="Fotografar etiqueta patrimonial"
        onChange={(e) => void lerFoto(e.target.files?.[0])}
      />
      <Button
        type="button"
        variant="outline"
        size={compacto ? "icon" : "sm"}
        disabled={lendo}
        onClick={() => inputRef.current?.click()}
        aria-label="Ler tombamento por foto"
        title="Fotografar ou selecionar imagem da etiqueta"
      >
        {lendo ? <LoaderCircle className="size-4 animate-spin" /> : <Camera className="size-4" />}
        {!compacto && (lendo ? "Lendo foto…" : "Ler por foto")}
      </Button>
    </>
  );
}
