import * as jotai from 'jotai'
import { NonPromise, SetStateAction, NonFunction } from 'jotai/types'
import * as O from 'optics-ts'

export function focus<S, A>(
  atom: jotai.WritableAtom<S, SetStateAction<S>>,
  callback: (optic: O.OpticFor<S>) => O.Prism<S, any, A>,
): jotai.WritableAtom<A | undefined, SetStateAction<A>>

export function focus<S, A>(
  atom: jotai.WritableAtom<S, SetStateAction<S>>,
  callback: (optic: O.OpticFor<S>) => O.Traversal<S, any, A>,
): jotai.WritableAtom<Array<A>, SetStateAction<A>>

export function focus<S, A>(
  atom: jotai.WritableAtom<S, SetStateAction<S>>,
  callback: (
    optic: O.OpticFor<S>,
  ) => O.Lens<S, any, A> | O.Equivalence<S, any, A> | O.Iso<S, any, A>,
): jotai.WritableAtom<A, SetStateAction<A>>

export function focus<S, A>(
  atom: jotai.WritableAtom<S, SetStateAction<S>>,
  callback: (
    optic: O.OpticFor<S>,
  ) =>
    | O.Lens<S, any, A>
    | O.Equivalence<S, any, A>
    | O.Iso<S, any, A>
    | O.Prism<S, any, A>
    | O.Traversal<S, any, A>,
): any {
  const focus = callback(O.optic<S>())
  return jotai.atom(
    atomGetter => {
      if (focus._tag === 'Traversal') {
        const values = O.collect(focus)(atomGetter(atom)) as NonPromise<A[]>
        return values
      } else if (focus._tag === 'Prism') {
        const value = O.preview(focus)(atomGetter(atom)) as
          | NonPromise<A>
          | undefined
        return value as any
      } else {
        const value = O.get(focus)(
          atomGetter(atom),
          // How do i remove this typecast?
        ) as NonPromise<A>
        return value
      }
    },
    (_, set, update) => {
      set(atom, param => {
        if (typeof update === 'function') {
          const typeCastedUpdater = update as (param: A) => A
          return O.modify(focus)(typeCastedUpdater)(param) as NonFunction<S>
        } else {
          return O.set(focus)(update)(param) as NonFunction<S>
        }
      })
    },
  )
}
