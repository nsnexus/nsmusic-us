// Textos da cópia do site brasileiro (passo a passo /criar e página de entrega) em inglês e
// espanhol (México). A estrutura de cada etapa é a mesma do Brasil; só o idioma e o pagamento mudam.
// Os valores enviados ao servidor (relação, humor, voz) ficam em inglês, como a API /api/us espera.

const RECIPIENTS_EN = [
  { id: 'partner', label: 'Girlfriend / Boyfriend', icon: '💗', sub: 'Love & passion', relations: [['Girlfriend', 'Girlfriend'], ['Boyfriend', 'Boyfriend']] },
  { id: 'spouse', label: 'Wife / Husband', icon: '💍', sub: 'Marriage', relations: [['Wife', 'Wife'], ['Husband', 'Husband']] },
  { id: 'parent', label: 'Mom / Dad', icon: '👩', sub: 'Dear family', relations: [['Mom', 'Mother'], ['Dad', 'Father']] },
  { id: 'child', label: 'Daughter / Son', icon: '🧒', sub: 'A parent’s love', relations: [['Daughter', 'Daughter'], ['Son', 'Son']] },
  { id: 'friend', label: 'Best friend', icon: '🤝', sub: 'True friendship', value: 'Best friend' },
  { id: 'sibling', label: 'Sister / Brother', icon: '👫', sub: 'Siblings', relations: [['Sister', 'Sister'], ['Brother', 'Brother']] },
  { id: 'grand', label: 'Grandma / Grandpa', icon: '👵', sub: 'Grandparents’ love', relations: [['Grandma', 'Grandmother'], ['Grandpa', 'Grandfather']] },
  { id: 'family', label: 'The whole family', icon: '👨‍👩‍👧', sub: 'A family tribute', value: 'Family' },
  { id: 'self', label: 'For me', icon: '🎤', sub: 'My own song', value: 'Myself' },
  { id: 'other', label: 'Someone else', icon: '✍️', sub: 'I’ll write it' },
];

const RECIPIENTS_ES = [
  { id: 'partner', label: 'Novia / Novio', icon: '💗', sub: 'Amor y pasión', relations: [['Novia', 'Girlfriend'], ['Novio', 'Boyfriend']] },
  { id: 'spouse', label: 'Esposa / Esposo', icon: '💍', sub: 'Matrimonio', relations: [['Esposa', 'Wife'], ['Esposo', 'Husband']] },
  { id: 'parent', label: 'Mamá / Papá', icon: '👩', sub: 'Familia querida', relations: [['Mamá', 'Mother'], ['Papá', 'Father']] },
  { id: 'child', label: 'Hija / Hijo', icon: '🧒', sub: 'Amor de familia', relations: [['Hija', 'Daughter'], ['Hijo', 'Son']] },
  { id: 'friend', label: 'Mejor amiga / amigo', icon: '🤝', sub: 'Amistad verdadera', value: 'Best friend' },
  { id: 'sibling', label: 'Hermana / Hermano', icon: '👫', sub: 'Hermandad', relations: [['Hermana', 'Sister'], ['Hermano', 'Brother']] },
  { id: 'grand', label: 'Abuela / Abuelo', icon: '👵', sub: 'Cariño de abuelos', relations: [['Abuela', 'Grandmother'], ['Abuelo', 'Grandfather']] },
  { id: 'family', label: 'Toda la familia', icon: '👨‍👩‍👧', sub: 'Homenaje familiar', value: 'Family' },
  { id: 'self', label: 'Para mí', icon: '🎤', sub: 'Mi propia canción', value: 'Myself' },
  { id: 'other', label: 'Otra persona', icon: '✍️', sub: 'Yo lo escribo' },
];

