# Hinweise für Coding Agents

## Projekt

- Fangbuch ist eine deutschsprachige Single-Page-Anwendung mit Vue 3, TypeScript, Vite und Bulma.
- Einstiegspunkt ist `src/main.ts`; `src/App.vue` verwaltet Navigation und Anwendungszustand.
- Ansichten und Formulare liegen in `src/components/`, gemeinsame Datentypen in `src/types.ts` und Hilfsfunktionen in `src/utils/`.
- Die Daten werden im Browser unter dem `localStorage`-Schlüssel `fangbuch-data-v1` gespeichert. Es gibt kein Backend.

## Arbeitsweise

- Bestehende Vue- und TypeScript-Muster beibehalten: Composition API mit `<script setup lang="ts">` und typisierte Props, Events und Formulare.
- Sichtbare Texte und Beschriftungen auf Deutsch verfassen.
- Gemeinsame Datenformen in `src/types.ts` pflegen und bestehende Typen wiederverwenden.
- Änderungen am gespeicherten Datenformat mit der bestehenden Lade- und Migrationslogik in `src/App.vue` abstimmen, damit vorhandene Browserdaten erhalten bleiben.
- Abhängigkeiten nur hinzufügen, wenn sie für die Aufgabe erforderlich sind.

## Prüfen

- `npm run build` führt die TypeScript-Prüfung und den Vite-Produktionsbuild aus.
- Es ist derzeit kein Testskript in `package.json` definiert.
