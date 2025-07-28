# Google Cloud Deployment for HomeGenie
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "servicenetworking.googleapis.com",
    "vpcaccess.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "cloudbuild.googleapis.com",
    "containerregistry.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "secretmanager.googleapis.com"
  ])

  project = var.project_id
  service = each.value

  disable_dependent_services = false
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "${var.project_name}-vpc"
  auto_create_subnetworks = false

  depends_on = [google_project_service.required_apis]
}

resource "google_compute_subnetwork" "main" {
  name          = "${var.project_name}-subnet"
  ip_cidr_range = var.subnet_cidr
  region        = var.region
  network       = google_compute_network.main.id

  secondary_ip_range {
    range_name    = "services-range"
    ip_cidr_range = var.services_cidr
  }

  secondary_ip_range {
    range_name    = "pods-range"
    ip_cidr_range = var.pods_cidr
  }
}

# VPC Connector for Cloud Run
resource "google_vpc_access_connector" "main" {
  name          = "${var.project_name}-connector"
  region        = var.region
  ip_cidr_range = var.connector_cidr
  network       = google_compute_network.main.name

  depends_on = [google_project_service.required_apis]
}

# Private Service Connection
resource "google_compute_global_address" "private_ip_address" {
  name          = "${var.project_name}-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.main.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.main.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

# Cloud SQL Database
resource "google_sql_database_instance" "main" {
  name             = "${var.project_name}-db-${random_id.db_name_suffix.hex}"
  database_version = var.postgres_version
  region          = var.region

  settings {
    tier = var.db_instance_class
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
    }

    backup_configuration {
      enabled                        = true
      start_time                    = "03:00"
      location                      = var.region
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = var.backup_retention_days
      backup_retention_settings {
        retained_backups = var.backup_retention_days
        retention_unit   = "COUNT"
      }
    }

    maintenance_window {
      day          = 7  # Sunday
      hour         = 4
      update_track = "stable"
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    database_flags {
      name  = "log_disconnections"
      value = "on"
    }

    database_flags {
      name  = "log_lock_waits"
      value = "on"
    }

    insights_config {
      query_insights_enabled  = true
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }
  }

  deletion_protection = var.environment == "production"

  depends_on = [google_service_networking_connection.private_vpc_connection]
}

resource "random_id" "db_name_suffix" {
  byte_length = 4
}

resource "google_sql_database" "main" {
  name     = var.db_name
  instance = google_sql_database_instance.main.name
}

resource "google_sql_user" "main" {
  name     = var.db_username
  instance = google_sql_database_instance.main.name
  password = var.db_password
}

# Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.project_name}-db-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = var.db_password
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "${var.project_name}-jwt-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.required_apis]
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = var.jwt_secret
}

# Service Account for Cloud Run
resource "google_service_account" "cloudrun_sa" {
  account_id   = "${var.project_name}-cloudrun-sa"
  display_name = "HomeGenie Cloud Run Service Account"
}

resource "google_project_iam_member" "cloudrun_sa_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_project_iam_member" "cloudrun_sa_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_project_iam_member" "cloudrun_sa_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_project_iam_member" "cloudrun_sa_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_project_iam_member" "cloudrun_sa_trace" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# Cloud Run Backend Service
resource "google_cloud_run_v2_service" "backend" {
  name     = "${var.project_name}-backend"
  location = var.region

  template {
    service_account = google_service_account.cloudrun_sa.email

    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    scaling {
      min_instance_count = var.backend_min_instances
      max_instance_count = var.backend_max_instances
    }

    containers {
      image = "${var.backend_image}:${var.backend_image_tag}"

      ports {
        container_port = 8080
      }

      resources {
        limits = {
          cpu    = var.backend_cpu
          memory = var.backend_memory
        }
      }

      env {
        name  = "API_PORT"
        value = "8080"
      }

      env {
        name  = "API_HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "DB_HOST"
        value = google_sql_database_instance.main.private_ip_address
      }

      env {
        name  = "DB_PORT"
        value = "5432"
      }

      env {
        name  = "DB_NAME"
        value = var.db_name
      }

      env {
        name  = "DB_USER"
        value = var.db_username
      }

      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.secret_id
            version = "latest"
          }
        }
      }

      env {
        name  = "OTEL_SERVICE_NAME"
        value = "homegenie-backend"
      }

      env {
        name  = "OTEL_RESOURCE_ATTRIBUTES"
        value = "service.name=homegenie-backend,service.version=1.0.0,deployment.environment=${var.environment}"
      }

      env {
        name  = "GOOGLE_CLOUD_PROJECT"
        value = var.project_id
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 10
        timeout_seconds      = 3
        period_seconds       = 10
        failure_threshold    = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 8080
        }
        initial_delay_seconds = 30
        timeout_seconds      = 3
        period_seconds       = 30
        failure_threshold    = 3
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.required_apis]
}

