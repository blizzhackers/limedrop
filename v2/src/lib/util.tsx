// Helper to render Diablo color codes as spans
export function renderColorText(str: string) {
  if (!str) return null;
  const parts: React.ReactNode[] = [];
  let i = 0;
  let color = "";
  let buffer = "";
  while (i < str.length) {
    if ((str[i] === "ÿ" || str[i] === "˙") && str[i + 1] === "c") {
      if (buffer)
        parts.push(
          <span
            key={parts.length}
            className={color ? `color${color}` : undefined}
          >
            {buffer}
          </span>,
        );
      color = str[i + 2];
      buffer = "";
      i += 3;
    } else if (str[i] === "\n") {
      if (buffer)
        parts.push(
          <span
            key={parts.length}
            className={color ? `color${color}` : undefined}
          >
            {buffer}
          </span>,
        );
      parts.push(<br key={parts.length} />);
      buffer = "";
      i++;
    } else {
      buffer += str[i];
      i++;
    }
  }
  if (buffer)
    parts.push(
      <span key={parts.length} className={color ? `color${color}` : undefined}>
        {buffer}
      </span>,
    );
  return parts;
}
