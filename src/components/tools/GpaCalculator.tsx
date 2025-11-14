import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SafeNumberInput } from "@/components/ui/safe-number-input";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, Plus, Trash2 } from "lucide-react";
import { safeNumber } from "@/lib/safe-number";
import { safeCalc } from "@/lib/safe-math";

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

export const GpaCalculator = () => {
  const [courses, setCourses] = useState<Course[]>([
    { id: "1", name: "", credits: 0, grade: "A" }
  ]);
  const [gpaScale, setGpaScale] = useState("4.0");

  const gradeScales = {
    "4.0": {
      "A+": 4.0, "A": 4.0, "A-": 3.7,
      "B+": 3.3, "B": 3.0, "B-": 2.7,
      "C+": 2.3, "C": 2.0, "C-": 1.7,
      "D+": 1.3, "D": 1.0, "D-": 0.7,
      "F": 0.0
    },
    "5.0": {
      "A+": 5.0, "A": 5.0, "A-": 4.7,
      "B+": 4.3, "B": 4.0, "B-": 3.7,
      "C+": 3.3, "C": 3.0, "C-": 2.7,
      "D+": 2.3, "D": 2.0, "D-": 1.7,
      "F": 0.0
    },
    "100": {
      "A+": 4.0, "A": 4.0, "A-": 3.7,
      "B+": 3.3, "B": 3.0, "B-": 2.7,
      "C+": 2.3, "C": 2.0, "C-": 1.7,
      "D+": 1.3, "D": 1.0, "D-": 0.7,
      "F": 0.0
    }
  };

  const addCourse = () => {
    const newCourse: Course = {
      id: Date.now().toString(),
      name: "",
      credits: 0,
      grade: "A"
    };
    setCourses([...courses, newCourse]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(course => course.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string | number) => {
    setCourses(courses.map(course => 
      course.id === id ? { ...course, [field]: value } : course
    ));
  };

  const calculateGPA = () => {
    const scale = gradeScales[gpaScale as keyof typeof gradeScales];
    let totalPoints = 0;
    let totalCredits = 0;

    courses.forEach(course => {
      if (course.name.trim() && course.credits > 0) {
        const points = scale[course.grade as keyof typeof scale] || 0;
        const coursePoints = safeCalc(D => D(points).mul(course.credits));
        if (coursePoints !== null) {
          totalPoints += coursePoints;
          totalCredits += course.credits;
        }
      }
    });

    if (totalCredits > 0) {
      const gpa = safeCalc(D => D(totalPoints).div(totalCredits));
      return gpa !== null ? gpa : 0;
    }
    return 0;
  };

  const gpa = calculateGPA();

  const getGPALetter = (gpa: number) => {
    if (gpa >= 3.7) return "A";
    if (gpa >= 3.3) return "A-";
    if (gpa >= 3.0) return "B+";
    if (gpa >= 2.7) return "B";
    if (gpa >= 2.3) return "B-";
    if (gpa >= 2.0) return "C+";
    if (gpa >= 1.7) return "C";
    if (gpa >= 1.3) return "C-";
    if (gpa >= 1.0) return "D";
    if (gpa >= 0.7) return "D-";
    return "F";
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-green-600";
    if (gpa >= 3.0) return "text-blue-600";
    if (gpa >= 2.5) return "text-yellow-600";
    if (gpa >= 2.0) return "text-orange-600";
    return "text-red-600";
  };

  const clearAll = () => {
    setCourses([{ id: "1", name: "", credits: 0, grade: "A" }]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GPA Calculator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gpa-scale">GPA Scale</Label>
            <Select value={gpaScale} onValueChange={setGpaScale}>
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Courses</Label>
              <Button onClick={addCourse} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </div>

            {courses.map((course, index) => (
              <div key={course.id} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                <div>
                  <Label htmlFor={`course-${course.id}`}>Course Name</Label>
                  <Input
                    id={`course-${course.id}`}
                    placeholder="e.g., Mathematics 101"
                    value={course.name}
                    onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor={`credits-${course.id}`}>Credits</Label>
                  <SafeNumberInput
                    id={`credits-${course.id}`}
                    value={course.credits.toString()}
                    onChange={(sanitized) => {
                      const credits = safeNumber(sanitized, { min: 0, max: 10, allowDecimal: false }) || 0;
                      updateCourse(course.id, 'credits', credits);
                    }}
                    sanitizeOptions={{ min: 0, max: 10, allowDecimal: false }}
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <Label htmlFor={`grade-${course.id}`}>Grade</Label>
                  <Select value={course.grade} onValueChange={(value) => updateCourse(course.id, 'grade', value)}>
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
            ))}
          </div>

          <Button onClick={clearAll} variant="outline" className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </CardContent>
      </Card>

      {courses.some(course => course.name.trim() && course.credits > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>GPA Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`text-4xl sm:text-5xl md:text-6xl font-bold ${getGPAColor(gpa)} mb-2 break-words`}>
                {gpa.toFixed(2)}
              </div>
              <div className="text-xl sm:text-2xl font-medium text-muted-foreground mb-4">
                {getGPALetter(gpa)} Grade
              </div>
              <div className="text-base sm:text-lg text-muted-foreground">
                Grade Point Average
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {courses.reduce((sum, course) => sum + course.credits, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Credits</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {courses.filter(course => course.name.trim() && course.credits > 0).length}
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

            <div className="space-y-3">
              <h4 className="font-semibold">Course Breakdown</h4>
              <div className="space-y-2">
                {courses
                  .filter(course => course.name.trim() && course.credits > 0)
                  .map((course, index) => {
                    const scale = gradeScales[gpaScale as keyof typeof gradeScales];
                    const points = scale[course.grade as keyof typeof scale] || 0;
                    return (
                      <div key={course.id} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="font-medium">{course.name}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{course.credits} credits</span>
                          <span className="font-medium">{course.grade}</span>
                          <span className="text-muted-foreground">({points.toFixed(1)} points)</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">GPA Analysis</h4>
              <div className="text-sm space-y-1">
                {gpa >= 3.5 && <p className="text-green-700">🎉 Excellent! You're doing great!</p>}
                {gpa >= 3.0 && gpa < 3.5 && <p className="text-blue-700">👍 Good job! Keep up the good work!</p>}
                {gpa >= 2.5 && gpa < 3.0 && <p className="text-yellow-700">📚 You're doing okay, but there's room for improvement.</p>}
                {gpa >= 2.0 && gpa < 2.5 && <p className="text-orange-700">⚠️ Consider focusing more on your studies.</p>}
                {gpa < 2.0 && <p className="text-red-700">🚨 You may need to seek academic support.</p>}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>GPA Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• GPA is calculated by dividing total grade points by total credit hours</li>
            <li>• Each grade has a corresponding point value (A=4.0, B=3.0, etc.)</li>
            <li>• Weighted GPAs may give extra points for honors or AP courses</li>
            <li>• Different schools may use different GPA scales</li>
            <li>• GPA is cumulative and includes all completed courses</li>
            <li>• Some courses may be pass/fail and not affect GPA</li>
            <li>• Withdrawing from a course may or may not affect your GPA</li>
            <li>• Check with your institution for specific GPA calculation rules</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