# Cloud Run Frontend Service
resource "google_cloud_run_v2_service" "frontend" {
  name     = "${var.project_name}-frontend"
  location = var.region

  template {
    service_account = google_service_account.cloudrun_sa.email

    scaling {
      min_instance_count = var.frontend_min_instances
      max_instance_count = var.frontend_max_instances
    }

    containers {
      image = "${var.frontend_image}:${var.frontend_image_tag}"

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = var.frontend_cpu
          memory = var.frontend_memory
        }
      }

      env {
        name  = "REACT_APP_API_URL"
        value = "${google_cloud_run_v2_service.backend.uri}/api"
      }

      startup_probe {
        http_get {
          path = "/"
          port = 3000
        }
        initial_delay_seconds = 10
        timeout_seconds      = 3
        period_seconds       = 10
        failure_threshold    = 3
      }

      liveness_probe {
        http_get {
          path = "/"
          port = 3000
        }
        initial_delay_seconds = 30
        timeout_seconds      = 3
        period_seconds       = 30
        failure_threshold    = 3
      }
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [google_project_service.required_apis]
}

# IAM Policy for Cloud Run Public Access
resource "google_cloud_run_service_iam_member" "backend_public" {
  location = google_cloud_run_v2_service.backend.location
  service  = google_cloud_run_v2_service.backend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_cloud_run_service_iam_member" "frontend_public" {
  location = google_cloud_run_v2_service.frontend.location
  service  = google_cloud_run_v2_service.frontend.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Load Balancer (Optional)
resource "google_compute_global_address" "lb_ip" {
  count = var.enable_load_balancer ? 1 : 0
  name  = "${var.project_name}-lb-ip"
}

resource "google_compute_managed_ssl_certificate" "lb_ssl" {
  count = var.enable_load_balancer && var.domain_name != "" ? 1 : 0
  name  = "${var.project_name}-ssl-cert"

  managed {
    domains = [var.domain_name]
  }
}

resource "google_compute_backend_service" "frontend_backend" {
  count                 = var.enable_load_balancer ? 1 : 0
  name                  = "${var.project_name}-frontend-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 30
  
  backend {
    group = google_compute_region_network_endpoint_group.frontend_neg[0].id
  }

  health_checks = [google_compute_health_check.frontend_health[0].id]
}

resource "google_compute_backend_service" "backend_backend" {
  count                 = var.enable_load_balancer ? 1 : 0
  name                  = "${var.project_name}-backend-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTP"
  port_name             = "http"
  timeout_sec           = 30
  
  backend {
    group = google_compute_region_network_endpoint_group.backend_neg[0].id
  }

  health_checks = [google_compute_health_check.backend_health[0].id]
}

resource "google_compute_region_network_endpoint_group" "frontend_neg" {
  count                 = var.enable_load_balancer ? 1 : 0
  name                  = "${var.project_name}-frontend-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.frontend.name
  }
}

resource "google_compute_region_network_endpoint_group" "backend_neg" {
  count                 = var.enable_load_balancer ? 1 : 0
  name                  = "${var.project_name}-backend-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.backend.name
  }
}

resource "google_compute_health_check" "frontend_health" {
  count = var.enable_load_balancer ? 1 : 0
  name  = "${var.project_name}-frontend-health"

  http_health_check {
    port         = 80
    request_path = "/"
  }
}

resource "google_compute_health_check" "backend_health" {
  count = var.enable_load_balancer ? 1 : 0
  name  = "${var.project_name}-backend-health"

  http_health_check {
    port         = 80
    request_path = "/health"
  }
}

resource "google_compute_url_map" "lb_url_map" {
  count           = var.enable_load_balancer ? 1 : 0
  name            = "${var.project_name}-lb-url-map"
  default_service = google_compute_backend_service.frontend_backend[0].id

  path_matcher {
    name            = "api-paths"
    default_service = google_compute_backend_service.frontend_backend[0].id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.backend_backend[0].id
    }
  }

  host_rule {
    hosts        = var.domain_name != "" ? [var.domain_name] : ["*"]
    path_matcher = "api-paths"
  }
}

resource "google_compute_target_https_proxy" "lb_https_proxy" {
  count   = var.enable_load_balancer && var.domain_name != "" ? 1 : 0
  name    = "${var.project_name}-https-proxy"
  url_map = google_compute_url_map.lb_url_map[0].id
  ssl_certificates = [
    google_compute_managed_ssl_certificate.lb_ssl[0].id
  ]
}

resource "google_compute_target_http_proxy" "lb_http_proxy" {
  count   = var.enable_load_balancer ? 1 : 0
  name    = "${var.project_name}-http-proxy"
  url_map = google_compute_url_map.lb_url_map[0].id
}

resource "google_compute_global_forwarding_rule" "lb_forwarding_rule_https" {
  count                 = var.enable_load_balancer && var.domain_name != "" ? 1 : 0
  name                  = "${var.project_name}-forwarding-rule-https"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.lb_https_proxy[0].id
  ip_address            = google_compute_global_address.lb_ip[0].id
}

resource "google_compute_global_forwarding_rule" "lb_forwarding_rule_http" {
  count                 = var.enable_load_balancer ? 1 : 0
  name                  = "${var.project_name}-forwarding-rule-http"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.lb_http_proxy[0].id
  ip_address            = google_compute_global_address.lb_ip[0].id
}