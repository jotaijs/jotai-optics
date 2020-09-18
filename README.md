# jotai-optics

## Background
It's easy to "combine" two atoms, but how do we split an atom?

The answer is *optics*.

This is based on this issue:
https://github.com/pmndrs/jotai/issues/44

We've got Prisms, Lenses, Isos and of course Equivalences.

## Usage
```
import { atom  } from 'jotai'
import { focus } from 'jotai-optics'

const bigAtom = atom({ a: 0, b: 5 })
const focusAAtom = focus(bigAtom, (optic) => optic.prop('a'))
const focusBAtom = focus(bigAtom, (optic) => optic.prop('b'))
```
