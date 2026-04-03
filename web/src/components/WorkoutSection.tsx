import { useEffect } from 'react'
import { SectionCard } from './ui/SectionCard'
import { ChipRow } from './ui/ChipRow'
import { Stepper } from './ui/Stepper'
import { WORKOUT_TYPES } from '../constants/reference'
import {
  CARDIO_RUN_NAME,
  exercisesForWorkoutType,
  isBodyweightExerciseName,
} from '../constants/exercises'
import type { LogRecord } from '../types/log'
import {
  newExercise,
  newRunExercise,
  parseWorkoutLogJson,
  stringifyWorkoutLog,
} from '../lib/workoutJson'

type Props = {
  log: LogRecord
  onField: <K extends keyof LogRecord>(
    field: K,
    value: LogRecord[K],
  ) => void | Promise<void>
}

export function WorkoutSection({ log, onField }: Props) {
  const data = parseWorkoutLogJson(log.workout_log_json)
  const workoutType = log.workout_type
  const library = exercisesForWorkoutType(workoutType)
  const allowedNames = new Set(library.map((e) => e.name))

  const setWorkoutJson = (next: ReturnType<typeof parseWorkoutLogJson>) => {
    void onField('workout_log_json', stringifyWorkoutLog(next))
  }

  const changeWorkoutType = async (
    v: (typeof WORKOUT_TYPES)[number] | '',
  ) => {
    const dataNow = parseWorkoutLogJson(log.workout_log_json)
    let nextExercises = dataNow.exercises
    if (!v || v === 'Rest') {
      nextExercises = []
    } else if (v === 'Cardio') {
      const existingRun = dataNow.exercises.find(
        (e) => e.name === CARDIO_RUN_NAME,
      )
      nextExercises = [
        existingRun
          ? {
              ...existingRun,
              name: CARDIO_RUN_NAME,
              sets: [],
              runDistanceKm: existingRun.runDistanceKm,
              runDurationMin: existingRun.runDurationMin,
            }
          : newRunExercise(),
      ]
    } else {
      const names = new Set(exercisesForWorkoutType(v).map((e) => e.name))
      if (names.size > 0) {
        nextExercises = dataNow.exercises.filter((ex) => names.has(ex.name))
      }
    }
    await onField('workout_type', v)
    await onField(
      'workout_log_json',
      stringifyWorkoutLog({ exercises: nextExercises }),
    )
  }

  const canAddExercises =
    library.length > 0 && workoutType !== 'Cardio'

  useEffect(() => {
    if (workoutType !== 'Cardio') return
    const d = parseWorkoutLogJson(log.workout_log_json)
    if (d.exercises.some((e) => e.name === CARDIO_RUN_NAME)) return
    setWorkoutJson({ exercises: [newRunExercise()] })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync JSON when Cardio has no Run row
  }, [workoutType, log.workout_log_json])

  const runExercise = data.exercises.find((e) => e.name === CARDIO_RUN_NAME)

  return (
    <SectionCard title="Workout">
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs text-slate-500">Workout type</p>
          <ChipRow
            options={[...WORKOUT_TYPES]}
            value={workoutType as (typeof WORKOUT_TYPES)[number] | ''}
            onChange={(v) => void changeWorkoutType(v)}
          />
        </div>
        <div>
          <button
            type="button"
            role="switch"
            aria-checked={log.warmup_done}
            onClick={() => void onField('warmup_done', !log.warmup_done)}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${
              log.warmup_done
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
            }`}
          >
            Warm-up done
          </button>
          <p className="mt-1 text-xs text-slate-600">
            Warm-up is yes/no only — no duration.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={log.workout_done}
          onClick={() => void onField('workout_done', !log.workout_done)}
          className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${
            log.workout_done
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-800 text-slate-200 ring-1 ring-slate-700'
          }`}
        >
          Workout done
        </button>
        {log.workout_done ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs text-slate-500">Exercises</p>
            {canAddExercises ? (
              <button
                type="button"
                className="text-sm font-medium text-sky-400"
                onClick={() => {
                  const first = library[0]?.name ?? ''
                  const ex = newExercise()
                  ex.name = first
                  setWorkoutJson({
                    exercises: [...data.exercises, ex],
                  })
                }}
              >
                + Add exercise
              </button>
            ) : null}
          </div>
          {!workoutType ? (
            <p className="text-sm text-slate-500">
              Choose a workout type to see exercises.
            </p>
          ) : null}
          {workoutType === 'Rest' ? (
            <p className="text-sm text-slate-500">Rest day — no exercises.</p>
          ) : null}
          {workoutType === 'Cardio' ? (
            <div className="rounded-xl bg-slate-950/80 p-3 ring-1 ring-slate-800">
              <p className="mb-1 text-xs font-medium text-slate-500">Run</p>
              <p className="mb-3 text-sm text-slate-400">
                Log distance and time for your run.
              </p>
              {runExercise ? (
                <div className="space-y-3">
                  <Stepper
                    label="Distance (km)"
                    value={runExercise.runDistanceKm ?? ''}
                    max={200}
                    step={0.1}
                    onChange={(n) => {
                      const next = structuredClone(data)
                      const ri = next.exercises.findIndex(
                        (e) => e.name === CARDIO_RUN_NAME,
                      )
                      if (ri < 0) return
                      next.exercises[ri].runDistanceKm =
                        n === '' ? undefined : n
                      setWorkoutJson(next)
                    }}
                  />
                  <Stepper
                    label="Time (min)"
                    value={runExercise.runDurationMin ?? ''}
                    max={600}
                    onChange={(n) => {
                      const next = structuredClone(data)
                      const ri = next.exercises.findIndex(
                        (e) => e.name === CARDIO_RUN_NAME,
                      )
                      if (ri < 0) return
                      next.exercises[ri].runDurationMin =
                        n === '' ? undefined : n
                      setWorkoutJson(next)
                    }}
                  />
                </div>
              ) : (
                <p className="text-sm text-slate-500">Loading…</p>
              )}
            </div>
          ) : null}
          {workoutType &&
          workoutType !== 'Rest' &&
          workoutType !== 'Cardio' &&
          library.length === 0 ? (
            <p className="text-sm text-slate-500">
              No library exercises for this type.
            </p>
          ) : null}
          {workoutType !== 'Cardio' ? (
            <div className="space-y-3">
              {data.exercises.map((ex, ei) => (
                <div
                  key={ex.id}
                  className="rounded-xl bg-slate-950/80 p-3 ring-1 ring-slate-800"
                >
                  <label className="mb-2 block text-xs text-slate-500">
                    Exercise
                  </label>
                  <select
                    value={allowedNames.has(ex.name) ? ex.name : ''}
                    onChange={(e) => {
                      const next = structuredClone(data)
                      const name = e.target.value
                      next.exercises[ei].name = name
                      if (isBodyweightExerciseName(name)) {
                        next.exercises[ei].sets = next.exercises[ei].sets.map(
                          (s) => ({ ...s, weight: '' }),
                        )
                      }
                      setWorkoutJson(next)
                    }}
                    className="mb-3 w-full rounded-lg bg-slate-900 px-2 py-3 text-sm ring-1 ring-slate-700"
                  >
                    <option value="">Select…</option>
                    {library.map((opt) => (
                      <option key={opt.name} value={opt.name}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                  {isBodyweightExerciseName(ex.name) ? (
                    <p className="mb-2 text-xs text-slate-600">
                      Bodyweight — no weight.
                    </p>
                  ) : null}
                  <div className="space-y-2">
                    {ex.sets.map((set, si) => (
                      <div
                        key={`${ex.id}-set-${si}`}
                        className="flex flex-col gap-2"
                      >
                        <div className="w-full">
                          <Stepper
                            label="Reps"
                            value={set.reps}
                            max={200}
                            onChange={(n) => {
                              const next = structuredClone(data)
                              next.exercises[ei].sets[si].reps = n
                              setWorkoutJson(next)
                            }}
                          />
                        </div>
                        {!isBodyweightExerciseName(ex.name) ? (
                          <div className="w-full">
                            <Stepper
                              label="Weight"
                              value={set.weight}
                              max={500}
                              onChange={(n) => {
                                const next = structuredClone(data)
                                next.exercises[ei].sets[si].weight = n
                                setWorkoutJson(next)
                              }}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      className="text-sm text-sky-400"
                      onClick={() => {
                        const next = structuredClone(data)
                        next.exercises[ei].sets.push({
                          reps: 12,
                          weight: isBodyweightExerciseName(ex.name)
                            ? ''
                            : 10,
                        })
                        setWorkoutJson(next)
                      }}
                    >
                      + Set
                    </button>
                    <button
                      type="button"
                      aria-label={
                        ex.name
                          ? `Remove ${ex.name}`
                          : 'Remove exercise'
                      }
                      className="text-sm font-medium text-rose-400/90"
                      onClick={() => {
                        setWorkoutJson({
                          exercises: data.exercises.filter((_, i) => i !== ei),
                        })
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        ) : (
          <p className="text-sm text-slate-500">
            Turn on Workout done to log exercises, sets, and run details.
          </p>
        )}
      </div>
    </SectionCard>
  )
}
