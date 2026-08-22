import { useState } from "react";
import "./App.css";
import Cabecalho from "./components/Cabecalho";
import LevelUp from "./components/LevelUp";
import FasesDia from "./components/FasesDia";

function App() {
  // Definir a lista de tarefas
  const [tasks, setTasks] = useState([
    { id: 1, title: "Acordar", completed: true },
    { id: 2, title: "Tomar café da manhã", completed: false },
  ]);

  const tarefasConcluidas = tasks.filter((t) => t.completed).length;

  return (
    <div className="w-screen h-screen flex justify-center"> {/* Container principal - Conteudo pega toda tela e fica centralizado */}
      <div className="w-[500px]">
        <Cabecalho />
        <LevelUp
          nivel={1}
          totalTarefas={tasks.length}
          tarefasCompletas={tarefasConcluidas}
        />
        <FasesDia faseDia={"Tarde"} tarefa={tasks} />
      </div>
    </div>
  );
}

export default App;
