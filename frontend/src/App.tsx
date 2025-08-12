import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Home, 
  Calendar, 
  CheckSquare, 
  Settings, 
  Bell, 
  Plus,
  Wrench,
  AlertTriangle,
  Clock,
  TrendingUp,
  Users,
  Activity,
  Menu,
  X,
  Edit,
  Trash2,
  MoreHorizontal,
  Filter,
  Search,
  CalendarDays,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Task types and interfaces
interface Task {
  id: number;
  title: string;
  description?: string;
  property: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  status: "pending" | "in_progress" | "completed" | "overdue";
  category: string;
  estimatedTime?: number;
  assignee?: string;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

interface Property {
  id: number;
  name: string;
  address: string;
  type: "house" | "apartment" | "condo" | "townhouse" | "other";
  yearBuilt?: number;
  squareFootage?: number;
  rooms: Room[];
  maintenanceHistory: MaintenanceRecord[];
  notes?: string;
  createdAt: string;
}

interface Room {
  id: number;
  name: string;
  type: "bedroom" | "bathroom" | "kitchen" | "living" | "garage" | "basement" | "attic" | "office" | "other";
  floorArea?: number;
  description?: string;
}

interface MaintenanceRecord {
  id: number;
  taskId?: number;
  title: string;
  description: string;
  completedDate: string;
  cost?: number;
  contractor?: string;
  notes?: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  timezone: string;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    theme: "light" | "dark" | "system";
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
    timeFormat: "12h" | "24h";
  };
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Notification types and interfaces
interface Notification {
  id: number;
  title: string;
  message: string;
  type: "task_reminder" | "maintenance_due" | "system" | "alert";
  priority: "low" | "medium" | "high";
  read: boolean;
  taskId?: number;
  propertyId?: number;
  createdAt: string;
  scheduledFor?: string;
  actionUrl?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  reminderAdvance: number; // days before due date
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  taskReminders: boolean;
  maintenanceAlerts: boolean;
  systemNotifications: boolean;
}

export default function HomeGenie() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 1,
      title: "Clean HVAC filters",
      description: "Replace or clean all HVAC filters in the main system",
      property: "Main House",
      priority: "high",
      dueDate: "2024-08-11",
      status: "overdue",
      category: "HVAC",
      estimatedTime: 30,
      assignee: "John Doe",
      createdAt: "2024-08-01"
    },
    {
      id: 2,
      title: "Check smoke detectors",
      description: "Test all smoke detectors and replace batteries if needed",
      property: "Garage",
      priority: "medium",
      dueDate: "2024-08-12",
      status: "pending",
      category: "Safety",
      estimatedTime: 15,
      assignee: "John Doe",
      createdAt: "2024-08-05"
    },
    {
      id: 3,
      title: "Inspect roof gutters",
      description: "Check for clogs, damage, and proper drainage",
      property: "Main House",
      priority: "low",
      dueDate: "2024-08-18",
      status: "pending",
      category: "Exterior",
      estimatedTime: 45,
      assignee: "John Doe",
      createdAt: "2024-08-08"
    },
    {
      id: 4,
      title: "Service water heater",
      description: "Annual maintenance check and flushing",
      property: "Basement",
      priority: "high",
      dueDate: "2024-08-13",
      status: "pending",
      category: "Plumbing",
      estimatedTime: 60,
      assignee: "John Doe",
      createdAt: "2024-08-09"
    }
  ]);
  const [taskFilter, setTaskFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [properties, setProperties] = useState<Property[]>([
    {
      id: 1,
      name: "Main House",
      address: "123 Oak Street, Springfield, IL 62701",
      type: "house",
      yearBuilt: 1985,
      squareFootage: 2400,
      rooms: [
        { id: 1, name: "Master Bedroom", type: "bedroom", floorArea: 300 },
        { id: 2, name: "Guest Bedroom", type: "bedroom", floorArea: 200 },
        { id: 3, name: "Master Bathroom", type: "bathroom", floorArea: 120 },
        { id: 4, name: "Kitchen", type: "kitchen", floorArea: 250 },
        { id: 5, name: "Living Room", type: "living", floorArea: 400 },
        { id: 6, name: "Home Office", type: "office", floorArea: 150 }
      ],
      maintenanceHistory: [
        {
          id: 1,
          title: "HVAC System Servicing",
          description: "Annual maintenance and filter replacement",
          completedDate: "2024-08-01",
          cost: 280,
          contractor: "ABC HVAC Services"
        },
        {
          id: 2,
          title: "Roof Inspection",
          description: "Annual roof inspection and minor repairs",
          completedDate: "2024-07-15",
          cost: 150,
          contractor: "Summit Roofing"
        }
      ],
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      name: "Garage",
      address: "123 Oak Street - Detached Garage",
      type: "other",
      yearBuilt: 1985,
      squareFootage: 600,
      rooms: [
        { id: 7, name: "Main Garage", type: "garage", floorArea: 500 },
        { id: 8, name: "Storage Loft", type: "other", floorArea: 100 }
      ],
      maintenanceHistory: [
        {
          id: 3,
          title: "Garage Door Maintenance",
          description: "Lubricated springs and checked opener",
          completedDate: "2024-07-30",
          cost: 80,
          contractor: "Self"
        }
      ],
      createdAt: "2024-01-15"
    },
    {
      id: 3,
      name: "Garden Shed",
      address: "123 Oak Street - Backyard Shed",
      type: "other",
      yearBuilt: 2010,
      squareFootage: 120,
      rooms: [
        { id: 9, name: "Tool Storage", type: "other", floorArea: 80 },
        { id: 10, name: "Garden Supply Storage", type: "other", floorArea: 40 }
      ],
      maintenanceHistory: [],
      createdAt: "2024-01-15"
    }
  ]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  // Authentication state
  const [authState, setAuthState] = useState<AuthState>({
    user: {
      id: 1,
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      phone: "+1 (555) 123-4567",
      timezone: "America/New_York",
      preferences: {
        emailNotifications: true,
        pushNotifications: false,
        smsNotifications: false,
        theme: "light",
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12h"
      },
      createdAt: "2024-01-15T00:00:00Z",
      lastLoginAt: "2024-08-11T10:30:00Z"
    },
    isAuthenticated: true,
    isLoading: false
  });
  
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  
  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: "Task Reminder",
      message: "HVAC filter cleaning is overdue",
      type: "task_reminder",
      priority: "high",
      read: false,
      taskId: 1,
      createdAt: "2024-08-11T09:00:00Z",
      scheduledFor: "2024-08-11T09:00:00Z"
    },
    {
      id: 2,
      title: "Maintenance Due",
      message: "Water heater service is due tomorrow",
      type: "maintenance_due",
      priority: "medium",
      read: false,
      taskId: 4,
      createdAt: "2024-08-11T08:30:00Z",
      scheduledFor: "2024-08-12T09:00:00Z"
    },
    {
      id: 3,
      title: "System Update",
      message: "HomeGenie has been updated with new features",
      type: "system",
      priority: "low",
      read: true,
      createdAt: "2024-08-10T16:00:00Z"
    }
  ]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: false,
    smsNotifications: false,
    reminderAdvance: 1, // 1 day before
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "08:00"
    },
    taskReminders: true,
    maintenanceAlerts: true,
    systemNotifications: true
  });
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");

  // Calculate dashboard stats from tasks
  const dashboardStats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === "completed").length,
    upcomingTasks: tasks.filter(t => t.status === "pending" || t.status === "in_progress").length,
    overdueTask: tasks.filter(t => t.status === "overdue").length
  };

  // Get recent tasks (last 4)
  const recentTasks = tasks.slice(-4).map(task => ({
    ...task,
    dueDate: formatDate(task.dueDate)
  }));

  // Utility functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} days`;
    if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
    return date.toLocaleDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Task CRUD operations
  const createTask = (taskData: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: Math.max(...tasks.map(t => t.id)) + 1,
      createdAt: new Date().toISOString()
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: number, updates: Partial<Task>) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const toggleTaskStatus = (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const newStatus = task.status === "completed" ? "pending" : "completed";
    const updates: Partial<Task> = { status: newStatus };
    
    if (newStatus === "completed") {
      updates.completedAt = new Date().toISOString();
    } else {
      delete updates.completedAt;
    }
    
    updateTask(id, updates);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesFilter = taskFilter === "all" || task.status === taskFilter;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.property.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Task Form Component
  const TaskForm = ({ task, onSubmit, onCancel }: {
    task?: Task | null;
    onSubmit: (taskData: Omit<Task, "id" | "createdAt">) => void;
    onCancel: () => void;
  }) => {
    const getDefaultDueDate = () => {
      if (task?.dueDate) return task.dueDate;
      if (selectedDate) return selectedDate.toISOString().split('T')[0];
      return "";
    };

    const [formData, setFormData] = useState({
      title: task?.title || "",
      description: task?.description || "",
      property: task?.property || "Main House",
      priority: task?.priority || "medium" as const,
      dueDate: getDefaultDueDate(),
      status: task?.status || "pending" as const,
      category: task?.category || "General",
      estimatedTime: task?.estimatedTime || 30,
      assignee: task?.assignee || "John Doe",
      notes: task?.notes || ""
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
      onCancel();
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="property">Property</Label>
            <Select value={formData.property} onValueChange={(value) => setFormData({ ...formData, property: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Main House">Main House</SelectItem>
                <SelectItem value="Garage">Garage</SelectItem>
                <SelectItem value="Garden Shed">Garden Shed</SelectItem>
                <SelectItem value="Basement">Basement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe the maintenance task..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={formData.priority} onValueChange={(value: "low" | "medium" | "high") => setFormData({ ...formData, priority: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HVAC">HVAC</SelectItem>
                <SelectItem value="Plumbing">Plumbing</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Exterior">Exterior</SelectItem>
                <SelectItem value="Interior">Interior</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="estimatedTime">Estimated Time (minutes)</Label>
            <Input
              id="estimatedTime"
              type="number"
              value={formData.estimatedTime}
              onChange={(e) => setFormData({ ...formData, estimatedTime: parseInt(e.target.value) || 0 })}
              placeholder="30"
              min="1"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Input
              id="assignee"
              value={formData.assignee}
              onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
              placeholder="Who will complete this task?"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes or instructions..."
            rows={2}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {task ? "Update Task" : "Create Task"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    );
  };

  // Enhanced Task Card Component
  const TaskCard = ({ task }: { task: Task }) => {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-3 flex-1">
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={task.status === "completed"}
                  onCheckedChange={() => toggleTaskStatus(task.id)}
                  className="mt-1"
                />
                <div className="space-y-2 flex-1">
                  <h3 className={`font-semibold ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                    {task.title}
                  </h3>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{task.property}</span>
                    <CalendarDays className="h-3 w-3 ml-2" />
                    <span>{formatDate(task.dueDate)}</span>
                    {task.estimatedTime && (
                      <>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{task.estimatedTime}m</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap ml-6">
                <Badge variant={getPriorityColor(task.priority) as any} className="text-xs">
                  {task.priority} priority
                </Badge>
                <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {task.category}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 sm:flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setEditingTask(task);
                    setIsTaskDialogOpen(true);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Task
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleTaskStatus(task.id)}>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    {task.status === "completed" ? "Mark Incomplete" : "Mark Complete"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => deleteTask(task.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Property Form Component
  const PropertyForm = ({ property, onSubmit, onCancel }: {
    property?: Property | null;
    onSubmit: (propertyData: Omit<Property, "id" | "createdAt">) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      name: property?.name || "",
      address: property?.address || "",
      type: property?.type || "house" as const,
      yearBuilt: property?.yearBuilt || undefined,
      squareFootage: property?.squareFootage || undefined,
      notes: property?.notes || "",
      rooms: property?.rooms || []
    });

    const [newRoom, setNewRoom] = useState<{ name: string; type: Room['type']; floorArea?: number }>({ name: "", type: "other", floorArea: undefined });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit({
        ...formData,
        maintenanceHistory: property?.maintenanceHistory || []
      });
      onCancel();
    };

    const addRoom = () => {
      if (newRoom.name.trim()) {
        setFormData({
          ...formData,
          rooms: [...formData.rooms, {
            id: Math.max(0, ...formData.rooms.map(r => r.id)) + 1,
            ...newRoom,
            floorArea: newRoom.floorArea || undefined
          }]
        });
        setNewRoom({ name: "", type: "other", floorArea: undefined });
      }
    };

    const removeRoom = (roomId: number) => {
      setFormData({
        ...formData,
        rooms: formData.rooms.filter(room => room.id !== roomId)
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Property Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Main House, Garage"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Property Type</Label>
            <Select value={formData.type} onValueChange={(value: "house" | "apartment" | "condo" | "townhouse" | "other") => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="Full property address"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="yearBuilt">Year Built</Label>
            <Input
              id="yearBuilt"
              type="number"
              value={formData.yearBuilt || ""}
              onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g., 1985"
              min="1800"
              max={new Date().getFullYear()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="squareFootage">Square Footage</Label>
            <Input
              id="squareFootage"
              type="number"
              value={formData.squareFootage || ""}
              onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="e.g., 2400"
              min="1"
            />
          </div>
        </div>

        {/* Rooms Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label>Rooms</Label>
            <Button type="button" variant="outline" size="sm" onClick={addRoom}>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </div>
          
          {/* Add Room Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 border border-border rounded-lg">
            <Input
              placeholder="Room name"
              value={newRoom.name}
              onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
            />
            <Select value={newRoom.type} onValueChange={(value: any) => setNewRoom({ ...newRoom, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bedroom">Bedroom</SelectItem>
                <SelectItem value="bathroom">Bathroom</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="living">Living Room</SelectItem>
                <SelectItem value="garage">Garage</SelectItem>
                <SelectItem value="basement">Basement</SelectItem>
                <SelectItem value="attic">Attic</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Area (sq ft)"
              value={newRoom.floorArea || ""}
              onChange={(e) => setNewRoom({ ...newRoom, floorArea: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>

          {/* Existing Rooms */}
          {formData.rooms.length > 0 && (
            <div className="space-y-2">
              {formData.rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-2 border border-border rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{room.name}</span>
                    <Badge variant="outline" className="text-xs">{room.type}</Badge>
                    {room.floorArea && <span className="text-sm text-muted-foreground">{room.floorArea} sq ft</span>}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeRoom(room.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional property information..."
            rows={3}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            {property ? "Update Property" : "Create Property"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    );
  };

  // Property Details Component
  const PropertyDetails = ({ property }: { property: Property }) => {
    const propertyTasks = getPropertyTasks(property.name);
    const activeTasks = propertyTasks.filter(t => t.status !== "completed");
    const completedTasks = propertyTasks.filter(t => t.status === "completed");
    
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">{property.name}</h3>
          <p className="text-muted-foreground">{property.address}</p>
        </div>

        {/* Property Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{activeTasks.length}</div>
                <p className="text-xs text-muted-foreground">Active Tasks</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{property.rooms.length}</div>
                <p className="text-xs text-muted-foreground">Rooms</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{property.maintenanceHistory.length}</div>
                <p className="text-xs text-muted-foreground">Maintenance Records</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {property.squareFootage ? `${property.squareFootage.toLocaleString()}` : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">Sq Ft</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="tasks" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Active Tasks ({activeTasks.length})</h4>
              {activeTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active tasks for this property</p>
              ) : (
                activeTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
              
              {completedTasks.length > 0 && (
                <>
                  <h4 className="font-medium mt-6">Recently Completed ({completedTasks.slice(-3).length})</h4>
                  {completedTasks.slice(-3).map((task) => <TaskCard key={task.id} task={task} />)}
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="rooms" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {property.rooms.map((room) => (
                <Card key={room.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium">{room.name}</h5>
                        <p className="text-sm text-muted-foreground capitalize">{room.type}</p>
                        {room.floorArea && (
                          <p className="text-sm text-muted-foreground">{room.floorArea} sq ft</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            {property.maintenanceHistory.length === 0 ? (
              <p className="text-muted-foreground text-sm">No maintenance history recorded</p>
            ) : (
              property.maintenanceHistory.map((record) => (
                <Card key={record.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h5 className="font-medium">{record.title}</h5>
                        <span className="text-sm text-muted-foreground">{formatDate(record.completedDate)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{record.description}</p>
                      <div className="flex justify-between text-sm">
                        {record.contractor && (
                          <span className="text-muted-foreground">Contractor: {record.contractor}</span>
                        )}
                        {record.cost && (
                          <span className="font-medium">${record.cost}</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  // Authentication Components
  const LoginForm = () => {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      login(formData.email, formData.password);
    };

    const switchToRegister = () => {
      setAuthMode("register");
      setFormData({ email: "", password: "" });
    };

    const switchToForgot = () => {
      setAuthMode("forgot");
      setFormData({ email: "", password: "" });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john.doe@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={authState.isLoading}>
          {authState.isLoading ? "Signing in..." : "Sign In"}
        </Button>
        <div className="text-center space-y-2">
          <Button type="button" variant="link" size="sm" onClick={switchToForgot}>
            Forgot password?
          </Button>
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button type="button" variant="link" size="sm" className="p-0" onClick={switchToRegister}>
              Sign up
            </Button>
          </div>
        </div>
      </form>
    );
  };

  const RegisterForm = () => {
    const [formData, setFormData] = useState({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: ""
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords don't match");
        return;
      }
      // Simulate registration
      login(formData.email, formData.password);
    };

    const switchToLogin = () => {
      setAuthMode("login");
      setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Doe"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john.doe@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Create a password"
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="Confirm your password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={authState.isLoading}>
          {authState.isLoading ? "Creating account..." : "Create Account"}
        </Button>
        <div className="text-center">
          <div className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button type="button" variant="link" size="sm" className="p-0" onClick={switchToLogin}>
              Sign in
            </Button>
          </div>
        </div>
      </form>
    );
  };

  const ForgotPasswordForm = () => {
    const [email, setEmail] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate password reset
      setIsSubmitted(true);
    };

    const switchToLogin = () => {
      setAuthMode("login");
      setEmail("");
      setIsSubmitted(false);
    };

    if (isSubmitted) {
      return (
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              We've sent a password reset link to {email}
            </p>
          </div>
          <Button onClick={switchToLogin} variant="outline" className="w-full">
            Back to Sign In
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@example.com"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Send Reset Link
        </Button>
        <div className="text-center">
          <Button type="button" variant="link" size="sm" onClick={switchToLogin}>
            Back to Sign In
          </Button>
        </div>
      </form>
    );
  };

  const ProfileForm = ({ user }: { user: User }) => {
    const [formData, setFormData] = useState({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      timezone: user.timezone
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      updateUserProfile(formData);
      setIsProfileDialogOpen(false);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="America/New_York">Eastern Time</SelectItem>
              <SelectItem value="America/Chicago">Central Time</SelectItem>
              <SelectItem value="America/Denver">Mountain Time</SelectItem>
              <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit" className="flex-1">
            Save Changes
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsProfileDialogOpen(false)} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    );
  };

  // Notification Panel Component
  const NotificationPanel = () => {
    const unreadCount = getUnreadNotificationCount();
    const sortedNotifications = notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const formatNotificationTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    };

    const getNotificationIcon = (type: Notification['type']) => {
      switch (type) {
        case 'task_reminder':
          return <Clock className="h-4 w-4" />;
        case 'maintenance_due':
          return <Wrench className="h-4 w-4" />;
        case 'alert':
          return <AlertTriangle className="h-4 w-4" />;
        case 'system':
          return <Settings className="h-4 w-4" />;
        default:
          return <Bell className="h-4 w-4" />;
      }
    };

    const getPriorityColor = (priority: Notification['priority']) => {
      switch (priority) {
        case 'high':
          return 'text-red-600 dark:text-red-400';
        case 'medium':
          return 'text-orange-600 dark:text-orange-400';
        case 'low':
          return 'text-blue-600 dark:text-blue-400';
        default:
          return 'text-muted-foreground';
      }
    };

    const handleNotificationClick = (notification: Notification) => {
      markNotificationAsRead(notification.id);
      
      // Navigate to relevant section if applicable
      if (notification.taskId) {
        setActiveTab('tasks');
      }
      
      setIsNotificationPanelOpen(false);
    };

    return (
      <div className="w-80 max-h-96 overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-1.5 py-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllNotificationsAsRead}
                className="text-xs h-7 px-2"
              >
                Mark all read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="text-xs h-7 px-2"
            >
              Clear all
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer border-l-2 transition-colors ${
                    notification.read 
                      ? 'border-l-transparent bg-muted/20' 
                      : 'border-l-primary bg-background'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${getPriorityColor(notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-medium text-sm leading-tight ${
                          notification.read ? 'text-muted-foreground' : 'text-foreground'
                        }`}>
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!notification.read && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markNotificationAsRead(notification.id);
                                  }}
                                >
                                  Mark as read
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <p className={`text-sm mt-1 leading-tight ${
                        notification.read ? 'text-muted-foreground' : 'text-muted-foreground'
                      }`}>
                        {notification.message}
                      </p>
                      {notification.taskId && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Task #{notification.taskId}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-3 border-t bg-muted/20">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              setActiveTab('settings');
              setIsNotificationPanelOpen(false);
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Notification Settings
          </Button>
        </div>
      </div>
    );
  };

  // Property-related functions
  const getPropertyTasks = (propertyName: string) => {
    return tasks.filter(task => task.property === propertyName);
  };

  const getLastMaintenanceDate = (property: Property) => {
    if (property.maintenanceHistory.length === 0) return "No maintenance yet";
    const lastMaintenance = property.maintenanceHistory.sort((a, b) => 
      new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime()
    )[0];
    return formatDate(lastMaintenance.completedDate);
  };

  const createProperty = (propertyData: Omit<Property, "id" | "createdAt">) => {
    const newProperty: Property = {
      ...propertyData,
      id: Math.max(...properties.map(p => p.id)) + 1,
      createdAt: new Date().toISOString()
    };
    setProperties([...properties, newProperty]);
  };

  const updateProperty = (id: number, updates: Partial<Property>) => {
    setProperties(properties.map(property => 
      property.id === id ? { ...property, ...updates } : property
    ));
  };

  const deleteProperty = (id: number) => {
    setProperties(properties.filter(property => property.id !== id));
    // Also update tasks that reference this property
    const propertyToDelete = properties.find(p => p.id === id);
    if (propertyToDelete) {
      setTasks(tasks.filter(task => task.property !== propertyToDelete.name));
    }
  };

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "properties", label: "Properties", icon: Home },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  const NavigationContent = ({ onItemClick }: { onItemClick?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Home className="h-6 w-6" />
          HomeGenie
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Smart Home Maintenance</p>
      </div>
      
      <div className="space-y-2 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                onItemClick?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                activeTab === item.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
      
      <div className="mt-auto">
        <Button 
          className="w-full" 
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setIsTaskDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  );

  // Desktop Navigation
  const DesktopNavigation = () => (
    <nav className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-card border-r border-border p-6 z-40">
      <NavigationContent />
    </nav>
  );

  // Mobile Navigation
  const MobileNavigation = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-6">
        <NavigationContent onItemClick={() => setSidebarOpen(false)} />
      </SheetContent>
    </Sheet>
  );

  const DashboardContent = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">All maintenance tasks</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{dashboardStats.completedTasks}</div>
            <p className="text-xs text-muted-foreground">Tasks finished this month</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{dashboardStats.upcomingTasks}</div>
            <p className="text-xs text-muted-foreground">Due in next 7 days</p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardStats.overdueTask}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Progress</CardTitle>
            <CardDescription>Your maintenance completion rate this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Completed Tasks</span>
                <span>{dashboardStats.completedTasks}/{dashboardStats.totalTasks}</span>
              </div>
              <Progress value={(dashboardStats.completedTasks / dashboardStats.totalTasks) * 100} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {Math.round((dashboardStats.completedTasks / dashboardStats.totalTasks) * 100)}% completion rate - Keep up the great work!
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Tasks by priority level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-sm">High Priority</span>
                </div>
                <span className="text-sm font-medium">{tasks.filter(t => t.priority === "high").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-sm">Medium Priority</span>
                </div>
                <span className="text-sm font-medium">{tasks.filter(t => t.priority === "medium").length}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded"></div>
                  <span className="text-sm">Low Priority</span>
                </div>
                <span className="text-sm font-medium">{tasks.filter(t => t.priority === "low").length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Categories</CardTitle>
            <CardDescription>Most common maintenance types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                tasks.reduce((acc, task) => {
                  acc[task.category] = (acc[task.category] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).slice(0, 5).map(([category, count]) => (
                <div key={category} className="flex justify-between items-center">
                  <span className="text-sm">{category}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${(count / tasks.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Performance</CardTitle>
            <CardDescription>Tasks by property</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {properties.map((property) => {
                const propertyTasks = getPropertyTasks(property.name).length;
                const maxTasks = Math.max(...properties.map(p => getPropertyTasks(p.name).length));
                return (
                  <div key={property.id} className="flex justify-between items-center">
                    <span className="text-sm truncate">{property.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${maxTasks > 0 ? (propertyTasks / maxTasks) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6">{propertyTasks}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const upcomingTasks = tasks
                  .filter(task => {
                    const taskDate = new Date(task.dueDate);
                    const today = new Date();
                    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return taskDate >= today && taskDate <= weekFromNow && task.status !== "completed";
                  })
                  .slice(0, 5);
                
                return upcomingTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No upcoming tasks</p>
                ) : (
                  upcomingTasks.map((task) => (
                    <div key={task.id} className="flex justify-between items-center">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.property}</p>
                      </div>
                      <Badge 
                        variant={task.priority === "high" ? "destructive" : "outline"}
                        className="text-xs ml-2"
                      >
                        {formatDate(task.dueDate)}
                      </Badge>
                    </div>
                  ))
                );
              })()
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Your latest maintenance activities</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setActiveTab("tasks")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-border rounded-lg gap-3 hover:bg-accent/5 transition-colors cursor-pointer" onClick={() => {
                setEditingTask(task);
                setIsTaskDialogOpen(true);
              }}>
                <div className="space-y-1 flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">{task.property}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge 
                    variant={task.status === "overdue" ? "destructive" : task.status === "pending" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {task.dueDate}
                  </Badge>
                  <Badge 
                    variant={getPriorityColor(task.priority) as any}
                    className="text-xs"
                  >
                    {task.priority}
                  </Badge>
                </div>
              </div>
            ))}
            {recentTasks.length === 0 && (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-2">No tasks yet</p>
                <Button size="sm" onClick={() => {
                  setEditingTask(null);
                  setIsTaskDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Task
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const PropertiesContent = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Properties</h2>
          <p className="text-muted-foreground">Manage your properties and their maintenance tasks</p>
        </div>
        <Button 
          className="sm:flex-shrink-0"
          onClick={() => {
            setEditingProperty(null);
            setSelectedProperty(null);
            setIsPropertyDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {properties.map((property) => {
          const propertyTasks = getPropertyTasks(property.name);
          const activeTasks = propertyTasks.filter(t => t.status !== "completed").length;
          
          return (
            <Card key={property.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
              setSelectedProperty(property);
              setIsPropertyDialogOpen(true);
            }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Home className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="truncate">{property.name}</span>
                </CardTitle>
                <CardDescription className="text-sm">{property.address}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Tasks</span>
                    <span className="font-medium">{activeTasks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Rooms</span>
                    <span className="font-medium">{property.rooms.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Maintenance</span>
                    <span className="font-medium">{getLastMaintenanceDate(property)}</span>
                  </div>
                  {property.squareFootage && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Square Footage</span>
                      <span className="font-medium">{property.squareFootage.toLocaleString()} sq ft</span>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProperty(property);
                        setIsPropertyDialogOpen(true);
                      }}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setEditingProperty(property);
                          setIsPropertyDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Property
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProperty(property.id);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Property
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const TasksContent = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Tasks</h2>
          <p className="text-muted-foreground">Track and manage all your home maintenance activities</p>
        </div>
        <Button 
          className="sm:flex-shrink-0"
          onClick={() => {
            setEditingTask(null);
            setIsTaskDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="all" className="text-xs sm:text-sm">All Tasks</TabsTrigger>
          <TabsTrigger value="overdue" className="text-xs sm:text-sm">Overdue</TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Upcoming</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
        </TabsList>
        
        {/* Task Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={taskFilter} onValueChange={setTaskFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2">No tasks found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>
        
        <TabsContent value="overdue" className="space-y-4">
          {tasks.filter(t => t.status === "overdue").length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <p className="text-muted-foreground">No overdue tasks! 🎉</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            tasks.filter(t => t.status === "overdue").map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>
        
        <TabsContent value="upcoming" className="space-y-4">
          {tasks.filter(t => t.status === "pending" || t.status === "in_progress").length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming tasks</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            tasks.filter(t => t.status === "pending" || t.status === "in_progress").map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-4">
          {tasks.filter(t => t.status === "completed").length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed tasks yet</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            tasks.filter(t => t.status === "completed").map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  // Authentication functions
  const login = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    // Simulate API call
    setTimeout(() => {
      setAuthState({
        user: {
          id: 1,
          email,
          firstName: "John",
          lastName: "Doe",
          phone: "+1 (555) 123-4567",
          timezone: "America/New_York",
          preferences: {
            emailNotifications: true,
            pushNotifications: false,
            smsNotifications: false,
            theme: "light",
            dateFormat: "MM/DD/YYYY",
            timeFormat: "12h"
          },
          createdAt: "2024-01-15T00:00:00Z",
          lastLoginAt: new Date().toISOString()
        },
        isAuthenticated: true,
        isLoading: false
      });
      setIsLoginDialogOpen(false);
    }, 1000);
  };

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
  };

  const updateUserProfile = (updates: Partial<User>) => {
    if (authState.user) {
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null
      }));
    }
  };

  const updateUserPreferences = (preferences: Partial<User['preferences']>) => {
    if (authState.user) {
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          preferences: { ...prev.user.preferences, ...preferences }
        } : null
      }));
    }
  };

  // Notification functions
  const createNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.max(0, ...notifications.map(n => n.id)) + 1,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show browser notification if enabled
    if (notificationSettings.pushNotifications && 'Notification' in window && Notification.permission === 'granted') {
      showBrowserNotification(newNotification);
    }
    
    return newNotification;
  };

  const markNotificationAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId: number) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/vite.svg', // Using the default Vite icon
        badge: '/vite.svg',
        tag: `homegenie-${notification.id}`,
        requireInteraction: notification.priority === 'high'
      });
      
      browserNotification.onclick = () => {
        window.focus();
        if (notification.taskId) {
          setActiveTab('tasks');
        } else if (notification.actionUrl) {
          // Handle custom action URLs
        }
        browserNotification.close();
      };
      
      // Auto-close after 5 seconds for non-high priority notifications
      if (notification.priority !== 'high') {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationSettings(prev => ({ ...prev, pushNotifications: true }));
        createNotification({
          title: 'Notifications Enabled',
          message: 'You will now receive browser notifications for important updates.',
          type: 'system',
          priority: 'low',
          read: false
        });
      }
      return permission;
    }
    return 'denied';
  };

  const checkTaskReminders = () => {
    const now = new Date();
    const reminderAdvanceMs = notificationSettings.reminderAdvance * 24 * 60 * 60 * 1000;
    
    tasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      const reminderTime = new Date(dueDate.getTime() - reminderAdvanceMs);
      
      // Check for reminder notifications on pending/in-progress tasks
      if ((task.status === 'pending' || task.status === 'in_progress') && notificationSettings.taskReminders) {
        // Check if task is due soon and we haven't already sent a notification
        if (now >= reminderTime && now < dueDate) {
          const existingNotification = notifications.find(n => 
            n.taskId === task.id && 
            n.type === 'task_reminder' &&
            n.createdAt > new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // Within last 24 hours
          );
          
          if (!existingNotification) {
            createNotification({
              title: 'Task Reminder',
              message: `${task.title} is due ${task.dueDate === new Date().toISOString().split('T')[0] ? 'today' : 'soon'}`,
              type: 'task_reminder',
              priority: task.priority,
              read: false,
              taskId: task.id,
              scheduledFor: reminderTime.toISOString()
            });
          }
        }
      }
      
      // Check if task is overdue (for any non-completed task)
      if (now > dueDate && task.status !== 'overdue' && task.status !== 'completed' && notificationSettings.maintenanceAlerts) {
        // Update task status to overdue
        setTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'overdue' as const } : t
        ));
        
        createNotification({
          title: 'Overdue Task',
          message: `${task.title} is now overdue`,
          type: 'alert',
          priority: 'high',
          read: false,
          taskId: task.id
        });
      }
    });
  };

  // Run reminder checks periodically
  useState(() => {
    const interval = setInterval(checkTaskReminders, 60000); // Check every minute
    checkTaskReminders(); // Check immediately
    return () => clearInterval(interval);
  });

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    setNotificationSettings(prev => ({ ...prev, ...updates }));
    
    // If push notifications were enabled, request permission
    if (updates.pushNotifications && !notificationSettings.pushNotifications) {
      requestNotificationPermission();
    }
  };

  const getUnreadNotificationCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  // Calendar state and functions
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Calendar utility functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getTasksForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return tasks.filter(task => task.dueDate === dateString);
  };

  const formatDateForCalendar = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  // Calendar Day Component
  const CalendarDay = ({ date, tasks }: { date: Date; tasks: Task[] }) => {
    const isCurrentDay = isToday(date);
    const isSelected = isSelectedDate(date);
    const hasOverdue = tasks.some(task => task.status === "overdue");
    const hasHighPriority = tasks.some(task => task.priority === "high");
    
    return (
      <div 
        className={`min-h-[100px] p-2 border border-border cursor-pointer transition-colors hover:bg-accent/50 ${
          isCurrentDay ? "bg-primary/10 border-primary" : ""
        } ${
          isSelected ? "bg-accent border-primary" : ""
        }`}
        onClick={() => {
          setSelectedDate(date);
          if (tasks.length === 0) {
            // Create new task for this date
            setEditingTask(null);
            setSelectedDate(date);
            setIsTaskDialogOpen(true);
          }
        }}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`text-sm font-medium ${
            isCurrentDay ? "text-primary font-bold" : "text-foreground"
          }`}>
            {date.getDate()}
          </span>
          {(hasOverdue || hasHighPriority) && (
            <div className="flex gap-1">
              {hasOverdue && <div className="w-2 h-2 bg-red-500 rounded-full" />}
              {hasHighPriority && <div className="w-2 h-2 bg-orange-500 rounded-full" />}
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          {tasks.slice(0, 3).map((task) => (
            <div
              key={task.id}
              className={`text-xs p-1 rounded text-white truncate ${
                task.status === "overdue" ? "bg-red-500" :
                task.status === "completed" ? "bg-green-500" :
                task.priority === "high" ? "bg-orange-500" :
                task.priority === "medium" ? "bg-blue-500" : "bg-gray-500"
              }`}
              title={task.title}
              onClick={(e) => {
                e.stopPropagation();
                setEditingTask(task);
                setIsTaskDialogOpen(true);
              }}
            >
              {task.title}
            </div>
          ))}
          {tasks.length > 3 && (
            <div className="text-xs text-muted-foreground">+{tasks.length - 3} more</div>
          )}
        </div>
      </div>
    );
  };

  // Calendar Content Component
  const CalendarContent = () => (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Maintenance Calendar</h2>
          <p className="text-muted-foreground">Schedule and view your maintenance activities</p>
        </div>
        <div className="flex gap-2">
          <Select value={calendarView} onValueChange={(value: "month" | "week" | "day") => setCalendarView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setEditingTask(null);
              setIsTaskDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {calendarView === "month" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Today
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Header */}
            <div className="grid grid-cols-7 gap-0 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0">
              {getDaysInMonth(currentDate).map((date, index) => (
                <div key={index}>
                  {date ? (
                    <CalendarDay date={date} tasks={getTasksForDate(date)} />
                  ) : (
                    <div className="min-h-[100px] p-2 border border-border bg-muted/30" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {calendarView === "week" && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Week view coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}

      {calendarView === "day" && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Day view coming soon</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Date Tasks */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle>Tasks for {formatDateForCalendar(selectedDate)}</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const dateTasks = getTasksForDate(selectedDate);
              return dateTasks.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No tasks scheduled for this date</p>
                  <Button 
                    onClick={() => {
                      setEditingTask(null);
                      setIsTaskDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dateTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                </div>
              );
            })()
            }
          </CardContent>
        </Card>
      )}

      {/* Calendar Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-sm">Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded" />
              <span className="text-sm">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-sm">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-sm">Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SettingsContent = () => {
    if (!authState.user) return null;

    const user = authState.user;

    return (
      <div className="space-y-4 lg:space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Settings</h2>
          <p className="text-muted-foreground">Manage your account and application preferences</p>
        </div>
        
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-lg font-medium text-primary-foreground">
                    {user.firstName[0]}{user.lastName[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.phone && (
                    <p className="text-sm text-muted-foreground">{user.phone}</p>
                  )}
                </div>
                <Button onClick={() => setIsProfileDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-sm font-medium">Member since</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last login</Label>
                  <p className="text-sm text-muted-foreground">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <p className="text-sm text-muted-foreground">{user.timezone}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage how you receive maintenance reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Email notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive task reminders via email</p>
                </div>
                <Checkbox
                  checked={user.preferences.emailNotifications}
                  onCheckedChange={(checked) => 
                    updateUserPreferences({ emailNotifications: checked as boolean })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Push notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive browser push notifications</p>
                </div>
                <Checkbox
                  checked={user.preferences.pushNotifications}
                  onCheckedChange={(checked) => 
                    updateUserPreferences({ pushNotifications: checked as boolean })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">SMS reminders</Label>
                  <p className="text-xs text-muted-foreground">Receive text message reminders</p>
                </div>
                <Checkbox
                  checked={user.preferences.smsNotifications}
                  onCheckedChange={(checked) => 
                    updateUserPreferences({ smsNotifications: checked as boolean })
                  }
                />
              </div>
              
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Task reminders</Label>
                    <p className="text-xs text-muted-foreground">Get notified about upcoming maintenance tasks</p>
                  </div>
                  <Checkbox
                    checked={notificationSettings.taskReminders}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ taskReminders: checked as boolean })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Maintenance alerts</Label>
                    <p className="text-xs text-muted-foreground">Get notified about overdue tasks and urgent maintenance</p>
                  </div>
                  <Checkbox
                    checked={notificationSettings.maintenanceAlerts}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ maintenanceAlerts: checked as boolean })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">System notifications</Label>
                    <p className="text-xs text-muted-foreground">Get notified about updates and system changes</p>
                  </div>
                  <Checkbox
                    checked={notificationSettings.systemNotifications}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ systemNotifications: checked as boolean })
                    }
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Reminder advance time</Label>
                  <p className="text-xs text-muted-foreground mb-2">How many days before due date to send reminders</p>
                  <Select 
                    value={notificationSettings.reminderAdvance.toString()} 
                    onValueChange={(value) => 
                      updateNotificationSettings({ reminderAdvance: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day before</SelectItem>
                      <SelectItem value="2">2 days before</SelectItem>
                      <SelectItem value="3">3 days before</SelectItem>
                      <SelectItem value="7">1 week before</SelectItem>
                      <SelectItem value="14">2 weeks before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Quiet hours</Label>
                      <p className="text-xs text-muted-foreground">Disable notifications during specific hours</p>
                    </div>
                    <Checkbox
                      checked={notificationSettings.quietHours.enabled}
                      onCheckedChange={(checked) => 
                        updateNotificationSettings({ 
                          quietHours: { ...notificationSettings.quietHours, enabled: checked as boolean }
                        })
                      }
                    />
                  </div>
                  
                  {notificationSettings.quietHours.enabled && (
                    <div className="grid grid-cols-2 gap-4 pl-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Start time</Label>
                        <Input
                          type="time"
                          value={notificationSettings.quietHours.start}
                          onChange={(e) => 
                            updateNotificationSettings({ 
                              quietHours: { ...notificationSettings.quietHours, start: e.target.value }
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">End time</Label>
                        <Input
                          type="time"
                          value={notificationSettings.quietHours.end}
                          onChange={(e) => 
                            updateNotificationSettings({ 
                              quietHours: { ...notificationSettings.quietHours, end: e.target.value }
                            })
                          }
                          className="text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={requestNotificationPermission}
                    disabled={'Notification' in window && Notification.permission === 'granted'}
                  >
                    {'Notification' in window && Notification.permission === 'granted' 
                      ? 'Browser notifications enabled' 
                      : 'Enable browser notifications'
                    }
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your HomeGenie experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select 
                    value={user.preferences.theme} 
                    onValueChange={(value: "light" | "dark" | "system") => 
                      updateUserPreferences({ theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select 
                    value={user.preferences.dateFormat} 
                    onValueChange={(value: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD") => 
                      updateUserPreferences({ dateFormat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select 
                    value={user.preferences.timeFormat} 
                    onValueChange={(value: "12h" | "24h") => 
                      updateUserPreferences({ timeFormat: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm font-medium">Password</Label>
                  <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
                </div>
                <Button variant="outline" size="sm">
                  Change Password
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm font-medium">Two-Factor Authentication</Label>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">
                  Enable 2FA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible and destructive actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm font-medium">Sign out all devices</Label>
                  <p className="text-xs text-muted-foreground">Sign out from all devices except this one</p>
                </div>
                <Button variant="outline" size="sm">
                  Sign Out All
                </Button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm font-medium text-destructive">Delete Account</Label>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardContent />;
      case "properties":
        return <PropertiesContent />;
      case "tasks":
        return <TasksContent />;
      case "calendar":
        return <CalendarContent />;
      case "settings":
        return <SettingsContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DesktopNavigation />
      
      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex justify-between items-center p-4 lg:p-6">
            <div className="flex items-center gap-4">
              <MobileNavigation />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold capitalize">
                  {activeTab === "dashboard" ? "Dashboard" : activeTab}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm lg:text-base hidden sm:block">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              <Popover open={isNotificationPanelOpen} onOpenChange={setIsNotificationPanelOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {getUnreadNotificationCount() > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {getUnreadNotificationCount() > 99 ? '99+' : getUnreadNotificationCount()}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="p-0 w-auto">
                  <NotificationPanel />
                </PopoverContent>
              </Popover>
              {authState.isAuthenticated && authState.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                      <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {authState.user.firstName[0]}{authState.user.lastName[0]}
                        </span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="font-medium">{authState.user.firstName} {authState.user.lastName}</p>
                      <p className="text-sm text-muted-foreground">{authState.user.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => setIsProfileDialogOpen(true)}>
                      <Users className="h-4 w-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="text-red-600">
                      <X className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" onClick={() => setIsLoginDialogOpen(true)}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-4 lg:p-6">
          {renderContent()}
        </div>
      </main>
      
      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? "Edit Task" : "Create New Task"}
            </DialogTitle>
            <DialogDescription>
              {editingTask ? "Update the task details below." : "Fill in the details to create a new maintenance task."}
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            task={editingTask}
            onSubmit={(taskData) => {
              if (editingTask) {
                updateTask(editingTask.id, taskData);
              } else {
                createTask(taskData);
              }
            }}
            onCancel={() => {
              setIsTaskDialogOpen(false);
              setEditingTask(null);
            }}
          />
        </DialogContent>
      </Dialog>
      
      {/* Property Dialog */}
      <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProperty ? "Edit Property" : selectedProperty ? selectedProperty.name : "Create New Property"}
            </DialogTitle>
            <DialogDescription>
              {editingProperty ? "Update the property details below." : 
               selectedProperty ? "Property details and management." : 
               "Fill in the details to create a new property."}
            </DialogDescription>
          </DialogHeader>
          {editingProperty || (!selectedProperty && !editingProperty) ? (
            <PropertyForm
              property={editingProperty}
              onSubmit={(propertyData) => {
                if (editingProperty) {
                  updateProperty(editingProperty.id, propertyData);
                } else {
                  createProperty(propertyData);
                }
              }}
              onCancel={() => {
                setIsPropertyDialogOpen(false);
                setEditingProperty(null);
                setSelectedProperty(null);
              }}
            />
          ) : selectedProperty ? (
            <PropertyDetails property={selectedProperty} />
          ) : null}
        </DialogContent>
      </Dialog>
      
      {/* Authentication Dialog */}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {authMode === "login" ? "Sign In" : 
               authMode === "register" ? "Create Account" : 
               "Reset Password"}
            </DialogTitle>
            <DialogDescription>
              {authMode === "login" ? "Sign in to your HomeGenie account" : 
               authMode === "register" ? "Create a new HomeGenie account" : 
               "Enter your email to receive a password reset link"}
            </DialogDescription>
          </DialogHeader>
          {authMode === "login" && <LoginForm />}
          {authMode === "register" && <RegisterForm />}
          {authMode === "forgot" && <ForgotPasswordForm />}
        </DialogContent>
      </Dialog>
      
      {/* Profile Dialog */}
      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and preferences.
            </DialogDescription>
          </DialogHeader>
          {authState.user && (
            <ProfileForm user={authState.user} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
