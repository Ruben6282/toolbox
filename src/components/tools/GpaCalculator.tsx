import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SafeNumberInput } from "@/components/ui/safe-number-input"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RotateCcw, Plus, Trash2, AlertCircle } from "lucide-react"
import { safeNumber } from "@/lib/safe-number"
import { safeCalc } from "@/lib/safe-math"
import { validateRange } from "@/lib/validators"
import { notify } from "@/lib/notify"

/* LIMITS */
const MAX_COURSES = 100
const MAX_CREDITS_PER_COURSE = 50
const TOTAL_CREDITS_MAX = MAX_COURSES * MAX_CREDITS_PER_COURSE

interface Course {
  id: string
  name: string
  credits: number
  grade: string
}

type GpaResult = {
  gpa: number
  totalCredits: number
  courseCount: number
}

type CreditErrorMap = Record<string, string | undefined>

const gradeScales = {
  "4.0": {
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
  },
  "5.0": {
    "A+": 5.0,
    A: 5.0,
    "A-": 4.7,
    "B+": 4.3,
    B: 4.0,
    "B-": 3.7,
    "C+": 3.3,
    C: 3.0,
    "C-": 2.7,
    "D+": 2.3,
    D: 2.0,
    "D-": 1.7,
    F: 0.0,
  },
  "100": {
    // 100-point scale still mapped to a 0–4 style GPA output
    "A+": 4.0,
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    "D+": 1.3,
    D: 1.0,
    "D-": 0.7,
    F: 0.0,
  },
} as const

