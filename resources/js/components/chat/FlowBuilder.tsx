import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Save,
  Plus,
  Trash2,
  Settings,
  Sparkles,
  Bot,
  MessageSquare,
  ListOrdered,
  FormInput,
  UserCheck,
  CheckCircle,
  HelpCircle,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Send,
  CornerDownRight,
  ChevronRight,
  ChevronLeft,
  Layers,
  Maximize2,
  Minimize2,
  Copy,
  Compass,
  Grid,
  Link2,
  Unlink,
  Download,
  Upload,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  MousePointer,
  GitBranch,
  Wand2,
  Palette,
  Sliders,
  HelpCircle as QuestionIcon,
  Tag,
  ArrowRight
} from 'lucide-react';
import { FlowNodeItem, FlowEdgeItem, ChatbotFlowData } from '../../types';

// Theme color palette definitions
const THEME_COLORS: Record<string, { header: string; ring: string; border: string; badge: string; text: string; bg: string }> = {
  default: {
    header: 'bg-slate-800/95 border-slate-700 text-slate-200',
    ring: 'ring-indigo-500',
    border: 'border-slate-800',
    badge: 'bg-slate-700 text-slate-200',
    text: 'text-indigo-400',
    bg: 'bg-slate-900'
  },
  indigo: {
    header: 'bg-indigo-950/95 border-indigo-500/50 text-indigo-200',
    ring: 'ring-indigo-500',
    border: 'border-indigo-500/40',
    badge: 'bg-indigo-500/20 text-indigo-300',
    text: 'text-indigo-400',
    bg: 'bg-indigo-950/30'
  },
  emerald: {
    header: 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200',
    ring: 'ring-emerald-500',
    border: 'border-emerald-500/40',
    badge: 'bg-emerald-500/20 text-emerald-300',
    text: 'text-emerald-400',
    bg: 'bg-emerald-950/30'
  },
  purple: {
    header: 'bg-purple-950/95 border-purple-500/50 text-purple-200',
    ring: 'ring-purple-500',
    border: 'border-purple-500/40',
    badge: 'bg-purple-500/20 text-purple-300',
    text: 'text-purple-400',
    bg: 'bg-purple-950/30'
  },
  amber: {
    header: 'bg-amber-950/95 border-amber-500/50 text-amber-200',
    ring: 'ring-amber-500',
    border: 'border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-300',
    text: 'text-amber-400',
    bg: 'bg-amber-950/30'
  },
  rose: {
    header: 'bg-rose-950/95 border-rose-500/50 text-rose-200',
    ring: 'ring-rose-500',
    border: 'border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-300',
    text: 'text-rose-400',
    bg: 'bg-rose-950/30'
  },
  teal: {
    header: 'bg-teal-950/95 border-teal-500/50 text-teal-200',
    ring: 'ring-teal-500',
    border: 'border-teal-500/40',
    badge: 'bg-teal-500/20 text-teal-300',
    text: 'text-teal-400',
    bg: 'bg-teal-950/30'
  }
};

