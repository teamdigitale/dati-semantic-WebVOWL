# WebVOWL + OWL2VOWL

WebVOWL is an interactive web visualizer for OWL ontologies based on the Visual Notation for OWL Ontologies (VOWL). The OWL2VOWL component converts OWL ontologies into the JSON format consumed by the WebVOWL visualization.

This fork ([teamdigitale/dati-semantic-WebVOWL](https://github.com/teamdigitale/dati-semantic-WebVOWL)) modernizes the upstream project [VisualDataWeb/WebVOWL](https://github.com/VisualDataWeb/WebVOWL) by porting it to:

- **Java 21** (Eclipse Temurin) for the OWL2VOWL backend
- **Node.js 20** for the frontend build
- **Spring Boot 3.x** with embedded Tomcat
- **Gradle** (backend) + **Webpack** (frontend) as build systems
- An executable WAR runnable with `java -jar` (no external Tomcat required)

> **Note for users of the upstream version with Tomcat:** previous WebVOWL releases required deploying a pre-built WAR onto Apache Tomcat 9. This fork uses Spring Boot with embedded Tomcat: running `java -jar owl2vowl.war` is enough. Deployment to an external application server is **not supported nor recommended**.

---

## Prerequisites

- Ubuntu 22.04+ (for native installation) or Docker

---

## Option 1: Docker (recommended)

Official images are published on GitHub Container Registry. This is the recommended installation mode.

### 1.1 Install Docker

```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
```

### 1.2 Start the container

WebVOWL does not require environment variables for basic operation:

```bash
docker run -d \
  --name webvowl \
  --restart unless-stopped \
  -p 8080:8080 \
  ghcr.io/teamdigitale/dati-semantic-webvowl:latest
```

Verify:

```bash
docker logs webvowl
# The application is available on http://localhost:8080
```

---

## Option 2: Native installation with systemd

This mode builds from source and runs the service as a system service. WebVOWL requires both Java and Node.js for the build.

### 2.1 Install Java 21

```bash
sudo apt update
sudo apt install -y eclipse-temurin-21-jdk
```

If the package is not available, add the Adoptium repository:

```bash
sudo apt install -y wget apt-transport-https gpg
wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /usr/share/keyrings/adoptium.gpg
echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install -y temurin-21-jdk
```

### 2.2 Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify:

```bash
java -version
# openjdk version "21.x.x" ...
node --version
# v20.x.x
```

### 2.3 Fetch the sources and build

The build runs in two stages: the frontend (Node.js) first, then the backend (Gradle), which embeds the compiled frontend.

```bash
sudo useradd -r -s /usr/sbin/nologin webvowl

cd /opt
sudo git clone https://github.com/teamdigitale/dati-semantic-WebVOWL.git
cd dati-semantic-WebVOWL

# 1. Build the frontend
cd webVowl
npm install
npm run build
cd ..

# 2. Build the backend (the Gradle task automatically copies the frontend from webVowl/deploy/)
cd owl2vowl
./gradlew clean build -x test
cd ..

# Copy the artifact to the installation directory
sudo mkdir -p /opt/webvowl
sudo cp owl2vowl/build/libs/owl2vowl.war /opt/webvowl/owl2vowl.war
sudo chown -R webvowl:webvowl /opt/webvowl
```

**(Optional)** Remove the sources after the build to save space:

```bash
sudo rm -rf /opt/dati-semantic-WebVOWL
```

### 2.4 Create the systemd unit file

Create `/etc/systemd/system/webvowl.service`:

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

> **Important:** the `--add-opens java.base/java.lang=ALL-UNNAMED` flag is required for the OWL API library to work correctly on Java 21. Without this flag the application fails to start.

### 2.5 Start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable webvowl
sudo systemctl start webvowl

# Check status
sudo systemctl status webvowl

# The service is available on http://localhost:8080
```

---

## Environment variables

WebVOWL does not currently expose configuration environment variables. The service works out of the box on port 8080.

---

## Required JVM flags

| Flag | Reason |
|---|---|
| `--add-opens java.base/java.lang=ALL-UNNAMED` | Required for reflection used by the OWL API library on Java 21 |

> **Note:** in the Docker image this flag is already included in the Dockerfile `CMD`.

---

## Note for users of Apache HTTPD as a reverse proxy

If you already have an Apache HTTPD reverse proxy configured for the previous version (external Tomcat), keep in mind that the architectural model has changed:

- **Before:** Apache talked to a single Tomcat process on a single port, routing requests by path (e.g. `/lodview`, `/lode`, `/webvowl`).
- **Now:** each visualizer is an autonomous Spring Boot process listening on its own local port.

All applications start on port **8080** by default. If you run multiple visualizers on the same machine you need to assign different ports via the `SERVER_PORT` environment variable (see the [ports section](#ports) and the [LodView README](https://github.com/teamdigitale/dati-semantic-lodview) for the full table).

Apache can keep acting as a reverse proxy, but the backend is no longer a single shared Tomcat.

### Dedicated virtual hosts

If you use a dedicated domain (or subdomain) for each visualizer, the configuration is minimal:

```apache
<VirtualHost *:443>
    ServerName webvowl.example.com

    ProxyPass / http://localhost:8082/
    ProxyPassReverse / http://localhost:8082/

    RequestHeader set X-Forwarded-Proto "https"
    RequestHeader set X-Forwarded-Port "443"

    # ... SSL configuration ...
</VirtualHost>
```

### Path-based proxy (multiple visualizers on the same domain)

If you want to expose multiple visualizers under different paths of the same domain, you need to configure `SERVER_PORT` and `SERVER_SERVLET_CONTEXT_PATH`.

Example `.env` file for WebVOWL in path-based mode:

```env
SERVER_PORT=8082
SERVER_SERVLET_CONTEXT_PATH=/webvowl
```

Apache configuration:

```apache
ProxyPass /webvowl http://localhost:8082/webvowl
ProxyPassReverse /webvowl http://localhost:8082/webvowl
```

> **Note:** without `SERVER_SERVLET_CONTEXT_PATH`, Spring Boot applications serve on `/` (root) and the path-based proxy would not work correctly. For the full Apache configuration covering all visualizers, see the [LodView README](https://github.com/teamdigitale/dati-semantic-lodview).

---

## Ports

| Port | Protocol | Description |
|---|---|---|
| 8080 | HTTP | WebVOWL web interface + OWL2VOWL API (default, configurable via `SERVER_PORT`) |

---

## License

This project is released under the **MIT License** (see [`publiccode.yml`](./publiccode.yml)).
