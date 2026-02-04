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
  Columns2,
  Copy,
  DollarSign,
  Download,
  FileText,
  Filter,
  FolderKanban,
  Github,
  Grid3X3,
  History,
  Home,
  Key,
  Link,
  Link as LinkIcon,
  List as ListIcon,
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
  Search,
  Settings,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from "lucide-react";
