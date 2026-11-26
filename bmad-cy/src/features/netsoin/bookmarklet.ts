// Favori Chrome « Remplir le TUG » pour NetSoin (logiciel de la résidence, sur le Mac). Sur l’iPhone, « Copier pour NetSoin »
// met les 5 durées dans le presse-papiers (partagé avec le Mac) ; sur la page du TUG de NetSoin, un clic sur le favori lit le
// presse-papiers (ou demande de coller) et range chaque durée dans la case dont la ligne porte son libellé :
// « se lève du fauteuil », « marche 3 mètres », « demi-tour », « revient au fauteuil », « se rassied ».
// Rien n’est envoyé nulle part : le favori ne fait que remplir la page ouverte.
export const TUG_LABELS = ['l[eè]ve du fauteuil', 'marche 3 m', 'demi-tour', 'revient au fauteuil', 'rassied']

// Texte copié pour NetSoin : les 5 durées séparées par des tabulations (le favori accepte aussi espaces et retours à la ligne).
export function netsoinTugText(steps: number[]): string { return steps.join('\t') }

const SCRIPT = `(async()=>{
let t='';try{t=await navigator.clipboard.readText()}catch(e){}
let v=(t.match(/\\d+(?:[.,]\\d+)?/g)||[]).slice(0,5);
if(v.length<5){t=prompt('Collez les 5 durées du TUG :','')||'';v=(t.match(/\\d+(?:[.,]\\d+)?/g)||[]).slice(0,5)}
if(v.length<5){alert('Il faut les 5 durées du TUG (bouton « Copier pour NetSoin » de Ma tournée).');return}
const labels=${JSON.stringify(TUG_LABELS)}.map(l=>new RegExp(l,'i'));
const fields=[...document.querySelectorAll('input')].filter(i=>!['hidden','checkbox','radio','button','submit','reset','image'].includes(i.type)&&i.offsetParent!==null);
const found=labels.map(()=>null);
for(const input of fields){let e=input;for(let k=0;k<8&&e;k++){e=e.parentElement;if(!e)break;const inner=[...e.querySelectorAll('input')].filter(i=>fields.includes(i));if(inner.length>1)break;const text=e.innerText||'';const n=labels.findIndex(r=>r.test(text));if(n>=0){if(!found[n])found[n]=input;break}}}
const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;let count=0;
found.forEach((input,n)=>{if(!input)return;input.focus();setter.call(input,v[n]);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));input.blur();count++});
alert(count===5?'TUG rempli : '+v.join(' · '):count+' case(s) remplie(s) sur 5 : vérifiez la page.');
})()`
// Adresse du favori (à coller dans le champ « URL » d’un favori Chrome).
export const TUG_BOOKMARKLET = `javascript:${encodeURIComponent(SCRIPT.replace(/\n/g, ''))}`
export const TUG_BOOKMARKLET_SCRIPT = SCRIPT
