# Network Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "internet_gateway_id" {
  description = "Internet Gateway ID"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "NAT Gateway IDs"
  value       = aws_nat_gateway.main[*].id
}

# Security Group Outputs
output "alb_security_group_id" {
  description = "ALB Security Group ID"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ECS Security Group ID"
  value       = aws_security_group.ecs_tasks.id
}

output "rds_security_group_id" {
  description = "RDS Security Group ID"
  value       = aws_security_group.rds.id
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "database_username" {
  description = "Database username"
  value       = aws_db_instance.main.username
}

# Load Balancer Outputs
output "load_balancer_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "load_balancer_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "ALB zone ID"
  value       = aws_lb.main.zone_id
}

output "load_balancer_url" {
  description = "Application URL"
  value       = "http://${aws_lb.main.dns_name}"
}

output "api_url" {
  description = "API URL"
  value       = "http://${aws_lb.main.dns_name}/api"
}

# ECS Outputs
output "ecs_cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  description = "Frontend ECS service name"
  value       = aws_ecs_service.frontend.name
}

output "backend_task_definition_arn" {
  description = "Backend task definition ARN"
  value       = aws_ecs_task_definition.backend.arn
}

output "frontend_task_definition_arn" {
  description = "Frontend task definition ARN"
  value       = aws_ecs_task_definition.frontend.arn
}

# Target Group Outputs
output "backend_target_group_arn" {
  description = "Backend target group ARN"
  value       = aws_lb_target_group.backend.arn
}

output "frontend_target_group_arn" {
  description = "Frontend target group ARN"
  value       = aws_lb_target_group.frontend.arn
}

# IAM Outputs
output "ecs_task_execution_role_arn" {
  description = "ECS task execution role ARN"
  value       = aws_iam_role.ecs_task_execution_role.arn
}

output "ecs_task_role_arn" {
  description = "ECS task role ARN"
  value       = aws_iam_role.ecs_task_role.arn
}

# CloudWatch Outputs
output "backend_log_group_name" {
  description = "Backend CloudWatch log group name"
  value       = aws_cloudwatch_log_group.backend.name
}

output "frontend_log_group_name" {
  description = "Frontend CloudWatch log group name"
  value       = aws_cloudwatch_log_group.frontend.name
}

# SSM Parameter Outputs
output "db_password_parameter_arn" {
  description = "Database password SSM parameter ARN"
  value       = aws_ssm_parameter.db_password.arn
}

output "jwt_secret_parameter_arn" {
  description = "JWT secret SSM parameter ARN"
  value       = aws_ssm_parameter.jwt_secret.arn
}

# Auto Scaling Outputs
output "backend_autoscaling_target_resource_id" {
  description = "Backend autoscaling target resource ID"
  value       = aws_appautoscaling_target.backend.resource_id
}

output "frontend_autoscaling_target_resource_id" {
  description = "Frontend autoscaling target resource ID"
  value       = aws_appautoscaling_target.frontend.resource_id
}

# Database Connection String
output "database_url" {
  description = "Database connection URL (without password)"
  value       = "postgresql://${aws_db_instance.main.username}:PASSWORD@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  sensitive   = false
}

# Environment Summary
output "deployment_summary" {
  description = "Deployment summary"
  value = {
    environment       = var.environment
    region           = var.aws_region
    application_url  = "http://${aws_lb.main.dns_name}"
    api_url          = "http://${aws_lb.main.dns_name}/api"
    database_endpoint = aws_db_instance.main.endpoint
    ecs_cluster      = aws_ecs_cluster.main.name
  }
}