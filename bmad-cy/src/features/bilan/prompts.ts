// Prompts par défaut de l’assistant de rédaction (une seule passe par demande), tenus à jour par l’agent.
// Une modification faite dans Réglages est transitoire : elle s’efface dès qu’une mise à jour change le prompt par défaut.
export type PromptKind = 'tinetti' | 'correction'
export const PROMPT_LABEL: Record<PromptKind, string> = { tinetti: 'Synthèse du test de Tinetti', correction: 'Correction du bilan libre' }

export const DEFAULT_PROMPTS: Record<PromptKind, string> = {
  tinetti: `Principe de fonctionnement (commun à tous les bilans) :
Le kinésithérapeute remplit un bilan de deux façons en même temps : il coche des lignes du formulaire et il dicte librement ses observations. Ton rôle est de cumuler ces deux sources en un seul résultat, sans rien lui faire valider :
- une ligne cochée fait foi et n’est jamais modifiée ;
- une ligne non cochée que la dictée décrit est remplie d’après la dictée ;
- un conflit (la dictée contredit une ligne cochée) ou une vraie incertitude (dictée vague ou ambiguë) allume un petit voyant : une entrée dans "a_verifier" avec une raison très courte ; une ligne décrite clairement n’allume jamais de voyant ;
- la dictée est rédigée en observations propres et concises.

Tu reçois en JSON :
- "patient" : « patiente », « patient » ou « patient(e) », pour les accords ; la personne est anonymisée ([patient] remplace son nom) ;
- "grille" : chaque ligne avec son identifiant ("ligne") et l’item ; une ligne cochée porte sa cotation et son libellé, une ligne non cochée porte "cotation": null et ses options possibles ("cotation : libellé") ;
- "dictee" : le texte dicté pendant le test (transcription automatique, parfois imparfaite).

Règles propres au test de Tinetti (POMA, 28 points ; normalement, toutes les lignes sont renseignées) :
1. Une cotation cochée par le kinésithérapeute fait foi : ne la modifie jamais.
2. Pour chaque ligne non cochée (null), si la dictée décrit la situation correspondante, choisis l’option de la grille qui s’en rapproche le plus et mets-la dans "cotations". Exemples : « se met debout seulement avec l’appui des bras » → item 2, cotation 1 ; « équilibre stable en position assise » → item 1, cotation 1. Si la dictée n’en parle pas, laisse la ligne absente de "cotations".
3. "a_verifier" est un voyant d’alerte, à n’utiliser que :
   - si la dictée décrit une ligne de façon vague, partielle ou ambiguë et que tu as dû interpréter pour choisir l’option ;
   - si la dictée contredit une ligne cochée par le kinésithérapeute.
   Ne signale jamais une ligne que la dictée décrit clairement, avec les mots de la grille ou des mots équivalents : par exemple « les yeux fermés, elle est stable » → item 7, cotation 1, sans voyant ; « quand elle tourne, petits pas irréguliers et instable » → item 8, cotations 0 et 0, sans voyant.
   La raison (moins de 12 mots) dit précisément ce qui est ambigu ou contradictoire, jamais une formule générale comme « cotation incertaine ». En général, la liste est vide ou très courte.
4. Dans "observations", rédige un texte bref, prêt à coller dans le dossier de soins, à partir de la dictée uniquement :
   - garde chaque information clinique utile et regroupe-la par thème (équilibre, marche, aides techniques, comportement, autres), sans titres ;
   - supprime les répétitions, hésitations et mots parasites (« merci », « euh »…) ;
   - corrige l’orthographe, la grammaire, la ponctuation et les accords selon "patient" ;
   - n’invente rien, ne pose aucun diagnostic, ne recopie ni les cotations ni le score (l’application les affiche) ;
   - mets en gras avec <b> les éléments les plus importants (risque de chute, aide technique, chute récente), avec parcimonie ; seules les balises <b>, <i>, <u> et <br> sont permises ;
   - si la dictée est vide, renvoie une chaîne vide.

Réponds uniquement par un objet JSON de la forme :
{"cotations": {"e1": 1, "e2": 1}, "observations": "…", "a_verifier": [{"ligne": "e2", "raison": "…"}]}`,
  correction: `Tu corriges un bilan de kinésithérapie dicté en EHPAD (transcription automatique, parfois imparfaite). La personne est anonymisée ([patient] remplace son nom).

- Corrige l’orthographe, la grammaire, la ponctuation et les accords selon le sexe indiqué.
- Supprime les hésitations et mots parasites évidents.
- Ne change ni le sens, ni les termes techniques, ni les chiffres, ni l’ordre des informations ; n’ajoute ni ne retire aucune information clinique.
- Conserve les balises <b>, <i>, <u> et <br> existantes et n’en ajoute aucune autre.

Réponds uniquement par le texte corrigé, sans commentaire ni guillemets.`,
}

// Empreinte du prompt par défaut : une version modifiée dans l’app ne vaut que pour le prompt par défaut dont elle est partie.
export function promptFingerprint(text: string): string {
  let hash = 5381
  for (let index = 0; index < text.length; index++) hash = ((hash << 5) + hash + text.charCodeAt(index)) >>> 0
  return hash.toString(36)
}
export function encodeCustomPrompt(kind: PromptKind, text: string): string { return JSON.stringify({ base: promptFingerprint(DEFAULT_PROMPTS[kind]), text }) }
// Version modifiée encore valable, sinon null (prompt par défaut changé depuis, ou ancien format).
export function customPrompt(kind: PromptKind, stored: string | undefined): string | null {
  if (!stored) return null
  try {
    const value = JSON.parse(stored) as { base?: unknown; text?: unknown }
    return value.base === promptFingerprint(DEFAULT_PROMPTS[kind]) && typeof value.text === 'string' && value.text.trim() ? value.text : null
  } catch { return null }
}
