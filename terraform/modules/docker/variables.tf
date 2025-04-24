# Common variables
variable "name" {
  type = string
}

variable "expose" {
  type    = bool
  default = true
}

variable "port" {
  type     = number
  nullable = true
  default  = null
}

variable "networks" {
  type = list(object({
    name = string
  }))
  default = []
}

variable "restart" {
  type    = string
  default = "unless-stopped"
}

# Default variables
variable "image_name" {
  type    = string
  default = "ghcr.io/foxfriends/catan"
}

variable "image_version" {
  type    = string
  default = "main"
}
