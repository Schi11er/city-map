#!/bin/sh

# Ersetze Platzhalter in der index.html durch Umgebungsvariablen
envsubst '${REACT_APP_DATACAT_API_URL}' < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.html.tmp
mv /usr/share/nginx/html/index.html.tmp /usr/share/nginx/html/index.html

# Starte Nginx
exec "$@"
