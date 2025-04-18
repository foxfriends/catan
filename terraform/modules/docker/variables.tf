variable "name" {
  type = string
}

variable "image_name" {
  type    = string
  default = "ghcr.io/foxfriends/catan"
}

variable "image_version" {
  type    = string
  default = "main"
}

variable "restart" {
  type    = string
  default = "unless-stopped"
}
