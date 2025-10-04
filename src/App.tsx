import { useState, useEffect } from 'react';
import { BookOpen, Users, Calendar, Plus, X, Check, Clock, UserX, GraduationCap } from 'lucide-react';
import { supabase, Course, Student, AttendanceRecord } from './lib/supabase';

function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'courses' | 'students'>('attendance');

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseInstructor, setNewCourseInstructor] = useState('');

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentCourse, setNewStudentCourse] = useState('');

  useEffect(() => {
    loadCourses();
    loadStudents();
    loadAttendance();
  }, []);

  const loadCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('code');

    if (data && !error) {
      setCourses(data);
      if (data.length > 0 && !selectedCourse) {
        setSelectedCourse(data[0].id);
      }
    }
  };

  const loadStudents = async () => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('roll_number');

    if (data && !error) {
      setStudents(data);
    }
  };

  const loadAttendance = async () => {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*');

    if (data && !error) {
      setAttendanceRecords(data);
    }
  };

  const addCourse = async () => {
    if (!newCourseCode.trim() || !newCourseName.trim()) return;

    const { data, error } = await supabase
      .from('courses')
      .insert([{
        code: newCourseCode.trim(),
        name: newCourseName.trim(),
        instructor: newCourseInstructor.trim()
      }])
      .select();

    if (data && !error) {
      await loadCourses();
      setNewCourseCode('');
      setNewCourseName('');
      setNewCourseInstructor('');
      setShowAddCourse(false);
    }
  };

  const addStudent = async () => {
    if (!newStudentRoll.trim() || !newStudentName.trim() || !newStudentCourse) return;

    const { data, error } = await supabase
      .from('students')
      .insert([{
        roll_number: newStudentRoll.trim(),
        name: newStudentName.trim(),
        email: newStudentEmail.trim(),
        course_id: newStudentCourse
      }])
      .select();

    if (data && !error) {
      await loadStudents();
      setNewStudentRoll('');
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentCourse('');
      setShowAddStudent(false);
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late') => {
    const existingRecord = attendanceRecords.find(
      r => r.student_id === studentId && r.date === selectedDate && r.course_id === selectedCourse
    );

    if (existingRecord) {
      const { error } = await supabase
        .from('attendance_records')
        .update({ status })
        .eq('id', existingRecord.id);

      if (!error) {
        await loadAttendance();
      }
    } else {
      const { error } = await supabase
        .from('attendance_records')
        .insert([{
          student_id: studentId,
          course_id: selectedCourse,
          date: selectedDate,
          status,
          notes: ''
        }]);

      if (!error) {
        await loadAttendance();
      }
    }
  };

  const deleteCourse = async (courseId: string) => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (!error) {
      await loadCourses();
      await loadStudents();
      await loadAttendance();
      if (selectedCourse === courseId) {
        setSelectedCourse('');
      }
    }
  };

  const deleteStudent = async (studentId: string) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (!error) {
      await loadStudents();
      await loadAttendance();
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    return attendanceRecords.find(
      r => r.student_id === studentId && r.date === selectedDate && r.course_id === selectedCourse
    )?.status;
  };

  const getCourseStudents = () => {
    return students.filter(s => s.course_id === selectedCourse);
  };

  const getStats = () => {
    const courseStudents = getCourseStudents();
    const todayRecords = attendanceRecords.filter(
      r => r.date === selectedDate && r.course_id === selectedCourse
    );
    const present = todayRecords.filter(r => r.status === 'present').length;
    const absent = todayRecords.filter(r => r.status === 'absent').length;
    const late = todayRecords.filter(r => r.status === 'late').length;
    const total = courseStudents.length;

    return { present, absent, late, total };
  };

  const stats = getStats();
  const selectedCourseData = courses.find(c => c.id === selectedCourse);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-slate-800">College Attendance System</h1>
          </div>
          <p className="text-slate-600 ml-14">Track student attendance across courses</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Total Students</span>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-600">Present</span>
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-green-600">{stats.present}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-600">Late</span>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-yellow-600">{stats.late}</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-600">Absent</span>
              <UserX className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-3xl font-bold text-red-600">{stats.absent}</div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50">
            <div className="flex">
              <button
                onClick={() => setActiveTab('attendance')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'attendance'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Mark Attendance
                </div>
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'courses'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Courses
                </div>
              </button>
              <button
                onClick={() => setActiveTab('students')}
                className={`px-6 py-4 font-medium transition-colors ${
                  activeTab === 'students'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Students
                </div>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'attendance' ? (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Course:</label>
                    <select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.code} - {course.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-700">Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {selectedCourseData && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-1">{selectedCourseData.code} - {selectedCourseData.name}</h3>
                    {selectedCourseData.instructor && (
                      <p className="text-sm text-blue-700">Instructor: {selectedCourseData.instructor}</p>
                    )}
                  </div>
                )}

                {!selectedCourse ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">Please select a course to mark attendance</p>
                  </div>
                ) : getCourseStudents().length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600 mb-4">No students enrolled in this course</p>
                    <button
                      onClick={() => setActiveTab('students')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Students
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getCourseStudents().map((student) => {
                      const status = getAttendanceStatus(student.id);
                      return (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-mono rounded">
                                {student.roll_number}
                              </span>
                              <h3 className="font-medium text-slate-800">{student.name}</h3>
                            </div>
                            {student.email && (
                              <p className="text-sm text-slate-500 mt-1 ml-16">{student.email}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => markAttendance(student.id, 'present')}
                              className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                                status === 'present'
                                  ? 'bg-green-100 text-green-800 border-green-300 shadow-sm'
                                  : 'border-slate-200 text-slate-600 hover:border-green-300 hover:bg-green-50'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                              Present
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'late')}
                              className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                                status === 'late'
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm'
                                  : 'border-slate-200 text-slate-600 hover:border-yellow-300 hover:bg-yellow-50'
                              }`}
                            >
                              <Clock className="w-4 h-4" />
                              Late
                            </button>
                            <button
                              onClick={() => markAttendance(student.id, 'absent')}
                              className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 ${
                                status === 'absent'
                                  ? 'bg-red-100 text-red-800 border-red-300 shadow-sm'
                                  : 'border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50'
                              }`}
                            >
                              <UserX className="w-4 h-4" />
                              Absent
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeTab === 'courses' ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">Courses</h2>
                  <button
                    onClick={() => setShowAddCourse(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Course
                  </button>
                </div>

                {showAddCourse && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Course Code *
                        </label>
                        <input
                          type="text"
                          value={newCourseCode}
                          onChange={(e) => setNewCourseCode(e.target.value)}
                          placeholder="e.g., CS101"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Course Name *
                        </label>
                        <input
                          type="text"
                          value={newCourseName}
                          onChange={(e) => setNewCourseName(e.target.value)}
                          placeholder="e.g., Introduction to Programming"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Instructor
                        </label>
                        <input
                          type="text"
                          value={newCourseInstructor}
                          onChange={(e) => setNewCourseInstructor(e.target.value)}
                          placeholder="Instructor name (optional)"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addCourse}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Course
                      </button>
                      <button
                        onClick={() => {
                          setShowAddCourse(false);
                          setNewCourseCode('');
                          setNewCourseName('');
                          setNewCourseInstructor('');
                        }}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No courses added yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {courses.map((course) => {
                      const courseStudents = students.filter(s => s.course_id === course.id);
                      return (
                        <div
                          key={course.id}
                          className="p-5 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded">
                                  {course.code}
                                </span>
                              </div>
                              <h3 className="font-semibold text-slate-800 text-lg">{course.name}</h3>
                              {course.instructor && (
                                <p className="text-sm text-slate-600 mt-1">
                                  Instructor: {course.instructor}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => deleteCourse(course.id)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600 mt-3 pt-3 border-t border-slate-200">
                            <Users className="w-4 h-4" />
                            <span>{courseStudents.length} students enrolled</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">Students</h2>
                  <button
                    onClick={() => setShowAddStudent(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Student
                  </button>
                </div>

                {showAddStudent && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Roll Number *
                        </label>
                        <input
                          type="text"
                          value={newStudentRoll}
                          onChange={(e) => setNewStudentRoll(e.target.value)}
                          placeholder="e.g., 2024001"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={newStudentName}
                          onChange={(e) => setNewStudentName(e.target.value)}
                          placeholder="Student name"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={newStudentEmail}
                          onChange={(e) => setNewStudentEmail(e.target.value)}
                          placeholder="Email (optional)"
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Course *
                        </label>
                        <select
                          value={newStudentCourse}
                          onChange={(e) => setNewStudentCourse(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select Course</option>
                          {courses.map(course => (
                            <option key={course.id} value={course.id}>
                              {course.code} - {course.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={addStudent}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Student
                      </button>
                      <button
                        onClick={() => {
                          setShowAddStudent(false);
                          setNewStudentRoll('');
                          setNewStudentName('');
                          setNewStudentEmail('');
                          setNewStudentCourse('');
                        }}
                        className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-600">No students added yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {students.map((student) => {
                      const studentCourse = courses.find(c => c.id === student.course_id);
                      const studentRecords = attendanceRecords.filter(r => r.student_id === student.id);
                      const presentCount = studentRecords.filter(r => r.status === 'present').length;
                      const totalRecords = studentRecords.length;
                      const attendanceRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

                      return (
                        <div
                          key={student.id}
                          className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-mono rounded">
                                {student.roll_number}
                              </span>
                              <h3 className="font-medium text-slate-800">{student.name}</h3>
                            </div>
                            {student.email && (
                              <p className="text-sm text-slate-500 ml-16">{student.email}</p>
                            )}
                            {studentCourse && (
                              <p className="text-sm text-blue-600 ml-16 mt-1">
                                {studentCourse.code} - {studentCourse.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            {totalRecords > 0 && (
                              <div className="text-right">
                                <div className="text-sm font-medium text-slate-700">
                                  {attendanceRate}% attendance
                                </div>
                                <div className="text-xs text-slate-500">
                                  {presentCount} of {totalRecords} classes
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => deleteStudent(student.id)}
                              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
