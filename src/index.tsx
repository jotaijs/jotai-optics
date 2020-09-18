import * as jotai from 'jotai'
import { NonPromise, SetStateAction, NonFunction } from 'jotai/types'
import * as O from 'optics-ts'

export function focus<S, A>(
  atom: jotai.WritableAtom<S, SetStateAction<S>>,
  callback: (
    optic: O.OpticFor<S>,
  ) => O.Lens<S, any, A> | O.Equivalence<S, any, A> | O.Iso<S, any, A>,
): jotai.WritableAtom<A, SetStateAction<A>> {
  const focus = callback(O.optic<S>())
  return jotai.atom(
    atomGetter => {
      const value = O.get(focus)(
        atomGetter(atom),
        // How do i remove this typecast?
      ) as NonPromise<A>
      return value
    },
    (_, set, update) => {
      set(atom, param => {
        const currentValue = O.get(focus)(param)
        const updatedValue =
          update instanceof Function ? update(currentValue) : update
        const updatedSuperValue = O.set(focus)(updatedValue)(
          param,
          // This typecast is bad too
        ) as NonFunction<S>
        return updatedSuperValue
      })
    },
  )
}
