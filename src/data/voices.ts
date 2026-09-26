import { VoiceOption } from '../types';

export const VOICES: VoiceOption[] = [
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Masculina',
    pitch: 'Grave',
    age: 'Adulta / Madura',
    style: 'Cinematográfica, épica, grandiosa e imponente',
    recommendedFor: 'Trailers, aberturas de eventos, chamadas de impacto e lançamentos',
    avatarColor: 'from-amber-600 to-red-700',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Masculina',
    pitch: 'Grave / Média',
    age: 'Madura',
    style: 'Institucional, sóbria, confiante e autoridade',
    recommendedFor: 'Vídeos institucionais, corporativo, manifestos de marca e rádio',
    avatarColor: 'from-blue-600 to-indigo-800',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Masculina',
    pitch: 'Média',
    age: 'Jovem / Adulta',
    style: 'Dinâmica, comercial, expressiva e natural',
    recommendedFor: 'Comerciais de TV/Web, varejo, podcasts e promoções',
    avatarColor: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Feminina',
    pitch: 'Média',
    age: 'Jovem / Adulta',
    style: 'Clara, envolvente, moderna e publicitária',
    recommendedFor: 'Comerciais, branding, tutoriais de prestígio e redes sociais',
    avatarColor: 'from-fuchsia-600 to-pink-800',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Feminina',
    pitch: 'Suave / Média',
    age: 'Adulta',
    style: 'Sofisticada, elegante, narrativa e intimista',
    recommendedFor: 'Documentários, storytelling, narrativas poéticas e luxo',
    avatarColor: 'from-violet-600 to-purple-800',
  },
];

export const DIRECTION_PRESETS = [
  {
    title: 'Abertura de Grande Evento',
    badge: 'Cinematográfico',
    text: 'Voz masculina adulta, grave, encorpada, firme, madura e marcante, semelhante à de um locutor profissional de grandes eventos. Interpretação cinematográfica e natural. Começar com voz mais baixa e envolvente, aumentando a intensidade progressivamente com pausas dramáticas. Na frase final, grande energia e grandiosidade.',
  },
  {
    title: 'Institucional Corporativo',
    badge: 'Autoridade',
    text: 'Voz madura, calma, segura e respeitável. Dicção impecável, tom sóbrio e caloroso que transmite solidez, credibilidade e visão de futuro. Pausas naturais e ritmo constante.',
  },
  {
    title: 'Comercial Dinâmico & Varejo',
    badge: 'Alta Energia',
    text: 'Voz jovem, alegre, muito dinâmica e persuasiva. Ritmo ágil, dicção viva, transmitindo oportunidade irresistível, urgência positiva e entusiasmo contagiante.',
  },
  {
    title: 'Trailer de Cinema / Ação',
    badge: 'Tensão & Impacto',
    text: 'Voz masculina ultra grave, misteriosa, sussurrada no início e explodindo em autoridade e tensão no clímax. Pausas dramáticas longas que criam antecipação.',
  },
  {
    title: 'Manifesto & Storytelling',
    badge: 'Emocional',
    text: 'Voz intimista, suave, reflexiva e humana. Começa como uma conversa franca ao ouvido, ganha calor e termina inspiradora com sentimento de esperança.',
  },
];

export const INITIAL_EXAMPLE_DIRECTION = `Voz masculina adulta, grave, encorpada, firme, madura e marcante, semelhante à de um locutor profissional de grandes eventos. Interpretação cinematográfica e natural. Começar com uma voz mais baixa, séria e envolvente. A intensidade deve crescer progressivamente. Utilizar pausas naturais e dramáticas. Dar bastante peso às frases curtas. Na frase final, criar uma pausa dramática longa e então aumentar ao máximo a energia, força, entusiasmo e grandiosidade.`;

export const INITIAL_EXAMPLE_TEXT = `Boa noite, Três Corações!

[PAUSA]

Por algum motivo, o seu coração trouxe você até aqui hoje…

E isso que você sente
não é apenas som.

É história.

É emoção.

[PAUSA]

É o coração de uma cidade pulsando mais forte.

[PAUSA]

Três Corações.

Uma cidade feita de encontros, de histórias e de lembranças que atravessam gerações.

Uma cidade que carrega, em cada capítulo da sua história, um pouco do coração de cada um de vocês.

[PAUSA]

Planejamento.

Estrutura.

Segurança.

E, acima de tudo…

uma experiência preparada para ser inesquecível.

[PAUSA DRAMÁTICA]

Barry Eventos e Foco Produções…

com a realização da Prefeitura Municipal de Três Corações…

têm o orgulho de apresentar…

[PAUSA DRAMÁTICA MAIS LONGA]

A EXPO TRÊS CORAÇÕES 2026!

[PAUSA]

Prepare-se para viver uma noite de muita emoção, alegria e momentos que ficarão para sempre marcados em nossos corações!

[PAUSA]

Sejam todos muito bem-vindos…

à 54ª edição da Expo Três Corações!`;
