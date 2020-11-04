import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { atom, PrimitiveAtom, Provider, useAtom } from 'jotai'
import { focus, useAtomArrayFamily } from '../src/index'
import { useAtomCallback, useSelector, useUpdateAtom } from 'jotai/utils'


const OriginalAtom = atom<Record<string, Record<string, string>>>(
  {
    form1: { task: 'Eat some food', checked: 'yeah' },
  form2: { task: 'Eat some food', checked: 'yeah' }
},
)

const RecursiveFormAtom: typeof OriginalAtom = atom(get => get(OriginalAtom), (get, set,param)=> {
  set(OriginalAtom, param)
})

const FormList = ({ todos }: { todos: typeof RecursiveFormAtom }) => {
  const entriesAtom = React.useMemo(() => {
    return focus(todos, optic =>
      optic.iso((from) => Object.entries(from), to => Object.fromEntries(to)),
    )
  }, [todos])
  const atoms = useAtomArrayFamily(entriesAtom) as Array<[PrimitiveAtom<[string, Record<string, string>]>, () => void]>
  const changeFormAtom = useUpdateAtom(todos)
  const formNames = useSelector(entriesAtom, React.useCallback(value => value.map(v => v[0]),[]))
  return (
    <ul>
      {atoms.map(([atom, onRemove], i) => (
        <div key={i}>
          <Form formAtom={atom} onRemove={onRemove} />
        </div>
      ))}
      <button
        onClick={() =>
          changeFormAtom(oldValue => ({
            ...oldValue,
            [`newForm ${Math.random()}`]: { name: 'New name', otherAttribute: 'value' },
          }))
        }
      >
        Add another form
      </button>
      {formNames.map(value => <div>{value}</div>)}
    </ul>
  )
}

const Form = ({
  formAtom,
  onRemove,
}: {
  formAtom: PrimitiveAtom<[string, Record<string, string>]>
  onRemove: () => void
}) => {
  const entriesAtom = React.useMemo(() => {
    return focus(formAtom, optic =>
      optic.index(1).iso((from) => Object.entries(from), to => Object.fromEntries(to)),
    )
  }, [formAtom]) as PrimitiveAtom<[string, string][]>
  const fieldAtoms = useAtomArrayFamily(entriesAtom) as Array<[PrimitiveAtom<[string, string]>, () => void]>
  const addField = useAtomCallback(React.useCallback((get, set) => {
    set(entriesAtom, oldValue => [...oldValue, ['Something new' + Math.random(), 'New too']])
  }, []))
  const [fieldName, setFieldName] = useAtom(React.useMemo(() => focus(formAtom, optic => optic.index(0)) as PrimitiveAtom<string>, []))

  return (
    <div>
      <h1><input value={fieldName} onChange={(event) => setFieldName(event.target.value)} /></h1>
      <ul>{fieldAtoms.map(([fieldAtom, onRemove], index) => <Field key={index} field={fieldAtom} onRemove={onRemove} />)}</ul>
      <div><button style={{width: '100%'}} onClick={addField}>Add new field</button></div>
      <div><button onClick={onRemove}>Remove this form</button></div>
    </div>
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
