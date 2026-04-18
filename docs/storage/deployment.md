# Storage Deployment Guide

This guide covers deploying the SeaweedFS + tusd + Redis storage stack in production environments.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Production Architecture](#production-architecture)
4. [SeaweedFS Configuration](#seaweedfs-configuration)
5. [tusd Configuration](#tusd-configuration)
6. [Redis Configuration](#redis-configuration)
7. [Security Considerations](#security-considerations)
8. [Monitoring and Observability](#monitoring-and-observability)
9. [Troubleshooting](#troubleshooting)

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
│  │  - Path routing: /files/* → tusd, /graphql → backend, /storage/* → SeaweedFS │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                │                               │
                ▼                               ▼
┌──────────────────────────────┐    ┌─────────────────────────────────────────────┐
│      UPLOAD ENDPOINT         │    │              BACKEND LAYER                   │
│  ┌────────────────────────┐ │    │  ┌───────────────────────────────────────┐ │
│  │        tusd            │ │    │  │    Backend Server (Hono/GraphQL)      │ │
│  │  - Port: 1080          │ │    │  │                                       │ │
│  │  - tus protocol        │ │    │  │  ┌─────────────┐  ┌──────────────┐  │ │
│  │  - Webhook auth        │ │    │  │  │   GraphQL   │  │ TusHookCtrl  │  │ │
│  │  - Streams to SeaweedFS│ │◄───┼──┼──┤   Resolvers │  │   (hooks)    │  │ │
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
│  │  - Port: 9333          │  │  - Port: 8080, 18080   │  │  - Port: 8333     │ │
│  └────────────────────────┘  └────────────────────────┘  └───────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
              │
              │ Redis Protocol
              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CACHE LAYER (Redis)                                   │
│  ┌────────────────────────────────────────────────────────────────────────────┐  │
│  │    Redis Cluster                                                           │  │
│  │  - Upload ticket storage                                                   │  │
│  │  - TTL expiration (1 hour default)                                         │  │
│  │  - Port: 6379                                                              │  │
│  │  - Persistent: AOF + RDB                                                   │  │
│  └────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

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

  # SeaweedFS Filer (S3 API)
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

  # tusd Upload Server
  tusd:
    image: tusproject/tusd:v2.4
    command: >
      -hooks-http=http://backend:2022/tus-hooks
      -hooks-http-forward-headers=X-Request-ID,X-User-ID
      -s3-endpoint=http://seaweedfs-filer:8333
      -s3-bucket=uploads
      -s3-key-id=minioadmin
      -s3-secret-key=${SEAWEEDFS_SECRET_KEY:-changeme}
      -s3-region=us-east-1
      -port=1080
      -max-size=104857600
      -timeout=30s
      -hooks-retry=3
      -hooks-backoff=1s
    environment:
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=minioadmin
      - AWS_SECRET_ACCESS_KEY=${SEAWEEDFS_SECRET_KEY:-changeme}
    ports:
      - "1080:1080"
    networks:
      - storage-network
      - app-network
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:1080/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  # Redis
  redis:
    image: redis:7-alpine
    command: >
      redis-server
      --appendonly yes
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --save 60 10000
    volumes:
      - redis-data:/data
    networks:
      - storage-network
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G

volumes:
  seaweedfs-master-data:
    driver: local
  seaweedfs-volume-data:
    driver: local
  seaweedfs-filer-data:
    driver: local
  redis-data:
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

### Filer Server (S3 API)

The filer provides S3-compatible API:

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

---

## tusd Configuration

### Command Line Options

```bash
tusd \
  -hooks-http=http://backend:2022/tus-hooks \
  -hooks-http-forward-headers=X-Request-ID,X-User-ID \
  -s3-endpoint=http://seaweedfs-filer:8333 \
  -s3-bucket=uploads \
  -s3-key-id=minioadmin \
  -s3-secret-key=secret \
  -s3-region=us-east-1 \
  -port=1080 \
  -max-size=104857600 \
  -timeout=30s \
  -hooks-retry=3 \
  -hooks-backoff=1s
```

**Configuration Reference**:

| Option | Description | Default |
|--------|-------------|---------|
| `-hooks-http` | Webhook endpoint URL | Required |
| `-hooks-retry` | Number of webhook retries | 3 |
| `-hooks-backoff` | Backoff between retries | 1s |
| `-s3-endpoint` | S3/SeaweedFS endpoint | Required |
| `-s3-bucket` | Default S3 bucket | uploads |
| `-max-size` | Maximum upload size (bytes) | 0 (unlimited) |
| `-timeout` | Request timeout | 30s |
| `-behind-proxy` | Trust X-Forwarded-* headers | false |

### Environment Variables

```bash
# AWS SDK configuration for S3 backend
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_ENDPOINT=http://seaweedfs-filer:8333
```

---

## Redis Configuration

### Production Configuration

```conf
# redis.conf for production
bind 0.0.0.0
port 6379

# Persistence
appendonly yes
appendfsync everysec
save 900 1
save 300 10
save 60 10000

# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Security
requirepass your-redis-password

# Performance
tcp-keepalive 60
timeout 0
```

### Memory Management

Upload tickets have 1-hour TTL by default. With typical usage:

- Average ticket size: ~200 bytes
- Peak concurrent uploads: 1000
- Memory required: ~200 KB for active tickets

The `allkeys-lru` policy automatically evicts least recently used keys if memory is full (though tickets should expire naturally).

---

## Security Considerations

### 1. Network Segmentation

```
┌────────────────────────────────────────────────────────────┐
│                     PUBLIC NETWORK                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │    Nginx     │  │     tusd     │  │  SeaweedFS   │    │
│  │   (443)      │  │   (1080)     │  │   S3 (8333)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────────┘
                          │
┌────────────────────────────────────────────────────────────┐
│                   INTERNAL NETWORK                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Backend    │  │     tusd     │  │    Redis     │    │
│  │   (2022)     │  │  (webhooks)  │  │   (6379)     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────────────────────────────────────────┘
```

### 2. Access Control

**SeaweedFS S3 Credentials**:
- Use strong, randomly generated access/secret keys
- Rotate credentials every 90 days
- Store in Docker secrets or external vault

**Redis Password**:
- Enable `requirepass` in production
- Use Redis 6+ ACL for fine-grained access

**tusd Webhook Security**:
- Endpoint only accessible on internal network
- Use shared secret verification (optional)
- Log all webhook calls for audit

### 3. SSL/TLS

All external endpoints must use SSL:

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name uploads.example.com;

    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # tusd upload endpoint
    location /files/ {
        proxy_pass http://tusd:1080/;
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
    location /files/ {
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
```

**tusd**:
```bash
curl -f http://tusd:1080/health
```

**Redis**:
```bash
redis-cli ping
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
   - tusd webhook latency
   - Redis operation duration
   - SeaweedFS response times

3. **Error Rates**
   - Failed uploads
   - Authentication rejections
   - Redis errors

---

## Troubleshooting

### Common Issues

#### 1. Uploads Fail with 401 Unauthorized

**Symptoms**: tusd returns 401, upload rejected

**Checklist**:
- [ ] Verify token exists in Redis: `GET ticket:{token}`
- [ ] Check token expiration: `TTL ticket:{token}`
- [ ] Verify userId matches between ticket and metadata
- [ ] Check tusd webhook logs for detailed error

**Debug Commands**:
```bash
# Check Redis for ticket
docker exec redis redis-cli GET "ticket:your-token"

# View tusd logs
docker logs tusd

# Test webhook manually
curl -X POST http://backend:2022/tus-hooks \
  -H "Content-Type: application/json" \
  -d '{"Type":"pre-create","Event":{"Upload":{"ID":"test","Size":1024,"MetaData":{"token":"your-token","userId":"user-id","filename":"test.txt"}},"HTTPRequest":{"Header":{}}}}'
```

#### 2. SeaweedFS Connection Errors

**Symptoms**: tusd cannot connect to S3 endpoint

**Checklist**:
- [ ] Verify SeaweedFS filer is running: `curl http://seaweedfs-filer:8333/`
- [ ] Check S3 credentials match
- [ ] Verify network connectivity between containers
- [ ] Check SeaweedFS filer logs

#### 3. Redis Connection Timeout

**Symptoms**: Backend cannot connect to Redis

**Checklist**:
- [ ] Verify Redis is running: `docker exec redis redis-cli ping`
- [ ] Check network connectivity
- [ ] Review Redis maxmemory settings
- [ ] Check for firewall rules blocking port 6379

#### 4. Slow Upload Performance

**Symptoms**: Uploads are slower than expected

**Solutions**:
- Increase `client_max_body_size` in nginx
- Disable proxy buffering for tusd
- Use SSD for SeaweedFS volume storage
- Enable SeaweedFS volume preallocation

```nginx
location /files/ {
    proxy_pass http://tusd:1080/;
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

# Redis info
docker exec redis redis-cli info

# Clear expired tickets manually
docker exec redis redis-cli --eval clear-expired.lua

# Restart services
docker service update --force pjapp_tusd
docker service update --force pjapp_seaweedfs-filer
```

---

## References

- [SeaweedFS Documentation](https://github.com/seaweedfs/seaweedfs/wiki)
- [tusd Documentation](https://github.com/tus/tusd/blob/main/docs/usage-package.md)
- [tus Protocol Specification](https://tus.io/protocols/resumable-upload.html)
- [Redis Persistence Documentation](https://redis.io/docs/management/persistence/)
