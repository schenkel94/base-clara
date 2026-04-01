import { InfoBadge } from "@/components/ui/InfoBadge";

export function HeroSection() {
  return (
    <section className="rounded-3xl border border-surface-600/80 bg-gradient-to-b from-surface-700/85 to-surface-900/85 p-6 shadow-glow md:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <InfoBadge>Processamento 100% local, 0 riscos a sua privacidade</InfoBadge>
        <span className="rounded-full border border-slate-500/50 bg-surface-900/80 px-3 py-1 text-xs text-slate-300">
          Sem backend, sem envio de dados
        </span>
      </div>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
        <div className="space-y-6">
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-slate-100 md:text-6xl">
            Base Clara
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-slate-300 md:text-lg">
            Diagnostique qualidade e consistencia dos dados antes da analise.
            Entenda risco, prioridades e caminhos de tratamento com uma interface objetiva,
            privada e pronta para uso em producao.
          </p>

          <div className="flex flex-wrap items-center gap-4">
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

        <div className="flex flex-col items-start gap-4 lg:items-end">
          <div className="w-full max-w-sm lg:text-right">
            <p className="font-display text-2xl font-semibold tracking-tight text-slate-100">
              Mario Schenkel
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">Data Analyst</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm lg:justify-end">
              <a
                href="https://schenkel94.github.io/portfolio/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 transition-colors hover:text-cyan-200"
              >
                Portfolio
              </a>
              <span className="text-slate-600">|</span>
              <a
                href="https://www.linkedin.com/in/marioschenkel/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-300 transition-colors hover:text-cyan-200"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-surface-600 bg-surface-900/75 p-4">
            <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Aviso de Privacidade</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Este app usa apenas cookies tecnicos para lembrar preferencias locais.
              Nenhum dado pessoal ou conteudo de arquivo e coletado, enviado ou compartilhado.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
