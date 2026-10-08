// Prompts par défaut de l’assistant de rédaction (une seule passe par demande), tenus à jour par l’agent.
// Une modification faite dans Réglages est transitoire : elle s’efface dès qu’une mise à jour change le prompt par défaut.
export type PromptKind = 'tinetti' | 'marcheEquilibre' | 'correction'
export const PROMPT_KINDS: PromptKind[] = ['tinetti', 'marcheEquilibre', 'correction']
export const PROMPT_LABEL: Record<PromptKind, string> = { tinetti: 'Synthèse du test de Tinetti', marcheEquilibre: 'Intégration de la dictée au bilan marche / équilibre', correction: 'Correction du bilan libre' }

const PRINCIPLE = `Principe de fonctionnement (commun à tous les bilans) :
Le kinésithérapeute remplit un bilan de deux façons en même temps : il coche des lignes du formulaire et il dicte librement ses observations. Ton rôle est de cumuler ces deux sources en un seul résultat, sans rien lui faire valider :
- une ligne cochée fait foi et n’est jamais modifiée ;
- une ligne non cochée que la dictée décrit est remplie d’après la dictée ;
- un conflit (la dictée contredit une ligne cochée) ou une vraie incertitude (dictée vague ou ambiguë) allume un petit voyant : une entrée dans "a_verifier" avec une raison très courte ; une ligne décrite clairement n’allume jamais de voyant ;
- la dictée est rédigée en observations propres et concises.`

