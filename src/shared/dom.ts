const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

export function createFlagIcon(iso2: string, className = 'country-row__flag'): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');

  const use = document.createElementNS(SVG_NS, 'use');
  const ref = `#flag-${iso2.toLowerCase()}`;
  use.setAttribute('href', ref);
  use.setAttributeNS(XLINK_NS, 'xlink:href', ref);
  svg.appendChild(use);

  return svg;
}