export const GpaCalculator = () => {
  const [courses, setCourses] = useState<Course[]>([
    { id: "1", name: "", credits: 0, grade: "A" },
  ])
  const [gpaScale, setGpaScale] = useState<keyof typeof gradeScales>("4.0")

  const [creditErrors, setCreditErrors] = useState<CreditErrorMap>({})
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [result, setResult] = useState<GpaResult | null>(null)
  const [calculated, setCalculated] = useState(false)

  /* MEMOIZED SCALE */
  const activeScale = useMemo(
    () => gradeScales[gpaScale] ?? gradeScales["4.0"],
    [gpaScale]
  )

  const addCourse = () => {
    if (courses.length >= MAX_COURSES) {
      notify.error(`Maximum of ${MAX_COURSES} courses reached.`)
      return
    }

    const newCourse: Course = {
      id: Date.now().toString(),
      name: "",
      credits: 0,
      grade: "A",
    }
    setCourses((prev) => [...prev, newCourse])
  }

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses((prev) => prev.filter((course) => course.id !== id))
      setCreditErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const updateCourse = (
    id: string,
    field: keyof Course,
    value: string | number
  ) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === id ? { ...course, [field]: value } : course
      )
    )
    if (field === "credits") {
      setCreditErrors((prev) => {
        if (!prev[id]) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  const onCalculate = () => {
    setGlobalError(null)
    setCreditErrors({})
    setResult(null)
    setCalculated(false)

    const newCreditErrors: CreditErrorMap = {}
    let totalPoints = 0
    let totalCredits = 0
    let courseCount = 0

    for (const course of courses) {
      const trimmedName = course.name.trim()

      // Ignore completely empty rows
      if (!trimmedName && course.credits <= 0) continue

      // Validate credits range
      const credits = course.credits

      const rangeCheck = validateRange(
        credits,
        0,
        MAX_CREDITS_PER_COURSE
      )
      if (rangeCheck !== true || credits <= 0) {
        newCreditErrors[course.id] =
          typeof rangeCheck === "string"
            ? rangeCheck
            : `Credits must be between 1 and ${MAX_CREDITS_PER_COURSE}.`
        continue
      }

      // Now it's a valid course row
      courseCount += 1
      totalCredits += credits

      const points = activeScale[course.grade as keyof typeof activeScale] ?? 0
      const coursePoints = safeCalc((D) => D(points).mul(credits))

      if (coursePoints === null) {
        newCreditErrors[course.id] =
          "Calculation error for this course. Please adjust credits."
        continue
      }

      totalPoints += coursePoints
    }

    if (Object.keys(newCreditErrors).length > 0) {
      setCreditErrors(newCreditErrors)
      setGlobalError("Please fix the highlighted course credits before calculating.")
      notify.error("Please fix the highlighted fields before calculating.")
      return
    }

    if (courseCount === 0 || totalCredits <= 0) {
      setGlobalError("Add at least one course with credits greater than 0.")
      notify.error("Add at least one valid course before calculating GPA.")
      return
    }

    if (totalCredits > TOTAL_CREDITS_MAX) {
      setGlobalError(
        `Total credits cannot exceed ${TOTAL_CREDITS_MAX}. Please reduce course load.`
      )
      notify.error("Total credits exceed the allowed maximum.")
      return
    }

    const gpaValue = safeCalc((D) => D(totalPoints).div(totalCredits))
    if (gpaValue === null) {
      setGlobalError("Calculation error. Please adjust your courses and try again.")
      notify.error("GPA calculation failed. Please try again with adjusted values.")
      return
    }

    setResult({
      gpa: gpaValue,
      totalCredits,
      courseCount,
    })
    setCalculated(true)
    notify.success("GPA calculation completed.")
  }

  const clearAll = () => {
    setCourses([{ id: "1", name: "", credits: 0, grade: "A" }])
    setCreditErrors({})
    setGlobalError(null)
    setResult(null)
    setCalculated(false)
  }

  const getGPALetter = (gpa: number) => {
    if (gpa >= 3.7) return "A"
    if (gpa >= 3.3) return "A-"
    if (gpa >= 3.0) return "B+"
    if (gpa >= 2.7) return "B"
    if (gpa >= 2.3) return "B-"
    if (gpa >= 2.0) return "C+"
    if (gpa >= 1.7) return "C"
    if (gpa >= 1.3) return "C-"
    if (gpa >= 1.0) return "D"
    if (gpa >= 0.7) return "D-"
    return "F"
  }

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-green-600"
    if (gpa >= 3.0) return "text-blue-600"
    if (gpa >= 2.5) return "text-yellow-600"
    if (gpa >= 2.0) return "text-orange-600"
    return "text-red-600"
  }

  const hasError = Boolean(globalError || Object.keys(creditErrors).length > 0)
  const showResults = calculated && result && !hasError

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GPA Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* SCALE */}
          <div className="space-y-2">
            <Label htmlFor="gpa-scale">GPA Scale</Label>
            <Select
              value={gpaScale}
              onValueChange={(v) => setGpaScale((v as keyof typeof gradeScales) || "4.0")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select GPA scale" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4.0">4.0 Scale (Standard)</SelectItem>
                <SelectItem value="5.0">5.0 Scale (Weighted)</SelectItem>
                <SelectItem value="100">100 Point Scale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* COURSES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Courses</Label>
              <Button onClick={addCourse} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>

            {courses.map((course) => {
              const creditError = creditErrors[course.id]
              return (
                <div
                  key={course.id}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg"
                >
                  {/* Name */}
                  <div>
                    <Label htmlFor={`course-${course.id}`}>Course Name</Label>
                    <Input
                      id={`course-${course.id}`}
                      placeholder="e.g., Mathematics 101"
                      value={course.name}
                      onChange={(e) =>
                        updateCourse(course.id, "name", e.target.value)
                      }
                    />
                  </div>

                  {/* Credits */}
                  <div>
                    <Label htmlFor={`credits-${course.id}`}>Credits</Label>
                    <SafeNumberInput
                      id={`credits-${course.id}`}
                      value={
                        Number.isFinite(course.credits)
                          ? course.credits.toString()
                          : ""
                      }
                      onChange={(sanitized) => {
                        const credits =
                          safeNumber(sanitized, {
                            min: 0,
                            max: MAX_CREDITS_PER_COURSE,
                            allowDecimal: false,
                          }) ?? 0
                        updateCourse(course.id, "credits", credits)
                      }}
                      sanitizeOptions={{
                        min: 0,
                        max: MAX_CREDITS_PER_COURSE,
                        allowDecimal: false,
                        maxLength: 3,
                      }}
                      inputMode="numeric"
                      aria-invalid={creditError ? "true" : "false"}
                      aria-describedby={
                        creditError
                          ? `gpa-course-credits-error-${course.id}`
                          : undefined
                      }
                      className={creditError ? "border-red-500" : ""}
                    />
                    <p className="text-xs text-muted-foreground">
                      Max: {MAX_CREDITS_PER_COURSE} credits
                    </p>
                    {creditError && (
                      <p
                        id={`gpa-course-credits-error-${course.id}`}
                        className="mt-1 text-xs text-red-600"
                      >
                        {creditError}
                      </p>
                    )}
                  </div>

                  {/* Grade */}
                  <div>
                    <Label htmlFor={`grade-${course.id}`}>Grade</Label>
                    <Select
                      value={course.grade}
                      onValueChange={(value) =>
                        updateCourse(course.id, "grade", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A">A</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B">B</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="C+">C+</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="C-">C-</SelectItem>
                        <SelectItem value="D+">D+</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="D-">D-</SelectItem>
                        <SelectItem value="F">F</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Remove */}
                  <div className="flex items-end">
                    <Button
                      onClick={() => removeCourse(course.id)}
                      size="sm"
                      variant="outline"
                      disabled={courses.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ERROR ALERT */}
          {globalError && (
            <div
              className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="polite"
              aria-atomic="true"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {/* ACTIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={onCalculate} className="w-full">
              Calculate GPA
            </Button>
            <Button onClick={clearAll} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {showResults && result && (
        <Card>
          <CardHeader>
            <CardTitle>GPA Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4" aria-live="polite">
            <div className="text-center">
              <div
                className={`text-4xl sm:text-5xl md:text-6xl font-bold ${getGPAColor(
                  result.gpa
                )} mb-2 break-words`}
              >
                {result.gpa.toFixed(2)}
              </div>
              <div className="text-xl sm:text-2xl font-medium text-muted-foreground mb-4">
                {getGPALetter(result.gpa)} Grade
              </div>
              <div className="text-base sm:text-lg text-muted-foreground">
                Grade Point Average
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {result.totalCredits}
                </div>
                <div className="text-sm text-muted-foreground">Total Credits</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {result.courseCount}
                </div>
                <div className="text-sm text-muted-foreground">Courses</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {gpaScale}
                </div>
                <div className="text-sm text-muted-foreground">Scale</div>
              </div>
            </div>

            {/* COURSE BREAKDOWN */}
            <div className="space-y-3">
              <h4 className="font-semibold">Course Breakdown</h4>
              <div className="space-y-2">
                {courses
                  .filter((course) => course.name.trim() && course.credits > 0)
                  .map((course) => {
                    const points =
                      activeScale[course.grade as keyof typeof activeScale] ?? 0
                    return (
                      <div
                        key={course.id}
                        className="flex justify-between items-center p-2 bg-muted rounded"
                      >
                        <span className="font-medium">{course.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{course.credits} credits</span>
                          <span className="font-medium">{course.grade}</span>
                          <span className="text-muted-foreground">
                            ({points.toFixed(1)} points)
                          </span>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* ANALYSIS */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">GPA Analysis</h4>
              <div className="text-sm space-y-1">
                {result.gpa >= 3.5 && (
                  <p className="text-green-700">
                    🎉 Excellent! You're doing great!
                  </p>
                )}
                {result.gpa >= 3.0 && result.gpa < 3.5 && (
                  <p className="text-blue-700">
                    👍 Good job! Keep up the good work!
                  </p>
                )}
                {result.gpa >= 2.5 && result.gpa < 3.0 && (
                  <p className="text-yellow-700">
                    📚 You're doing okay, but there's room for improvement.
                  </p>
                )}
                {result.gpa >= 2.0 && result.gpa < 2.5 && (
                  <p className="text-orange-700">
                    ⚠️ Consider focusing more on your studies.
                  </p>
                )}
                {result.gpa < 2.0 && (
                  <p className="text-red-700">
                    🚨 You may need to seek academic support.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TIPS */}
      <Card>
        <CardHeader>
          <CardTitle>GPA Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• GPA is calculated by dividing total grade points by total credit hours.</li>
            <li>• Each grade has a corresponding point value (A=4.0, B=3.0, etc.).</li>
            <li>• Weighted GPAs may give extra points for honors or AP courses.</li>
            <li>• Different schools may use different GPA scales.</li>
            <li>• GPA is cumulative and includes all completed courses.</li>
            <li>• Some courses may be pass/fail and not affect GPA.</li>
            <li>• Withdrawing from a course may or may not affect your GPA.</li>
            <li>• Check with your institution for specific GPA calculation rules.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
