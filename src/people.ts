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

const padNumber = (number: number): string => (number < 10 ? '0' + number : String(number))

const sortMonthThenDay = (a: Person, b: Person) =>
  a.birthday.getMonth() * 100 +
  a.birthday.getDate() -
  (b.birthday.getMonth() * 100 + b.birthday.getDate())

const separator = ','

console.log(
  [['name', 'birthday'].join(separator)]
    .concat(
      people
        .filter(({ deathDay }) => !deathDay)
        .sort(sortMonthThenDay)
        .map(({ name, birthday }) =>
          [
            name,
            [
              padNumber(birthday.getDate()),
              padNumber(birthday.getMonth() + 1),
              birthday.getFullYear(),
            ].join('.'),
          ].join(separator)
        )
    )
    .join('\n')
)
