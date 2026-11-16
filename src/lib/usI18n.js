// Textos do fluxo de criação em inglês e espanhol (México).
// Os valores enviados ao servidor (mood, vocals) ficam em inglês; só os rótulos mudam.

export const PHONE_PREFIX = { US: '+1', CA: '+1', AU: '+61', MX: '+52' };

export const T = {
  en: {
    stepOf: (a, b) => `${a}/${b}`,
    back: '← Back',
    next: 'Next →',
    country: { title: 'Where are you sending this song from?', subtitle: 'We’ll show the music styles people love there.', confirm: 'Continue', change: 'change' },
    who: {
      title: 'Who is this song for?', subtitle: 'Pick the person you want to surprise.',
      recipient: 'Their name *', recipientPh: 'e.g. Emily', sender: 'Your first name *', senderPh: 'e.g. Michael',
      other: 'Someone else', otherPh: 'Who are they to you? (e.g. grandma, coach)',
      cards: [
        ['💑', 'Partner', 'Partner'], ['💍', 'Wife', 'Wife'], ['🤵', 'Husband', 'Husband'],
        ['👩', 'Mom', 'Mother'], ['👨', 'Dad', 'Father'], ['👧', 'Daughter', 'Daughter'], ['👦', 'Son', 'Son'],
        ['👵', 'Grandma', 'Grandmother'], ['👴', 'Grandpa', 'Grandfather'], ['👯', 'Best friend', 'Best friend'],
        ['👫', 'Sibling', 'Sibling'],
      ],
      swapped: 'The two names are the same. The first field is the person receiving the song; the second is you.',
    },
    occasion: {
      title: 'What’s the occasion?', subtitle: 'It shapes the feeling of the song.',
      list: ['Birthday', 'Anniversary', 'Wedding', 'Valentine’s Day', 'Mother’s Day', 'Father’s Day', 'Graduation', 'Christmas', 'Just because', 'In loving memory'],
      other: 'Other', otherPh: 'Tell us the occasion',
    },
    story: {
      title: (n) => `Your story with ${n || 'them'}`,
      subtitle: 'Memories, nicknames, inside jokes, what makes them special. No need to rhyme — just be honest.',
      ph: 'We met at… I call them… What I admire most is… I want this song to say…',
      count: (n, min) => `${n} characters · minimum ${min}`,
      names: 'Names that must appear (optional)', phrase: 'A phrase you want in the song (optional)',
    },
    sound: { title: 'Pick their sound', subtitle: 'The style sets the melody and the mood.' },
    vibe: {
      title: 'Feeling and voice', subtitle: 'How should it feel?',
      moodLabel: 'Feeling', vocalsLabel: 'Voice',
      moods: [['Heartfelt', 'Heartfelt'], ['Joyful', 'Joyful'], ['Romantic', 'Romantic'], ['Uplifting', 'Uplifting'], ['Nostalgic', 'Nostalgic'], ['Emotional', 'Emotional'], ['Celebratory', 'Celebratory'], ['Calm', 'Calm']],
      vocals: [['any', 'No preference'], ['female', 'Female voice'], ['male', 'Male voice'], ['duet', 'Duet']],
      faith: 'Include gentle faith imagery (God, prayer, blessings)',
      generate: 'Write my lyrics ✨', generating: 'Writing your lyrics…',
    },
    lyrics: {
      title: 'Your lyrics', subtitle: (n) => `Written for ${n}. Edit anything you like before we record it.`,
      label: 'Lyrics', regenerate: 'Write a new version', regenerating: 'Writing…',
      approve: 'Approve lyrics →',
    },
    contact: {
      title: 'Where should we send your song?', subtitle: 'Your free preview is ready in a few minutes. You only pay if you love it.',
      email: 'Email (optional)', emailPh: 'you@email.com', phone: 'WhatsApp number *', phonePh: 'Your number',
      terms: 'I agree to the Terms and Privacy Policy.', create: 'Create my song 🎵', creating: 'Creating your song…',
      phoneError: 'Please enter your WhatsApp number.', termsError: 'Please accept the terms to continue.',
      fine: 'Free preview · Secure card payment with Stripe · Prices in USD',
    },
    errors: { generic: 'Something went wrong. Please try again.', name: 'Please type both names.', who: 'Please choose who the song is for.', occasion: 'Please choose the occasion.', story: (min) => `Please write at least ${min} characters.`, genre: 'Please choose a style.' },
  },
  es: {
    stepOf: (a, b) => `${a}/${b}`,
    back: '← Atrás',
    next: 'Siguiente →',
    country: { title: '¿Desde dónde envías esta canción?', subtitle: 'Te mostraremos los ritmos favoritos de tu país.', confirm: 'Continuar', change: 'cambiar' },
    who: {
      title: '¿Para quién es la canción?', subtitle: 'Elige a la persona que quieres sorprender.',
      recipient: 'Su nombre *', recipientPh: 'Ej.: Sofía', sender: 'Tu primer nombre *', senderPh: 'Ej.: Carlos',
      other: 'Otra persona', otherPh: '¿Quién es para ti? (ej.: abuelita, padrino)',
      cards: [
        ['💑', 'Mi pareja', 'Pareja'], ['💍', 'Esposa', 'Esposa'], ['🤵', 'Esposo', 'Esposo'],
        ['👩', 'Mamá', 'Mamá'], ['👨', 'Papá', 'Papá'], ['👧', 'Hija', 'Hija'], ['👦', 'Hijo', 'Hijo'],
        ['👵', 'Abuela', 'Abuela'], ['👴', 'Abuelo', 'Abuelo'], ['👯', 'Mejor amiga/o', 'Mejor amigo'],
        ['👫', 'Hermana/o', 'Hermano'],
      ],
      swapped: 'Los dos nombres son iguales. El primero es quien recibe la canción; el segundo eres tú.',
    },
    occasion: {
      title: '¿Cuál es la ocasión?', subtitle: 'Define el sentimiento de la canción.',
      list: ['Cumpleaños', 'XV años', 'Aniversario', 'Boda', '10 de Mayo (Día de las Madres)', 'Día del Padre', 'San Valentín', 'Graduación', 'Navidad', 'Porque sí', 'En memoria'],
      other: 'Otra', otherPh: 'Cuéntanos la ocasión',
    },
    story: {
      title: (n) => `Su historia con ${n || 'esa persona'}`,
      subtitle: 'Recuerdos, apodos, momentos especiales, lo que la hace única. No tiene que rimar, solo sé sincero.',
      ph: 'Nos conocimos en… Le digo de cariño… Lo que más admiro es… Quiero que la canción diga…',
      count: (n, min) => `${n} caracteres · mínimo ${min}`,
      names: 'Nombres que deben aparecer (opcional)', phrase: 'Una frase que quieras en la canción (opcional)',
    },
    sound: { title: 'Elige el ritmo', subtitle: 'El ritmo define la melodía y la emoción.' },
    vibe: {
      title: 'Sentimiento y voz', subtitle: '¿Cómo quieres que se sienta?',
      moodLabel: 'Sentimiento', vocalsLabel: 'Voz',
      moods: [['Heartfelt', 'Emotiva'], ['Joyful', 'Alegre'], ['Romantic', 'Romántica'], ['Uplifting', 'Inspiradora'], ['Nostalgic', 'Nostálgica'], ['Emotional', 'Para llorar'], ['Celebratory', 'De fiesta'], ['Calm', 'Tranquila']],
      vocals: [['any', 'Sin preferencia'], ['female', 'Voz femenina'], ['male', 'Voz masculina'], ['duet', 'Dueto']],
      faith: 'Incluir referencias de fe (Dios, oración, bendiciones)',
      generate: 'Escribir mi letra ✨', generating: 'Escribiendo tu letra…',
    },
    lyrics: {
      title: 'Tu letra', subtitle: (n) => `Escrita para ${n}. Cambia lo que quieras antes de grabarla.`,
      label: 'Letra', regenerate: 'Escribir otra versión', regenerating: 'Escribiendo…',
      approve: 'Aprobar letra →',
    },
    contact: {
      title: '¿A dónde te enviamos tu canción?', subtitle: 'Tu vista previa gratis estará lista en unos minutos. Solo pagas si te encanta.',
      email: 'Correo (opcional)', emailPh: 'tu@correo.com', phone: 'Número de WhatsApp *', phonePh: 'Tu número',
      terms: 'Acepto los Términos y la Política de Privacidad.', create: 'Crear mi canción 🎵', creating: 'Creando tu canción…',
      phoneError: 'Escribe tu número de WhatsApp.', termsError: 'Acepta los términos para continuar.',
      fine: 'Vista previa gratis · Pago seguro con tarjeta (Stripe) · Precios en USD',
    },
    errors: { generic: 'Algo salió mal. Inténtalo de nuevo.', name: 'Escribe los dos nombres.', who: 'Elige para quién es la canción.', occasion: 'Elige la ocasión.', story: (min) => `Escribe al menos ${min} caracteres.`, genre: 'Elige un ritmo.' },
  },
};

export const textos = (lang) => T[lang] || T.en;
