"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Circle, ExternalLink, Loader2 } from "lucide-react";

interface Task {
  id: string;
  nombre: string;
  descripcion: string;
  completada: boolean;
  link: string | null;
  orden: number;
  fase: number;
}

export function TaskList({ tasks: initialTasks, companyId }: { tasks: Task[]; companyId: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const supabase = createClient();

  async function toggle(task: Task) {
    setLoadingId(task.id);
    const newState = !task.completada;
    setTasks(tasks.map(t => t.id === task.id ? { ...t, completada: newState } : t));
    await supabase
      .from("tareas")
      .update({ completada: newState, completed_at: newState ? new Date().toISOString() : null })
      .eq("id", task.id);
    setLoadingId(null);
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
            task.completada ? "bg-[#10B981]/5 border-[#10B981]/30" : "bg-[#0D1117] border-[#30363D] hover:border-[#8B949E]"
          }`}
        >
          <button
            onClick={() => toggle(task)}
            disabled={loadingId === task.id}
            className="flex-shrink-0 mt-0.5 transition-transform hover:scale-110"
          >
            {loadingId === task.id ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#8B949E]" />
            ) : task.completada ? (
              <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
            ) : (
              <Circle className="w-5 h-5 text-[#484F58] hover:text-[#8B949E]" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className={`font-medium ${task.completada ? "text-[#8B949E] line-through" : "text-[#F0F6FC]"}`}>
              {task.nombre}
            </div>
            <div className="text-sm text-[#8B949E] mt-0.5">{task.descripcion}</div>
          </div>
          {task.link && (
            <a
              href={task.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 p-2 rounded-lg hover:bg-[#161B22] transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4 text-[#3B82F6]" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
