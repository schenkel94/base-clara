import { InfoBadge } from "@/components/ui/InfoBadge";

export function HeroSection() {
  return (
    <section className="rounded-3xl border border-surface-600/80 bg-gradient-to-b from-surface-700/85 to-surface-900/85 p-6 shadow-glow md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InfoBadge>Processamento 100% local no navegador</InfoBadge>
        <span className="rounded-full border border-slate-500/50 bg-surface-900/80 px-3 py-1 text-xs text-slate-300">
          Sem backend, sem envio de dados
        </span>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-slate-100 md:text-6xl">
            Antes do Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Diagnostique qualidade e consistencia dos dados antes da analise final.
            Entenda risco, prioridades e caminhos de tratamento com uma interface objetiva,
            privada e pronta para uso em producao.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#upload-local"
              className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-surface-800"
            >
              Analisar arquivo
            </a>
            <p className="text-sm text-slate-400">
              Todo o processamento acontece no seu dispositivo, sem backend.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-surface-600 bg-surface-900/75 p-4">
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Privacidade</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Arquivos permanecem no navegador durante upload, parsing e analise.
            Nenhum conteudo e transmitido para servidor.
          </p>
        </div>
      </div>
    </section>
  );
}
