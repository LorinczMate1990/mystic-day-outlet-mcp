import { useEffect, useRef } from 'react';

interface ShadowHtmlProps {
  html: string;
  className?: string;
}

function ShadowHtml({ html, className }: ShadowHtmlProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);

  useEffect(() => {
    if (!shadowRef.current) {
      shadowRef.current = hostRef.current!.attachShadow({ mode: 'open' });
    }
    shadowRef.current.innerHTML = html;
  }, [html]);

  return <div ref={hostRef} className={className} />;
}

export default ShadowHtml;
