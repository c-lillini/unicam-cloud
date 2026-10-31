/** Testo iniziale della vista "Tokenizza": mostra già i casi più interessanti. */
export const DEFAULT_TEXT = `Il cloud computing permette di noleggiare server a consumo.
Le parole comuni come "cloud" diventano un solo token, quelle rare come precipitevolissimevolmente vengono spezzate.
Numeri: 2026, 3.14159, 1234567890.    Spazi multipli, MAIUSCOLE, maiuscole.
Emoji e altri alfabeti: 🚀☁️ 云计算 クラウド.`;

export interface LanguageSample {
  code: string;
  label: string;
  text: string;
  /** È una traduzione della frase inglese (ha senso confrontarla con l'inglese). */
  translation: boolean;
}

/** La stessa frase in più lingue, più due righe "speciali" (codice ed emoji). */
export const LANGUAGE_SAMPLES: readonly LanguageSample[] = [
  {
    code: 'en',
    label: 'Inglese',
    text: 'Cloud computing lets you rent computing resources on demand, paying only for what you use.',
    translation: true,
  },
  {
    code: 'it',
    label: 'Italiano',
    text: 'Il cloud computing permette di noleggiare risorse di calcolo a consumo, pagando solo ciò che si usa.',
    translation: true,
  },
  {
    code: 'es',
    label: 'Spagnolo',
    text: 'La computación en la nube permite alquilar recursos de cómputo bajo demanda, pagando solo por lo que se usa.',
    translation: true,
  },
  {
    code: 'de',
    label: 'Tedesco',
    text: 'Cloud-Computing ermöglicht es, Rechenressourcen nach Bedarf zu mieten und nur für das zu bezahlen, was man nutzt.',
    translation: true,
  },
  {
    code: 'zh',
    label: 'Cinese',
    text: '云计算让你按需租用计算资源，只为实际使用的部分付费。',
    translation: true,
  },
  {
    code: 'ja',
    label: 'Giapponese',
    text: 'クラウドコンピューティングでは、計算資源を必要に応じて借り、使った分だけ支払います。',
    translation: true,
  },
  {
    code: 'ar',
    label: 'Arabo',
    text: 'تتيح الحوسبة السحابية استئجار موارد الحوسبة حسب الطلب، والدفع فقط مقابل ما تستخدمه.',
    translation: true,
  },
  {
    code: 'code',
    label: 'Codice',
    text: 'const active = servers.filter((s) => s.status === "running").length;',
    translation: false,
  },
  {
    code: 'emoji',
    label: 'Emoji',
    text: '☁️ 💻 🚀 📈 👩‍💻 🇮🇹',
    translation: false,
  },
];
