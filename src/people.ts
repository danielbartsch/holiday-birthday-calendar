type Who = string

export type Person = {
  name: Who
  parents: [Who, Who]
  birthday: Date
  deathDay?: Date
}

export const people: Array<Person> = [
  { name: 'Daniel Bartsch', birthday: new Date(1996, 0, 9), parents: ['unknown', 'unknown'] },
  {
    name: 'Wolfgang Amadeus Mozart',
    birthday: new Date(1756, 0, 27),
    deathDay: new Date(1791, 11, 5),
    parents: ['Anna Maria Mozart', 'Leopold Mozart'],
  },
]
