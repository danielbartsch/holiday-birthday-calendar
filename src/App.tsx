import React from 'react'
import { workDays, weekendDays, holidays, weekDays } from './config'
import { people, Person } from './people'
import { addDays, isEqual } from './date'

type Nullable<T> = T | null

const getDateWithoutTime = (datetime: Date) =>
  new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate())

const padNumber = (number: number, pad: number): string => {
  if (pad < 1) {
    return String(number)
  }
  const digits = Math.floor(Math.log10(number)) + 1
  return '0'.repeat(pad - digits) + number
}

const Day = ({ value }: { value: Date }) => (
  <>
    {weekDays[value.getDay()]}. {padNumber(value.getFullYear(), 4)}-
    {padNumber(value.getMonth() + 1, 2)}-{padNumber(value.getDate(), 2)}
  </>
)

const DayStyle = ({
  children,
  date,
  todaysHolidays,
  todaysBirthdays,
}: {
  children: React.ReactNode
  date: Date
  todaysHolidays: Array<string>
  todaysBirthdays: Array<Person>
}) => {
  let textColor = undefined
  if (todaysHolidays.length > 0) {
    textColor = '#2abb69'
  }
  if (todaysBirthdays.length > 0) {
    textColor = '#fc0'
  }

  let tooltip = todaysHolidays.slice()
  if (tooltip.length > 0 && todaysBirthdays.length > 0) {
    tooltip.push('und')
  }
  tooltip.push(
    ...todaysBirthdays.map(
      ({ name, birthday }) => `${name} (${date.getFullYear() - birthday.getFullYear()})`
    )
  )
  return (
    <code title={tooltip.join(' ')} style={textColor ? { color: textColor } : undefined}>
      {children}
    </code>
  )
}

const useEventListener = (event: string, listener: (event: any) => void) => {
  React.useEffect(() => document.addEventListener(event, listener), []) // eslint-disable-line react-hooks/exhaustive-deps
}

const useTouchDrag = (
  [stepX, stepY]: [number, number],
  listener: (xDelta: number, yDelta: number) => void
) => {
  const touchStart = React.useRef<{ x: number; y: number } | null>()

  useEventListener('touchstart', (event: TouchEvent) => {
    const { pageX: x, pageY: y } = event.touches[0]
    touchStart.current = { x, y }
  })
  useEventListener('touchmove', (event: TouchEvent) => {
    const { pageX: x, pageY: y } = event.touches[0]

    if (touchStart.current) {
      const [deltaX, deltaY] = [x - touchStart.current.x, y - touchStart.current.y]
      if (Math.abs(deltaX) >= stepX) {
        touchStart.current = { x, y: touchStart.current.y }
      }
      if (Math.abs(deltaY) >= stepY) {
        touchStart.current = { x: touchStart.current.x, y }
      }
      listener(deltaX, deltaY)
    }
  })
  useEventListener('touchend', (event: TouchEvent) => {
    touchStart.current = null
  })
}

type Event = {
  description: string
  color: string
}

type LocalStorageEvents = {
  [key: string]: Array<Event>
}

type ModalState = {
  content: React.ReactNode
  show: boolean
  position: { x: number; y: number }
}

const useModal = (
  initialState: ModalState = {
    content: null,
    show: false,
    position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  }
) => {
  const [modal, setModal] = React.useState<ModalState>(initialState)

  return {
    modal,
    open: (content: ModalState['content'], position: ModalState['position']) =>
      setModal({ content, position, show: true }),
    close: () => setModal(prev => ({ ...prev, show: false })),
  }
}

const Modal = ({ show, content, position, close }: ModalState & { close: () => void }) => {
  return show ? (
    <>
      <div className="backdrop" onClick={close} />
      <div className="modal" style={{ top: position.y, left: position.x }}>
        {content}
      </div>
    </>
  ) : null
}

const eventColors = [
  '#553333',
  '#594435',
  '#3e3b26',
  '#29443f',
  '#273944',
  '#332b4d',
  '#412b4d',
  '#40233e',
  '#462324',
]

