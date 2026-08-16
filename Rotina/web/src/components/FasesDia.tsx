import { ChevronRightIcon } from "lucide-react"

// Declarar propriedades das Tarefas Diárias
interface Tarefa {
  id: number;
  title: string;
  completed: boolean;
}

interface FasesDiaProps {
  tarefa: Tarefa[];
  faseDia: string;
}

function FasesDia({ tarefa, faseDia }: FasesDiaProps) {
  return (
    <div className="">

      <ul className="space-y-2 p-6 bg-purple-800 rounded-md shadow">

        {/* Definir a fase do Dia: manhã, tarde ou noite */}
        <h2 className="text-left text-pink-400" >{faseDia}</h2>

        {/* Definir a lista de tarefas */}
        {
          tarefa.map((task) =>
            <li key={task.id} className="flex gap-2" > 
              <button className="text-left w-full p-2 rounded-md bg-purple-400 text-pink-500">
                {task.title}
              </button> 
              <button className="p-2 rounded-md bg-purple-400 text-pink-500"> 
                <ChevronRightIcon /> 
              </button>
            </li>)
        }
      </ul>
    </div>
  )
}

export default FasesDia