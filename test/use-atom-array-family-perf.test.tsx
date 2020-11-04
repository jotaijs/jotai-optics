import { atom, Provider, useAtom, PrimitiveAtom } from 'jotai'
import React from 'react'
import * as rtl from '@testing-library/react'
import { useAtomArrayFamily } from '../src/index'

type TodoItem = { task: string; checked?: boolean }

const useUpdateCount = () => {
  const count = React.useRef(0)
  React.useEffect(() => {
    count.current += 1
  })
  return count.current
}

it('no unneccesary updates when updating atoms', async () => {
  const todosAtom = atom<Array<TodoItem>>([
    { task: 'get cat food', checked: false },
    { task: 'get dragon food', checked: false },
  ])

  const TaskList = ({ atom }: { atom: typeof todosAtom }) => {
    const atoms = useAtomArrayFamily(atom)
    const updates = useUpdateCount()
    return (
      <>
        TaskListUpdates: {updates}
        {atoms.map(([atom, remove], index) => (
          <TaskItem key={index} onRemove={remove} atom={atom} />
        ))}
      </>
    )
  }

  const TaskItem = ({
    atom,
  }: {
    atom: PrimitiveAtom<TodoItem>
    onRemove: () => void
  }) => {
    const [value, onChange] = useAtom(atom)
    const toggle = () =>
      onChange(value => ({ ...value, checked: !value.checked }))
    const updates = useUpdateCount()
    return (
      <li>
        {value.task} updates: {updates}
        <input
          data-testid={`${value.task}-checkbox`}
          type="checkbox"
          checked={value.checked || false}
          onChange={toggle}
        />
      </li>
    )
  }

  const { findByTestId, findByText } = rtl.render(
    <Provider>
      <TaskList atom={todosAtom} />
    </Provider>,
  )

  await findByText('get cat food updates: 0')
  await findByText('get dragon food updates: 0')
  await findByText('TaskListUpdates: 0')

  const catBox = (await findByTestId(
    'get cat food-checkbox',
  )) as HTMLInputElement
  const dragonBox = (await findByTestId(
    'get dragon food-checkbox',
  )) as HTMLInputElement

  expect(catBox.checked).toBe(false)
  expect(dragonBox.checked).toBe(false)

  rtl.fireEvent.click(catBox)

  await findByText('get cat food updates: 1')
  await findByText('get dragon food updates: 0')
  await findByText('TaskListUpdates: 0')

  expect(catBox.checked).toBe(true)
  expect(dragonBox.checked).toBe(false)

  rtl.fireEvent.click(dragonBox)

  await findByText('get cat food updates: 1')
  await findByText('get dragon food updates: 1')
  await findByText('TaskListUpdates: 0')

  expect(catBox.checked).toBe(true)
  expect(dragonBox.checked).toBe(true)
})
