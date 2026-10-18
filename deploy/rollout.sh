#!/usr/bin/env bash
# Sobe só o container do OrbiBots. Não para outros projetos, não faz prune
# e não recarrega o Nginx.
set -euo pipefail

case "${ORBIBOTS_ENV:-}" in
  staging)
    deploy_dir=/opt/orbibots/staging
    port=3210
    project=orbibots-staging
    ;;
  production)
    deploy_dir=/opt/orbibots/production
    port=3211
    project=orbibots-production
    ;;
  *)
    echo "Ambiente recusado: ${ORBIBOTS_ENV:-vazio}" >&2
    exit 1
    ;;
esac

case "${ORBIBOTS_IMAGE:-}" in
  ghcr.io/heinrick7/orbibots-frontend:*) ;;
  *)
    echo "Imagem recusada: ${ORBIBOTS_IMAGE:-vazia}" >&2
    exit 1
    ;;
esac

cd "$deploy_dir"
export ORBIBOTS_PORT="$port"
export COMPOSE_PROJECT_NAME="$project"
export DOCKER_CONFIG=/opt/orbibots/.docker

docker compose -p "$project" -f docker-compose.yml config --quiet

container_id="$(docker compose -p "$project" -f docker-compose.yml ps -q web 2>/dev/null || true)"
previous_image=""
if [[ -n "$container_id" ]]; then
  previous_image="$(docker inspect "$container_id" --format '{{.Config.Image}}')"
fi

docker compose -p "$project" -f docker-compose.yml pull web
if ! docker compose -p "$project" -f docker-compose.yml up -d --no-deps --wait web; then
  echo "A nova versão não ficou saudável." >&2
  if [[ -n "$previous_image" ]]; then
    echo "Restaurando ${previous_image}" >&2
    ORBIBOTS_IMAGE="$previous_image" docker compose -p "$project" -f docker-compose.yml up -d --no-deps --wait web || true
  fi
  exit 1
fi

docker compose -p "$project" -f docker-compose.yml ps
