import React from 'react'
import { workDays, weekendDays, holidays, weekDays, birthdays } from './config'
import { addDays, isEqual } from './date'

const getDateWithoutTime = (datetime: Date) =>
  new Date(datetime.getFullYear(), datetime.getMonth(), datetime.getDate())

const padNumber = (number: number, pad: number, zeros: boolean = true): string => {
  if (pad < 1) {
    return String(number)
  }
  const digits = Math.floor(Math.log10(number)) + 1
  return `${Array.from({ length: pad - digits })
    .map(() => (zeros ? '0' : ' '))
    .join('')}${number}`
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
  todaysBirthdays: Array<[string, Date] | [string, Date, Date]>
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
      ([name, birthday]) => `${name} (${date.getFullYear() - birthday.getFullYear()})`
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
  [key: string]: Event
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
  initialEvent: Event
  onDescriptionApply: (description: Event['description']) => void
  onColorChange: (color: Event['color']) => void
  onDelete: () => void
}) => {
  const [description, setDescription] = React.useState(initialEvent.description)
  const [color, setColor] = React.useState(initialEvent.color)

  return (
    <>
      <div className="flexEven fullWidth">
        <input
          autoFocus
          type="text"
          className="fullWidth"
          placeholder="Eventbeschreibung"
          value={description}
          onChange={event => setDescription(event.target.value)}
          onKeyPress={event => {
            if (event.key === 'Enter') {
              onDescriptionApply(description)
            }
          }}
        />
        <svg
          onClick={onDelete}
          style={{ position: 'relative' }}
          width="16"
          height="16"
          viewBox="0 0 12 12"
        >
          <path d="M4,11 l4,0 l2,-6 l-8,0z M2,4 l8,0 l-1,-2 l-6,0z" fill="#f55" />
        </svg>
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
  const [events, setEvents] = React.useState<LocalStorageEvents>(() =>
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

            const todaysBirthdays = birthdays.filter(
              ([, birthday, deathDay]) =>
                birthday.getMonth() === date.getMonth() &&
                birthday.getDate() === date.getDate() &&
                birthday.getFullYear() <= date.getFullYear() &&
                (!deathDay || deathDay.getTime() > date.getTime())
            )

            const todaysDeaths = birthdays.filter(
              ([, , deathDay]) =>
                deathDay &&
                deathDay.getMonth() === date.getMonth() &&
                deathDay.getDate() === date.getDate() &&
                deathDay.getFullYear() <= date.getFullYear()
            ) as Array<[string, Date, Date]>

            const isWorkday = workDays.includes(date.getDay())
            const isWeekend = weekendDays.includes(date.getDay())

            const eventKey = date.toString()

            const event = events[eventKey] ?? {}
            const backgroundColor = isEqual(date, new Date())
              ? '#343'
              : event
              ? event.color
              : undefined

            return (
              <tr
                key={`${date}`}
                style={backgroundColor ? { backgroundColor } : undefined}
                onClick={({ clientX, clientY }) => {
                  const modalDimensions = { x: 180, y: 50 }
                  open(
                    <EventForm
                      key={eventKey}
                      initialEvent={event}
                      onDescriptionApply={newDescription => {
                        if (newDescription) {
                          const updatedEvents = {
                            ...events,
                            [eventKey]: {
                              description: newDescription,
                              color:
                                event.color ??
                                eventColors[parseInt('' + Math.random() * eventColors.length)],
                            },
                          }
                          handleSetEvents(updatedEvents)
                        }
                        close()
                      }}
                      onColorChange={newColor => {
                        const updatedEvents = {
                          ...events,
                          [eventKey]: {
                            description: event.description,
                            color: newColor,
                          },
                        }
                        handleSetEvents(updatedEvents)
                      }}
                      onDelete={() => {
                        const { [eventKey]: ignored, ...currentDateOmittedEvents } = events
                        handleSetEvents(currentDateOmittedEvents)
                        close()
                      }}
                    />,
                    { x: clientX - modalDimensions.x / 2, y: clientY - modalDimensions.y / 2 }
                  )
                }}
                title={event.description}
              >
                <td className="date">
                  <DayStyle
                    date={date}
                    todaysHolidays={todaysHolidays}
                    todaysBirthdays={todaysBirthdays}
                  >
                    <Day value={date} />
                  </DayStyle>
                </td>
                <td>{todaysHolidays.length > 0 ? todaysHolidays.join(', ') : undefined}</td>
                <td>
                  {todaysBirthdays.length > 0
                    ? todaysBirthdays
                        .map(
                          ([name, birthday]) =>
                            `${name} (${date.getFullYear() - birthday.getFullYear()})`
                        )
                        .join(', ')
                    : undefined}
                  {todaysDeaths.length > 0
                    ? (todaysBirthdays.length > 0 ? ', ' : '') +
                      todaysDeaths
                        .map(([name, , deathDay]) => {
                          const deathYearsAgo = date.getFullYear() - deathDay.getFullYear()
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
