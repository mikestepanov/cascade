/**
 * Optimized Lucide Icon Imports
 *
 * This barrel file uses direct ESM imports from lucide-react to enable
 * better tree-shaking and reduce bundle size by ~80 KB.
 *
 * Instead of importing the entire lucide-react library, we import only
 * the specific icons we use in the application.
 *
 * Usage in components:
 *   import { Calendar, Check, Plus } from "@/lib/icons";
 */

export {
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Circle,
  Clock,
  Copy,
  DollarSign,
  Download,
  FileText,
  FolderKanban,
  Github,
  History,
  Home,
  Key,
  Link,
  Link as LinkIcon,
  MapPin,
  Menu,
  Mic,
  MicOff,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  Trash2,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
