# Project Configuration
variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "homegenie"
}

# Network Configuration
variable "subnet_cidr" {
  description = "CIDR block for the main subnet"
  type        = string
  default     = "10.0.0.0/24"
}

variable "services_cidr" {
  description = "CIDR block for services secondary range"
  type        = string
  default     = "10.1.0.0/20"
}

variable "pods_cidr" {
  description = "CIDR block for pods secondary range"
  type        = string
  default     = "10.2.0.0/20"
}

variable "connector_cidr" {
  description = "CIDR block for VPC connector"
  type        = string
  default     = "10.3.0.0/28"
}

# Database Configuration
variable "db_name" {
  description = "Database name"
  type        = string
  default     = "homegenie"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "homegenie"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db-f1-micro"
}

variable "backup_retention_days" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

# Cloud Run Configuration
variable "backend_image" {
  description = "Backend Docker image"
  type        = string
  default     = "gcr.io/PROJECT_ID/homegenie-backend"
}

variable "backend_image_tag" {
  description = "Backend Docker image tag"
  type        = string
  default     = "latest"
}

variable "frontend_image" {
  description = "Frontend Docker image"
  type        = string
  default     = "gcr.io/PROJECT_ID/homegenie-frontend"
}

variable "frontend_image_tag" {
  description = "Frontend Docker image tag"
  type        = string
  default     = "latest"
}

variable "backend_cpu" {
  description = "Backend CPU allocation"
  type        = string
  default     = "1000m"
}

variable "backend_memory" {
  description = "Backend memory allocation"
  type        = string
  default     = "2Gi"
}

variable "frontend_cpu" {
  description = "Frontend CPU allocation"
  type        = string
  default     = "1000m"
}

variable "frontend_memory" {
  description = "Frontend memory allocation"
  type        = string
  default     = "1Gi"
}

variable "backend_min_instances" {
  description = "Minimum number of backend instances"
  type        = number
  default     = 1
}

variable "backend_max_instances" {
  description = "Maximum number of backend instances"
  type        = number
  default     = 10
}

variable "frontend_min_instances" {
  description = "Minimum number of frontend instances"
  type        = number
  default     = 1
}

variable "frontend_max_instances" {
  description = "Maximum number of frontend instances"
  type        = number
  default     = 5
}

# Application Configuration
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

# Load Balancer Configuration
variable "enable_load_balancer" {
  description = "Enable Google Cloud Load Balancer"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

# Monitoring Configuration
variable "enable_monitoring" {
  description = "Enable Cloud Monitoring and Logging"
  type        = bool
  default     = true
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "INFO"
  
  validation {
    condition     = contains(["DEBUG", "INFO", "WARN", "ERROR"], var.log_level)
    error_message = "Log level must be DEBUG, INFO, WARN, or ERROR."
  }
}

# Labels
variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default = {
    managed-by = "terraform"
    project    = "homegenie"
  }
}