import { addDays, getEasterDate, isEqual } from './date'

export const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

export const workDays = [1, 2, 3, 4, 5]
export const weekendDays = [6, 0]

export const holidays: Array<[string, (date: Date) => boolean]> = [
  /* austrian holidays */
  ['Neujahr', date => date.getMonth() === 0 && date.getDate() === 1],
  ['Heilige Drei Könige', date => date.getMonth() === 0 && date.getDate() === 6],
  ['Ostersonntag', date => isEqual(getEasterDate(date), date)],
  ['Ostermontag', date => isEqual(addDays(getEasterDate(date), 1), date)],
  ['Staatsfeiertag', date => date.getMonth() === 4 && date.getDate() === 1],
  ['Christi Himmelfahrt', date => isEqual(addDays(getEasterDate(date), 39), date)],
  ['Pfingstsonntag', date => isEqual(addDays(getEasterDate(date), 49), date)],
  ['Pfingstmontag', date => isEqual(addDays(getEasterDate(date), 50), date)],
  ['Fronleichnam', date => isEqual(addDays(getEasterDate(date), 60), date)],
  ['Mariä Himmelfahrt', date => date.getMonth() === 7 && date.getDate() === 15],
  ['Nationalfeiertag', date => date.getMonth() === 9 && date.getDate() === 26],
  ['Allerheiligen', date => date.getMonth() === 10 && date.getDate() === 1],
  ['Mariä Empfängnis', date => date.getMonth() === 11 && date.getDate() === 8],
  ['Heiliger Abend', date => date.getMonth() === 11 && date.getDate() === 24],
  ['Christtag', date => date.getMonth() === 11 && date.getDate() === 25],
  ['Stefanitag', date => date.getMonth() === 11 && date.getDate() === 26],
  ['Silvester', date => date.getMonth() === 11 && date.getDate() === 31],
]

type Who = string

export type Person = {
  name: string
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
