import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Opcao } from "@/lib/patrimonio";

export function NativeSelect({ className, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-card px-2.5 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className,
      )}
      {...p}
    />
  );
}

/** Mostra opções ativas; mantém a opção inativa atual visível para não perder o vínculo. */
export function OpcoesSelect({
  opcoes,
  value,
  onChange,
  placeholder,
  id,
  todos,
}: {
  opcoes: Opcao[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id?: string;
  todos?: boolean;
}) {
  const visiveis = opcoes.filter((o) => o.ativo || o.id === value || todos);
  return (
    <NativeSelect id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {visiveis.map((o) => (
        <option key={o.id} value={o.id}>
          {o.nome}
          {!o.ativo ? " (inativo)" : ""}
        </option>
      ))}
    </NativeSelect>
  );
}

export function Campo({
  label,
  htmlFor,
  erro,
  children,
}: {
  label: string;
  htmlFor?: string;
  erro?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
