terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.2"
    }
  }
}

locals {
  image         = "${var.image_name}:${var.image_version}"
  internal_port = 3000
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

  dynamic "ports" {
    for_each = var.expose ? [var.port] : []

    content {
      internal = local.internal_port
      external = ports.value
    }
  }

  volumes {
    container_path = "/app/games"
    volume_name    = docker_volume.games.name
    read_only      = false
  }

  network_mode = "bridge"

  dynamic "networks_advanced" {
    for_each = var.networks
    iterator = net

    content {
      name = net.value["name"]
    }
  }

  healthcheck {
    test         = ["CMD", "curl", "-f", "localhost:${local.internal_port}/health"]
    interval     = "5s"
    retries      = 2
    start_period = "1s"
    timeout      = "500ms"
  }

  env = [
    "catan_port=${local.internal_port}",
  ]
}
