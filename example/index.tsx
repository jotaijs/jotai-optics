import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { atom, Provider, useAtom } from 'jotai'
import { focus, RWAtom, useAtomArrayFamily } from '../src/index'
import { useUpdateAtom } from 'jotai/utils'

const TodosAtom = atom([
  { task: 'Eat some food', checked: false },
  { task: 'Go for a walk', checked: false },
])

const TodoList = ({ todos }: { todos: RWAtom<Todos> }) => {
  const atoms = useAtomArrayFamily(todos)
  const changeTodoList = useUpdateAtom(todos)
  return (
    <ul>
      {atoms.map(([atom, onRemove]) => (
        <Todo todo={atom} onRemove={onRemove} />
      ))}
      <button
        onClick={() =>
          changeTodoList(oldValue => [
            ...oldValue,
            /* TODO: use optic.append (setter) here */
            { task: 'New task', checked: false },
          ])
        }
      >
        Add new todo
      </button>
      <button
        onClick={() =>
          changeTodoList(oldValue => oldValue.filter(x => !x.checked))
        }
      >
        Clear done
      </button>
    </ul>
  )
}

const Todo = ({
  todo,
  onRemove,
}: {
  todo: RWAtom<TodoItem>
  onRemove: () => void
}) => {
  const [task, onChangeTask] = useAtom(focus(todo, optic => optic.prop('task')))
  const [checked, onChangeChecked] = useAtom(
    focus(todo, optic => optic.prop('checked')),
  )

  return (
    <li>
      <input
        type="text"
        value={task}
        onChange={e => onChangeTask(e.target.value)}
      />
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onChangeChecked(val => !val)}
      />
      <button onClick={onRemove}>X</button>
    </li>
  )
}

const App = () => {
  return (
    <Provider>
      <TodoList todos={TodosAtom} />
    </Provider>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))

type TodoItem = { task: string; checked: boolean }
type Todos = Array<TodoItem>
