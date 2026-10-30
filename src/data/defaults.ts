import type { Bait, FishSpecies, Montage, Rod, Water } from '../types'

export const defaultSpecies: FishSpecies[] = [
  { id: 'aal', name: 'Aal' },
  { id: 'aland', name: 'Aland' },
  { id: 'aeschе', name: 'Äsche' },
  { id: 'bachforelle', name: 'Bachforelle' },
  { id: 'bachneunauge', name: 'Bachneunauge' },
  { id: 'bachsaibling', name: 'Bachsaibling' },
  { id: 'barbe', name: 'Barbe' },
  { id: 'bitterling', name: 'Bitterling' },
  { id: 'brasse', name: 'Brasse' },
  { id: 'doebel', name: 'Döbel' },
  { id: 'dreistachliger-stichling', name: 'Dreistachliger Stichling' },
  { id: 'elritze', name: 'Elritze' },
  { id: 'flussbarsch', name: 'Flussbarsch' },
  { id: 'giebel', name: 'Giebel' },
  { id: 'groesse', name: 'Groppe (Mühlkoppe)' },
  { id: 'gruendling', name: 'Gründling' },
  { id: 'guester', name: 'Güster' },
  { id: 'hasel', name: 'Hasel' },
  { id: 'hecht', name: 'Hecht' },
  { id: 'kabeljau', name: 'Kabeljau (Dorsch)' },
  { id: 'kaulbarsch', name: 'Kaulbarsch' },
  { id: 'karausche', name: 'Karausche' },
  { id: 'karpfen', name: 'Wildkarpfen' },
  { id: 'kessler-grundel', name: 'Kessler-Grundel' },
  { id: 'lachs', name: 'Lachs' },
  { id: 'maifisch', name: 'Maifisch' },
  { id: 'moderlieschen', name: 'Moderlieschen' },
  { id: 'nase', name: 'Nase' },
  { id: 'nordseeschnaepel', name: 'Nordseeschnäpel' },
  { id: 'quappe', name: 'Quappe (Rutte)' },
  { id: 'rapfen', name: 'Rapfen' },
  { id: 'regenbogenforelle', name: 'Regenbogenforelle' },
  { id: 'rotauge', name: 'Rotauge' },
  { id: 'rotfeder', name: 'Rotfeder' },
  { id: 'schlammpeitzger', name: 'Schlammpeitzger' },
  { id: 'schleie', name: 'Schleie' },
  { id: 'schmerle', name: 'Schmerle' },
  { id: 'schneider', name: 'Schneider' },
  { id: 'steinbeisser', name: 'Steinbeißer' },
  { id: 'ukelei', name: 'Ukelei (Laube)' },
  { id: 'wels', name: 'Wels' },
  { id: 'zander', name: 'Zander' },
  { id: 'zaehrte', name: 'Zährte' },
  { id: 'zwergstichling', name: 'Zwergstichling' },
]

export const defaultWaters: Water[] = [
  { id: 'autobahnweiher', name: 'Autobahnweiher', location: 'Leverkusen',
      latitude: 51.017875417026495, longitude: 7.01031190443649250 },
  { id: 'grosse-ledder', name: 'Große Ledder', location: 'Leverkusen', latitude: 51.099071375174255, longitude: 7.232025280344614 },
  { id: 'grosser-silbersee', name: 'Großer Silbersee', location: 'Leverkusen', latitude: 51.07135766552641, longitude: 6.9336335602489845 },
  { id: 'hitdorfersee-nord', name: 'Hitdorfersee Nord', location: 'Leverkusen', latitude: 51.07232842931969, longitude: 6.931144470033943 },
  { id: 'kleiner-dehlensee', name: 'Kleiner Dehlensee', location: 'Leverkusen', latitude: 51.06079991045928, longitude: 6.9406035532901384 },
  { id: 'rheinhafen-hitdorf', name: 'Rheinhafen Hitdorf', location: 'Leverkusen', latitude: 51.06024636334001, longitude: 6.913463348581607 },
  { id: 'stoeckenbergsee', name: 'Stöckenbergsee', location: 'Leverkusen', latitude: 51.04701564905807, longitude: 7.0097765516169375 },
  { id: 'wupper', name: 'Wupper', location: 'Leverkusen', latitude: 51.03663340599309, longitude: 7.001051754417278 }
]

export const defaultRods: Rod[] = [
  { id: 'rod-1', type: 'Teleskop', length: 3.9 },
  { id: 'rod-2', type: 'Feeder', length: 4.2 },
  { id: 'rod-3', type: 'Karpfenrute', length: 4.8 }
]

export const defaultBaits: Bait[] = [
  { id: 'bait-1', name: 'Spinner', kind: 'Kunstköder' },
  { id: 'bait-2', name: 'Wobbler', kind: 'Kunstköder' },
  { id: 'bait-3', name: 'Gumifisch', kind: 'Kunstköder' },
  { id: 'bait-6', name: 'Blinker', kind: 'Kunstköder' },
  { id: 'bait-7', name: 'Chaterbait', kind: 'Kunstköder' },
  { id: 'bait-8', name: 'Popper', kind: 'Kunstköder' },
  { id: 'bait-9', name: 'Krebs', kind: 'Kunstköder' },
  { id: 'bait-10', name: 'SpinMad', kind: 'Kunstköder' },
  { id: 'bait-4', name: 'Made', kind: 'Lebend' },
  { id: 'bait-5', name: 'Wurm', kind: 'Lebend' },
  { id: 'bait-11', name: 'Popup', kind: 'Organisch' },
  { id: 'bait-12', name: 'Teig', kind: 'Organisch' },
  { id: 'bait-13', name: 'Boily', kind: 'Organisch' },
]

export const defaultMontages: Montage[] = [
  { id: 'montage-laufpose', title: 'Laufpose' },
  { id: 'montage-feststellpose', title: 'Feststellpose' },
  { id: 'montage-feeder', title: 'Feeder' },
  { id: 'montage-einfaches-grundblei', title: 'Einfaches Grundblei' },
  { id: 'montage-jig', title: 'Jig' },
  { id: 'montage-flourocarbon', title: 'Flourocarbon' },
  { id: 'montage-stahlvorfach', title: 'Stahlvorfach' },
  { id: 'montage-dropshot', title: 'Dropshot' }
]