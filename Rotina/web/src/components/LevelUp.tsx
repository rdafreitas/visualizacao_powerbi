// Declarar propriedades de LevelUP
interface LevelUpProps { 
  nivel: number;
  tarefasCompletas: number;
  totalTarefas: number;
}

// Componente LevelUp
function LevelUp(props: LevelUpProps) {

  // Calcular a porcentagem de tarefas concluídas
  const porcentagem = (props.tarefasCompletas / props.totalTarefas) * 100;

  return (
    <div className="bg-purple-900 rounded-md p-4 mb-4">
      {/* Informações do usuário  */}
      <div className="flex justify-between mb-2">
        <span className="text-purple-200 font-medium">
          Nível {props.nivel} - Iniciante
        </span>
        <span className="text-purple-400 text-sm">
          {props.tarefasCompletas} / {props.totalTarefas} tarefas
          </span>
      </div>

      {/* Barra de Progresso */}
      {/* Fundo da barra */}
      <div className="h-3 bg-purple-950 rounded-full overflow-hidden">
        {/* Preenchimento da barra de progresso */}
        <div 
          className="h-full bg-pink-400 rounded-full transition-all"
          style={{ width: `${porcentagem}%` }}
        ></div>
      </div>

      {/* Frase de Incentivo */}
      <p className="text-purple-400 text-xs mt-2">
        Complete as tarefas para subir de nível!
      </p>
    </div>
  );
}

export default LevelUp;
