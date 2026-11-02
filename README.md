# Wildkracht

Conceptwebsite over natuurbehoud in Afrika dat werkt voor natuur én mensen. Met een kidssite: *Wildkracht Rangers*.

De site bestaat uit gewone HTML, CSS en JavaScript, zonder bouwstap. Hij draait direct op GitHub Pages.

## Mappen

| Map / bestand | Wat staat erin |
|---|---|
| `index.html` | Homepage |
| `project.html` | Sjabloon voor de artikelen (`project.html?id=gorongosa`) |
| `content/projecten/*.md` | De artikelteksten in Markdown, één bestand per project |
| `doneer.html` | Doneerpagina (schets, er wordt niets verstuurd) |
| `wat-kun-jij-doen.html` | Tips voor volwassenen |
| `kids/` | Kidssite *Wildkracht Rangers*: start, quiz, pagina voor ouders |
| `kids/dieren.json` | De 10 quizdieren: tekst van Pip, weetjes, filmpje (YouTube-id) en vragen per niveau |
| `data/projecten.json` | De 8 projecten: titel, land, korte tekst, foto, kerncijfers en plek op de kaart |
| `data/fotos.json` | Fotoverantwoording (maker, licentie, bron), automatisch getoond in de footer |
| `assets/css/style.css` | Vormgeving. Kleuren en lettertypes staan bovenaan als variabelen |
| `assets/js/main.js` | Menu, projectkaarten, tellers |
| `assets/js/kaart.js` | De klikbare kaart van Afrika |
| `assets/img/foto/` | Natuurfoto's (Wikimedia Commons, vrije licenties) |
| `onderzoek/onderzoek.md` | Het achtergrondonderzoek met bronnen |

## Een project aanpassen of toevoegen

1. Open `data/projecten.json`.
2. Kopieer een blok `{ ... }` en pas de velden aan:
   - `foto` is de bestandsnaam in `assets/img/foto/`, zonder `.jpg`.
   - `coord` is `[lengtegraad, breedtegraad]`, dus eerst oost/west en dan noord/zuid.
   - `verschuif` (optioneel) verplaatst een punt op de kaart een paar pixels, met een lijntje naar de echte plek.
3. Gebruik je een nieuwe foto? Zet de maker en de licentie in `data/fotos.json`.

## Een artikel aanpassen

Open `content/projecten/<id>.md`. Gebruik `##` voor tussenkoppen. De koppen **Kanttekeningen** en **Bronnen** krijgen automatisch een eigen opmaak. De leestijd wordt automatisch berekend.

## Quizvragen aanpassen

Open `kids/dieren.json`. Bij elke vraag geeft `goed` aan welk antwoord juist is, geteld vanaf 0: 0 is het eerste antwoord, 1 het tweede, enzovoort. `jong` is voor 6–8 jaar, `oud` voor 9–12 jaar. Een filmpje vervang je door het YouTube-id te veranderen (het stukje na `watch?v=`).

## Lokaal bekijken

De site laadt zijn gegevens met `fetch`, dus dubbelklikken op `index.html` werkt niet. Start in deze map een kleine server:

```
python -m http.server 8420
```

Open daarna http://localhost:8420.

## Publiceren op GitHub Pages

1. Maak op GitHub een nieuwe repository aan, bijvoorbeeld `wildkracht`.
2. Upload de inhoud van deze map of push hem met git.
3. Ga naar **Settings → Pages**. Kies bij *Source* "Deploy from a branch", dan `main` en `/ (root)`.
4. Na een minuut staat de site op `https://<gebruikersnaam>.github.io/wildkracht/`.

## Firebase (login en gesprek)

De site draait op **Firebase Hosting**: https://wildkracht-nl.web.app (Firebase-project `wildkracht-nl`).

- **Inloggen** met een Google-account: `assets/js/firebase.js` (verbinding) en `assets/js/account.js` (knop in de header).
- **Gesprek**: `gesprek.html` en `assets/js/gesprek.js`. Berichten staan in Firestore (regio Europa, `eur3`).
- **Beveiliging**: `firestore.rules`. Alleen ingelogde bezoekers lezen en schrijven, maximaal 1000 tekens en 1 bericht per 5 seconden. Je verwijdert alleen je eigen berichten. De beheerder (`dvanwoerkom@gmail.com`) kan alles verwijderen en ziet de meldingen.
- Een andere beheerder instellen: pas het e-mailadres aan in **zowel** `firestore.rules` als `assets/js/firebase.js`.

Publiceren na een wijziging:

```
firebase deploy
```
