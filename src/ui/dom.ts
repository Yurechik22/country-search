export type Child = Node | string | null | undefined | false;

export interface ElementOptions {
  className?: string;
  text?: string;
  attrs?: Record<string, string>;
}

/**
 * Small DOM factory: creates an element, sets text via textContent and
 * appends children. Never parses HTML strings, so data from the API cannot
 * inject markup.
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  children: Child[] = [],
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);

  if (options.className) element.className = options.className;
  if (options.text !== undefined) element.textContent = options.text;
  for (const [name, value] of Object.entries(options.attrs ?? {})) {
    element.setAttribute(name, value);
  }

  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    element.append(child);
  }

  return element;
}