// [rótulo, ícone, valor enviado ao servidor]
const MOODS = {
  en: [
    ['Emotional', '🥹', 'Touch the heart', 'emotional'], ['Joyful', '😄', 'Positive, upbeat vibe', 'joyful'],
    ['Romantic', '💖', 'A loving declaration', 'romantic'], ['Calm', '🍃', 'Soft and intimate', 'calm'],
    ['Nostalgic', '🍂', 'Memories and good times', 'nostalgic'], ['Energetic', '🔥', 'Vibrant, strong rhythm', 'energetic'],
    ['Festive', '🎉', 'Party and celebration', 'celebratory'], ['Inspiring', '✨', 'Strength and hope', 'hopeful'],
    ['Fun', '☀️', 'Light and playful', 'uplifting'], ['Tender tribute', '🕊️', 'In loving memory', 'heartfelt'],
  ],
  es: [
    ['Emotiva', '🥹', 'Para tocar el corazón', 'emotional'], ['Alegre', '😄', 'Buena vibra y energía', 'joyful'],
    ['Romántica', '💖', 'Una declaración de amor', 'romantic'], ['Tranquila', '🍃', 'Suave e íntima', 'calm'],
    ['Nostálgica', '🍂', 'Recuerdos y bonitos tiempos', 'nostalgic'], ['Enérgica', '🔥', 'Ritmo fuerte y vibrante', 'energetic'],
    ['Festiva', '🎉', 'Fiesta y celebración', 'celebratory'], ['Inspiradora', '✨', 'Fuerza y esperanza', 'hopeful'],
    ['Divertida', '☀️', 'Ligera y alegre', 'uplifting'], ['Homenaje tierno', '🕊️', 'En memoria de alguien', 'heartfelt'],
  ],
};

const OCCASIONS = {
  en: [
    ['Birthday', '🎂'], ['Love declaration', '💌'], ['Wedding anniversary', '💎'], ['Tribute', '🌟'], ['Surprise', '🎁'],
    ['Mother’s Day', '🌷'], ['Valentine’s Day', '💝'], ['Proposal', '💍'], ['Dating anniversary', '💞'], ['Wedding', '💒'],
    ['Graduation', '🎓'], ['Christmas', '🎁'],
  ],
  es: [
    ['Cumpleaños', '🎂'], ['XV años', '👑'], ['Declaración de amor', '💌'], ['Aniversario de bodas', '💎'], ['Homenaje', '🌟'],
    ['10 de Mayo', '🌷'], ['San Valentín', '💝'], ['Pedida de mano', '💍'], ['Aniversario de novios', '💞'], ['Boda', '💒'],
    ['Graduación', '🎓'], ['Navidad', '🎁'],
  ],
};

