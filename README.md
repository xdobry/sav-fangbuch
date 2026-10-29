# Fangbuch

Ein einfaches, deutschsprachiges digitales Fangbuch. Die Vue-Anwendung hilft dabei, Angeltermine und Fänge zu erfassen und den Überblick über Gewässer und Ausrüstung zu behalten.

https://xdobry.github.io/sav-fangbuch/

Es funktioniert in browser. Die Daten sind nur auf dem browser. Es gibt keinen Server.
Keine Registierung nötig.

## Funktionen

- Touren mit Zeitraum, Gewässer und Wetterdaten erfassen
- Startseite mit aktiver Tour, schnellem Fang erfassen und den letzten zehn Fängen
- Fänge einer Tour zuordnen und mit Fischart, Länge, Gewicht, Rute, Köder, Foto und Notizen dokumentieren
- Fänge nachträglich bearbeiten oder löschen
- Eigene Gewässer, Ruten und Köder verwalten
- Übersicht mit Fangzahl, Gesamtgewicht und größtem Fang
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
