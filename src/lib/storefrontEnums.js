import enums from '../../shared/storefront-enums.json'

export const HERO_LAYOUTS = Object.freeze([...enums.heroLayouts])
export const DEFAULT_HERO_LAYOUT = enums.defaultHeroLayout

export const TRUST_BAR_ICONS = Object.freeze([...enums.trustBarIcons])
export const DEFAULT_TRUST_BAR_ICON = enums.defaultTrustBarIcon

export function isKnownHeroLayout(value) {
  return typeof value === 'string' && HERO_LAYOUTS.includes(value)
}

export function isKnownTrustBarIcon(value) {
  return typeof value === 'string' && TRUST_BAR_ICONS.includes(value)
}

/**
 * Decide which hero layout to actually render, and say so when the stored value
 * is not one this codebase can draw.
 *
 * The old code was `template.hero?.layout || 'minimal'` followed by an if-chain
 * that ended in an unlabelled `return` — so an invented value like
 * "one image left" silently rendered the stack layout and looked like the save
 * had done nothing. Callers now get `isUnknown` and are expected to surface it
 * in edit mode; the public storefront still renders `layout` and stays graceful.
 *
 * @param {unknown} raw - whatever is sitting in template_data.hero.layout
 * @returns {{ layout: string, isUnknown: boolean, raw: unknown }}
 *   `layout` is always a member of HERO_LAYOUTS and safe to switch on.
 */
export function resolveHeroLayout(raw) {
  // Absent is not invalid — an untouched store has no layout yet and gets the
  // documented default without any warning.
  if (raw === null || raw === undefined || raw === '') {
    return { layout: DEFAULT_HERO_LAYOUT, isUnknown: false, raw }
  }
  if (isKnownHeroLayout(raw)) {
    return { layout: raw, isUnknown: false, raw }
  }
  return { layout: DEFAULT_HERO_LAYOUT, isUnknown: true, raw }
}
