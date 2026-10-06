/**
 * Helper para generar y descargar dinámicamente la tarjeta de contacto oficial (vCard)
 * de Deco Vintage Guate compatible con iOS, Android y sistemas operativos de escritorio.
 */
export function downloadVCard() {
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN;CHARSET=UTF-8:Deco Vintage Guate',
    'ORG;CHARSET=UTF-8:Deco Vintage Guate',
    'TEL;TYPE=CELL,VOICE:+50238375078',
    'TEL;TYPE=WORK,VOICE:+50238375078',
    'URL:https://decovintage.online',
    'NOTE;CHARSET=UTF-8:Fabricación y distribución de cuadros y pósters rígidos de alta calidad en madera MDF de 5.5mm y PVC impermeable en Guatemala.',
    'END:VCARD'
  ].join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'Deco_Vintage_Guate.vcf');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default downloadVCard;
