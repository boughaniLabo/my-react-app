import { useState, useEffect } from 'react'
import './App.css'
import { login as apiLogin, setToken, getToken, logout as apiLogout, apiFetch } from './api'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'

function App() {
  const [page, setPage] = useState(getToken() ? 'dashboard' : 'login')
  const [loginError, setLoginError] = useState('')
  const [loading, setLoading] = useState(false)

  // Employees state
  const [employees, setEmployees] = useState([])
  const [empName, setEmpName] = useState('')
  const [empEmail, setEmpEmail] = useState('')
  const [empFunction, setEmpFunction] = useState('') // New: for adding
  const [empError, setEmpError] = useState('')
  const [empLoading, setEmpLoading] = useState(false)
  const [empPage, setEmpPage] = useState(1) // New: pagination
  const [empSearch, setEmpSearch] = useState('') // New: search by name
  const [empFunctionFilter, setEmpFunctionFilter] = useState('') // New: filter by function
  const EMP_PAGE_SIZE = 25
  const [editingEmpId, setEditingEmpId] = useState(null)
  const [editEmpData, setEditEmpData] = useState({ name: '', email: '', function: '' })

  // Tasks state
  const [tasks, setTasks] = useState([])
  const [taskTitle, setTaskTitle] = useState('')
  const [taskCoef, setTaskCoef] = useState('')
  const [taskReference, setTaskReference] = useState('')
  const [taskError, setTaskError] = useState('')
  const [taskLoading, setTaskLoading] = useState(false)
  const [taskSearchTerm, setTaskSearchTerm] = useState('')
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editTaskData, setEditTaskData] = useState({ title: '', coefficient: '', reference: '' })
  const [taskPage, setTaskPage] = useState(1)
  const TASK_PAGE_SIZE = 25

  // Assignments state
  const [assignEmployee, setAssignEmployee] = useState('')
  const [assignDate, setAssignDate] = useState('')
  const [assignments, setAssignments] = useState([])
  const [selectedTasks, setSelectedTasks] = useState([]) // [{taskId, quantity}]
  const [assignError, setAssignError] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignEmpSearch, setAssignEmpSearch] = useState('')
  const [assignEmpFunctionFilter, setAssignEmpFunctionFilter] = useState('')

  // New: View assignments by date
  const [viewDate, setViewDate] = useState('');
  const [allAssignments, setAllAssignments] = useState([]); // [{employeeId, taskId, quantity, date, id}]
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');

  // New: View assignments for one employee and date
  const [viewEmpId, setViewEmpId] = useState('');
  const [viewEmpDate, setViewEmpDate] = useState('');
  const [viewEmpAssignments, setViewEmpAssignments] = useState([]);
  const [viewEmpLoading, setViewEmpLoading] = useState(false);
  const [viewEmpError, setViewEmpError] = useState('');

  // New: View total points for a user in a date range
  const [rangeEmpId, setRangeEmpId] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [rangeAssignments, setRangeAssignments] = useState([]);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState('');

  // Fetch employees and tasks when page changes to assignments
  useEffect(() => {
    if (page === 'employees') fetchEmployees()
    if (page === 'tasks') fetchTasks()
    if (page === 'assignments') {
      fetchEmployees()
      fetchTasks()
    }
    if (page === 'view-employee-assignments') {
      fetchEmployees()
    }
    if (page === 'user-points-range') {
      fetchEmployees()
    }
    // eslint-disable-next-line
  }, [page])

  // Fetch assignments when employee or date changes
  useEffect(() => {
    if (page === 'assignments' && assignEmployee && assignDate) {
      fetchAssignments(assignEmployee, assignDate)
    } else {
      setAssignments([])
    }
    setSelectedTasks([]) // Reset selected tasks when employee/date/page changes
    // eslint-disable-next-line
  }, [assignEmployee, assignDate, page])

  async function fetchEmployees() {
    setEmpLoading(true)
    setEmpError('')
    try {
      const data = await apiFetch('/employees')
      setEmployees(data)
    } catch (err) {
      setEmpError('Failed to load employees')
    } finally {
      setEmpLoading(false)
    }
  }

  async function handleAddEmployee(e) {
    e.preventDefault()
    setEmpError('')
    setEmpLoading(true)
    try {
      await apiFetch('/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: empName, email: empEmail, function: empFunction }) // include function
      })
      setEmpName('')
      setEmpEmail('')
      setEmpFunction('')
      fetchEmployees()
    } catch (err) {
      setEmpError('Failed to add employee')
    } finally {
      setEmpLoading(false)
    }
  }

  async function handleDeleteEmployee(id) {
    setEmpError('')
    setEmpLoading(true)
    try {
      await apiFetch(`/employees/${id}`, { method: 'DELETE' })
      fetchEmployees()
    } catch (err) {
      setEmpError('Failed to delete employee')
    } finally {
      setEmpLoading(false)
    }
  }

  // Tasks logic
  async function fetchTasks() {
    setTaskLoading(true)
    setTaskError('')
    try {
      const data = await apiFetch('/tasks')
      setTasks(data)
    } catch (err) {
      setTaskError('Failed to load tasks')
    } finally {
      setTaskLoading(false)
    }
  }

  async function handleAddTask(e) {
    e.preventDefault()
    setTaskError('')
    setTaskLoading(true)
    try {
      await apiFetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, coefficient: parseFloat(taskCoef), reference: taskReference })
      })
      setTaskTitle('')
      setTaskCoef('')
      setTaskReference('')
      fetchTasks()
    } catch (err) {
      setTaskError('Failed to add task')
    } finally {
      setTaskLoading(false)
    }
  }

  async function handleDeleteTask(id) {
    setTaskError('')
    setTaskLoading(true)
    try {
      await apiFetch(`/tasks/${id}`, { method: 'DELETE' })
      fetchTasks()
    } catch (err) {
      setTaskError('Failed to delete task')
    } finally {
      setTaskLoading(false)
    }
  }

  // Assignments logic
  async function fetchAssignments(employeeId, date) {
    setAssignLoading(true)
    setAssignError('')
    try {
      const data = await apiFetch(`/assignments/employee/${employeeId}/date/${date}`)
      setAssignments(data)
    } catch (err) {
      setAssignError('Failed to load assignments')
    } finally {
      setAssignLoading(false)
    }
  }

  function handleTaskCheckboxChange(taskId, checked) {
    setSelectedTasks(prev => {
      if (checked) {
        // Add with default quantity 1 if not already present
        if (!prev.find(t => t.taskId === taskId)) {
          return [...prev, { taskId, quantity: 1 }]
        }
        return prev
      } else {
        // Remove
        return prev.filter(t => t.taskId !== taskId)
      }
    })
  }

  function handleTaskQuantityChange(taskId, quantity) {
    setSelectedTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, quantity } : t))
  }

  async function handleAssignTasks(e) {
    e.preventDefault()
    setAssignError('')
    setAssignLoading(true)
    try {
      for (const t of selectedTasks) {
        if (t.quantity > 0) {
          await apiFetch('/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: assignEmployee,
              date: assignDate,
              taskId: t.taskId,
              quantity: Number(t.quantity)
            })
          })
        }
      }
      setSelectedTasks([])
      fetchAssignments(assignEmployee, assignDate)
    } catch (err) {
      setAssignError('Failed to assign tasks')
    } finally {
      setAssignLoading(false)
    }
  }

  // Handle login form submit
  async function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    setLoading(true)
    const form = e.target
    const username = form.username.value
    const password = form.password.value
    try {
      const data = await apiLogin(username, password)
      setToken(data.access_token)
      setPage('dashboard')
    } catch (err) {
      setLoginError('Invalid username or password')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    apiLogout()
    setPage('login')
  }

  const isLoggedIn = page !== 'login'

  async function fetchAllAssignmentsForDate(date) {
    setViewLoading(true);
    setViewError('');
    try {
      // Fetch all employees, then for each, fetch their assignments for the date
      const results = [];
      for (const emp of employees) {
        const data = await apiFetch(`/assignments/employee/${emp.id}/date/${date}`);
        for (const a of data) {
          results.push({ ...a, employeeId: emp.id });
        }
      }
      setAllAssignments(results);
    } catch (err) {
      setViewError('Failed to load assignments');
    } finally {
      setViewLoading(false);
    }
  }

  async function fetchAssignmentsForEmployeeAndDate(empId, date) {
    setViewEmpLoading(true);
    setViewEmpError('');
    try {
      const data = await apiFetch(`/assignments/employee/${empId}/date/${date}`);
      setViewEmpAssignments(data);
    } catch (err) {
      setViewEmpError('Failed to load assignments');
    } finally {
      setViewEmpLoading(false);
    }
  }

  async function fetchAssignmentsForRange(empId, start, end) {
    setRangeLoading(true);
    setRangeError('');
    try {
      const data = await apiFetch(`/assignments/employee/${empId}/from/${start}/to/${end}`);
      setRangeAssignments(data);
    } catch (err) {
      setRangeError('Failed to load assignments');
    } finally {
      setRangeLoading(false);
    }
  }

  // Helper for filtered and paginated employees
  const filteredEmployees = employees.filter(emp =>
    (!empSearch || emp.name.toLowerCase().includes(empSearch.toLowerCase())) &&
    (!empFunctionFilter || emp.function === empFunctionFilter)
  )
  const totalEmpPages = Math.max(1, Math.ceil(filteredEmployees.length / EMP_PAGE_SIZE))
  const paginatedEmployees = filteredEmployees.slice((empPage - 1) * EMP_PAGE_SIZE, empPage * EMP_PAGE_SIZE)

  // Helper for filtered and paginated tasks
  const filteredTasks = tasks.filter(task => {
    if (!taskSearchTerm) return true;
    const term = taskSearchTerm.toLowerCase();
    return (
      (task.title && task.title.toLowerCase().includes(term)) ||
      (task.reference && task.reference.toLowerCase().includes(term)) ||
      (task.coefficient !== undefined && String(task.coefficient).toLowerCase().includes(term))
    );
  })
  const totalTaskPages = Math.max(1, Math.ceil(filteredTasks.length / TASK_PAGE_SIZE))
  const paginatedTasks = filteredTasks.slice((taskPage - 1) * TASK_PAGE_SIZE, taskPage * TASK_PAGE_SIZE)

  // Edit Employee
  async function handleEditEmpSave(id) {
    setEmpError('')
    setEmpLoading(true)
    try {
      await apiFetch(`/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editEmpData.name,
          email: editEmpData.email,
          function: editEmpData.function
        })
      })
      setEditingEmpId(null)
      setEditEmpData({ name: '', email: '', function: '' })
      fetchEmployees()
    } catch (err) {
      setEmpError('Failed to update employee')
    } finally {
      setEmpLoading(false)
    }
  }
  function handleEditEmpStart(emp) {
    setEditingEmpId(emp.id)
    setEditEmpData({ name: emp.name, email: emp.email, function: emp.function || '' })
  }
  function handleEditEmpCancel() {
    setEditingEmpId(null)
    setEditEmpData({ name: '', email: '', function: '' })
  }

  // Edit Task
  async function handleEditTaskSave(id) {
    setTaskError('')
    setTaskLoading(true)
    try {
      await apiFetch(`/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTaskData.title,
          coefficient: parseFloat(editTaskData.coefficient),
          reference: editTaskData.reference
        })
      })
      setEditingTaskId(null)
      setEditTaskData({ title: '', coefficient: '', reference: '' })
      fetchTasks()
    } catch (err) {
      setTaskError('Failed to update task')
    } finally {
      setTaskLoading(false)
    }
  }
  function handleEditTaskStart(task) {
    setEditingTaskId(task.id)
    setEditTaskData({ title: task.title, coefficient: task.coefficient, reference: task.reference || '' })
  }
  function handleEditTaskCancel() {
    setEditingTaskId(null)
    setEditTaskData({ title: '', coefficient: '', reference: '' })
  }

  // Export assigned tasks to Excel
  function exportAssignedTasksToExcel() {
    if (!assignments.length) return;
    const data = assignments.map(a => {
      const task = tasks.find(t => t.id === a.taskId);
      return {
        Task: task ? task.title : a.taskId,
        Reference: task ? task.reference : '',
        Coefficient: task ? task.coefficient : '',
        Points: task ? (a.quantity * task.coefficient) : 0
      };
    });
    data.push({ Task: 'Total Points', Reference: '', Coefficient: '', Points: data.reduce((sum, row) => sum + (row.Points || 0), 0) });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'AssignedTasks');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'assigned_tasks.xlsx');
  }

  return (
    <div className="app-container">
      {isLoggedIn && (
        <nav className="navbar">
          <button onClick={() => setPage('dashboard')}>Dashboard</button>
          <button onClick={() => setPage('employees')}>Employees</button>
          <button onClick={() => setPage('tasks')}>Tasks</button>
          <button onClick={() => setPage('assignments')}>Assignments</button>
          <button onClick={() => setPage('view-employee-assignments')}>Employee Assignments</button>
          <button onClick={() => setPage('view-assignments')}>View All Assignments</button>
          <button onClick={() => setPage('user-points-range')}>User Points Range</button>
          <button onClick={handleLogout}>Logout</button>
        </nav>
      )}
      <main className="main-content">
        {page === 'login' && (
          <div className="login-page">
            <h2>Admin Login</h2>
            <form className="login-form" onSubmit={handleLogin} autoComplete="off">
              <input name="username" type="text" placeholder="Username" className="input" required />
              <input name="password" type="password" placeholder="Password" className="input" required />
              <button type="submit" className="btn" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
              {loginError && <div className="error">{loginError}</div>}
            </form>
          </div>
        )}
        {isLoggedIn && page === 'dashboard' && <h2>Dashboard</h2>}
        {isLoggedIn && page === 'employees' && (
          <div>
            <h2>Employees Management</h2>
            <form className="emp-form" onSubmit={handleAddEmployee} autoComplete="off">
              <input
                type="text"
                className="input"
                placeholder="Name"
                value={empName}
                onChange={e => setEmpName(e.target.value)}
                required
              />
              <input
                type="email"
                className="input"
                placeholder="Email"
                value={empEmail}
                onChange={e => setEmpEmail(e.target.value)}
                required
              />
              <input
                type="text"
                className="input"
                placeholder="Function"
                value={empFunction}
                onChange={e => setEmpFunction(e.target.value)}
                required
              />
              <button className="btn" type="submit" disabled={empLoading}>Add</button>
            </form>
            {empError && <div className="error">{empError}</div>}
            {/* Filter and search UI */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <input
                type="text"
                className="input"
                placeholder="Search by name..."
                value={empSearch}
                onChange={e => { setEmpSearch(e.target.value); setEmpPage(1); }}
                style={{ flex: 1 }}
              />
              <select
                className="input"
                value={empFunctionFilter}
                onChange={e => { setEmpFunctionFilter(e.target.value); setEmpPage(1); }}
                style={{ minWidth: 150 }}
              >
                <option value="">All Functions</option>
                {/* Dynamically list unique functions */}
                {[...new Set(employees.map(emp => emp.function).filter(Boolean))].map(fn => (
                  <option key={fn} value={fn}>{fn}</option>
                ))}
              </select>
            </div>
            <table className="emp-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Function</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {empLoading ? (
                  <tr><td colSpan="5">Loading...</td></tr>
                ) : paginatedEmployees.length === 0 ? (
                  <tr><td colSpan="5">No employees found.</td></tr>
                ) : paginatedEmployees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.id}</td>
                    {editingEmpId === emp.id ? (
                      <>
                        <td><input className="input" value={editEmpData.name} onChange={e => setEditEmpData(d => ({ ...d, name: e.target.value }))} /></td>
                        <td><input className="input" value={editEmpData.email} onChange={e => setEditEmpData(d => ({ ...d, email: e.target.value }))} /></td>
                        <td><input className="input" value={editEmpData.function} onChange={e => setEditEmpData(d => ({ ...d, function: e.target.value }))} /></td>
                        <td>
                          <button className="btn" onClick={() => handleEditEmpSave(emp.id)} disabled={empLoading}>Save</button>
                          <button className="btn btn-danger" onClick={handleEditEmpCancel} disabled={empLoading}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>{emp.function}</td>
                        <td>
                          <button className="btn" onClick={() => handleEditEmpStart(emp)} disabled={empLoading}>Edit</button>
                          <button className="btn btn-danger" onClick={() => handleDeleteEmployee(emp.id)} disabled={empLoading}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination controls */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
              <button className="btn" onClick={() => setEmpPage(p => Math.max(1, p - 1))} disabled={empPage === 1}>Prev</button>
              <span>Page {empPage} of {totalEmpPages}</span>
              <button className="btn" onClick={() => setEmpPage(p => Math.min(totalEmpPages, p + 1))} disabled={empPage === totalEmpPages}>Next</button>
            </div>
          </div>
        )}
        {isLoggedIn && page === 'tasks' && (
          <div>
            <h2>Tasks Management</h2>
            {/* Search bar for tasks */}
            <div style={{ marginBottom: '1rem', width: '100%' }}>
              <input
                type="text"
                className="input"
                placeholder="Search by title, reference, or coefficient..."
                value={taskSearchTerm}
                onChange={e => { setTaskSearchTerm(e.target.value); setTaskPage(1); }}
                style={{ width: '100%' }}
              />
            </div>
            <form className="emp-form" onSubmit={handleAddTask} autoComplete="off">
              <input
                type="text"
                className="input"
                placeholder="Title"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                required
              />
              <input
                type="number"
                className="input"
                placeholder="Coefficient"
                value={taskCoef}
                onChange={e => setTaskCoef(e.target.value)}
                required
                min="0"
                step="0.01"
              />
              <input
                type="text"
                className="input"
                placeholder="Reference"
                value={taskReference}
                onChange={e => setTaskReference(e.target.value)}
              />
              <button className="btn" type="submit" disabled={taskLoading}>Add</button>
            </form>
            {taskError && <div className="error">{taskError}</div>}
            <table className="emp-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Coefficient</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {taskLoading ? (
                  <tr><td colSpan="5">Loading...</td></tr>
                ) : paginatedTasks.length === 0 ? (
                  <tr><td colSpan="5">No tasks found.</td></tr>
                ) : paginatedTasks.map(task => (
                  <tr key={task.id}>
                    <td>{task.id}</td>
                    {editingTaskId === task.id ? (
                      <>
                        <td><input className="input" value={editTaskData.title} onChange={e => setEditTaskData(d => ({ ...d, title: e.target.value }))} /></td>
                        <td><input className="input" type="number" value={editTaskData.coefficient} onChange={e => setEditTaskData(d => ({ ...d, coefficient: e.target.value }))} /></td>
                        <td><input className="input" value={editTaskData.reference} onChange={e => setEditTaskData(d => ({ ...d, reference: e.target.value }))} /></td>
                        <td>
                          <button className="btn" onClick={() => handleEditTaskSave(task.id)} disabled={taskLoading}>Save</button>
                          <button className="btn btn-danger" onClick={handleEditTaskCancel} disabled={taskLoading}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{task.title}</td>
                        <td>{task.coefficient}</td>
                        <td>{task.reference}</td>
                        <td>
                          <button className="btn" onClick={() => handleEditTaskStart(task)} disabled={taskLoading}>Edit</button>
                          <button className="btn btn-danger" onClick={() => handleDeleteTask(task.id)} disabled={taskLoading}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination controls for tasks */}
            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
              <button className="btn" onClick={() => setTaskPage(p => Math.max(1, p - 1))} disabled={taskPage === 1}>Prev</button>
              <span>Page {taskPage} of {totalTaskPages}</span>
              <button className="btn" onClick={() => setTaskPage(p => Math.min(totalTaskPages, p + 1))} disabled={taskPage === totalTaskPages}>Next</button>
            </div>
          </div>
        )}
        {isLoggedIn && page === 'assignments' && (
          <div>
            <h2>Assignments</h2>
            <form className="emp-form" onSubmit={handleAssignTasks} autoComplete="off">
              {/* Employee search/filter UI */}
              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Search employee by name..."
                  value={assignEmpSearch}
                  onChange={e => { setAssignEmpSearch(e.target.value); }}
                  style={{ flex: 1 }}
                />
                <select
                  className="input"
                  value={assignEmpFunctionFilter}
                  onChange={e => setAssignEmpFunctionFilter(e.target.value)}
                  style={{ minWidth: 150 }}
                >
                  <option value="">All Functions</option>
                  {[...new Set(employees.map(emp => emp.function).filter(Boolean))].map(fn => (
                    <option key={fn} value={fn}>{fn}</option>
                  ))}
                </select>
              </div>
              <select className="input" value={assignEmployee} onChange={e => setAssignEmployee(e.target.value)} required>
                <option value="">Select Employee</option>
                {employees
                  .filter(emp =>
                    (!assignEmpSearch || emp.name.toLowerCase().includes(assignEmpSearch.toLowerCase())) &&
                    (!assignEmpFunctionFilter || emp.function === assignEmpFunctionFilter)
                  )
                  .map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} {emp.function ? `(${emp.function})` : ''}</option>
                  ))}
              </select>
              <input
                type="date"
                className="input"
                value={assignDate}
                onChange={e => setAssignDate(e.target.value)}
                required
              />
            </form>
            {assignEmployee && assignDate && (
              <form className="emp-form" onSubmit={handleAssignTasks} autoComplete="off" style={{flexDirection:'column',alignItems:'flex-start'}}>
                <div className="task-search-container">
                  <input
                    type="text"
                    className="input"
                    placeholder="Search tasks by name or reference..."
                    value={taskSearchTerm}
                    onChange={e => setTaskSearchTerm(e.target.value)}
                    style={{ width: '100%', marginBottom: '1rem' }}
                  />
                </div>
                <div className="assign-tasks-list enhanced-task-list">
                  {tasks
                    .filter(task => 
                      !taskSearchTerm || 
                      task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                      (task.reference && task.reference.toLowerCase().includes(taskSearchTerm.toLowerCase()))
                    )
                    .map(task => {
                    const checked = selectedTasks.some(t => t.taskId === task.id);
                    return (
                      <div key={task.id} className={`assign-task-item enhanced-task-item${checked ? ' selected' : ''}`}
                        style={{ flex: '1 1 250px', minWidth: 220, maxWidth: 400 }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={e => handleTaskCheckboxChange(task.id, e.target.checked)}
                        />
                        <div className="task-info">
                          <span className="task-title">{task.title}</span>
                          {task.reference && <span className="task-reference">({task.reference})</span>}
                          <span className="task-coefficient">Coef: {task.coefficient}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selectedTasks.length > 0 && (
                  <div className="selected-tasks-container">
                    <h4>Selected Tasks:</h4>
                    <div className="selected-tasks-list">
                      {selectedTasks.map(selectedTask => {
                        const task = tasks.find(t => t.id === selectedTask.taskId);
                        return (
                          <div key={selectedTask.taskId} className="selected-task-item">
                            <span className="selected-task-title">{task?.title}</span>
                            {task?.reference && <span className="selected-task-reference">({task.reference})</span>}
                            <span className="selected-task-quantity">Qty: {selectedTask.quantity}</span>
                            <span className="selected-task-points">Points: {(task?.coefficient || 0) * selectedTask.quantity}</span>
                            <button 
                              type="button" 
                              className="btn btn-danger btn-small"
                              onClick={() => handleTaskCheckboxChange(selectedTask.taskId, false)}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button className="btn" type="submit" disabled={assignLoading || selectedTasks.length === 0}>Assign Selected Tasks</button>
              </form>
            )}
            {assignError && <div className="error">{assignError}</div>}
            <h3 style={{marginTop: '2rem'}}>Assigned Tasks for Employee/Date</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <button className="btn" onClick={() => window.print()}>Print Table (PDF)</button>
              <button className="btn" onClick={exportAssignedTasksToExcel}>Export to Excel</button>
            </div>
            <div className="print-assigned-tasks">
              {assignEmployee && (
                <div style={{ marginBottom: '1rem', fontWeight: 'bold', fontSize: '1.1rem' }}>
                  Employee: {(() => {
                    const emp = employees.find(e => String(e.id) === String(assignEmployee));
                    return emp ? `${emp.name} (${emp.function || 'No function'})` : '';
                  })()}
                </div>
              )}
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Coefficient</th>
                  </tr>
                </thead>
                <tbody>
                  {assignLoading ? (
                    <tr><td colSpan="2">Loading...</td></tr>
                  ) : assignments.length === 0 ? (
                    <tr><td colSpan="2">No assignments found.</td></tr>
                  ) : (
                    <>
                      {assignments.map(a => {
                        const task = tasks.find(t => t.id === a.taskId);
                        return (
                          <tr key={a.id}>
                            <td>
                              {task ? (
                                <div>
                                  <div>{task.title}</div>
                                  {task.reference && <div style={{fontSize: '0.85rem', color: '#666', fontStyle: 'italic'}}>({task.reference})</div>}
                                </div>
                              ) : a.taskId}
                            </td>
                            <td>{task ? task.coefficient : ''}</td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Points:</td>
                        <td style={{ fontWeight: 'bold' }}>{assignments.reduce((sum, a) => {
                          const task = tasks.find(t => t.id === a.taskId);
                          return sum + (task ? a.quantity * task.coefficient : 0);
                        }, 0)}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {isLoggedIn && page === 'view-employee-assignments' && (
          <div>
            <h2>Assignments for Employee & Date</h2>
            <form className="emp-form" onSubmit={e => { e.preventDefault(); fetchAssignmentsForEmployeeAndDate(viewEmpId, viewEmpDate); }} autoComplete="off">
              <select className="input" value={viewEmpId} onChange={e => setViewEmpId(e.target.value)} required>
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <input
                type="date"
                className="input"
                value={viewEmpDate}
                onChange={e => setViewEmpDate(e.target.value)}
                required
              />
              <button className="btn" type="submit" disabled={viewEmpLoading}>View</button>
            </form>
            {viewEmpError && <div className="error">{viewEmpError}</div>}
            {viewEmpId && viewEmpDate && !viewEmpLoading && viewEmpAssignments.length > 0 && (
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Coefficient</th>
                    <th>Quantity</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let total = 0;
                    return viewEmpAssignments.map(a => {
                      const task = tasks.find(t => t.id === a.taskId);
                      const points = task ? (a.quantity * task.coefficient) : 0;
                      total += points;
                      return (
                        <tr key={a.id}>
                          <td>
                            {task ? (
                              <div>
                                <div>{task.title}</div>
                                {task.reference && <div style={{fontSize: '0.85rem', color: '#666', fontStyle: 'italic'}}>({task.reference})</div>}
                              </div>
                            ) : a.taskId}
                          </td>
                          <td>{task ? task.coefficient : ''}</td>
                          <td>{a.quantity}</td>
                          <td>{points}</td>
                        </tr>
                      );
                    }).concat([
                      <tr key="total">
                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Points:</td>
                        <td style={{ fontWeight: 'bold' }}>{total}</td>
                      </tr>
                    ]);
                  })()}
                </tbody>
              </table>
            )}
            {viewEmpId && viewEmpDate && !viewEmpLoading && viewEmpAssignments.length === 0 && <div>No assignments found for this employee and date.</div>}
          </div>
        )}
        {isLoggedIn && page === 'view-assignments' && (
          <div>
            <h2>All Assignments for a Date</h2>
            <form className="emp-form" onSubmit={e => { e.preventDefault(); fetchAllAssignmentsForDate(viewDate); }} autoComplete="off">
              <input
                type="date"
                className="input"
                value={viewDate}
                onChange={e => setViewDate(e.target.value)}
                required
              />
              <button className="btn" type="submit" disabled={viewLoading}>View</button>
            </form>
            {viewError && <div className="error">{viewError}</div>}
            {viewDate && !viewLoading && allAssignments.length > 0 && (
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Task</th>
                    <th>Coefficient</th>
                    <th>Quantity</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(emp => {
                    const empAssignments = allAssignments.filter(a => a.employeeId === emp.id);
                    if (empAssignments.length === 0) return null;
                    let total = 0;
                    return empAssignments.map((a, i) => {
                      const task = tasks.find(t => t.id === a.taskId);
                      const points = task ? (a.quantity * task.coefficient) : 0;
                      total += points;
                      return (
                        <tr key={a.id + '-' + emp.id}>
                          <td>{emp.name}</td>
                          <td>
                            {task ? (
                              <div>
                                <div>{task.title}</div>
                                {task.reference && <div style={{fontSize: '0.85rem', color: '#666', fontStyle: 'italic'}}>({task.reference})</div>}
                              </div>
                            ) : a.taskId}
                          </td>
                          <td>{task ? task.coefficient : ''}</td>
                          <td>{a.quantity}</td>
                          <td>{points}</td>
                        </tr>
                      );
                    }).concat([
                      <tr key={emp.id + '-total'}>
                        <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Points for {emp.name}:</td>
                        <td style={{ fontWeight: 'bold' }}>{total}</td>
                      </tr>
                    ]);
                  })}
                </tbody>
              </table>
            )}
            {viewDate && !viewLoading && allAssignments.length === 0 && <div>No assignments found for this date.</div>}
          </div>
        )}
        {isLoggedIn && page === 'user-points-range' && (
          <div>
            <h2>User Points in Date Range</h2>
            <form className="emp-form" onSubmit={e => { e.preventDefault(); fetchAssignmentsForRange(rangeEmpId, rangeStart, rangeEnd); }} autoComplete="off">
              <select className="input" value={rangeEmpId} onChange={e => setRangeEmpId(e.target.value)} required>
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              <input
                type="date"
                className="input"
                value={rangeStart}
                onChange={e => setRangeStart(e.target.value)}
                required
              />
              <input
                type="date"
                className="input"
                value={rangeEnd}
                onChange={e => setRangeEnd(e.target.value)}
                required
              />
              <button className="btn" type="submit" disabled={rangeLoading}>View</button>
            </form>
            {rangeError && <div className="error">{rangeError}</div>}
            {rangeEmpId && rangeStart && rangeEnd && !rangeLoading && rangeAssignments.length > 0 && (
              <table className="emp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Task</th>
                    <th>Coefficient</th>
                    <th>Quantity</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let total = 0;
                    return rangeAssignments.map(a => {
                      const task = tasks.find(t => t.id === a.taskId);
                      const points = task ? (a.quantity * task.coefficient) : 0;
                      total += points;
                      return (
                        <tr key={a.id}>
                          <td>{a.date}</td>
                          <td>
                            {task ? (
                              <div>
                                <div>{task.title}</div>
                                {task.reference && <div style={{fontSize: '0.85rem', color: '#666', fontStyle: 'italic'}}>({task.reference})</div>}
                              </div>
                            ) : a.taskId}
                          </td>
                          <td>{task ? task.coefficient : ''}</td>
                          <td>{a.quantity}</td>
                          <td>{points}</td>
                        </tr>
                      );
                    }).concat([
                      <tr key="total">
                        <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total Points:</td>
                        <td style={{ fontWeight: 'bold' }}>{total}</td>
                      </tr>
                    ]);
                  })()}
                </tbody>
              </table>
            )}
            {rangeEmpId && rangeStart && rangeEnd && !rangeLoading && rangeAssignments.length === 0 && <div>No assignments found for this user and date range.</div>}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