const EventForm = ({
  initialEvent,
  onDescriptionApply,
  onColorChange,
  onDelete,
}: {
  initialEvent: Nullable<Event>
  onDescriptionApply: (description: Event['description']) => void
  onColorChange: (color: Event['color']) => void
  onDelete: () => void
}) => {
  const [description, setDescription] = React.useState(initialEvent?.description)
  const [color, setColor] = React.useState(initialEvent?.color)
  const COLS = 20
  return (
    <>
      <div className="flexEven fullWidth">
        <textarea
          autoFocus
          cols={COLS - 1}
          rows={description?.split('\n').length || 1}
          placeholder="Eventbeschreibung"
          value={description}
          onChange={event => setDescription(event.target.value)}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <svg
            onClick={() => onDescriptionApply(description ?? '')}
            style={{ position: 'relative', cursor: 'pointer' }}
            width="16"
            height="16"
            viewBox="0 0 12 12"
          >
            <path d="M2.5,6 l2,2 l5,-5" strokeWidth={2} fill="none" stroke="#5b5" />
          </svg>
          <svg
            onClick={onDelete}
            style={{ position: 'relative', cursor: 'pointer' }}
            width="16"
            height="16"
            viewBox="0 0 12 12"
          >
            <path d="M4,11 l4,0 l2,-6 l-8,0z M2,4 l8,0 l-1,-2 l-6,0z" fill="#f55" />
          </svg>
        </div>
      </div>
      <div className="flexEven fullWidth" style={{ marginTop: 8 }}>
        {eventColors.map(currentColor => (
          <div
            key={currentColor}
            onClick={() => {
              setColor(currentColor)
              onColorChange(currentColor)
            }}
            className="colorSwatch"
            style={{
              borderColor: currentColor === color ? '#999' : '#484848',
              backgroundColor: currentColor,
            }}
          />
        ))}
      </div>
    </>
  )
}