export const TEXTOS_BR = {
  en: {
    brand: 'Stories that become songs.',
    newSong: 'New song',
    recipients: RECIPIENTS_EN,
    moods: MOODS.en,
    occasions: OCCASIONS.en,
    loading: 'Loading…',
    country: { title: 'Where are you sending this song from?', subtitle: 'We’ll show the music styles people love there.', confirm: 'Continue', change: 'change' },
    s1: {
      title: 'Who is this song for', subtitle: 'Choose who you want to create this special gift for.',
      pick: 'Choose an option', pickPair: (a) => `Choose: ${a.join(' or ')}`, whoIs: 'Who is it?',
      otherPh: 'What’s your relationship? (e.g. my mother-in-law, my coach)…',
      nameTitle: 'Their name', nameSub: <>The <b>person receiving the song</b>: their name or nickname appears in the lyrics <b>exactly as you type it</b>.</>,
      nameLabel: 'Name of the person receiving the gift *', namePh: 'e.g. Emily', nameMissing: 'Type the name of the person receiving it',
      selfTitle: 'Your name', selfSub: <>The song is yours: your name appears in the lyrics <b>exactly as you type it</b>.</>,
      senderLabel: 'Your first name (you, the person giving the gift) *', senderSelf: 'Your first name *', senderPh: 'e.g. Michael', senderMissing: 'Type your first name',
      swapped: <>The two names are the same. The first field is <b>who receives</b> the gift; this one is <b>your</b> name. Please check before you continue.</>,
      occTitle: 'What’s the occasion?', occSub: 'It sets the right feeling for the moment.', occPick: 'Choose an occasion',
      occOther: 'Other occasion…', occOtherLabel: 'What’s the occasion?', occOtherPh: 'e.g. Retirement, Farewell, A fresh start…',
    },
    s2: {
      title: 'Your story together',
      subtitle: (n) => `Share special moments, sweet nicknames or what makes ${n || 'them'} so special. No need to rhyme — just tell it your way.`,
      ph: 'We met when… I call them… What I admire most is… I want this song to say…',
      count: (n) => `${n} characters · minimum 50`, missing: 'Write at least 50 characters',
      names: 'Names that must appear (optional)', namesPh: 'e.g. kids’ names, pet’s name',
      phrase: 'A phrase you want in the song (optional)', phrasePh: 'e.g. “You are my sunshine”',
      ai: 'Suggest a story with AI', aiBusy: 'Writing your story…', aiError: 'We couldn’t create a suggestion right now. Please try again.',
    },
    s3: {
      genreTitle: 'Music style', genreSub: 'The style sets the melody and the emotion.', genrePick: 'Choose a style',
      moodTitle: 'Song mood', moodSub: 'Which feeling should lead the song?', moodPick: 'Choose the mood',
      voiceTitle: 'Voice', voiceSub: 'Who would you like to sing your song?', voicePick: 'Choose the voice',
      voices: [['male', 'Male voice', '🎙️', 'Deep and striking'], ['female', 'Female voice', '🎙️', 'Sweet and expressive'], ['duet', 'Duet', '🎤', 'Male + female']],
      faith: 'Include gentle faith imagery (God, prayer, blessings)',
    },
    s4: {
      title: 'Your gift starts like this', subtitle: 'Check the summary before we write your personalized lyrics.',
      for: (n) => `For ${n}`, from: 'From', voice: 'Voice',
      phoneLabel: 'Your WhatsApp to receive the link *', phoneSub: 'We’ll send a secure link so you can listen to the preview and download your song anytime.',
      phonePh: 'Your number', phoneMissing: 'Please enter your WhatsApp number.',
      emailLabel: 'Email (optional)', emailPh: 'you@email.com',
      terms: <>By continuing, you agree to our <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Terms</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Privacy Policy</a>. You’ll review the lyrics before the song is recorded.</>,
      termsMissing: 'Please accept the terms to continue.',
    },
    s5: {
      generating: 'Writing your lyrics… ✨', generatingSub: (n) => `Our songwriting AI is turning your memories into verses for ${n || 'your special someone'}.`,
      title: 'Your exclusive lyrics ✨', subtitle: (n) => `Written with love for ${n || 'your special someone'}. If you like it, approve it to record!`,
      label: 'LYRICS', edit: '✏️ Edit lyrics', cancel: '✕ Cancel', save: '💾 Save lyrics', saved: '✅ Lyrics updated! This version will be recorded.',
      regenerate: '↻ Write a new version', regenerating: 'Writing…', error: 'We couldn’t write the lyrics right now', tryAgain: 'Try again',
      tooShort: 'The lyrics need at least 80 characters.',
    },
    dock: ['Continue to the story →', 'Choose the sound →', 'Review my gift →', 'Write my lyrics →'],
    writing: 'Writing your lyrics…', approve: 'Approve lyrics & create song →', creating: 'Starting the recording…',
    back: '← Back',
    errors: { generic: 'Something went wrong. Please try again.', load: 'We could not load the page. Please refresh.' },
  },
  es: {
    brand: 'Historias que se vuelven canciones.',
    newSong: 'Nueva canción',
    recipients: RECIPIENTS_ES,
    moods: MOODS.es,
    occasions: OCCASIONS.es,
    loading: 'Cargando…',
    country: { title: '¿Desde dónde envías esta canción?', subtitle: 'Te mostraremos los ritmos favoritos de tu país.', confirm: 'Continuar', change: 'cambiar' },
    s1: {
      title: '¿Para quién es la canción?', subtitle: 'Elige para quién quieres crear este regalo especial.',
      pick: 'Elige una opción', pickPair: (a) => `Elige: ${a.join(' o ')}`, whoIs: '¿Quién es?',
      otherPh: '¿Qué relación tienen? (ej.: mi suegra, mi entrenador)…',
      nameTitle: 'Su nombre', nameSub: <>La <b>persona homenajeada</b>: su nombre o apodo aparece en la letra <b>tal como lo escribas</b>.</>,
      nameLabel: 'Nombre de quien recibe el regalo *', namePh: 'Ej.: Sofía', nameMissing: 'Escribe el nombre de quien recibe',
      selfTitle: 'Tu nombre', selfSub: <>La canción es tuya: tu nombre aparece en la letra <b>tal como lo escribas</b>.</>,
      senderLabel: 'Tu primer nombre (quien da el regalo) *', senderSelf: 'Tu primer nombre *', senderPh: 'Ej.: Carlos', senderMissing: 'Escribe tu primer nombre',
      swapped: <>Los dos nombres son iguales. El primero es <b>quien recibe</b> el regalo; este es <b>tu</b> nombre. Revísalo antes de continuar.</>,
      occTitle: '¿Cuál es la ocasión?', occSub: 'Así la canción tiene el sentimiento justo para el momento.', occPick: 'Elige una ocasión',
      occOther: 'Otra ocasión…', occOtherLabel: '¿Cuál es la ocasión?', occOtherPh: 'Ej.: Jubilación, Despedida, Un nuevo comienzo…',
    },
    s2: {
      title: 'Su historia',
      subtitle: (n) => `Cuenta momentos especiales, apodos de cariño o lo que hace a ${n || 'esa persona'} tan especial. No hace falta rimar: cuéntalo a tu manera.`,
      ph: 'Nos conocimos cuando… le digo… lo que más admiro es… quiero que esta canción diga…',
      count: (n) => `${n} caracteres · mínimo 50`, missing: 'Escribe al menos 50 caracteres',
      names: 'Nombres que deben aparecer (opcional)', namesPh: 'Ej.: nombres de los hijos, de la mascota',
      phrase: 'Una frase que quieras en la canción (opcional)', phrasePh: 'Ej.: “Eres mi sol”',
      ai: 'Sugerir historia con IA', aiBusy: 'Escribiendo tu historia…', aiError: 'No pudimos crear una sugerencia ahora. Intenta de nuevo.',
    },
    s3: {
      genreTitle: 'Ritmo', genreSub: 'El ritmo define la melodía y la emoción.', genrePick: 'Elige un ritmo',
      moodTitle: 'Ambiente de la canción', moodSub: '¿Qué sentimiento debe predominar?', moodPick: 'Elige el ambiente',
      voiceTitle: 'Tipo de voz', voiceSub: '¿Quién quieres que cante tu canción?', voicePick: 'Elige la voz',
      voices: [['male', 'Voz masculina', '🎙️', 'Grave y marcante'], ['female', 'Voz femenina', '🎙️', 'Dulce y expresiva'], ['duet', 'Dueto', '🎤', 'Masculina + femenina']],
      faith: 'Incluir imágenes de fe (Dios, oración, bendiciones)',
    },
    s4: {
      title: 'Tu regalo empieza así', subtitle: 'Revisa el resumen antes de que escribamos tu letra personalizada.',
      for: (n) => `Para ${n}`, from: 'De', voice: 'Voz',
      phoneLabel: 'Tu WhatsApp para recibir el enlace *', phoneSub: 'Te enviamos un enlace seguro para escuchar el adelanto y descargar tu canción cuando quieras.',
      phonePh: 'Tu número', phoneMissing: 'Escribe tu número de WhatsApp.',
      emailLabel: 'Correo (opcional)', emailPh: 'tu@correo.com',
      terms: <>Al continuar, aceptas los <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Términos</a> y la <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Privacidad</a>. Revisarás la letra antes de grabar la canción.</>,
      termsMissing: 'Acepta los términos para continuar.',
    },
    s5: {
      generating: 'Escribiendo tu letra… ✨', generatingSub: (n) => `Nuestra IA compositora está convirtiendo tus recuerdos en versos para ${n || 'esa persona especial'}.`,
      title: 'Tu letra exclusiva ✨', subtitle: (n) => `Escrita con amor para ${n || 'esa persona especial'}. Si te gusta, apruébala para grabar.`,
      label: 'LETRA', edit: '✏️ Editar letra', cancel: '✕ Cancelar', save: '💾 Guardar letra', saved: '✅ ¡Letra actualizada! Esta versión se grabará.',
      regenerate: '↻ Escribir otra versión', regenerating: 'Escribiendo…', error: 'No pudimos escribir la letra ahora', tryAgain: 'Intentar de nuevo',
      tooShort: 'La letra necesita al menos 80 caracteres.',
    },
    dock: ['Continuar a la historia →', 'Elegir el ritmo →', 'Revisar mi regalo →', 'Escribir mi letra →'],
    writing: 'Escribiendo tu letra…', approve: 'Aprobar letra y crear canción →', creating: 'Iniciando la grabación…',
    back: '← Atrás',
    errors: { generic: 'Algo salió mal. Inténtalo de nuevo.', load: 'No pudimos cargar la página. Actualízala.' },
  },
};

export const textosBr = (lang) => TEXTOS_BR[lang] || TEXTOS_BR.en;
