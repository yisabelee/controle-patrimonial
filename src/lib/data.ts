import { useEffect, useMemo } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolver, type Opcao, type Patrimonio } from "./patrimonio";

export const patrimoniosQuery = queryOptions({
  queryKey: ["patrimonios"],
  queryFn: async (): Promise<Patrimonio[]> => {
    const all: Patrimonio[] = [];
    const page = 1000;
    for (let from = 0; ; from += page) {
      const { data, error } = await supabase
        .from("patrimonios")
        .select("*")
        .order("numero")
        .range(from, from + page - 1);
      if (error) throw error;
      all.push(...(data as Patrimonio[]));
      if (!data || data.length < page) break;
    }
    return all;
  },
});

export const setoresQuery = queryOptions({
  queryKey: ["setores"],
  queryFn: async (): Promise<Opcao[]> => {
    const { data, error } = await supabase.from("setores").select("id,nome,ativo").order("nome");
    if (error) throw error;
    return data;
  },
});

export const localizacoesQuery = queryOptions({
  queryKey: ["localizacoes"],
  queryFn: async (): Promise<Opcao[]> => {
    const { data, error } = await supabase.from("localizacoes").select("id,nome,ativo").order("nome");
    if (error) throw error;
    return data;
  },
});

export function historicoQuery(patrimonioId: string) {
  return queryOptions({
    queryKey: ["conferencias", patrimonioId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conferencias")
        .select("*")
        .eq("patrimonio_id", patrimonioId)
        .order("data_conferencia", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

/** Fonte única de dados: patrimônios com nomes de setor/localização. */
export function useAcervo() {
  const p = useQuery(patrimoniosQuery);
  const s = useQuery(setoresQuery);
  const l = useQuery(localizacoesQuery);
  const rows = useMemo(
    () => resolver(p.data ?? [], s.data ?? [], l.data ?? []),
    [p.data, s.data, l.data],
  );
  return {
    rows,
    setores: s.data ?? [],
    localizacoes: l.data ?? [],
    isLoading: p.isLoading || s.isLoading || l.isLoading,
    error: p.error || s.error || l.error,
  };
}

/** Mantém todas as telas atualizadas em tempo real. */
export function useRealtimeSync() {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel("acervo-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "patrimonios" }, () =>
        qc.invalidateQueries({ queryKey: ["patrimonios"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "setores" }, () =>
        qc.invalidateQueries({ queryKey: ["setores"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "localizacoes" }, () =>
        qc.invalidateQueries({ queryKey: ["localizacoes"] }),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "conferencias" }, () =>
        qc.invalidateQueries({ queryKey: ["conferencias"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);
}

export function useInvalidarAcervo() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ["patrimonios"] }),
      qc.invalidateQueries({ queryKey: ["setores"] }),
      qc.invalidateQueries({ queryKey: ["localizacoes"] }),
      qc.invalidateQueries({ queryKey: ["conferencias"] }),
    ]);
}

export function usePapeis() {
  return useQuery({
    queryKey: ["papeis"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { userId: null, email: null, admin: false, conferente: false };
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      if (error) throw error;
      const roles = data.map((r) => r.role);
      return {
        userId: u.user.id,
        email: u.user.email ?? null,
        admin: roles.includes("admin"),
        conferente: roles.includes("admin") || roles.includes("conferente"),
      };
    },
  });
}
