import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { atom, PrimitiveAtom, Provider, useAtom } from 'jotai'
import { useFocus, useAtomArraySlice } from '../src/index'
import { useAtomCallback, useUpdateAtom } from 'jotai/utils'

const OriginalAtom = atom<Record<string, Record<string, string>>>(
  {
    form1: { task: 'Eat some food', checked: 'yeah' },
    form2: { task: 'Eat some food', checked: 'yeah' },
    form3: { task: 'Eat some food', checked: 'yeah' },
    form4: { task: 'Eat some food', checked: 'yeah' },
    form5: { task: 'Eat some food', checked: 'yeah' },
    form6: { task: 'Eat some food', checked: 'yeah' },
    form7: { task: 'Eat some food', checked: 'yeah' },
    form8: { task: 'Eat some food', checked: 'yeah' },
    form12: { task: 'Eat some food', checked: 'yeah' },
    form22: { task: 'Eat some food', checked: 'yeah' },
    form32: { task: 'Eat some food', checked: 'yeah' },
    form42: { task: 'Eat some food', checked: 'yeah' },
    form52: { task: 'Eat some food', checked: 'yeah' },
    form62: { task: 'Eat some food', checked: 'yeah' },
    form72: { task: 'Eat some food', checked: 'yeah' },
    form82: { task: 'Eat some food', checked: 'yeah' },
    form14: { task: 'Eat some food', checked: 'yeah' },
    form24: { task: 'Eat some food', checked: 'yeah' },
    form34: { task: 'Eat some food', checked: 'yeah' },
    form44: { task: 'Eat some food', checked: 'yeah' },
    form54: { task: 'Eat some food', checked: 'yeah' },
    form64: { task: 'Eat some food', checked: 'yeah' },
    form74: { task: 'Eat some food', checked: 'yeah' },
    form84: { task: 'Eat some food', checked: 'yeah' },
    form15: { task: 'Eat some food', checked: 'yeah' },
    form25: { task: 'Eat some food', checked: 'yeah' },
    form35: { task: 'Eat some food', checked: 'yeah' },
    form45: { task: 'Eat some food', checked: 'yeah' },
    form55: { task: 'Eat some food', checked: 'yeah' },
    form65: { task: 'Eat some food', checked: 'yeah' },
    form75: { task: 'Eat some food', checked: 'yeah' },
    form85: { task: 'Eat some food', checked: 'yeah' },
  },
)

const RecursiveFormAtom: typeof OriginalAtom = atom(get => get(OriginalAtom), (get, set,param)=> {
  set(OriginalAtom, param)
})

const FormList = ({ todos }: { todos: typeof RecursiveFormAtom }) => {
  const entriesAtom = useFocus(todos, optic =>
      optic.iso((from) => Object.entries(from), to => Object.fromEntries(to)
  ))
  const atoms = useAtomArraySlice(entriesAtom) as Array<[PrimitiveAtom<[string, Record<string, string>]>, () => void]>
  const changeFormAtom = useUpdateAtom(todos)
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
  const entriesAtom = useFocus(formAtom, optic =>
      optic.index(1).iso((from) => Object.entries(from), to => Object.fromEntries(to)),
    ) as PrimitiveAtom<[string, string][]>
  const fieldAtoms = useAtomArraySlice(entriesAtom) as Array<[PrimitiveAtom<[string, string]>, () => void]>
  const addField = useAtomCallback((get, set) => {
    set(entriesAtom, oldValue => [...oldValue, ['Something new' + Math.random(), 'New too']])
  })
  const [fieldName, setFieldName] = useAtom(useFocus(formAtom, optic => optic.index(0)) as PrimitiveAtom<string>)

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
