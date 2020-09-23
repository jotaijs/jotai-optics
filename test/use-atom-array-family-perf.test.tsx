import { atom, Provider, useAtom } from 'jotai'
import React from 'react'
import * as rtl from '@testing-library/react'
import { RWAtom, useAtomArrayFamily } from '../src/index'

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
    { task: 'get cat food' },
    { task: 'get dragon food' },
  ])

  const TaskList = () => {
    const atoms = useAtomArrayFamily(todosAtom)
    return (
      <>
        {atoms.map((atom, index) => (
          <TaskItem key={index} atom={atom} />
        ))}
      </>
    )
  }

  const TaskItem = React.memo(({ atom }: { atom: RWAtom<TodoItem> }) => {
    const [value, onChange] = useAtom(atom)
    const toggle = () =>
      onChange(value => ({ ...value, checked: !value.checked }))
    const updates = useUpdateCount()
    return (
      <li>
        {value.task} {updates}
        <input
          data-testid={`${value.task}-checkbox`}
          type="checkbox"
          checked={value.checked || false}
          onChange={toggle}
        />
      </li>
    )
  })

  const { findByTestId, findByText } = rtl.render(
    <Provider>
      <TaskList />
    </Provider>,
  )

  await findByText('get cat food 0')
  await findByText('get dragon food 0')

  const catBox = (await findByTestId(
    'get cat food-checkbox',
  )) as HTMLInputElement
  const dragonBox = (await findByTestId(
    'get dragon food-checkbox',
  )) as HTMLInputElement

  expect(catBox.checked).toBe(false)
  expect(dragonBox.checked).toBe(false)

  rtl.fireEvent.click(catBox)

  await findByText('get cat food 1')
  await findByText('get dragon food 0')

  expect(catBox.checked).toBe(true)
  expect(dragonBox.checked).toBe(false)

  rtl.fireEvent.click(dragonBox)

  await findByText('get cat food 1')
  await findByText('get dragon food 1')

  expect(catBox.checked).toBe(true)
  expect(dragonBox.checked).toBe(true)
})