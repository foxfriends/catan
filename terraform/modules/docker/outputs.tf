output "port" {
  value = docker_container.catan.ports[0].external
}
