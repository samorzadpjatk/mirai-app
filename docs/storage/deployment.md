# Storage Deployment Guide

This guide covers deploying the SeaweedFS storage stack with native TUS support in production environments.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Production Architecture](#production-architecture)
4. [SeaweedFS Configuration](#seaweedfs-configuration)
5. [Security Considerations](#security-considerations)
6. [Monitoring and Observability](#monitoring-and-observability)
7. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                  CLIENT LAYER                                    │
│  ┌──────────────────────────┐    ┌──────────────────────────┐                  │
│  │      Mobile App          │    │       Web App            │                  │
│  │  - tus-js-client         │    │   - GraphQL queries      │                  │
│  │  - Resumable uploads     │    │   - File downloads       │                  │
│  └────────────┬─────────────┘    └────────────┬─────────────┘                  │
└───────────────┼───────────────────────────────┼────────────────────────────────┘
                │ HTTPS                         │ HTTPS
                ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              LOAD BALANCER (NGINX)                               │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │  - SSL termination                                                          │ │
│  │  - Rate limiting                                                            │ │
│  │  - Path routing: /graphql → backend, /storage/* → SeaweedFS               │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                │                               │
                ▼                               ▼
┌──────────────────────────────┐    ┌─────────────────────────────────────────────┐
│      UPLOAD ENDPOINT         │    │              BACKEND LAYER                   │
│  ┌────────────────────────┐ │    │  ┌───────────────────────────────────────┐ │
│  │   SeaweedFS Filer      │ │    │  │    Backend Server (Hono/GraphQL)      │ │
│  │  - Port: 8888          │ │    │  │                                       │ │
│  │  - Native TUS protocol │ │    │  │  ┌─────────────┐  ┌──────────────┐  │ │
│  │  - S3-compatible API   │ │◄───┼──┼──┤   GraphQL   │  │   Storage    │  │ │
│  │  - Direct auth tokens  │ │    │  │  │   Resolvers │  │   Mutations  │  │ │
│  └──────────┬─────────────┘ │    │  │  └─────────────┘  └──────────────┘  │ │
└─────────────┼────────────────┘    │  └───────────────────────────────────────┘ │
               │                     └─────────────────────────────────────────────┘
               │ S3 API
               ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STORAGE LAYER (SeaweedFS)                              │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────────┐ │
│  │    Master Server       │  │    Volume Servers      │  │    Filer Server   │ │
│  │  - Metadata management │  │  - Data storage        │  │  - S3 API gateway │ │
│  │  - Port: 9333          │  │  - Port: 8080, 18080   │  │  - TUS endpoint   │ │
│  └────────────────────────┘  └────────────────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Key Changes from Previous Architecture

- **No separate tusd server**: SeaweedFS Filer provides native TUS support
- **Simplified auth**: Direct auth tokens in URL query parameters
- **Reduced complexity**: No webhook handling, no Redis ticket storage
- **Better performance**: Direct upload to storage layer

---

## Prerequisites

### Infrastructure Requirements

| Component | Minimum | Recommended | Notes |
|-----------|---------|-------------|-------|
| CPU | 4 cores | 8+ cores | For moderate load |
| RAM | 8 GB | 16+ GB | SeaweedFS caches metadata |
| Storage | 100 GB | 500+ GB | SSD recommended for metadata |
| Network | 1 Gbps | 10 Gbps | For high-throughput uploads |

### Software Requirements

- Docker 24.0+
- Docker Compose 2.20+ (or Swarm mode)
- Nginx or Traefik (for load balancing)
- SSL certificates (Let's Encrypt or custom)

---

## Production Architecture

### Docker Swarm Mode (Recommended)

For production, use Docker Swarm for high availability:

```yaml
# docker-compose.storage.prod.yml
version: '3.8'

services:
  # SeaweedFS Master
  seaweedfs-master:
    image: chrislusf/seaweedfs:3.60
    command: "master -ip=seaweedfs-master -port=9333 -mdir=/data -defaultReplication=001"
    volumes:
      - seaweedfs-master-data:/data
    networks:
      - storage-network
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # SeaweedFS Volume (3 replicas for HA)
  seaweedfs-volume:
    image: chrislusf/seaweedfs:3.60
    command: "volume -mserver=seaweedfs-master:9333 -port=8080 -dir=/data -max=100 -ip=$(hostname -i)"
    volumes:
      - seaweedfs-volume-data:/data
    networks:
      - storage-network
    deploy:
      replicas: 3
      placement:
        constraints:
          - node.labels.storage == true
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  # SeaweedFS Filer (S3 API + TUS)
  seaweedfs-filer:
    image: chrislusf/seaweedfs:3.60
    command: "filer -master=seaweedfs-master:9333 -port=8888 -s3"
    environment:
      - WEED_S3_PORT=8333
      - WEED_S3_ACCESS_KEY=minioadmin
      - WEED_S3_SECRET_KEY=${SEAWEEDFS_SECRET_KEY:-changeme}
    volumes:
      - seaweedfs-filer-data:/data
    ports:
      - "8333:8333"  # S3 API
      - "8888:8888"  # Filer UI / TUS
    networks:
      - storage-network
      - app-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8888"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

volumes:
  seaweedfs-master-data:
    driver: local
  seaweedfs-volume-data:
    driver: local
  seaweedfs-filer-data:
    driver: local

networks:
  storage-network:
    driver: overlay
    internal: true  # No external access
  app-network:
    driver: overlay
    external: true  # Shared with backend
```

---

## SeaweedFS Configuration

### Master Server

The master server manages metadata and coordinates volume servers:

```bash
# Docker command
weed master \
  -ip=seaweedfs-master \
  -port=9333 \
  -mdir=/data \
  -defaultReplication=001  # 1 copy on different rack
```

**Key Options**:

| Option | Description | Default |
|--------|-------------|---------|
| `-mdir` | Metadata directory | Required |
| `-defaultReplication` | Replication level | 000 (none) |
| `-volumePreallocate` | Preallocate disk space | false |
| `-volumeSizeLimitMB` | Max volume size | 1000 |

Replication levels:
- `000`: No replication (development only)
- `001`: 1 copy on different rack (minimum production)
- `002`: 2 copies on different racks
- `010`: 1 copy on different data center (multi-DC)

### Volume Servers

Volume servers store the actual file data:

```bash
weed volume \
  -mserver=seaweedfs-master:9333 \
  -port=8080 \
  -dir=/data \
  -max=100 \
  -rack=rack1
```

**Key Options**:

| Option | Description |
|--------|-------------|
| `-max` | Maximum number of volumes |
| `-rack` | Rack identifier for replication |
| `-dataCenter` | Data center identifier |
| `-index` | Index level (memory, leveldb, boltdb) |

### Filer Server (S3 API + Native TUS)

The filer provides S3-compatible API and native TUS resumable upload support:

```bash
weed filer \
  -master=seaweedfs-master:9333 \
  -port=8888 \
  -s3
```

**S3 Configuration** (environment variables):

| Variable | Description | Default |
|----------|-------------|---------|
| `WEED_S3_PORT` | S3 API port | 8333 |
| `WEED_S3_ACCESS_KEY` | S3 access key | minioadmin |
| `WEED_S3_SECRET_KEY` | S3 secret key | minioadmin |
| `WEED_S3_BUCKET` | Default bucket | s3bucket |

**TUS Configuration**:

SeaweedFS Filer provides native TUS support at the `/tus/` endpoint:
- Upload endpoint: `http://filer:8888/tus/{bucket}/{path}`
- Supports resumable uploads with automatic chunk handling
- Compatible with `tus-js-client` and other TUS protocol clients

---

## Security Considerations

### 1. Network Segmentation

```
┌────────────────────────────────────────────────────────────┐
│                     PUBLIC NETWORK                         │
│  ┌──────────────┐  ┌──────────────────┐                      │
│  │    Nginx     │  │  SeaweedFS Filer │                      │
│  │   (443)      │  │   S3 (8333)      │                      │
│  │              │  │   TUS (8888)     │                      │
│  └──────────────┘  └──────────────────┘                      │
└────────────────────────────────────────────────────────────┘
                          │
┌────────────────────────────────────────────────────────────┐
│                   INTERNAL NETWORK                         │
│  ┌──────────────┐  ┌──────────────────┐                    │
│  │   Backend    │  │  SeaweedFS       │                    │
│  │   (2022)     │  │  Internal ports  │                    │
│  └──────────────┘  └──────────────────┘                    │
└────────────────────────────────────────────────────────────┘
```

### 2. Access Control

**SeaweedFS S3 Credentials**:
- Use strong, randomly generated access/secret keys
- Rotate credentials every 90 days
- Store in Docker secrets or external vault

**Upload Token Security**:
- Tokens are single-use with 1-hour TTL
- Signed URLs include auth tokens in query parameters
- Backend validates user permissions before generating upload URLs

### 3. SSL/TLS

All external endpoints must use SSL:

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name uploads.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # SeaweedFS Filer TUS endpoint
    location /tus/ {
        proxy_pass http://seaweedfs-filer:8888/tus/;
        proxy_request_buffering off;
        proxy_buffering off;
        client_max_body_size 0;
    }

    # SeaweedFS S3
    location /storage/ {
        proxy_pass http://seaweedfs-filer:8333/;
    }
}
```

### 4. Rate Limiting

```nginx
limit_req_zone $binary_remote_addr zone=uploads:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=downloads:10m rate=100r/s;

server {
    location /tus/ {
        limit_req zone=uploads burst=20 nodelay;
    }
}
```

---

## Monitoring and Observability

### Health Checks

**SeaweedFS Filer**:
```bash
curl -f http://seaweedfs-filer:8888/
curl -f http://seaweedfs-filer:8888/tus/  # TUS endpoint
```

**SeaweedFS Master**:
```bash
curl -f http://seaweedfs-master:9333/cluster/status
```

### Prometheus Metrics

SeaweedFS exposes metrics on port 9324:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'seaweedfs'
    static_configs:
      - targets: ['seaweedfs-master:9324', 'seaweedfs-filer:9324']
```

Key metrics to monitor:

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| `SeaweedFS_master_volume_count` | Number of volumes | < 10 |
| `SeaweedFS_master_disk_free` | Free disk space | < 20% |
| `SeaweedFS_volume_request_total` | Volume operations | > 1000/min |

### Logging

Configure centralized logging with Grafana Loki or ELK:

```yaml
# docker-compose.logging.yml
services:
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log/containers:/var/log/containers:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

### Dashboards

Create Grafana dashboards for:

1. **Storage Overview**
   - Total storage used
   - Upload/download rates
   - Number of active uploads

2. **Performance Metrics**
   - TUS upload latency
   - SeaweedFS response times
   - Network throughput

3. **Error Rates**
   - Failed uploads
   - Authentication rejections
   - Storage errors

---

## Troubleshooting

### Common Issues

#### 1. Uploads Fail with 401 Unauthorized

**Symptoms**: TUS endpoint returns 401, upload rejected

**Checklist**:
- [ ] Verify token is valid and not expired
- [ ] Check user has permission for the bucket
- [ ] Verify token format is correct (query parameter)
- [ ] Check SeaweedFS filer logs

**Debug Commands**:
```bash
# Test TUS endpoint
curl -X POST http://seaweedfs-filer:8888/tus/mybucket/test.txt \
  -H "Tus-Resumable: 1.0.0" \
  -H "Upload-Length: 1024" \
  -H "Content-Type: application/offset+octet-stream"

# View filer logs
docker logs seaweedfs-filer
```

#### 2. SeaweedFS Connection Errors

**Symptoms**: Backend cannot connect to S3 endpoint

**Checklist**:
- [ ] Verify SeaweedFS filer is running: `curl http://seaweedfs-filer:8333/`
- [ ] Check S3 credentials match
- [ ] Verify network connectivity between containers
- [ ] Check SeaweedFS filer logs

#### 3. Slow Upload Performance

**Symptoms**: Uploads are slower than expected

**Solutions**:
- Increase `client_max_body_size` in nginx
- Disable proxy buffering for TUS uploads
- Use SSD for SeaweedFS volume storage
- Enable SeaweedFS volume preallocation

```nginx
location /tus/ {
    proxy_pass http://seaweedfs-filer:8888/tus/;
    proxy_request_buffering off;
    proxy_buffering off;
    client_max_body_size 0;
    proxy_http_version 1.1;
    proxy_set_header Connection "";
}
```

### Maintenance Commands

```bash
# View SeaweedFS cluster status
docker exec seaweedfs-master weed shell <<< "cluster.check"

# List all volumes
docker exec seaweedfs-master weed shell <<< "volume.list"

# Check filer status
docker exec seaweedfs-filer curl -f http://localhost:8888/

# Restart services
docker service update --force pjapp_seaweedfs-filer
```

---

## References

- [SeaweedFS Documentation](https://github.com/seaweedfs/seaweedfs/wiki)
- [SeaweedFS TUS Resumable Uploads](https://github.com/seaweedfs/seaweedfs/wiki/TUS-Resumable-Uploads)
- [tus Protocol Specification](https://tus.io/protocols/resumable-upload.html)
