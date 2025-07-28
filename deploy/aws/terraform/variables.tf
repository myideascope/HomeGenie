# General Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
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

# Network Variables
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24"]
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for private subnets"
  type        = bool
  default     = true
}

# Database Variables
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
  default     = "15.4"
}

variable "db_instance_class" {
  description = "Database instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Database allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Database max allocated storage in GB"
  type        = number
  default     = 100
}

variable "backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = true
}

variable "enable_enhanced_monitoring" {
  description = "Enable RDS Enhanced Monitoring"
  type        = bool
  default     = true
}

# ECS Variables
variable "backend_image" {
  description = "Backend Docker image"
  type        = string
  default     = "your-registry/homegenie-backend"
}

variable "backend_image_tag" {
  description = "Backend Docker image tag"
  type        = string
  default     = "latest"
}

variable "frontend_image" {
  description = "Frontend Docker image"
  type        = string
  default     = "your-registry/homegenie-frontend"
}

variable "frontend_image_tag" {
  description = "Frontend Docker image tag"
  type        = string
  default     = "latest"
}

variable "backend_cpu" {
  description = "Backend CPU units"
  type        = number
  default     = 512
}

variable "backend_memory" {
  description = "Backend memory in MB"
  type        = number
  default     = 1024
}

variable "frontend_cpu" {
  description = "Frontend CPU units"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Frontend memory in MB"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
  default     = 2
}

variable "frontend_desired_count" {
  description = "Desired number of frontend tasks"
  type        = number
  default     = 2
}

variable "backend_min_capacity" {
  description = "Minimum number of backend tasks"
  type        = number
  default     = 1
}

variable "backend_max_capacity" {
  description = "Maximum number of backend tasks"
  type        = number
  default     = 10
}

variable "frontend_min_capacity" {
  description = "Minimum number of frontend tasks"
  type        = number
  default     = 1
}

variable "frontend_max_capacity" {
  description = "Maximum number of frontend tasks"
  type        = number
  default     = 5
}

# Application Variables
variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

# Monitoring Variables
variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30
}

# Domain Variables (optional)
variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
  default     = ""
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}