export const FlowBuilder: React.FC = () => {
  const [flow, setFlow] = useState<ChatbotFlowData | null>(null);
  const [nodes, setNodes] = useState<FlowNodeItem[]>([]);
  const [edges, setEdges] = useState<FlowEdgeItem[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Snap to grid
  const [snapToGrid, setSnapToGrid] = useState(true);
  const GRID_SIZE = 20;

  // Mini-map visibility
  const [showMiniMap, setShowMiniMap] = useState(true);

  // Collapsible Sidebars
  const [paletteOpen, setPaletteOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Canvas zoom & pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Dragging nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Interactive Live Edge Drawing (Connecting from a port)
  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    handleId?: string;
    startX: number;
    startY: number;
  } | null>(null);
  const [connectingCursor, setConnectingCursor] = useState<{ x: number; y: number } | null>(null);

  // Quick-Add on Wire Drop Menu
  const [quickAddMenu, setQuickAddMenu] = useState<{
    x: number;
    y: number;
    fromNodeId: string;
    fromHandleId?: string;
  } | null>(null);

  // Hovered edge for quick disconnect
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Flow Settings Modal
  const [showFlowSettingsModal, setShowFlowSettingsModal] = useState(false);
  const [flowName, setFlowName] = useState('Main Website Chatbot Flow');
  const [flowDesc, setFlowDesc] = useState('Visual conversational auto-responder flow');
  const [flowTriggerType, setFlowTriggerType] = useState('chat_opened');
  const [flowKeywords, setFlowKeywords] = useState('hello, help, support, enquiry, price');
  const [flowActive, setFlowActive] = useState(true);

  // Shortcuts Cheat Sheet Modal
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Interactive Live Simulator Drawer
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [simMessages, setSimMessages] = useState<Array<{ sender: 'bot' | 'user' | 'system'; text: string; buttons?: any[] }>>([]);
  const [simCurrentNodeId, setSimCurrentNodeId] = useState<string | null>(null);
  const [simInputText, setSimInputText] = useState('');

  // Templates Modal
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Canvas & Container Refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Node Dimensions
  const NODE_WIDTH = 250;
  const NODE_APPROX_HEIGHT = 160;

  // ----------------------------------------------------
  // Load Flow Data
  // ----------------------------------------------------
  const fetchFlow = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat/admin/flows');
      const data = await res.json();
      if (data.success && data.flow) {
        setFlow(data.flow);
        setFlowName(data.flow.name || 'Main Website Chatbot Flow');
        setFlowDesc(data.flow.description || 'Visual conversational auto-responder flow');
        setFlowTriggerType(data.flow.trigger_type || 'chat_opened');
        setFlowKeywords(data.flow.trigger_keywords || 'hello, help, support, enquiry');
        setFlowActive(data.flow.is_active ?? true);

        const canvas = data.flow.canvas_data || {};
        const loadedNodes = canvas.nodes || [];
        const loadedEdges = canvas.edges || [];
        setNodes(loadedNodes);
        setEdges(loadedEdges);
        if (canvas.viewport) {
          if (typeof canvas.viewport.x === 'number') setPan({ x: canvas.viewport.x, y: canvas.viewport.y });
          if (typeof canvas.viewport.zoom === 'number') setZoom(canvas.viewport.zoom);
        }
      }
    } catch (err) {
      console.error('Failed to load chatbot flow', err);
    } finally {
      setLoading(false);
    }
  };

  // Load Templates
  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/chat/admin/flows/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    }
  };

  useEffect(() => {
    fetchFlow();
    fetchTemplates();
  }, []);

  // ----------------------------------------------------
  // Keyboard Listeners (Space to pan, Delete node, etc.)
  // ----------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        setIsSpacePressed(true);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          const node = nodes.find(n => n.id === selectedNodeId);
          if (node && node.type !== 'trigger') {
            handleDeleteNode(selectedNodeId);
          }
        } else if (selectedEdgeId) {
          handleDeleteEdge(selectedEdgeId);
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        setConnectingFrom(null);
        setConnectingCursor(null);
        setQuickAddMenu(null);
        if (isFullscreen) setIsFullscreen(false);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFlow();
      } else if (e.key === '=' || e.key === '+') {
        setZoom(prev => Math.min(Number((prev + 0.1).toFixed(2)), 2.2));
      } else if (e.key === '-' || e.key === '_') {
        setZoom(prev => Math.max(Number((prev - 0.1).toFixed(2)), 0.3));
      } else if (e.key === '0') {
        setZoom(1);
        setPan({ x: 80, y: 60 });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nodes, selectedNodeId, selectedEdgeId, isFullscreen]);

  // ----------------------------------------------------
  // Save Flow
  // ----------------------------------------------------
  const handleSaveFlow = async () => {
    if (saving) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        id: flow?.id,
        name: flowName,
        description: flowDesc,
        trigger_type: flowTriggerType,
        trigger_keywords: flowKeywords,
        canvas_data: {
          nodes,
          edges,
          viewport: { x: pan.x, y: pan.y, zoom }
        },
        is_active: flowActive
      };

      const res = await fetch('/api/chat/admin/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save flow', err);
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------
  // Fit To View / Center All Nodes
  // ----------------------------------------------------
  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current || nodes.length === 0) {
      setPan({ x: 80, y: 60 });
      setZoom(1);
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const padding = 100;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(n => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.position.y + NODE_APPROX_HEIGHT);
    });

    const contentWidth = Math.max(maxX - minX + padding * 2, 400);
    const contentHeight = Math.max(maxY - minY + padding * 2, 300);

    const scaleX = rect.width / contentWidth;
    const scaleY = rect.height / contentHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.35), 1.1);

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    const newPanX = Math.round(rect.width / 2 - midX * newZoom);
    const newPanY = Math.round(rect.height / 2 - midY * newZoom);

    setZoom(Number(newZoom.toFixed(2)));
    setPan({ x: newPanX, y: newPanY });
  }, [nodes]);

  // ----------------------------------------------------
  // Auto-Arrange Layout (Magic Clean-Up ✨)
  // ----------------------------------------------------
  const handleAutoLayout = () => {
    if (nodes.length === 0) return;

    // 1. Find root/trigger node
    const trigger = nodes.find(n => n.type === 'trigger') || nodes[0];

    // 2. BFS level traversal to assign columns
    const levels = new Map<string, number>();
    levels.set(trigger.id, 0);
    const queue = [trigger.id];
    const visited = new Set<string>([trigger.id]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const curLevel = levels.get(currentId) || 0;

      // Find all target nodes of outgoing edges
      const outEdges = edges.filter(e => e.source === currentId);
      outEdges.forEach(e => {
        if (!visited.has(e.target)) {
          visited.add(e.target);
          levels.set(e.target, curLevel + 1);
          queue.push(e.target);
        }
      });
    }

    // Any unreached nodes go to remaining columns
    let maxLevel = 0;
    levels.forEach(lvl => {
      if (lvl > maxLevel) maxLevel = lvl;
    });
    nodes.forEach(n => {
      if (!levels.has(n.id)) {
        maxLevel++;
        levels.set(n.id, maxLevel);
      }
    });

    // 3. Group nodes by level
    const columns = new Map<number, FlowNodeItem[]>();
    nodes.forEach(n => {
      const lvl = levels.get(n.id) || 0;
      if (!columns.has(lvl)) columns.set(lvl, []);
      columns.get(lvl)!.push(n);
    });

    // 4. Calculate neat X and Y coordinates
    const START_X = 100;
    const START_Y = 100;
    const COL_SPACING = 340;
    const ROW_SPACING = 210;

    const updatedNodes = nodes.map(n => {
      const lvl = levels.get(n.id) || 0;
      const colNodes = columns.get(lvl) || [n];
      const rowIdx = colNodes.findIndex(item => item.id === n.id);
      const newX = START_X + lvl * COL_SPACING;
      const newY = START_Y + rowIdx * ROW_SPACING;
      return { ...n, position: { x: newX, y: newY } };
    });

    setNodes(updatedNodes);
    setTimeout(() => handleFitToScreen(), 150);
  };

  // ----------------------------------------------------
  // Mouse Wheel Handling (Trackpad pan + Ctrl Zoom)
  // ----------------------------------------------------
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const mouseCanvasX = (cursorX - pan.x) / zoom;
      const mouseCanvasY = (cursorY - pan.y) / zoom;

      const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.3), 2.2);
      const newPanX = cursorX - mouseCanvasX * newZoom;
      const newPanY = cursorY - mouseCanvasY * newZoom;

      setZoom(Number(newZoom.toFixed(2)));
      setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    } else {
      // Natural mouse wheel and trackpad scroll pans canvas
      setPan(prev => ({
        x: Math.round(prev.x - e.deltaX),
        y: Math.round(prev.y - e.deltaY)
      }));
    }
  };

  // ----------------------------------------------------
  // Canvas Mouse Down / Pan Start
  // ----------------------------------------------------
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If middle mouse button OR spacebar is held, start panning
    const isMiddleClick = e.button === 1;
    const isTargetCanvas = e.target === canvasRef.current || (e.target as HTMLElement).tagName === 'svg';

    if (isMiddleClick || isSpacePressed || isTargetCanvas) {
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      setQuickAddMenu(null);
      setIsPanning(true);
      setPanStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
      // Cancel active connection drag if user clicks canvas
      if (connectingFrom) {
        setConnectingFrom(null);
        setConnectingCursor(null);
      }
    }
  };

  // ----------------------------------------------------
  // Node Dragging & Connection Mouse Tracking
  // ----------------------------------------------------
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setQuickAddMenu(null);
    setDraggingNodeId(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setDragOffset({
        x: e.clientX / zoom - node.position.x,
        y: e.clientY / zoom - node.position.y
      });
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Track connecting curve position
    if (connectingFrom) {
      const curX = (e.clientX - rect.left - pan.x) / zoom;
      const curY = (e.clientY - rect.top - pan.y) / zoom;
      setConnectingCursor({ x: curX, y: curY });
    }

    if (draggingNodeId) {
      let newX = e.clientX / zoom - dragOffset.x;
      let newY = e.clientY / zoom - dragOffset.y;

      if (snapToGrid) {
        newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
        newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
      } else {
        newX = Math.round(newX);
        newY = Math.round(newY);
      }

      setNodes(prev => prev.map(n => (n.id === draggingNodeId ? { ...n, position: { x: newX, y: newY } } : n)));
    } else if (isPanning) {
      setPan({
        x: Math.round(e.clientX - panStart.x),
        y: Math.round(e.clientY - panStart.y)
      });
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
    setIsPanning(false);

    // If released on empty space while connecting, open the Quick-Add Menu!
    if (connectingFrom && connectingCursor) {
      setQuickAddMenu({
        x: Math.round(connectingCursor.x),
        y: Math.round(connectingCursor.y),
        fromNodeId: connectingFrom.nodeId,
        fromHandleId: connectingFrom.handleId
      });
      setConnectingFrom(null);
      setConnectingCursor(null);
    }
  };

  // ----------------------------------------------------
  // Connecting Ports (Handles) Handlers
  // ----------------------------------------------------
  const handleStartConnection = (e: React.MouseEvent, nodeId: string, handleId?: string) => {
    e.stopPropagation();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const sourceNode = nodes.find(n => n.id === nodeId);
    if (!sourceNode) return;

    // Output port is at right edge of node
    let portY = sourceNode.position.y + 44;
    if (handleId && sourceNode.type === 'buttons') {
      const btnIdx = (sourceNode.data.buttons || []).findIndex((b: any) => b.id === handleId);
      if (btnIdx >= 0) {
        portY = sourceNode.position.y + 88 + btnIdx * 34;
      }
    }

    const portX = sourceNode.position.x + NODE_WIDTH;

    setConnectingFrom({
      nodeId,
      handleId,
      startX: portX,
      startY: portY
    });

    const curX = (e.clientX - rect.left - pan.x) / zoom;
    const curY = (e.clientY - rect.top - pan.y) / zoom;
    setConnectingCursor({ x: curX, y: curY });
  };

  const handleCompleteConnection = (e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation();
    if (!connectingFrom) return;

    // Disallow self-connection
    if (connectingFrom.nodeId === targetNodeId) {
      setConnectingFrom(null);
      setConnectingCursor(null);
      return;
    }

    const newEdgeId = `edge_${Date.now()}`;
    const newEdge: FlowEdgeItem = {
      id: newEdgeId,
      source: connectingFrom.nodeId,
      target: targetNodeId,
      sourceHandle: connectingFrom.handleId
    };

    // If there's an existing edge from this source & handle, replace it cleanly
    setEdges(prev => {
      const filtered = prev.filter(
        e => !(e.source === connectingFrom.nodeId && (e.sourceHandle || 'default') === (connectingFrom.handleId || 'default'))
      );
      return [...filtered, newEdge];
    });

    // Also update targetNodeId inside button if applicable
    if (connectingFrom.handleId) {
      setNodes(prev =>
        prev.map(n => {
          if (n.id === connectingFrom.nodeId && n.data.buttons) {
            const updatedBtns = n.data.buttons.map((b: any) =>
              b.id === connectingFrom.handleId ? { ...b, targetNodeId } : b
            );
            return { ...n, data: { ...n.data, buttons: updatedBtns } };
          }
          return n;
        })
      );
    }

    setConnectingFrom(null);
    setConnectingCursor(null);
  };

  // Delete an edge
  const handleDeleteEdge = (edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (edge && edge.sourceHandle) {
      // Clear targetNodeId in source button
      setNodes(prev =>
        prev.map(n => {
          if (n.id === edge.source && n.data.buttons) {
            const updatedBtns = n.data.buttons.map((b: any) =>
              b.id === edge.sourceHandle ? { ...b, targetNodeId: undefined } : b
            );
            return { ...n, data: { ...n.data, buttons: updatedBtns } };
          }
          return n;
        })
      );
    }
    setEdges(prev => prev.filter(e => e.id !== edgeId));
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
  };

  // ----------------------------------------------------
  // Add New Node (Standard or from Quick-Add)
  // ----------------------------------------------------
  const handleAddNode = (type: FlowNodeItem['type'], dropCoords?: { x: number; y: number }, connectFrom?: { nodeId: string; handleId?: string }) => {
    const newId = `node_${Date.now()}`;

    // Place near current center of canvas if drop coords not specified
    let x = dropCoords?.x;
    let y = dropCoords?.y;

    if (x === undefined || y === undefined) {
      const rect = canvasRef.current?.getBoundingClientRect();
      const centerX = rect ? rect.width / 2 : 400;
      const centerY = rect ? rect.height / 2 : 300;
      x = Math.round((centerX - pan.x) / zoom) - 120;
      y = Math.round((centerY - pan.y) / zoom) - 80;
    }

    if (snapToGrid) {
      x = Math.round(x / GRID_SIZE) * GRID_SIZE;
      y = Math.round(y / GRID_SIZE) * GRID_SIZE;
    }

    let defaultData: any = { label: 'New Step', themeColor: 'default' };
    if (type === 'message') {
      defaultData = { label: 'Text Message', message: 'Hello! How can we help you today?', themeColor: 'indigo' };
    } else if (type === 'buttons') {
      defaultData = {
        label: 'Option Buttons',
        prompt: 'Please select an option:',
        themeColor: 'purple',
        buttons: [
          { id: `btn_${Date.now()}_1`, text: 'Explore Services' },
          { id: `btn_${Date.now()}_2`, text: 'Talk to an Agent' }
        ]
      };
    } else if (type === 'input') {
      defaultData = {
        label: 'Collect Info',
        inputType: 'phone',
        variableName: 'visitor_phone',
        themeColor: 'amber',
        prompt: 'Please provide your phone or WhatsApp number:'
      };
    } else if (type === 'gemini_ai') {
      defaultData = {
        label: 'Gemini AI Assistant',
        greeting: 'Ask our AI any question!',
        themeColor: 'purple',
        prompt: 'You are a helpful customer support agent for our website.'
      };
    } else if (type === 'handoff') {
      defaultData = {
        label: 'Assign Team Member',
        assignmentType: 'round_robin',
        themeColor: 'rose',
        notificationMessage: 'Connecting you to our team...'
      };
    } else if (type === 'condition') {
      defaultData = {
        label: 'Keyword Condition',
        conditionType: 'keyword_contains',
        themeColor: 'teal',
        keyword: 'quote, price, pricing'
      };
    } else if (type === 'end') {
      defaultData = {
        label: 'End & Rate Chat',
        themeColor: 'default',
        message: 'Thank you for chatting with us today!'
      };
    }

    const newNode: FlowNodeItem = {
      id: newId,
      type,
      position: { x, y },
      data: defaultData
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newId);

    // If spawned from a wire drop, automatically connect them!
    if (connectFrom) {
      const newEdge: FlowEdgeItem = {
        id: `edge_${Date.now()}`,
        source: connectFrom.nodeId,
        target: newId,
        sourceHandle: connectFrom.handleId
      };
      setEdges(prev => [...prev, newEdge]);
    }

    setQuickAddMenu(null);
  };

  // ----------------------------------------------------
  // Duplicate Node
  // ----------------------------------------------------
  const handleDuplicateNode = (id: string) => {
    const orig = nodes.find(n => n.id === id);
    if (!orig) return;

    const newId = `node_${Date.now()}`;
    const cloned: FlowNodeItem = {
      ...JSON.parse(JSON.stringify(orig)),
      id: newId,
      position: {
        x: orig.position.x + 40,
        y: orig.position.y + 40
      },
      data: {
        ...orig.data,
        label: `${orig.data.label} (Copy)`
      }
    };

    // If cloned has buttons, give new button IDs
    if (cloned.data.buttons) {
      cloned.data.buttons = cloned.data.buttons.map((b: any) => ({
        ...b,
        id: `btn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
      }));
    }

    setNodes(prev => [...prev, cloned]);
    setSelectedNodeId(newId);
  };

  // Delete node
  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  // Update selected node data
  const handleUpdateSelectedNode = (field: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes(prev =>
      prev.map(n => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              [field]: value
            }
          };
        }
        return n;
      })
    );
  };

  // Link selected node to a target node via Dropdown selector
  const handleSetTargetNode = (sourceNodeId: string, targetNodeId: string, handleId?: string) => {
    if (!targetNodeId) {
      setEdges(prev =>
        prev.filter(e => !(e.source === sourceNodeId && (e.sourceHandle || 'default') === (handleId || 'default')))
      );
      return;
    }

    setEdges(prev => {
      const filtered = prev.filter(
        e => !(e.source === sourceNodeId && (e.sourceHandle || 'default') === (handleId || 'default'))
      );
      return [
        ...filtered,
        {
          id: `edge_${Date.now()}`,
          source: sourceNodeId,
          target: targetNodeId,
          sourceHandle: handleId
        }
      ];
    });

    if (handleId) {
      setNodes(prev =>
        prev.map(n => {
          if (n.id === sourceNodeId && n.data.buttons) {
            const updatedBtns = n.data.buttons.map((b: any) =>
              b.id === handleId ? { ...b, targetNodeId } : b
            );
            return { ...n, data: { ...n.data, buttons: updatedBtns } };
          }
          return n;
        })
      );
    }
  };

  // ----------------------------------------------------
  // Export & Import Flow
  // ----------------------------------------------------
  const handleExportFlow = () => {
    const dataToExport = {
      name: flowName,
      description: flowDesc,
      version: 1,
      exported_at: new Date().toISOString(),
      canvas_data: {
        nodes,
        edges,
        viewport: { x: pan.x, y: pan.y, zoom }
      }
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flowName.toLowerCase().replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFlow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.canvas_data?.nodes) {
          setNodes(parsed.canvas_data.nodes);
          setEdges(parsed.canvas_data.edges || []);
          if (parsed.name) setFlowName(parsed.name);
          if (parsed.description) setFlowDesc(parsed.description);
          if (parsed.canvas_data.viewport) {
            setPan({ x: parsed.canvas_data.viewport.x, y: parsed.canvas_data.viewport.y });
            setZoom(parsed.canvas_data.viewport.zoom || 1);
          }
          setSelectedNodeId(null);
          alert('Flow imported successfully! Click "Save & Publish" to activate.');
        } else {
          alert('Invalid flow JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Load a template
  const handleApplyTemplate = (tpl: any) => {
    if (confirm(`Apply the "${tpl.title}" template? This will replace the current canvas.`)) {
      setNodes(tpl.nodes || []);
      setEdges(tpl.edges || []);
      if (tpl.title) setFlowName(tpl.title);
      if (tpl.description) setFlowDesc(tpl.description);
      setShowTemplatesModal(false);
      setSelectedNodeId(null);
      setTimeout(() => handleFitToScreen(), 100);
    }
  };

  // ----------------------------------------------------
  // Interactive Simulator Logic
  // ----------------------------------------------------
  const startSimulator = () => {
    setSimulatorOpen(true);
    setSimMessages([]);

    const triggerNode = nodes.find(n => n.type === 'trigger') || nodes[0];
    if (!triggerNode) {
      setSimMessages([{ sender: 'system', text: 'No trigger node found in this flow.' }]);
      return;
    }

    setSimCurrentNodeId(triggerNode.id);
    advanceSimulator(triggerNode.id, []);
  };

  const advanceSimulator = (fromNodeId: string, currentHistory: any[]) => {
    const outgoing = edges.filter(e => e.source === fromNodeId);
    if (outgoing.length === 0) return;

    const targetId = outgoing[0].target;
    const targetNode = nodes.find(n => n.id === targetId);
    if (!targetNode) return;

    setSimCurrentNodeId(targetId);

    if (targetNode.type === 'message') {
      const msgText = targetNode.data.message || targetNode.data.text || '';
      const updated = [...currentHistory, { sender: 'bot' as const, text: msgText }];
      setSimMessages(updated);
      setTimeout(() => advanceSimulator(targetId, updated), 800);
    } else if (targetNode.type === 'buttons') {
      const prompt = targetNode.data.prompt || 'Please choose an option:';
      const btns = targetNode.data.buttons || [];
      setSimMessages(prev => [...prev, { sender: 'bot' as const, text: prompt, buttons: btns }]);
    } else if (targetNode.type === 'input') {
      const prompt = targetNode.data.prompt || 'Please enter your information:';
      setSimMessages(prev => [...prev, { sender: 'bot' as const, text: prompt }]);
    } else if (targetNode.type === 'gemini_ai') {
      setSimMessages(prev => [
        ...prev,
        { sender: 'bot' as const, text: targetNode.data.greeting || 'Gemini AI Assistant is ready to assist you.' }
      ]);
    } else if (targetNode.type === 'handoff') {
      setSimMessages(prev => [
        ...prev,
        { sender: 'system' as const, text: targetNode.data.notificationMessage || 'Chat routed to Human Support Agent.' }
      ]);
    } else if (targetNode.type === 'end') {
      setSimMessages(prev => [
        ...prev,
        { sender: 'system' as const, text: 'Chat concluded. Customer Satisfaction rating requested.' }
      ]);
    }
  };

  const handleSimSelectButton = (btn: any) => {
    setSimMessages(prev => [...prev, { sender: 'user', text: btn.text }]);

    const targetEdge = edges.find(e => e.source === simCurrentNodeId && (e.sourceHandle === btn.id || e.id === btn.id));
    const targetNodeId = targetEdge ? targetEdge.target : btn.targetNodeId;

    if (targetNodeId) {
      setSimCurrentNodeId(targetNodeId);
      const targetNode = nodes.find(n => n.id === targetNodeId);
      if (targetNode) {
        if (targetNode.type === 'message') {
          setTimeout(() => {
            const updated = [
              ...simMessages,
              { sender: 'user' as const, text: btn.text },
              { sender: 'bot' as const, text: targetNode.data.message || '' }
            ];
            setSimMessages(updated);
            advanceSimulator(targetNodeId, updated);
          }, 400);
        } else {
          advanceSimulator(targetNodeId, [...simMessages, { sender: 'user' as const, text: btn.text }]);
        }
      }
    }
  };

  const handleSimSendInput = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simInputText.trim()) return;

    const text = simInputText.trim();
    setSimInputText('');
    setSimMessages(prev => [...prev, { sender: 'user', text }]);

    if (simCurrentNodeId) {
      advanceSimulator(simCurrentNodeId, [...simMessages, { sender: 'user' as const, text }]);
    }
  };

  // Selected node memo
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);

  // Filtered nodes for search
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return nodes.filter(
      n =>
        n.data.label?.toLowerCase().includes(q) ||
        n.data.subtitle?.toLowerCase().includes(q) ||
        n.data.message?.toLowerCase().includes(q) ||
        n.data.prompt?.toLowerCase().includes(q)
    );
  }, [nodes, searchQuery]);

  // Jump to specific node
  const handleJumpToNode = (node: FlowNodeItem) => {
    setSelectedNodeId(node.id);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const targetPanX = Math.round(rect.width / 2 - (node.position.x + NODE_WIDTH / 2) * zoom);
      const targetPanY = Math.round(rect.height / 2 - (node.position.y + 60) * zoom);
      setPan({ x: targetPanX, y: targetPanY });
    }
    setSearchQuery('');
  };

  // ----------------------------------------------------
  // Mini-Map Calculations
  // ----------------------------------------------------
  const miniMapBounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, maxX: 1000, minY: 0, maxY: 800, width: 1000, height: 800 };
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + NODE_WIDTH);
      maxY = Math.max(maxY, n.position.y + NODE_APPROX_HEIGHT);
    });
    const padding = 200;
    return {
      minX: minX - padding,
      minY: minY - padding,
      maxX: maxX + padding,
      maxY: maxY + padding,
      width: Math.max(maxX - minX + padding * 2, 800),
      height: Math.max(maxY - minY + padding * 2, 600)
    };
  }, [nodes]);

  // MiniMap Click to Pan
  const handleMiniMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const miniRect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - miniRect.left;
    const clickY = e.clientY - miniRect.top;

    const fracX = clickX / miniRect.width;
    const fracY = clickY / miniRect.height;

    const targetCanvasX = miniMapBounds.minX + fracX * miniMapBounds.width;
    const targetCanvasY = miniMapBounds.minY + fracY * miniMapBounds.height;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setPan({
        x: Math.round(rect.width / 2 - targetCanvasX * zoom),
        y: Math.round(rect.height / 2 - targetCanvasY * zoom)
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden relative select-none transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 w-screen h-screen rounded-none' : 'h-[800px] max-h-[88vh] rounded-2xl'
      }`}
    >
      {/* Hidden File Input for JSON Import */}
      <input type="file" ref={fileInputRef} onChange={handleImportFlow} accept=".json" className="hidden" />

      {/* ======================================================== */}
      {/* TOP BUILDER TOOLBAR */}
      {/* ======================================================== */}
      <div className="h-14 px-3 sm:px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setPaletteOpen(prev => !prev)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={paletteOpen ? 'Collapse Palette' : 'Expand Palette'}
          >
            {paletteOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          <span className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30 hidden sm:inline-flex">
            <Layers className="w-4 h-4" />
          </span>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs sm:text-sm leading-tight truncate max-w-[150px] sm:max-w-xs cursor-pointer hover:text-indigo-400" onClick={() => setShowFlowSettingsModal(true)}>
                {flowName}
              </h3>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {nodes.length} Steps · {edges.length} Links
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 hidden sm:block truncate max-w-sm">
              {flowDesc}
            </p>
          </div>
        </div>

        {/* Quick Search Nodes */}
        <div className="relative hidden lg:block w-44">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search steps..."
            className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
          />
          {filteredNodes.length > 0 && (
            <div className="absolute top-8 left-0 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1 z-50 max-h-48 overflow-y-auto">
              {filteredNodes.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleJumpToNode(n)}
                  className="px-2 py-1.5 hover:bg-slate-800 rounded-lg cursor-pointer text-xs flex items-center justify-between"
                >
                  <span className="font-medium text-slate-200 truncate">{n.data.label}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{n.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Auto-Arrange Layout (Magic Wand) */}
          <button
            onClick={handleAutoLayout}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 shadow-2xs"
            title="Auto-arrange nodes in neat columns"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Auto-Layout</span>
          </button>

          {/* Flow Settings */}
          <button
            onClick={() => setShowFlowSettingsModal(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Flow Settings & Keywords"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
          </button>

          {/* Templates */}
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition border border-slate-700"
            title="Browse pre-built chatbot flows"
          >
            <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Templates</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={handleExportFlow}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 hidden sm:block"
            title="Export Flow as JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Import JSON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 hidden sm:block"
            title="Import Flow JSON"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(prev => !prev)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Live Simulator Button */}
          <button
            onClick={startSimulator}
            className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden md:inline">Test Flow</span>
          </button>

          {/* Save & Publish */}
          <button
            onClick={handleSaveFlow}
            disabled={saving}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm ${
              saveSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {saving ? (
              <span>Saving...</span>
            ) : saveSuccess ? (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Published!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Publish</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN BUILDER CANVAS CONTAINER */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Floating Node Palette */}
        {paletteOpen && (
          <div className="absolute top-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl space-y-1.5 w-44 animate-in fade-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-2 py-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Blocks</p>
              <span className="text-[9px] text-slate-500">1-click</span>
            </div>

            <button
              onClick={() => handleAddNode('message')}
              className="w-full px-2.5 py-1.5 bg-slate-800/80 hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 transition group"
            >
              <MessageSquare className="w-3.5 h-3.5 text-blue-400 group-hover:text-white" />
              <span>Text Message</span>
            </button>

            <button
              onClick={() => handleAddNode('buttons')}
              className="w-full px-2.5 py-1.5 bg-slate-800/80 hover:bg-purple-600 text-slate-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 transition group"
            >
              <ListOrdered className="w-3.5 h-3.5 text-purple-400 group-hover:text-white" />
              <span>Options Buttons</span>
            </button>

            <button
              onClick={() => handleAddNode('input')}
              className="w-full px-2.5 py-1.5 bg-slate-800/80 hover:bg-amber-600 text-slate-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 transition group"
            >
              <FormInput className="w-3.5 h-3.5 text-amber-400 group-hover:text-white" />
              <span>Collect Info</span>
            </button>

            <button
              onClick={() => handleAddNode('gemini_ai')}
              className="w-full px-2.5 py-1.5 bg-slate-800/80 hover:bg-indigo-600 text-slate-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 transition group"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:text-white" />
              <span>Gemini AI</span>
            </button>

            <button
              onClick={() => handleAddNode('condition')}
              className="w-full px-2.5 py-1.5 bg-slate-800/80 hover:bg-teal-600 text-slate-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 transition group"
            >
              <GitBranch className="w-3.5 h-3.5 text-teal-400 group-hover:text-white" />
              <span>Branch / If</span>
            </button>

            <button
              onClick={() => handleAddNode('handoff')}
              className="w-full px-2.5 py-1.5 bg-slate-800/80 hover:bg-rose-600 text-slate-200 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 transition group"
            >
              <UserCheck className="w-3.5 h-3.5 text-rose-400 group-hover:text-white" />
              <span>Team Handoff</span>
            </button>

            <button
              onClick={() => handleAddNode('end')}
              className="w-full px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-2 transition group"
            >
              <CheckCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
              <span>End & Rate</span>
            </button>

            <div className="pt-2 border-t border-slate-800">
              <p className="text-[10px] text-slate-500 leading-tight px-1">
                Tip: Drag wire to empty space to spawn new block!
              </p>
            </div>
          </div>
        )}

        {/* Bottom Left Canvas Navigation & Viewport Controls */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1.5 text-slate-300">
          <button
            onClick={() => setZoom(prev => Math.min(Number((prev + 0.1).toFixed(2)), 2.2))}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition"
            title="Zoom In (Key: +)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <span
            onClick={() => { setZoom(1); setPan({ x: 80, y: 60 }); }}
            className="text-[11px] font-bold text-slate-300 hover:text-indigo-400 px-1.5 py-1 rounded-lg cursor-pointer transition select-none"
            title="Reset to 100%"
          >
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => setZoom(prev => Math.max(Number((prev - 0.1).toFixed(2)), 0.3))}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition"
            title="Zoom Out (Key: -)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          {/* Fit To Screen */}
          <button
            onClick={handleFitToScreen}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition flex items-center gap-1 text-[11px] font-semibold"
            title="Fit All Nodes in View"
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span className="hidden sm:inline">Fit View</span>
          </button>

          {/* Snap to Grid Toggle */}
          <button
            onClick={() => setSnapToGrid(prev => !prev)}
            className={`p-1.5 rounded-xl transition ${
              snapToGrid ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title={`Snap to Grid: ${snapToGrid ? 'Enabled (20px)' : 'Disabled'}`}
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Mini-Map Toggle */}
          <button
            onClick={() => setShowMiniMap(prev => !prev)}
            className={`p-1.5 rounded-xl transition ${
              showMiniMap ? 'bg-indigo-600/30 text-indigo-400 border border-indigo-500/40' : 'hover:bg-slate-800 text-slate-400'
            }`}
            title="Toggle Mini-Map"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* Shortcuts Guide Button */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-indigo-400 rounded-xl transition"
            title="Keyboard Shortcuts Cheat Sheet"
          >
            <QuestionIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE INFINITE DRAG & SCROLL CANVAS */}
        {/* ======================================================== */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleWheel}
          className={`flex-1 w-full h-full relative overflow-hidden bg-slate-950 ${
            isSpacePressed || isPanning ? 'cursor-grabbing' : 'cursor-default'
          }`}
          style={{
            backgroundImage: snapToGrid
              ? 'radial-gradient(circle, rgba(148, 163, 184, 0.15) 1px, transparent 1px)'
              : 'none',
            backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          {/* Zoomed & Panned Content Layer */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              position: 'absolute',
              width: '6000px',
              height: '4500px'
            }}
          >
            {/* SVG Connecting Curves & Arrows */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <marker
                  id="flow-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#818cf8" />
                </marker>
                <marker
                  id="flow-arrow-selected"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#f43f5e" />
                </marker>
              </defs>

              {/* Render Existing Edges */}
              {edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                // Compute exact source output port coordinate
                let y1 = sourceNode.position.y + 44;
                if (edge.sourceHandle && sourceNode.type === 'buttons') {
                  const btnIdx = (sourceNode.data.buttons || []).findIndex((b: any) => b.id === edge.sourceHandle);
                  if (btnIdx >= 0) {
                    y1 = sourceNode.position.y + 88 + btnIdx * 34;
                  }
                }
                const x1 = sourceNode.position.x + NODE_WIDTH;

                // Compute exact target input port coordinate
                const x2 = targetNode.position.x;
                const y2 = targetNode.position.y + 44;

                const dx = Math.max(Math.abs(x2 - x1) * 0.5, 50);
                const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                const midX = (x1 + x2) / 2;
                const midY = (y1 + y2) / 2;

                const isSelected = selectedEdgeId === edge.id;
                const isHovered = hoveredEdgeId === edge.id;

                return (
                  <g key={edge.id} className="pointer-events-auto">
                    {/* Thicker transparent stroke for easy clicking/hovering */}
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="16"
                      className="cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                      }}
                      onMouseEnter={() => setHoveredEdgeId(edge.id)}
                      onMouseLeave={() => setHoveredEdgeId(null)}
                    />

                    {/* Visible line */}
                    <path
                      d={path}
                      fill="none"
                      stroke={isSelected ? '#f43f5e' : isHovered ? '#a855f7' : '#6366f1'}
                      strokeWidth={isSelected ? '3.5' : '2.5'}
                      strokeDasharray={isSelected ? 'none' : '6 3'}
                      markerEnd={isSelected ? 'url(#flow-arrow-selected)' : 'url(#flow-arrow)'}
                      className="transition-colors duration-150"
                    />

                    {/* Start & End dot rings */}
                    <circle cx={x1} cy={y1} r="4" fill="#a855f7" />
                    <circle cx={x2} cy={y2} r="4" fill="#6366f1" />

                    {/* Delete Badge on Hover or Selection */}
                    {(isHovered || isSelected) && (
                      <g
                        transform={`translate(${midX}, ${midY})`}
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteEdge(edge.id);
                        }}
                        className="cursor-pointer"
                      >
                        <circle r="11" fill="#f43f5e" className="shadow-lg" />
                        <text
                          textAnchor="middle"
                          dy=".3em"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="bold"
                          pointerEvents="none"
                        >
                          ✕
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Dynamic Connecting Wire while dragging from an output port */}
              {connectingFrom && connectingCursor && (
                <g>
                  {(() => {
                    const x1 = connectingFrom.startX;
                    const y1 = connectingFrom.startY;
                    const x2 = connectingCursor.x;
                    const y2 = connectingCursor.y;
                    const dx = Math.max(Math.abs(x2 - x1) * 0.5, 40);
                    const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                    return (
                      <>
                        <path
                          d={path}
                          fill="none"
                          stroke="#ec4899"
                          strokeWidth="3"
                          strokeDasharray="4 4"
                          markerEnd="url(#flow-arrow)"
                          className="animate-pulse"
                        />
                        <circle cx={x1} cy={y1} r="5" fill="#ec4899" />
                        <circle cx={x2} cy={y2} r="5" fill="#ec4899" />
                      </>
                    );
                  })()}
                </g>
              )}
            </svg>

            {/* Quick-Add on Wire Drop Menu Popover */}
            {quickAddMenu && (
              <div
                style={{
                  left: `${quickAddMenu.x}px`,
                  top: `${quickAddMenu.y}px`,
                  position: 'absolute'
                }}
                className="z-40 bg-slate-900 border-2 border-indigo-500 rounded-2xl p-2.5 shadow-2xl space-y-1.5 w-48 animate-in zoom-in-95 text-white select-none"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Connect New Step</span>
                  <button onClick={() => setQuickAddMenu(null)} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => handleAddNode('message', { x: quickAddMenu.x, y: quickAddMenu.y }, { nodeId: quickAddMenu.fromNodeId, handleId: quickAddMenu.fromHandleId })}
                  className="w-full text-left px-2 py-1.5 hover:bg-blue-600 rounded-xl text-xs font-medium flex items-center gap-2 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> Message
                </button>
                <button
                  onClick={() => handleAddNode('buttons', { x: quickAddMenu.x, y: quickAddMenu.y }, { nodeId: quickAddMenu.fromNodeId, handleId: quickAddMenu.fromHandleId })}
                  className="w-full text-left px-2 py-1.5 hover:bg-purple-600 rounded-xl text-xs font-medium flex items-center gap-2 transition"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-purple-400" /> Option Buttons
                </button>
                <button
                  onClick={() => handleAddNode('input', { x: quickAddMenu.x, y: quickAddMenu.y }, { nodeId: quickAddMenu.fromNodeId, handleId: quickAddMenu.fromHandleId })}
                  className="w-full text-left px-2 py-1.5 hover:bg-amber-600 rounded-xl text-xs font-medium flex items-center gap-2 transition"
                >
                  <FormInput className="w-3.5 h-3.5 text-amber-400" /> Collect Input
                </button>
                <button
                  onClick={() => handleAddNode('gemini_ai', { x: quickAddMenu.x, y: quickAddMenu.y }, { nodeId: quickAddMenu.fromNodeId, handleId: quickAddMenu.fromHandleId })}
                  className="w-full text-left px-2 py-1.5 hover:bg-indigo-600 rounded-xl text-xs font-medium flex items-center gap-2 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Gemini AI
                </button>
                <button
                  onClick={() => handleAddNode('condition', { x: quickAddMenu.x, y: quickAddMenu.y }, { nodeId: quickAddMenu.fromNodeId, handleId: quickAddMenu.fromHandleId })}
                  className="w-full text-left px-2 py-1.5 hover:bg-teal-600 rounded-xl text-xs font-medium flex items-center gap-2 transition"
                >
                  <GitBranch className="w-3.5 h-3.5 text-teal-400" /> Condition
                </button>
                <button
                  onClick={() => handleAddNode('handoff', { x: quickAddMenu.x, y: quickAddMenu.y }, { nodeId: quickAddMenu.fromNodeId, handleId: quickAddMenu.fromHandleId })}
                  className="w-full text-left px-2 py-1.5 hover:bg-rose-600 rounded-xl text-xs font-medium flex items-center gap-2 transition"
                >
                  <UserCheck className="w-3.5 h-3.5 text-rose-400" /> Handoff
                </button>
                <button
                  onClick={() => handleAddNode('end', { x: quickAddMenu.x, y: quickAddMenu.y }, { nodeId: quickAddMenu.fromNodeId, handleId: quickAddMenu.fromHandleId })}
                  className="w-full text-left px-2 py-1.5 hover:bg-slate-700 rounded-xl text-xs font-medium flex items-center gap-2 transition"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-slate-400" /> End Chat
                </button>
              </div>
            )}

            {/* Draggable Node Cards */}
            {nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const theme = THEME_COLORS[node.data.themeColor || 'default'] || THEME_COLORS.default;

              let icon = <MessageSquare className="w-4 h-4 text-blue-400" />;
              if (node.type === 'trigger') icon = <Play className="w-4 h-4 text-emerald-400 fill-current" />;
              else if (node.type === 'buttons') icon = <ListOrdered className="w-4 h-4 text-purple-400" />;
              else if (node.type === 'input') icon = <FormInput className="w-4 h-4 text-amber-400" />;
              else if (node.type === 'gemini_ai') icon = <Sparkles className="w-4 h-4 text-indigo-400" />;
              else if (node.type === 'condition') icon = <GitBranch className="w-4 h-4 text-teal-400" />;
              else if (node.type === 'handoff') icon = <UserCheck className="w-4 h-4 text-rose-400" />;
              else if (node.type === 'end') icon = <CheckCircle className="w-4 h-4 text-slate-400" />;

              return (
                <div
                  key={node.id}
                  onMouseDown={e => handleNodeMouseDown(e, node.id)}
                  style={{
                    left: `${node.position.x}px`,
                    top: `${node.position.y}px`,
                    width: `${NODE_WIDTH}px`,
                    position: 'absolute'
                  }}
                  className={`bg-slate-900 border rounded-2xl shadow-xl select-none z-10 cursor-move transition-all group ${
                    isSelected
                      ? `ring-2 ${theme.ring} border-indigo-400 shadow-indigo-500/30`
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Floating Micro-Toolbar on Selected Node */}
                  {isSelected && (
                    <div
                      onMouseDown={e => e.stopPropagation()}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 bg-slate-900 border border-slate-700 rounded-xl px-2 py-1 flex items-center gap-1 shadow-2xl animate-in zoom-in-95"
                    >
                      <button
                        onClick={() => handleDuplicateNode(node.id)}
                        className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition"
                        title="Duplicate (Clone)"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAddNode('message', { x: node.position.x + 300, y: node.position.y }, { nodeId: node.id })}
                        className="p-1 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 rounded-lg transition"
                        title="Add Next Step"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {node.type !== 'trigger' && (
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          className="p-1 hover:bg-rose-950 text-slate-400 hover:text-rose-400 rounded-lg transition"
                          title="Delete Node"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Left Target Connection Port (Except for Trigger) */}
                  {node.type !== 'trigger' && (
                    <div
                      onMouseUp={e => handleCompleteConnection(e, node.id)}
                      className="absolute -left-3 top-9 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center cursor-crosshair hover:scale-125 hover:bg-indigo-600 transition shadow-md z-30 group/inport"
                      title="Drop connection here to link"
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-400 group-hover/inport:bg-white" />
                    </div>
                  )}

                  {/* Right Output Connection Port (For general nodes) */}
                  {node.type !== 'end' && node.type !== 'buttons' && (
                    <div
                      onMouseDown={e => handleStartConnection(e, node.id)}
                      className="absolute -right-3 top-9 w-6 h-6 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center cursor-crosshair hover:scale-125 hover:bg-purple-600 transition shadow-md z-30 group/outport"
                      title="Click & drag wire to link, or release on empty space to spawn new step"
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-400 group-hover/outport:bg-white" />
                    </div>
                  )}

                  {/* Node Header */}
                  <div className={`px-3 py-2.5 border-b rounded-t-2xl flex items-center justify-between ${theme.header}`}>
                    <div className="flex items-center gap-2 truncate">
                      {icon}
                      <span className="font-bold text-xs truncate">{node.data.label}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Duplicate Node */}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDuplicateNode(node.id);
                        }}
                        className="text-slate-400 hover:text-white transition p-0.5 rounded"
                        title="Duplicate Node"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Node (Cannot delete trigger) */}
                      {node.type !== 'trigger' && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleDeleteNode(node.id);
                          }}
                          className="text-slate-400 hover:text-rose-400 transition p-0.5 rounded"
                          title="Delete Node (Del)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subtitle / Note (If configured) */}
                  {node.data.subtitle && (
                    <div className="px-3 py-1 bg-slate-950/60 border-b border-slate-800 text-[10px] text-slate-400 italic truncate">
                      {node.data.subtitle}
                    </div>
                  )}

                  {/* Node Preview Body */}
                  <div className="p-3 text-xs text-slate-300 space-y-2">
                    {node.type === 'trigger' && (
                      <p className="text-[11px] text-emerald-400/90 font-medium">
                        Fires automatically when visitor initiates chat
                      </p>
                    )}

                    {node.type === 'message' && (
                      <p className="text-[11px] text-slate-300 line-clamp-3 bg-slate-950 p-2 rounded-lg border border-slate-800 leading-relaxed">
                        {node.data.message || 'No text set'}
                      </p>
                    )}

                    {node.type === 'buttons' && (
                      <div className="space-y-1.5">
                        <p className="text-[11px] text-slate-400 truncate">{node.data.prompt}</p>
                        <div className="space-y-1.5 relative">
                          {(node.data.buttons || []).map((btn: any, idx: number) => {
                            const isLinked = edges.some(e => e.source === node.id && e.sourceHandle === btn.id);
                            return (
                              <div
                                key={btn.id || idx}
                                className="relative bg-purple-950/40 border border-purple-800/40 px-2.5 py-1.5 rounded-lg text-[11px] text-purple-200 flex items-center justify-between"
                              >
                                <span className="truncate max-w-[170px]">{btn.text}</span>

                                {/* Button Dedicated Output Port */}
                                <div
                                  onMouseDown={e => handleStartConnection(e, node.id, btn.id)}
                                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center cursor-crosshair hover:scale-125 transition ${
                                    isLinked
                                      ? 'bg-purple-600 border-purple-300'
                                      : 'bg-slate-900 border-purple-400 hover:bg-purple-600'
                                  }`}
                                  title={`Drag to route "${btn.text}" to next step`}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {node.type === 'input' && (
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
                        <div className="flex items-center justify-between text-amber-400 font-semibold uppercase text-[10px]">
                          <span>Capture: {node.data.inputType || 'phone'}</span>
                        </div>
                        <p className="text-slate-400 truncate mt-0.5">{node.data.prompt}</p>
                      </div>
                    )}

                    {node.type === 'gemini_ai' && (
                      <div className="bg-indigo-950/40 p-2 rounded-lg border border-indigo-800/40 text-[11px] text-indigo-200">
                        <p className="font-semibold text-indigo-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Gemini 3.1 Flash-Lite
                        </p>
                        <p className="text-slate-400 text-[10px] truncate mt-0.5">
                          {node.data.prompt || 'Auto-fallback to Knowledge Base'}
                        </p>
                      </div>
                    )}

                    {node.type === 'condition' && (
                      <div className="bg-teal-950/40 p-2 rounded-lg border border-teal-800/40 text-[11px] text-teal-200">
                        <p className="font-semibold text-teal-400">If text matches keywords:</p>
                        <p className="text-slate-300 text-[10px] truncate mt-0.5 font-mono">
                          {node.data.keyword || 'pricing, quote'}
                        </p>
                      </div>
                    )}

                    {node.type === 'handoff' && (
                      <div className="bg-rose-950/40 p-2 rounded-lg border border-rose-800/40 text-[11px] text-rose-200">
                        <p className="font-semibold text-rose-400">Routes to Live Agent</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">Distribution: Round-Robin</p>
                      </div>
                    )}

                    {node.type === 'end' && (
                      <p className="text-[11px] text-slate-400 italic">Concludes conversation & requests CSAT rating.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ======================================================== */}
        {/* INTERACTIVE MINI-MAP (RADAR VIEW) */}
        {/* ======================================================== */}
        {showMiniMap && (
          <div
            onClick={handleMiniMapClick}
            className="absolute bottom-4 right-4 z-20 w-44 h-32 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden cursor-crosshair hidden sm:block"
            title="Mini-Map: Click to pan directly to location"
          >
            <div className="w-full h-full relative bg-slate-950/60 p-1">
              {/* Nodes miniature dots */}
              {nodes.map(n => {
                const normX = ((n.position.x - miniMapBounds.minX) / miniMapBounds.width) * 100;
                const normY = ((n.position.y - miniMapBounds.minY) / miniMapBounds.height) * 100;

                let dotColor = 'bg-blue-400';
                if (n.type === 'trigger') dotColor = 'bg-emerald-400';
                else if (n.type === 'buttons') dotColor = 'bg-purple-400';
                else if (n.type === 'gemini_ai') dotColor = 'bg-indigo-400';
                else if (n.type === 'handoff') dotColor = 'bg-rose-400';

                return (
                  <div
                    key={n.id}
                    style={{
                      left: `${Math.min(Math.max(normX, 4), 92)}%`,
                      top: `${Math.min(Math.max(normY, 4), 90)}%`,
                      position: 'absolute'
                    }}
                    className={`w-3.5 h-2 rounded-xs ${dotColor} opacity-90 shadow-xs`}
                  />
                );
              })}

              {/* Viewport Frame Box */}
              {(() => {
                const rect = canvasRef.current?.getBoundingClientRect();
                if (!rect) return null;

                const viewCanvasLeft = -pan.x / zoom;
                const viewCanvasTop = -pan.y / zoom;
                const viewCanvasWidth = rect.width / zoom;
                const viewCanvasHeight = rect.height / zoom;

                const leftFrac = ((viewCanvasLeft - miniMapBounds.minX) / miniMapBounds.width) * 100;
                const topFrac = ((viewCanvasTop - miniMapBounds.minY) / miniMapBounds.height) * 100;
                const widthFrac = (viewCanvasWidth / miniMapBounds.width) * 100;
                const heightFrac = (viewCanvasHeight / miniMapBounds.height) * 100;

                return (
                  <div
                    style={{
                      left: `${Math.max(leftFrac, 0)}%`,
                      top: `${Math.max(topFrac, 0)}%`,
                      width: `${Math.min(widthFrac, 100)}%`,
                      height: `${Math.min(heightFrac, 100)}%`,
                      position: 'absolute'
                    }}
                    className="border-2 border-indigo-400/80 bg-indigo-500/15 rounded-xs pointer-events-none"
                  />
                );
              })()}

              <div className="absolute top-1 left-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none">
                Radar
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* RIGHT NODE PROPERTIES INSPECTOR DRAWER */}
        {/* ======================================================== */}
        {selectedNode && (
          <div className="w-80 md:w-88 bg-slate-900 border-l border-slate-800 p-4 overflow-y-auto space-y-4 z-20 text-white shrink-0 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">Block Customizer</h4>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Color Theme Customizer */}
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1.5 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-400" />
                  Color Accent
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 'default', color: 'bg-slate-700', label: 'Default' },
                    { id: 'indigo', color: 'bg-indigo-600', label: 'Indigo' },
                    { id: 'emerald', color: 'bg-emerald-600', label: 'Emerald' },
                    { id: 'purple', color: 'bg-purple-600', label: 'Purple' },
                    { id: 'amber', color: 'bg-amber-600', label: 'Amber' },
                    { id: 'rose', color: 'bg-rose-600', label: 'Rose' },
                    { id: 'teal', color: 'bg-teal-600', label: 'Teal' }
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleUpdateSelectedNode('themeColor', c.id)}
                      className={`w-6 h-6 rounded-full ${c.color} flex items-center justify-center transition-transform ${
                        (selectedNode.data.themeColor || 'default') === c.id
                          ? 'ring-2 ring-white scale-110 shadow-md'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      title={c.label}
                    >
                      {(selectedNode.data.themeColor || 'default') === c.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step Title */}
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">Step Label</label>
                <input
                  type="text"
                  value={selectedNode.data.label || ''}
                  onChange={e => handleUpdateSelectedNode('label', e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              {/* Step Subtitle / Description Note */}
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1 flex items-center gap-1">
                  <Tag className="w-3 h-3 text-slate-400" /> Subtitle / Internal Note
                </label>
                <input
                  type="text"
                  value={selectedNode.data.subtitle || ''}
                  onChange={e => handleUpdateSelectedNode('subtitle', e.target.value)}
                  placeholder="e.g. Asks customer for WhatsApp number"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 text-xs"
                />
              </div>

              {/* Message Block Editor */}
              {selectedNode.type === 'message' && (
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    value={selectedNode.data.message || ''}
                    onChange={e => handleUpdateSelectedNode('message', e.target.value)}
                    placeholder="Enter message for visitor..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Variables supported: {'{{visitor_name}}'}, {'{{visitor_phone}}'}</p>
                </div>
              )}

              {/* Buttons Block Editor */}
              {selectedNode.type === 'buttons' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Prompt Question</label>
                    <input
                      type="text"
                      value={selectedNode.data.prompt || ''}
                      onChange={e => handleUpdateSelectedNode('prompt', e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] text-slate-400 font-bold block">Options & Routing</label>
                    {(selectedNode.data.buttons || []).map((btn: any, idx: number) => {
                      const linkedEdge = edges.find(e => e.source === selectedNode.id && e.sourceHandle === btn.id);
                      const currentTarget = linkedEdge ? linkedEdge.target : btn.targetNodeId || '';

                      return (
                        <div key={btn.id || idx} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="text"
                              value={btn.text}
                              onChange={e => {
                                const updated = [...selectedNode.data.buttons];
                                updated[idx].text = e.target.value;
                                handleUpdateSelectedNode('buttons', updated);
                              }}
                              className="flex-1 p-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs outline-none focus:border-indigo-500"
                            />
                            <button
                              onClick={() => {
                                const updated = selectedNode.data.buttons.filter((_: any, i: number) => i !== idx);
                                handleUpdateSelectedNode('buttons', updated);
                                setEdges(prev => prev.filter(e => !(e.source === selectedNode.id && e.sourceHandle === btn.id)));
                              }}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg"
                              title="Delete Option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Route to Target Dropdown */}
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-slate-400 shrink-0">Routes to:</span>
                            <select
                              value={currentTarget}
                              onChange={e => handleSetTargetNode(selectedNode.id, e.target.value, btn.id)}
                              className="flex-1 p-1 bg-slate-900 border border-slate-700 rounded-md text-slate-200 outline-none"
                            >
                              <option value="">[ Drag Port or Pick Step ]</option>
                              {nodes
                                .filter(n => n.id !== selectedNode.id)
                                .map(n => (
                                  <option key={n.id} value={n.id}>
                                    {n.data.label} ({n.type})
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => {
                        const newBtnId = `btn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
                        const updated = [...(selectedNode.data.buttons || []), { id: newBtnId, text: 'New Option' }];
                        handleUpdateSelectedNode('buttons', updated);
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Option
                    </button>
                  </div>
                </div>
              )}

              {/* Input Block Editor */}
              {selectedNode.type === 'input' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Input Prompt</label>
                    <input
                      type="text"
                      value={selectedNode.data.prompt || ''}
                      onChange={e => handleUpdateSelectedNode('prompt', e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Field Type</label>
                    <select
                      value={selectedNode.data.inputType || 'phone'}
                      onChange={e => handleUpdateSelectedNode('inputType', e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                    >
                      <option value="phone">Phone / WhatsApp Number</option>
                      <option value="email">Email Address</option>
                      <option value="text">General Text / Name</option>
                      <option value="number">Numeric Value</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Condition Block Editor */}
              {selectedNode.type === 'condition' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">Match Keywords (comma separated)</label>
                    <input
                      type="text"
                      value={selectedNode.data.keyword || ''}
                      onChange={e => handleUpdateSelectedNode('keyword', e.target.value)}
                      placeholder="pricing, cost, quote"
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Gemini AI Block Editor */}
              {selectedNode.type === 'gemini_ai' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">AI Greeting</label>
                    <input
                      type="text"
                      value={selectedNode.data.greeting || ''}
                      onChange={e => handleUpdateSelectedNode('greeting', e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">System Instructions</label>
                    <textarea
                      rows={4}
                      value={selectedNode.data.prompt || ''}
                      onChange={e => handleUpdateSelectedNode('prompt', e.target.value)}
                      placeholder="Instructions for Gemini AI bot..."
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white resize-none outline-none focus:border-indigo-500 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Linear Step Output Target Link (For message, input, condition, gemini_ai, trigger) */}
              {selectedNode.type !== 'buttons' && selectedNode.type !== 'end' && (
                <div className="pt-2 border-t border-slate-800">
                  <label className="text-[11px] text-slate-400 font-bold block mb-1 flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                    Next Step Connection
                  </label>
                  {(() => {
                    const currentEdge = edges.find(e => e.source === selectedNode.id && !e.sourceHandle);
                    return (
                      <select
                        value={currentEdge?.target || ''}
                        onChange={e => handleSetTargetNode(selectedNode.id, e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 text-xs"
                      >
                        <option value="">[ Drag Port or Select Next Node ]</option>
                        {nodes
                          .filter(n => n.id !== selectedNode.id)
                          .map(n => (
                            <option key={n.id} value={n.id}>
                              {n.data.label} ({n.type})
                            </option>
                          ))}
                      </select>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons in Inspector */}
              <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleDuplicateNode(selectedNode.id)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>

                {selectedNode.type !== 'trigger' && (
                  <button
                    onClick={() => handleDeleteNode(selectedNode.id)}
                    className="p-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-xl transition"
                    title="Delete Node"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* FLOW SETTINGS MODAL */}
      {/* ======================================================== */}
      {showFlowSettingsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Chatbot Flow Configuration</h3>
              </div>
              <button onClick={() => setShowFlowSettingsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Flow Name</label>
                <input
                  type="text"
                  value={flowName}
                  onChange={e => setFlowName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={flowDesc}
                  onChange={e => setFlowDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Trigger Event</label>
                <select
                  value={flowTriggerType}
                  onChange={e => setFlowTriggerType(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                >
                  <option value="chat_opened">When visitor opens the chat widget</option>
                  <option value="keyword_match">When visitor sends a matching keyword</option>
                  <option value="first_visit">First time website visit</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Trigger Keywords (comma separated)</label>
                <input
                  type="text"
                  value={flowKeywords}
                  onChange={e => setFlowKeywords(e.target.value)}
                  placeholder="hello, hi, help, support, price, admission"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <h5 className="font-bold text-slate-200">Active Status</h5>
                  <p className="text-[10px] text-slate-500">Enable this flow on your live website widget</p>
                </div>
                <input
                  type="checkbox"
                  checked={flowActive}
                  onChange={e => setFlowActive(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowFlowSettingsModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* KEYBOARD SHORTCUTS CHEAT SHEET MODAL */}
      {/* ======================================================== */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QuestionIcon className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Keyboard & Mouse Shortcuts</h3>
              </div>
              <button onClick={() => setShowShortcutsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: 'Space + Drag', desc: 'Pan / Move canvas freely anywhere' },
                { key: 'Mouse Wheel', desc: 'Scroll up / down' },
                { key: 'Ctrl + Wheel', desc: 'Zoom In / Out around cursor' },
                { key: '+ / -', desc: 'Zoom In / Out' },
                { key: '0 (Zero)', desc: 'Reset Zoom to 100%' },
                { key: 'Delete / Backspace', desc: 'Delete selected node or connection line' },
                { key: 'Ctrl + S', desc: 'Save & Publish flow' },
                { key: 'Drag Wire to Empty Space', desc: 'Spawns Quick-Add menu for new step' },
                { key: 'Esc', desc: 'Deselect / Close panels' }
              ].map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="font-mono text-indigo-400 text-[11px] font-bold">{s.key}</span>
                  <span className="text-slate-300 text-[11px]">{s.desc}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* INTERACTIVE LIVE BOT SIMULATOR DRAWER */}
      {/* ======================================================== */}
      {simulatorOpen && (
        <div className="absolute inset-y-0 right-0 w-80 md:w-96 bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          <div className="p-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <div>
                <h4 className="font-bold text-xs">Live Flow Simulator</h4>
                <p className="text-[10px] opacity-80">Test your bot flow in real-time</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={startSimulator}
                className="text-white/80 hover:text-white p-1 rounded-lg"
                title="Restart Simulation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSimulatorOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Simulator Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
            {simMessages.map((m, idx) => {
              if (m.sender === 'system') {
                return (
                  <div key={idx} className="text-center my-2">
                    <span className="bg-slate-200 text-slate-700 text-[10px] px-2.5 py-1 rounded-full font-medium inline-block">
                      {m.text}
                    </span>
                  </div>
                );
              }
              const isUser = m.sender === 'user';
              return (
                <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-900 rounded-bl-xs'
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.buttons && m.buttons.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                        {m.buttons.map((b, bIdx) => (
                          <button
                            key={bIdx}
                            onClick={() => handleSimSelectButton(b)}
                            className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 text-[11px] px-2.5 py-1 rounded-full font-medium transition"
                          >
                            {b.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simulator Input */}
          <form onSubmit={handleSimSendInput} className="p-3 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={simInputText}
              onChange={e => setSimInputText(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />
            <button
              type="submit"
              disabled={!simInputText.trim()}
              className="p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* PRE-BUILT TEMPLATES MODAL */}
      {/* ======================================================== */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-white animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">Chatbot Flow Templates</h3>
              </div>
              <button onClick={() => setShowTemplatesModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {templates.map(tpl => (
                <div
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500 rounded-xl cursor-pointer transition space-y-1"
                >
                  <h4 className="font-bold text-xs text-white">{tpl.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{tpl.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
