import { icone3dDe } from '@/lib/icones3d';

// Desenha o ícone 3D de um emoji. É decorativo (o texto do cartão já diz o que é), por isso
// alt vazio. Sem ícone mapeado, mostra o próprio emoji.
export default function Icone3D({ emoji, src: srcFixo, size = 44, className = 'usw-ic', prioridade = false }) {
  const src = srcFixo || icone3dDe(emoji);
  if (!src) return <span className={className} aria-hidden="true">{emoji}</span>;
  return (
    <span className={className} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading={prioridade ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
