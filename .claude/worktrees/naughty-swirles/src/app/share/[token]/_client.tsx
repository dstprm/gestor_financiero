'use client'

import { useMemo, useEffect, useState, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { buildFlowGraph } from '@/lib/chartLayout'
import { OrgNode } from '@/components/chart/OrgNode'
import { getDeptColor } from '@/types'
import type { Employee } from '@/types'
import { useTheme } from '@/components/ThemeProvider'
import { Sun, Moon, Search, X } from 'lucide-react'

const nodeTypes = { orgNode: OrgNode }

interface ShareEmployee {
  id: string
  name: string
  title: string | null
  department: string | null
  managerId: string | null
  avatarUrl: string | null
}

function toFlowEmployee(e: ShareEmployee): Employee {
  return {
    id: e.id,
    name: e.name,
    title: e.title ?? '',
    department: e.department ?? '',
    managerId: e.managerId,
    level: '',
    location: '',
    status: 'active',
    flags: [],
    notes: '',
    metadata: {},
  }
}

interface OrgNodeData {
  employee: Employee
  isHighlighted: boolean
  childCount: number
  hiddenChildrenCount: number
  isCollapsed: boolean
  isDimmed: boolean
}

function AutoFit() {
  const { fitView } = useReactFlow()
  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50)
    return () => clearTimeout(t)
  }, [fitView])
  return null
}

function SearchBar({
  employees,
  nodes,
  onHighlight,
}: {
  employees: Employee[]
  nodes: Node[]
  onHighlight: (ids: Set<string>) => void
}) {
  const { setCenter } = useReactFlow()
  const [query, setQuery] = useState('')

  const matches = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q)
    )
  }, [query, employees])

  useEffect(() => {
    if (matches.length === 0) {
      onHighlight(new Set())
      return
    }
    const ids = new Set(matches.map((e) => e.id))
    onHighlight(ids)

    // Pan to first match
    const firstId = matches[0].id
    const node = nodes.find((n) => n.id === firstId)
    if (node && node.measured) {
      const x = node.position.x + (node.measured.width ?? 200) / 2
      const y = node.position.y + (node.measured.height ?? 80) / 2
      setCenter(x, y, { zoom: 1.2, duration: 400 })
    }
  }, [matches, nodes, onHighlight, setCenter])

  function clear() {
    setQuery('')
    onHighlight(new Set())
  }

  return (
    <div className="absolute top-3 left-3 z-20 flex items-center gap-1">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') clear() }}
          placeholder="Search name or title…"
          className="pl-8 pr-8 py-2 w-56 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        {query && (
          <button
            onClick={clear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X size={13} />
          </button>
        )}
      </div>
      {query && (
        <span className="text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-2 shadow-md whitespace-nowrap">
          {matches.length} match{matches.length !== 1 ? 'es' : ''}
        </span>
      )}
    </div>
  )
}

export default function SharePageClient({
  orgName,
  employees: rawEmployees,
}: {
  orgName: string
  employees: ShareEmployee[]
}) {
  const { theme, toggleTheme } = useTheme()

  const employees = useMemo(() => rawEmployees.map(toFlowEmployee), [rawEmployees])

  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set())

  const childrenMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const e of employees) {
      if (e.managerId) {
        if (!map.has(e.managerId)) map.set(e.managerId, [])
        map.get(e.managerId)!.push(e.id)
      }
    }
    return map
  }, [employees])

  const initialGraphData = useMemo(() => {
    const { nodes: rawNodes, edges: rawEdges } = buildFlowGraph(employees, 'TB')
    const augmented = rawNodes.map((n) => ({
      ...n,
      draggable: false,
      data: {
        ...n.data,
        childCount: childrenMap.get(n.id)?.length ?? 0,
        hiddenChildrenCount: 0,
        isCollapsed: false,
        isDimmed: false,
        isHighlighted: false,
      },
    }))
    return { nodes: augmented, edges: rawEdges }
  }, [employees, childrenMap])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialGraphData.nodes)
  const [edges, , onEdgesChange] = useEdgesState(initialGraphData.edges)

  // Apply highlight/dim to nodes when highlightIds changes
  useEffect(() => {
    const hasFilter = highlightIds.size > 0
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isHighlighted: hasFilter && highlightIds.has(n.id),
          isDimmed: hasFilter && !highlightIds.has(n.id),
        },
      }))
    )
  }, [highlightIds, setNodes])

  const handleHighlight = useCallback((ids: Set<string>) => {
    setHighlightIds(ids)
  }, [])

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {orgName}
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
            Read-only
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            Powered by{' '}
            <span className="font-semibold text-blue-500">SimplyOrg</span>
          </a>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative bg-slate-50 dark:bg-slate-900">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={2}
          zoomOnPinch={true}
          panOnDrag={true}
          className="bg-slate-50 dark:bg-slate-900"
        >
          <AutoFit />
          <Background color="#cbd5e1" gap={24} size={1} className="dark:!text-slate-700" />
          <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 [&>button]:!bg-white dark:[&>button]:!bg-slate-800 [&>button]:!border-slate-200 dark:[&>button]:!border-slate-600 [&>button]:!text-slate-600 dark:[&>button]:!text-slate-300 [&>button:hover]:!bg-slate-100 dark:[&>button:hover]:!bg-slate-700" />
          <MiniMap
            className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700"
            nodeColor={(n: Node) => {
              const emp = (n.data as unknown as OrgNodeData)?.employee
              if (!emp) return '#94a3b8'
              return getDeptColor(emp.department)
            }}
          />
          <SearchBar employees={employees} nodes={nodes} onHighlight={handleHighlight} />
        </ReactFlow>
      </div>
    </div>
  )
}
