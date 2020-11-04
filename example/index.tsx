import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { atom, PrimitiveAtom, Provider, useAtom } from 'jotai'
import { focus, useAtomArrayFamily } from '../src/index'
import { useAtomCallback, useUpdateAtom } from 'jotai/utils'

const RecursiveFormAtom = atom<Array<{ [key: string]: string }>>([
  { task: 'Eat some food', checked: 'yeah' },
  { task: 'Go for a walk', checked: 'yeah' },
])

const FormList = ({ todos }: { todos: typeof RecursiveFormAtom }) => {
  const atoms = useAtomArrayFamily(todos)
  const changeFormAtom = useUpdateAtom(todos)
  return (
    <ul>
      {atoms.map(([atom, onRemove], i) => (
        <>
        Form nr ({i})
        <Form formAtom={atom} onRemove={onRemove} />
        </>
      ))}
      <button
        onClick={() =>
          changeFormAtom(oldValue => [
            ...oldValue,
            { name: 'New name', otherAttribute: 'value' },
          ])
        }
      >
        Add new todo
      </button>
    </ul>
  )
}

const Form = ({
  formAtom,
  onRemove,
}: {
  formAtom: PrimitiveAtom<{ [key: string]: string }>
  onRemove: () => void
}) => {
  const entriesAtom = React.useMemo(() => {
    return focus(formAtom, optic =>
      optic.iso((from) => Object.entries(from), to => Object.fromEntries(to)),
    )
  }, [formAtom])
  const fieldAtoms = useAtomArrayFamily(entriesAtom)
  const addField = useAtomCallback((get, set) => {
    set(entriesAtom, oldValue => [...oldValue, ['Something new', 'New too']])
  })

  return (
    <ul>
      {fieldAtoms.map(([fieldAtom, onRemove]) => <Field field={fieldAtom} onRemove={onRemove} />)}
      <li><button onClick={addField}>Add new field</button></li>
      <li><button onClick={onRemove}>Remove this form</button></li>
    </ul>
  )
}

const Field = ({field, onRemove}: {field: PrimitiveAtom<[string, string]>, onRemove: () => void}) => {
  const [[name, value], setField] = useAtom(field)

    return <li>
      <input
        type="text"
        value={name}
        onChange={e => setField((oldValue) => [e.target.value, oldValue[1]])}
      />
      <input
        type="text"
        value={value}
        onChange={e => setField((oldValue) => [oldValue[0], e.target.value])}
      />
      <button onClick={onRemove}>X</button>
    </li>
}

const App = () => {
  return (
    <Provider>
      <FormList todos={RecursiveFormAtom} />
    </Provider>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
