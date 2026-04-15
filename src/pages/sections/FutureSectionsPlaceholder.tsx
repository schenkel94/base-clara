import { SectionCard } from "@/components/ui/SectionCard";

const futureSections = [
  {
    title: "Diagnóstico de Qualidade",
    note: "placeholder pronto para score visual e nível de prioridade",
  },
  {
    title: "Problemas e Dicas",
    note: "placeholder pronto para listagem de inconsistências detectadas",
  },
  {
    title: "Exemplos de Tratamento",
    note: "placeholder pronto para pandas, Power Query (M) e SQL",
  },
];

export function FutureSectionsPlaceholder() {
  return (
    <SectionCard
      title="Estrutura pronta para evolução por sprint"
      description="As seções abaixo já existem como base visual e serão ativadas gradualmente."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {futureSections.map((section) => (
          <article
            key={section.title}
            className="rounded-xl border border-surface-600 bg-surface-900/70 p-4"
          >
            <p className="font-medium text-slate-200">{section.title}</p>
            <p className="mt-2 text-sm text-slate-400">{section.note}</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
