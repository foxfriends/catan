terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
  }
}

locals {
  image = "${var.image_name}:${var.image_version}"
}

data "docker_registry_image" "catan" {
  name = local.image
}

resource "docker_image" "catan" {
  name          = local.image
  pull_triggers = [data.docker_registry_image.catan.sha256_digest]
}

resource "docker_volume" "games" {
  name = "${var.name}-games"
}

resource "docker_container" "catan" {
  image   = docker_image.catan.image_id
  name    = var.name
  restart = var.restart

  ports {
    internal = 3000
  }

  volumes {
    container_path = "/app/games"
    volume_name    = docker_volume.games.name
    read_only      = false
  }

  network_mode = "bridge"

  healthcheck {
    test         = ["CMD", "curl", "-f", "localhost:3000/health"]
    interval     = "5s"
    retries      = 2
    start_period = "1s"
    timeout      = "500ms"
  }

  env = [
    "catan_port=3000",
  ]
}
