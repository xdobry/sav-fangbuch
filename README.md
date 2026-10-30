# Fangbuch

Ein einfaches, deutschsprachiges digitales Fangbuch. Die Vue-Anwendung hilft dabei, Angeltermine und Fänge zu erfassen und den Überblick über Gewässer und Ausrüstung zu behalten.

Hier geht es zu der App
https://xdobry.github.io/sav-fangbuch/

Es funktioniert in Browser uns ist auch nach der PWA-Installation off-line fähig. 
- Die Daten sind nur auf dem Browser.
- Es gibt keinen Server.
- Es ist keine Registierung nötig.
- Keine Werbung
- Völlig kostenlos
- Quellcode für eigene Anpassungen (Erweiterungen) ist vorhanden

Die Fänge werden einem Tour zugordnet mit vielen Wetterdaten um später Erkentnisse über Beißverhalten zu gewinnen.
Weil die Daten nur bei dem Gerät sind, muss man bei wechsel des Geräts die Daten exportieren und wieder importieren.
Man sollte auch regelmäßig zur Sicherung die Daten exportieren und z.B bei einem cloud driver sichern.

## Funktionen

- Touren mit Zeitraum, Gewässer und Wetterdaten erfassen
- Automaitsch das Gewässer aus GPS-Lokation ermitteln
- Autoamtisch GPS-Lokation setzen
- Automatisch Wetter Daten aus dem open-meteo.com ermitteln
- Startseite mit aktiver Tour, schnellem Fang erfassen und den letzten zehn Fängen
- Fänge einer Tour zuordnen und mit Fischart, Länge, Gewicht, Rute, Köder und Notizen dokumentieren
- Fänge nachträglich bearbeiten oder löschen
- Eigene Gewässer, Ruten und Köder verwalten
- Fänge aus Fotometadaten (GPS-Lokation und Erstellungsdatum) nachträglich anlegen
- Übersicht mit Fangzahl, Gesamtgewicht und größtem Fang
- Fangbuchdaten als JSON exportieren und Touren sowie Fänge per JSON zusammenführen
- Touren und Fänge als flache CSV-Datei exportieren
- Daten automatisch im lokalen Browserspeicher sichern
- Als Progressive Web App installieren und die App-Oberfläche offline öffnen

## Voraussetzungen

- Node.js
- npm

## Installation und Entwicklung

```sh
npm install
npm run dev
```

In lokalen netzwerk verfügbar

```sh
npm run dev -- --host 0.0.0.0
```

Vite zeigt nach dem Start die lokale Adresse der Entwicklungsanwendung an.

## Build und Vorschau

```sh
npm run build
npm run preview
```

Der Produktionsbuild wird im Verzeichnis `dist/` erstellt. `npm run preview` startet einen lokalen Server, um diesen Build zu prüfen.

## Build für GitHub Pages

Für eine GitHub-Projektseite muss der Build-Pfad dem Repository-Namen entsprechen. Ersetze `REPOSITORYNAME` durch den Namen des GitHub-Repositories:

```sh
npm run build:pages -- --base=/REPOSITORYNAME/
```

Beispiel für `https://xdobry.github.io/sav-fangbuch/`:

```sh
npm run build:pages -- --base=/sav-fangbuch/
```

Der fertige Build liegt danach in `dist/`. Diesen Ordner als GitHub-Pages-Artefakt veröffentlichen. Für eine GitHub-Seite unter der Domain-Wurzel (`https://BENUTZER.github.io/`) genügt `npm run build:pages`.

## Als App installieren

Die veröffentlichte Anwendung kann in unterstützten Browsern über das Installationssymbol in der Adressleiste oder das Browsermenü installiert werden. In Browsern, die ein Installationsereignis bereitstellen, erscheint zusätzlich die Schaltfläche „App installieren“. Die Installation ist über HTTPS oder lokal auf `localhost` verfügbar.

Nach dem ersten Laden hält der Service Worker die App-Oberfläche für den Offline-Start bereit. Die gespeicherten Fangbuchdaten bleiben im lokalen Browserspeicher und werden nicht zwischen Geräten synchronisiert.

## Datenspeicherung

Die Anwendung speichert ihre Daten im `localStorage` des verwendeten Browsers unter dem Schlüssel `fangbuch-data-v1`. Es gibt derzeit kein Backend und keine Synchronisierung zwischen Browsern oder Geräten. Browserdaten sollten daher separat gesichert werden, bevor sie gelöscht werden.

## Projektstruktur

- `src/App.vue` – Anwendungszustand, Navigation und zentrale Abläufe
- `src/components/` – Ansichten und Formulare für Termine, Fänge, Gewässer, Ausrüstung und Übersicht
- `src/types.ts` – TypeScript-Datentypen
- `src/utils/` – Hilfsfunktionen
- `src/style.css` – globale Styles
- `public/` – statische Dateien

## Technologie

Vue 3, TypeScript, Vite und Bulma.
