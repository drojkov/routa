/** Подстановка {name} в строку словаря. Отсутствующие ключи остаются как есть — так их легко заметить. */
export function fmt(template: string, vars: Record<string, string | number> = {}) {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/**
 * То же, но значения могут быть React-узлами (ссылки внутри фразы).
 * Возвращает массив частей для вставки в JSX.
 */
export function fmtNodes(template: string, vars: Record<string, React.ReactNode>) {
  return template.split(/(\{\w+\})/g).map((part) => {
    const m = /^\{(\w+)\}$/.exec(part);
    return m && m[1] in vars ? vars[m[1]] : part;
  });
}
