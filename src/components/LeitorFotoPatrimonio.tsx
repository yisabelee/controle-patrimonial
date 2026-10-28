import { useRef, useState } from "react";
import { Camera, LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ResultadoOCR = { data: { text: string } };
type WorkerOCR = {
  recognize: (image: HTMLCanvasElement | File) => Promise<ResultadoOCR>;
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  terminate: () => Promise<void>;
};

declare global {
  interface Window {
    Tesseract?: {
      createWorker: (language: string) => Promise<WorkerOCR>;
    };
  }
}

let tesseractPromise: Promise<void> | null = null;

function carregarTesseract(): Promise<void> {
  if (window.Tesseract) return Promise.resolve();
  if (tesseractPromise) return tesseractPromise;

  tesseractPromise = new Promise<void>((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>('script[data-tesseract="true"]');
    if (script?.dataset.loaded === "true" && window.Tesseract) {
      resolve();
      return;
    }
    if (script) {
      const timeout = window.setTimeout(() => {
        tesseractPromise = null;
        reject(new Error("O leitor de texto demorou para carregar. Tente novamente."));
      }, 20000);
      const terminou = () => {
        window.clearTimeout(timeout);
        if (window.Tesseract) resolve();
        else {
          tesseractPromise = null;
          reject(new Error("O leitor de texto não ficou disponível. Verifique a conexão e tente novamente."));
        }
      };
      script.addEventListener("load", terminou, { once: true });
      script.addEventListener("error", terminou, { once: true });
      return;
    }

    script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.dataset.tesseract = "true";
    const timeout = window.setTimeout(() => {
      tesseractPromise = null;
      reject(new Error("O leitor de texto demorou para carregar. Verifique sua conexão e tente novamente."));
    }, 20000);
    script.onload = () => {
      window.clearTimeout(timeout);
      script!.dataset.loaded = "true";
      if (window.Tesseract) resolve();
      else {
        tesseractPromise = null;
        reject(new Error("O leitor de texto não ficou disponível. Tente novamente."));
      }
    };
    script.onerror = () => {
      window.clearTimeout(timeout);
      script!.remove();
      tesseractPromise = null;
      reject(new Error("Não foi possível carregar o leitor de texto. Verifique sua conexão."));
    };
    document.head.appendChild(script);
  });
  return tesseractPromise;
}

async function prepararImagens(arquivo: File): Promise<HTMLCanvasElement[]> {
  const imagem = await createImageBitmap(arquivo);
  try {
    const escala = Math.min(3, Math.max(1.5, 1800 / Math.max(imagem.width, imagem.height)));
    const largura = Math.round(imagem.width * escala);
    const altura = Math.round(imagem.height * escala);

    const criar = (rotacao: 0 | 90 | 270) => {
      const canvas = document.createElement("canvas");
      canvas.width = rotacao === 0 ? largura : altura;
      canvas.height = rotacao === 0 ? altura : largura;
      const contexto = canvas.getContext("2d", { willReadFrequently: true });
      if (!contexto) throw new Error("Não foi possível preparar a imagem.");
      contexto.save();
      if (rotacao === 90) {
        contexto.translate(canvas.width, 0);
        contexto.rotate(Math.PI / 2);
      } else if (rotacao === 270) {
        contexto.translate(0, canvas.height);
        contexto.rotate(-Math.PI / 2);
      }
      contexto.drawImage(imagem, 0, 0, largura, altura);
      contexto.restore();

      const pixels = contexto.getImageData(0, 0, canvas.width, canvas.height);
      const dados = pixels.data;
      for (let i = 0; i < dados.length; i += 4) {
        const cinza = Math.round(dados[i] * 0.299 + dados[i + 1] * 0.587 + dados[i + 2] * 0.114);
        const contraste = Math.max(0, Math.min(255, (cinza - 128) * 1.45 + 128));
        dados[i] = contraste;
        dados[i + 1] = contraste;
        dados[i + 2] = contraste;
      }
      contexto.putImageData(pixels, 0, 0);
      return canvas;
    };

    // Etiquetas fotografadas de lado são testadas nas três orientações.
    return [criar(0), criar(90), criar(270)];
  } finally {
    imagem.close();
  }
}

function extrairNumero(texto: string): string | null {
  // Os tombamentos das etiquetas FAPDF deste sistema seguem o padrão 122 + 8 dígitos.
  // Primeiro tenta sequências contínuas e sequências separadas por espaços/pontuação.
  const candidatos = [
    ...texto.matchAll(/\d[\d\s.\-]{3,}\d/g),
  ]
    .map((item) => item[0].replace(/\D/g, ""))
    .filter((numero) => numero.length === 11 && /^122\d{8}$/.test(numero));

  if (candidatos.length) return candidatos[0];

  // OCR às vezes insere espaços entre os dígitos. Procura o padrão após normalizar
  // cada linha, mas nunca retorna números aleatórios como 345975.
  for (const linha of texto.split(/\r?\n/)) {
    const normalizada = linha.replace(/\D/g, "");
    const encontrado = normalizada.match(/122\d{8}/);
    if (encontrado) return encontrado[0];
  }
  return null;
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
    let worker: WorkerOCR | null = null;
    try {
      await carregarTesseract();
      if (!window.Tesseract) throw new Error("O leitor de texto não ficou disponível. Atualize a página e tente novamente.");

      const imagens = await prepararImagens(arquivo);
      worker = await window.Tesseract.createWorker("eng");
      await worker.setParameters({
        tessedit_char_whitelist: "0123456789.-",
        tessedit_pageseg_mode: "6",
      });

      let numero: string | null = null;
      // Testa a imagem original e as duas rotações, pois as etiquetas podem estar de lado.
      for (const imagem of imagens) {
        const resultado = await worker.recognize(imagem);
        numero = extrairNumero(resultado.data.text);
        if (numero && /^122\d{8}$/.test(numero)) break;
        if (!numero) {
          await worker.setParameters({ tessedit_pageseg_mode: "7" });
          const segundaTentativa = await worker.recognize(imagem);
          numero = extrairNumero(segundaTentativa.data.text);
          await worker.setParameters({ tessedit_pageseg_mode: "6" });
          if (numero && /^122\d{8}$/.test(numero)) break;
        }
      }

      if (!numero) {
        toast.error("Não identifiquei um tombamento válido da FAPDF (11 dígitos começando por 122). Aproxime a etiqueta, evite reflexos e tente novamente, ou digite o número.");
        return;
      }
      onNumeroReconhecido(numero);
      toast.success(`Número reconhecido: ${numero}. Confira se está correto.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível ler a foto. Tente novamente.");
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Não impede a próxima tentativa se o worker falhar ao encerrar.
        }
      }
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
