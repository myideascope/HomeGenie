# Project Information
output "project_id" {
  description = "Google Cloud Project ID"
  value       = var.project_id
}

output "region" {
  description = "Google Cloud region"
  value       = var.region
}

# Network Outputs
output "vpc_network_name" {
  description = "VPC network name"
  value       = google_compute_network.main.name
}

output "vpc_network_id" {
  description = "VPC network ID"
  value       = google_compute_network.main.id
}

output "subnet_name" {
  description = "Subnet name"
  value       = google_compute_subnetwork.main.name
}

output "subnet_cidr" {
  description = "Subnet CIDR range"
  value       = google_compute_subnetwork.main.ip_cidr_range
}

output "vpc_connector_name" {
  description = "VPC Access Connector name"
  value       = google_vpc_access_connector.main.name
}

# Database Outputs
output "database_instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.main.name
}

output "database_instance_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.main.connection_name
}

output "database_private_ip" {
  description = "Cloud SQL instance private IP"
  value       = google_sql_database_instance.main.private_ip_address
}

output "database_name" {
  description = "Database name"
  value       = google_sql_database.main.name
}

output "database_username" {
  description = "Database username"
  value       = google_sql_user.main.name
}

# Cloud Run Service Outputs
output "backend_service_name" {
  description = "Backend Cloud Run service name"
  value       = google_cloud_run_v2_service.backend.name
}

output "backend_service_url" {
  description = "Backend Cloud Run service URL"
  value       = google_cloud_run_v2_service.backend.uri
}

output "frontend_service_name" {
  description = "Frontend Cloud Run service name"
  value       = google_cloud_run_v2_service.frontend.name
}

output "frontend_service_url" {
  description = "Frontend Cloud Run service URL"
  value       = google_cloud_run_v2_service.frontend.uri
}

# API Endpoints
output "api_url" {
  description = "Backend API URL"
  value       = "${google_cloud_run_v2_service.backend.uri}/api"
}

output "application_url" {
  description = "Frontend application URL"
  value       = google_cloud_run_v2_service.frontend.uri
}

# Service Account
output "service_account_email" {
  description = "Cloud Run service account email"
  value       = google_service_account.cloudrun_sa.email
}

# Secret Manager
output "db_password_secret_name" {
  description = "Database password secret name"
  value       = google_secret_manager_secret.db_password.secret_id
}

output "jwt_secret_secret_name" {
  description = "JWT secret name"
  value       = google_secret_manager_secret.jwt_secret.secret_id
}

# Load Balancer Outputs (when enabled)
output "load_balancer_ip" {
  description = "Load balancer IP address"
  value       = var.enable_load_balancer ? google_compute_global_address.lb_ip[0].address : null
}

output "load_balancer_url" {
  description = "Load balancer URL"
  value = var.enable_load_balancer ? (
    var.domain_name != "" ? "https://${var.domain_name}" : "http://${google_compute_global_address.lb_ip[0].address}"
  ) : null
}

# Database Connection Information
output "database_connection_string" {
  description = "Database connection string (without password)"
  value       = "postgresql://${google_sql_user.main.name}:PASSWORD@${google_sql_database_instance.main.private_ip_address}:5432/${google_sql_database.main.name}"
  sensitive   = false
}

# Environment Configuration
output "environment_variables" {
  description = "Environment variables for local development"
  value = {
    GOOGLE_CLOUD_PROJECT = var.project_id
    API_URL             = "${google_cloud_run_v2_service.backend.uri}/api"
    FRONTEND_URL        = google_cloud_run_v2_service.frontend.uri
    DB_HOST             = google_sql_database_instance.main.private_ip_address
    DB_NAME             = google_sql_database.main.name
    DB_USER             = google_sql_user.main.name
  }
}

# Deployment Summary
output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    project_id        = var.project_id
    region           = var.region
    environment      = var.environment
    frontend_url     = google_cloud_run_v2_service.frontend.uri
    backend_url      = google_cloud_run_v2_service.backend.uri
    api_url          = "${google_cloud_run_v2_service.backend.uri}/api"
    database_instance = google_sql_database_instance.main.name
    load_balancer_enabled = var.enable_load_balancer
    domain_name      = var.domain_name != "" ? var.domain_name : "Not configured"
  }
}

# Cloud Build Information
output "cloud_build_trigger_info" {
  description = "Information for setting up Cloud Build triggers"
  value = {
    backend_image_url  = "${var.backend_image}:${var.backend_image_tag}"
    frontend_image_url = "${var.frontend_image}:${var.frontend_image_tag}"
    project_id        = var.project_id
    region           = var.region
  }
}

# Monitoring and Logging
output "logging_info" {
  description = "Cloud Logging information"
  value = {
    backend_logs_filter  = "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${google_cloud_run_v2_service.backend.name}\""
    frontend_logs_filter = "resource.type=\"cloud_run_revision\" resource.labels.service_name=\"${google_cloud_run_v2_service.frontend.name}\""
  }
}

# Network Security
output "network_security_info" {
  description = "Network security configuration"
  value = {
    vpc_connector           = google_vpc_access_connector.main.name
    private_services_range  = google_compute_global_address.private_ip_address.name
    database_private_access = "Enabled"
  }
}