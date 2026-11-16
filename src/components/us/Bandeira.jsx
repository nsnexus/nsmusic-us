// Bandeira do país como imagem (flag-icons, MIT — ver public/flags/LICENSE). O emoji de bandeira
// não aparece no Windows (vira "US", "CA"...), por isso a imagem. Código desconhecido não desenha nada.
export default function Bandeira({ code, size = 22 }) {
  const c = String(code || '').toLowerCase();
  if (!/^[a-z]{2}$/.test(c)) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/flags/${c}.svg`}
      alt=""
      aria-hidden="true"
      width={Math.round(size * 4 / 3)}
      height={size}
      style={{ borderRadius: '3px', boxShadow: '0 0 0 1px rgba(30, 27, 75, 0.12)', objectFit: 'cover', flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
}
