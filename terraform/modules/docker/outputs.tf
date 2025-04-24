output "container_port" {
  value = local.internal_port
}

output "port" {
  value = var.expose ? docker_container.catan.ports[0].external : null
}

output "name" {
  value = docker_container.catan.name
}
