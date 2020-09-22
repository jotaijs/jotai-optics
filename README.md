# jotai-optics

## Background
It's easy to "combine" two atoms, but how do we split an atom?

The answer is *optics*.

This is based on this issue:
https://github.com/pmndrs/jotai/issues/44

We've got Prisms, Lenses, Isos, Traversals and of course Equivalences.

## Usage
```
import { atom  } from 'jotai'
import { focus } from 'jotai-optics'

const bigAtom = atom({ a: 0, b: 5 })
const focusAAtom = focus(bigAtom, (optic) => optic.prop('a'))
const focusBAtom = focus(bigAtom, (optic) => optic.prop('b'))
```

## useAtomArrayFamily

For when you have something of type `Atom<Array<TodoItem>>` but you would like to have `Array<Atom<TodoItem>>`, so for example, say that your `TaskItem` component looks like this:

```typescript
const TaskItem = ({ atom }: { atom: RWAtom<TodoItem> }) => {
  const [value, onChange] = useAtom(atom)
  const toggle = () => {
    onChange(value => {
      return { ...value, checked: !value.checked }
    })
  }
  return (
    <li data-testid={value.task}>
      {value.task}
      <input
        data-testid={`${value.task}-checkbox`}
        type="checkbox"
        checked={value.checked || false}
        onChange={toggle}
      />
    </li>
  )
}
```

but the parent, `TaskList` only has an `Atom<Array<TodoItem>>` in it, that's when `useAtomArrayFamily` is useful:


```typescript
const TaskList = ({ todoItems }: { todoItems: RWAtom<Array<TodoItem>> }) => {
  const atoms = useAtomArrayFamily(todoItems)
  return (
    <>
      {atoms.map((todoItem, index) => (
        <TaskItem key={index} atom={todoItem} />
      ))}
    </>
  )
}
```
