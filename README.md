# WebVOWL + OWL2VOWL

WebVOWL è un visualizzatore web interattivo per ontologie OWL, basato sulla notazione Visual Notation for OWL Ontologies (VOWL). Il componente OWL2VOWL converte le ontologie OWL in formato JSON per la visualizzazione.

Questo fork ([teamdigitale/dati-semantic-WebVOWL](https://github.com/teamdigitale/dati-semantic-WebVOWL)) modernizza il progetto originale [VisualDataWeb/WebVOWL](https://github.com/VisualDataWeb/WebVOWL) portandolo a:

- **Java 21** (Eclipse Temurin) per il backend OWL2VOWL
- **Node.js 20** per il build del frontend
- **Spring Boot 3.x** con Tomcat embedded
- **Gradle** (backend) + **Webpack** (frontend) come build system
- Artifact WAR eseguibile con `java -jar` (niente Tomcat esterno)

> **Nota per chi usa la versione originale con Tomcat:** le versioni precedenti di WebVOWL richiedevano il deploy di un file WAR pre-compilato su Apache Tomcat 9. Questo fork utilizza Spring Boot con Tomcat embedded: è sufficiente eseguire `java -jar owl2vowl.war`. Il deploy su un application server esterno **non è supportato né consigliato**.

---

## Prerequisiti

- Server Ubuntu 22.04+ (per installazione nativa) oppure Docker

---

## Opzione 1: Docker (consigliata)

Le immagini ufficiali sono pubblicate su GitHub Container Registry. Questa è la modalità di installazione consigliata.

### 1.1 Installare Docker

```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
```

### 1.2 Avviare il container

WebVOWL non richiede variabili d'ambiente per il funzionamento base:

```bash
docker run -d \
  --name webvowl \
  --restart unless-stopped \
  -p 8080:8080 \
  ghcr.io/teamdigitale/dati-semantic-webvowl:latest
```

Verificare:

```bash
docker logs webvowl
# L'applicazione è disponibile su http://localhost:8080
```

---

## Opzione 2: Installazione nativa con systemd

Questa modalità prevede il build dai sorgenti e l'avvio come servizio di sistema. WebVOWL richiede sia Java che Node.js per il build.

### 2.1 Installare Java 21

```bash
sudo apt update
sudo apt install -y eclipse-temurin-21-jdk
```

Se il pacchetto non è disponibile, aggiungere il repository Adoptium:

```bash
sudo apt install -y wget apt-transport-https gpg
wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /usr/share/keyrings/adoptium.gpg
echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install -y temurin-21-jdk
```

### 2.2 Installare Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verificare:

```bash
java -version
# openjdk version "21.x.x" ...
node --version
# v20.x.x
```

### 2.3 Scaricare i sorgenti e buildare

Il build è in due fasi: prima il frontend (Node.js), poi il backend (Gradle) che include il frontend compilato.

```bash
sudo useradd -r -s /usr/sbin/nologin webvowl

cd /opt
sudo git clone https://github.com/teamdigitale/dati-semantic-WebVOWL.git
cd dati-semantic-WebVOWL

# 1. Build del frontend
cd webVowl
npm install
npm run build
cd ..

# 2. Build del backend (il Gradle task copia automaticamente il frontend dalla directory webVowl/deploy/)
cd owl2vowl
./gradlew clean build -x test
cd ..

# Copiare l'artifact nella directory di installazione
sudo mkdir -p /opt/webvowl
sudo cp owl2vowl/build/libs/owl2vowl.war /opt/webvowl/owl2vowl.war
sudo chown -R webvowl:webvowl /opt/webvowl
```

**(Opzionale)** Rimuovere i sorgenti dopo il build per liberare spazio:

```bash
sudo rm -rf /opt/dati-semantic-WebVOWL
```

### 2.4 Creare il file di servizio systemd

Creare il file `/etc/systemd/system/webvowl.service`:

```ini
[Unit]
Description=WebVOWL - Web-based Visualization of Ontologies
After=network.target

[Service]
Type=simple
User=webvowl
Group=webvowl
WorkingDirectory=/opt/webvowl

ExecStart=/usr/bin/java \
  --add-opens java.base/java.lang=ALL-UNNAMED \
  -jar /opt/webvowl/owl2vowl.war

Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

> **Importante:** il flag `--add-opens java.base/java.lang=ALL-UNNAMED` è necessario per il corretto funzionamento della libreria OWL API con Java 21. Senza questo flag l'applicazione non si avvia.

### 2.5 Avviare il servizio

```bash
sudo systemctl daemon-reload
sudo systemctl enable webvowl
sudo systemctl start webvowl

# Verificare lo stato
sudo systemctl status webvowl

# Il servizio è disponibile su http://localhost:8080
```

---

## Variabili d'ambiente

WebVOWL attualmente non espone variabili d'ambiente di configurazione. Il servizio funziona out-of-the-box sulla porta 8080.

---

## Flag JVM richiesti

| Flag | Motivo |
|---|---|
| `--add-opens java.base/java.lang=ALL-UNNAMED` | Necessario per la reflection usata dalla libreria OWL API su Java 21 |

> **Nota:** nell'immagine Docker questo flag è già incluso nel `CMD` del Dockerfile.

---

## Nota per chi usa Apache HTTPD come reverse proxy

Se si dispone già di un reverse proxy Apache HTTPD configurato per la versione precedente (Tomcat esterno), tenere presente che il modello architetturale è cambiato:

- **Prima:** Apache parlava con un unico processo Tomcat su una singola porta, smistando le richieste per path (es. `/lodview`, `/lode`, `/webvowl`).
- **Ora:** ogni visualizzatore è un processo Spring Boot autonomo in ascolto sulla propria porta locale.

Tutte le applicazioni partono di default sulla porta **8080**. Se si eseguono più visualizzatori sulla stessa macchina, è necessario assegnare porte diverse tramite la variabile d'ambiente `SERVER_PORT` (vedi la [sezione porte](#porte) e il [README di LodView](https://github.com/teamdigitale/dati-semantic-lodview) per la tabella completa).

Apache può continuare a fare reverse proxy, ma il backend non è più un unico Tomcat condiviso.

### Virtual host dedicati

Se si usa un dominio (o sottodominio) dedicato per ogni visualizzatore, la configurazione è minimale:

```apache
<VirtualHost *:443>
    ServerName webvowl.example.com

    ProxyPass / http://localhost:8082/
    ProxyPassReverse / http://localhost:8082/

    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    # ... configurazione SSL ...
</VirtualHost>
```

### Path-based proxy (più visualizzatori sullo stesso dominio)

Se si vogliono esporre più visualizzatori sotto path diversi dello stesso dominio, è necessario configurare `SERVER_PORT` e `SERVER_SERVLET_CONTEXT_PATH`.

Esempio di file `.env` per WebVOWL in modalità path-based:

```env
SERVER_PORT=8082
SERVER_SERVLET_CONTEXT_PATH=/webvowl
```

Configurazione Apache:

```apache
ProxyPass /webvowl http://localhost:8082/webvowl
ProxyPassReverse /webvowl http://localhost:8082/webvowl
```

> **Nota:** senza `SERVER_SERVLET_CONTEXT_PATH`, le applicazioni Spring Boot servono su `/` (root) e il path-based proxy non funzionerebbe correttamente. Per la configurazione Apache completa con tutti i visualizzatori, vedere il [README di LodView](https://github.com/teamdigitale/dati-semantic-lodview).

---

## Porte

| Porta | Protocollo | Descrizione |
|---|---|---|
| 8080 | HTTP | Interfaccia web WebVOWL + API OWL2VOWL (default, configurabile con `SERVER_PORT`) |