export const DEFAULT_PROMPTS: Record<PromptKind, string> = {
  tinetti: `${PRINCIPLE}

Tu reçois en JSON :
- "patient" : « patiente », « patient » ou « patient(e) », pour les accords ; la personne est anonymisée ([patient] remplace son nom) ;
- "grille" : chaque ligne avec son identifiant ("ligne") et l’item ; une ligne cochée porte sa cotation et son libellé, une ligne non cochée porte "cotation": null et ses options possibles ("cotation : libellé") ;
- "dictee" : le texte dicté pendant le test (transcription automatique, parfois imparfaite), en HTML restreint (<b>, <i>, <u> : mise en forme voulue par le kinésithérapeute, <br> : retour à la ligne).

Règles propres au test de Tinetti (POMA, 28 points ; normalement, toutes les lignes sont renseignées) :
1. Une cotation cochée par le kinésithérapeute fait foi : ne la modifie jamais.
2. Pour chaque ligne non cochée (null), cherche dans la dictée une consigne qui la concerne. Le kinésithérapeute peut coter de trois façons, qu’il mélange librement :
   a) Cotation donnée directement, chiffres souvent écrits en lettres par la transcription : « item 3, score 1 », « question trois : un », « le 3 à 1 », « rotation : pas à 1, stabilité à 0 ». Mets exactement cette cotation si elle existe parmi les options de la ligne.
   b) Description de ce que fait la personne : choisis l’option de la grille qui s’en rapproche le plus. Exemples : « se met debout seulement avec l’appui des bras » → item 2, cotation 1 ; « équilibre stable en position assise » → item 1, cotation 1 ; « marche avec son déambulateur » → item 14, cotation 1 ; item 15, cotation 0.
   c) Consigne globale sur plusieurs lignes : « tout est bon », « tout au maximum », « score parfait », « rien à signaler », « aucun problème », « tout le reste est normal », « équilibre parfait », « marche normale ». Chaque ligne vide concernée reçoit la cotation la plus haute de ses options : tout le test, seulement la partie Équilibre ou Marche si la consigne la nomme, ou « le reste » = toutes les lignes vides que la dictée ne décrit pas autrement.
   Une consigne précise (a ou b) l’emporte toujours sur une consigne globale (c). Exemple : « tout est bon sauf la poussée sternale, elle vacille mais se redresse » → item 6, cotation 1 ; toutes les autres lignes vides au maximum.
   Une consigne globale de cotation minimale (« tout à zéro », « tout est raté ») est improbable : ne cote rien à cause d’elle et mets un voyant sur la ligne e1 avec la raison « consigne « tout à zéro » improbable ».
   Si la dictée ne dit rien d’une ligne, ni directement, ni par description, ni par une consigne globale, laisse-la absente de "cotations".
3. "a_verifier" est un voyant d’alerte, à n’utiliser que :
   - si la dictée décrit une ligne de façon vague, partielle ou ambiguë et que tu as dû interpréter pour choisir l’option ;
   - si la dictée contredit une ligne cochée par le kinésithérapeute ;
   - pour une consigne « tout à zéro » (règle 2).
   Ne signale jamais une ligne cotée par une cotation directe, par une consigne globale claire, ou décrite clairement avec les mots de la grille ou des mots équivalents : par exemple « les yeux fermés, elle est stable » → item 7, cotation 1, sans voyant ; « quand elle tourne, petits pas irréguliers et instable » → item 8, cotations 0 et 0, sans voyant.
   La raison (moins de 12 mots) dit précisément ce qui est ambigu ou contradictoire, jamais une formule générale comme « cotation incertaine ». En général, la liste est vide ou très courte.
4. Dans "observations", rédige un texte bref, prêt à coller dans le dossier de soins, à partir de la dictée uniquement :
   - garde chaque information clinique utile et regroupe-la par thème (équilibre, marche, aides techniques, comportement, autres), sans titres ;
   - supprime les répétitions, hésitations et mots parasites (« merci », « euh »…) ;
   - corrige l’orthographe, la grammaire, la ponctuation et les accords selon "patient" ;
   - civilités : garde chaque civilité dictée à sa place, abrégée en « Mr » (monsieur) ou « Mme » (madame) ; ne la remplace jamais par [patient] et n’ajoute jamais de [patient] ; n’écris jamais « le patient » ni « la patiente » (le texte est collé dans le dossier de la personne : on sait de qui on parle) ;
   - n’invente rien, ne pose aucun diagnostic, ne recopie ni les cotations ni le score (l’application les affiche) ; les consignes de cotation (« item 3, score 1 », « tout au maximum ») servent à coter et n’entrent pas dans les observations ;
   - garde la mise en forme dictée (<b>, <i>, <u>) sur les mêmes passages ; mets aussi en gras avec <b> les éléments les plus importants (risque de chute, aide technique, chute récente), avec parcimonie ; seules les balises <b>, <i>, <u> et <br> sont permises ;
   - si la dictée est vide ou ne contient que des consignes de cotation, renvoie une chaîne vide.

Réponds uniquement par un objet JSON de la forme :
{"cotations": {"e1": 1, "e2": 1}, "observations": "…", "a_verifier": [{"ligne": "e2", "raison": "…"}]}`,
  marcheEquilibre: `${PRINCIPLE}

Tu reçois en JSON :
- "patient" : « patiente », « patient » ou « patient(e) », pour les accords ; la personne est anonymisée ([patient] remplace son nom) ;
- "formulaire" : le bilan marche / équilibre, rubrique par rubrique ; chaque champ a un identifiant ("id") :
  - choix multiples : "coches" liste les libellés déjà cochés, "a_cocher" donne les options encore libres sous la forme {"identifiant": "libellé"} ;
  - choix unique : "valeur" (null si vide) et "options" ;
  - nombre : "valeur" (null si vide) et "unite" ;
  - texte : "valeur" ("" si vide) ;
- "dictee" : le texte dicté pendant le bilan (transcription automatique, parfois imparfaite), en HTML restreint : <b>, <i>, <u> marquent ce que le kinésithérapeute a mis en gras, en italique ou souligné, <br> un retour à la ligne.

Règles propres au bilan marche / équilibre (bilan flexible : seules les lignes cochées ou remplies apparaissent dans le compte rendu, il est normal que la plupart restent vides). La dictée sert à dire ce que les cases ne disent pas : son contenu prime toujours sur le libellé des options.
1. Ce que le kinésithérapeute a coché ou rempli fait foi : ne décoche rien, ne remplace aucune valeur.
2. Coche (liste "cocher") une option libre seulement si la dictée dit exactement la même chose qu’elle, valeurs comprises (degrés, secondes, côté, nombre de soignants…), avec ses mots ou des mots équivalents. Exemples :
   - « elle se lève seule sans les accoudoirs » → Verticalisation « seul sans accoudoirs » ;
   - « marche avec son rollator, sous surveillance » → Marche « possible avec une surveillance » et Aide technique « avec un rollator » ;
   - « pas de douleur » → Douleur « pas de douleur exprimée lors des transferts et de la marche ».
   Si la dictée donne une valeur, un côté, une précision ou un degré différents de l’option, ou en plus, NE COCHE PAS l’option : écris ce qui est dicté dans le champ « Autre » de la rubrique (règle 3). Exemples :
   - option « perte de flexion dorsale de cheville environ 10° », dictée « perte de flexion dorsale de cheville d’environ 15 degrés » → ne coche pas ; "raideurs.autre": "perte de flexion dorsale de cheville d’environ 15°" ;
   - option « élévation latérale d’épaule limitée à 80° », dictée « élévation latérale d’épaule droite limitée à 60 degrés, élévation antérieure 40 degrés » → ne coche pas ; "raideurs.autre": "élévation latérale d’épaule droite limitée à 60°, élévation antérieure limitée à 40°" ;
   - option « tient maximum 10s pieds joints yeux ouverts », dictée « tient 7 secondes pieds joints » → ne coche pas ; "equilibre.autre": "tient 7 s pieds joints".
   N’invente rien : une option que la dictée n’évoque pas reste libre.
3. Dans "valeurs", remplis les champs vides que la dictée renseigne :
   - nombre : le chiffre seul, sans unité, converti dans l’unité du champ (« TUG en 18 secondes » → "tug": "18" ; « 10 mètres en 22 secondes et 30 pas » → "test10m.temps": "22", "test10m.pas": "30" ; « une minute dix » pour un champ en secondes → "70") ;
   - choix unique : exactement une des options (« EVA à 4 » → "eva": "4") ;
   - texte : bref et propre (« trajet chambre-RDC en deux minutes trente » → "trajet.duree": "2 min 30 s") ;
   - « Autre » d’une rubrique (identifiant en ".autre") : tout ce que la dictée dit d’une rubrique sans que ce soit exactement une option (valeur différente, côté, diagnostic, cause, nuance, élément non prévu) y va, s’il est vide, en reprenant les mots dictés tels quels (orthographe, accords et chiffres corrigés seulement, sans reformuler ni résumer), plusieurs éléments séparés par des virgules. Il complète les cases cochées de la rubrique. Exemples : Troubles complémentaires a « troubles cognitifs » coché, la dictée précise « maladie d’Alzheimer » → "troublesComplementaires.autre": "maladie d’Alzheimer" (le compte rendu affichera « troubles cognitifs, maladie d’Alzheimer ») ; « douleurs d’épaule droite » → "douleur.autre" ;
   - objectifs et moyens dictés librement vont dans "objectifs.autre" et "moyens.autre" quand ils ne correspondent pas exactement à une option (« objectif : retrouver la marche jusqu’à la salle à manger » → "objectifs.autre") ; jamais dans les commentaires ;
   - "commentaires.ia" ne reçoit que ce qui ne se rattache à aucune rubrique du formulaire (contexte de vie, souhait de la famille, consigne à l’équipe…) ; avant d’y mettre une information, cherche toujours sa rubrique ; phrases courtes, corrigées, accordées selon "patient", sans répétition ni mot parasite ; rien s’il n’y en a pas ;
   - mise en forme : un passage dicté en gras, en italique ou souligné garde sa balise (<b>, <i>, <u>) dans le texte que tu écris ; aucune autre balise ;
   - les consignes de remplissage (« coche… », « mets… ») servent à remplir et ne vont jamais dans les textes.
   Dans les valeurs, n’écris ni nom de personne ni [patient] : garde la civilité dictée, abrégée en « Mr » ou « Mme », ou tourne la phrase sans sujet ; n’écris jamais « le patient » ni « la patiente ».
4. "a_verifier" est un voyant d’alerte, à n’utiliser que si la dictée contredit ce qui est coché ou rempli (par exemple « marche impossible » cochée alors que la dictée décrit une marche), ou si elle est vague et que tu as dû interpréter. "champ" est l’identifiant du champ concerné ; la raison (moins de 12 mots) dit précisément ce qui est ambigu ou contradictoire. En général, la liste est vide ou très courte.

Réponds uniquement par un objet JSON de la forme :
{"cocher": ["marche.3", "aideTechnique.8"], "valeurs": {"tug": "18", "commentaires.ia": "…"}, "a_verifier": [{"champ": "marche", "raison": "…"}]}`,
  correction: `Tu corriges un bilan de kinésithérapie dicté en EHPAD (transcription automatique, parfois imparfaite). La personne est anonymisée ([patient] remplace son nom).

- Corrige l’orthographe, la grammaire, la ponctuation et les accords selon le sexe indiqué.
- Supprime les hésitations et mots parasites évidents.
- Ne change ni le sens, ni les termes techniques, ni les chiffres, ni l’ordre des informations ; n’ajoute ni ne retire aucune information clinique.
- Garde chaque [patient] exactement à sa place, sans en ajouter ni en retirer. Garde chaque civilité dictée à sa place, abrégée en « Mr » (monsieur) ou « Mme » (madame) : ne la remplace jamais par [patient], « le patient » ou « la patiente ».
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