const App = () => {
  const [startDay, setStartDay] = React.useState(getDateWithoutTime(new Date()))
  const [shownDays, setDays] = React.useState(30)
  const [eventMap, setEvents] = React.useState<LocalStorageEvents>(() =>
    JSON.parse(localStorage.getItem('events') ?? '{}')
  )
  const { modal, open, close } = useModal()

  const handleSetEvents = (newEvents: LocalStorageEvents) => {
    setEvents(newEvents)
    localStorage.setItem('events', JSON.stringify(newEvents))
  }

  useEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close()
    }
  })

  useEventListener('wheel', (event: WheelEvent) => {
    if (event.deltaY !== 0) {
      setStartDay(previousStartDay => addDays(previousStartDay, event.deltaY))
    }
    if (event.deltaX !== 0) {
      setDays(prevDays => {
        if (prevDays + event.deltaX < 1) {
          return 1
        }
        if (prevDays + event.deltaX > 100) {
          return 100
        }
        return prevDays + event.deltaX
      })
    }
  })
  useTouchDrag([30, 30], (x, y) => {
    if (Math.abs(x) > 0) {
      setDays(prevDays => {
        const deltaXSteps = Math.round(-x / 30)
        if (prevDays + deltaXSteps < 1) {
          return 1
        }
        if (prevDays + deltaXSteps > 100) {
          return 100
        }
        return prevDays + deltaXSteps
      })
    }
    if (Math.abs(y) > 30) {
      setStartDay(previousStartDay => addDays(previousStartDay, Math.round(-y / 30)))
    }
  })

  return (
    <>
      <table className="fullWidth">
        <thead>
          <tr>
            <th style={{ width: 150 }}>Datum</th>
            <th style={{ width: 150 }}>Feiertag</th>
            <th>Geburtstag</th>
            <th style={{ width: 20 }}>Werktag</th>
            <th style={{ width: 20 }}>Wochenende</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: shownDays }).map((_, index) => {
            const date = addDays(startDay, index)

            const todaysHolidays = holidays
              .filter(([, isHoliday]) => isHoliday(date))
              .map(([name]) => name)

            const todaysBirthdays = people.filter(
              ({ birthday, deathDay }) =>
                birthday.getMonth() === date.getMonth() &&
                birthday.getDate() === date.getDate() &&
                birthday.getFullYear() <= date.getFullYear() &&
                (!deathDay || deathDay.getTime() > date.getTime())
            )

            const todaysDeaths = people.filter(
              ({ deathDay }) =>
                deathDay &&
                deathDay.getMonth() === date.getMonth() &&
                deathDay.getDate() === date.getDate() &&
                deathDay.getFullYear() <= date.getFullYear()
            )

            const isWorkday = workDays.includes(date.getDay())
            const isWeekend = weekendDays.includes(date.getDay())

            const eventKey = date.toString()

            const events = eventMap[eventKey] ?? []
            const backgroundColor = isEqual(date, new Date()) ? '#343' : undefined

            const handleEditEvent = (
              event: Nullable<Event>,
              eventIndex: number,
              { clientX, clientY }: React.MouseEvent
            ) => {
              const modalDimensions = { x: 180, y: 50 }
              open(
                <EventForm
                  key={eventKey}
                  initialEvent={event}
                  onDescriptionApply={newDescription => {
                    if (newDescription) {
                      const updatedEvents = {
                        ...eventMap,
                        [eventKey]: [
                          ...events.slice(0, eventIndex),
                          {
                            description: newDescription,
                            color:
                              event?.color ??
                              eventColors[parseInt('' + Math.random() * eventColors.length)],
                          },
                          ...events.slice(eventIndex + 1),
                        ],
                      }
                      handleSetEvents(updatedEvents)
                      close()
                    }
                  }}
                  onColorChange={newColor => {
                    const updatedEvents = {
                      ...eventMap,
                      [eventKey]: [
                        ...events.slice(0, eventIndex),
                        {
                          description: event?.description ?? '',
                          color: newColor,
                        },
                        ...events.slice(eventIndex + 1),
                      ],
                    }
                    handleSetEvents(updatedEvents)
                  }}
                  onDelete={() => {
                    const updatedEvents = {
                      ...eventMap,
                      [eventKey]: [...events.slice(0, eventIndex), ...events.slice(eventIndex + 1)],
                    }
                    console.log(eventIndex, events, updatedEvents[eventKey])

                    handleSetEvents(updatedEvents)
                    close()
                  }}
                />,
                { x: clientX - modalDimensions.x / 2, y: clientY - modalDimensions.y / 2 }
              )
            }

            return (
              <tr key={`${date}`} style={backgroundColor ? { backgroundColor } : undefined}>
                <td className="date">
                  <DayStyle
                    date={date}
                    todaysHolidays={todaysHolidays}
                    todaysBirthdays={todaysBirthdays}
                  >
                    <Day value={date} />
                  </DayStyle>
                </td>
                <td
                  onClick={onClickEvent => {
                    handleEditEvent(null, events.length, onClickEvent)
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  {events.map((event, index) => (
                    <div
                      key={index}
                      title={event.description}
                      style={{
                        backgroundColor: event.color,
                        width: 10,
                        height: 10,
                        position: 'relative',
                        border: '1px solid #888',
                      }}
                      onClick={onClickEvent => {
                        onClickEvent.preventDefault()
                        onClickEvent.stopPropagation()
                        handleEditEvent(event, index, onClickEvent)
                      }}
                    />
                  ))}
                  &nbsp;
                  {todaysHolidays.length > 0 ? todaysHolidays.join(', ') : undefined}
                </td>
                <td>
                  {todaysBirthdays.length > 0
                    ? todaysBirthdays
                        .map(
                          ({ name, birthday }) =>
                            `${name} (${date.getFullYear() - birthday.getFullYear()})`
                        )
                        .join(', ')
                    : undefined}
                  {todaysDeaths.length > 0
                    ? (todaysBirthdays.length > 0 ? ', ' : '') +
                      todaysDeaths
                        .map(({ name, deathDay }) => {
                          const deathYearsAgo = date.getFullYear() - (deathDay?.getFullYear() ?? 0)
                          return `${name} (†${deathYearsAgo === 0 ? '' : ' ' + deathYearsAgo})`
                        })
                        .join(', ')
                    : undefined}
                </td>
                <td>{isWorkday && todaysHolidays.length === 0 ? 'o' : undefined}</td>
                <td>{isWeekend ? 'o' : undefined}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <Modal {...modal} close={close} />
    </>
  )
}

export default App
