import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}

export default function AIMessageContent({ content }: { content: string }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const nodes: ReactNode[] = [];
  let bulletItems: string[] = [];

  const flushBullets = () => {
    if (!bulletItems.length) return;
    const items = bulletItems;
    bulletItems = [];
    nodes.push(
      <ul key={`list-${nodes.length}`} className="my-2 space-y-1.5 pl-4 text-sm leading-6 marker:text-cyan list-disc">
        {items.map((item, index) => <li key={index}>{renderInline(item)}</li>)}
      </ul>
    );
  };

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      flushBullets();
      return;
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/);
    if (bullet) {
      bulletItems.push(bullet[1]);
      return;
    }

    flushBullets();
    const heading = line.match(/^#{1,4}\s+(.+)$/);
    if (heading) {
      nodes.push(
        <p key={`heading-${index}`} className="mt-2 font-semibold text-white">
          {renderInline(heading[1])}
        </p>
      );
      return;
    }

    nodes.push(
      <p key={`line-${index}`} className="my-1 text-sm leading-6">
        {renderInline(line)}
      </p>
    );
  });
  flushBullets();

  return <>{nodes}</>;
}
