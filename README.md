# QS-Berichtserstellung

Web-App zur Baustellen-QS-Berichtserstellung: Fotoaufnahme vor Ort, Erfassung der
Feststellungen/Veranlassungen und PDF-Export (QS-Bericht oder Kurzbericht-Baustellenbegehung).

## Struktur

- `public/index.html` – komplette App (eine Datei, inline HTML/CSS/JS, IndexedDB-Persistenz,
  PDF-Erzeugung im Browser mit html2canvas + jsPDF). Kein Server-Code, reines statisches Hosting.

## Bildkomprimierung (Mail-Limit 20 MB)

- Beim Import: Foto wird auf die Fotobox (84 x 63 mm) zugeschnitten und auf max. 2400 px Breite,
  JPEG 92 % begrenzt. Das Original bleibt unverändert in der Fotogalerie.
- Beim PDF-Export: Die Seiten werden ohne Fotos gerastert, danach wählt die App automatisch die
  höchste Foto-Stufe (2400 px/92 % bis 1200 px/80 %), mit der die Gesamtdatei unter ~17,5 MB bleibt.
  Nach dem Export wird die tatsächliche Dateigröße angezeigt.
