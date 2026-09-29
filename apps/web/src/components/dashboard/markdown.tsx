import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/** Компактный markdown для ответов моделей в чате. */
const components: Components = {
  p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  h1: ({ children }) => <h3 className="mt-4 mb-2 text-lg font-semibold">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-4 mb-2 font-semibold">{children}</h3>,
  h3: ({ children }) => <h4 className="mt-3 mb-1 font-semibold">{children}</h4>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-strong underline underline-offset-2">
      {children}
    </a>
  ),
  pre: ({ children }) => <pre className="my-3 overflow-x-auto rounded-xl bg-[#111] p-3 font-mono text-[12px] leading-relaxed text-white/90">{children}</pre>,
  code: ({ className, children }) =>
    className ? <code className={className}>{children}</code> : <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">{children}</code>,
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border-b border-border bg-muted/60 px-2 py-1.5 font-medium">{children}</th>,
  td: ({ children }) => <td className="border-b border-border px-2 py-1.5 align-top">{children}</td>,
  blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-border pl-3 text-muted-foreground">{children}</blockquote>,
};

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <Markdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </Markdown>
  );
}
